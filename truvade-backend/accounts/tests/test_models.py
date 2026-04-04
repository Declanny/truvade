import pytest
from django.contrib.auth import get_user_model
from django.db import IntegrityError
from django.utils import timezone

from accounts.models import IdentityVerification, Invitation, OwnerHostMembership

User = get_user_model()


@pytest.mark.django_db
class TestUserManager:
    def test_create_user(self):
        user = User.objects.create_user(
            email="guest@example.com",
            password="testpass123",
        )
        assert user.email == "guest@example.com"
        assert user.check_password("testpass123")
        assert user.is_active is True
        assert user.is_staff is False
        assert user.is_superuser is False

    def test_create_user_normalizes_email(self):
        user = User.objects.create_user(
            email="Test@EXAMPLE.COM",
            password="testpass123",
        )
        assert user.email == "Test@example.com"

    def test_create_user_without_email_raises(self):
        with pytest.raises(ValueError, match="email"):
            User.objects.create_user(email="", password="testpass123")

    def test_create_superuser(self):
        user = User.objects.create_superuser(
            email="admin@example.com",
            password="adminpass123",
        )
        assert user.is_staff is True
        assert user.is_superuser is True

    def test_create_superuser_must_be_staff(self):
        with pytest.raises(ValueError):
            User.objects.create_superuser(
                email="admin@example.com",
                password="adminpass123",
                is_staff=False,
            )

    def test_create_superuser_must_be_superuser(self):
        with pytest.raises(ValueError):
            User.objects.create_superuser(
                email="admin@example.com",
                password="adminpass123",
                is_superuser=False,
            )


@pytest.mark.django_db
class TestUserModel:
    def test_default_role_is_guest(self):
        user = User.objects.create_user(
            email="guest@example.com", password="testpass123"
        )
        assert user.role == "GUEST"

    def test_owner_role(self):
        user = User.objects.create_user(
            email="owner@example.com", password="testpass123", role="OWNER"
        )
        assert user.role == "OWNER"

    def test_host_role(self):
        user = User.objects.create_user(
            email="host@example.com", password="testpass123", role="HOST"
        )
        assert user.role == "HOST"

    def test_str_returns_email(self):
        user = User.objects.create_user(
            email="user@example.com", password="testpass123"
        )
        assert str(user) == "user@example.com"

    def test_user_fields(self):
        user = User.objects.create_user(
            email="user@example.com",
            password="testpass123",
            name="Ada Okafor",
            phone="+2348012345678",
        )
        assert user.name == "Ada Okafor"
        assert user.phone == "+2348012345678"
        assert user.date_joined is not None

    def test_is_verified_false_by_default(self):
        user = User.objects.create_user(
            email="user@example.com", password="testpass123", role="OWNER"
        )
        assert user.is_verified is False

    def test_is_verified_true_with_approved_verification(self, owner):
        IdentityVerification.objects.create(
            user=owner,
            verification_type="BVN",
            id_number="12345678901",
            id_document="verifications/documents/test.jpg",
            selfie="verifications/selfies/test.jpg",
            status="APPROVED",
        )
        assert owner.is_verified is True

    def test_is_verified_false_with_pending_verification(self, owner):
        IdentityVerification.objects.create(
            user=owner,
            verification_type="BVN",
            id_number="12345678901",
            id_document="verifications/documents/test.jpg",
            selfie="verifications/selfies/test.jpg",
            status="PENDING",
        )
        assert owner.is_verified is False


@pytest.mark.django_db
class TestInvitationModel:
    def test_create_invitation(self, owner):
        invitation = Invitation.objects.create(
            owner=owner,
            email="host@example.com",
            expires_at=timezone.now() + timezone.timedelta(days=7),
        )
        assert invitation.status == "PENDING"
        assert invitation.token is not None
        assert invitation.created_at is not None

    def test_str(self, invitation):
        assert "owner@example.com" in str(invitation)
        assert "invitee@example.com" in str(invitation)

    def test_is_expired_false_when_valid(self, invitation):
        assert invitation.is_expired is False

    def test_is_expired_true_when_past(self, expired_invitation):
        assert expired_invitation.is_expired is True

    def test_ordering_newest_first(self, owner):
        inv1 = Invitation.objects.create(
            owner=owner,
            email="a@example.com",
            expires_at=timezone.now() + timezone.timedelta(days=7),
        )
        inv2 = Invitation.objects.create(
            owner=owner,
            email="b@example.com",
            expires_at=timezone.now() + timezone.timedelta(days=7),
        )
        invitations = list(Invitation.objects.all())
        assert invitations[0] == inv2
        assert invitations[1] == inv1


@pytest.mark.django_db
class TestOwnerHostMembershipModel:
    def test_create_membership(self, membership):
        assert membership.is_active is True
        assert membership.created_at is not None

    def test_str(self, membership):
        assert "host@example.com" in str(membership)
        assert "owner@example.com" in str(membership)

    def test_unique_together_prevents_duplicate(self, owner, host):
        OwnerHostMembership.objects.create(owner=owner, host=host)
        with pytest.raises(IntegrityError):
            OwnerHostMembership.objects.create(owner=owner, host=host)


@pytest.mark.django_db
class TestIdentityVerificationModel:
    def test_create_verification(self, owner):
        v = IdentityVerification.objects.create(
            user=owner,
            verification_type="BVN",
            id_number="12345678901",
            id_document="verifications/documents/test.jpg",
            selfie="verifications/selfies/test.jpg",
        )
        assert v.status == "PENDING"
        assert v.admin_notes == ""
        assert v.reviewed_by is None
        assert v.reviewed_at is None

    def test_str(self, owner):
        v = IdentityVerification.objects.create(
            user=owner,
            verification_type="NIN",
            id_number="98765432101",
            id_document="verifications/documents/test.jpg",
            selfie="verifications/selfies/test.jpg",
        )
        assert "NIN" in str(v)
        assert owner.email in str(v)
