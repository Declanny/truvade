from django.core.exceptions import ValidationError
from django.db import transaction

from accounts.models import OwnerHostMembership
from shortlet.models import Shortlet, ShortletHostAssignment, ShortletImage


@transaction.atomic
def create_shortlet(*, owner, **validated_data):
    validated_data["status"] = Shortlet.Status.DRAFT
    return Shortlet.objects.create(owner=owner, **validated_data)


def check_shortlet_editable(*, shortlet):
    if shortlet.status not in ("DRAFT", "ACTIVE"):
        raise ValidationError("Only DRAFT or ACTIVE shortlets can be edited.")


@transaction.atomic
def publish_shortlet(*, shortlet):
    if not shortlet.owner.is_verified:
        raise ValidationError(
            "You must complete identity verification before publishing."
        )

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
    if not shortlet.host_assignments.exists():
        errors.append("At least 1 host must be assigned.")

    if errors:
        raise ValidationError(errors)

    shortlet.status = Shortlet.Status.PENDING
    shortlet.save()
    return shortlet


@transaction.atomic
def upload_shortlet_images(*, shortlet, images):
    created = []
    next_order = shortlet.images.count()
    for image in images:
        obj = ShortletImage.objects.create(
            shortlet=shortlet, image=image, order=next_order
        )
        created.append(obj)
        next_order += 1
    return created


@transaction.atomic
def delete_shortlet_image(*, shortlet, image_id):
    try:
        image = shortlet.images.get(id=image_id)
    except ShortletImage.DoesNotExist:
        raise
    image.delete()


# --- Host Assignment ---


@transaction.atomic
def assign_host_to_shortlet(*, shortlet, host, role, assigned_by):
    """Assign a verified host to a shortlet as HOST or COHOST."""
    if host.role != "HOST":
        raise ValidationError("Only users with the HOST role can be assigned.")

    if not host.is_verified:
        raise ValidationError("Host must be verified before assignment.")

    if not OwnerHostMembership.objects.filter(
        owner=shortlet.owner, host=host, is_active=True
    ).exists():
        raise ValidationError("Host is not linked to this shortlet's owner.")

    if ShortletHostAssignment.objects.filter(shortlet=shortlet, host=host).exists():
        raise ValidationError("This host is already assigned to this shortlet.")

    if ShortletHostAssignment.objects.filter(shortlet=shortlet, role=role).exists():
        raise ValidationError(f"A {role} is already assigned to this shortlet.")

    return ShortletHostAssignment.objects.create(
        shortlet=shortlet, host=host, role=role, assigned_by=assigned_by
    )


@transaction.atomic
def unassign_host_from_shortlet(*, shortlet, assignment_id, owner):
    """Remove a host assignment from a shortlet."""
    try:
        assignment = ShortletHostAssignment.objects.get(
            id=assignment_id, shortlet=shortlet, shortlet__owner=owner
        )
    except ShortletHostAssignment.DoesNotExist:
        raise ValidationError("Assignment not found.")

    assignment.delete()


@transaction.atomic
def update_host_assignment_permissions(
    *, assignment_id, owner, can_edit, can_upload_images
):
    """Update permissions for a host assignment."""
    try:
        assignment = ShortletHostAssignment.objects.get(
            id=assignment_id, shortlet__owner=owner
        )
    except ShortletHostAssignment.DoesNotExist:
        raise ValidationError("Assignment not found.")

    assignment.can_edit = can_edit
    assignment.can_upload_images = can_upload_images
    assignment.save()
    return assignment
