import pytest
from rest_framework import status

from wishlists.domain.services import (
    create_wishlist,
    get_or_create_default_wishlist,
    toggle_save,
)
from wishlists.models import Wishlist, WishlistItem


@pytest.mark.django_db
class TestWishlistListCreateView:
    def test_requires_auth(self, api_client):
        resp = api_client.get("/api/v1/wishlists/")
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_get_auto_creates_default(self, api_client, guest):
        api_client.force_authenticate(user=guest)
        resp = api_client.get("/api/v1/wishlists/")
        assert resp.status_code == status.HTTP_200_OK
        data = resp.json()["data"]
        assert len(data) == 1
        assert data[0]["is_default"] is True

    def test_create_named_wishlist(self, api_client, guest):
        api_client.force_authenticate(user=guest)
        resp = api_client.post(
            "/api/v1/wishlists/",
            {"name": "Lagos getaway"},
            format="json",
        )
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.json()["data"]["name"] == "Lagos getaway"


@pytest.mark.django_db
class TestWishlistDetailView:
    def test_cannot_access_others_wishlist(self, api_client, guest, other_guest):
        wl = create_wishlist(user=other_guest, name="Theirs")
        api_client.force_authenticate(user=guest)
        resp = api_client.get(f"/api/v1/wishlists/{wl.id}/")
        assert resp.status_code == status.HTTP_404_NOT_FOUND

    def test_patch_renames(self, api_client, guest):
        wl = create_wishlist(user=guest, name="Old")
        api_client.force_authenticate(user=guest)
        resp = api_client.patch(
            f"/api/v1/wishlists/{wl.id}/",
            {"name": "New"},
            format="json",
        )
        assert resp.status_code == status.HTTP_200_OK
        wl.refresh_from_db()
        assert wl.name == "New"

    def test_delete_protected_for_default(self, api_client, guest):
        wl = get_or_create_default_wishlist(user=guest)
        api_client.force_authenticate(user=guest)
        resp = api_client.delete(f"/api/v1/wishlists/{wl.id}/")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        assert Wishlist.objects.filter(pk=wl.pk).exists()


@pytest.mark.django_db
class TestWishlistItemsView:
    def test_add_then_remove(self, api_client, guest, shortlet):
        wl = create_wishlist(user=guest, name="X")
        api_client.force_authenticate(user=guest)

        resp = api_client.post(
            f"/api/v1/wishlists/{wl.id}/items/",
            {"shortlet_id": shortlet.id},
            format="json",
        )
        assert resp.status_code == status.HTTP_201_CREATED
        assert WishlistItem.objects.filter(wishlist=wl).count() == 1

        # Second add is a no-op 200, not a 201.
        resp2 = api_client.post(
            f"/api/v1/wishlists/{wl.id}/items/",
            {"shortlet_id": shortlet.id},
            format="json",
        )
        assert resp2.status_code == status.HTTP_200_OK

        resp3 = api_client.delete(f"/api/v1/wishlists/{wl.id}/items/{shortlet.id}/")
        assert resp3.status_code == status.HTTP_200_OK
        assert WishlistItem.objects.filter(wishlist=wl).count() == 0

    def test_unknown_shortlet_404(self, api_client, guest):
        wl = create_wishlist(user=guest, name="X")
        api_client.force_authenticate(user=guest)
        resp = api_client.post(
            f"/api/v1/wishlists/{wl.id}/items/",
            {"shortlet_id": 99999},
            format="json",
        )
        assert resp.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
class TestToggleSaveView:
    def test_toggles_on_then_off(self, api_client, guest, shortlet):
        api_client.force_authenticate(user=guest)
        r1 = api_client.post(
            "/api/v1/wishlists/toggle/",
            {"shortlet_id": shortlet.id},
            format="json",
        )
        assert r1.status_code == status.HTTP_200_OK
        assert r1.json()["data"]["saved"] is True

        r2 = api_client.post(
            "/api/v1/wishlists/toggle/",
            {"shortlet_id": shortlet.id},
            format="json",
        )
        assert r2.json()["data"]["saved"] is False


@pytest.mark.django_db
class TestSavedIdsView:
    def test_returns_caller_ids_only(
        self, api_client, guest, other_guest, shortlet, other_shortlet
    ):
        toggle_save(user=guest, shortlet=shortlet)
        toggle_save(user=other_guest, shortlet=other_shortlet)

        api_client.force_authenticate(user=guest)
        resp = api_client.get("/api/v1/wishlists/saved-ids/")
        assert resp.status_code == status.HTTP_200_OK
        assert resp.json()["data"] == {"shortlet_ids": [shortlet.id]}


@pytest.mark.django_db
class TestRecentlyViewedView:
    def test_post_records_view(self, api_client, guest, shortlet):
        api_client.force_authenticate(user=guest)
        resp = api_client.post(
            "/api/v1/recently-viewed/",
            {"shortlet_id": shortlet.id},
            format="json",
        )
        # success_response with 204 still returns JSON body; just check 2xx.
        assert resp.status_code in (
            status.HTTP_200_OK,
            status.HTTP_204_NO_CONTENT,
        )

        resp2 = api_client.get("/api/v1/recently-viewed/")
        assert resp2.status_code == status.HTTP_200_OK
        ids = [r["shortlet"]["id"] for r in resp2.json()["data"]]
        assert ids == [shortlet.id]
