from django.urls import path

from .views import (
    BookingDetailView,
    CancelBookingView,
    CompleteBookingView,
    ConfirmBookingView,
    CreateBookingView,
    GuestBookingListView,
    HostBookingListView,
    OwnerBookingListView,
    ShortletAvailabilityView,
)

urlpatterns = [
    path("bookings/", CreateBookingView.as_view(), name="booking-create"),
    path("bookings/mine/", GuestBookingListView.as_view(), name="booking-list-guest"),
    path("bookings/<int:pk>/", BookingDetailView.as_view(), name="booking-detail"),
    path(
        "bookings/<int:pk>/cancel/", CancelBookingView.as_view(), name="booking-cancel"
    ),
    path(
        "bookings/<int:pk>/confirm/",
        ConfirmBookingView.as_view(),
        name="booking-confirm",
    ),
    path(
        "bookings/<int:pk>/complete/",
        CompleteBookingView.as_view(),
        name="booking-complete",
    ),
    path("owner-bookings/", OwnerBookingListView.as_view(), name="booking-list-owner"),
    path("host-bookings/", HostBookingListView.as_view(), name="booking-list-host"),
    path(
        "shortlets/<int:shortlet_id>/availability/",
        ShortletAvailabilityView.as_view(),
        name="shortlet-availability",
    ),
]
