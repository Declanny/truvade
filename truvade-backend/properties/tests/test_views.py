import pytest
from rest_framework import status

from properties.models import PropertyImage


# --- Authentication & Permissions ---


@pytest.mark.django_db
class TestPropertyPermissions:
    def test_unauthenticated_cannot_list(self, api_client):
        resp = api_client.get("/api/v1/properties/")
        assert resp.status_code in (
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
        )

    def test_guest_cannot_list(self, api_client, guest):
        api_client.force_authenticate(user=guest)
        resp = api_client.get("/api/v1/properties/")
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_guest_cannot_create(self, api_client, guest):
        api_client.force_authenticate(user=guest)
        resp = api_client.post("/api/v1/properties/", {"title": "Test"})
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_owner_can_list(self, api_client, owner):
        api_client.force_authenticate(user=owner)
        resp = api_client.get("/api/v1/properties/")
        assert resp.status_code == status.HTTP_200_OK

    def test_owner_cannot_see_others_properties(
        self, api_client, other_owner, draft_property
    ):
        api_client.force_authenticate(user=other_owner)
        resp = api_client.get("/api/v1/properties/")
        assert resp.status_code == status.HTTP_200_OK
        assert len(resp.data["data"]) == 0

    def test_owner_cannot_access_others_property_detail(
        self, api_client, other_owner, draft_property
    ):
        api_client.force_authenticate(user=other_owner)
        resp = api_client.get(f"/api/v1/properties/{draft_property.id}/")
        assert resp.status_code == status.HTTP_404_NOT_FOUND


# --- CRUD ---


@pytest.mark.django_db
class TestPropertyCRUD:
    def test_create_property(self, api_client, owner):
        api_client.force_authenticate(user=owner)
        data = {
            "title": "New Apartment",
            "property_type": "apartment",
            "city": "Lekki",
            "base_price": 50000,
            "amenities": ["WiFi"],
        }
        resp = api_client.post("/api/v1/properties/", data, format="json")
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["data"]["title"] == "New Apartment"
        assert resp.data["data"]["status"] == "DRAFT"
        assert resp.data["data"]["owner"] == owner.id

    def test_list_own_properties(self, api_client, owner, draft_property):
        api_client.force_authenticate(user=owner)
        resp = api_client.get("/api/v1/properties/")
        assert resp.status_code == status.HTTP_200_OK
        assert len(resp.data["data"]) == 1
        assert resp.data["data"][0]["title"] == "Draft Apartment"

    def test_retrieve_property(self, api_client, owner, draft_property):
        api_client.force_authenticate(user=owner)
        resp = api_client.get(f"/api/v1/properties/{draft_property.id}/")
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["data"]["title"] == "Draft Apartment"

    def test_update_draft_property(self, api_client, owner, draft_property):
        api_client.force_authenticate(user=owner)
        resp = api_client.patch(
            f"/api/v1/properties/{draft_property.id}/",
            {"title": "Updated Title"},
            format="json",
        )
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["data"]["title"] == "Updated Title"

    def test_cannot_update_pending_property(self, api_client, owner, draft_property):
        draft_property.status = "PENDING"
        draft_property.save()
        api_client.force_authenticate(user=owner)
        resp = api_client.patch(
            f"/api/v1/properties/{draft_property.id}/",
            {"title": "Updated"},
            format="json",
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST


# --- Publish ---


@pytest.mark.django_db
class TestPropertyPublish:
    def test_publish_property(self, api_client, owner, publishable_property):
        api_client.force_authenticate(user=owner)
        resp = api_client.post(
            f"/api/v1/properties/{publishable_property.id}/publish/"
        )
        assert resp.status_code == status.HTTP_200_OK
        publishable_property.refresh_from_db()
        assert publishable_property.status == "PENDING"

    def test_publish_without_enough_images(self, api_client, owner, draft_property):
        api_client.force_authenticate(user=owner)
        resp = api_client.post(f"/api/v1/properties/{draft_property.id}/publish/")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        assert "images" in str(resp.data["error"]).lower()

    def test_publish_without_description(self, api_client, owner, publishable_property):
        publishable_property.description = ""
        publishable_property.save()
        api_client.force_authenticate(user=owner)
        resp = api_client.post(
            f"/api/v1/properties/{publishable_property.id}/publish/"
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_publish_without_amenities(self, api_client, owner, publishable_property):
        publishable_property.amenities = []
        publishable_property.save()
        api_client.force_authenticate(user=owner)
        resp = api_client.post(
            f"/api/v1/properties/{publishable_property.id}/publish/"
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_cannot_publish_non_draft(self, api_client, owner, publishable_property):
        publishable_property.status = "ACTIVE"
        publishable_property.save()
        api_client.force_authenticate(user=owner)
        resp = api_client.post(
            f"/api/v1/properties/{publishable_property.id}/publish/"
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST


# --- Images ---


@pytest.mark.django_db
class TestPropertyImages:
    def test_delete_image(self, api_client, owner, draft_property):
        image = PropertyImage.objects.create(
            property=draft_property, image="properties/test.jpg", order=0
        )
        api_client.force_authenticate(user=owner)
        resp = api_client.delete(
            f"/api/v1/properties/{draft_property.id}/images/{image.id}/"
        )
        assert resp.status_code == status.HTTP_204_NO_CONTENT
        assert PropertyImage.objects.count() == 0

    def test_cannot_delete_others_image(
        self, api_client, other_owner, draft_property
    ):
        image = PropertyImage.objects.create(
            property=draft_property, image="properties/test.jpg", order=0
        )
        api_client.force_authenticate(user=other_owner)
        resp = api_client.delete(
            f"/api/v1/properties/{draft_property.id}/images/{image.id}/"
        )
        assert resp.status_code == status.HTTP_404_NOT_FOUND
