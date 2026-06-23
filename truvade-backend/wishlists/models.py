from django.conf import settings
from django.db import models


class Wishlist(models.Model):
    """Named collection of saved shortlets for a guest."""

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="wishlists",
    )
    name = models.CharField(max_length=80, default="My favourites")
    is_default = models.BooleanField(default=False)
    is_private = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["owner"],
                condition=models.Q(is_default=True),
                name="wishlist_one_default_per_owner",
            ),
        ]

    def __str__(self):
        return f"{self.name} ({self.owner.email})"


class WishlistItem(models.Model):
    wishlist = models.ForeignKey(
        Wishlist,
        on_delete=models.CASCADE,
        related_name="items",
    )
    shortlet = models.ForeignKey(
        "shortlet.Shortlet",
        on_delete=models.CASCADE,
        related_name="wishlist_items",
    )
    note = models.CharField(max_length=200, blank=True, default="")
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-added_at"]
        unique_together = [("wishlist", "shortlet")]

    def __str__(self):
        return f"{self.shortlet.title} in {self.wishlist.name}"


class RecentlyViewed(models.Model):
    """Tracks shortlets a guest recently viewed, for the 'Recently viewed' tab."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="recently_viewed",
    )
    shortlet = models.ForeignKey(
        "shortlet.Shortlet",
        on_delete=models.CASCADE,
        related_name="+",
    )
    viewed_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-viewed_at"]
        unique_together = [("user", "shortlet")]
        indexes = [
            models.Index(
                fields=["user", "-viewed_at"], name="recently_viewed_user_idx"
            ),
        ]

    def __str__(self):
        return f"{self.user.email} viewed {self.shortlet.title}"
