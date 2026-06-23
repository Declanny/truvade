from django.urls import path

from .views import (
    RecentlyViewedView,
    SavedShortletIdsView,
    ToggleSaveView,
    WishlistDetailView,
    WishlistItemDeleteView,
    WishlistItemListView,
    WishlistListCreateView,
)

urlpatterns = [
    path("wishlists/", WishlistListCreateView.as_view(), name="wishlist-list-create"),
    path(
        "wishlists/saved-ids/",
        SavedShortletIdsView.as_view(),
        name="wishlist-saved-ids",
    ),
    path("wishlists/toggle/", ToggleSaveView.as_view(), name="wishlist-toggle"),
    path(
        "wishlists/<int:wishlist_id>/",
        WishlistDetailView.as_view(),
        name="wishlist-detail",
    ),
    path(
        "wishlists/<int:wishlist_id>/items/",
        WishlistItemListView.as_view(),
        name="wishlist-items",
    ),
    path(
        "wishlists/<int:wishlist_id>/items/<int:shortlet_id>/",
        WishlistItemDeleteView.as_view(),
        name="wishlist-item-delete",
    ),
    path(
        "recently-viewed/",
        RecentlyViewedView.as_view(),
        name="recently-viewed",
    ),
]
