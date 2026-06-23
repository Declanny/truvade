import pytest

from notifications.domain.selectors import get_unread_count
from notifications.domain.services import (
    create_notification,
    mark_all_read,
    mark_read,
    update_preferences,
)
from notifications.models import Notification, NotificationPreference


@pytest.mark.django_db
class TestCreateNotification:
    def test_creates_notification_with_defaults(self, guest):
        notif = create_notification(
            recipient=guest,
            kind=Notification.Kind.GENERAL,
            title="Welcome",
        )
        assert notif.pk is not None
        assert notif.recipient_id == guest.id
        assert notif.body == ""
        assert notif.data == {}
        assert notif.read_at is None

    def test_creates_notification_with_payload(self, guest):
        notif = create_notification(
            recipient=guest,
            kind=Notification.Kind.BOOKING_CONFIRMED,
            title="Booking confirmed",
            body="Your booking is confirmed.",
            data={"booking_id": 42},
        )
        assert notif.data == {"booking_id": 42}


@pytest.mark.django_db
class TestMarkRead:
    def test_marks_unread_notification_as_read(self, guest):
        notif = create_notification(
            recipient=guest, kind=Notification.Kind.GENERAL, title="Hi"
        )
        assert notif.read_at is None

        mark_read(notification=notif)
        notif.refresh_from_db()
        assert notif.read_at is not None

    def test_mark_read_is_idempotent(self, guest):
        notif = create_notification(
            recipient=guest, kind=Notification.Kind.GENERAL, title="Hi"
        )
        mark_read(notification=notif)
        first_read_at = notif.read_at

        mark_read(notification=notif)
        notif.refresh_from_db()
        assert notif.read_at == first_read_at


@pytest.mark.django_db
class TestMarkAllRead:
    def test_marks_all_unread_notifications(self, guest, other_guest):
        for _ in range(3):
            create_notification(
                recipient=guest, kind=Notification.Kind.GENERAL, title="x"
            )
        create_notification(
            recipient=other_guest, kind=Notification.Kind.GENERAL, title="y"
        )

        updated = mark_all_read(user=guest)

        assert updated == 3
        assert get_unread_count(user=guest) == 0
        # Other user's notification is untouched
        assert get_unread_count(user=other_guest) == 1


@pytest.mark.django_db
class TestUpdatePreferences:
    def test_creates_preferences_row_on_first_update(self, guest):
        assert not NotificationPreference.objects.filter(user=guest).exists()
        pref = update_preferences(user=guest, email_marketing=True)
        assert pref.email_marketing is True
        assert NotificationPreference.objects.filter(user=guest).count() == 1

    def test_patches_only_supplied_fields(self, guest):
        pref = update_preferences(user=guest, email_marketing=True, push_enabled=False)
        # other fields retain their defaults
        assert pref.email_bookings is True
        assert pref.email_marketing is True
        assert pref.push_enabled is False

    def test_silently_ignores_unknown_fields(self, guest):
        # Defence in depth: even if a stray key reaches the service it should
        # not mutate state.
        pref = update_preferences(user=guest, is_staff=True, role="ADMIN")
        guest.refresh_from_db()
        assert guest.is_staff is False
        assert guest.role == "GUEST"
        assert pref.email_marketing is False  # default
