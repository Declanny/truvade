from django.contrib import admin

from payments.models import BankAccount, Payment, Payout


@admin.register(BankAccount)
class BankAccountAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "user",
        "bank_name",
        "account_number",
        "is_default",
        "is_active",
    ]
    list_filter = ["is_active", "is_default"]
    search_fields = ["user__email", "account_name", "account_number"]


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ["id", "reference", "booking", "amount", "status", "paid_at"]
    list_filter = ["status"]
    search_fields = ["reference", "booking__guest__email"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(Payout)
class PayoutAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "transfer_reference",
        "recipient_type",
        "amount",
        "status",
        "completed_at",
    ]
    list_filter = ["status", "recipient_type"]
    search_fields = ["transfer_reference", "bank_account__user__email"]
    readonly_fields = ["created_at", "updated_at"]
