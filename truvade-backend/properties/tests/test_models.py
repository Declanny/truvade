import pytest

from properties.models import Property, PropertyImage


@pytest.mark.django_db
class TestPropertyModel:
    def test_create_property(self, property_data):
        prop = Property.objects.create(**property_data)
        assert prop.title == "Luxury 3-Bedroom Apartment"
        assert prop.owner.email == "owner@example.com"
        assert prop.base_price == 85000

    def test_default_status_is_draft(self, property_data):
        prop = Property.objects.create(**property_data)
        assert prop.status == "DRAFT"

    def test_default_currency_is_ngn(self, property_data):
        prop = Property.objects.create(**property_data)
        assert prop.currency == "NGN"

    def test_default_cleaning_fee_is_zero(self, property_data):
        prop = Property.objects.create(**property_data)
        assert prop.cleaning_fee == 0

    def test_default_min_nights_is_one(self, property_data):
        prop = Property.objects.create(**property_data)
        assert prop.min_nights == 1

    def test_boolean_defaults(self, property_data):
        prop = Property.objects.create(**property_data)
        assert prop.featured is False
        assert prop.verified is False
        assert prop.guest_favorite is False

    def test_str_returns_title(self, property_data):
        prop = Property.objects.create(**property_data)
        assert str(prop) == "Luxury 3-Bedroom Apartment"

    def test_timestamps_set_on_create(self, property_data):
        prop = Property.objects.create(**property_data)
        assert prop.created_at is not None
        assert prop.updated_at is not None

    def test_amenities_stored_as_list(self, property_data):
        prop = Property.objects.create(**property_data)
        prop.refresh_from_db()
        assert prop.amenities == ["WiFi", "Air Conditioning", "Pool"]

    def test_property_type_choices(self, property_data):
        for ptype in ["apartment", "house", "studio", "villa"]:
            property_data["property_type"] = ptype
            prop = Property.objects.create(**property_data)
            assert prop.property_type == ptype

    def test_optional_lat_lng(self, property_data):
        prop = Property.objects.create(**property_data)
        assert prop.latitude is None
        assert prop.longitude is None

    def test_lat_lng_set(self, property_data):
        property_data["latitude"] = 6.4281
        property_data["longitude"] = 3.4219
        prop = Property.objects.create(**property_data)
        assert float(prop.latitude) == 6.4281
        assert float(prop.longitude) == 3.4219


@pytest.mark.django_db
class TestPropertyImageModel:
    def test_create_image(self, property_data):
        prop = Property.objects.create(**property_data)
        image = PropertyImage.objects.create(
            property=prop, image="properties/test.jpg", order=0
        )
        assert image.property == prop
        assert image.is_cover is False
        assert image.order == 0

    def test_cover_image(self, property_data):
        prop = Property.objects.create(**property_data)
        image = PropertyImage.objects.create(
            property=prop, image="properties/test.jpg", order=0, is_cover=True
        )
        assert image.is_cover is True

    def test_images_ordered(self, property_data):
        prop = Property.objects.create(**property_data)
        PropertyImage.objects.create(property=prop, image="properties/b.jpg", order=1)
        PropertyImage.objects.create(property=prop, image="properties/a.jpg", order=0)
        images = list(prop.images.all())
        assert images[0].order == 0
        assert images[1].order == 1

    def test_str_returns_description(self, property_data):
        prop = Property.objects.create(**property_data)
        image = PropertyImage.objects.create(
            property=prop, image="properties/test.jpg", order=0
        )
        assert str(image) == f"Image 0 for {prop.title}"

    def test_cascade_delete(self, property_data):
        prop = Property.objects.create(**property_data)
        PropertyImage.objects.create(property=prop, image="properties/test.jpg", order=0)
        assert PropertyImage.objects.count() == 1
        prop.delete()
        assert PropertyImage.objects.count() == 0
