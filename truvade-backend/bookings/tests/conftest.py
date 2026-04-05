import datetime
from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from accounts.models import IdentityVerification, OwnerHostMembership
from bookings.models import Booking
from shortlet.models import Shortlet, ShortletHostAssignment, ShortletImage

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def guest(db):
    return User.objects.create_user(
        email="guest@example.com",
        password="testpass123",
        role="GUEST",
        name="Test Guest",
    )


@pytest.fixture
def other_guest(db):
    return User.objects.create_user(
        email="other-guest@example.com", password="testpass123", role="GUEST"
    )


@pytest.fixture
def owner(db):
    return User.objects.create_user(
        email="owner@example.com",
        password="testpass123",
        role="OWNER",
        name="Test Owner",
    )


@pytest.fixture
def verified_owner(owner):
    IdentityVerification.objects.create(
        user=owner,
        verification_type="NIN",
        id_number="12345678901",
        id_document="verifications/documents/test.jpg",
        selfie="verifications/selfies/test.jpg",
        status="APPROVED",
    )
    return owner


@pytest.fixture
def host(db, owner):
    user = User.objects.create_user(
        email="host@example.com", password="testpass123", role="HOST", name="Test Host"
    )
    IdentityVerification.objects.create(
        user=user,
        verification_type="NIN",
        id_number="99988877766",
        id_document="verifications/documents/test.jpg",
        selfie="verifications/selfies/test.jpg",
        status="APPROVED",
    )
    OwnerHostMembership.objects.create(owner=owner, host=user)
    return user


@pytest.fixture
def active_shortlet(verified_owner, host):
    """An ACTIVE shortlet with images and host assigned."""
    shortlet = Shortlet.objects.create(
        owner=verified_owner,
        title="Beach House Lagos",
        description="Beautiful beach house",
        shortlet_type="house",
        city="Lekki",
        state="Lagos",
        address="1 Beach Road",
        bedrooms=3,
        bathrooms=2,
        max_guests=6,
        min_nights=2,
        base_price=Decimal("50000.00"),
        cleaning_fee=Decimal("5000.00"),
        currency="NGN",
        amenities=["WiFi", "Pool"],
        status=Shortlet.Status.ACTIVE,
    )
    for i in range(5):
        ShortletImage.objects.create(
            shortlet=shortlet, image=f"shortlets/img{i}.jpg", order=i
        )
    ShortletHostAssignment.objects.create(
        shortlet=shortlet, host=host, role="HOST", assigned_by=verified_owner
    )
    return shortlet


@pytest.fixture
def other_active_shortlet(db):
    """An ACTIVE shortlet owned by a different owner."""
    other_owner = User.objects.create_user(
        email="other-owner@example.com", password="testpass123", role="OWNER"
    )
    IdentityVerification.objects.create(
        user=other_owner,
        verification_type="NIN",
        id_number="44455566677",
        id_document="verifications/documents/test.jpg",
        selfie="verifications/selfies/test.jpg",
        status="APPROVED",
    )
    shortlet = Shortlet.objects.create(
        owner=other_owner,
        title="City Apartment",
        description="Modern city apartment",
        shortlet_type="apartment",
        city="Victoria Island",
        state="Lagos",
        base_price=Decimal("30000.00"),
        cleaning_fee=Decimal("3000.00"),
        max_guests=2,
        min_nights=1,
        status=Shortlet.Status.ACTIVE,
    )
    return shortlet


@pytest.fixture
def draft_shortlet(verified_owner):
    return Shortlet.objects.create(
        owner=verified_owner,
        title="Draft Place",
        shortlet_type="apartment",
        base_price=Decimal("40000.00"),
        status=Shortlet.Status.DRAFT,
    )


@pytest.fixture
def booking_data(active_shortlet):
    """Valid booking creation data."""
    return {
        "shortlet_id": active_shortlet.pk,
        "check_in": (datetime.date.today() + datetime.timedelta(days=10)).isoformat(),
        "check_out": (datetime.date.today() + datetime.timedelta(days=14)).isoformat(),
        "number_of_guests": 4,
        "guest_note": "Looking forward to our stay!",
    }


@pytest.fixture
def pending_booking(guest, active_shortlet):
    """A pre-created PENDING booking."""
    check_in = datetime.date.today() + datetime.timedelta(days=30)
    check_out = check_in + datetime.timedelta(days=3)
    nights = (check_out - check_in).days
    subtotal = active_shortlet.base_price * nights + active_shortlet.cleaning_fee
    platform_fee = (subtotal * Decimal("0.08")).quantize(Decimal("0.01"))
    return Booking.objects.create(
        guest=guest,
        shortlet=active_shortlet,
        check_in=check_in,
        check_out=check_out,
        number_of_guests=2,
        number_of_nights=nights,
        base_price_per_night=active_shortlet.base_price,
        cleaning_fee=active_shortlet.cleaning_fee,
        subtotal=subtotal,
        platform_fee=platform_fee,
        total_price=subtotal + platform_fee,
        currency=active_shortlet.currency,
        status=Booking.Status.PENDING,
    )


@pytest.fixture
def confirmed_booking(guest, active_shortlet):
    """A pre-created CONFIRMED booking."""
    check_in = datetime.date.today() + datetime.timedelta(days=60)
    check_out = check_in + datetime.timedelta(days=5)
    nights = (check_out - check_in).days
    subtotal = active_shortlet.base_price * nights + active_shortlet.cleaning_fee
    platform_fee = (subtotal * Decimal("0.08")).quantize(Decimal("0.01"))
    return Booking.objects.create(
        guest=guest,
        shortlet=active_shortlet,
        check_in=check_in,
        check_out=check_out,
        number_of_guests=3,
        number_of_nights=nights,
        base_price_per_night=active_shortlet.base_price,
        cleaning_fee=active_shortlet.cleaning_fee,
        subtotal=subtotal,
        platform_fee=platform_fee,
        total_price=subtotal + platform_fee,
        currency=active_shortlet.currency,
        status=Booking.Status.CONFIRMED,
    )
