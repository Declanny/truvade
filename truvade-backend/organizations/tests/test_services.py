import datetime

import pytest
from django.core.exceptions import PermissionDenied, ValidationError
from django.utils import timezone

from organizations.domain.services import (
    accept_invitation,
    create_organization,
    decline_invitation,
    invite_member,
    remove_member,
    revoke_invitation,
    update_organization,
)
from organizations.models import (
    Organization,
    OrganizationInvitation,
    OrganizationMember,
)


@pytest.mark.django_db
class TestCreateOrganization:
    def test_creates_org_and_owner_member(self, owner):
        org = create_organization(owner=owner, name="Acme Stays")
        assert org.slug == "acme-stays"
        member = OrganizationMember.objects.get(organization=org, user=owner)
        assert member.role == OrganizationMember.Role.OWNER

    def test_slug_collision_resolves(self, owner, other_owner):
        org1 = create_organization(owner=owner, name="Cosy Stays")
        org2 = create_organization(owner=other_owner, name="Cosy Stays")
        assert org1.slug != org2.slug
        assert org2.slug == "cosy-stays-2"

    def test_user_can_only_own_one(self, owner):
        create_organization(owner=owner, name="First")
        with pytest.raises(ValidationError):
            create_organization(owner=owner, name="Second")


@pytest.mark.django_db
class TestUpdateOrganization:
    def test_owner_can_update(self, owner):
        org = create_organization(owner=owner, name="Acme")
        update_organization(
            organization=org, user=owner, name="Acme Stays", country="Ghana"
        )
        org.refresh_from_db()
        assert org.name == "Acme Stays"
        assert org.country == "Ghana"

    def test_non_member_cannot_update(self, owner, stranger):
        org = create_organization(owner=owner, name="Acme")
        with pytest.raises(PermissionDenied):
            update_organization(organization=org, user=stranger, name="Hack")


@pytest.mark.django_db
class TestInvitations:
    def test_owner_can_invite(self, owner):
        org = create_organization(owner=owner, name="Acme")
        inv = invite_member(
            organization=org,
            inviter=owner,
            email="new@example.com",
            role=OrganizationMember.Role.HOST,
        )
        assert inv.status == OrganizationInvitation.Status.PENDING

    def test_stranger_cannot_invite(self, owner, stranger):
        org = create_organization(owner=owner, name="Acme")
        with pytest.raises(PermissionDenied):
            invite_member(
                organization=org,
                inviter=stranger,
                email="x@example.com",
                role=OrganizationMember.Role.HOST,
            )

    def test_duplicate_pending_invitation_blocked(self, owner):
        org = create_organization(owner=owner, name="Acme")
        invite_member(
            organization=org,
            inviter=owner,
            email="dup@example.com",
            role=OrganizationMember.Role.HOST,
        )
        with pytest.raises(ValidationError):
            invite_member(
                organization=org,
                inviter=owner,
                email="dup@example.com",
                role=OrganizationMember.Role.HOST,
            )

    def test_inviting_existing_member_blocked(self, owner):
        org = create_organization(owner=owner, name="Acme")
        # owner is already a member — inviting them must fail.
        with pytest.raises(ValidationError):
            invite_member(
                organization=org,
                inviter=owner,
                email=owner.email,
                role=OrganizationMember.Role.MANAGER,
            )


@pytest.mark.django_db
class TestAccept:
    def test_invitee_accepts(self, owner, invitee):
        org = create_organization(owner=owner, name="Acme")
        inv = invite_member(
            organization=org,
            inviter=owner,
            email=invitee.email,
            role=OrganizationMember.Role.HOST,
        )
        member = accept_invitation(invitation=inv, user=invitee)
        assert member.organization_id == org.id
        inv.refresh_from_db()
        assert inv.status == OrganizationInvitation.Status.ACCEPTED

    def test_wrong_user_cannot_accept(self, owner, invitee, stranger):
        org = create_organization(owner=owner, name="Acme")
        inv = invite_member(
            organization=org,
            inviter=owner,
            email=invitee.email,
            role=OrganizationMember.Role.HOST,
        )
        with pytest.raises(PermissionDenied):
            accept_invitation(invitation=inv, user=stranger)

    def test_expired_invitation_rejected(self, owner, invitee):
        org = create_organization(owner=owner, name="Acme")
        inv = invite_member(
            organization=org,
            inviter=owner,
            email=invitee.email,
            role=OrganizationMember.Role.HOST,
        )
        inv.expires_at = timezone.now() - datetime.timedelta(days=1)
        inv.save(update_fields=["expires_at"])
        with pytest.raises(ValidationError):
            accept_invitation(invitation=inv, user=invitee)
        inv.refresh_from_db()
        assert inv.status == OrganizationInvitation.Status.EXPIRED


@pytest.mark.django_db
class TestDecline:
    def test_invitee_declines(self, owner, invitee):
        org = create_organization(owner=owner, name="Acme")
        inv = invite_member(
            organization=org,
            inviter=owner,
            email=invitee.email,
            role=OrganizationMember.Role.HOST,
        )
        decline_invitation(invitation=inv, user=invitee)
        inv.refresh_from_db()
        assert inv.status == OrganizationInvitation.Status.DECLINED


@pytest.mark.django_db
class TestRevoke:
    def test_owner_revokes_pending(self, owner):
        org = create_organization(owner=owner, name="Acme")
        inv = invite_member(
            organization=org,
            inviter=owner,
            email="z@example.com",
            role=OrganizationMember.Role.HOST,
        )
        revoke_invitation(invitation=inv, user=owner)
        inv.refresh_from_db()
        assert inv.status == OrganizationInvitation.Status.REVOKED

    def test_already_accepted_cannot_be_revoked(self, owner, invitee):
        org = create_organization(owner=owner, name="Acme")
        inv = invite_member(
            organization=org,
            inviter=owner,
            email=invitee.email,
            role=OrganizationMember.Role.HOST,
        )
        accept_invitation(invitation=inv, user=invitee)
        with pytest.raises(ValidationError):
            revoke_invitation(invitation=inv, user=owner)


@pytest.mark.django_db
class TestRemoveMember:
    def test_owner_cannot_be_removed(self, owner):
        org = create_organization(owner=owner, name="Acme")
        owner_member = OrganizationMember.objects.get(organization=org, user=owner)
        with pytest.raises(ValidationError):
            remove_member(member=owner_member, actor=owner)

    def test_owner_can_remove_others(self, owner, invitee):
        org = create_organization(owner=owner, name="Acme")
        inv = invite_member(
            organization=org,
            inviter=owner,
            email=invitee.email,
            role=OrganizationMember.Role.HOST,
        )
        member = accept_invitation(invitation=inv, user=invitee)
        remove_member(member=member, actor=owner)
        assert not OrganizationMember.objects.filter(pk=member.pk).exists()

    def test_member_can_remove_self(self, owner, invitee):
        org = create_organization(owner=owner, name="Acme")
        inv = invite_member(
            organization=org,
            inviter=owner,
            email=invitee.email,
            role=OrganizationMember.Role.HOST,
        )
        member = accept_invitation(invitation=inv, user=invitee)
        remove_member(member=member, actor=invitee)
        assert not OrganizationMember.objects.filter(pk=member.pk).exists()

    def test_stranger_cannot_remove(self, owner, invitee, stranger):
        org = create_organization(owner=owner, name="Acme")
        inv = invite_member(
            organization=org,
            inviter=owner,
            email=invitee.email,
            role=OrganizationMember.Role.HOST,
        )
        member = accept_invitation(invitation=inv, user=invitee)
        with pytest.raises(PermissionDenied):
            remove_member(member=member, actor=stranger)


@pytest.mark.django_db
def test_full_invite_accept_flow(owner, invitee):
    """Smoke test: create -> invite -> accept -> member visible."""
    org = create_organization(owner=owner, name="Acme")
    inv = invite_member(
        organization=org,
        inviter=owner,
        email=invitee.email,
        role=OrganizationMember.Role.HOST,
    )
    accept_invitation(invitation=inv, user=invitee)
    assert OrganizationMember.objects.filter(organization=org, user=invitee).exists()
    assert Organization.objects.get(pk=org.pk).members.count() == 2
