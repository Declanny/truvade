from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AmenityListView,
    HostShortletListView,
    PublicShortletDetailView,
    PublicShortletListView,
    ShortletViewSet,
)

router = DefaultRouter()
router.register(r"shortlets", ShortletViewSet, basename="shortlet")

urlpatterns = [
    # Public browsing — no auth required
    path("properties/", PublicShortletListView.as_view(), name="public-shortlet-list"),
    path(
        "properties/<int:pk>/",
        PublicShortletDetailView.as_view(),
        name="public-shortlet-detail",
    ),
    # Owner-only shortlet management
    path("", include(router.urls)),
    # Host-facing
    path("my-shortlets/", HostShortletListView.as_view(), name="host-shortlet-list"),
    # Reference data
    path("amenities/", AmenityListView.as_view(), name="amenity-list"),
]
