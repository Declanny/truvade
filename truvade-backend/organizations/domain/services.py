"""Organization write operations."""

import datetime
import re

from django.contrib.auth import get_user_model
from django.core.exceptions import PermissionDenied, ValidationError
from django.db import IntegrityError, transaction
from django.utils import timezone

from organizations.models import (
    Organization,
    OrganizationInvitation,
    OrganizationMember,
)

User = get_user_model()

INVITATION_TTL = datetime.timedelta(days=14)
MANAGEMENT_ROLES = (
    OrganizationMember.Role.OWNER,
    OrganizationMember.Role.MANAGER,
)


def _slugify(name):
    """Lowercase, hyphen-separated slug; collapses non-alphanumeric runs."""
    base = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return base or "org"


def _ensure_unique_slug(base):
    candidate = base
    suffix = 1
    while Organization.objects.filter(slug=candidate).exists():
        suffix += 1
        candidate = f"{base}-{suffix}"
    return candidate


@transaction.atomic
def create_organization(*, owner, name, **extra):
    """Create an organization owned by `owner` and seed the OWNER member row.

    A user can own at most one organization; the OneToOneField on the model
    surfaces a clean ValidationError if called twice.
    """
    if Organization.objects.filter(owner=owner).exists():
        raise ValidationError("You already have an organization.")

    slug = _ensure_unique_slug(_slugify(name))
    try:
        org = Organization.objects.create(owner=owner, name=name, slug=slug, **extra)
    except IntegrityError as exc:
        raise ValidationError("Could not create organization.") from exc

    OrganizationMember.objects.create(
        organization=org,
        user=owner,
        role=OrganizationMember.Role.OWNER,
    )
    return org


@transaction.atomic
def update_organization(*, organization, user, **changes):
    if not _can_manage(organization=organization, user=user):
        raise PermissionDenied("You cannot manage this organization.")

    allowed = (
        "name",
        "business_type",
        "registration_number",
        "tax_id",
        "contact_email",
        "contact_phone",
        "website",
        "address",
        "country",
    )
    dirty = []
    for field in allowed:
        if field in changes:
            setattr(organization, field, changes[field])
            dirty.append(field)
    if dirty:
        organization.save(update_fields=dirty + ["updated_at"])
    return organization


@transaction.atomic
def invite_member(*, organization, inviter, email, role):
    if not _can_manage(organization=organization, user=inviter):
        raise PermissionDenied("You cannot invite to this organization.")

    email = email.lower().strip()
    if OrganizationMember.objects.filter(
        organization=organization, user__email__iexact=email
    ).exists():
        raise ValidationError("That user is already a member.")
    if OrganizationInvitation.objects.filter(
        organization=organization,
        email__iexact=email,
        status=OrganizationInvitation.Status.PENDING,
    ).exists():
        raise ValidationError("That email already has a pending invitation.")

    return OrganizationInvitation.objects.create(
        organization=organization,
        email=email,
        role=role,
        invited_by=inviter,
        expires_at=timezone.now() + INVITATION_TTL,
    )


def accept_invitation(*, invitation, user):
    """Convert a pending invitation into an active OrganizationMember row.

    Not wrapped in a single @transaction.atomic: the EXPIRED status flip
    must persist even when we raise — otherwise the outer transaction would
    roll it back and the invitation would still look pending on retry.
    """
    if invitation.status != OrganizationInvitation.Status.PENDING:
        raise ValidationError("This invitation is no longer pending.")
    if timezone.now() > invitation.expires_at:
        with transaction.atomic():
            invitation.status = OrganizationInvitation.Status.EXPIRED
            invitation.save(update_fields=["status", "updated_at"])
        raise ValidationError("This invitation has expired.")
    if user.email.lower() != invitation.email.lower():
        raise PermissionDenied("This invitation was issued to a different email.")

    with transaction.atomic():
        member, _ = OrganizationMember.objects.get_or_create(
            organization=invitation.organization,
            user=user,
            defaults={"role": invitation.role, "is_active": True},
        )
        invitation.status = OrganizationInvitation.Status.ACCEPTED
        invitation.save(update_fields=["status", "updated_at"])
    return member


@transaction.atomic
def decline_invitation(*, invitation, user):
    if invitation.status != OrganizationInvitation.Status.PENDING:
        raise ValidationError("This invitation is no longer pending.")
    if user.email.lower() != invitation.email.lower():
        raise PermissionDenied("This invitation was issued to a different email.")
    invitation.status = OrganizationInvitation.Status.DECLINED
    invitation.save(update_fields=["status", "updated_at"])
    return invitation


@transaction.atomic
def revoke_invitation(*, invitation, user):
    if not _can_manage(organization=invitation.organization, user=user):
        raise PermissionDenied("You cannot revoke this invitation.")
    if invitation.status != OrganizationInvitation.Status.PENDING:
        raise ValidationError("Only pending invitations can be revoked.")
    invitation.status = OrganizationInvitation.Status.REVOKED
    invitation.save(update_fields=["status", "updated_at"])
    return invitation


@transaction.atomic
def remove_member(*, member, actor):
    """Remove a member from an organization.

    Owners cannot be removed (they must transfer ownership instead). Anyone
    with management role can remove other non-owner members; members can
    remove themselves.
    """
    if member.role == OrganizationMember.Role.OWNER:
        raise ValidationError("The owner cannot be removed.")
    if member.user_id != actor.id and not _can_manage(
        organization=member.organization, user=actor
    ):
        raise PermissionDenied("You cannot remove this member.")
    member.delete()


def _can_manage(*, organization, user):
    if organization.owner_id == user.id:
        return True
    return OrganizationMember.objects.filter(
        organization=organization,
        user=user,
        role__in=MANAGEMENT_ROLES,
        is_active=True,
    ).exists()
