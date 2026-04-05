from django.contrib import admin

from bookings.models import Booking


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "guest",
        "shortlet",
        "check_in",
        "check_out",
        "status",
        "total_price",
        "created_at",
    ]
    list_filter = ["status", "created_at"]
    search_fields = ["guest__email", "shortlet__title"]
    readonly_fields = ["created_at", "updated_at"]
