from django.conf import settings
from django.db import models


class Thread(models.Model):
    """A conversation between two or more users.

    A thread may be tied to a specific Booking or Shortlet for context, or it
    may be a free-standing direct message.
    """

    booking = models.ForeignKey(
        "bookings.Booking",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="threads",
    )
    shortlet = models.ForeignKey(
        "shortlet.Shortlet",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="threads",
    )
    subject = models.CharField(max_length=200, blank=True, default="")
    last_message_at = models.DateTimeField(null=True, blank=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-last_message_at", "-created_at"]

    def __str__(self):
        return self.subject or f"Thread #{self.pk}"


class ThreadParticipant(models.Model):
    thread = models.ForeignKey(
        Thread, on_delete=models.CASCADE, related_name="participants"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="thread_memberships",
    )
    last_read_at = models.DateTimeField(null=True, blank=True)
    is_archived = models.BooleanField(default=False)
    is_muted = models.BooleanField(default=False)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [("thread", "user")]
        indexes = [
            models.Index(
                fields=["user", "is_archived"], name="thread_user_archived_idx"
            ),
        ]

    def __str__(self):
        return f"{self.user.email} in thread #{self.thread_id}"


class Message(models.Model):
    thread = models.ForeignKey(
        Thread, on_delete=models.CASCADE, related_name="messages"
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="messages_sent",
    )
    body = models.TextField()
    attachment = models.FileField(upload_to="messages/", blank=True, null=True)
    edited_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
        indexes = [
            models.Index(
                fields=["thread", "created_at"], name="message_thread_time_idx"
            ),
        ]

    def __str__(self):
        return f"Msg #{self.pk} from {self.sender.email}"
