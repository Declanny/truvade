"""Review write operations."""

from django.core.exceptions import PermissionDenied, ValidationError
from django.db import IntegrityError, transaction

from bookings.models import Booking
from reviews.models import Review, ReviewReply

SUB_RATING_FIELDS = (
    "cleanliness",
    "accuracy",
    "communication",
    "location",
    "check_in_experience",
    "value",
)


@transaction.atomic
def create_review(*, booking, guest, rating, comment="", **sub_ratings):
    """Create a Review for a completed booking.

    Guards:
    - The caller must be the booking's guest.
    - The booking must be COMPLETED.
    - A booking can have at most one review (OneToOneField enforces this at
      the DB level; we surface a clean ValidationError here).
    """
    if booking.guest_id != guest.id:
        raise PermissionDenied("You can only review your own bookings.")
    if booking.status != Booking.Status.COMPLETED:
        raise ValidationError("Only completed bookings can be reviewed.")

    fields = {key: sub_ratings[key] for key in SUB_RATING_FIELDS if key in sub_ratings}

    try:
        return Review.objects.create(
            booking=booking,
            shortlet=booking.shortlet,
            guest=guest,
            rating=rating,
            comment=comment,
            **fields,
        )
    except IntegrityError as exc:
        raise ValidationError("This booking has already been reviewed.") from exc


@transaction.atomic
def update_review(*, review, author, **changes):
    """Patch fields on a review. Only the original guest may edit."""
    if review.guest_id != author.id:
        raise PermissionDenied("You can only edit your own review.")

    allowed = {"rating", "comment", *SUB_RATING_FIELDS}
    dirty = []
    for field, value in changes.items():
        if field in allowed:
            setattr(review, field, value)
            dirty.append(field)
    if dirty:
        review.save(update_fields=dirty + ["updated_at"])
    return review


@transaction.atomic
def create_reply(*, review, author, body):
    """Create the host's reply to a review.

    Guards:
    - Author must be the shortlet's owner or an assigned host/cohost.
    - One reply per review (OneToOneField enforces; we surface ValidationError).
    """
    if not _can_reply_to_review(review=review, user=author):
        raise PermissionDenied("Only the shortlet owner or assigned host can reply.")

    try:
        return ReviewReply.objects.create(review=review, author=author, body=body)
    except IntegrityError as exc:
        raise ValidationError("This review already has a reply.") from exc


def _can_reply_to_review(*, review, user):
    if review.shortlet.owner_id == user.id:
        return True
    return review.shortlet.host_assignments.filter(host_id=user.id).exists()
