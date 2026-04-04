import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

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
