from django.contrib import admin

from notifications.models import Notification, NotificationPreference


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ["id", "recipient", "kind", "title", "read_at", "created_at"]
    list_filter = ["kind", "read_at", "created_at"]
    search_fields = ["recipient__email", "title", "body"]
    readonly_fields = ["created_at"]


@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = ["user", "email_bookings", "push_enabled", "updated_at"]
    search_fields = ["user__email"]
    readonly_fields = ["updated_at"]
