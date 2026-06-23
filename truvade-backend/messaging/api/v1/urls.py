from django.urls import path

from .views import (
    MarkThreadReadView,
    SendMessageView,
    ThreadDetailView,
    ThreadListCreateView,
    UnreadThreadCountView,
)

urlpatterns = [
    path("threads/", ThreadListCreateView.as_view(), name="thread-list-create"),
    path(
        "threads/unread-count/",
        UnreadThreadCountView.as_view(),
        name="thread-unread-count",
    ),
    path(
        "threads/<int:thread_id>/",
        ThreadDetailView.as_view(),
        name="thread-detail",
    ),
    path(
        "threads/<int:thread_id>/messages/",
        SendMessageView.as_view(),
        name="thread-send-message",
    ),
    path(
        "threads/<int:thread_id>/read/",
        MarkThreadReadView.as_view(),
        name="thread-mark-read",
    ),
]
