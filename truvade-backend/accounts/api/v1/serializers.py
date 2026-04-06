from rest_framework import serializers

from accounts.models import (
    IdentityVerification,
    Invitation,
    OwnerHostMembership,
    User,
)


class SignupSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20)
    role = serializers.ChoiceField(choices=["GUEST", "OWNER"])


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()


class VerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6, min_length=6)


class ResendOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "name", "phone", "avatar", "role", "date_joined"]
        read_only_fields = fields


# --- Invitation serializers ---


class CreateInvitationSerializer(serializers.Serializer):
    email = serializers.EmailField()


class InvitedSignupSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20)
    invitation_token = serializers.UUIDField()


class InvitationSerializer(serializers.ModelSerializer):
    owner_name = serializers.CharField(source="owner.name", read_only=True)
    owner_email = serializers.EmailField(source="owner.email", read_only=True)

    class Meta:
        model = Invitation
        fields = [
            "id",
            "owner",
            "owner_name",
            "owner_email",
            "email",
            "token",
            "status",
            "expires_at",
            "created_at",
        ]
        read_only_fields = fields


class MembershipSerializer(serializers.ModelSerializer):
    host_name = serializers.CharField(source="host.name", read_only=True)
    host_email = serializers.EmailField(source="host.email", read_only=True)
    owner_name = serializers.CharField(source="owner.name", read_only=True)
    owner_email = serializers.EmailField(source="owner.email", read_only=True)

    class Meta:
        model = OwnerHostMembership
        fields = [
            "id",
            "owner",
            "owner_name",
            "owner_email",
            "host",
            "host_name",
            "host_email",
            "is_active",
            "created_at",
        ]
        read_only_fields = fields


# --- KYC serializers ---


class SubmitVerificationSerializer(serializers.Serializer):
    verification_type = serializers.ChoiceField(choices=["NIN"])
    id_number = serializers.CharField(max_length=20)
    id_document = serializers.ImageField()
    selfie = serializers.ImageField()


class ReviewVerificationSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=["APPROVED", "REJECTED"])
    admin_notes = serializers.CharField(required=False, default="", allow_blank=True)


class VerificationSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source="user.email", read_only=True)
    reviewed_by_email = serializers.SerializerMethodField()

    class Meta:
        model = IdentityVerification
        fields = [
            "id",
            "user",
            "user_email",
            "verification_type",
            "id_number",
            "id_document",
            "selfie",
            "status",
            "admin_notes",
            "reviewed_by",
            "reviewed_by_email",
            "reviewed_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_reviewed_by_email(self, obj):
        if obj.reviewed_by:
            return obj.reviewed_by.email
        return None


# --- Profile serializers ---


class OwnProfileSerializer(serializers.ModelSerializer):
    """Full profile for the authenticated user (includes private fields)."""

    is_verified = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "name",
            "preferred_name",
            "phone",
            "avatar",
            "role",
            "bio",
            "work",
            "location",
            "languages",
            "emergency_contact",
            "address",
            "is_verified",
            "date_joined",
        ]
        read_only_fields = fields


class PublicProfileSerializer(serializers.ModelSerializer):
    """Public profile visible to anyone (no private fields)."""

    is_verified = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "name",
            "avatar",
            "role",
            "bio",
            "work",
            "location",
            "languages",
            "is_verified",
            "date_joined",
        ]
        read_only_fields = fields


class UpdateProfileSerializer(serializers.Serializer):
    """Write serializer for profile updates. All fields optional."""

    name = serializers.CharField(max_length=150, required=False)
    bio = serializers.CharField(required=False, allow_blank=True)
    work = serializers.CharField(max_length=150, required=False, allow_blank=True)
    location = serializers.CharField(max_length=150, required=False, allow_blank=True)
    languages = serializers.ListField(child=serializers.CharField(), required=False)
    emergency_contact = serializers.CharField(
        max_length=255, required=False, allow_blank=True
    )
    preferred_name = serializers.CharField(
        max_length=150, required=False, allow_blank=True
    )
    address = serializers.CharField(required=False, allow_blank=True)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)


class AvatarUploadSerializer(serializers.Serializer):
    avatar = serializers.ImageField()
