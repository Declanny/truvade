from rest_framework import serializers

from messaging.models import Message, Thread, ThreadParticipant


class ThreadParticipantSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.name", read_only=True)
    user_email = serializers.EmailField(source="user.email", read_only=True)
    user_avatar = serializers.ImageField(source="user.avatar", read_only=True)

    class Meta:
        model = ThreadParticipant
        fields = [
            "id",
            "user",
            "user_name",
            "user_email",
            "user_avatar",
            "last_read_at",
            "is_archived",
            "is_muted",
            "joined_at",
        ]
        read_only_fields = fields


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source="sender.name", read_only=True)
    sender_avatar = serializers.ImageField(source="sender.avatar", read_only=True)

    class Meta:
        model = Message
        fields = [
            "id",
            "thread",
            "sender",
            "sender_name",
            "sender_avatar",
            "body",
            "attachment",
            "edited_at",
            "created_at",
        ]
        read_only_fields = fields


class ThreadSummarySerializer(serializers.ModelSerializer):
    """Lightweight serializer for the threads list (sidebar).

    Includes the last message + unread count so the list can render
    without an extra round trip per thread.
    """

    participants = ThreadParticipantSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Thread
        fields = [
            "id",
            "subject",
            "booking_id",
            "shortlet_id",
            "participants",
            "last_message",
            "unread_count",
            "last_message_at",
            "created_at",
        ]
        read_only_fields = fields

    def get_last_message(self, obj):
        msg = (
            Message.objects.filter(thread=obj)
            .order_by("-created_at")
            .only("id", "sender_id", "body", "created_at")
            .first()
        )
        if msg is None:
            return None
        return {
            "id": msg.id,
            "sender": msg.sender_id,
            "body": msg.body,
            "created_at": msg.created_at.isoformat(),
        }

    def get_unread_count(self, obj):
        user = self.context.get("user")
        if user is None:
            return 0
        from messaging.domain.selectors import get_unread_count_in_thread

        return get_unread_count_in_thread(thread=obj, user=user)


class CreateThreadSerializer(serializers.Serializer):
    """Create a thread with one other user.

    Either supply `user_id` for a direct DM, or `booking_id` to scope to a
    booking (we infer the other party from booking.guest vs shortlet.owner).
    """

    user_id = serializers.IntegerField(required=False)
    booking_id = serializers.IntegerField(required=False)
    initial_message = serializers.CharField(
        required=False, allow_blank=True, default=""
    )

    def validate(self, attrs):
        if not attrs.get("user_id") and not attrs.get("booking_id"):
            raise serializers.ValidationError(
                "Either user_id or booking_id is required."
            )
        return attrs


class SendMessageSerializer(serializers.Serializer):
    body = serializers.CharField(max_length=10000)


class UpdateParticipantSerializer(serializers.Serializer):
    is_archived = serializers.BooleanField(required=False)
    is_muted = serializers.BooleanField(required=False)
