from django.urls import path

from .views import (
    CreateReplyView,
    CreateReviewView,
    PendingReviewsView,
    ShortletRatingSummaryView,
    ShortletReviewListView,
    UpdateReviewView,
)

urlpatterns = [
    path(
        "shortlets/<int:shortlet_id>/reviews/",
        ShortletReviewListView.as_view(),
        name="shortlet-reviews",
    ),
    path(
        "shortlets/<int:shortlet_id>/reviews/summary/",
        ShortletRatingSummaryView.as_view(),
        name="shortlet-rating-summary",
    ),
    path("reviews/pending/", PendingReviewsView.as_view(), name="pending-reviews"),
    path(
        "bookings/<int:booking_id>/review/",
        CreateReviewView.as_view(),
        name="create-review",
    ),
    path(
        "reviews/<int:review_id>/",
        UpdateReviewView.as_view(),
        name="update-review",
    ),
    path(
        "reviews/<int:review_id>/reply/",
        CreateReplyView.as_view(),
        name="create-reply",
    ),
]
