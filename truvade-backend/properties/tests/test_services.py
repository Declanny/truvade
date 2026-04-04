import pytest
from django.core.exceptions import ValidationError

from properties.domain.services import (
    check_property_editable,
    create_property,
    delete_property_image,
    publish_property,
)
from properties.models import Property, PropertyImage


@pytest.mark.django_db
class TestCreateProperty:
    def test_creates_property_with_draft_status(self, owner):
        prop = create_property(
            owner=owner,
            title="New Place",
            property_type="apartment",
            city="Lagos",
            base_price=50000,
        )
        assert prop.pk is not None
        assert prop.status == "DRAFT"
        assert prop.owner == owner

    def test_forces_draft_even_if_status_passed(self, owner):
        prop = create_property(
            owner=owner,
            title="New Place",
            property_type="apartment",
            city="Lagos",
            base_price=50000,
            status="ACTIVE",
        )
        assert prop.status == "DRAFT"


@pytest.mark.django_db
class TestCheckPropertyEditable:
    def test_passes_for_draft(self, draft_property):
        check_property_editable(property_instance=draft_property)

    def test_passes_for_active(self, draft_property):
        draft_property.status = "ACTIVE"
        draft_property.save()
        check_property_editable(property_instance=draft_property)

    @pytest.mark.parametrize("status_value", ["PENDING", "INACTIVE", "ARCHIVED"])
    def test_raises_for_non_editable_status(self, draft_property, status_value):
        draft_property.status = status_value
        draft_property.save()
        with pytest.raises(ValidationError):
            check_property_editable(property_instance=draft_property)


@pytest.mark.django_db
class TestPublishProperty:
    def test_publishes_valid_draft(self, publishable_property):
        result = publish_property(property_instance=publishable_property)
        assert result.status == "PENDING"
        publishable_property.refresh_from_db()
        assert publishable_property.status == "PENDING"

    def test_raises_if_not_draft(self, publishable_property):
        publishable_property.status = "ACTIVE"
        publishable_property.save()
        with pytest.raises(ValidationError, match="Only DRAFT"):
            publish_property(property_instance=publishable_property)

    def test_raises_without_description(self, publishable_property):
        publishable_property.description = ""
        publishable_property.save()
        with pytest.raises(ValidationError, match="Description"):
            publish_property(property_instance=publishable_property)

    def test_raises_without_amenities(self, publishable_property):
        publishable_property.amenities = []
        publishable_property.save()
        with pytest.raises(ValidationError, match="amenity"):
            publish_property(property_instance=publishable_property)

    def test_raises_without_enough_images(self, draft_property):
        draft_property.description = "Some description"
        draft_property.save()
        with pytest.raises(ValidationError, match="images"):
            publish_property(property_instance=draft_property)

    def test_collects_multiple_errors(self, draft_property):
        draft_property.description = ""
        draft_property.amenities = []
        draft_property.save()
        with pytest.raises(ValidationError) as exc_info:
            publish_property(property_instance=draft_property)
        messages = exc_info.value.messages
        assert len(messages) == 3


@pytest.mark.django_db
class TestDeletePropertyImage:
    def test_deletes_image(self, draft_property):
        image = PropertyImage.objects.create(
            property=draft_property, image="properties/test.jpg", order=0
        )
        delete_property_image(property_instance=draft_property, image_id=image.id)
        assert not PropertyImage.objects.filter(id=image.id).exists()

    def test_raises_for_nonexistent_image(self, draft_property):
        with pytest.raises(PropertyImage.DoesNotExist):
            delete_property_image(property_instance=draft_property, image_id=99999)
