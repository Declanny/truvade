from decimal import Decimal

import pytest
from django.db import IntegrityError

from payments.models import BankAccount, Payment, Payout


@pytest.mark.django_db
class TestBankAccountModel:
    def test_create_bank_account(self, owner_bank_account):
        assert owner_bank_account.pk is not None
        assert owner_bank_account.bank_name == "Access Bank"
        assert owner_bank_account.is_default is True
        assert owner_bank_account.is_active is True

    def test_str_representation(self, owner_bank_account):
        assert "Access Bank" in str(owner_bank_account)
        assert "0123456789" in str(owner_bank_account)

    def test_unique_constraint(self, verified_owner, owner_bank_account):
        with pytest.raises(IntegrityError):
            BankAccount.objects.create(
                user=verified_owner,
                bank_name="Access Bank",
                bank_code="044",
                account_number="0123456789",
                account_name="Test Owner",
            )


@pytest.mark.django_db
class TestPaymentModel:
    def test_create_payment(self, pending_payment):
        assert pending_payment.pk is not None
        assert pending_payment.status == Payment.Status.PENDING
        assert pending_payment.reference == "TRV-1-pending1"

    def test_str_representation(self, pending_payment):
        assert "TRV-1-pending1" in str(pending_payment)

    def test_one_to_one_with_booking(self, pending_payment, pending_booking):
        assert pending_payment.booking == pending_booking
        assert pending_booking.payment == pending_payment

    def test_unique_reference(self, pending_payment, confirmed_booking):
        with pytest.raises(IntegrityError):
            Payment.objects.create(
                booking=confirmed_booking,
                reference=pending_payment.reference,
                amount=Decimal("100000.00"),
                amount_kobo=10000000,
            )


@pytest.mark.django_db
class TestPayoutModel:
    def test_create_payout(self, successful_payment, owner_bank_account):
        payout = Payout.objects.create(
            payment=successful_payment,
            bank_account=owner_bank_account,
            recipient_type=Payout.RecipientType.OWNER,
            amount=Decimal("140000.00"),
            amount_kobo=14000000,
            transfer_reference="TRV-PAY-OWNER-1-abc123",
        )
        assert payout.pk is not None
        assert payout.status == Payout.Status.PENDING

    def test_str_representation(self, successful_payment, owner_bank_account):
        payout = Payout.objects.create(
            payment=successful_payment,
            bank_account=owner_bank_account,
            recipient_type=Payout.RecipientType.OWNER,
            amount=Decimal("140000.00"),
            amount_kobo=14000000,
            transfer_reference="TRV-PAY-OWNER-1-str",
        )
        assert "OWNER" in str(payout)
        assert "TRV-PAY-OWNER-1-str" in str(payout)
