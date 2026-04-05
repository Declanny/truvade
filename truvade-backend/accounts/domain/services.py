"""Account write operations."""

import random

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.db import transaction
from django.utils import timezone

from accounts.models import (
    IdentityVerification,
    Invitation,
    OTP,
    OwnerHostMembership,
    User,
)


@transaction.atomic
def register_user(*, name, email, phone, role, invitation_token=None):
    if User.objects.filter(email__iexact=email).exists():
        raise ValidationError("A user with this email already exists.")

    if role == "HOST":
        if invitation_token is None:
            raise ValidationError("HOST registration requires an invitation.")
        invitation = Invitation.objects.filter(
            token=invitation_token,
            email__iexact=email,
            status=Invitation.Status.PENDING,
        ).first()
        if invitation is None or invitation.is_expired:
            raise ValidationError("Invalid or expired invitation.")
    elif role not in ("GUEST", "OWNER"):
        raise ValidationError("Role must be GUEST or OWNER.")

    user = User.objects.create_user(
        email=email,
        name=name,
        phone=phone,
        role=role,
    )
    user.set_unusable_password()
    user.save()

    send_otp(user=user)
    return user


def send_otp(*, user):
    code = f"{random.randint(0, 999999):06d}"
    OTP.objects.create(user=user, code=code)

    send_mail(
        subject="Your Truvade verification code",
        message=f"Your verification code is: {code}\n\nThis code expires in {settings.OTP_EXPIRY_MINUTES} minutes.",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
    )
    return code


def verify_otp(*, email, code):
    try:
        user = User.objects.get(email__iexact=email)
    except User.DoesNotExist:
        raise ValidationError("Invalid email or OTP.")

    otp = (
        OTP.objects.filter(user=user, code=code, is_used=False)
        .order_by("-created_at")
        .first()
    )

    if otp is None:
        raise ValidationError("Invalid email or OTP.")

    expiry_time = otp.created_at + timezone.timedelta(
        minutes=settings.OTP_EXPIRY_MINUTES
    )
    if timezone.now() > expiry_time:
        raise ValidationError("OTP has expired. Please request a new one.")

    otp.is_used = True
    otp.save()

    return user


def resend_otp(*, email):
    try:
        user = User.objects.get(email__iexact=email)
    except User.DoesNotExist:
        raise ValidationError("No account found with this email.")

    send_otp(user=user)


# --- Invitation services ---


@transaction.atomic
def create_invitation(*, owner, email):
    """Owner sends an invitation to an email address."""
    if owner.role != "OWNER":
        raise ValidationError("Only owners can send invitations.")

    email = email.lower().strip()

    existing_user = User.objects.filter(email__iexact=email).first()
    if existing_user:
        if existing_user == owner:
            raise ValidationError("You cannot invite yourself.")
        if existing_user.role not in ("HOST", "GUEST"):
            raise ValidationError("This user cannot be invited as a host.")
        if OwnerHostMembership.objects.filter(
            owner=owner, host=existing_user, is_active=True
        ).exists():
            raise ValidationError("This user is already your host.")

    existing_pending = Invitation.objects.filter(
        owner=owner,
        email__iexact=email,
        status=Invitation.Status.PENDING,
    ).first()
    if existing_pending and not existing_pending.is_expired:
        raise ValidationError("A pending invitation already exists for this email.")

    # Expire any stale pending invitations
    Invitation.objects.filter(
        owner=owner, email__iexact=email, status=Invitation.Status.PENDING
    ).update(status=Invitation.Status.EXPIRED)

    invitation = Invitation.objects.create(
        owner=owner,
        email=email,
        expires_at=timezone.now()
        + timezone.timedelta(days=settings.INVITATION_EXPIRY_DAYS),
    )

    _send_invitation_email(
        invitation=invitation, is_registered=existing_user is not None
    )
    return invitation


def _send_invitation_email(*, invitation, is_registered):
    """Send the invitation email with appropriate link."""
    frontend_url = settings.FRONTEND_URL
    owner_display = invitation.owner.name or invitation.owner.email

    if is_registered:
        link = f"{frontend_url}/invitations/{invitation.token}/accept"
        message = (
            f"Hi,\n\n"
            f"{owner_display} has invited you to be a host on Truvade.\n\n"
            f"Click the link below to accept the invitation:\n"
            f"{link}\n\n"
            f"This invitation expires in {settings.INVITATION_EXPIRY_DAYS} days."
        )
    else:
        link = f"{frontend_url}/invitations/{invitation.token}/signup"
        message = (
            f"Hi,\n\n"
            f"{owner_display} has invited you to join Truvade as a host.\n\n"
            f"Click the link below to create your account and accept the invitation:\n"
            f"{link}\n\n"
            f"This invitation expires in {settings.INVITATION_EXPIRY_DAYS} days."
        )

    send_mail(
        subject="You've been invited to Truvade",
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[invitation.email],
    )


@transaction.atomic
def accept_invitation(*, token, user):
    """Host accepts an invitation, creating the membership."""
    try:
        invitation = Invitation.objects.select_related("owner").get(
            token=token, status=Invitation.Status.PENDING
        )
    except Invitation.DoesNotExist:
        raise ValidationError("Invalid invitation.")

    if invitation.is_expired:
        invitation.status = Invitation.Status.EXPIRED
        invitation.save()
        raise ValidationError("This invitation has expired.")

    if invitation.email.lower() != user.email.lower():
        raise ValidationError("This invitation was not sent to your email.")

    if user.role not in ("HOST", "GUEST"):
        raise ValidationError("Only HOST users can accept invitations.")

    # Upgrade GUEST to HOST
    if user.role == "GUEST":
        user.role = User.Role.HOST
        user.save()

    membership, created = OwnerHostMembership.objects.get_or_create(
        owner=invitation.owner,
        host=user,
        defaults={"invitation": invitation, "is_active": True},
    )
    if not created and not membership.is_active:
        membership.is_active = True
        membership.invitation = invitation
        membership.save()
    elif not created:
        raise ValidationError("You are already a host for this owner.")

    invitation.status = Invitation.Status.ACCEPTED
    invitation.save()
    return membership


@transaction.atomic
def decline_invitation(*, token, user):
    """Host declines an invitation."""
    try:
        invitation = Invitation.objects.get(
            token=token, status=Invitation.Status.PENDING
        )
    except Invitation.DoesNotExist:
        raise ValidationError("Invalid invitation.")

    if invitation.email.lower() != user.email.lower():
        raise ValidationError("This invitation was not sent to your email.")

    invitation.status = Invitation.Status.DECLINED
    invitation.save()
    return invitation


@transaction.atomic
def revoke_invitation(*, invitation_id, owner):
    """Owner revokes a pending invitation."""
    try:
        invitation = Invitation.objects.get(
            id=invitation_id, owner=owner, status=Invitation.Status.PENDING
        )
    except Invitation.DoesNotExist:
        raise ValidationError("Invitation not found or already processed.")

    invitation.status = Invitation.Status.EXPIRED
    invitation.save()
    return invitation


@transaction.atomic
def remove_host(*, membership_id, owner):
    """Owner deactivates a host membership."""
    try:
        membership = OwnerHostMembership.objects.get(
            id=membership_id, owner=owner, is_active=True
        )
    except OwnerHostMembership.DoesNotExist:
        raise ValidationError("Membership not found.")

    membership.is_active = False
    membership.save()
    return membership


# --- KYC verification services ---


@transaction.atomic
def submit_verification(*, user, verification_type, id_number, id_document, selfie):
    """User submits a KYC verification request."""
    if user.role not in ("HOST", "OWNER"):
        raise ValidationError("Only HOST and OWNER users can submit verification.")

    if verification_type not in ("NIN",):
        raise ValidationError("Verification type must be NIN.")

    if len(id_number) != 11 or not id_number.isdigit():
        raise ValidationError(f"{verification_type} must be exactly 11 digits.")

    if IdentityVerification.objects.filter(
        user=user,
        verification_type=verification_type,
        status=IdentityVerification.Status.PENDING,
    ).exists():
        raise ValidationError(
            f"You already have a pending {verification_type} verification."
        )

    return IdentityVerification.objects.create(
        user=user,
        verification_type=verification_type,
        id_number=id_number,
        id_document=id_document,
        selfie=selfie,
    )


@transaction.atomic
def review_verification(*, verification_id, admin, status, admin_notes=""):
    """Admin approves or rejects a verification."""
    if not admin.is_staff:
        raise ValidationError("Only admins can review verifications.")

    if status not in ("APPROVED", "REJECTED"):
        raise ValidationError("Status must be APPROVED or REJECTED.")

    try:
        verification = IdentityVerification.objects.get(
            id=verification_id,
            status=IdentityVerification.Status.PENDING,
        )
    except IdentityVerification.DoesNotExist:
        raise ValidationError("Verification not found or already reviewed.")

    verification.status = status
    verification.admin_notes = admin_notes
    verification.reviewed_by = admin
    verification.reviewed_at = timezone.now()
    verification.save()
    return verification
