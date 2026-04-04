import pytest
from rest_framework import status

from properties.models import ShortletImage


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
        resp = api_client.post("/api/v1/shortlets/", {"title": "Test"})
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
    def test_create_shortlet(self, api_client, owner):
        api_client.force_authenticate(user=owner)
        data = {
            "title": "New Apartment",
            "shortlet_type": "apartment",
            "city": "Lekki",
            "base_price": 50000,
            "amenities": ["WiFi"],
        }
        resp = api_client.post("/api/v1/shortlets/", data, format="json")
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["data"]["title"] == "New Apartment"
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


# --- Publish ---


@pytest.mark.django_db
class TestShortletPublish:
    def test_publish_shortlet(self, api_client, owner, publishable_shortlet):
        api_client.force_authenticate(user=owner)
        resp = api_client.post(
            f"/api/v1/shortlets/{publishable_shortlet.id}/publish/"
        )
        assert resp.status_code == status.HTTP_200_OK
        publishable_shortlet.refresh_from_db()
        assert publishable_shortlet.status == "PENDING"

    def test_publish_without_enough_images(self, api_client, owner, draft_shortlet):
        api_client.force_authenticate(user=owner)
        resp = api_client.post(f"/api/v1/shortlets/{draft_shortlet.id}/publish/")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        assert "images" in str(resp.data["error"]).lower()

    def test_publish_without_description(self, api_client, owner, publishable_shortlet):
        publishable_shortlet.description = ""
        publishable_shortlet.save()
        api_client.force_authenticate(user=owner)
        resp = api_client.post(
            f"/api/v1/shortlets/{publishable_shortlet.id}/publish/"
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_publish_without_amenities(self, api_client, owner, publishable_shortlet):
        publishable_shortlet.amenities = []
        publishable_shortlet.save()
        api_client.force_authenticate(user=owner)
        resp = api_client.post(
            f"/api/v1/shortlets/{publishable_shortlet.id}/publish/"
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_cannot_publish_non_draft(self, api_client, owner, publishable_shortlet):
        publishable_shortlet.status = "ACTIVE"
        publishable_shortlet.save()
        api_client.force_authenticate(user=owner)
        resp = api_client.post(
            f"/api/v1/shortlets/{publishable_shortlet.id}/publish/"
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST


# --- Images ---


@pytest.mark.django_db
class TestShortletImages:
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

    def test_cannot_delete_others_image(
        self, api_client, other_owner, draft_shortlet
    ):
        image = ShortletImage.objects.create(
            shortlet=draft_shortlet, image="shortlets/test.jpg", order=0
        )
        api_client.force_authenticate(user=other_owner)
        resp = api_client.delete(
            f"/api/v1/shortlets/{draft_shortlet.id}/images/{image.id}/"
        )
        assert resp.status_code == status.HTTP_404_NOT_FOUND
