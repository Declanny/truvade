from rest_framework import serializers

from payments.models import BankAccount, Payment, Payout


class BankListSerializer(serializers.Serializer):
    name = serializers.CharField()
    code = serializers.CharField()


class ResolveBankAccountSerializer(serializers.Serializer):
    account_number = serializers.CharField(max_length=10, min_length=10)
    bank_code = serializers.CharField(max_length=10)


class AddBankAccountSerializer(serializers.Serializer):
    bank_name = serializers.CharField(max_length=100)
    bank_code = serializers.CharField(max_length=10)
    account_number = serializers.CharField(max_length=10, min_length=10)
    account_name = serializers.CharField(max_length=200)


class BankAccountReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = BankAccount
        fields = [
            "id",
            "bank_name",
            "bank_code",
            "account_number",
            "account_name",
            "is_default",
            "is_active",
            "created_at",
        ]
        read_only_fields = fields


class InitializePaymentSerializer(serializers.Serializer):
    booking_id = serializers.IntegerField()


class PaymentReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            "id",
            "booking",
            "reference",
            "amount",
            "currency",
            "status",
            "paystack_authorization_url",
            "paid_at",
            "created_at",
        ]
        read_only_fields = fields


class PayoutReadSerializer(serializers.ModelSerializer):
    bank_account = BankAccountReadSerializer(read_only=True)

    class Meta:
        model = Payout
        fields = [
            "id",
            "recipient_type",
            "amount",
            "transfer_reference",
            "status",
            "bank_account",
            "completed_at",
            "created_at",
        ]
        read_only_fields = fields
