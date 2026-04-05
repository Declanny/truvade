from rest_framework.permissions import BasePermission


class IsGuestRole(BasePermission):
    """Allows access only to users with the GUEST role."""

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "GUEST"


class IsBookingParticipant(BasePermission):
    """Allows access to the booking's guest, the shortlet owner, or an assigned host."""

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user == obj.guest:
            return True
        if user == obj.shortlet.owner:
            return True
        return obj.shortlet.host_assignments.filter(host=user).exists()


class IsBookingGuest(BasePermission):
    """Allows access only to the guest who made the booking."""

    def has_object_permission(self, request, view, obj):
        return request.user == obj.guest


class IsBookingOwnerOrHost(BasePermission):
    """Allows access to the shortlet owner or an assigned host."""

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user == obj.shortlet.owner:
            return True
        return obj.shortlet.host_assignments.filter(host=user).exists()
