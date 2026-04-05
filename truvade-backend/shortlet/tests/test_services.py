import pytest
from django.core.exceptions import ValidationError

from shortlet.domain.services import (
    assign_host_to_shortlet,
    check_shortlet_editable,
    create_shortlet,
    delete_shortlet_image,
    publish_shortlet,
    unassign_host_from_shortlet,
    update_host_assignment_permissions,
    upload_shortlet_images,
)
from shortlet.models import Shortlet, ShortletHostAssignment, ShortletImage


@pytest.mark.django_db
class TestCreateShortlet:
    def test_creates_shortlet_with_only_type(self, owner):
        shortlet = create_shortlet(
            owner=owner,
            shortlet_type="apartment",
        )
        assert shortlet.pk is not None
        assert shortlet.status == "DRAFT"
        assert shortlet.owner == owner
        assert shortlet.shortlet_type == "apartment"

    def test_forces_draft_even_if_status_passed(self, owner):
        shortlet = create_shortlet(
            owner=owner,
            shortlet_type="apartment",
            status="ACTIVE",
        )
        assert shortlet.status == "DRAFT"


@pytest.mark.django_db
class TestCheckShortletEditable:
    def test_passes_for_draft(self, draft_shortlet):
        check_shortlet_editable(shortlet=draft_shortlet)

    def test_passes_for_active(self, draft_shortlet):
        draft_shortlet.status = "ACTIVE"
        draft_shortlet.save()
        check_shortlet_editable(shortlet=draft_shortlet)

    @pytest.mark.parametrize("status_value", ["PENDING", "INACTIVE", "ARCHIVED"])
    def test_raises_for_non_editable_status(self, draft_shortlet, status_value):
        draft_shortlet.status = status_value
        draft_shortlet.save()
        with pytest.raises(ValidationError):
            check_shortlet_editable(shortlet=draft_shortlet)


@pytest.mark.django_db
class TestPublishShortlet:
    def test_publishes_valid_draft(self, publishable_shortlet):
        result = publish_shortlet(shortlet=publishable_shortlet)
        assert result.status == "PENDING"
        publishable_shortlet.refresh_from_db()
        assert publishable_shortlet.status == "PENDING"

    def test_raises_if_not_draft(self, publishable_shortlet):
        publishable_shortlet.status = "ACTIVE"
        publishable_shortlet.save()
        with pytest.raises(ValidationError, match="Only DRAFT"):
            publish_shortlet(shortlet=publishable_shortlet)

    def test_raises_without_title(self, publishable_shortlet):
        publishable_shortlet.title = ""
        publishable_shortlet.save()
        with pytest.raises(ValidationError, match="Title"):
            publish_shortlet(shortlet=publishable_shortlet)

    def test_raises_without_city(self, publishable_shortlet):
        publishable_shortlet.city = ""
        publishable_shortlet.save()
        with pytest.raises(ValidationError, match="City"):
            publish_shortlet(shortlet=publishable_shortlet)

    def test_raises_without_base_price(self, publishable_shortlet):
        publishable_shortlet.base_price = None
        publishable_shortlet.save()
        with pytest.raises(ValidationError, match="Base price"):
            publish_shortlet(shortlet=publishable_shortlet)

    def test_raises_without_description(self, publishable_shortlet):
        publishable_shortlet.description = ""
        publishable_shortlet.save()
        with pytest.raises(ValidationError, match="Description"):
            publish_shortlet(shortlet=publishable_shortlet)

    def test_raises_without_amenities(self, publishable_shortlet):
        publishable_shortlet.amenities = []
        publishable_shortlet.save()
        with pytest.raises(ValidationError, match="amenity"):
            publish_shortlet(shortlet=publishable_shortlet)

    def test_raises_without_enough_images(self, verified_owner):
        shortlet = Shortlet.objects.create(
            owner=verified_owner,
            title="Draft Apartment",
            description="Some description",
            shortlet_type="apartment",
            city="Victoria Island",
            state="Lagos",
            bedrooms=3,
            bathrooms=2,
            max_guests=6,
            base_price=85000,
            amenities=["WiFi", "Pool"],
        )
        with pytest.raises(ValidationError, match="images"):
            publish_shortlet(shortlet=shortlet)

    def test_collects_multiple_errors(self, verified_owner):
        shortlet = Shortlet.objects.create(
            owner=verified_owner, shortlet_type="apartment"
        )
        with pytest.raises(ValidationError) as exc_info:
            publish_shortlet(shortlet=shortlet)
        messages = exc_info.value.messages
        assert len(messages) == 6

    def test_raises_if_owner_not_verified(self, owner):
        shortlet = Shortlet.objects.create(
            owner=owner,
            title="Test",
            description="Test description",
            shortlet_type="apartment",
            city="Lagos",
            base_price=50000,
            amenities=["WiFi"],
        )
        for i in range(5):
            ShortletImage.objects.create(
                shortlet=shortlet, image=f"shortlets/img{i}.jpg", order=i
            )
        with pytest.raises(ValidationError, match="identity verification"):
            publish_shortlet(shortlet=shortlet)


@pytest.mark.django_db
class TestUploadShortletImages:
    def test_creates_images_with_correct_order(self, draft_shortlet):
        from django.core.files.uploadedfile import SimpleUploadedFile

        files = [
            SimpleUploadedFile(
                f"img{i}.jpg", b"fake-image-data", content_type="image/jpeg"
            )
            for i in range(3)
        ]
        created = upload_shortlet_images(shortlet=draft_shortlet, images=files)
        assert len(created) == 3
        assert [img.order for img in created] == [0, 1, 2]

    def test_appends_to_existing_images(self, draft_shortlet):
        from django.core.files.uploadedfile import SimpleUploadedFile

        ShortletImage.objects.create(
            shortlet=draft_shortlet, image="shortlets/existing.jpg", order=0
        )
        files = [
            SimpleUploadedFile("new.jpg", b"fake-image-data", content_type="image/jpeg")
        ]
        created = upload_shortlet_images(shortlet=draft_shortlet, images=files)
        assert created[0].order == 1


@pytest.mark.django_db
class TestDeleteShortletImage:
    def test_deletes_image(self, draft_shortlet):
        image = ShortletImage.objects.create(
            shortlet=draft_shortlet, image="shortlets/test.jpg", order=0
        )
        delete_shortlet_image(shortlet=draft_shortlet, image_id=image.id)
        assert not ShortletImage.objects.filter(id=image.id).exists()

    def test_raises_for_nonexistent_image(self, draft_shortlet):
        with pytest.raises(ShortletImage.DoesNotExist):
            delete_shortlet_image(shortlet=draft_shortlet, image_id=99999)


# --- Host Assignment ---


@pytest.mark.django_db
class TestAssignHostToShortlet:
    def test_assign_verified_host(self, draft_shortlet, host, owner):
        assignment = assign_host_to_shortlet(
            shortlet=draft_shortlet, host=host, role="HOST", assigned_by=owner
        )
        assert assignment.shortlet == draft_shortlet
        assert assignment.host == host
        assert assignment.role == "HOST"
        assert assignment.assigned_by == owner
        assert assignment.can_edit is False
        assert assignment.can_upload_images is False

    def test_assign_cohost(self, draft_shortlet, another_host, owner):
        assignment = assign_host_to_shortlet(
            shortlet=draft_shortlet,
            host=another_host,
            role="COHOST",
            assigned_by=owner,
        )
        assert assignment.role == "COHOST"

    def test_assign_both_host_and_cohost(
        self, draft_shortlet, host, another_host, owner
    ):
        assign_host_to_shortlet(
            shortlet=draft_shortlet, host=host, role="HOST", assigned_by=owner
        )
        assign_host_to_shortlet(
            shortlet=draft_shortlet,
            host=another_host,
            role="COHOST",
            assigned_by=owner,
        )
        assert draft_shortlet.host_assignments.count() == 2

    def test_unverified_host_raises(self, draft_shortlet, unverified_host, owner):
        with pytest.raises(ValidationError, match="verified"):
            assign_host_to_shortlet(
                shortlet=draft_shortlet,
                host=unverified_host,
                role="HOST",
                assigned_by=owner,
            )

    def test_unlinked_host_raises(self, draft_shortlet, unlinked_host, owner):
        with pytest.raises(ValidationError, match="not linked"):
            assign_host_to_shortlet(
                shortlet=draft_shortlet,
                host=unlinked_host,
                role="HOST",
                assigned_by=owner,
            )

    def test_duplicate_role_raises(self, draft_shortlet, host, another_host, owner):
        assign_host_to_shortlet(
            shortlet=draft_shortlet, host=host, role="HOST", assigned_by=owner
        )
        with pytest.raises(ValidationError, match="already assigned"):
            assign_host_to_shortlet(
                shortlet=draft_shortlet,
                host=another_host,
                role="HOST",
                assigned_by=owner,
            )

    def test_same_host_both_roles_raises(self, draft_shortlet, host, owner):
        assign_host_to_shortlet(
            shortlet=draft_shortlet, host=host, role="HOST", assigned_by=owner
        )
        with pytest.raises(ValidationError, match="already assigned"):
            assign_host_to_shortlet(
                shortlet=draft_shortlet, host=host, role="COHOST", assigned_by=owner
            )

    def test_non_host_role_raises(self, draft_shortlet, owner):
        """A user with GUEST role can't be assigned."""
        from django.contrib.auth import get_user_model

        User = get_user_model()
        guest = User.objects.create_user(email="guestuser@example.com", role="GUEST")
        with pytest.raises(ValidationError, match="HOST role"):
            assign_host_to_shortlet(
                shortlet=draft_shortlet, host=guest, role="HOST", assigned_by=owner
            )


@pytest.mark.django_db
class TestUnassignHostFromShortlet:
    def test_unassign(self, draft_shortlet, assignment, owner):
        unassign_host_from_shortlet(
            shortlet=draft_shortlet, assignment_id=assignment.id, owner=owner
        )
        assert not ShortletHostAssignment.objects.filter(id=assignment.id).exists()

    def test_not_found_raises(self, draft_shortlet, owner):
        with pytest.raises(ValidationError, match="not found"):
            unassign_host_from_shortlet(
                shortlet=draft_shortlet, assignment_id=999, owner=owner
            )

    def test_wrong_owner_raises(self, draft_shortlet, assignment, other_owner):
        with pytest.raises(ValidationError, match="not found"):
            unassign_host_from_shortlet(
                shortlet=draft_shortlet,
                assignment_id=assignment.id,
                owner=other_owner,
            )


@pytest.mark.django_db
class TestUpdateHostAssignmentPermissions:
    def test_update_permissions(self, assignment, owner):
        result = update_host_assignment_permissions(
            assignment_id=assignment.id,
            owner=owner,
            can_edit=True,
            can_upload_images=True,
        )
        assert result.can_edit is True
        assert result.can_upload_images is True

    def test_wrong_owner_raises(self, assignment, other_owner):
        with pytest.raises(ValidationError, match="not found"):
            update_host_assignment_permissions(
                assignment_id=assignment.id,
                owner=other_owner,
                can_edit=True,
                can_upload_images=False,
            )
