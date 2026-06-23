from django.contrib import admin

from organizations.models import (
    Organization,
    OrganizationInvitation,
    OrganizationMember,
)


class OrganizationMemberInline(admin.TabularInline):
    model = OrganizationMember
    extra = 0
    readonly_fields = ["joined_at"]


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ["id", "name", "owner", "business_type", "country", "created_at"]
    list_filter = ["business_type", "country", "created_at"]
    search_fields = ["name", "slug", "owner__email", "registration_number"]
    prepopulated_fields = {"slug": ("name",)}
    readonly_fields = ["created_at", "updated_at"]
    inlines = [OrganizationMemberInline]


@admin.register(OrganizationMember)
class OrganizationMemberAdmin(admin.ModelAdmin):
    list_display = ["id", "organization", "user", "role", "is_active", "joined_at"]
    list_filter = ["role", "is_active"]
    search_fields = ["user__email", "organization__name"]
    readonly_fields = ["joined_at"]


@admin.register(OrganizationInvitation)
class OrganizationInvitationAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "organization",
        "email",
        "role",
        "status",
        "expires_at",
        "created_at",
    ]
    list_filter = ["status", "role", "created_at"]
    search_fields = ["email", "organization__name"]
    readonly_fields = ["token", "created_at", "updated_at"]
