import pytest
from rest_framework import status

from reviews.domain.services import create_review


@pytest.mark.django_db
class TestShortletReviewListView:
    def test_public_endpoint_lists_reviews(
        self, api_client, guest, shortlet, completed_booking
    ):
        review = create_review(booking=completed_booking, guest=guest, rating=5)
        resp = api_client.get(f"/api/v1/shortlets/{shortlet.id}/reviews/")
        assert resp.status_code == status.HTTP_200_OK
        ids = [r["id"] for r in resp.json()["data"]]
        assert ids == [review.id]


@pytest.mark.django_db
class TestRatingSummaryView:
    def test_returns_zero_count_for_new_shortlet(self, api_client, shortlet):
        resp = api_client.get(
            f"/api/v1/shortlets/{shortlet.id}/reviews/summary/"
        )
        assert resp.status_code == status.HTTP_200_OK
        assert resp.json()["data"]["count"] == 0


@pytest.mark.django_db
class TestCreateReviewView:
    def test_requires_auth(self, api_client, completed_booking):
        resp = api_client.post(
            f"/api/v1/bookings/{completed_booking.id}/review/",
            {"rating": 5},
            format="json",
        )
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_guest_creates_review_for_their_booking(
        self, api_client, guest, completed_booking
    ):
        api_client.force_authenticate(user=guest)
        resp = api_client.post(
            f"/api/v1/bookings/{completed_booking.id}/review/",
            {"rating": 5, "comment": "Great", "cleanliness": 5},
            format="json",
        )
        assert resp.status_code == status.HTTP_201_CREATED
        body = resp.json()["data"]
        assert body["rating"] == 5
        assert body["cleanliness"] == 5

    def test_other_guest_forbidden(
        self, api_client, other_guest, completed_booking
    ):
        api_client.force_authenticate(user=other_guest)
        resp = api_client.post(
            f"/api/v1/bookings/{completed_booking.id}/review/",
            {"rating": 5},
            format="json",
        )
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_non_completed_booking_rejected(
        self, api_client, guest, confirmed_booking
    ):
        api_client.force_authenticate(user=guest)
        resp = api_client.post(
            f"/api/v1/bookings/{confirmed_booking.id}/review/",
            {"rating": 5},
            format="json",
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_unknown_booking_404(self, api_client, guest):
        api_client.force_authenticate(user=guest)
        resp = api_client.post(
            "/api/v1/bookings/999999/review/", {"rating": 5}, format="json"
        )
        assert resp.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
class TestPendingReviewsView:
    def test_lists_completed_bookings_without_review(
        self, api_client, guest, completed_booking, confirmed_booking
    ):
        api_client.force_authenticate(user=guest)
        resp = api_client.get("/api/v1/reviews/pending/")
        assert resp.status_code == status.HTTP_200_OK
        ids = [b["booking_id"] for b in resp.json()["data"]]
        assert completed_booking.id in ids
        assert confirmed_booking.id not in ids


@pytest.mark.django_db
class TestCreateReplyView:
    def test_owner_can_reply(
        self, api_client, guest, owner, completed_booking
    ):
        review = create_review(booking=completed_booking, guest=guest, rating=4)
        api_client.force_authenticate(user=owner)
        resp = api_client.post(
            f"/api/v1/reviews/{review.id}/reply/",
            {"body": "Thanks for staying!"},
            format="json",
        )
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.json()["data"]["reply"]["body"] == "Thanks for staying!"

    def test_stranger_forbidden(
        self, api_client, guest, stranger, completed_booking
    ):
        review = create_review(booking=completed_booking, guest=guest, rating=4)
        api_client.force_authenticate(user=stranger)
        resp = api_client.post(
            f"/api/v1/reviews/{review.id}/reply/",
            {"body": "hi"},
            format="json",
        )
        assert resp.status_code == status.HTTP_403_FORBIDDEN
