from rest_framework import serializers

from organizations.models import (
    Organization,
    OrganizationInvitation,
    OrganizationMember,
)


class OrganizationMemberSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.name", read_only=True)
    user_email = serializers.EmailField(source="user.email", read_only=True)
    user_avatar = serializers.ImageField(source="user.avatar", read_only=True)

    class Meta:
        model = OrganizationMember
        fields = [
            "id",
            "user",
            "user_name",
            "user_email",
            "user_avatar",
            "role",
            "title",
            "is_active",
            "joined_at",
        ]
        read_only_fields = fields


class OrganizationInvitationSerializer(serializers.ModelSerializer):
    invited_by_name = serializers.CharField(source="invited_by.name", read_only=True)
    organization_name = serializers.CharField(
        source="organization.name", read_only=True
    )

    class Meta:
        model = OrganizationInvitation
        fields = [
            "id",
            "organization",
            "organization_name",
            "email",
            "role",
            "token",
            "status",
            "invited_by",
            "invited_by_name",
            "expires_at",
            "created_at",
        ]
        read_only_fields = fields


class OrganizationSerializer(serializers.ModelSerializer):
    members = OrganizationMemberSerializer(many=True, read_only=True)
    member_count = serializers.SerializerMethodField()

    class Meta:
        model = Organization
        fields = [
            "id",
            "owner",
            "name",
            "slug",
            "business_type",
            "registration_number",
            "tax_id",
            "contact_email",
            "contact_phone",
            "website",
            "logo",
            "address",
            "country",
            "members",
            "member_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "owner",
            "slug",
            "members",
            "member_count",
            "created_at",
            "updated_at",
        ]

    def get_member_count(self, obj):
        return obj.members.filter(is_active=True).count()


class CreateOrganizationSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150)
    business_type = serializers.ChoiceField(
        choices=Organization.BusinessType.choices,
        default=Organization.BusinessType.SOLE,
        required=False,
    )
    registration_number = serializers.CharField(
        max_length=50, required=False, allow_blank=True, default=""
    )
    tax_id = serializers.CharField(
        max_length=50, required=False, allow_blank=True, default=""
    )
    contact_email = serializers.EmailField(required=False, allow_blank=True, default="")
    contact_phone = serializers.CharField(
        max_length=20, required=False, allow_blank=True, default=""
    )
    website = serializers.URLField(required=False, allow_blank=True, default="")
    address = serializers.CharField(required=False, allow_blank=True, default="")
    country = serializers.CharField(max_length=100, required=False, default="Nigeria")


class UpdateOrganizationSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150, required=False)
    business_type = serializers.ChoiceField(
        choices=Organization.BusinessType.choices, required=False
    )
    registration_number = serializers.CharField(
        max_length=50, required=False, allow_blank=True
    )
    tax_id = serializers.CharField(max_length=50, required=False, allow_blank=True)
    contact_email = serializers.EmailField(required=False, allow_blank=True)
    contact_phone = serializers.CharField(
        max_length=20, required=False, allow_blank=True
    )
    website = serializers.URLField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    country = serializers.CharField(max_length=100, required=False)


class InviteMemberSerializer(serializers.Serializer):
    email = serializers.EmailField()
    role = serializers.ChoiceField(
        choices=OrganizationMember.Role.choices,
        default=OrganizationMember.Role.HOST,
        required=False,
    )
