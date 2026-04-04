import io

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from PIL import Image
from rest_framework import status

from accounts.models import (
    IdentityVerification,
    Invitation,
    OTP,
    OwnerHostMembership,
    User,
)


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


# --- Invitation view tests ---


@pytest.mark.django_db
class TestCreateInvitationView:
    def test_success(self, api_client, owner):
        api_client.force_authenticate(user=owner)
        resp = api_client.post(
            "/api/v1/invitations/",
            {"email": "newhost@example.com"},
            format="json",
        )
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["data"]["email"] == "newhost@example.com"

    def test_403_for_non_owner(self, api_client, guest):
        api_client.force_authenticate(user=guest)
        resp = api_client.post(
            "/api/v1/invitations/",
            {"email": "newhost@example.com"},
            format="json",
        )
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_401_unauthenticated(self, api_client):
        resp = api_client.post(
            "/api/v1/invitations/",
            {"email": "newhost@example.com"},
            format="json",
        )
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestInvitationListView:
    def test_returns_owner_invitations(self, api_client, owner):
        Invitation.objects.create(
            owner=owner,
            email="a@example.com",
            expires_at=timezone.now() + timezone.timedelta(days=7),
        )
        api_client.force_authenticate(user=owner)
        resp = api_client.get("/api/v1/invitations/sent/")
        assert resp.status_code == status.HTTP_200_OK
        assert len(resp.data["data"]) == 1

    def test_403_for_non_owner(self, api_client, host):
        api_client.force_authenticate(user=host)
        resp = api_client.get("/api/v1/invitations/sent/")
        assert resp.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestInvitationDetailView:
    def test_returns_invitation(self, api_client, invitation):
        resp = api_client.get(f"/api/v1/invitations/{invitation.token}/")
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["data"]["email"] == invitation.email

    def test_invalid_token(self, api_client):
        import uuid

        resp = api_client.get(f"/api/v1/invitations/{uuid.uuid4()}/")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestAcceptInvitationView:
    def test_accept_success(self, api_client, owner, host):
        invitation = Invitation.objects.create(
            owner=owner,
            email=host.email,
            expires_at=timezone.now() + timezone.timedelta(days=7),
        )
        api_client.force_authenticate(user=host)
        resp = api_client.post(f"/api/v1/invitations/{invitation.token}/accept/")
        assert resp.status_code == status.HTTP_200_OK
        assert OwnerHostMembership.objects.filter(owner=owner, host=host).exists()

    def test_401_unauthenticated(self, api_client, invitation):
        resp = api_client.post(f"/api/v1/invitations/{invitation.token}/accept/")
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestDeclineInvitationView:
    def test_decline_success(self, api_client, owner, host):
        invitation = Invitation.objects.create(
            owner=owner,
            email=host.email,
            expires_at=timezone.now() + timezone.timedelta(days=7),
        )
        api_client.force_authenticate(user=host)
        resp = api_client.post(f"/api/v1/invitations/{invitation.token}/decline/")
        assert resp.status_code == status.HTTP_200_OK
        invitation.refresh_from_db()
        assert invitation.status == "DECLINED"


@pytest.mark.django_db
class TestRevokeInvitationView:
    def test_revoke_success(self, api_client, owner):
        invitation = Invitation.objects.create(
            owner=owner,
            email="host@example.com",
            expires_at=timezone.now() + timezone.timedelta(days=7),
        )
        api_client.force_authenticate(user=owner)
        resp = api_client.post(f"/api/v1/invitations/{invitation.id}/revoke/")
        assert resp.status_code == status.HTTP_200_OK
        invitation.refresh_from_db()
        assert invitation.status == "EXPIRED"

    def test_403_for_non_owner(self, api_client, guest, invitation):
        api_client.force_authenticate(user=guest)
        resp = api_client.post(f"/api/v1/invitations/{invitation.id}/revoke/")
        assert resp.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestInvitedSignupView:
    def test_signup_with_valid_invitation(self, api_client, owner):
        invitation = Invitation.objects.create(
            owner=owner,
            email="newhost@example.com",
            expires_at=timezone.now() + timezone.timedelta(days=7),
        )
        resp = api_client.post(
            "/api/v1/auth/signup/invited/",
            {
                "name": "New Host",
                "email": "newhost@example.com",
                "phone": "+2348000000000",
                "invitation_token": str(invitation.token),
            },
            format="json",
        )
        assert resp.status_code == status.HTTP_201_CREATED
        assert User.objects.filter(email="newhost@example.com", role="HOST").exists()

    def test_signup_without_token_fails(self, api_client):
        resp = api_client.post(
            "/api/v1/auth/signup/invited/",
            {
                "name": "New Host",
                "email": "newhost@example.com",
                "phone": "+2348000000000",
            },
            format="json",
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestPendingInvitationsView:
    def test_returns_user_pending_invitations(self, api_client, owner, host):
        Invitation.objects.create(
            owner=owner,
            email=host.email,
            expires_at=timezone.now() + timezone.timedelta(days=7),
        )
        api_client.force_authenticate(user=host)
        resp = api_client.get("/api/v1/invitations/pending/")
        assert resp.status_code == status.HTTP_200_OK
        assert len(resp.data["data"]) == 1


# --- Membership view tests ---


@pytest.mark.django_db
class TestHostListView:
    def test_returns_owner_hosts(self, api_client, owner, membership):
        api_client.force_authenticate(user=owner)
        resp = api_client.get("/api/v1/hosts/")
        assert resp.status_code == status.HTTP_200_OK
        assert len(resp.data["data"]) == 1

    def test_403_for_non_owner(self, api_client, host):
        api_client.force_authenticate(user=host)
        resp = api_client.get("/api/v1/hosts/")
        assert resp.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestOwnerListView:
    def test_returns_host_owners(self, api_client, host, membership):
        api_client.force_authenticate(user=host)
        resp = api_client.get("/api/v1/my-owners/")
        assert resp.status_code == status.HTTP_200_OK
        assert len(resp.data["data"]) == 1

    def test_403_for_non_host(self, api_client, owner):
        api_client.force_authenticate(user=owner)
        resp = api_client.get("/api/v1/my-owners/")
        assert resp.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestRemoveHostView:
    def test_remove_success(self, api_client, owner, membership):
        api_client.force_authenticate(user=owner)
        resp = api_client.post(f"/api/v1/hosts/{membership.id}/remove/")
        assert resp.status_code == status.HTTP_200_OK
        membership.refresh_from_db()
        assert membership.is_active is False


# --- KYC view tests ---


def _make_image(name="test.jpg"):
    """Create a minimal valid JPEG image for upload tests."""
    buf = io.BytesIO()
    Image.new("RGB", (10, 10), "red").save(buf, format="JPEG")
    buf.seek(0)
    return SimpleUploadedFile(name, buf.read(), content_type="image/jpeg")


@pytest.mark.django_db
class TestSubmitVerificationView:
    def test_submit_success(self, api_client, owner):
        api_client.force_authenticate(user=owner)
        resp = api_client.post(
            "/api/v1/verifications/",
            {
                "verification_type": "BVN",
                "id_number": "12345678901",
                "id_document": _make_image("id.jpg"),
                "selfie": _make_image("selfie.jpg"),
            },
            format="multipart",
        )
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["data"]["verification_type"] == "BVN"

    def test_403_for_guest(self, api_client, guest):
        api_client.force_authenticate(user=guest)
        resp = api_client.post(
            "/api/v1/verifications/",
            {
                "verification_type": "BVN",
                "id_number": "12345678901",
                "id_document": _make_image("id.jpg"),
                "selfie": _make_image("selfie.jpg"),
            },
            format="multipart",
        )
        assert resp.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestMyVerificationsView:
    def test_returns_own_verifications(self, api_client, owner):
        IdentityVerification.objects.create(
            user=owner,
            verification_type="BVN",
            id_number="12345678901",
            id_document="verifications/documents/test.jpg",
            selfie="verifications/selfies/test.jpg",
        )
        api_client.force_authenticate(user=owner)
        resp = api_client.get("/api/v1/verifications/me/")
        assert resp.status_code == status.HTTP_200_OK
        assert len(resp.data["data"]) == 1


@pytest.mark.django_db
class TestAdminPendingVerificationsView:
    def test_returns_pending_for_admin(self, api_client, admin_user, owner):
        IdentityVerification.objects.create(
            user=owner,
            verification_type="BVN",
            id_number="12345678901",
            id_document="verifications/documents/test.jpg",
            selfie="verifications/selfies/test.jpg",
        )
        api_client.force_authenticate(user=admin_user)
        resp = api_client.get("/api/v1/verifications/pending/")
        assert resp.status_code == status.HTTP_200_OK
        assert len(resp.data["data"]) == 1

    def test_403_for_non_admin(self, api_client, owner):
        api_client.force_authenticate(user=owner)
        resp = api_client.get("/api/v1/verifications/pending/")
        assert resp.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestAdminReviewVerificationView:
    def test_approve_success(self, api_client, admin_user, owner):
        v = IdentityVerification.objects.create(
            user=owner,
            verification_type="BVN",
            id_number="12345678901",
            id_document="verifications/documents/test.jpg",
            selfie="verifications/selfies/test.jpg",
        )
        api_client.force_authenticate(user=admin_user)
        resp = api_client.post(
            f"/api/v1/verifications/{v.id}/review/",
            {"status": "APPROVED"},
            format="json",
        )
        assert resp.status_code == status.HTTP_200_OK
        v.refresh_from_db()
        assert v.status == "APPROVED"

    def test_reject_success(self, api_client, admin_user, owner):
        v = IdentityVerification.objects.create(
            user=owner,
            verification_type="BVN",
            id_number="12345678901",
            id_document="verifications/documents/test.jpg",
            selfie="verifications/selfies/test.jpg",
        )
        api_client.force_authenticate(user=admin_user)
        resp = api_client.post(
            f"/api/v1/verifications/{v.id}/review/",
            {"status": "REJECTED", "admin_notes": "Blurry photo"},
            format="json",
        )
        assert resp.status_code == status.HTTP_200_OK
        v.refresh_from_db()
        assert v.status == "REJECTED"

    def test_403_for_non_admin(self, api_client, owner):
        v = IdentityVerification.objects.create(
            user=owner,
            verification_type="BVN",
            id_number="12345678901",
            id_document="verifications/documents/test.jpg",
            selfie="verifications/selfies/test.jpg",
        )
        api_client.force_authenticate(user=owner)
        resp = api_client.post(
            f"/api/v1/verifications/{v.id}/review/",
            {"status": "APPROVED"},
            format="json",
        )
        assert resp.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestAdminVerificationDetailView:
    def test_returns_verification(self, api_client, admin_user, owner):
        v = IdentityVerification.objects.create(
            user=owner,
            verification_type="BVN",
            id_number="12345678901",
            id_document="verifications/documents/test.jpg",
            selfie="verifications/selfies/test.jpg",
        )
        api_client.force_authenticate(user=admin_user)
        resp = api_client.get(f"/api/v1/verifications/{v.id}/")
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["data"]["id"] == v.id

    def test_403_for_non_admin(self, api_client, owner):
        api_client.force_authenticate(user=owner)
        resp = api_client.get("/api/v1/verifications/1/")
        assert resp.status_code == status.HTTP_403_FORBIDDEN
