import datetime
from decimal import Decimal

import pytest
from django.db import IntegrityError

from bookings.models import Booking


@pytest.mark.django_db
class TestBookingModel:
    def test_create_booking(self, guest, active_shortlet):
        booking = Booking.objects.create(
            guest=guest,
            shortlet=active_shortlet,
            check_in=datetime.date(2026, 5, 1),
            check_out=datetime.date(2026, 5, 4),
            number_of_guests=2,
            number_of_nights=3,
            base_price_per_night=Decimal("50000.00"),
            cleaning_fee=Decimal("5000.00"),
            subtotal=Decimal("155000.00"),
            platform_fee=Decimal("12400.00"),
            total_price=Decimal("167400.00"),
            currency="NGN",
        )
        assert booking.pk is not None
        assert booking.guest == guest
        assert booking.shortlet == active_shortlet

    def test_default_status_is_pending(self, guest, active_shortlet):
        booking = Booking.objects.create(
            guest=guest,
            shortlet=active_shortlet,
            check_in=datetime.date(2026, 5, 1),
            check_out=datetime.date(2026, 5, 4),
            number_of_guests=2,
            number_of_nights=3,
            base_price_per_night=Decimal("50000.00"),
            cleaning_fee=Decimal("5000.00"),
            subtotal=Decimal("155000.00"),
            platform_fee=Decimal("12400.00"),
            total_price=Decimal("167400.00"),
            currency="NGN",
        )
        assert booking.status == Booking.Status.PENDING

    def test_str_representation(self, pending_booking):
        expected = f"Booking #{pending_booking.pk} - {pending_booking.guest.email} at {pending_booking.shortlet.title}"
        assert str(pending_booking) == expected

    def test_ordering_is_newest_first(self, guest, active_shortlet):
        b1 = Booking.objects.create(
            guest=guest,
            shortlet=active_shortlet,
            check_in=datetime.date(2026, 6, 1),
            check_out=datetime.date(2026, 6, 3),
            number_of_guests=1,
            number_of_nights=2,
            base_price_per_night=Decimal("50000.00"),
            cleaning_fee=Decimal("5000.00"),
            subtotal=Decimal("105000.00"),
            platform_fee=Decimal("8400.00"),
            total_price=Decimal("113400.00"),
            currency="NGN",
        )
        b2 = Booking.objects.create(
            guest=guest,
            shortlet=active_shortlet,
            check_in=datetime.date(2026, 7, 1),
            check_out=datetime.date(2026, 7, 3),
            number_of_guests=1,
            number_of_nights=2,
            base_price_per_night=Decimal("50000.00"),
            cleaning_fee=Decimal("5000.00"),
            subtotal=Decimal("105000.00"),
            platform_fee=Decimal("8400.00"),
            total_price=Decimal("113400.00"),
            currency="NGN",
        )
        bookings = list(Booking.objects.all())
        assert bookings[0] == b2
        assert bookings[1] == b1

    def test_check_out_must_be_after_check_in(self, guest, active_shortlet):
        with pytest.raises(IntegrityError):
            Booking.objects.create(
                guest=guest,
                shortlet=active_shortlet,
                check_in=datetime.date(2026, 5, 5),
                check_out=datetime.date(2026, 5, 3),
                number_of_guests=1,
                number_of_nights=2,
                base_price_per_night=Decimal("50000.00"),
                cleaning_fee=Decimal("5000.00"),
                subtotal=Decimal("105000.00"),
                platform_fee=Decimal("8400.00"),
                total_price=Decimal("113400.00"),
                currency="NGN",
            )

    def test_cascade_delete_on_shortlet(self, pending_booking):
        shortlet = pending_booking.shortlet
        booking_id = pending_booking.pk
        shortlet.delete()
        assert not Booking.objects.filter(pk=booking_id).exists()

    def test_cascade_delete_on_guest(self, pending_booking):
        guest = pending_booking.guest
        booking_id = pending_booking.pk
        guest.delete()
        assert not Booking.objects.filter(pk=booking_id).exists()

    def test_guest_note_default_empty(self, pending_booking):
        assert pending_booking.guest_note == ""

    def test_cancelled_at_default_null(self, pending_booking):
        assert pending_booking.cancelled_at is None

    def test_cancellation_reason_default_empty(self, pending_booking):
        assert pending_booking.cancellation_reason == ""
