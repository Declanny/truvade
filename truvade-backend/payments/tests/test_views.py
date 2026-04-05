import hashlib
import hmac
import json
from unittest.mock import patch

import pytest
from django.urls import reverse


# --- Bank List ---


@pytest.mark.django_db
class TestBankListView:
    url = reverse("bank-list")

    @patch("payments.api.v1.views.PaystackClient")
    def test_authenticated_user_gets_banks(self, MockClient, api_client, guest):
        MockClient.return_value.list_banks.return_value = {
            "status": True,
            "data": [
                {"name": "Access Bank", "code": "044"},
                {"name": "GTBank", "code": "058"},
            ],
        }
        api_client.force_authenticate(user=guest)
        response = api_client.get(self.url)
        assert response.status_code == 200
        assert len(response.data["data"]) == 2

    def test_unauthenticated_returns_401(self, api_client):
        response = api_client.get(self.url)
        assert response.status_code == 401


# --- Resolve Bank Account ---


@pytest.mark.django_db
class TestResolveBankAccountView:
    url = reverse("bank-resolve")

    @patch("payments.api.v1.views.PaystackClient")
    def test_owner_resolves_account(self, MockClient, api_client, verified_owner):
        MockClient.return_value.resolve_account.return_value = {
            "status": True,
            "data": {"account_name": "TEST OWNER", "account_number": "0123456789"},
        }
        api_client.force_authenticate(user=verified_owner)
        response = api_client.post(
            self.url, {"account_number": "0123456789", "bank_code": "044"}
        )
        assert response.status_code == 200
        assert response.data["data"]["account_name"] == "TEST OWNER"

    def test_guest_cannot_resolve(self, api_client, guest):
        api_client.force_authenticate(user=guest)
        response = api_client.post(
            self.url, {"account_number": "0123456789", "bank_code": "044"}
        )
        assert response.status_code == 403


# --- Add Bank Account ---


@pytest.mark.django_db
class TestAddBankAccountView:
    url = reverse("bank-account-add")

    @patch("payments.domain.services.PaystackClient")
    def test_owner_adds_account(self, MockClient, api_client, verified_owner):
        client = MockClient.return_value
        client.resolve_account.return_value = {
            "status": True,
            "data": {"account_name": "TEST", "account_number": "0123456789"},
        }
        client.create_subaccount.return_value = {
            "status": True,
            "data": {"subaccount_code": "ACCT_test"},
        }
        client.create_transfer_recipient.return_value = {
            "status": True,
            "data": {"recipient_code": "RCP_test"},
        }

        api_client.force_authenticate(user=verified_owner)
        response = api_client.post(
            self.url,
            {
                "bank_name": "Access Bank",
                "bank_code": "044",
                "account_number": "0123456789",
                "account_name": "Test Owner",
            },
        )
        assert response.status_code == 201

    def test_guest_cannot_add(self, api_client, guest):
        api_client.force_authenticate(user=guest)
        response = api_client.post(self.url, {})
        assert response.status_code == 403


# --- Bank Account List ---


@pytest.mark.django_db
class TestBankAccountListView:
    url = reverse("bank-account-list")

    def test_owner_sees_accounts(self, api_client, verified_owner, owner_bank_account):
        api_client.force_authenticate(user=verified_owner)
        response = api_client.get(self.url)
        assert response.status_code == 200
        assert len(response.data["data"]) == 1

    def test_guest_cannot_access(self, api_client, guest):
        api_client.force_authenticate(user=guest)
        response = api_client.get(self.url)
        assert response.status_code == 403


# --- Set Default Bank Account ---


@pytest.mark.django_db
class TestSetDefaultBankAccountView:
    def test_owner_sets_default(self, api_client, verified_owner, owner_bank_account):
        url = reverse("bank-account-set-default", args=[owner_bank_account.pk])
        api_client.force_authenticate(user=verified_owner)
        response = api_client.post(url)
        assert response.status_code == 200


# --- Deactivate Bank Account ---


@pytest.mark.django_db
class TestDeactivateBankAccountView:
    def test_owner_deactivates(self, api_client, verified_owner, owner_bank_account):
        url = reverse("bank-account-deactivate", args=[owner_bank_account.pk])
        api_client.force_authenticate(user=verified_owner)
        response = api_client.post(url)
        assert response.status_code == 200


# --- Initialize Payment ---


@pytest.mark.django_db
class TestInitializePaymentView:
    url = reverse("payment-initialize")

    @patch("payments.domain.services.PaystackClient")
    def test_guest_initializes_payment(
        self, MockClient, api_client, guest, pending_booking
    ):
        MockClient.return_value.initialize_transaction.return_value = {
            "status": True,
            "data": {
                "authorization_url": "https://checkout.paystack.com/test",
                "access_code": "acc_test",
                "reference": "ref_test",
            },
        }
        api_client.force_authenticate(user=guest)
        response = api_client.post(self.url, {"booking_id": pending_booking.pk})
        assert response.status_code == 201
        assert "authorization_url" in str(response.data["data"])

    def test_owner_cannot_initialize(self, api_client, verified_owner, pending_booking):
        api_client.force_authenticate(user=verified_owner)
        response = api_client.post(self.url, {"booking_id": pending_booking.pk})
        assert response.status_code == 403

    def test_unauthenticated_returns_401(self, api_client):
        response = api_client.post(self.url, {"booking_id": 1})
        assert response.status_code == 401


# --- Verify Payment ---


@pytest.mark.django_db
class TestVerifyPaymentView:
    @patch("payments.domain.services.PaystackClient")
    def test_verify_success(self, MockClient, api_client, guest, pending_payment):
        MockClient.return_value.verify_transaction.return_value = {
            "status": True,
            "data": {
                "status": "success",
                "amount": pending_payment.amount_kobo,
                "reference": pending_payment.reference,
                "paid_at": "2026-04-05T10:00:00.000Z",
            },
        }
        url = reverse("payment-verify", args=[pending_payment.reference])
        api_client.force_authenticate(user=guest)
        response = api_client.get(url)
        assert response.status_code == 200
        assert response.data["data"]["status"] == "SUCCESS"


# --- Booking Payment Detail ---


@pytest.mark.django_db
class TestBookingPaymentDetailView:
    def test_get_payment_for_booking(
        self, api_client, guest, pending_payment, pending_booking
    ):
        url = reverse("booking-payment-detail", args=[pending_booking.pk])
        api_client.force_authenticate(user=guest)
        response = api_client.get(url)
        assert response.status_code == 200

    def test_404_for_no_payment(self, api_client, guest, pending_booking):
        url = reverse("booking-payment-detail", args=[pending_booking.pk])
        api_client.force_authenticate(user=guest)
        response = api_client.get(url)
        assert response.status_code == 404


# --- Paystack Webhook ---


@pytest.mark.django_db
class TestPaystackWebhookView:
    url = reverse("paystack-webhook")

    @patch("payments.domain.services.verify_payment")
    def test_valid_signature_processes_event(self, mock_verify, api_client, settings):
        settings.PAYSTACK_SECRET_KEY = "test_secret"
        payload = json.dumps(
            {"event": "charge.success", "data": {"reference": "TRV-1-abc"}}
        ).encode()
        sig = hmac.new(b"test_secret", payload, hashlib.sha512).hexdigest()

        response = api_client.post(
            self.url,
            data=payload,
            content_type="application/json",
            HTTP_X_PAYSTACK_SIGNATURE=sig,
        )
        assert response.status_code == 200
        mock_verify.assert_called_once_with(reference="TRV-1-abc")

    def test_invalid_signature_returns_400(self, api_client, settings):
        settings.PAYSTACK_SECRET_KEY = "test_secret"
        payload = json.dumps(
            {"event": "charge.success", "data": {"reference": "TRV-1-abc"}}
        ).encode()

        response = api_client.post(
            self.url,
            data=payload,
            content_type="application/json",
            HTTP_X_PAYSTACK_SIGNATURE="invalid_signature",
        )
        assert response.status_code == 400


# --- Payout List ---


@pytest.mark.django_db
class TestPayoutListView:
    url = reverse("payout-list")

    def test_owner_sees_payouts(self, api_client, verified_owner):
        api_client.force_authenticate(user=verified_owner)
        response = api_client.get(self.url)
        assert response.status_code == 200

    def test_guest_cannot_access(self, api_client, guest):
        api_client.force_authenticate(user=guest)
        response = api_client.get(self.url)
        assert response.status_code == 403
