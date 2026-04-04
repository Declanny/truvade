from django.core.exceptions import ValidationError
from django.db import transaction

from properties.models import Shortlet, ShortletImage


@transaction.atomic
def create_shortlet(*, owner, **validated_data):
    validated_data["status"] = Shortlet.Status.DRAFT
    return Shortlet.objects.create(owner=owner, **validated_data)


def check_shortlet_editable(*, shortlet):
    if shortlet.status not in ("DRAFT", "ACTIVE"):
        raise ValidationError("Only DRAFT or ACTIVE shortlets can be edited.")


@transaction.atomic
def publish_shortlet(*, shortlet):
    if shortlet.status != "DRAFT":
        raise ValidationError("Only DRAFT shortlets can be published.")

    errors = []
    if not shortlet.title:
        errors.append("Title is required.")
    if not shortlet.city:
        errors.append("City is required.")
    if shortlet.base_price is None:
        errors.append("Base price is required.")
    if not shortlet.description:
        errors.append("Description is required.")
    if not shortlet.amenities:
        errors.append("At least 1 amenity is required.")
    if shortlet.images.count() < 5:
        errors.append("At least 5 images are required.")

    if errors:
        raise ValidationError(errors)

    shortlet.status = Shortlet.Status.PENDING
    shortlet.save()
    return shortlet


@transaction.atomic
def delete_shortlet_image(*, shortlet, image_id):
    try:
        image = shortlet.images.get(id=image_id)
    except ShortletImage.DoesNotExist:
        raise
    image.delete()
