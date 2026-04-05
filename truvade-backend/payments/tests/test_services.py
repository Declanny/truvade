from decimal import Decimal
from unittest.mock import patch

import pytest
from django.core.exceptions import ValidationError

from bookings.models import Booking
from payments.domain.services import (
    add_bank_account,
    complete_payout,
    create_payouts_for_payment,
    deactivate_bank_account,
    fail_payout,
    handle_webhook_event,
    initialize_payment,
    initiate_payout,
    set_default_bank_account,
    verify_payment,
)
from payments.models import BankAccount, Payment, Payout


# --- Bank Account Services ---


@pytest.mark.django_db
class TestAddBankAccount:
    @patch("payments.domain.services.PaystackClient")
    def test_happy_path(self, MockClient, verified_owner):
        client = MockClient.return_value
        client.resolve_account.return_value = {
            "status": True,
            "data": {"account_name": "TEST OWNER", "account_number": "0123456789"},
        }
        client.create_subaccount.return_value = {
            "status": True,
            "data": {"subaccount_code": "ACCT_test123"},
        }
        client.create_transfer_recipient.return_value = {
            "status": True,
            "data": {"recipient_code": "RCP_test123"},
        }

        account = add_bank_account(
            user=verified_owner,
            bank_name="Access Bank",
            bank_code="044",
            account_number="0123456789",
            account_name="Test Owner",
        )

        assert account.pk is not None
        assert account.paystack_subaccount_code == "ACCT_test123"
        assert account.paystack_recipient_code == "RCP_test123"
        assert account.is_default is True  # first account

    @patch("payments.domain.services.PaystackClient")
    def test_second_account_not_default(self, MockClient, verified_owner):
        client = MockClient.return_value
        client.resolve_account.return_value = {
            "status": True,
            "data": {"account_name": "TEST", "account_number": "1111111111"},
        }
        client.create_subaccount.return_value = {
            "status": True,
            "data": {"subaccount_code": "ACCT_1"},
        }
        client.create_transfer_recipient.return_value = {
            "status": True,
            "data": {"recipient_code": "RCP_1"},
        }

        add_bank_account(
            user=verified_owner,
            bank_name="GTBank",
            bank_code="058",
            account_number="1111111111",
            account_name="Test",
        )

        client.resolve_account.return_value["data"]["account_number"] = "2222222222"
        client.create_subaccount.return_value["data"]["subaccount_code"] = "ACCT_2"
        client.create_transfer_recipient.return_value["data"]["recipient_code"] = (
            "RCP_2"
        )

        second = add_bank_account(
            user=verified_owner,
            bank_name="Zenith",
            bank_code="057",
            account_number="2222222222",
            account_name="Test",
        )

        assert second.is_default is False

    def test_guest_cannot_add(self, guest):
        with pytest.raises(ValidationError, match="Only hosts and owners"):
            add_bank_account(
                user=guest,
                bank_name="GTBank",
                bank_code="058",
                account_number="0123456789",
                account_name="Guest User",
            )


@pytest.mark.django_db
class TestSetDefaultBankAccount:
    def test_set_default(self, verified_owner, owner_bank_account):
        second = BankAccount.objects.create(
            user=verified_owner,
            bank_name="GTBank",
            bank_code="058",
            account_number="1111111111",
            account_name="Test",
            is_default=False,
        )
        set_default_bank_account(user=verified_owner, bank_account_id=second.pk)
        second.refresh_from_db()
        owner_bank_account.refresh_from_db()
        assert second.is_default is True
        assert owner_bank_account.is_default is False

    def test_wrong_user(self, host, owner_bank_account):
        with pytest.raises(ValidationError, match="Bank account not found"):
            set_default_bank_account(user=host, bank_account_id=owner_bank_account.pk)


@pytest.mark.django_db
class TestDeactivateBankAccount:
    def test_deactivate(self, verified_owner, owner_bank_account):
        deactivate_bank_account(
            user=verified_owner, bank_account_id=owner_bank_account.pk
        )
        owner_bank_account.refresh_from_db()
        assert owner_bank_account.is_active is False

    def test_wrong_user(self, host, owner_bank_account):
        with pytest.raises(ValidationError, match="Bank account not found"):
            deactivate_bank_account(user=host, bank_account_id=owner_bank_account.pk)


# --- Payment Services ---


@pytest.mark.django_db
class TestInitializePayment:
    @patch("payments.domain.services.PaystackClient")
    def test_happy_path(self, MockClient, pending_booking):
        client = MockClient.return_value
        client.initialize_transaction.return_value = {
            "status": True,
            "data": {
                "authorization_url": "https://checkout.paystack.com/test",
                "access_code": "access_test",
                "reference": "ref_test",
            },
        }

        payment = initialize_payment(booking=pending_booking)

        assert payment.pk is not None
        assert payment.status == Payment.Status.PENDING
        assert payment.amount == pending_booking.total_price
        assert (
            payment.paystack_authorization_url == "https://checkout.paystack.com/test"
        )

    @patch("payments.domain.services.PaystackClient")
    def test_booking_must_be_pending(self, MockClient, confirmed_booking):
        with pytest.raises(ValidationError, match="Only pending bookings"):
            initialize_payment(booking=confirmed_booking)

    @patch("payments.domain.services.PaystackClient")
    def test_returns_existing_pending_payment(self, MockClient, pending_booking):
        client = MockClient.return_value
        client.initialize_transaction.return_value = {
            "status": True,
            "data": {
                "authorization_url": "https://checkout.paystack.com/test1",
                "access_code": "acc1",
                "reference": "ref1",
            },
        }

        p1 = initialize_payment(booking=pending_booking)
        p2 = initialize_payment(booking=pending_booking)
        assert p2.pk == p1.pk
        # Paystack should only be called once
        assert client.initialize_transaction.call_count == 1


@pytest.mark.django_db
class TestVerifyPayment:
    @patch("payments.domain.services.PaystackClient")
    def test_successful_verification(
        self, MockClient, pending_payment, pending_booking
    ):
        client = MockClient.return_value
        client.verify_transaction.return_value = {
            "status": True,
            "data": {
                "status": "success",
                "amount": pending_payment.amount_kobo,
                "reference": pending_payment.reference,
                "paid_at": "2026-04-05T10:00:00.000Z",
            },
        }

        payment = verify_payment(reference=pending_payment.reference)
        assert payment.status == Payment.Status.SUCCESS

        pending_booking.refresh_from_db()
        assert pending_booking.status == Booking.Status.CONFIRMED

    @patch("payments.domain.services.PaystackClient")
    def test_failed_verification(self, MockClient, pending_payment):
        client = MockClient.return_value
        client.verify_transaction.return_value = {
            "status": True,
            "data": {
                "status": "failed",
                "reference": pending_payment.reference,
            },
        }

        payment = verify_payment(reference=pending_payment.reference)
        assert payment.status == Payment.Status.FAILED

    @patch("payments.domain.services.PaystackClient")
    def test_idempotent_for_success(self, MockClient, successful_payment):
        payment = verify_payment(reference=successful_payment.reference)
        assert payment.status == Payment.Status.SUCCESS
        # PaystackClient should not be called
        MockClient.return_value.verify_transaction.assert_not_called()


# --- Payout Services ---


@pytest.mark.django_db
class TestCreatePayoutsForPayment:
    def test_creates_owner_and_host_payouts(
        self, successful_payment, owner_bank_account, host_bank_account, pending_booking
    ):
        pending_booking.status = Booking.Status.CONFIRMED
        pending_booking.save()

        payouts = create_payouts_for_payment(payment=successful_payment)

        assert len(payouts) == 2
        owner_payout = next(p for p in payouts if p.recipient_type == "OWNER")
        host_payout = next(p for p in payouts if p.recipient_type == "HOST")
        assert owner_payout.amount == pending_booking.owner_payout_amount
        assert host_payout.amount == pending_booking.host_payout_amount
        assert owner_payout.status == Payout.Status.PENDING
        assert host_payout.status == Payout.Status.PENDING

    def test_skips_if_no_bank_account(self, successful_payment, pending_booking):
        pending_booking.status = Booking.Status.CONFIRMED
        pending_booking.save()

        payouts = create_payouts_for_payment(payment=successful_payment)
        assert len(payouts) == 0

    def test_skips_zero_host_payout(
        self, successful_payment, owner_bank_account, host_bank_account, pending_booking
    ):
        pending_booking.status = Booking.Status.CONFIRMED
        pending_booking.host_payout_amount = Decimal("0.00")
        pending_booking.owner_payout_amount = pending_booking.subtotal
        pending_booking.save()

        payouts = create_payouts_for_payment(payment=successful_payment)
        assert len(payouts) == 1
        assert payouts[0].recipient_type == "OWNER"

    def test_creates_cohost_payout_when_assigned(
        self,
        successful_payment,
        owner_bank_account,
        host_bank_account,
        pending_booking,
        active_shortlet,
        verified_owner,
    ):
        """When a cohost is assigned with commission, a cohost payout is created."""
        from accounts.models import IdentityVerification, OwnerHostMembership
        from django.contrib.auth import get_user_model
        from shortlet.models import ShortletHostAssignment

        User = get_user_model()
        cohost = User.objects.create_user(
            email="cohost@example.com", password="testpass123", role="HOST"
        )
        IdentityVerification.objects.create(
            user=cohost,
            verification_type="NIN",
            id_number="66677788899",
            id_document="verifications/documents/test.jpg",
            selfie="verifications/selfies/test.jpg",
            status="APPROVED",
        )
        OwnerHostMembership.objects.create(owner=verified_owner, host=cohost)
        ShortletHostAssignment.objects.create(
            shortlet=active_shortlet,
            host=cohost,
            role="COHOST",
            assigned_by=verified_owner,
            commission_percentage=Decimal("5.00"),
        )
        cohost_bank = BankAccount.objects.create(
            user=cohost,
            bank_name="UBA",
            bank_code="033",
            account_number="5555555555",
            account_name="Co-Host User",
            paystack_recipient_code="RCP_cohost789",
            is_default=True,
        )

        pending_booking.status = Booking.Status.CONFIRMED
        pending_booking.cohost_commission_percentage = Decimal("5.00")
        pending_booking.cohost_payout_amount = Decimal("7750.00")
        pending_booking.owner_payout_amount = (
            pending_booking.subtotal
            - pending_booking.host_payout_amount
            - Decimal("7750.00")
        )
        pending_booking.save()

        payouts = create_payouts_for_payment(payment=successful_payment)

        assert len(payouts) == 3
        types = {p.recipient_type for p in payouts}
        assert types == {"OWNER", "HOST", "COHOST"}
        cohost_payout = next(p for p in payouts if p.recipient_type == "COHOST")
        assert cohost_payout.amount == Decimal("7750.00")
        assert cohost_payout.bank_account == cohost_bank


@pytest.mark.django_db
class TestInitiatePayout:
    @patch("payments.domain.services.PaystackClient")
    def test_happy_path(self, MockClient, successful_payment, owner_bank_account):
        client = MockClient.return_value
        client.initiate_transfer.return_value = {
            "status": True,
            "data": {"transfer_code": "TRF_abc123"},
        }

        payout = Payout.objects.create(
            payment=successful_payment,
            bank_account=owner_bank_account,
            recipient_type=Payout.RecipientType.OWNER,
            amount=Decimal("140000.00"),
            amount_kobo=14000000,
            transfer_reference="TRV-PAY-OWNER-test",
        )

        result = initiate_payout(payout=payout)
        assert result.paystack_transfer_code == "TRF_abc123"


@pytest.mark.django_db
class TestCompletePayout:
    def test_marks_success(self, successful_payment, owner_bank_account):
        payout = Payout.objects.create(
            payment=successful_payment,
            bank_account=owner_bank_account,
            recipient_type=Payout.RecipientType.OWNER,
            amount=Decimal("140000.00"),
            amount_kobo=14000000,
            transfer_reference="TRV-PAY-OWNER-comp",
        )
        result = complete_payout(transfer_reference=payout.transfer_reference)
        assert result.status == Payout.Status.SUCCESS
        assert result.completed_at is not None


@pytest.mark.django_db
class TestFailPayout:
    def test_marks_failed(self, successful_payment, owner_bank_account):
        payout = Payout.objects.create(
            payment=successful_payment,
            bank_account=owner_bank_account,
            recipient_type=Payout.RecipientType.OWNER,
            amount=Decimal("140000.00"),
            amount_kobo=14000000,
            transfer_reference="TRV-PAY-OWNER-fail",
        )
        result = fail_payout(transfer_reference=payout.transfer_reference)
        assert result.status == Payout.Status.FAILED


# --- Webhook Handler ---


@pytest.mark.django_db
class TestHandleWebhookEvent:
    @patch("payments.domain.services.verify_payment")
    def test_charge_success(self, mock_verify):
        handle_webhook_event(
            event_type="charge.success",
            data={"reference": "TRV-1-abc12345"},
        )
        mock_verify.assert_called_once_with(reference="TRV-1-abc12345")

    @patch("payments.domain.services.complete_payout")
    def test_transfer_success(self, mock_complete):
        handle_webhook_event(
            event_type="transfer.success",
            data={"reference": "TRV-PAY-OWNER-1-abc"},
        )
        mock_complete.assert_called_once_with(transfer_reference="TRV-PAY-OWNER-1-abc")

    @patch("payments.domain.services.fail_payout")
    def test_transfer_failed(self, mock_fail):
        handle_webhook_event(
            event_type="transfer.failed",
            data={"reference": "TRV-PAY-OWNER-1-abc"},
        )
        mock_fail.assert_called_once_with(transfer_reference="TRV-PAY-OWNER-1-abc")
