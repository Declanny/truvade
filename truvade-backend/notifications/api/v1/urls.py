from django.urls import path

from .views import (
    MarkAllReadView,
    MarkNotificationReadView,
    NotificationListView,
    NotificationPreferencesView,
    UnreadCountView,
)

urlpatterns = [
    path("notifications/", NotificationListView.as_view(), name="notification-list"),
    path(
        "notifications/unread-count/",
        UnreadCountView.as_view(),
        name="notification-unread-count",
    ),
    path(
        "notifications/read-all/",
        MarkAllReadView.as_view(),
        name="notification-read-all",
    ),
    path(
        "notifications/<int:notification_id>/read/",
        MarkNotificationReadView.as_view(),
        name="notification-mark-read",
    ),
    path(
        "notifications/preferences/",
        NotificationPreferencesView.as_view(),
        name="notification-preferences",
    ),
]
