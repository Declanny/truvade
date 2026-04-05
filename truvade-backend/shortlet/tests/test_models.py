import pytest

from shortlet.models import Shortlet, ShortletImage


@pytest.mark.django_db
class TestShortletModel:
    def test_create_minimal_shortlet(self, owner):
        shortlet = Shortlet.objects.create(owner=owner, shortlet_type="apartment")
        assert shortlet.pk is not None
        assert shortlet.status == "DRAFT"
        assert shortlet.title == ""
        assert shortlet.base_price is None

    def test_create_full_shortlet(self, shortlet_data):
        shortlet = Shortlet.objects.create(**shortlet_data)
        assert shortlet.title == "Luxury 3-Bedroom Apartment"
        assert shortlet.owner.email == "owner@example.com"
        assert shortlet.base_price == 85000

    def test_default_status_is_draft(self, shortlet_data):
        shortlet = Shortlet.objects.create(**shortlet_data)
        assert shortlet.status == "DRAFT"

    def test_default_currency_is_ngn(self, shortlet_data):
        shortlet = Shortlet.objects.create(**shortlet_data)
        assert shortlet.currency == "NGN"

    def test_default_cleaning_fee_is_zero(self, shortlet_data):
        shortlet = Shortlet.objects.create(**shortlet_data)
        assert shortlet.cleaning_fee == 0

    def test_default_min_nights_is_one(self, shortlet_data):
        shortlet = Shortlet.objects.create(**shortlet_data)
        assert shortlet.min_nights == 1

    def test_boolean_defaults(self, shortlet_data):
        shortlet = Shortlet.objects.create(**shortlet_data)
        assert shortlet.featured is False
        assert shortlet.verified is False
        assert shortlet.guest_favorite is False

    def test_str_returns_title(self, shortlet_data):
        shortlet = Shortlet.objects.create(**shortlet_data)
        assert str(shortlet) == "Luxury 3-Bedroom Apartment"

    def test_timestamps_set_on_create(self, shortlet_data):
        shortlet = Shortlet.objects.create(**shortlet_data)
        assert shortlet.created_at is not None
        assert shortlet.updated_at is not None

    def test_amenities_stored_as_list(self, shortlet_data):
        shortlet = Shortlet.objects.create(**shortlet_data)
        shortlet.refresh_from_db()
        assert shortlet.amenities == ["WiFi", "Air Conditioning", "Pool"]

    def test_shortlet_type_choices(self, shortlet_data):
        for stype in ["apartment", "house", "studio", "villa"]:
            shortlet_data["shortlet_type"] = stype
            shortlet = Shortlet.objects.create(**shortlet_data)
            assert shortlet.shortlet_type == stype

    def test_optional_lat_lng(self, shortlet_data):
        shortlet = Shortlet.objects.create(**shortlet_data)
        assert shortlet.latitude is None
        assert shortlet.longitude is None

    def test_lat_lng_set(self, shortlet_data):
        shortlet_data["latitude"] = 6.4281
        shortlet_data["longitude"] = 3.4219
        shortlet = Shortlet.objects.create(**shortlet_data)
        assert float(shortlet.latitude) == 6.4281
        assert float(shortlet.longitude) == 3.4219


@pytest.mark.django_db
class TestShortletImageModel:
    def test_create_image(self, shortlet_data):
        shortlet = Shortlet.objects.create(**shortlet_data)
        image = ShortletImage.objects.create(
            shortlet=shortlet, image="shortlets/test.jpg", order=0
        )
        assert image.shortlet == shortlet
        assert image.is_cover is False
        assert image.order == 0

    def test_cover_image(self, shortlet_data):
        shortlet = Shortlet.objects.create(**shortlet_data)
        image = ShortletImage.objects.create(
            shortlet=shortlet, image="shortlets/test.jpg", order=0, is_cover=True
        )
        assert image.is_cover is True

    def test_images_ordered(self, shortlet_data):
        shortlet = Shortlet.objects.create(**shortlet_data)
        ShortletImage.objects.create(
            shortlet=shortlet, image="shortlets/b.jpg", order=1
        )
        ShortletImage.objects.create(
            shortlet=shortlet, image="shortlets/a.jpg", order=0
        )
        images = list(shortlet.images.all())
        assert images[0].order == 0
        assert images[1].order == 1

    def test_str_returns_description(self, shortlet_data):
        shortlet = Shortlet.objects.create(**shortlet_data)
        image = ShortletImage.objects.create(
            shortlet=shortlet, image="shortlets/test.jpg", order=0
        )
        assert str(image) == f"Image 0 for {shortlet.title}"

    def test_cascade_delete(self, shortlet_data):
        shortlet = Shortlet.objects.create(**shortlet_data)
        ShortletImage.objects.create(
            shortlet=shortlet, image="shortlets/test.jpg", order=0
        )
        assert ShortletImage.objects.count() == 1
        shortlet.delete()
        assert ShortletImage.objects.count() == 0
