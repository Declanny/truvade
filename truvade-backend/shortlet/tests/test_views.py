import pytest
from rest_framework import status

from shortlet.models import ShortletHostAssignment, ShortletImage


# --- Authentication & Permissions ---


@pytest.mark.django_db
class TestShortletPermissions:
    def test_unauthenticated_cannot_list(self, api_client):
        resp = api_client.get("/api/v1/shortlets/")
        assert resp.status_code in (
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
        )

    def test_guest_cannot_list(self, api_client, guest):
        api_client.force_authenticate(user=guest)
        resp = api_client.get("/api/v1/shortlets/")
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_guest_cannot_create(self, api_client, guest):
        api_client.force_authenticate(user=guest)
        resp = api_client.post("/api/v1/shortlets/", {"shortlet_type": "apartment"})
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_owner_can_list(self, api_client, owner):
        api_client.force_authenticate(user=owner)
        resp = api_client.get("/api/v1/shortlets/")
        assert resp.status_code == status.HTTP_200_OK

    def test_owner_cannot_see_others_shortlets(
        self, api_client, other_owner, draft_shortlet
    ):
        api_client.force_authenticate(user=other_owner)
        resp = api_client.get("/api/v1/shortlets/")
        assert resp.status_code == status.HTTP_200_OK
        assert len(resp.data["data"]) == 0

    def test_owner_cannot_access_others_shortlet_detail(
        self, api_client, other_owner, draft_shortlet
    ):
        api_client.force_authenticate(user=other_owner)
        resp = api_client.get(f"/api/v1/shortlets/{draft_shortlet.id}/")
        assert resp.status_code == status.HTTP_404_NOT_FOUND


# --- CRUD ---


@pytest.mark.django_db
class TestShortletCRUD:
    def test_create_shortlet_with_only_type(self, api_client, owner):
        api_client.force_authenticate(user=owner)
        data = {"shortlet_type": "apartment"}
        resp = api_client.post("/api/v1/shortlets/", data, format="json")
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["data"]["shortlet_type"] == "apartment"
        assert resp.data["data"]["status"] == "DRAFT"
        assert resp.data["data"]["owner"] == owner.id

    def test_list_own_shortlets(self, api_client, owner, draft_shortlet):
        api_client.force_authenticate(user=owner)
        resp = api_client.get("/api/v1/shortlets/")
        assert resp.status_code == status.HTTP_200_OK
        assert len(resp.data["data"]) == 1
        assert resp.data["data"][0]["title"] == "Draft Apartment"

    def test_retrieve_shortlet(self, api_client, owner, draft_shortlet):
        api_client.force_authenticate(user=owner)
        resp = api_client.get(f"/api/v1/shortlets/{draft_shortlet.id}/")
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["data"]["title"] == "Draft Apartment"

    def test_update_draft_shortlet(self, api_client, owner, draft_shortlet):
        api_client.force_authenticate(user=owner)
        resp = api_client.patch(
            f"/api/v1/shortlets/{draft_shortlet.id}/",
            {"title": "Updated Title"},
            format="json",
        )
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["data"]["title"] == "Updated Title"

    def test_cannot_update_pending_shortlet(self, api_client, owner, draft_shortlet):
        draft_shortlet.status = "PENDING"
        draft_shortlet.save()
        api_client.force_authenticate(user=owner)
        resp = api_client.patch(
            f"/api/v1/shortlets/{draft_shortlet.id}/",
            {"title": "Updated"},
            format="json",
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST


# --- Step-by-step flow ---


@pytest.mark.django_db
class TestShortletStepByStepFlow:
    def test_full_listing_flow(self, api_client, verified_owner, host):
        api_client.force_authenticate(user=verified_owner)

        # Step 1: Create with only shortlet type
        resp = api_client.post(
            "/api/v1/shortlets/",
            {"shortlet_type": "villa"},
            format="json",
        )
        assert resp.status_code == status.HTTP_201_CREATED
        shortlet_id = resp.data["data"]["id"]
        assert resp.data["data"]["status"] == "DRAFT"

        # Step 2: Fill in details via PATCH
        api_client.patch(
            f"/api/v1/shortlets/{shortlet_id}/",
            {
                "title": "Beautiful Villa",
                "description": "A stunning villa by the ocean",
                "city": "Lekki",
                "base_price": 150000,
                "amenities": ["WiFi", "Pool"],
            },
            format="json",
        )

        # Step 3: Add images (simulate via direct creation)
        for i in range(5):
            ShortletImage.objects.create(
                shortlet_id=shortlet_id, image=f"shortlets/img{i}.jpg", order=i
            )

        # Step 4: Assign a host
        resp = api_client.post(
            f"/api/v1/shortlets/{shortlet_id}/assign-host/",
            {"host_id": host.id, "role": "HOST"},
            format="json",
        )
        assert resp.status_code == status.HTTP_201_CREATED

        # Step 5: Publish
        resp = api_client.post(f"/api/v1/shortlets/{shortlet_id}/publish/")
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["data"]["status"] == "PENDING"

    def test_cannot_publish_incomplete_draft(self, api_client, verified_owner):
        api_client.force_authenticate(user=verified_owner)

        # Create minimal draft
        resp = api_client.post(
            "/api/v1/shortlets/",
            {"shortlet_type": "apartment"},
            format="json",
        )
        shortlet_id = resp.data["data"]["id"]

        # Try to publish without filling details
        resp = api_client.post(f"/api/v1/shortlets/{shortlet_id}/publish/")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        error_str = str(resp.data["error"]).lower()
        assert "title" in error_str
        assert "city" in error_str
        assert "base price" in error_str


# --- Publish ---


@pytest.mark.django_db
class TestShortletPublish:
    def test_publish_shortlet(self, api_client, owner, publishable_shortlet):
        api_client.force_authenticate(user=owner)
        resp = api_client.post(f"/api/v1/shortlets/{publishable_shortlet.id}/publish/")
        assert resp.status_code == status.HTTP_200_OK
        publishable_shortlet.refresh_from_db()
        assert publishable_shortlet.status == "PENDING"

    def test_publish_without_enough_images(
        self, api_client, verified_owner, draft_shortlet
    ):
        api_client.force_authenticate(user=verified_owner)
        resp = api_client.post(f"/api/v1/shortlets/{draft_shortlet.id}/publish/")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        assert "images" in str(resp.data["error"]).lower()

    def test_publish_without_description(self, api_client, owner, publishable_shortlet):
        publishable_shortlet.description = ""
        publishable_shortlet.save()
        api_client.force_authenticate(user=owner)
        resp = api_client.post(f"/api/v1/shortlets/{publishable_shortlet.id}/publish/")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_publish_without_amenities(self, api_client, owner, publishable_shortlet):
        publishable_shortlet.amenities = []
        publishable_shortlet.save()
        api_client.force_authenticate(user=owner)
        resp = api_client.post(f"/api/v1/shortlets/{publishable_shortlet.id}/publish/")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_cannot_publish_non_draft(self, api_client, owner, publishable_shortlet):
        publishable_shortlet.status = "ACTIVE"
        publishable_shortlet.save()
        api_client.force_authenticate(user=owner)
        resp = api_client.post(f"/api/v1/shortlets/{publishable_shortlet.id}/publish/")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST


# --- Image Upload ---


@pytest.mark.django_db
class TestShortletImageUpload:
    def test_upload_images(self, api_client, owner, draft_shortlet):
        from django.core.files.uploadedfile import SimpleUploadedFile

        api_client.force_authenticate(user=owner)
        files = [
            SimpleUploadedFile(
                f"img{i}.jpg", b"fake-image-data", content_type="image/jpeg"
            )
            for i in range(3)
        ]
        resp = api_client.post(
            f"/api/v1/shortlets/{draft_shortlet.id}/upload-images/",
            {"images": files},
            format="multipart",
        )
        assert resp.status_code == status.HTTP_201_CREATED
        assert len(resp.data["data"]) == 3

    def test_upload_no_files_returns_error(self, api_client, owner, draft_shortlet):
        api_client.force_authenticate(user=owner)
        resp = api_client.post(
            f"/api/v1/shortlets/{draft_shortlet.id}/upload-images/",
            {},
            format="multipart",
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_cannot_upload_to_others_shortlet(
        self, api_client, other_owner, draft_shortlet
    ):
        from django.core.files.uploadedfile import SimpleUploadedFile

        api_client.force_authenticate(user=other_owner)
        files = [SimpleUploadedFile("img.jpg", b"fake", content_type="image/jpeg")]
        resp = api_client.post(
            f"/api/v1/shortlets/{draft_shortlet.id}/upload-images/",
            {"images": files},
            format="multipart",
        )
        assert resp.status_code == status.HTTP_404_NOT_FOUND


# --- Image Delete ---


@pytest.mark.django_db
class TestShortletImageDelete:
    def test_delete_image(self, api_client, owner, draft_shortlet):
        image = ShortletImage.objects.create(
            shortlet=draft_shortlet, image="shortlets/test.jpg", order=0
        )
        api_client.force_authenticate(user=owner)
        resp = api_client.delete(
            f"/api/v1/shortlets/{draft_shortlet.id}/images/{image.id}/"
        )
        assert resp.status_code == status.HTTP_204_NO_CONTENT
        assert ShortletImage.objects.count() == 0

    def test_cannot_delete_others_image(self, api_client, other_owner, draft_shortlet):
        image = ShortletImage.objects.create(
            shortlet=draft_shortlet, image="shortlets/test.jpg", order=0
        )
        api_client.force_authenticate(user=other_owner)
        resp = api_client.delete(
            f"/api/v1/shortlets/{draft_shortlet.id}/images/{image.id}/"
        )
        assert resp.status_code == status.HTTP_404_NOT_FOUND


# --- Host Assignment ---


@pytest.mark.django_db
class TestAssignHostView:
    def test_assign_success(self, api_client, owner, draft_shortlet, host):
        api_client.force_authenticate(user=owner)
        resp = api_client.post(
            f"/api/v1/shortlets/{draft_shortlet.id}/assign-host/",
            {"host_id": host.id, "role": "HOST"},
            format="json",
        )
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["data"]["role"] == "HOST"
        assert resp.data["data"]["host"] == host.id

    def test_403_for_non_owner(self, api_client, guest, draft_shortlet, host):
        api_client.force_authenticate(user=guest)
        resp = api_client.post(
            f"/api/v1/shortlets/{draft_shortlet.id}/assign-host/",
            {"host_id": host.id, "role": "HOST"},
            format="json",
        )
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_400_unverified_host(
        self, api_client, owner, draft_shortlet, unverified_host
    ):
        api_client.force_authenticate(user=owner)
        resp = api_client.post(
            f"/api/v1/shortlets/{draft_shortlet.id}/assign-host/",
            {"host_id": unverified_host.id, "role": "HOST"},
            format="json",
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_400_unlinked_host(self, api_client, owner, draft_shortlet, unlinked_host):
        api_client.force_authenticate(user=owner)
        resp = api_client.post(
            f"/api/v1/shortlets/{draft_shortlet.id}/assign-host/",
            {"host_id": unlinked_host.id, "role": "HOST"},
            format="json",
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestUnassignHostView:
    def test_unassign_success(self, api_client, owner, draft_shortlet, assignment):
        api_client.force_authenticate(user=owner)
        resp = api_client.delete(
            f"/api/v1/shortlets/{draft_shortlet.id}/assignments/{assignment.id}/"
        )
        assert resp.status_code == status.HTTP_204_NO_CONTENT
        assert not ShortletHostAssignment.objects.filter(id=assignment.id).exists()

    def test_404_wrong_shortlet(self, api_client, owner, assignment):
        api_client.force_authenticate(user=owner)
        resp = api_client.delete("/api/v1/shortlets/99999/assignments/{assignment.id}/")
        assert resp.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
class TestUpdateAssignmentPermissionsView:
    def test_update_success(self, api_client, owner, draft_shortlet, assignment):
        api_client.force_authenticate(user=owner)
        resp = api_client.patch(
            f"/api/v1/shortlets/{draft_shortlet.id}/assignments/{assignment.id}/permissions/",
            {"can_edit": True, "can_upload_images": True},
            format="json",
        )
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["data"]["can_edit"] is True
        assert resp.data["data"]["can_upload_images"] is True


@pytest.mark.django_db
class TestAvailableHostsView:
    def test_returns_available_hosts(
        self, api_client, owner, draft_shortlet, host, another_host
    ):
        api_client.force_authenticate(user=owner)
        resp = api_client.get(f"/api/v1/shortlets/{draft_shortlet.id}/available-hosts/")
        assert resp.status_code == status.HTTP_200_OK
        assert len(resp.data["data"]) == 2

    def test_excludes_already_assigned(
        self, api_client, owner, draft_shortlet, host, another_host, assignment
    ):
        api_client.force_authenticate(user=owner)
        resp = api_client.get(f"/api/v1/shortlets/{draft_shortlet.id}/available-hosts/")
        assert resp.status_code == status.HTTP_200_OK
        assert len(resp.data["data"]) == 1
        assert resp.data["data"][0]["id"] == another_host.id


@pytest.mark.django_db
class TestHostShortletListView:
    def test_host_sees_assigned_shortlets(
        self, api_client, host, draft_shortlet, assignment
    ):
        api_client.force_authenticate(user=host)
        resp = api_client.get("/api/v1/my-shortlets/")
        assert resp.status_code == status.HTTP_200_OK
        assert len(resp.data["data"]) == 1
        assert resp.data["data"][0]["id"] == draft_shortlet.id

    def test_403_for_non_host(self, api_client, owner):
        api_client.force_authenticate(user=owner)
        resp = api_client.get("/api/v1/my-shortlets/")
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_host_without_assignments_gets_empty(self, api_client, host):
        api_client.force_authenticate(user=host)
        resp = api_client.get("/api/v1/my-shortlets/")
        assert resp.status_code == status.HTTP_200_OK
        assert len(resp.data["data"]) == 0


@pytest.mark.django_db
class TestShortletResponseIncludesAssignments:
    def test_shortlet_detail_includes_host_assignments(
        self, api_client, owner, draft_shortlet, assignment
    ):
        api_client.force_authenticate(user=owner)
        resp = api_client.get(f"/api/v1/shortlets/{draft_shortlet.id}/")
        assert resp.status_code == status.HTTP_200_OK
        assert "host_assignments" in resp.data["data"]
        assert len(resp.data["data"]["host_assignments"]) == 1
