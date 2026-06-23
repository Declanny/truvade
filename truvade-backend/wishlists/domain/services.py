"""Wishlist write operations."""

from django.core.exceptions import PermissionDenied, ValidationError
from django.db import IntegrityError, transaction

from wishlists.models import RecentlyViewed, Wishlist, WishlistItem


@transaction.atomic
def get_or_create_default_wishlist(*, user):
    """Return the user's default wishlist, creating one if missing."""
    try:
        return Wishlist.objects.get(owner=user, is_default=True)
    except Wishlist.DoesNotExist:
        return Wishlist.objects.create(
            owner=user, name="My favourites", is_default=True
        )


@transaction.atomic
def create_wishlist(*, user, name, is_private=True):
    """Create a non-default wishlist for the user."""
    return Wishlist.objects.create(
        owner=user,
        name=name or "Untitled",
        is_private=is_private,
        is_default=False,
    )


@transaction.atomic
def update_wishlist(*, wishlist, user, name=None, is_private=None):
    if wishlist.owner_id != user.id:
        raise PermissionDenied("You can only edit your own wishlists.")
    dirty = []
    if name is not None:
        wishlist.name = name
        dirty.append("name")
    if is_private is not None:
        wishlist.is_private = is_private
        dirty.append("is_private")
    if dirty:
        wishlist.save(update_fields=dirty + ["updated_at"])
    return wishlist


@transaction.atomic
def delete_wishlist(*, wishlist, user):
    if wishlist.owner_id != user.id:
        raise PermissionDenied("You can only delete your own wishlists.")
    if wishlist.is_default:
        raise ValidationError("The default wishlist cannot be deleted.")
    wishlist.delete()


@transaction.atomic
def add_item(*, wishlist, user, shortlet, note=""):
    if wishlist.owner_id != user.id:
        raise PermissionDenied("You can only modify your own wishlists.")
    try:
        item, created = WishlistItem.objects.get_or_create(
            wishlist=wishlist,
            shortlet=shortlet,
            defaults={"note": note},
        )
    except IntegrityError as exc:
        # Race condition fallback; get_or_create handles it but be explicit.
        raise ValidationError("Already saved.") from exc
    return item, created


@transaction.atomic
def remove_item(*, wishlist, user, shortlet):
    if wishlist.owner_id != user.id:
        raise PermissionDenied("You can only modify your own wishlists.")
    deleted, _ = WishlistItem.objects.filter(
        wishlist=wishlist, shortlet=shortlet
    ).delete()
    return deleted > 0


@transaction.atomic
def toggle_save(*, user, shortlet):
    """Add to or remove from the user's default wishlist.

    Returns (saved: bool) — True if the shortlet is now saved, False if it
    was removed.
    """
    default = get_or_create_default_wishlist(user=user)
    existing = WishlistItem.objects.filter(wishlist=default, shortlet=shortlet).first()
    if existing:
        existing.delete()
        return False
    WishlistItem.objects.create(wishlist=default, shortlet=shortlet)
    return True


@transaction.atomic
def record_view(*, user, shortlet):
    """Record that the user viewed a shortlet. Idempotent: bumps viewed_at."""
    view, _ = RecentlyViewed.objects.update_or_create(user=user, shortlet=shortlet)
    return view
