from rest_framework import serializers

from notifications.domain.services import PREFERENCE_FIELDS
from notifications.models import Notification, NotificationPreference


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            "id",
            "kind",
            "title",
            "body",
            "data",
            "read_at",
            "created_at",
        ]
        read_only_fields = fields


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = [
            "email_bookings",
            "email_messages",
            "email_reviews",
            "email_payouts",
            "email_marketing",
            "sms_booking_confirmations",
            "sms_security",
            "push_enabled",
            "push_bookings",
            "push_messages",
            "updated_at",
        ]
        read_only_fields = ["updated_at"]


class UpdateNotificationPreferenceSerializer(serializers.Serializer):
    """All fields optional; service layer applies the partial patch."""

    email_bookings = serializers.BooleanField(required=False)
    email_messages = serializers.BooleanField(required=False)
    email_reviews = serializers.BooleanField(required=False)
    email_payouts = serializers.BooleanField(required=False)
    email_marketing = serializers.BooleanField(required=False)
    sms_booking_confirmations = serializers.BooleanField(required=False)
    sms_security = serializers.BooleanField(required=False)
    push_enabled = serializers.BooleanField(required=False)
    push_bookings = serializers.BooleanField(required=False)
    push_messages = serializers.BooleanField(required=False)

    def validate(self, attrs):
        # Defence-in-depth: ensure no unknown keys slip through despite the
        # service-layer allowlist. DRF already strips unknown keys for Serializer
        # subclasses, but this keeps the contract explicit if a future refactor
        # switches to ModelSerializer.
        for key in attrs:
            if key not in PREFERENCE_FIELDS:
                raise serializers.ValidationError({key: "Unknown preference field."})
        return attrs
