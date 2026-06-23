from django.conf import settings
from django.db import models


class Notification(models.Model):
    class Kind(models.TextChoices):
        BOOKING_REQUESTED = "BOOKING_REQUESTED", "Booking requested"
        BOOKING_CONFIRMED = "BOOKING_CONFIRMED", "Booking confirmed"
        BOOKING_CANCELLED = "BOOKING_CANCELLED", "Booking cancelled"
        BOOKING_COMPLETED = "BOOKING_COMPLETED", "Booking completed"
        REVIEW_RECEIVED = "REVIEW_RECEIVED", "Review received"
        REVIEW_REMINDER = "REVIEW_REMINDER", "Review reminder"
        MESSAGE_RECEIVED = "MESSAGE_RECEIVED", "Message received"
        INVITATION_RECEIVED = "INVITATION_RECEIVED", "Invitation received"
        PAYOUT_PROCESSED = "PAYOUT_PROCESSED", "Payout processed"
        VERIFICATION_UPDATE = "VERIFICATION_UPDATE", "Verification update"
        GENERAL = "GENERAL", "General"

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    kind = models.CharField(max_length=24, choices=Kind.choices, default=Kind.GENERAL)
    title = models.CharField(max_length=200)
    body = models.TextField(blank=True, default="")
    # Free-form payload: target ids, deep-link route, image url, etc.
    data = models.JSONField(default=dict, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(
                fields=["recipient", "read_at"],
                name="notif_recipient_read_idx",
            ),
        ]

    def __str__(self):
        return f"{self.kind} -> {self.recipient.email}"


class NotificationPreference(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notification_preference",
    )

    # Email channel
    email_bookings = models.BooleanField(default=True)
    email_messages = models.BooleanField(default=True)
    email_reviews = models.BooleanField(default=True)
    email_payouts = models.BooleanField(default=True)
    email_marketing = models.BooleanField(default=False)

    # SMS channel
    sms_booking_confirmations = models.BooleanField(default=True)
    sms_security = models.BooleanField(default=True)

    # Push channel
    push_enabled = models.BooleanField(default=True)
    push_bookings = models.BooleanField(default=True)
    push_messages = models.BooleanField(default=True)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Preferences for {self.user.email}"
