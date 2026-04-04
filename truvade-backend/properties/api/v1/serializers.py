from rest_framework import serializers

from properties.models import Shortlet, ShortletImage


class ShortletImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShortletImage
        fields = ["id", "image", "is_cover", "order"]
        read_only_fields = ["id"]


class ShortletSerializer(serializers.ModelSerializer):
    images = ShortletImageSerializer(many=True, read_only=True)

    class Meta:
        model = Shortlet
        fields = [
            "id",
            "owner",
            "title",
            "description",
            "shortlet_type",
            "address",
            "city",
            "state",
            "country",
            "latitude",
            "longitude",
            "bedrooms",
            "bathrooms",
            "max_guests",
            "min_nights",
            "base_price",
            "cleaning_fee",
            "currency",
            "amenities",
            "status",
            "featured",
            "verified",
            "guest_favorite",
            "images",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "owner", "created_at", "updated_at"]


class ShortletCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shortlet
        fields = ["shortlet_type"]

    def create(self, validated_data):
        validated_data["status"] = Shortlet.Status.DRAFT
        return super().create(validated_data)
