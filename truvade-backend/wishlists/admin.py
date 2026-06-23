from django.contrib import admin

from wishlists.models import RecentlyViewed, Wishlist, WishlistItem


@admin.register(Wishlist)
class WishlistAdmin(admin.ModelAdmin):
    list_display = ["id", "owner", "name", "is_default", "is_private", "created_at"]
    list_filter = ["is_default", "is_private", "created_at"]
    search_fields = ["owner__email", "name"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(WishlistItem)
class WishlistItemAdmin(admin.ModelAdmin):
    list_display = ["id", "wishlist", "shortlet", "added_at"]
    search_fields = ["wishlist__name", "shortlet__title"]
    readonly_fields = ["added_at"]


@admin.register(RecentlyViewed)
class RecentlyViewedAdmin(admin.ModelAdmin):
    list_display = ["id", "user", "shortlet", "viewed_at"]
    search_fields = ["user__email", "shortlet__title"]
    readonly_fields = ["viewed_at"]
