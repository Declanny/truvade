import pytest

from properties.models import Property, PropertyImage
from properties.api.v1.serializers import PropertySerializer, PropertyCreateSerializer


@pytest.mark.django_db
class TestPropertySerializer:
    def test_serializes_property(self, draft_property):
        serializer = PropertySerializer(draft_property)
        data = serializer.data
        assert data["title"] == "Draft Apartment"
        assert data["status"] == "DRAFT"
        assert data["city"] == "Victoria Island"
        assert data["amenities"] == ["WiFi", "Pool"]
        assert "images" in data
        assert "owner" in data
        assert "id" in data

    def test_includes_image_data(self, draft_property):
        PropertyImage.objects.create(
            property=draft_property, image="properties/test.jpg", order=0, is_cover=True
        )
        serializer = PropertySerializer(draft_property)
        data = serializer.data
        assert len(data["images"]) == 1
        assert data["images"][0]["is_cover"] is True
        assert data["images"][0]["order"] == 0

    def test_owner_is_id(self, draft_property):
        serializer = PropertySerializer(draft_property)
        assert serializer.data["owner"] == draft_property.owner.id


@pytest.mark.django_db
class TestPropertyCreateSerializer:
    def test_valid_data(self):
        data = {
            "title": "New Apartment",
            "description": "Nice place",
            "property_type": "apartment",
            "city": "Lekki",
            "state": "Lagos",
            "bedrooms": 2,
            "bathrooms": 1,
            "max_guests": 4,
            "base_price": 50000,
            "amenities": ["WiFi"],
        }
        serializer = PropertyCreateSerializer(data=data)
        assert serializer.is_valid(), serializer.errors

    def test_title_required(self):
        serializer = PropertyCreateSerializer(data={"city": "Lagos", "base_price": 1000})
        assert not serializer.is_valid()
        assert "title" in serializer.errors

    def test_base_price_required(self):
        serializer = PropertyCreateSerializer(data={"title": "Test", "city": "Lagos"})
        assert not serializer.is_valid()
        assert "base_price" in serializer.errors

    def test_invalid_property_type(self):
        data = {
            "title": "Test",
            "property_type": "castle",
            "city": "Lagos",
            "base_price": 1000,
        }
        serializer = PropertyCreateSerializer(data=data)
        assert not serializer.is_valid()
        assert "property_type" in serializer.errors

    def test_status_defaults_to_draft(self, owner):
        data = {
            "title": "New Apartment",
            "property_type": "apartment",
            "city": "Lekki",
            "base_price": 50000,
        }
        serializer = PropertyCreateSerializer(data=data)
        assert serializer.is_valid(), serializer.errors
        prop = serializer.save(owner=owner)
        assert prop.status == "DRAFT"

    def test_cannot_set_status_on_create(self, owner):
        data = {
            "title": "New Apartment",
            "property_type": "apartment",
            "city": "Lekki",
            "base_price": 50000,
            "status": "ACTIVE",
        }
        serializer = PropertyCreateSerializer(data=data)
        assert serializer.is_valid(), serializer.errors
        prop = serializer.save(owner=owner)
        assert prop.status == "DRAFT"
