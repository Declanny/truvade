from django.core.exceptions import ValidationError
from django.db import transaction

from properties.models import Property, PropertyImage


@transaction.atomic
def create_property(*, owner, **validated_data):
    validated_data["status"] = Property.Status.DRAFT
    return Property.objects.create(owner=owner, **validated_data)


def check_property_editable(*, property_instance):
    if property_instance.status not in ("DRAFT", "ACTIVE"):
        raise ValidationError("Only DRAFT or ACTIVE properties can be edited.")


@transaction.atomic
def publish_property(*, property_instance):
    if property_instance.status != "DRAFT":
        raise ValidationError("Only DRAFT properties can be published.")

    errors = []
    if not property_instance.description:
        errors.append("Description is required.")
    if not property_instance.amenities:
        errors.append("At least 1 amenity is required.")
    if property_instance.images.count() < 5:
        errors.append("At least 5 images are required.")

    if errors:
        raise ValidationError(errors)

    property_instance.status = Property.Status.PENDING
    property_instance.save()
    return property_instance


@transaction.atomic
def delete_property_image(*, property_instance, image_id):
    try:
        image = property_instance.images.get(id=image_id)
    except PropertyImage.DoesNotExist:
        raise
    image.delete()
