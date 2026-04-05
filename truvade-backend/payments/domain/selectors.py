import datetime

from django.utils import timezone

from payments.models import BankAccount, Payment, Payout


def get_bank_accounts_for_user(*, user):
    return BankAccount.objects.filter(user=user, is_active=True).order_by(
        "-is_default", "-created_at"
    )


def get_payment_for_booking(*, booking_id):
    return Payment.objects.select_related(
        "booking", "booking__guest", "booking__shortlet"
    ).get(booking_id=booking_id)


def get_payment_by_reference(*, reference):
    return Payment.objects.select_related(
        "booking", "booking__guest", "booking__shortlet"
    ).get(reference=reference)


def get_payouts_for_payment(*, payment):
    return Payout.objects.filter(payment=payment).select_related("bank_account")


def get_pending_payouts_eligible_for_disbursement():
    cutoff = (timezone.now() - datetime.timedelta(hours=24)).date()
    return (
        Payout.objects.filter(
            status=Payout.Status.PENDING,
            payment__status=Payment.Status.SUCCESS,
            payment__booking__check_in__lte=cutoff,
        )
        .exclude(bank_account__paystack_recipient_code="")
        .select_related("payment", "payment__booking", "bank_account")
    )


def get_payouts_for_user(*, user):
    return Payout.objects.filter(bank_account__user=user).select_related(
        "payment", "payment__booking", "bank_account"
    )
