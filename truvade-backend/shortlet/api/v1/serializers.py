from rest_framework import serializers

from accounts.models import User
from shortlet.models import Shortlet, ShortletHostAssignment, ShortletImage


class ShortletImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShortletImage
        fields = ["id", "image", "is_cover", "order"]
        read_only_fields = ["id"]


class ShortletHostAssignmentSerializer(serializers.ModelSerializer):
    host_name = serializers.CharField(source="host.name", read_only=True)
    host_email = serializers.EmailField(source="host.email", read_only=True)

    class Meta:
        model = ShortletHostAssignment
        fields = [
            "id",
            "host",
            "host_name",
            "host_email",
            "role",
            "commission_percentage",
            "can_edit",
            "can_upload_images",
            "assigned_by",
            "created_at",
        ]
        read_only_fields = fields


class ShortletSerializer(serializers.ModelSerializer):
    images = ShortletImageSerializer(many=True, read_only=True)
    host_assignments = ShortletHostAssignmentSerializer(many=True, read_only=True)

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
            "host_assignments",
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


class UploadImagesSerializer(serializers.Serializer):
    images = serializers.ListField(child=serializers.ImageField())


class AssignHostSerializer(serializers.Serializer):
    host_id = serializers.IntegerField()
    role = serializers.ChoiceField(choices=["HOST", "COHOST"])
    commission_percentage = serializers.DecimalField(
        max_digits=5, decimal_places=2, required=False, default=0
    )


class UpdateAssignmentPermissionsSerializer(serializers.Serializer):
    can_edit = serializers.BooleanField()
    can_upload_images = serializers.BooleanField()


class AvailableHostSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "name", "email"]
        read_only_fields = fields
