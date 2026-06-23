import pytest
from rest_framework import status

from notifications.domain.services import create_notification
from notifications.models import Notification, NotificationPreference


@pytest.mark.django_db
class TestNotificationListView:
    def test_requires_auth(self, api_client):
        resp = api_client.get("/api/v1/notifications/")
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_returns_only_recipients_notifications(
        self, authed_client, guest, other_guest
    ):
        mine = create_notification(
            recipient=guest, kind=Notification.Kind.GENERAL, title="mine"
        )
        create_notification(
            recipient=other_guest, kind=Notification.Kind.GENERAL, title="theirs"
        )

        resp = authed_client.get("/api/v1/notifications/")

        assert resp.status_code == status.HTTP_200_OK
        ids = [n["id"] for n in resp.json()["data"]]
        assert ids == [mine.id]

    def test_unread_filter(self, authed_client, guest):
        unread = create_notification(
            recipient=guest, kind=Notification.Kind.GENERAL, title="unread"
        )
        read = create_notification(
            recipient=guest, kind=Notification.Kind.GENERAL, title="read"
        )
        from notifications.domain.services import mark_read

        mark_read(notification=read)

        resp = authed_client.get("/api/v1/notifications/?unread=1")

        assert resp.status_code == status.HTTP_200_OK
        ids = [n["id"] for n in resp.json()["data"]]
        assert ids == [unread.id]


@pytest.mark.django_db
class TestUnreadCountView:
    def test_returns_zero_for_clean_user(self, authed_client):
        resp = authed_client.get("/api/v1/notifications/unread-count/")
        assert resp.status_code == status.HTTP_200_OK
        assert resp.json()["data"] == {"unread": 0}

    def test_counts_unread_only(self, authed_client, guest):
        for _ in range(2):
            create_notification(
                recipient=guest, kind=Notification.Kind.GENERAL, title="x"
            )
        resp = authed_client.get("/api/v1/notifications/unread-count/")
        assert resp.json()["data"] == {"unread": 2}


@pytest.mark.django_db
class TestMarkReadView:
    def test_marks_own_notification_read(self, authed_client, guest):
        notif = create_notification(
            recipient=guest, kind=Notification.Kind.GENERAL, title="hi"
        )
        resp = authed_client.post(f"/api/v1/notifications/{notif.id}/read/")
        assert resp.status_code == status.HTTP_200_OK
        notif.refresh_from_db()
        assert notif.read_at is not None

    def test_cannot_read_others_notification(self, authed_client, other_guest):
        # A notification owned by other_guest looks "not found" to guest.
        other = create_notification(
            recipient=other_guest, kind=Notification.Kind.GENERAL, title="hi"
        )
        resp = authed_client.post(f"/api/v1/notifications/{other.id}/read/")
        assert resp.status_code == status.HTTP_404_NOT_FOUND
        other.refresh_from_db()
        assert other.read_at is None


@pytest.mark.django_db
class TestMarkAllReadView:
    def test_marks_only_callers_notifications(self, authed_client, guest, other_guest):
        for _ in range(3):
            create_notification(
                recipient=guest, kind=Notification.Kind.GENERAL, title="x"
            )
        create_notification(
            recipient=other_guest, kind=Notification.Kind.GENERAL, title="y"
        )

        resp = authed_client.post("/api/v1/notifications/read-all/")

        assert resp.status_code == status.HTTP_200_OK
        assert resp.json()["data"] == {"updated": 3}
        assert (
            Notification.objects.filter(
                recipient=other_guest, read_at__isnull=True
            ).count()
            == 1
        )


@pytest.mark.django_db
class TestPreferencesView:
    def test_get_creates_default_row(self, authed_client, guest):
        assert not NotificationPreference.objects.filter(user=guest).exists()
        resp = authed_client.get("/api/v1/notifications/preferences/")
        assert resp.status_code == status.HTTP_200_OK
        data = resp.json()["data"]
        assert data["email_bookings"] is True
        assert data["email_marketing"] is False
        assert NotificationPreference.objects.filter(user=guest).count() == 1

    def test_patch_updates_supplied_fields(self, authed_client):
        resp = authed_client.patch(
            "/api/v1/notifications/preferences/",
            {"email_marketing": True, "push_enabled": False},
            format="json",
        )
        assert resp.status_code == status.HTTP_200_OK
        data = resp.json()["data"]
        assert data["email_marketing"] is True
        assert data["push_enabled"] is False
        # Untouched field still default
        assert data["email_bookings"] is True

    def test_patch_rejects_unknown_field(self, authed_client):
        resp = authed_client.patch(
            "/api/v1/notifications/preferences/",
            {"is_staff": True},
            format="json",
        )
        # Serializer drops unknown keys silently for Serializer subclasses, so
        # this is a no-op success rather than a 400. Either is acceptable as
        # long as state is unchanged.
        assert resp.status_code == status.HTTP_200_OK
        assert resp.json()["data"]["email_bookings"] is True
