"""Review read operations."""

from django.db.models import Avg, Count, Q

from bookings.models import Booking
from reviews.models import Review


def get_reviews_for_shortlet(*, shortlet_id, include_unpublished=False):
    qs = (
        Review.objects.filter(shortlet_id=shortlet_id)
        .select_related("guest", "shortlet")
        .prefetch_related("reply", "reply__author")
    )
    if not include_unpublished:
        qs = qs.filter(is_published=True)
    return qs.order_by("-created_at")


def get_review(*, review_id):
    try:
        return Review.objects.select_related("guest", "shortlet").get(pk=review_id)
    except Review.DoesNotExist:
        return None


def get_review_for_booking(*, booking_id):
    try:
        return Review.objects.select_related("guest", "shortlet").get(
            booking_id=booking_id
        )
    except Review.DoesNotExist:
        return None


def get_rating_summary(*, shortlet_id):
    """Return aggregate rating stats for a shortlet's published reviews."""
    qs = Review.objects.filter(shortlet_id=shortlet_id, is_published=True)
    stats = qs.aggregate(
        count=Count("id"),
        rating=Avg("rating"),
        cleanliness=Avg("cleanliness"),
        accuracy=Avg("accuracy"),
        communication=Avg("communication"),
        location=Avg("location"),
        check_in_experience=Avg("check_in_experience"),
        value=Avg("value"),
    )
    return {
        "count": stats["count"] or 0,
        # Round to 2 dp for stable JSON output; treat empty as None.
        "rating": _round(stats["rating"]),
        "cleanliness": _round(stats["cleanliness"]),
        "accuracy": _round(stats["accuracy"]),
        "communication": _round(stats["communication"]),
        "location": _round(stats["location"]),
        "check_in_experience": _round(stats["check_in_experience"]),
        "value": _round(stats["value"]),
    }


def get_pending_reviews_for_guest(*, guest):
    """Completed bookings for this guest that don't have a review yet."""
    return (
        Booking.objects.filter(
            guest=guest,
            status=Booking.Status.COMPLETED,
        )
        .filter(Q(review__isnull=True))
        .select_related("shortlet", "shortlet__owner")
        .prefetch_related("shortlet__images")
        .order_by("-check_out")
    )


def _round(value):
    if value is None:
        return None
    return round(float(value), 2)
