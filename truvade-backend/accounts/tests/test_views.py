import pytest
from rest_framework import status

from accounts.models import OTP, User


@pytest.mark.django_db
class TestSignupView:
    def test_signup_success(self, api_client):
        resp = api_client.post(
            "/api/v1/auth/signup/",
            {
                "name": "Ada Okafor",
                "email": "ada@example.com",
                "phone": "+2348000000000",
                "role": "GUEST",
            },
            format="json",
        )
        assert resp.status_code == status.HTTP_201_CREATED
        assert User.objects.filter(email="ada@example.com").exists()
        assert OTP.objects.count() == 1

    def test_signup_duplicate_email(self, api_client, create_user):
        create_user(email="ada@example.com")
        resp = api_client.post(
            "/api/v1/auth/signup/",
            {
                "name": "Another",
                "email": "ada@example.com",
                "phone": "+2348000000001",
                "role": "GUEST",
            },
            format="json",
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_signup_invalid_role(self, api_client):
        resp = api_client.post(
            "/api/v1/auth/signup/",
            {
                "name": "Test",
                "email": "test@example.com",
                "phone": "+2348000000000",
                "role": "ADMIN",
            },
            format="json",
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_signup_owner_role(self, api_client):
        resp = api_client.post(
            "/api/v1/auth/signup/",
            {
                "name": "Owner User",
                "email": "owner@example.com",
                "phone": "+2348000000000",
                "role": "OWNER",
            },
            format="json",
        )
        assert resp.status_code == status.HTTP_201_CREATED
        user = User.objects.get(email="owner@example.com")
        assert user.role == "OWNER"


@pytest.mark.django_db
class TestLoginView:
    def test_login_sends_otp(self, api_client, create_user):
        create_user(email="ada@example.com")
        resp = api_client.post(
            "/api/v1/auth/login/",
            {"email": "ada@example.com"},
            format="json",
        )
        assert resp.status_code == status.HTTP_200_OK
        assert OTP.objects.count() == 1

    def test_login_unknown_email(self, api_client):
        resp = api_client.post(
            "/api/v1/auth/login/",
            {"email": "nobody@example.com"},
            format="json",
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestVerifyOTPView:
    def test_returns_tokens_and_user(self, api_client, create_user):
        user = create_user(email="ada@example.com")
        from accounts.domain.services import send_otp
        send_otp(user=user)
        otp = OTP.objects.filter(user=user).first()

        resp = api_client.post(
            "/api/v1/auth/verify-otp/",
            {"email": "ada@example.com", "otp": otp.code},
            format="json",
        )
        assert resp.status_code == status.HTTP_200_OK
        data = resp.data["data"]
        assert "tokens" in data
        assert "access" in data["tokens"]
        assert "refresh" in data["tokens"]
        assert data["user"]["email"] == "ada@example.com"

    def test_wrong_code(self, api_client, create_user):
        user = create_user(email="ada@example.com")
        from accounts.domain.services import send_otp
        send_otp(user=user)

        resp = api_client.post(
            "/api/v1/auth/verify-otp/",
            {"email": "ada@example.com", "otp": "000000"},
            format="json",
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestResendOTPView:
    def test_resend_success(self, api_client, create_user):
        create_user(email="ada@example.com")
        resp = api_client.post(
            "/api/v1/auth/resend-otp/",
            {"email": "ada@example.com"},
            format="json",
        )
        assert resp.status_code == status.HTTP_200_OK
        assert OTP.objects.count() == 1

    def test_resend_unknown_email(self, api_client):
        resp = api_client.post(
            "/api/v1/auth/resend-otp/",
            {"email": "nobody@example.com"},
            format="json",
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
