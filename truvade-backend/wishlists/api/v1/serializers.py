from rest_framework import serializers

from wishlists.models import RecentlyViewed, Wishlist, WishlistItem


class ShortletCardSerializer(serializers.Serializer):
    """Slim shortlet payload for wishlist + recently-viewed cards.

    Lives here (not in shortlet app) because it is shaped specifically for
    these list views: one cover image, location summary, base price.
    """

    id = serializers.IntegerField()
    title = serializers.CharField()
    city = serializers.CharField()
    state = serializers.CharField()
    country = serializers.CharField()
    base_price = serializers.DecimalField(
        max_digits=12, decimal_places=2, allow_null=True
    )
    cleaning_fee = serializers.DecimalField(max_digits=10, decimal_places=2)
    currency = serializers.CharField()
    bedrooms = serializers.IntegerField()
    bathrooms = serializers.IntegerField()
    max_guests = serializers.IntegerField()
    cover_image = serializers.SerializerMethodField()
    guest_favorite = serializers.BooleanField()

    def get_cover_image(self, obj):
        # Use the prefetched images relation; fall back to the first one if
        # nothing is explicitly flagged as cover.
        images = list(obj.images.all())
        if not images:
            return None
        cover = next((img for img in images if img.is_cover), images[0])
        return cover.image.url if cover.image else None


class WishlistItemSerializer(serializers.ModelSerializer):
    shortlet = ShortletCardSerializer(read_only=True)

    class Meta:
        model = WishlistItem
        fields = ["id", "shortlet", "note", "added_at"]
        read_only_fields = fields


class WishlistSerializer(serializers.ModelSerializer):
    items = WishlistItemSerializer(many=True, read_only=True)
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = Wishlist
        fields = [
            "id",
            "name",
            "is_default",
            "is_private",
            "items",
            "item_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "is_default",
            "items",
            "item_count",
            "created_at",
            "updated_at",
        ]

    def get_item_count(self, obj):
        return obj.items.count()


class CreateWishlistSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=80)
    is_private = serializers.BooleanField(required=False, default=True)


class UpdateWishlistSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=80, required=False)
    is_private = serializers.BooleanField(required=False)


class AddItemSerializer(serializers.Serializer):
    shortlet_id = serializers.IntegerField()
    note = serializers.CharField(
        max_length=200, required=False, allow_blank=True, default=""
    )


class ToggleSaveSerializer(serializers.Serializer):
    shortlet_id = serializers.IntegerField()


class RecentlyViewedSerializer(serializers.ModelSerializer):
    shortlet = ShortletCardSerializer(read_only=True)

    class Meta:
        model = RecentlyViewed
        fields = ["id", "shortlet", "viewed_at"]
        read_only_fields = fields
