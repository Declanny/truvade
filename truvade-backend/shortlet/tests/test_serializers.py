import pytest

from shortlet.models import ShortletImage
from shortlet.api.v1.serializers import ShortletSerializer, ShortletCreateSerializer


@pytest.mark.django_db
class TestShortletSerializer:
    def test_serializes_shortlet(self, draft_shortlet):
        serializer = ShortletSerializer(draft_shortlet)
        data = serializer.data
        assert data["title"] == "Draft Apartment"
        assert data["status"] == "DRAFT"
        assert data["city"] == "Victoria Island"
        assert len(data["amenities"]) == 2
        amenity_names = {a["name"] for a in data["amenities"]}
        assert amenity_names == {"WiFi", "Pool"}
        assert "images" in data
        assert "owner" in data
        assert "id" in data

    def test_includes_image_data(self, draft_shortlet):
        ShortletImage.objects.create(
            shortlet=draft_shortlet, image="shortlets/test.jpg", order=0, is_cover=True
        )
        serializer = ShortletSerializer(draft_shortlet)
        data = serializer.data
        assert len(data["images"]) == 1
        assert data["images"][0]["is_cover"] is True
        assert data["images"][0]["order"] == 0

    def test_owner_is_id(self, draft_shortlet):
        serializer = ShortletSerializer(draft_shortlet)
        assert serializer.data["owner"] == draft_shortlet.owner.id


@pytest.mark.django_db
class TestShortletCreateSerializer:
    def test_valid_with_only_shortlet_type(self):
        data = {"shortlet_type": "apartment"}
        serializer = ShortletCreateSerializer(data=data)
        assert serializer.is_valid(), serializer.errors

    def test_shortlet_type_required(self):
        serializer = ShortletCreateSerializer(data={})
        assert not serializer.is_valid()
        assert "shortlet_type" in serializer.errors

    def test_invalid_shortlet_type(self):
        data = {"shortlet_type": "castle"}
        serializer = ShortletCreateSerializer(data=data)
        assert not serializer.is_valid()
        assert "shortlet_type" in serializer.errors

    def test_status_defaults_to_draft(self, owner):
        data = {"shortlet_type": "apartment"}
        serializer = ShortletCreateSerializer(data=data)
        assert serializer.is_valid(), serializer.errors
        shortlet = serializer.save(owner=owner)
        assert shortlet.status == "DRAFT"

    def test_cannot_set_status_on_create(self, owner):
        data = {"shortlet_type": "apartment", "status": "ACTIVE"}
        serializer = ShortletCreateSerializer(data=data)
        assert serializer.is_valid(), serializer.errors
        shortlet = serializer.save(owner=owner)
        assert shortlet.status == "DRAFT"
