import json

from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.api.v1.permissions import IsHostOrOwnerRole
from bookings.models import Booking
from core.utils.responses import success_response
from payments.domain.selectors import (
    get_bank_accounts_for_user,
    get_payment_for_booking,
    get_payouts_for_payment,
    get_payouts_for_user,
)
from payments.domain.services import (
    add_bank_account,
    deactivate_bank_account,
    handle_webhook_event,
    initialize_payment,
    set_default_bank_account,
    verify_payment,
)
from payments.integrations.paystack_client import PaystackClient
from payments.models import Payment

from .permissions import IsGuestRole
from .serializers import (
    AddBankAccountSerializer,
    BankAccountReadSerializer,
    BankListSerializer,
    InitializePaymentSerializer,
    PaymentReadSerializer,
    PayoutReadSerializer,
    ResolveBankAccountSerializer,
)


# --- Bank Endpoints ---


@extend_schema(tags=["Banks"])
class BankListView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="List Nigerian banks",
        responses=BankListSerializer(many=True),
    )
    def get(self, request):
        client = PaystackClient()
        response = client.list_banks(country="nigeria")
        banks = response.get("data", [])
        serializer = BankListSerializer(banks, many=True)
        return success_response("Banks retrieved successfully.", serializer.data)


@extend_schema(tags=["Banks"])
class ResolveBankAccountView(APIView):
    permission_classes = [IsAuthenticated, IsHostOrOwnerRole]

    @extend_schema(
        summary="Resolve a bank account number",
        request=ResolveBankAccountSerializer,
    )
    def post(self, request):
        serializer = ResolveBankAccountSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        client = PaystackClient()
        response = client.resolve_account(
            account_number=serializer.validated_data["account_number"],
            bank_code=serializer.validated_data["bank_code"],
        )
        return success_response(
            "Account resolved successfully.",
            response.get("data", {}),
        )


@extend_schema(tags=["Bank Accounts"])
class AddBankAccountView(APIView):
    permission_classes = [IsAuthenticated, IsHostOrOwnerRole]

    @extend_schema(
        summary="Add a bank account",
        request=AddBankAccountSerializer,
        responses=BankAccountReadSerializer,
    )
    def post(self, request):
        serializer = AddBankAccountSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        account = add_bank_account(
            user=request.user,
            bank_name=serializer.validated_data["bank_name"],
            bank_code=serializer.validated_data["bank_code"],
            account_number=serializer.validated_data["account_number"],
            account_name=serializer.validated_data["account_name"],
        )
        return success_response(
            "Bank account added successfully.",
            BankAccountReadSerializer(account).data,
            status_code=status.HTTP_201_CREATED,
        )


@extend_schema(tags=["Bank Accounts"])
class BankAccountListView(APIView):
    permission_classes = [IsAuthenticated, IsHostOrOwnerRole]

    @extend_schema(
        summary="List user's bank accounts",
        responses=BankAccountReadSerializer(many=True),
    )
    def get(self, request):
        accounts = get_bank_accounts_for_user(user=request.user)
        return success_response(
            "Bank accounts retrieved successfully.",
            BankAccountReadSerializer(accounts, many=True).data,
        )


@extend_schema(tags=["Bank Accounts"])
class SetDefaultBankAccountView(APIView):
    permission_classes = [IsAuthenticated, IsHostOrOwnerRole]

    @extend_schema(summary="Set a bank account as default")
    def post(self, request, pk):
        account = set_default_bank_account(user=request.user, bank_account_id=pk)
        return success_response(
            "Default bank account updated.",
            BankAccountReadSerializer(account).data,
        )


@extend_schema(tags=["Bank Accounts"])
class DeactivateBankAccountView(APIView):
    permission_classes = [IsAuthenticated, IsHostOrOwnerRole]

    @extend_schema(summary="Deactivate a bank account")
    def post(self, request, pk):
        deactivate_bank_account(user=request.user, bank_account_id=pk)
        return success_response("Bank account deactivated.", {})


# --- Payment Endpoints ---


@extend_schema(tags=["Payments"])
class InitializePaymentView(APIView):
    permission_classes = [IsAuthenticated, IsGuestRole]

    @extend_schema(
        summary="Initialize payment for a booking",
        request=InitializePaymentSerializer,
        responses=PaymentReadSerializer,
    )
    def post(self, request):
        serializer = InitializePaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            booking = Booking.objects.get(
                pk=serializer.validated_data["booking_id"], guest=request.user
            )
        except Booking.DoesNotExist:
            raise NotFound("Booking not found.")

        payment = initialize_payment(booking=booking)
        return success_response(
            "Payment initialized successfully.",
            PaymentReadSerializer(payment).data,
            status_code=status.HTTP_201_CREATED,
        )


@extend_schema(tags=["Payments"])
class VerifyPaymentView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(summary="Verify a payment by reference")
    def get(self, request, reference):
        payment = verify_payment(reference=reference)
        return success_response(
            "Payment verified.",
            PaymentReadSerializer(payment).data,
        )


@extend_schema(tags=["Payments"])
class BookingPaymentDetailView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Get payment status for a booking",
        responses=PaymentReadSerializer,
    )
    def get(self, request, booking_id):
        try:
            payment = get_payment_for_booking(booking_id=booking_id)
        except Payment.DoesNotExist:
            raise NotFound("Payment not found for this booking.")
        return success_response(
            "Payment retrieved successfully.",
            PaymentReadSerializer(payment).data,
        )


# --- Webhook ---


@extend_schema(tags=["Webhooks"])
class PaystackWebhookView(APIView):
    permission_classes = []
    authentication_classes = []

    @extend_schema(summary="Paystack webhook handler")
    def post(self, request):
        signature = request.headers.get("X-Paystack-Signature", "")
        if not PaystackClient.verify_webhook_signature(
            payload_body=request.body,
            signature=signature,
        ):
            return Response(
                {"error": "Invalid signature"}, status=status.HTTP_400_BAD_REQUEST
            )

        payload = json.loads(request.body)
        event_type = payload.get("event", "")
        data = payload.get("data", {})

        handle_webhook_event(event_type=event_type, data=data)

        return Response({"status": "ok"}, status=status.HTTP_200_OK)


# --- Payout Endpoints ---


@extend_schema(tags=["Payouts"])
class PayoutListView(APIView):
    permission_classes = [IsAuthenticated, IsHostOrOwnerRole]

    @extend_schema(
        summary="List user's payouts",
        responses=PayoutReadSerializer(many=True),
    )
    def get(self, request):
        payouts = get_payouts_for_user(user=request.user)
        return success_response(
            "Payouts retrieved successfully.",
            PayoutReadSerializer(payouts, many=True).data,
        )


@extend_schema(tags=["Payouts"])
class BookingPayoutsView(APIView):
    permission_classes = [IsAuthenticated, IsHostOrOwnerRole]

    @extend_schema(
        summary="List payouts for a booking",
        responses=PayoutReadSerializer(many=True),
    )
    def get(self, request, booking_id):
        try:
            payment = get_payment_for_booking(booking_id=booking_id)
        except Payment.DoesNotExist:
            raise NotFound("Payment not found for this booking.")
        payouts = get_payouts_for_payment(payment=payment)
        return success_response(
            "Payouts retrieved successfully.",
            PayoutReadSerializer(payouts, many=True).data,
        )
