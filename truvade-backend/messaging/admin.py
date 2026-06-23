from django.contrib import admin

from messaging.models import Message, Thread, ThreadParticipant


class ThreadParticipantInline(admin.TabularInline):
    model = ThreadParticipant
    extra = 0
    readonly_fields = ["joined_at"]


@admin.register(Thread)
class ThreadAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "subject",
        "booking",
        "shortlet",
        "last_message_at",
        "created_at",
    ]
    list_filter = ["created_at", "last_message_at"]
    search_fields = ["subject", "booking__id", "shortlet__title"]
    readonly_fields = ["created_at"]
    inlines = [ThreadParticipantInline]


@admin.register(ThreadParticipant)
class ThreadParticipantAdmin(admin.ModelAdmin):
    list_display = ["id", "thread", "user", "last_read_at", "is_archived", "is_muted"]
    list_filter = ["is_archived", "is_muted"]
    search_fields = ["user__email"]
    readonly_fields = ["joined_at"]


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ["id", "thread", "sender", "created_at", "edited_at"]
    search_fields = ["sender__email", "body"]
    readonly_fields = ["created_at"]
