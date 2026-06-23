"""Notification read operations."""

from notifications.models import Notification, NotificationPreference


def get_notifications_for_user(*, user, only_unread=False):
    qs = Notification.objects.filter(recipient=user).select_related("recipient")
    if only_unread:
        qs = qs.filter(read_at__isnull=True)
    return qs.order_by("-created_at")


def get_unread_count(*, user):
    return Notification.objects.filter(recipient=user, read_at__isnull=True).count()


def get_notification_for_user(*, user, notification_id):
    try:
        return Notification.objects.get(pk=notification_id, recipient=user)
    except Notification.DoesNotExist:
        return None


def get_preferences(*, user):
    """Return the user's preferences row, or None if it doesn't exist yet."""
    try:
        return NotificationPreference.objects.get(user=user)
    except NotificationPreference.DoesNotExist:
        return None


def get_or_create_preferences(*, user):
    """Return the user's preferences row, creating one with defaults if missing."""
    pref, _ = NotificationPreference.objects.get_or_create(user=user)
    return pref
