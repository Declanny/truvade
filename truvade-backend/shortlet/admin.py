from django.contrib import admin

from .models import Shortlet, ShortletImage


class ShortletImageInline(admin.TabularInline):
    model = ShortletImage
    extra = 0


@admin.register(Shortlet)
class ShortletAdmin(admin.ModelAdmin):
    list_display = ("title", "owner", "city", "status", "base_price", "created_at")
    list_filter = ("status", "shortlet_type", "city")
    search_fields = ("title", "city", "owner__email")
    inlines = [ShortletImageInline]
