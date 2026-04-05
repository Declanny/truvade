from django.conf import settings
from django.db import models


class BankAccount(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="bank_accounts",
    )
    bank_name = models.CharField(max_length=100)
    bank_code = models.CharField(max_length=10)
    account_number = models.CharField(max_length=10)
    account_name = models.CharField(max_length=200)

    paystack_subaccount_code = models.CharField(max_length=100, blank=True, default="")
    paystack_recipient_code = models.CharField(max_length=100, blank=True, default="")

    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "is_default"], name="bank_user_default_idx"),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "account_number", "bank_code"],
                name="unique_user_bank_account",
            ),
        ]

    def __str__(self):
        return f"{self.bank_name} - {self.account_number} ({self.user.email})"


class Payment(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        SUCCESS = "SUCCESS", "Success"
        FAILED = "FAILED", "Failed"

    booking = models.OneToOneField(
        "bookings.Booking",
        on_delete=models.CASCADE,
        related_name="payment",
    )
    reference = models.CharField(max_length=100, unique=True, db_index=True)
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    amount_kobo = models.PositiveBigIntegerField()
    currency = models.CharField(max_length=5, default="NGN")
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.PENDING,
    )
    paystack_authorization_url = models.URLField(blank=True, default="")
    paystack_access_code = models.CharField(max_length=100, blank=True, default="")
    paystack_response = models.JSONField(default=dict, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status"], name="payment_status_idx"),
        ]

    def __str__(self):
        return f"Payment {self.reference} - {self.status}"


class Payout(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        SUCCESS = "SUCCESS", "Success"
        FAILED = "FAILED", "Failed"

    class RecipientType(models.TextChoices):
        OWNER = "OWNER", "Owner"
        HOST = "HOST", "Host"
        COHOST = "COHOST", "Co-host"

    payment = models.ForeignKey(
        Payment,
        on_delete=models.CASCADE,
        related_name="payouts",
    )
    bank_account = models.ForeignKey(
        BankAccount,
        on_delete=models.PROTECT,
        related_name="payouts",
    )
    recipient_type = models.CharField(max_length=10, choices=RecipientType.choices)
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    amount_kobo = models.PositiveBigIntegerField()
    transfer_reference = models.CharField(max_length=100, unique=True, db_index=True)
    paystack_transfer_code = models.CharField(max_length=100, blank=True, default="")
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.PENDING,
    )
    paystack_response = models.JSONField(default=dict, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status"], name="payout_status_idx"),
            models.Index(
                fields=["payment", "recipient_type"],
                name="payout_payment_type_idx",
            ),
        ]

    def __str__(self):
        return (
            f"Payout {self.transfer_reference} ({self.recipient_type}) - {self.status}"
        )
