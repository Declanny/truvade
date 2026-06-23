from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from core.utils.responses import success_response
from notifications.domain.selectors import (
    get_notification_for_user,
    get_notifications_for_user,
    get_or_create_preferences,
    get_unread_count,
)
from notifications.domain.services import (
    mark_all_read,
    mark_read,
    update_preferences,
)

from .serializers import (
    NotificationPreferenceSerializer,
    NotificationSerializer,
    UpdateNotificationPreferenceSerializer,
)


@extend_schema(tags=["Notifications"], summary="List my notifications")
class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        only_unread = request.query_params.get("unread") in ("1", "true", "True")
        notifications = get_notifications_for_user(
            user=request.user, only_unread=only_unread
        )
        return success_response(
            "Notifications retrieved.",
            NotificationSerializer(notifications, many=True).data,
        )


@extend_schema(tags=["Notifications"], summary="Unread notification count")
class UnreadCountView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return success_response(
            "Unread count retrieved.",
            {"unread": get_unread_count(user=request.user)},
        )


@extend_schema(tags=["Notifications"], summary="Mark a notification as read")
class MarkNotificationReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, notification_id):
        notification = get_notification_for_user(
            user=request.user, notification_id=notification_id
        )
        if notification is None:
            return success_response(
                "Notification not found.",
                None,
                status_code=status.HTTP_404_NOT_FOUND,
            )
        mark_read(notification=notification)
        return success_response(
            "Notification marked as read.",
            NotificationSerializer(notification).data,
        )


@extend_schema(tags=["Notifications"], summary="Mark all notifications as read")
class MarkAllReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        updated = mark_all_read(user=request.user)
        return success_response(
            "All notifications marked as read.",
            {"updated": updated},
        )


@extend_schema(tags=["Notifications"], summary="My notification preferences")
class NotificationPreferencesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        pref = get_or_create_preferences(user=request.user)
        return success_response(
            "Preferences retrieved.",
            NotificationPreferenceSerializer(pref).data,
        )

    def patch(self, request):
        serializer = UpdateNotificationPreferenceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        pref = update_preferences(user=request.user, **serializer.validated_data)
        return success_response(
            "Preferences updated.",
            NotificationPreferenceSerializer(pref).data,
        )
