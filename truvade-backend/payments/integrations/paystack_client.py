import hashlib
import hmac

import httpx
from django.conf import settings


class PaystackClient:
    BASE_URL = "https://api.paystack.co"

    def __init__(self, secret_key=None):
        self.secret_key = secret_key or settings.PAYSTACK_SECRET_KEY
        self._headers = {
            "Authorization": f"Bearer {self.secret_key}",
            "Content-Type": "application/json",
        }

    def _get(self, path, params=None):
        response = httpx.get(
            f"{self.BASE_URL}{path}",
            headers=self._headers,
            params=params,
            timeout=30.0,
        )
        response.raise_for_status()
        return response.json()

    def _post(self, path, data=None):
        response = httpx.post(
            f"{self.BASE_URL}{path}",
            headers=self._headers,
            json=data,
            timeout=30.0,
        )
        response.raise_for_status()
        return response.json()

    # --- Transactions ---

    def initialize_transaction(
        self, *, email, amount_kobo, reference, callback_url=None, metadata=None
    ):
        payload = {
            "email": email,
            "amount": amount_kobo,
            "reference": reference,
        }
        if callback_url:
            payload["callback_url"] = callback_url
        if metadata:
            payload["metadata"] = metadata
        return self._post("/transaction/initialize", data=payload)

    def verify_transaction(self, *, reference):
        return self._get(f"/transaction/verify/{reference}")

    # --- Banks ---

    def list_banks(self, *, country="nigeria"):
        return self._get("/bank", params={"country": country, "perPage": 100})

    def resolve_account(self, *, account_number, bank_code):
        return self._get(
            "/bank/resolve",
            params={"account_number": account_number, "bank_code": bank_code},
        )

    # --- Subaccounts ---

    def create_subaccount(
        self, *, business_name, settlement_bank, account_number, percentage_charge
    ):
        return self._post(
            "/subaccount",
            data={
                "business_name": business_name,
                "settlement_bank": settlement_bank,
                "account_number": account_number,
                "percentage_charge": percentage_charge,
            },
        )

    # --- Transfer Recipients ---

    def create_transfer_recipient(
        self, *, name, account_number, bank_code, currency="NGN"
    ):
        return self._post(
            "/transferrecipient",
            data={
                "type": "nuban",
                "name": name,
                "account_number": account_number,
                "bank_code": bank_code,
                "currency": currency,
            },
        )

    # --- Transfers ---

    def initiate_transfer(self, *, amount_kobo, recipient_code, reference, reason=""):
        return self._post(
            "/transfer",
            data={
                "source": "balance",
                "amount": amount_kobo,
                "recipient": recipient_code,
                "reference": reference,
                "reason": reason,
            },
        )

    # --- Webhook verification ---

    @staticmethod
    def verify_webhook_signature(*, payload_body, signature, secret_key=None):
        key = secret_key or settings.PAYSTACK_SECRET_KEY
        expected = hmac.new(
            key.encode("utf-8"),
            payload_body,
            hashlib.sha512,
        ).hexdigest()
        return hmac.compare_digest(expected, signature)
