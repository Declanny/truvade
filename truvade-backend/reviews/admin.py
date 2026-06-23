from django.contrib import admin

from reviews.models import Review, ReviewReply


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "shortlet",
        "guest",
        "rating",
        "is_published",
        "created_at",
    ]
    list_filter = ["rating", "is_published", "created_at"]
    search_fields = ["shortlet__title", "guest__email", "comment"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(ReviewReply)
class ReviewReplyAdmin(admin.ModelAdmin):
    list_display = ["id", "review", "author", "created_at"]
    search_fields = ["author__email", "body"]
    readonly_fields = ["created_at", "updated_at"]
