"""Organization read operations."""

from organizations.models import (
    Organization,
    OrganizationInvitation,
    OrganizationMember,
)


def get_organization_for_user(*, user):
    """Return the org owned by this user, or None.

    A user can own at most one organization (OneToOneField).
    """
    try:
        return Organization.objects.get(owner=user)
    except Organization.DoesNotExist:
        return None


def get_organization_by_slug(*, slug):
    try:
        return Organization.objects.get(slug=slug)
    except Organization.DoesNotExist:
        return None


def get_members(*, organization):
    return (
        OrganizationMember.objects.filter(organization=organization)
        .select_related("user")
        .order_by("role", "joined_at")
    )


def get_invitations(*, organization, status=None):
    qs = OrganizationInvitation.objects.filter(organization=organization)
    if status is not None:
        qs = qs.filter(status=status)
    return qs.select_related("invited_by").order_by("-created_at")


def get_invitation_by_token(*, token):
    try:
        return OrganizationInvitation.objects.select_related(
            "organization", "invited_by"
        ).get(token=token)
    except OrganizationInvitation.DoesNotExist:
        return None


def get_memberships_for_user(*, user):
    """Return active OrganizationMember rows for this user."""
    return (
        OrganizationMember.objects.filter(user=user, is_active=True)
        .select_related("organization")
        .order_by("-joined_at")
    )
