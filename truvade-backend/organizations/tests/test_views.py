import pytest
from rest_framework import status

from organizations.domain.services import (
    create_organization,
    invite_member,
)
from organizations.models import OrganizationInvitation, OrganizationMember


@pytest.mark.django_db
class TestMyOrganizationView:
    def test_requires_auth(self, api_client):
        resp = api_client.get("/api/v1/organization/")
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_returns_null_when_no_org(self, api_client, owner):
        api_client.force_authenticate(user=owner)
        resp = api_client.get("/api/v1/organization/")
        assert resp.status_code == status.HTTP_200_OK
        assert resp.json()["data"] is None

    def test_create_organization(self, api_client, owner):
        api_client.force_authenticate(user=owner)
        resp = api_client.post(
            "/api/v1/organization/",
            {"name": "Acme Stays"},
            format="json",
        )
        assert resp.status_code == status.HTTP_201_CREATED
        data = resp.json()["data"]
        assert data["name"] == "Acme Stays"
        assert data["member_count"] == 1

    def test_create_twice_fails(self, api_client, owner):
        api_client.force_authenticate(user=owner)
        api_client.post("/api/v1/organization/", {"name": "First"}, format="json")
        resp = api_client.post(
            "/api/v1/organization/", {"name": "Second"}, format="json"
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_patch_updates_org(self, api_client, owner):
        create_organization(owner=owner, name="Acme")
        api_client.force_authenticate(user=owner)
        resp = api_client.patch(
            "/api/v1/organization/",
            {"contact_email": "hello@acme.test"},
            format="json",
        )
        assert resp.status_code == status.HTTP_200_OK
        assert resp.json()["data"]["contact_email"] == "hello@acme.test"


@pytest.mark.django_db
class TestInvitationsView:
    def test_owner_invites(self, api_client, owner):
        create_organization(owner=owner, name="Acme")
        api_client.force_authenticate(user=owner)
        resp = api_client.post(
            "/api/v1/organization/invitations/",
            {"email": "new@example.com", "role": "HOST"},
            format="json",
        )
        assert resp.status_code == status.HTTP_201_CREATED
        assert (
            OrganizationInvitation.objects.filter(email="new@example.com").count() == 1
        )

    def test_non_owner_cannot_invite(self, api_client, owner, stranger):
        create_organization(owner=owner, name="Acme")
        api_client.force_authenticate(user=stranger)
        resp = api_client.post(
            "/api/v1/organization/invitations/",
            {"email": "x@example.com"},
            format="json",
        )
        # No org for stranger -> 404
        assert resp.status_code == status.HTTP_404_NOT_FOUND

    def test_lists_org_invitations(self, api_client, owner):
        org = create_organization(owner=owner, name="Acme")
        invite_member(
            organization=org,
            inviter=owner,
            email="one@example.com",
            role=OrganizationMember.Role.HOST,
        )
        invite_member(
            organization=org,
            inviter=owner,
            email="two@example.com",
            role=OrganizationMember.Role.MANAGER,
        )
        api_client.force_authenticate(user=owner)
        resp = api_client.get("/api/v1/organization/invitations/")
        assert resp.status_code == status.HTTP_200_OK
        assert len(resp.json()["data"]) == 2


@pytest.mark.django_db
class TestInvitationAction:
    def test_invitee_accepts(self, api_client, owner, invitee):
        org = create_organization(owner=owner, name="Acme")
        inv = invite_member(
            organization=org,
            inviter=owner,
            email=invitee.email,
            role=OrganizationMember.Role.HOST,
        )
        api_client.force_authenticate(user=invitee)
        resp = api_client.post(f"/api/v1/organization-invitations/{inv.token}/")
        assert resp.status_code == status.HTTP_200_OK
        assert OrganizationMember.objects.filter(
            organization=org, user=invitee
        ).exists()

    def test_wrong_user_forbidden(self, api_client, owner, invitee, stranger):
        org = create_organization(owner=owner, name="Acme")
        inv = invite_member(
            organization=org,
            inviter=owner,
            email=invitee.email,
            role=OrganizationMember.Role.HOST,
        )
        api_client.force_authenticate(user=stranger)
        resp = api_client.post(f"/api/v1/organization-invitations/{inv.token}/")
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_invitee_declines(self, api_client, owner, invitee):
        org = create_organization(owner=owner, name="Acme")
        inv = invite_member(
            organization=org,
            inviter=owner,
            email=invitee.email,
            role=OrganizationMember.Role.HOST,
        )
        api_client.force_authenticate(user=invitee)
        resp = api_client.delete(f"/api/v1/organization-invitations/{inv.token}/")
        assert resp.status_code == status.HTTP_200_OK
        inv.refresh_from_db()
        assert inv.status == OrganizationInvitation.Status.DECLINED


@pytest.mark.django_db
class TestMyInvitationsView:
    def test_lists_pending_for_my_email(self, api_client, owner, invitee):
        org = create_organization(owner=owner, name="Acme")
        invite_member(
            organization=org,
            inviter=owner,
            email=invitee.email,
            role=OrganizationMember.Role.HOST,
        )
        api_client.force_authenticate(user=invitee)
        resp = api_client.get("/api/v1/organization-invitations/")
        assert resp.status_code == status.HTTP_200_OK
        assert len(resp.json()["data"]) == 1


@pytest.mark.django_db
class TestRevokeView:
    def test_owner_revokes(self, api_client, owner):
        org = create_organization(owner=owner, name="Acme")
        inv = invite_member(
            organization=org,
            inviter=owner,
            email="x@example.com",
            role=OrganizationMember.Role.HOST,
        )
        api_client.force_authenticate(user=owner)
        resp = api_client.post(f"/api/v1/organization/invitations/{inv.id}/revoke/")
        assert resp.status_code == status.HTTP_200_OK
        inv.refresh_from_db()
        assert inv.status == OrganizationInvitation.Status.REVOKED
