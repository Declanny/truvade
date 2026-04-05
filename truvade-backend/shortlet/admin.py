from django.contrib import admin

from .models import Amenity, Shortlet, ShortletHostAssignment, ShortletImage


@admin.register(Amenity)
class AmenityAdmin(admin.ModelAdmin):
    list_display = ("name", "icon", "created_at")
    search_fields = ("name",)


class ShortletImageInline(admin.TabularInline):
    model = ShortletImage
    extra = 0


@admin.register(Shortlet)
class ShortletAdmin(admin.ModelAdmin):
    list_display = ("title", "owner", "city", "status", "base_price", "created_at")
    list_filter = ("status", "shortlet_type", "city")
    search_fields = ("title", "city", "owner__email")
    filter_horizontal = ("amenities",)
    inlines = [ShortletImageInline]


@admin.register(ShortletHostAssignment)
class ShortletHostAssignmentAdmin(admin.ModelAdmin):
    list_display = (
        "shortlet",
        "host",
        "role",
        "can_edit",
        "can_upload_images",
        "created_at",
    )
    list_filter = ("role",)
    search_fields = ("shortlet__title", "host__email")
