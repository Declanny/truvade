import datetime
from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from bookings.models import Booking
from shortlet.models import Shortlet

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
def owner(db):
    return User.objects.create_user(
        email="owner@example.com", role="OWNER", name="Owner One"
    )


@pytest.fixture
def stranger(db):
    return User.objects.create_user(
        email="stranger@example.com", role="GUEST", name="Stranger"
    )


@pytest.fixture
def shortlet(owner):
    return Shortlet.objects.create(
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


@pytest.fixture
def booking(guest, shortlet):
    today = datetime.date.today()
    return Booking.objects.create(
        guest=guest,
        shortlet=shortlet,
        check_in=today + datetime.timedelta(days=5),
        check_out=today + datetime.timedelta(days=8),
        number_of_guests=2,
        number_of_nights=3,
        base_price_per_night=Decimal("40000.00"),
        cleaning_fee=Decimal("2000.00"),
        subtotal=Decimal("122000.00"),
        platform_fee=Decimal("9760.00"),
        total_price=Decimal("131760.00"),
        currency="NGN",
        status=Booking.Status.CONFIRMED,
    )
