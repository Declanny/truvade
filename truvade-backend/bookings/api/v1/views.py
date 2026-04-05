from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from accounts.api.v1.permissions import IsHostRole, IsOwnerRole
from bookings.domain.selectors import (
    get_booking_detail,
    get_bookings_for_guest,
    get_bookings_for_host,
    get_bookings_for_owner,
    get_unavailable_dates,
)
from bookings.domain.services import (
    cancel_booking,
    complete_booking,
    confirm_booking,
    create_booking,
)
from bookings.models import Booking
from core.utils.responses import success_response
from shortlet.models import Shortlet

from .permissions import (
    IsBookingGuest,
    IsBookingOwnerOrHost,
    IsBookingParticipant,
    IsGuestRole,
)
from .serializers import (
    AvailabilitySerializer,
    BookingReadSerializer,
    CancelBookingSerializer,
    CreateBookingSerializer,
)


def _get_booking_or_404(pk):
    try:
        return get_booking_detail(booking_id=pk)
    except Booking.DoesNotExist:
        raise NotFound("Booking not found.")


@extend_schema(tags=["Bookings"])
class CreateBookingView(APIView):
    permission_classes = [IsAuthenticated, IsGuestRole]

    @extend_schema(
        summary="Create a booking",
        request=CreateBookingSerializer,
        responses=BookingReadSerializer,
    )
    def post(self, request):
        serializer = CreateBookingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            shortlet = Shortlet.objects.get(pk=serializer.validated_data["shortlet_id"])
        except Shortlet.DoesNotExist:
            from django.core.exceptions import ValidationError

            raise ValidationError("Shortlet not found.")

        booking = create_booking(
            guest=request.user,
            shortlet=shortlet,
            check_in=serializer.validated_data["check_in"],
            check_out=serializer.validated_data["check_out"],
            number_of_guests=serializer.validated_data["number_of_guests"],
            guest_note=serializer.validated_data.get("guest_note", ""),
        )
        return success_response(
            "Booking created successfully.",
            BookingReadSerializer(booking).data,
            status_code=status.HTTP_201_CREATED,
        )


@extend_schema(tags=["Bookings"])
class GuestBookingListView(APIView):
    permission_classes = [IsAuthenticated, IsGuestRole]

    @extend_schema(
        summary="List guest's bookings",
        responses=BookingReadSerializer(many=True),
    )
    def get(self, request):
        bookings = get_bookings_for_guest(guest=request.user)
        return success_response(
            "Bookings retrieved successfully.",
            BookingReadSerializer(bookings, many=True).data,
        )


@extend_schema(tags=["Bookings"])
class BookingDetailView(APIView):
    permission_classes = [IsAuthenticated, IsBookingParticipant]

    @extend_schema(
        summary="Get booking detail",
        responses=BookingReadSerializer,
    )
    def get(self, request, pk):
        booking = _get_booking_or_404(pk)
        self.check_object_permissions(request, booking)
        return success_response(
            "Booking retrieved successfully.",
            BookingReadSerializer(booking).data,
        )


@extend_schema(tags=["Bookings"])
class CancelBookingView(APIView):
    permission_classes = [IsAuthenticated, IsBookingGuest]

    @extend_schema(
        summary="Cancel a booking",
        request=CancelBookingSerializer,
        responses=BookingReadSerializer,
    )
    def post(self, request, pk):
        booking = _get_booking_or_404(pk)
        self.check_object_permissions(request, booking)
        serializer = CancelBookingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        booking = cancel_booking(
            booking=booking,
            user=request.user,
            reason=serializer.validated_data.get("reason", ""),
        )
        return success_response(
            "Booking cancelled successfully.",
            BookingReadSerializer(booking).data,
        )


@extend_schema(tags=["Bookings"])
class ConfirmBookingView(APIView):
    permission_classes = [IsAuthenticated, IsBookingOwnerOrHost]

    @extend_schema(
        summary="Confirm a booking",
        request=None,
        responses=BookingReadSerializer,
    )
    def post(self, request, pk):
        booking = _get_booking_or_404(pk)
        self.check_object_permissions(request, booking)
        booking = confirm_booking(booking=booking, user=request.user)
        return success_response(
            "Booking confirmed successfully.",
            BookingReadSerializer(booking).data,
        )


@extend_schema(tags=["Bookings"])
class CompleteBookingView(APIView):
    permission_classes = [IsAuthenticated, IsBookingOwnerOrHost]

    @extend_schema(
        summary="Complete a booking",
        request=None,
        responses=BookingReadSerializer,
    )
    def post(self, request, pk):
        booking = _get_booking_or_404(pk)
        self.check_object_permissions(request, booking)
        booking = complete_booking(booking=booking, user=request.user)
        return success_response(
            "Booking completed successfully.",
            BookingReadSerializer(booking).data,
        )


@extend_schema(tags=["Bookings"])
class OwnerBookingListView(APIView):
    permission_classes = [IsAuthenticated, IsOwnerRole]

    @extend_schema(
        summary="List bookings for owner's properties",
        responses=BookingReadSerializer(many=True),
    )
    def get(self, request):
        bookings = get_bookings_for_owner(owner=request.user)
        return success_response(
            "Bookings retrieved successfully.",
            BookingReadSerializer(bookings, many=True).data,
        )


@extend_schema(tags=["Bookings"])
class HostBookingListView(APIView):
    permission_classes = [IsAuthenticated, IsHostRole]

    @extend_schema(
        summary="List bookings for host's assigned properties",
        responses=BookingReadSerializer(many=True),
    )
    def get(self, request):
        bookings = get_bookings_for_host(host=request.user)
        return success_response(
            "Bookings retrieved successfully.",
            BookingReadSerializer(bookings, many=True).data,
        )


@extend_schema(tags=["Bookings"])
class ShortletAvailabilityView(APIView):
    permission_classes = []
    authentication_classes = []

    @extend_schema(
        summary="Get booked date ranges for a shortlet",
        responses=AvailabilitySerializer(many=True),
    )
    def get(self, request, shortlet_id):
        try:
            shortlet = Shortlet.objects.get(pk=shortlet_id)
        except Shortlet.DoesNotExist:
            raise NotFound("Shortlet not found.")
        dates = get_unavailable_dates(shortlet=shortlet)
        return success_response(
            "Availability retrieved successfully.",
            AvailabilitySerializer(dates, many=True).data,
        )
