"""Notification write operations."""

from django.db import transaction
from django.utils import timezone

from notifications.models import Notification, NotificationPreference


@transaction.atomic
def create_notification(*, recipient, kind, title, body="", data=None):
    """Create a notification for a user. Returns the Notification instance.

    Callers (signals, services) should use this rather than instantiating the
    model directly so we have a single place to add throttling, fan-out, or
    push-channel dispatch later.
    """
    return Notification.objects.create(
        recipient=recipient,
        kind=kind,
        title=title,
        body=body,
        data=data or {},
    )


@transaction.atomic
def mark_read(*, notification):
    """Mark a single notification as read. Idempotent."""
    if notification.read_at is None:
        notification.read_at = timezone.now()
        notification.save(update_fields=["read_at"])
    return notification


@transaction.atomic
def mark_all_read(*, user):
    """Mark every unread notification for a user as read. Returns count updated."""
    return Notification.objects.filter(recipient=user, read_at__isnull=True).update(
        read_at=timezone.now()
    )


# Field allowlist for partial preference updates. Anything outside this set is
# silently ignored at the service boundary so a stray client field can't
# mutate state it shouldn't.
PREFERENCE_FIELDS = (
    "email_bookings",
    "email_messages",
    "email_reviews",
    "email_payouts",
    "email_marketing",
    "sms_booking_confirmations",
    "sms_security",
    "push_enabled",
    "push_bookings",
    "push_messages",
)


@transaction.atomic
def update_preferences(*, user, **changes):
    """Patch a user's notification preferences. Creates the row if missing."""
    pref, _ = NotificationPreference.objects.get_or_create(user=user)
    dirty = []
    for field in PREFERENCE_FIELDS:
        if field in changes:
            setattr(pref, field, bool(changes[field]))
            dirty.append(field)
    if dirty:
        pref.save(update_fields=dirty + ["updated_at"])
    return pref
