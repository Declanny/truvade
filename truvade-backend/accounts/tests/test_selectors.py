import pytest
from django.contrib.auth import get_user_model

from accounts.domain.selectors import get_profile_completion, get_public_profile

User = get_user_model()


@pytest.mark.django_db
class TestGetPublicProfile:
    def test_returns_user_by_id(self, guest):
        result = get_public_profile(user_id=guest.id)
        assert result is not None
        assert result.id == guest.id

    def test_returns_none_for_nonexistent(self):
        result = get_public_profile(user_id=99999)
        assert result is None

    def test_returns_none_for_inactive(self, guest):
        guest.is_active = False
        guest.save()
        result = get_public_profile(user_id=guest.id)
        assert result is None


@pytest.mark.django_db
class TestGetProfileCompletion:
    def test_empty_profile_completion(self):
        user = User.objects.create_user(email="empty@example.com")
        result = get_profile_completion(user=user)
        # Only email is filled → 1/7 = 14%
        assert result["completed"] == 1
        assert result["total"] == 7
        assert result["percentage"] == 14

    def test_full_profile_returns_100(self):
        user = User.objects.create_user(
            email="full@example.com",
            bio="A bio",
            work="Designer",
            languages=["English"],
            phone="+2348012345678",
            emergency_contact="Kemi — +234802",
            avatar="avatars/test.jpg",
        )
        result = get_profile_completion(user=user)
        assert result["completed"] == 7
        assert result["percentage"] == 100

    def test_partial_profile_calculates_correctly(self):
        user = User.objects.create_user(
            email="partial@example.com",
            bio="A bio",
            work="Designer",
            phone="+2348012345678",
        )
        # email + bio + work + phone = 4/7
        result = get_profile_completion(user=user)
        assert result["completed"] == 4
        assert result["percentage"] == 57

    def test_checklist_structure(self):
        user = User.objects.create_user(email="struct@example.com")
        result = get_profile_completion(user=user)
        assert len(result["checklist"]) == 7
        for item in result["checklist"]:
            assert "field" in item
            assert "label" in item
            assert "completed" in item

    def test_empty_languages_list_not_completed(self):
        user = User.objects.create_user(email="nolang@example.com", languages=[])
        result = get_profile_completion(user=user)
        lang_item = next(
            item for item in result["checklist"] if item["field"] == "languages"
        )
        assert lang_item["completed"] is False
