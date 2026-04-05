import uuid

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from bookings.models import Booking
from payments.integrations.paystack_client import PaystackClient
from payments.models import BankAccount, Payment, Payout


# --- Bank Account Services ---


@transaction.atomic
def add_bank_account(*, user, bank_name, bank_code, account_number, account_name):
    if user.role not in ("HOST", "OWNER"):
        raise ValidationError("Only hosts and owners can add bank accounts.")

    client = PaystackClient()

    # Resolve account with Paystack
    client.resolve_account(account_number=account_number, bank_code=bank_code)

    # Create Paystack subaccount
    sub_response = client.create_subaccount(
        business_name=account_name,
        settlement_bank=bank_code,
        account_number=account_number,
        percentage_charge=0,  # We handle splits manually
    )
    subaccount_code = sub_response["data"]["subaccount_code"]

    # Create transfer recipient for payouts
    recipient_response = client.create_transfer_recipient(
        name=account_name,
        account_number=account_number,
        bank_code=bank_code,
    )
    recipient_code = recipient_response["data"]["recipient_code"]

    is_first = not BankAccount.objects.filter(user=user, is_active=True).exists()

    return BankAccount.objects.create(
        user=user,
        bank_name=bank_name,
        bank_code=bank_code,
        account_number=account_number,
        account_name=account_name,
        paystack_subaccount_code=subaccount_code,
        paystack_recipient_code=recipient_code,
        is_default=is_first,
    )


@transaction.atomic
def set_default_bank_account(*, user, bank_account_id):
    try:
        account = BankAccount.objects.get(pk=bank_account_id, user=user, is_active=True)
    except BankAccount.DoesNotExist:
        raise ValidationError("Bank account not found.")

    BankAccount.objects.filter(user=user, is_default=True).update(is_default=False)
    account.is_default = True
    account.save()
    return account


@transaction.atomic
def deactivate_bank_account(*, user, bank_account_id):
    try:
        account = BankAccount.objects.get(pk=bank_account_id, user=user, is_active=True)
    except BankAccount.DoesNotExist:
        raise ValidationError("Bank account not found.")

    account.is_active = False
    account.is_default = False
    account.save()
    return account


# --- Payment Services ---


@transaction.atomic
def initialize_payment(*, booking):
    if booking.status != Booking.Status.PENDING:
        raise ValidationError("Only pending bookings can be paid for.")

    # Return existing pending payment if one exists
    existing = Payment.objects.filter(
        booking=booking, status=Payment.Status.PENDING
    ).first()
    if existing:
        return existing

    reference = f"TRV-{booking.pk}-{uuid.uuid4().hex[:8]}"
    amount_kobo = int(booking.total_price * 100)

    client = PaystackClient()
    response = client.initialize_transaction(
        email=booking.guest.email,
        amount_kobo=amount_kobo,
        reference=reference,
        callback_url=settings.PAYSTACK_CALLBACK_URL,
        metadata={"booking_id": booking.pk},
    )

    return Payment.objects.create(
        booking=booking,
        reference=reference,
        amount=booking.total_price,
        amount_kobo=amount_kobo,
        currency=booking.currency,
        paystack_authorization_url=response["data"]["authorization_url"],
        paystack_access_code=response["data"]["access_code"],
    )


@transaction.atomic
def verify_payment(*, reference):
    try:
        payment = Payment.objects.select_related("booking").get(reference=reference)
    except Payment.DoesNotExist:
        raise ValidationError("Payment not found.")

    if payment.status == Payment.Status.SUCCESS:
        return payment

    client = PaystackClient()
    response = client.verify_transaction(reference=reference)

    if response["data"]["status"] == "success":
        payment.status = Payment.Status.SUCCESS
        payment.paid_at = timezone.now()
        payment.paystack_response = response["data"]
        payment.save()

        # Auto-confirm the booking
        booking = payment.booking
        booking.status = Booking.Status.CONFIRMED
        booking.save()

        # Create payout records
        create_payouts_for_payment(payment=payment)
    else:
        payment.status = Payment.Status.FAILED
        payment.paystack_response = response["data"]
        payment.save()

    return payment


def handle_webhook_event(*, event_type, data):
    if event_type == "charge.success":
        verify_payment(reference=data["reference"])
    elif event_type == "transfer.success":
        complete_payout(transfer_reference=data["reference"])
    elif event_type == "transfer.failed":
        fail_payout(transfer_reference=data["reference"])


# --- Payout Services ---


@transaction.atomic
def create_payouts_for_payment(*, payment):
    booking = payment.booking
    payouts = []

    # Owner payout
    if booking.owner_payout_amount > 0:
        owner_account = BankAccount.objects.filter(
            user=booking.shortlet.owner, is_active=True, is_default=True
        ).first()
        if owner_account and owner_account.paystack_recipient_code:
            payouts.append(
                Payout.objects.create(
                    payment=payment,
                    bank_account=owner_account,
                    recipient_type=Payout.RecipientType.OWNER,
                    amount=booking.owner_payout_amount,
                    amount_kobo=int(booking.owner_payout_amount * 100),
                    transfer_reference=f"TRV-PAY-OWNER-{payment.pk}-{uuid.uuid4().hex[:8]}",
                )
            )

    # Host payout
    if booking.host_payout_amount > 0:
        from shortlet.models import ShortletHostAssignment

        host_assignment = ShortletHostAssignment.objects.filter(
            shortlet=booking.shortlet, role="HOST"
        ).first()
        if host_assignment:
            host_account = BankAccount.objects.filter(
                user=host_assignment.host, is_active=True, is_default=True
            ).first()
            if host_account and host_account.paystack_recipient_code:
                payouts.append(
                    Payout.objects.create(
                        payment=payment,
                        bank_account=host_account,
                        recipient_type=Payout.RecipientType.HOST,
                        amount=booking.host_payout_amount,
                        amount_kobo=int(booking.host_payout_amount * 100),
                        transfer_reference=f"TRV-PAY-HOST-{payment.pk}-{uuid.uuid4().hex[:8]}",
                    )
                )

    # Cohost payout
    if booking.cohost_payout_amount > 0:
        from shortlet.models import ShortletHostAssignment

        cohost_assignment = ShortletHostAssignment.objects.filter(
            shortlet=booking.shortlet, role="COHOST"
        ).first()
        if cohost_assignment:
            cohost_account = BankAccount.objects.filter(
                user=cohost_assignment.host, is_active=True, is_default=True
            ).first()
            if cohost_account and cohost_account.paystack_recipient_code:
                payouts.append(
                    Payout.objects.create(
                        payment=payment,
                        bank_account=cohost_account,
                        recipient_type=Payout.RecipientType.COHOST,
                        amount=booking.cohost_payout_amount,
                        amount_kobo=int(booking.cohost_payout_amount * 100),
                        transfer_reference=f"TRV-PAY-COHOST-{payment.pk}-{uuid.uuid4().hex[:8]}",
                    )
                )

    return payouts


@transaction.atomic
def initiate_payout(*, payout):
    if payout.status != Payout.Status.PENDING:
        raise ValidationError("Only pending payouts can be initiated.")

    client = PaystackClient()
    response = client.initiate_transfer(
        amount_kobo=payout.amount_kobo,
        recipient_code=payout.bank_account.paystack_recipient_code,
        reference=payout.transfer_reference,
        reason=f"Truvade payout for booking #{payout.payment.booking_id}",
    )

    payout.paystack_transfer_code = response["data"]["transfer_code"]
    payout.paystack_response = response["data"]
    payout.save()
    return payout


@transaction.atomic
def complete_payout(*, transfer_reference):
    try:
        payout = Payout.objects.get(transfer_reference=transfer_reference)
    except Payout.DoesNotExist:
        raise ValidationError("Payout not found.")

    payout.status = Payout.Status.SUCCESS
    payout.completed_at = timezone.now()
    payout.save()
    return payout


@transaction.atomic
def fail_payout(*, transfer_reference):
    try:
        payout = Payout.objects.get(transfer_reference=transfer_reference)
    except Payout.DoesNotExist:
        raise ValidationError("Payout not found.")

    payout.status = Payout.Status.FAILED
    payout.save()
    return payout
