import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from accounts.models import IdentityVerification, OwnerHostMembership
from shortlet.models import Shortlet, ShortletHostAssignment, ShortletImage

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def owner(db):
    return User.objects.create_user(
        email="owner@example.com", password="testpass123", role="OWNER"
    )


@pytest.fixture
def other_owner(db):
    return User.objects.create_user(
        email="other@example.com", password="testpass123", role="OWNER"
    )


@pytest.fixture
def guest(db):
    return User.objects.create_user(
        email="guest@example.com", password="testpass123", role="GUEST"
    )


@pytest.fixture
def shortlet_data(owner):
    return {
        "owner": owner,
        "title": "Luxury 3-Bedroom Apartment",
        "description": "A beautiful apartment in Victoria Island",
        "shortlet_type": "apartment",
        "address": "12 Ahmadu Bello Way",
        "city": "Victoria Island",
        "state": "Lagos",
        "country": "Nigeria",
        "bedrooms": 3,
        "bathrooms": 2,
        "max_guests": 6,
        "base_price": 85000,
        "amenities": ["WiFi", "Air Conditioning", "Pool"],
    }


@pytest.fixture
def draft_shortlet(owner):
    return Shortlet.objects.create(
        owner=owner,
        title="Draft Apartment",
        shortlet_type="apartment",
        city="Victoria Island",
        state="Lagos",
        bedrooms=3,
        bathrooms=2,
        max_guests=6,
        base_price=85000,
        amenities=["WiFi", "Pool"],
    )


@pytest.fixture
def verified_owner(owner):
    """An owner who has completed identity verification."""
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
def publishable_shortlet(verified_owner):
    """A shortlet with all required fields to be published (including 5+ images)."""
    shortlet = Shortlet.objects.create(
        owner=verified_owner,
        title="Ready Apartment",
        description="A beautiful place to stay",
        shortlet_type="apartment",
        city="Lekki",
        state="Lagos",
        bedrooms=2,
        bathrooms=1,
        max_guests=4,
        base_price=50000,
        amenities=["WiFi"],
    )
    for i in range(5):
        ShortletImage.objects.create(
            shortlet=shortlet, image=f"shortlets/img{i}.jpg", order=i
        )
    return shortlet


@pytest.fixture
def host(db, owner):
    """A verified host linked to owner via membership."""
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
def another_host(db, owner):
    """A second verified host linked to owner."""
    user = User.objects.create_user(
        email="host2@example.com", password="testpass123", role="HOST", name="Host Two"
    )
    IdentityVerification.objects.create(
        user=user,
        verification_type="NIN",
        id_number="11122233344",
        id_document="verifications/documents/test.jpg",
        selfie="verifications/selfies/test.jpg",
        status="APPROVED",
    )
    OwnerHostMembership.objects.create(owner=owner, host=user)
    return user


@pytest.fixture
def unverified_host(db, owner):
    """A host linked to owner but NOT verified."""
    user = User.objects.create_user(
        email="unverified-host@example.com", password="testpass123", role="HOST"
    )
    OwnerHostMembership.objects.create(owner=owner, host=user)
    return user


@pytest.fixture
def unlinked_host(db):
    """A verified host NOT linked to any owner."""
    user = User.objects.create_user(
        email="unlinked-host@example.com", password="testpass123", role="HOST"
    )
    IdentityVerification.objects.create(
        user=user,
        verification_type="NIN",
        id_number="55566677788",
        id_document="verifications/documents/test.jpg",
        selfie="verifications/selfies/test.jpg",
        status="APPROVED",
    )
    return user


@pytest.fixture
def assignment(draft_shortlet, host, owner):
    """Host assigned to draft_shortlet as HOST role."""
    return ShortletHostAssignment.objects.create(
        shortlet=draft_shortlet, host=host, role="HOST", assigned_by=owner
    )
