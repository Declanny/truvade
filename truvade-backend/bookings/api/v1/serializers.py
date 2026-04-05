from rest_framework import serializers

from bookings.models import Booking


class ShortletSummarySerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    city = serializers.CharField()
    state = serializers.CharField()
    shortlet_type = serializers.CharField()
    cover_image = serializers.SerializerMethodField()

    def get_cover_image(self, obj):
        cover = obj.images.filter(is_cover=True).first()
        if not cover:
            cover = obj.images.first()
        if cover and cover.image:
            return cover.image.url
        return None


class BookingReadSerializer(serializers.ModelSerializer):
    guest_name = serializers.CharField(source="guest.name", read_only=True)
    guest_email = serializers.EmailField(source="guest.email", read_only=True)
    shortlet = ShortletSummarySerializer(read_only=True)

    class Meta:
        model = Booking
        fields = [
            "id",
            "guest",
            "guest_name",
            "guest_email",
            "shortlet",
            "check_in",
            "check_out",
            "number_of_guests",
            "number_of_nights",
            "base_price_per_night",
            "cleaning_fee",
            "subtotal",
            "platform_fee",
            "total_price",
            "currency",
            "host_commission_percentage",
            "host_payout_amount",
            "cohost_commission_percentage",
            "cohost_payout_amount",
            "owner_payout_amount",
            "status",
            "guest_note",
            "cancelled_at",
            "cancellation_reason",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class CreateBookingSerializer(serializers.Serializer):
    shortlet_id = serializers.IntegerField()
    check_in = serializers.DateField()
    check_out = serializers.DateField()
    number_of_guests = serializers.IntegerField(min_value=1)
    guest_note = serializers.CharField(required=False, allow_blank=True, default="")


class PaymentSummarySerializer(serializers.Serializer):
    reference = serializers.CharField()
    authorization_url = serializers.CharField(source="paystack_authorization_url")
    status = serializers.CharField()


class CancelBookingSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, allow_blank=True, default="")


class AvailabilitySerializer(serializers.Serializer):
    check_in = serializers.DateField()
    check_out = serializers.DateField()
