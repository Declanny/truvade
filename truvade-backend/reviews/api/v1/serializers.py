from rest_framework import serializers

from reviews.models import Review, ReviewReply


class ReviewReplySerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.name", read_only=True)
    author_avatar = serializers.ImageField(source="author.avatar", read_only=True)

    class Meta:
        model = ReviewReply
        fields = [
            "id",
            "author",
            "author_name",
            "author_avatar",
            "body",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class ReviewReadSerializer(serializers.ModelSerializer):
    guest_name = serializers.CharField(source="guest.name", read_only=True)
    guest_avatar = serializers.ImageField(source="guest.avatar", read_only=True)
    reply = ReviewReplySerializer(read_only=True)

    class Meta:
        model = Review
        fields = [
            "id",
            "booking",
            "shortlet",
            "guest",
            "guest_name",
            "guest_avatar",
            "rating",
            "cleanliness",
            "accuracy",
            "communication",
            "location",
            "check_in_experience",
            "value",
            "comment",
            "is_published",
            "reply",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class CreateReviewSerializer(serializers.Serializer):
    rating = serializers.IntegerField(min_value=1, max_value=5)
    comment = serializers.CharField(allow_blank=True, required=False, default="")
    cleanliness = serializers.IntegerField(
        min_value=1, max_value=5, required=False, allow_null=True
    )
    accuracy = serializers.IntegerField(
        min_value=1, max_value=5, required=False, allow_null=True
    )
    communication = serializers.IntegerField(
        min_value=1, max_value=5, required=False, allow_null=True
    )
    location = serializers.IntegerField(
        min_value=1, max_value=5, required=False, allow_null=True
    )
    check_in_experience = serializers.IntegerField(
        min_value=1, max_value=5, required=False, allow_null=True
    )
    value = serializers.IntegerField(
        min_value=1, max_value=5, required=False, allow_null=True
    )


class UpdateReviewSerializer(CreateReviewSerializer):
    rating = serializers.IntegerField(min_value=1, max_value=5, required=False)


class CreateReplySerializer(serializers.Serializer):
    body = serializers.CharField(max_length=2000)


class RatingSummarySerializer(serializers.Serializer):
    count = serializers.IntegerField()
    rating = serializers.FloatField(allow_null=True)
    cleanliness = serializers.FloatField(allow_null=True)
    accuracy = serializers.FloatField(allow_null=True)
    communication = serializers.FloatField(allow_null=True)
    location = serializers.FloatField(allow_null=True)
    check_in_experience = serializers.FloatField(allow_null=True)
    value = serializers.FloatField(allow_null=True)
