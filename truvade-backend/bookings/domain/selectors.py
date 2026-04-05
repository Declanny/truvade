from bookings.models import Booking


def get_bookings_for_guest(*, guest):
    return (
        Booking.objects.filter(guest=guest)
        .select_related("shortlet", "shortlet__owner")
        .prefetch_related("shortlet__images")
    )


def get_bookings_for_owner(*, owner):
    return Booking.objects.filter(shortlet__owner=owner).select_related(
        "guest", "shortlet"
    )


def get_bookings_for_host(*, host):
    return (
        Booking.objects.filter(shortlet__host_assignments__host=host)
        .select_related("guest", "shortlet")
        .distinct()
    )


def get_booking_detail(*, booking_id):
    return Booking.objects.select_related("guest", "shortlet", "shortlet__owner").get(
        pk=booking_id
    )


def get_unavailable_dates(*, shortlet):
    return (
        Booking.objects.filter(shortlet=shortlet)
        .exclude(status=Booking.Status.CANCELLED)
        .values("check_in", "check_out")
    )
