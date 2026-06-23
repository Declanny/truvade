"""Wishlist read operations."""

from wishlists.models import RecentlyViewed, Wishlist, WishlistItem


def get_wishlists_for_user(*, user):
    return (
        Wishlist.objects.filter(owner=user)
        .prefetch_related("items", "items__shortlet", "items__shortlet__images")
        .order_by("-is_default", "-created_at")
    )


def get_wishlist(*, wishlist_id, user):
    """Return a wishlist the user owns, or None."""
    try:
        return Wishlist.objects.get(pk=wishlist_id, owner=user)
    except Wishlist.DoesNotExist:
        return None


def get_items_in_wishlist(*, wishlist):
    return (
        WishlistItem.objects.filter(wishlist=wishlist)
        .select_related("shortlet", "shortlet__owner")
        .prefetch_related("shortlet__images")
        .order_by("-added_at")
    )


def get_saved_shortlet_ids(*, user):
    """Set of shortlet IDs the user has saved to ANY of their wishlists.

    Used by the frontend to render heart icons across listing/detail pages
    without joining wishlists -> items per shortlet.
    """
    return set(
        WishlistItem.objects.filter(wishlist__owner=user).values_list(
            "shortlet_id", flat=True
        )
    )


def get_recently_viewed_for_user(*, user, limit=24):
    return (
        RecentlyViewed.objects.filter(user=user)
        .select_related("shortlet", "shortlet__owner")
        .prefetch_related("shortlet__images")
        .order_by("-viewed_at")[:limit]
    )
