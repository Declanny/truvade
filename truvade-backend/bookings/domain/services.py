from datetime import date
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from bookings.models import Booking
from shortlet.models import Shortlet, ShortletHostAssignment

HUNDRED = Decimal("100")

PLATFORM_FEE_RATE = Decimal("0.08")


def _is_owner_or_host(*, booking, user):
    if booking.shortlet.owner == user:
        return True
    return ShortletHostAssignment.objects.filter(
        shortlet=booking.shortlet, host=user
    ).exists()


@transaction.atomic
def create_booking(
    *, guest, shortlet, check_in, check_out, number_of_guests, guest_note=""
):
    if shortlet.status != Shortlet.Status.ACTIVE:
        raise ValidationError("Only active shortlets can be booked.")

    if shortlet.owner == guest:
        raise ValidationError("You cannot book your own property.")

    if check_in <= date.today():
        raise ValidationError("Check-in date must be in the future.")

    if check_out <= check_in:
        raise ValidationError("Check-out must be after check-in.")

    number_of_nights = (check_out - check_in).days

    if number_of_nights < shortlet.min_nights:
        raise ValidationError(f"Minimum stay is {shortlet.min_nights} night(s).")

    if number_of_guests < 1:
        raise ValidationError("At least 1 guest is required.")

    if number_of_guests > shortlet.max_guests:
        raise ValidationError(f"Maximum {shortlet.max_guests} guests allowed.")

    if shortlet.base_price is None:
        raise ValidationError("This shortlet has no price set.")

    # Prevent double-booking with row-level locking
    overlapping = (
        Booking.objects.select_for_update()
        .filter(
            shortlet=shortlet,
            check_in__lt=check_out,
            check_out__gt=check_in,
        )
        .exclude(status=Booking.Status.CANCELLED)
        .exists()
    )
    if overlapping:
        raise ValidationError("These dates are not available.")

    subtotal = shortlet.base_price * number_of_nights + shortlet.cleaning_fee
    platform_fee = (subtotal * PLATFORM_FEE_RATE).quantize(Decimal("0.01"))
    total_price = subtotal + platform_fee

    # Snapshot host commission from the HOST assignment
    host_assignment = ShortletHostAssignment.objects.filter(
        shortlet=shortlet, role="HOST"
    ).first()
    host_commission_percentage = (
        host_assignment.commission_percentage if host_assignment else Decimal("0.00")
    )
    host_payout_amount = (subtotal * host_commission_percentage / HUNDRED).quantize(
        Decimal("0.01")
    )
    owner_payout_amount = subtotal - host_payout_amount

    return Booking.objects.create(
        guest=guest,
        shortlet=shortlet,
        check_in=check_in,
        check_out=check_out,
        number_of_guests=number_of_guests,
        number_of_nights=number_of_nights,
        base_price_per_night=shortlet.base_price,
        cleaning_fee=shortlet.cleaning_fee,
        subtotal=subtotal,
        platform_fee=platform_fee,
        total_price=total_price,
        currency=shortlet.currency,
        guest_note=guest_note,
        host_commission_percentage=host_commission_percentage,
        host_payout_amount=host_payout_amount,
        owner_payout_amount=owner_payout_amount,
    )


@transaction.atomic
def cancel_booking(*, booking, user, reason=""):
    if booking.guest != user:
        raise ValidationError("You can only cancel your own bookings.")

    if booking.status not in (Booking.Status.PENDING, Booking.Status.CONFIRMED):
        raise ValidationError("This booking cannot be cancelled.")

    booking.status = Booking.Status.CANCELLED
    booking.cancelled_at = timezone.now()
    booking.cancellation_reason = reason
    booking.save()
    return booking


@transaction.atomic
def confirm_booking(*, booking, user):
    if not _is_owner_or_host(booking=booking, user=user):
        raise ValidationError("You are not authorized to confirm this booking.")

    if booking.status != Booking.Status.PENDING:
        raise ValidationError("Only pending bookings can be confirmed.")

    booking.status = Booking.Status.CONFIRMED
    booking.save()
    return booking


@transaction.atomic
def complete_booking(*, booking, user):
    if not _is_owner_or_host(booking=booking, user=user):
        raise ValidationError("You are not authorized to complete this booking.")

    if booking.status != Booking.Status.CONFIRMED:
        raise ValidationError("Only confirmed bookings can be completed.")

    booking.status = Booking.Status.COMPLETED
    booking.save()
    return booking
