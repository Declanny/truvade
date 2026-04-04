import pytest
from django.contrib.auth import get_user_model

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
