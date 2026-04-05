from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import IdentityVerification, Invitation, OwnerHostMembership, User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("email", "name", "role", "is_active", "is_staff")
    list_filter = ("role", "is_active", "is_staff")
    search_fields = ("email", "name")
    ordering = ("email",)
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal info", {"fields": ("name", "phone", "avatar")}),
        ("Role", {"fields": ("role",)}),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        ("Dates", {"fields": ("date_joined", "last_login")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "password1", "password2", "role"),
            },
        ),
    )


@admin.register(Invitation)
class InvitationAdmin(admin.ModelAdmin):
    list_display = ("email", "owner", "status", "expires_at", "created_at")
    list_filter = ("status",)
    search_fields = ("email", "owner__email")
    readonly_fields = ("token", "created_at", "updated_at")


@admin.register(OwnerHostMembership)
class OwnerHostMembershipAdmin(admin.ModelAdmin):
    list_display = ("host", "owner", "is_active", "created_at")
    list_filter = ("is_active",)
    search_fields = ("host__email", "owner__email")


@admin.register(IdentityVerification)
class IdentityVerificationAdmin(admin.ModelAdmin):
    list_display = ("user", "verification_type", "status", "reviewed_by", "created_at")
    list_filter = ("status", "verification_type")
    search_fields = ("user__email", "id_number")
    readonly_fields = ("created_at", "updated_at")
