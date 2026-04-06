import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import Invitation, OwnerHostMembership

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def create_user():
    def _create_user(**kwargs):
        kwargs.setdefault("email", "test@example.com")
        kwargs.setdefault("role", "GUEST")
        user = User.objects.create_user(**kwargs)
        user.set_unusable_password()
        user.save()
        return user

    return _create_user


@pytest.fixture
def owner(db):
    return User.objects.create_user(
        email="owner@example.com", role="OWNER", name="Test Owner"
    )


@pytest.fixture
def other_owner(db):
    return User.objects.create_user(
        email="other-owner@example.com", role="OWNER", name="Other Owner"
    )


@pytest.fixture
def host(db):
    return User.objects.create_user(
        email="host@example.com", role="HOST", name="Test Host"
    )


@pytest.fixture
def guest(db):
    return User.objects.create_user(
        email="guest@example.com", role="GUEST", name="Test Guest"
    )


@pytest.fixture
def admin_user(db):
    return User.objects.create_user(
        email="admin@example.com", role="ADMIN", is_staff=True, name="Admin"
    )


@pytest.fixture
def invitation(owner):
    return Invitation.objects.create(
        owner=owner,
        email="invitee@example.com",
        expires_at=timezone.now() + timezone.timedelta(days=7),
    )


@pytest.fixture
def expired_invitation(owner):
    return Invitation.objects.create(
        owner=owner,
        email="expired@example.com",
        expires_at=timezone.now() - timezone.timedelta(days=1),
    )


@pytest.fixture
def membership(owner, host):
    return OwnerHostMembership.objects.create(owner=owner, host=host)


@pytest.fixture
def user_with_profile(db):
    return User.objects.create_user(
        email="profile@example.com",
        role="GUEST",
        name="Ada Nwosu",
        bio="Product designer from Lagos",
        work="Product Designer at TechCo",
        location="Lagos, Nigeria",
        languages=["English", "Yoruba"],
        phone="+2348012345678",
        emergency_contact="Kemi Nwosu — +2348023456789",
        preferred_name="Ada",
        address="12 Victoria Island, Lagos",
    )
