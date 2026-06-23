import datetime
from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from bookings.models import Booking
from shortlet.models import Shortlet, ShortletHostAssignment

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def guest(db):
    return User.objects.create_user(
        email="guest@example.com", role="GUEST", name="Guest One"
    )


@pytest.fixture
def other_guest(db):
    return User.objects.create_user(
        email="other-guest@example.com", role="GUEST", name="Guest Two"
    )


@pytest.fixture
def owner(db):
    return User.objects.create_user(
        email="owner@example.com", role="OWNER", name="Owner One"
    )


@pytest.fixture
def host(db):
    return User.objects.create_user(
        email="host@example.com", role="HOST", name="Host One"
    )


@pytest.fixture
def stranger(db):
    return User.objects.create_user(
        email="stranger@example.com", role="HOST", name="Stranger"
    )


@pytest.fixture
def shortlet(owner, host):
    s = Shortlet.objects.create(
        owner=owner,
        title="Test Stay",
        shortlet_type="apartment",
        city="Lagos",
        state="Lagos",
        base_price=Decimal("40000.00"),
        cleaning_fee=Decimal("2000.00"),
        max_guests=2,
        min_nights=1,
        status=Shortlet.Status.ACTIVE,
    )
    ShortletHostAssignment.objects.create(
        shortlet=s, host=host, role="HOST", assigned_by=owner
    )
    return s


def _make_booking(*, guest, shortlet, status, days_ago=5):
    today = datetime.date.today()
    check_in = today - datetime.timedelta(days=days_ago + 3)
    check_out = today - datetime.timedelta(days=days_ago)
    return Booking.objects.create(
        guest=guest,
        shortlet=shortlet,
        check_in=check_in,
        check_out=check_out,
        number_of_guests=2,
        number_of_nights=3,
        base_price_per_night=Decimal("40000.00"),
        cleaning_fee=Decimal("2000.00"),
        subtotal=Decimal("122000.00"),
        platform_fee=Decimal("9760.00"),
        total_price=Decimal("131760.00"),
        currency="NGN",
        status=status,
    )


@pytest.fixture
def completed_booking(guest, shortlet):
    return _make_booking(
        guest=guest, shortlet=shortlet, status=Booking.Status.COMPLETED
    )


@pytest.fixture
def confirmed_booking(guest, shortlet):
    return _make_booking(
        guest=guest, shortlet=shortlet, status=Booking.Status.CONFIRMED
    )
