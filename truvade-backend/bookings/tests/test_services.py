import datetime
from decimal import Decimal

import pytest
from django.core.exceptions import ValidationError

from bookings.domain.services import (
    cancel_booking,
    complete_booking,
    confirm_booking,
    create_booking,
)
from bookings.models import Booking
from shortlet.models import ShortletHostAssignment


@pytest.mark.django_db
class TestCreateBooking:
    def test_happy_path(self, guest, active_shortlet):
        check_in = datetime.date.today() + datetime.timedelta(days=10)
        check_out = check_in + datetime.timedelta(days=3)

        booking = create_booking(
            guest=guest,
            shortlet=active_shortlet,
            check_in=check_in,
            check_out=check_out,
            number_of_guests=2,
        )

        assert booking.pk is not None
        assert booking.guest == guest
        assert booking.shortlet == active_shortlet
        assert booking.status == Booking.Status.PENDING
        assert booking.number_of_nights == 3
        assert booking.number_of_guests == 2

    def test_pricing_calculation(self, guest, active_shortlet):
        check_in = datetime.date.today() + datetime.timedelta(days=10)
        check_out = check_in + datetime.timedelta(days=4)  # 4 nights

        booking = create_booking(
            guest=guest,
            shortlet=active_shortlet,
            check_in=check_in,
            check_out=check_out,
            number_of_guests=2,
        )

        # base_price=50000, cleaning_fee=5000, 4 nights
        expected_subtotal = Decimal("50000.00") * 4 + Decimal("5000.00")  # 205000
        expected_platform_fee = (expected_subtotal * Decimal("0.08")).quantize(
            Decimal("0.01")
        )
        expected_total = expected_subtotal + expected_platform_fee

        assert booking.base_price_per_night == Decimal("50000.00")
        assert booking.cleaning_fee == Decimal("5000.00")
        assert booking.subtotal == expected_subtotal
        assert booking.platform_fee == expected_platform_fee
        assert booking.total_price == expected_total
        assert booking.currency == "NGN"

    def test_host_commission_snapshot(self, guest, active_shortlet):
        """Host assignment has commission_percentage=0 by default in fixture."""
        check_in = datetime.date.today() + datetime.timedelta(days=10)
        check_out = check_in + datetime.timedelta(days=4)

        booking = create_booking(
            guest=guest,
            shortlet=active_shortlet,
            check_in=check_in,
            check_out=check_out,
            number_of_guests=2,
        )

        assert booking.host_commission_percentage == Decimal("0.00")
        assert booking.host_payout_amount == Decimal("0.00")
        assert booking.owner_payout_amount == booking.subtotal

    def test_host_commission_with_percentage(self, guest, active_shortlet):
        """Update host assignment to 10% commission and verify snapshot."""
        from shortlet.models import ShortletHostAssignment

        assignment = ShortletHostAssignment.objects.get(
            shortlet=active_shortlet, role="HOST"
        )
        assignment.commission_percentage = Decimal("10.00")
        assignment.save()

        check_in = datetime.date.today() + datetime.timedelta(days=10)
        check_out = check_in + datetime.timedelta(days=4)

        booking = create_booking(
            guest=guest,
            shortlet=active_shortlet,
            check_in=check_in,
            check_out=check_out,
            number_of_guests=2,
        )

        expected_host = (booking.subtotal * Decimal("10") / Decimal("100")).quantize(
            Decimal("0.01")
        )
        assert booking.host_commission_percentage == Decimal("10.00")
        assert booking.host_payout_amount == expected_host
        assert booking.owner_payout_amount == booking.subtotal - expected_host

    def test_cohost_commission_snapshot(self, guest, active_shortlet):
        """Add a cohost with 5% commission, verify snapshot."""
        from accounts.models import IdentityVerification, OwnerHostMembership
        from django.contrib.auth import get_user_model

        User = get_user_model()
        cohost = User.objects.create_user(
            email="cohost@example.com", password="testpass123", role="HOST"
        )
        IdentityVerification.objects.create(
            user=cohost,
            verification_type="NIN",
            id_number="66677788899",
            id_document="verifications/documents/test.jpg",
            selfie="verifications/selfies/test.jpg",
            status="APPROVED",
        )
        OwnerHostMembership.objects.create(owner=active_shortlet.owner, host=cohost)
        ShortletHostAssignment.objects.create(
            shortlet=active_shortlet,
            host=cohost,
            role="COHOST",
            assigned_by=active_shortlet.owner,
            commission_percentage=Decimal("5.00"),
        )

        # Also set host to 10%
        host_assignment = ShortletHostAssignment.objects.get(
            shortlet=active_shortlet, role="HOST"
        )
        host_assignment.commission_percentage = Decimal("10.00")
        host_assignment.save()

        check_in = datetime.date.today() + datetime.timedelta(days=10)
        check_out = check_in + datetime.timedelta(days=4)

        booking = create_booking(
            guest=guest,
            shortlet=active_shortlet,
            check_in=check_in,
            check_out=check_out,
            number_of_guests=2,
        )

        expected_host = (booking.subtotal * Decimal("10") / Decimal("100")).quantize(
            Decimal("0.01")
        )
        expected_cohost = (booking.subtotal * Decimal("5") / Decimal("100")).quantize(
            Decimal("0.01")
        )
        assert booking.host_commission_percentage == Decimal("10.00")
        assert booking.host_payout_amount == expected_host
        assert booking.cohost_commission_percentage == Decimal("5.00")
        assert booking.cohost_payout_amount == expected_cohost
        assert booking.owner_payout_amount == (
            booking.subtotal - expected_host - expected_cohost
        )

    def test_no_cohost_means_zero(self, guest, active_shortlet):
        """Without cohost, cohost fields default to zero."""
        check_in = datetime.date.today() + datetime.timedelta(days=10)
        check_out = check_in + datetime.timedelta(days=3)

        booking = create_booking(
            guest=guest,
            shortlet=active_shortlet,
            check_in=check_in,
            check_out=check_out,
            number_of_guests=2,
        )
        assert booking.cohost_commission_percentage == Decimal("0.00")
        assert booking.cohost_payout_amount == Decimal("0.00")

    def test_guest_note_stored(self, guest, active_shortlet):
        check_in = datetime.date.today() + datetime.timedelta(days=10)
        check_out = check_in + datetime.timedelta(days=3)

        booking = create_booking(
            guest=guest,
            shortlet=active_shortlet,
            check_in=check_in,
            check_out=check_out,
            number_of_guests=2,
            guest_note="Early check-in please",
        )

        assert booking.guest_note == "Early check-in please"

    def test_shortlet_must_be_active(self, guest, draft_shortlet):
        check_in = datetime.date.today() + datetime.timedelta(days=10)
        check_out = check_in + datetime.timedelta(days=3)

        with pytest.raises(
            ValidationError, match="Only active shortlets can be booked"
        ):
            create_booking(
                guest=guest,
                shortlet=draft_shortlet,
                check_in=check_in,
                check_out=check_out,
                number_of_guests=1,
            )

    def test_guest_cannot_book_own_property(self, verified_owner, active_shortlet):
        check_in = datetime.date.today() + datetime.timedelta(days=10)
        check_out = check_in + datetime.timedelta(days=3)

        with pytest.raises(ValidationError, match="cannot book your own property"):
            create_booking(
                guest=verified_owner,
                shortlet=active_shortlet,
                check_in=check_in,
                check_out=check_out,
                number_of_guests=2,
            )

    def test_check_in_must_be_in_future(self, guest, active_shortlet):
        check_in = datetime.date.today()
        check_out = check_in + datetime.timedelta(days=3)

        with pytest.raises(
            ValidationError, match="Check-in date must be in the future"
        ):
            create_booking(
                guest=guest,
                shortlet=active_shortlet,
                check_in=check_in,
                check_out=check_out,
                number_of_guests=2,
            )

    def test_check_out_must_be_after_check_in(self, guest, active_shortlet):
        check_in = datetime.date.today() + datetime.timedelta(days=10)
        check_out = check_in - datetime.timedelta(days=1)

        with pytest.raises(ValidationError, match="Check-out must be after check-in"):
            create_booking(
                guest=guest,
                shortlet=active_shortlet,
                check_in=check_in,
                check_out=check_out,
                number_of_guests=2,
            )

    def test_respects_min_nights(self, guest, active_shortlet):
        # active_shortlet has min_nights=2
        check_in = datetime.date.today() + datetime.timedelta(days=10)
        check_out = check_in + datetime.timedelta(days=1)  # only 1 night

        with pytest.raises(ValidationError, match="Minimum stay is 2 night"):
            create_booking(
                guest=guest,
                shortlet=active_shortlet,
                check_in=check_in,
                check_out=check_out,
                number_of_guests=2,
            )

    def test_respects_max_guests(self, guest, active_shortlet):
        # active_shortlet has max_guests=6
        check_in = datetime.date.today() + datetime.timedelta(days=10)
        check_out = check_in + datetime.timedelta(days=3)

        with pytest.raises(ValidationError, match="Maximum 6 guests allowed"):
            create_booking(
                guest=guest,
                shortlet=active_shortlet,
                check_in=check_in,
                check_out=check_out,
                number_of_guests=7,
            )

    def test_at_least_one_guest(self, guest, active_shortlet):
        check_in = datetime.date.today() + datetime.timedelta(days=10)
        check_out = check_in + datetime.timedelta(days=3)

        with pytest.raises(ValidationError, match="At least 1 guest is required"):
            create_booking(
                guest=guest,
                shortlet=active_shortlet,
                check_in=check_in,
                check_out=check_out,
                number_of_guests=0,
            )

    def test_shortlet_must_have_base_price(self, guest, active_shortlet):
        active_shortlet.base_price = None
        active_shortlet.save()

        check_in = datetime.date.today() + datetime.timedelta(days=10)
        check_out = check_in + datetime.timedelta(days=3)

        with pytest.raises(ValidationError, match="no price set"):
            create_booking(
                guest=guest,
                shortlet=active_shortlet,
                check_in=check_in,
                check_out=check_out,
                number_of_guests=2,
            )

    def test_prevents_overlapping_bookings(self, guest, other_guest, active_shortlet):
        check_in = datetime.date.today() + datetime.timedelta(days=10)
        check_out = check_in + datetime.timedelta(days=5)

        # First booking succeeds
        create_booking(
            guest=guest,
            shortlet=active_shortlet,
            check_in=check_in,
            check_out=check_out,
            number_of_guests=2,
        )

        # Overlapping booking fails
        with pytest.raises(ValidationError, match="dates are not available"):
            create_booking(
                guest=other_guest,
                shortlet=active_shortlet,
                check_in=check_in + datetime.timedelta(days=2),
                check_out=check_out + datetime.timedelta(days=2),
                number_of_guests=1,
            )

    def test_cancelled_booking_does_not_block(
        self, guest, other_guest, active_shortlet
    ):
        check_in = datetime.date.today() + datetime.timedelta(days=10)
        check_out = check_in + datetime.timedelta(days=5)

        booking = create_booking(
            guest=guest,
            shortlet=active_shortlet,
            check_in=check_in,
            check_out=check_out,
            number_of_guests=2,
        )
        cancel_booking(booking=booking, user=guest)

        # Same dates should now be available
        new_booking = create_booking(
            guest=other_guest,
            shortlet=active_shortlet,
            check_in=check_in,
            check_out=check_out,
            number_of_guests=2,
        )
        assert new_booking.pk is not None

    def test_non_overlapping_dates_allowed(self, guest, other_guest, active_shortlet):
        check_in = datetime.date.today() + datetime.timedelta(days=10)
        check_out = check_in + datetime.timedelta(days=3)

        create_booking(
            guest=guest,
            shortlet=active_shortlet,
            check_in=check_in,
            check_out=check_out,
            number_of_guests=2,
        )

        # Adjacent dates (no overlap)
        new_booking = create_booking(
            guest=other_guest,
            shortlet=active_shortlet,
            check_in=check_out,
            check_out=check_out + datetime.timedelta(days=3),
            number_of_guests=2,
        )
        assert new_booking.pk is not None


@pytest.mark.django_db
class TestCancelBooking:
    def test_cancel_pending_booking(self, pending_booking, guest):
        booking = cancel_booking(
            booking=pending_booking, user=guest, reason="Changed plans"
        )
        assert booking.status == Booking.Status.CANCELLED
        assert booking.cancelled_at is not None
        assert booking.cancellation_reason == "Changed plans"

    def test_cancel_confirmed_booking(self, confirmed_booking, guest):
        booking = cancel_booking(booking=confirmed_booking, user=guest)
        assert booking.status == Booking.Status.CANCELLED

    def test_only_guest_can_cancel(self, pending_booking, other_guest):
        with pytest.raises(ValidationError, match="can only cancel your own"):
            cancel_booking(booking=pending_booking, user=other_guest)

    def test_cannot_cancel_already_cancelled(self, pending_booking, guest):
        cancel_booking(booking=pending_booking, user=guest)
        pending_booking.refresh_from_db()
        with pytest.raises(ValidationError, match="cannot be cancelled"):
            cancel_booking(booking=pending_booking, user=guest)

    def test_cannot_cancel_completed(self, confirmed_booking, guest):
        confirmed_booking.status = Booking.Status.COMPLETED
        confirmed_booking.save()
        with pytest.raises(ValidationError, match="cannot be cancelled"):
            cancel_booking(booking=confirmed_booking, user=guest)


@pytest.mark.django_db
class TestConfirmBooking:
    def test_owner_confirms_pending(self, pending_booking, verified_owner):
        booking = confirm_booking(booking=pending_booking, user=verified_owner)
        assert booking.status == Booking.Status.CONFIRMED

    def test_host_confirms_pending(self, pending_booking, host):
        booking = confirm_booking(booking=pending_booking, user=host)
        assert booking.status == Booking.Status.CONFIRMED

    def test_only_pending_can_be_confirmed(self, confirmed_booking, verified_owner):
        with pytest.raises(ValidationError, match="Only pending bookings"):
            confirm_booking(booking=confirmed_booking, user=verified_owner)

    def test_guest_cannot_confirm(self, pending_booking, guest):
        with pytest.raises(ValidationError, match="not authorized"):
            confirm_booking(booking=pending_booking, user=guest)


@pytest.mark.django_db
class TestCompleteBooking:
    def test_owner_completes_confirmed(self, confirmed_booking, verified_owner):
        booking = complete_booking(booking=confirmed_booking, user=verified_owner)
        assert booking.status == Booking.Status.COMPLETED

    def test_host_completes_confirmed(self, confirmed_booking, host):
        booking = complete_booking(booking=confirmed_booking, user=host)
        assert booking.status == Booking.Status.COMPLETED

    def test_only_confirmed_can_be_completed(self, pending_booking, verified_owner):
        with pytest.raises(ValidationError, match="Only confirmed bookings"):
            complete_booking(booking=pending_booking, user=verified_owner)

    def test_guest_cannot_complete(self, confirmed_booking, guest):
        with pytest.raises(ValidationError, match="not authorized"):
            complete_booking(booking=confirmed_booking, user=guest)
