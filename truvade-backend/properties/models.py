from django.conf import settings
from django.db import models


class Shortlet(models.Model):
    class ShortletType(models.TextChoices):
        APARTMENT = "apartment", "Apartment"
        HOUSE = "house", "House"
        STUDIO = "studio", "Studio"
        VILLA = "villa", "Villa"

    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        PENDING = "PENDING", "Pending"
        ACTIVE = "ACTIVE", "Active"
        INACTIVE = "INACTIVE", "Inactive"
        ARCHIVED = "ARCHIVED", "Archived"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="shortlets"
    )
    title = models.CharField(max_length=80, blank=True, default="")
    description = models.TextField(max_length=500, blank=True)
    shortlet_type = models.CharField(max_length=20, choices=ShortletType.choices)
    address = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100, blank=True, default="")
    state = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, default="Nigeria")
    latitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    longitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    bedrooms = models.PositiveSmallIntegerField(default=1)
    bathrooms = models.PositiveSmallIntegerField(default=1)
    max_guests = models.PositiveSmallIntegerField(default=2)
    min_nights = models.PositiveSmallIntegerField(default=1)
    base_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    cleaning_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    currency = models.CharField(max_length=5, default="NGN")
    amenities = models.JSONField(default=list, blank=True)
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.DRAFT
    )
    featured = models.BooleanField(default=False)
    verified = models.BooleanField(default=False)
    guest_favorite = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "shortlets"
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class ShortletImage(models.Model):
    shortlet = models.ForeignKey(
        Shortlet, on_delete=models.CASCADE, related_name="images"
    )
    image = models.ImageField(upload_to="shortlets/")
    is_cover = models.BooleanField(default=False)
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"Image {self.order} for {self.shortlet.title}"
