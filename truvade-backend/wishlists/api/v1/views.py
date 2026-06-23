from django.core.exceptions import PermissionDenied, ValidationError
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.exceptions import NotFound, PermissionDenied as DRFPermissionDenied
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from core.utils.responses import success_response
from shortlet.models import Shortlet
from wishlists.domain.selectors import (
    get_items_in_wishlist,
    get_recently_viewed_for_user,
    get_saved_shortlet_ids,
    get_wishlist,
    get_wishlists_for_user,
)
from wishlists.domain.services import (
    add_item,
    create_wishlist,
    delete_wishlist,
    get_or_create_default_wishlist,
    record_view,
    remove_item,
    toggle_save,
    update_wishlist,
)

from .serializers import (
    AddItemSerializer,
    CreateWishlistSerializer,
    RecentlyViewedSerializer,
    ToggleSaveSerializer,
    UpdateWishlistSerializer,
    WishlistItemSerializer,
    WishlistSerializer,
)


def _get_shortlet_or_404(shortlet_id):
    try:
        return Shortlet.objects.get(pk=shortlet_id)
    except Shortlet.DoesNotExist:
        raise NotFound("Shortlet not found.")


@extend_schema(tags=["Wishlists"], summary="List my wishlists")
class WishlistListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Ensure the user always has a default wishlist row to look at.
        get_or_create_default_wishlist(user=request.user)
        wishlists = get_wishlists_for_user(user=request.user)
        return success_response(
            "Wishlists retrieved.",
            WishlistSerializer(wishlists, many=True).data,
        )

    @extend_schema(request=CreateWishlistSerializer, summary="Create a wishlist")
    def post(self, request):
        serializer = CreateWishlistSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        wishlist = create_wishlist(user=request.user, **serializer.validated_data)
        return success_response(
            "Wishlist created.",
            WishlistSerializer(wishlist).data,
            status_code=status.HTTP_201_CREATED,
        )


@extend_schema(tags=["Wishlists"])
class WishlistDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_owned_or_404(self, request, wishlist_id):
        wishlist = get_wishlist(wishlist_id=wishlist_id, user=request.user)
        if wishlist is None:
            raise NotFound("Wishlist not found.")
        return wishlist

    @extend_schema(summary="Get a wishlist with its items")
    def get(self, request, wishlist_id):
        wishlist = self._get_owned_or_404(request, wishlist_id)
        return success_response(
            "Wishlist retrieved.",
            WishlistSerializer(wishlist).data,
        )

    @extend_schema(request=UpdateWishlistSerializer, summary="Rename or toggle privacy")
    def patch(self, request, wishlist_id):
        wishlist = self._get_owned_or_404(request, wishlist_id)
        serializer = UpdateWishlistSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        wishlist = update_wishlist(
            wishlist=wishlist, user=request.user, **serializer.validated_data
        )
        return success_response("Wishlist updated.", WishlistSerializer(wishlist).data)

    @extend_schema(summary="Delete a wishlist")
    def delete(self, request, wishlist_id):
        wishlist = self._get_owned_or_404(request, wishlist_id)
        try:
            delete_wishlist(wishlist=wishlist, user=request.user)
        except ValidationError as exc:
            raise DRFValidationError(_first_message(exc))
        return success_response("Wishlist deleted.", None)


@extend_schema(tags=["Wishlists"], summary="Items in a wishlist")
class WishlistItemListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, wishlist_id):
        wishlist = get_wishlist(wishlist_id=wishlist_id, user=request.user)
        if wishlist is None:
            raise NotFound("Wishlist not found.")
        items = get_items_in_wishlist(wishlist=wishlist)
        return success_response(
            "Items retrieved.",
            WishlistItemSerializer(items, many=True).data,
        )

    @extend_schema(request=AddItemSerializer, summary="Add a shortlet to a wishlist")
    def post(self, request, wishlist_id):
        wishlist = get_wishlist(wishlist_id=wishlist_id, user=request.user)
        if wishlist is None:
            raise NotFound("Wishlist not found.")
        serializer = AddItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        shortlet = _get_shortlet_or_404(serializer.validated_data["shortlet_id"])
        try:
            item, created = add_item(
                wishlist=wishlist,
                user=request.user,
                shortlet=shortlet,
                note=serializer.validated_data.get("note", ""),
            )
        except PermissionDenied as exc:
            raise DRFPermissionDenied(str(exc))
        return success_response(
            "Item added." if created else "Item already in wishlist.",
            WishlistItemSerializer(item).data,
            status_code=(status.HTTP_201_CREATED if created else status.HTTP_200_OK),
        )


@extend_schema(tags=["Wishlists"], summary="Remove a shortlet from a wishlist")
class WishlistItemDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, wishlist_id, shortlet_id):
        wishlist = get_wishlist(wishlist_id=wishlist_id, user=request.user)
        if wishlist is None:
            raise NotFound("Wishlist not found.")
        shortlet = _get_shortlet_or_404(shortlet_id)
        removed = remove_item(wishlist=wishlist, user=request.user, shortlet=shortlet)
        if not removed:
            raise NotFound("Shortlet is not in this wishlist.")
        return success_response("Item removed.", None)


@extend_schema(
    tags=["Wishlists"],
    request=ToggleSaveSerializer,
    summary="Toggle a shortlet on the default wishlist",
)
class ToggleSaveView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ToggleSaveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        shortlet = _get_shortlet_or_404(serializer.validated_data["shortlet_id"])
        saved = toggle_save(user=request.user, shortlet=shortlet)
        return success_response(
            "Saved." if saved else "Removed.",
            {"saved": saved, "shortlet_id": shortlet.id},
        )


@extend_schema(
    tags=["Wishlists"],
    summary="Shortlet IDs the caller has saved (any wishlist)",
)
class SavedShortletIdsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        ids = get_saved_shortlet_ids(user=request.user)
        return success_response("Saved IDs retrieved.", {"shortlet_ids": sorted(ids)})


@extend_schema(tags=["Wishlists"], summary="Recently viewed shortlets")
class RecentlyViewedView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        items = get_recently_viewed_for_user(user=request.user)
        return success_response(
            "Recently viewed retrieved.",
            RecentlyViewedSerializer(items, many=True).data,
        )

    @extend_schema(request=ToggleSaveSerializer, summary="Record a shortlet view")
    def post(self, request):
        serializer = ToggleSaveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        shortlet = _get_shortlet_or_404(serializer.validated_data["shortlet_id"])
        record_view(user=request.user, shortlet=shortlet)
        return success_response(
            "View recorded.", None, status_code=status.HTTP_204_NO_CONTENT
        )


def _first_message(exc):
    if hasattr(exc, "messages") and exc.messages:
        return exc.messages[0]
    return str(exc)
