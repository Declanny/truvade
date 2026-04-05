import datetime

import pytest
from django.urls import reverse

from bookings.models import Booking


# --- Create Booking ---


@pytest.mark.django_db
class TestCreateBookingView:
    url = reverse("booking-create")

    def test_unauthenticated_returns_401(self, api_client, booking_data):
        response = api_client.post(self.url, booking_data)
        assert response.status_code == 401

    def test_owner_cannot_create_booking(self, api_client, owner, booking_data):
        api_client.force_authenticate(user=owner)
        response = api_client.post(self.url, booking_data)
        assert response.status_code == 403

    def test_host_cannot_create_booking(self, api_client, host, booking_data):
        api_client.force_authenticate(user=host)
        response = api_client.post(self.url, booking_data)
        assert response.status_code == 403

    def test_guest_creates_booking(self, api_client, guest, booking_data):
        api_client.force_authenticate(user=guest)
        response = api_client.post(self.url, booking_data)
        assert response.status_code == 201
        assert response.data["data"]["status"] == "PENDING"
        assert response.data["data"]["number_of_guests"] == 4

    def test_returns_pricing_details(self, api_client, guest, booking_data):
        api_client.force_authenticate(user=guest)
        response = api_client.post(self.url, booking_data)
        assert response.status_code == 201
        data = response.data["data"]
        assert "total_price" in data
        assert "platform_fee" in data
        assert "subtotal" in data
        assert "base_price_per_night" in data

    def test_invalid_shortlet_returns_400(self, api_client, guest):
        api_client.force_authenticate(user=guest)
        data = {
            "shortlet_id": 99999,
            "check_in": (
                datetime.date.today() + datetime.timedelta(days=10)
            ).isoformat(),
            "check_out": (
                datetime.date.today() + datetime.timedelta(days=14)
            ).isoformat(),
            "number_of_guests": 2,
        }
        response = api_client.post(self.url, data)
        assert response.status_code == 400

    def test_validation_error_returns_400(self, api_client, guest, active_shortlet):
        api_client.force_authenticate(user=guest)
        data = {
            "shortlet_id": active_shortlet.pk,
            "check_in": (
                datetime.date.today() + datetime.timedelta(days=10)
            ).isoformat(),
            "check_out": (
                datetime.date.today() + datetime.timedelta(days=11)
            ).isoformat(),
            "number_of_guests": 2,
        }
        # min_nights=2 but only 1 night
        response = api_client.post(self.url, data)
        assert response.status_code == 400


# --- Guest Booking List ---


@pytest.mark.django_db
class TestGuestBookingListView:
    url = reverse("booking-list-guest")

    def test_unauthenticated_returns_401(self, api_client):
        response = api_client.get(self.url)
        assert response.status_code == 401

    def test_guest_sees_own_bookings(self, api_client, guest, pending_booking):
        api_client.force_authenticate(user=guest)
        response = api_client.get(self.url)
        assert response.status_code == 200
        assert len(response.data["data"]) == 1

    def test_other_guest_sees_nothing(self, api_client, other_guest, pending_booking):
        api_client.force_authenticate(user=other_guest)
        response = api_client.get(self.url)
        assert response.status_code == 200
        assert len(response.data["data"]) == 0


# --- Booking Detail ---


@pytest.mark.django_db
class TestBookingDetailView:
    def test_guest_sees_own_booking(self, api_client, guest, pending_booking):
        url = reverse("booking-detail", args=[pending_booking.pk])
        api_client.force_authenticate(user=guest)
        response = api_client.get(url)
        assert response.status_code == 200

    def test_owner_sees_booking(self, api_client, verified_owner, pending_booking):
        url = reverse("booking-detail", args=[pending_booking.pk])
        api_client.force_authenticate(user=verified_owner)
        response = api_client.get(url)
        assert response.status_code == 200

    def test_host_sees_booking(self, api_client, host, pending_booking):
        url = reverse("booking-detail", args=[pending_booking.pk])
        api_client.force_authenticate(user=host)
        response = api_client.get(url)
        assert response.status_code == 200

    def test_other_guest_gets_403(self, api_client, other_guest, pending_booking):
        url = reverse("booking-detail", args=[pending_booking.pk])
        api_client.force_authenticate(user=other_guest)
        response = api_client.get(url)
        assert response.status_code == 403

    def test_nonexistent_booking_returns_404(self, api_client, guest):
        url = reverse("booking-detail", args=[99999])
        api_client.force_authenticate(user=guest)
        response = api_client.get(url)
        assert response.status_code == 404


# --- Cancel Booking ---


@pytest.mark.django_db
class TestCancelBookingView:
    def test_guest_cancels_own_booking(self, api_client, guest, pending_booking):
        url = reverse("booking-cancel", args=[pending_booking.pk])
        api_client.force_authenticate(user=guest)
        response = api_client.post(url, {"reason": "Changed plans"})
        assert response.status_code == 200
        pending_booking.refresh_from_db()
        assert pending_booking.status == Booking.Status.CANCELLED

    def test_other_guest_cannot_cancel(self, api_client, other_guest, pending_booking):
        url = reverse("booking-cancel", args=[pending_booking.pk])
        api_client.force_authenticate(user=other_guest)
        response = api_client.post(url)
        assert response.status_code == 403

    def test_owner_cannot_cancel(self, api_client, verified_owner, pending_booking):
        url = reverse("booking-cancel", args=[pending_booking.pk])
        api_client.force_authenticate(user=verified_owner)
        response = api_client.post(url)
        assert response.status_code == 403


# --- Confirm Booking ---


@pytest.mark.django_db
class TestConfirmBookingView:
    def test_owner_confirms_booking(self, api_client, verified_owner, pending_booking):
        url = reverse("booking-confirm", args=[pending_booking.pk])
        api_client.force_authenticate(user=verified_owner)
        response = api_client.post(url)
        assert response.status_code == 200
        pending_booking.refresh_from_db()
        assert pending_booking.status == Booking.Status.CONFIRMED

    def test_host_confirms_booking(self, api_client, host, pending_booking):
        url = reverse("booking-confirm", args=[pending_booking.pk])
        api_client.force_authenticate(user=host)
        response = api_client.post(url)
        assert response.status_code == 200

    def test_guest_cannot_confirm(self, api_client, guest, pending_booking):
        url = reverse("booking-confirm", args=[pending_booking.pk])
        api_client.force_authenticate(user=guest)
        response = api_client.post(url)
        assert response.status_code == 403


# --- Complete Booking ---


@pytest.mark.django_db
class TestCompleteBookingView:
    def test_owner_completes_booking(
        self, api_client, verified_owner, confirmed_booking
    ):
        url = reverse("booking-complete", args=[confirmed_booking.pk])
        api_client.force_authenticate(user=verified_owner)
        response = api_client.post(url)
        assert response.status_code == 200
        confirmed_booking.refresh_from_db()
        assert confirmed_booking.status == Booking.Status.COMPLETED

    def test_guest_cannot_complete(self, api_client, guest, confirmed_booking):
        url = reverse("booking-complete", args=[confirmed_booking.pk])
        api_client.force_authenticate(user=guest)
        response = api_client.post(url)
        assert response.status_code == 403


# --- Owner Booking List ---


@pytest.mark.django_db
class TestOwnerBookingListView:
    url = reverse("booking-list-owner")

    def test_owner_sees_property_bookings(
        self, api_client, verified_owner, pending_booking
    ):
        api_client.force_authenticate(user=verified_owner)
        response = api_client.get(self.url)
        assert response.status_code == 200
        assert len(response.data["data"]) == 1

    def test_guest_cannot_access(self, api_client, guest):
        api_client.force_authenticate(user=guest)
        response = api_client.get(self.url)
        assert response.status_code == 403


# --- Host Booking List ---


@pytest.mark.django_db
class TestHostBookingListView:
    url = reverse("booking-list-host")

    def test_host_sees_assigned_bookings(self, api_client, host, pending_booking):
        api_client.force_authenticate(user=host)
        response = api_client.get(self.url)
        assert response.status_code == 200
        assert len(response.data["data"]) == 1

    def test_guest_cannot_access(self, api_client, guest):
        api_client.force_authenticate(user=guest)
        response = api_client.get(self.url)
        assert response.status_code == 403


# --- Shortlet Availability ---


@pytest.mark.django_db
class TestShortletAvailabilityView:
    def test_public_access(self, api_client, active_shortlet, pending_booking):
        url = reverse("shortlet-availability", args=[active_shortlet.pk])
        response = api_client.get(url)
        assert response.status_code == 200
        assert len(response.data["data"]) == 1

    def test_cancelled_not_shown(
        self, api_client, active_shortlet, pending_booking, guest
    ):
        from bookings.domain.services import cancel_booking

        cancel_booking(booking=pending_booking, user=guest)
        url = reverse("shortlet-availability", args=[active_shortlet.pk])
        response = api_client.get(url)
        assert response.status_code == 200
        assert len(response.data["data"]) == 0

    def test_nonexistent_shortlet_returns_404(self, api_client):
        url = reverse("shortlet-availability", args=[99999])
        response = api_client.get(url)
        assert response.status_code == 404
