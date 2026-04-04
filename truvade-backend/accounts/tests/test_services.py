import pytest
from django.core.exceptions import ValidationError
from django.utils import timezone

from accounts.domain.services import register_user, send_otp, verify_otp, resend_otp
from accounts.models import OTP, User


@pytest.mark.django_db
class TestRegisterUser:
    def test_creates_user(self):
        user = register_user(
            name="Ada Okafor",
            email="ada@example.com",
            phone="+2348000000000",
            role="GUEST",
        )
        assert user.pk is not None
        assert user.email == "ada@example.com"
        assert user.name == "Ada Okafor"
        assert user.phone == "+2348000000000"
        assert user.role == "GUEST"
        assert not user.has_usable_password()

    def test_creates_otp_on_register(self):
        user = register_user(
            name="Ada Okafor",
            email="ada@example.com",
            phone="+2348000000000",
            role="OWNER",
        )
        assert OTP.objects.filter(user=user).count() == 1

    def test_duplicate_email_raises(self):
        register_user(
            name="First",
            email="ada@example.com",
            phone="+2348000000000",
            role="GUEST",
        )
        with pytest.raises(ValidationError, match="already exists"):
            register_user(
                name="Second",
                email="ada@example.com",
                phone="+2348000000001",
                role="GUEST",
            )

    def test_invalid_role_raises(self):
        with pytest.raises(ValidationError, match="GUEST or OWNER"):
            register_user(
                name="Test",
                email="test@example.com",
                phone="+2348000000000",
                role="ADMIN",
            )


@pytest.mark.django_db
class TestSendOTP:
    def test_creates_otp_record(self, create_user):
        user = create_user(email="test@example.com")
        send_otp(user=user)
        assert OTP.objects.filter(user=user).count() == 1

    def test_otp_is_6_digits(self, create_user):
        user = create_user(email="test@example.com")
        send_otp(user=user)
        otp = OTP.objects.filter(user=user).first()
        assert len(otp.code) == 6
        assert otp.code.isdigit()


@pytest.mark.django_db
class TestVerifyOTP:
    def test_success(self, create_user):
        user = create_user(email="test@example.com")
        send_otp(user=user)
        otp = OTP.objects.filter(user=user).first()
        result = verify_otp(email="test@example.com", code=otp.code)
        assert result == user
        otp.refresh_from_db()
        assert otp.is_used is True

    def test_wrong_code_raises(self, create_user):
        user = create_user(email="test@example.com")
        send_otp(user=user)
        with pytest.raises(ValidationError, match="Invalid"):
            verify_otp(email="test@example.com", code="000000")

    def test_expired_otp_raises(self, create_user):
        user = create_user(email="test@example.com")
        send_otp(user=user)
        otp = OTP.objects.filter(user=user).first()
        otp.created_at = timezone.now() - timezone.timedelta(minutes=11)
        otp.save()
        with pytest.raises(ValidationError, match="expired"):
            verify_otp(email="test@example.com", code=otp.code)

    def test_already_used_raises(self, create_user):
        user = create_user(email="test@example.com")
        send_otp(user=user)
        otp = OTP.objects.filter(user=user).first()
        otp.is_used = True
        otp.save()
        with pytest.raises(ValidationError, match="Invalid"):
            verify_otp(email="test@example.com", code=otp.code)

    def test_unknown_email_raises(self):
        with pytest.raises(ValidationError, match="Invalid"):
            verify_otp(email="nobody@example.com", code="123456")


@pytest.mark.django_db
class TestResendOTP:
    def test_creates_new_otp(self, create_user):
        user = create_user(email="test@example.com")
        resend_otp(email="test@example.com")
        assert OTP.objects.filter(user=user).count() == 1

    def test_unknown_email_raises(self):
        with pytest.raises(ValidationError, match="No account"):
            resend_otp(email="nobody@example.com")
