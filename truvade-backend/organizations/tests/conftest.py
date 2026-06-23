import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def owner(db):
    return User.objects.create_user(
        email="owner@example.com", role="OWNER", name="Owner One"
    )


@pytest.fixture
def other_owner(db):
    return User.objects.create_user(
        email="other-owner@example.com", role="OWNER", name="Owner Two"
    )


@pytest.fixture
def invitee(db):
    return User.objects.create_user(
        email="invitee@example.com", role="HOST", name="Invitee"
    )


@pytest.fixture
def stranger(db):
    return User.objects.create_user(
        email="stranger@example.com", role="HOST", name="Stranger"
    )
