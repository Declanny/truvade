"""Account read operations."""

from accounts.models import User


def get_user_by_email(*, email):
    try:
        return User.objects.get(email__iexact=email)
    except User.DoesNotExist:
        return None
