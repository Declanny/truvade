from django.contrib import admin

from .models import Property, PropertyImage


class PropertyImageInline(admin.TabularInline):
    model = PropertyImage
    extra = 0


@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ("title", "owner", "city", "status", "base_price", "created_at")
    list_filter = ("status", "property_type", "city")
    search_fields = ("title", "city", "owner__email")
    inlines = [PropertyImageInline]
