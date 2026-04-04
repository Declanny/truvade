from rest_framework.permissions import BasePermission


class IsOwnerRole(BasePermission):
    """Allows access only to users with the OWNER role."""

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "OWNER"


class IsHostRole(BasePermission):
    """Allows access only to users with the HOST role."""

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "HOST"


class IsHostOrOwnerRole(BasePermission):
    """Allows access to HOST or OWNER users."""

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ("HOST", "OWNER")


class IsAdminRole(BasePermission):
    """Allows access only to staff/admin users."""

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_staff


class IsVerified(BasePermission):
    """Allows access only to users who have completed identity verification."""

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_verified
