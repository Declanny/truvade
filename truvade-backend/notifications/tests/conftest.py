import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def guest(db):
    return User.objects.create_user(
        email="guest@example.com", role="GUEST", name="Test Guest"
    )


@pytest.fixture
def other_guest(db):
    return User.objects.create_user(
        email="other-guest@example.com", role="GUEST", name="Other Guest"
    )


@pytest.fixture
def authed_client(api_client, guest):
    api_client.force_authenticate(user=guest)
    return api_client
