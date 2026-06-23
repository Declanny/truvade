import pytest
from rest_framework import status

from messaging.domain.services import (
    get_or_create_direct_thread,
    send_message,
)


@pytest.mark.django_db
class TestThreadListCreateView:
    def test_requires_auth(self, api_client):
        resp = api_client.get("/api/v1/threads/")
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_lists_only_my_threads(self, api_client, guest, owner, stranger):
        get_or_create_direct_thread(requester=guest, other_user=owner)
        get_or_create_direct_thread(requester=stranger, other_user=owner)

        api_client.force_authenticate(user=guest)
        resp = api_client.get("/api/v1/threads/")
        assert resp.status_code == status.HTTP_200_OK
        data = resp.json()["data"]
        assert len(data) == 1

    def test_create_with_user_id_is_idempotent(self, api_client, guest, owner):
        api_client.force_authenticate(user=guest)
        r1 = api_client.post(
            "/api/v1/threads/",
            {"user_id": owner.id, "initial_message": "Hello"},
            format="json",
        )
        assert r1.status_code == status.HTTP_201_CREATED
        thread_id = r1.json()["data"]["id"]

        r2 = api_client.post(
            "/api/v1/threads/",
            {"user_id": owner.id},
            format="json",
        )
        assert r2.json()["data"]["id"] == thread_id

    def test_create_for_booking_infers_other_party(
        self, api_client, guest, owner, booking
    ):
        api_client.force_authenticate(user=guest)
        resp = api_client.post(
            "/api/v1/threads/",
            {"booking_id": booking.id},
            format="json",
        )
        assert resp.status_code == status.HTTP_201_CREATED
        participant_ids = sorted(p["user"] for p in resp.json()["data"]["participants"])
        assert participant_ids == sorted([guest.id, owner.id])

    def test_create_for_booking_rejects_stranger(self, api_client, stranger, booking):
        api_client.force_authenticate(user=stranger)
        resp = api_client.post(
            "/api/v1/threads/",
            {"booking_id": booking.id},
            format="json",
        )
        assert resp.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestThreadDetailView:
    def test_non_participant_404(self, api_client, guest, owner, stranger):
        thread, _ = get_or_create_direct_thread(requester=guest, other_user=owner)
        api_client.force_authenticate(user=stranger)
        resp = api_client.get(f"/api/v1/threads/{thread.id}/")
        assert resp.status_code == status.HTTP_404_NOT_FOUND

    def test_returns_messages(self, api_client, guest, owner):
        thread, _ = get_or_create_direct_thread(requester=guest, other_user=owner)
        send_message(thread=thread, sender=guest, body="Hi")
        send_message(thread=thread, sender=owner, body="Hey")
        api_client.force_authenticate(user=guest)
        resp = api_client.get(f"/api/v1/threads/{thread.id}/")
        assert resp.status_code == status.HTTP_200_OK
        bodies = [m["body"] for m in resp.json()["data"]["messages"]]
        assert bodies == ["Hi", "Hey"]


@pytest.mark.django_db
class TestSendMessageView:
    def test_sends_message(self, api_client, guest, owner):
        thread, _ = get_or_create_direct_thread(requester=guest, other_user=owner)
        api_client.force_authenticate(user=guest)
        resp = api_client.post(
            f"/api/v1/threads/{thread.id}/messages/",
            {"body": "Hello!"},
            format="json",
        )
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.json()["data"]["body"] == "Hello!"

    def test_empty_body_rejected(self, api_client, guest, owner):
        thread, _ = get_or_create_direct_thread(requester=guest, other_user=owner)
        api_client.force_authenticate(user=guest)
        resp = api_client.post(
            f"/api/v1/threads/{thread.id}/messages/",
            {"body": "   "},
            format="json",
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestMarkReadView:
    def test_marks_thread_read(self, api_client, guest, owner):
        thread, _ = get_or_create_direct_thread(requester=guest, other_user=owner)
        send_message(thread=thread, sender=owner, body="hi")
        api_client.force_authenticate(user=guest)
        resp = api_client.post(f"/api/v1/threads/{thread.id}/read/")
        assert resp.status_code == status.HTTP_200_OK
        # Unread count for guest should now be 0
        c = api_client.get("/api/v1/threads/unread-count/")
        assert c.json()["data"] == {"unread": 0}


@pytest.mark.django_db
class TestUnreadCountView:
    def test_counts_threads_with_unread(self, api_client, guest, owner):
        thread, _ = get_or_create_direct_thread(requester=guest, other_user=owner)
        send_message(thread=thread, sender=owner, body="hi")
        api_client.force_authenticate(user=guest)
        resp = api_client.get("/api/v1/threads/unread-count/")
        assert resp.status_code == status.HTTP_200_OK
        assert resp.json()["data"] == {"unread": 1}
