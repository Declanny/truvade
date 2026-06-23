from django.core.exceptions import PermissionDenied, ValidationError
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.exceptions import NotFound, PermissionDenied as DRFPermissionDenied
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView

from bookings.models import Booking
from core.utils.responses import success_response
from reviews.domain.selectors import (
    get_pending_reviews_for_guest,
    get_rating_summary,
    get_review,
    get_reviews_for_shortlet,
)
from reviews.domain.services import (
    create_reply,
    create_review,
    update_review,
)

from .serializers import (
    CreateReplySerializer,
    CreateReviewSerializer,
    RatingSummarySerializer,
    ReviewReadSerializer,
    UpdateReviewSerializer,
)


@extend_schema(tags=["Reviews"], summary="List reviews for a shortlet")
class ShortletReviewListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, shortlet_id):
        reviews = get_reviews_for_shortlet(shortlet_id=shortlet_id)
        return success_response(
            "Reviews retrieved.",
            ReviewReadSerializer(reviews, many=True).data,
        )


@extend_schema(tags=["Reviews"], summary="Rating summary for a shortlet")
class ShortletRatingSummaryView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, shortlet_id):
        summary = get_rating_summary(shortlet_id=shortlet_id)
        return success_response(
            "Rating summary retrieved.",
            RatingSummarySerializer(summary).data,
        )


@extend_schema(
    tags=["Reviews"],
    summary="Bookings the caller can still review",
)
class PendingReviewsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        bookings = get_pending_reviews_for_guest(guest=request.user)
        # Lightweight payload — just enough for the "leave a review" prompt.
        data = [
            {
                "booking_id": b.id,
                "shortlet_id": b.shortlet_id,
                "shortlet_title": b.shortlet.title,
                "check_out": b.check_out.isoformat(),
            }
            for b in bookings
        ]
        return success_response("Pending reviews retrieved.", data)


@extend_schema(
    tags=["Reviews"],
    request=CreateReviewSerializer,
    summary="Create a review for a completed booking",
)
class CreateReviewView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, booking_id):
        try:
            booking = Booking.objects.select_related("shortlet").get(pk=booking_id)
        except Booking.DoesNotExist:
            raise NotFound("Booking not found.")

        serializer = CreateReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            review = create_review(
                booking=booking, guest=request.user, **serializer.validated_data
            )
        except PermissionDenied as exc:
            raise DRFPermissionDenied(str(exc))
        except ValidationError as exc:
            raise DRFValidationError(_first_message(exc))

        return success_response(
            "Review submitted.",
            ReviewReadSerializer(review).data,
            status_code=status.HTTP_201_CREATED,
        )


@extend_schema(
    tags=["Reviews"],
    request=UpdateReviewSerializer,
    summary="Edit my review",
)
class UpdateReviewView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, review_id):
        review = get_review(review_id=review_id)
        if review is None:
            raise NotFound("Review not found.")

        serializer = UpdateReviewSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        try:
            review = update_review(
                review=review, author=request.user, **serializer.validated_data
            )
        except PermissionDenied as exc:
            raise DRFPermissionDenied(str(exc))

        return success_response(
            "Review updated.",
            ReviewReadSerializer(review).data,
        )


@extend_schema(
    tags=["Reviews"],
    request=CreateReplySerializer,
    summary="Reply to a review as host/owner",
)
class CreateReplyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, review_id):
        review = get_review(review_id=review_id)
        if review is None:
            raise NotFound("Review not found.")

        serializer = CreateReplySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            create_reply(
                review=review,
                author=request.user,
                body=serializer.validated_data["body"],
            )
        except PermissionDenied as exc:
            raise DRFPermissionDenied(str(exc))
        except ValidationError as exc:
            raise DRFValidationError(_first_message(exc))

        review.refresh_from_db()
        return success_response(
            "Reply posted.",
            ReviewReadSerializer(review).data,
            status_code=status.HTTP_201_CREATED,
        )


def _first_message(exc):
    """Return a clean string from a Django ValidationError for DRF surfacing."""
    if hasattr(exc, "messages") and exc.messages:
        return exc.messages[0]
    return str(exc)
