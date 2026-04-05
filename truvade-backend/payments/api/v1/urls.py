from django.urls import path

from .views import (
    AddBankAccountView,
    BankAccountListView,
    BankListView,
    BookingPaymentDetailView,
    BookingPayoutsView,
    DeactivateBankAccountView,
    InitializePaymentView,
    PayoutListView,
    PaystackWebhookView,
    ResolveBankAccountView,
    SetDefaultBankAccountView,
    VerifyPaymentView,
)

urlpatterns = [
    # Banks
    path("banks/", BankListView.as_view(), name="bank-list"),
    path("banks/resolve/", ResolveBankAccountView.as_view(), name="bank-resolve"),
    # Bank Accounts
    path("bank-accounts/", AddBankAccountView.as_view(), name="bank-account-add"),
    path(
        "bank-accounts/mine/",
        BankAccountListView.as_view(),
        name="bank-account-list",
    ),
    path(
        "bank-accounts/<int:pk>/set-default/",
        SetDefaultBankAccountView.as_view(),
        name="bank-account-set-default",
    ),
    path(
        "bank-accounts/<int:pk>/deactivate/",
        DeactivateBankAccountView.as_view(),
        name="bank-account-deactivate",
    ),
    # Payments
    path(
        "payments/initialize/",
        InitializePaymentView.as_view(),
        name="payment-initialize",
    ),
    path(
        "payments/verify/<str:reference>/",
        VerifyPaymentView.as_view(),
        name="payment-verify",
    ),
    path(
        "bookings/<int:booking_id>/payment/",
        BookingPaymentDetailView.as_view(),
        name="booking-payment-detail",
    ),
    # Webhook
    path(
        "webhooks/paystack/",
        PaystackWebhookView.as_view(),
        name="paystack-webhook",
    ),
    # Payouts
    path("payouts/mine/", PayoutListView.as_view(), name="payout-list"),
    path(
        "bookings/<int:booking_id>/payouts/",
        BookingPayoutsView.as_view(),
        name="booking-payouts",
    ),
]
