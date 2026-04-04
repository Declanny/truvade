from rest_framework import serializers

from properties.models import Property, PropertyImage


class PropertyImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyImage
        fields = ["id", "image", "is_cover", "order"]
        read_only_fields = ["id"]


class PropertySerializer(serializers.ModelSerializer):
    images = PropertyImageSerializer(many=True, read_only=True)

    class Meta:
        model = Property
        fields = [
            "id", "owner", "title", "description", "property_type",
            "address", "city", "state", "country", "latitude", "longitude",
            "bedrooms", "bathrooms", "max_guests", "min_nights",
            "base_price", "cleaning_fee", "currency", "amenities",
            "status", "featured", "verified", "guest_favorite",
            "images", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "owner", "created_at", "updated_at"]


class PropertyCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Property
        fields = [
            "title", "description", "property_type",
            "address", "city", "state", "country", "latitude", "longitude",
            "bedrooms", "bathrooms", "max_guests", "min_nights",
            "base_price", "cleaning_fee", "currency", "amenities",
        ]

    def create(self, validated_data):
        validated_data["status"] = Property.Status.DRAFT
        return super().create(validated_data)
