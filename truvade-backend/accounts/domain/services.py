"""Account write operations."""

import random

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.db import transaction
from django.utils import timezone

from accounts.models import OTP, User


@transaction.atomic
def register_user(*, name, email, phone, role):
    if User.objects.filter(email__iexact=email).exists():
        raise ValidationError("A user with this email already exists.")

    if role not in ("GUEST", "OWNER"):
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
