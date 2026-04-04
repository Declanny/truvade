"""Account read operations."""

from accounts.models import (
    IdentityVerification,
    Invitation,
    OwnerHostMembership,
    User,
)


def get_user_by_email(*, email):
    try:
        return User.objects.get(email__iexact=email)
    except User.DoesNotExist:
        return None


# --- Invitation selectors ---


def get_invitations_sent_by_owner(*, owner):
    return (
        Invitation.objects.filter(owner=owner)
        .select_related("owner")
        .order_by("-created_at")
    )


def get_invitations_for_email(*, email):
    return (
        Invitation.objects.filter(
            email__iexact=email,
            status=Invitation.Status.PENDING,
        )
        .select_related("owner")
        .order_by("-created_at")
    )


def get_invitation_by_token(*, token):
    try:
        return Invitation.objects.select_related("owner").get(token=token)
    except Invitation.DoesNotExist:
        return None


# --- Membership selectors ---


def get_hosts_for_owner(*, owner):
    return OwnerHostMembership.objects.filter(
        owner=owner, is_active=True
    ).select_related("host", "owner", "invitation")


def get_owners_for_host(*, host):
    return OwnerHostMembership.objects.filter(host=host, is_active=True).select_related(
        "host", "owner", "invitation"
    )


# --- Verification selectors ---


def get_verifications_for_user(*, user):
    return (
        IdentityVerification.objects.filter(user=user)
        .select_related("user", "reviewed_by")
        .order_by("-created_at")
    )


def get_pending_verifications():
    return (
        IdentityVerification.objects.filter(status=IdentityVerification.Status.PENDING)
        .select_related("user")
        .order_by("created_at")
    )


def get_verification_by_id(*, verification_id):
    try:
        return IdentityVerification.objects.select_related("user", "reviewed_by").get(
            id=verification_id
        )
    except IdentityVerification.DoesNotExist:
        return None
