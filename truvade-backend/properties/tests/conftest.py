import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from properties.models import Property, PropertyImage

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
def property_data(owner):
    return {
        "owner": owner,
        "title": "Luxury 3-Bedroom Apartment",
        "description": "A beautiful apartment in Victoria Island",
        "property_type": "apartment",
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
def draft_property(owner):
    return Property.objects.create(
        owner=owner,
        title="Draft Apartment",
        property_type="apartment",
        city="Victoria Island",
        state="Lagos",
        bedrooms=3,
        bathrooms=2,
        max_guests=6,
        base_price=85000,
        amenities=["WiFi", "Pool"],
    )


@pytest.fixture
def publishable_property(owner):
    """A property with all required fields to be published (including 5+ images)."""
    prop = Property.objects.create(
        owner=owner,
        title="Ready Apartment",
        description="A beautiful place to stay",
        property_type="apartment",
        city="Lekki",
        state="Lagos",
        bedrooms=2,
        bathrooms=1,
        max_guests=4,
        base_price=50000,
        amenities=["WiFi"],
    )
    for i in range(5):
        PropertyImage.objects.create(
            property=prop, image=f"properties/img{i}.jpg", order=i
        )
    return prop
