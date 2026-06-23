from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

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
def shortlet(owner):
    return Shortlet.objects.create(
        owner=owner,
        title="Cosy flat",
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
def other_shortlet(owner):
    return Shortlet.objects.create(
        owner=owner,
        title="Beach villa",
        shortlet_type="villa",
        city="Lekki",
        state="Lagos",
        base_price=Decimal("80000.00"),
        cleaning_fee=Decimal("5000.00"),
        max_guests=6,
        min_nights=2,
        status=Shortlet.Status.ACTIVE,
    )
