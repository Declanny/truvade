from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from core.utils.responses import success_response
from accounts.domain.services import register_user, resend_otp, send_otp, verify_otp
from accounts.domain.selectors import get_user_by_email

from .serializers import (
    LoginSerializer,
    ResendOTPSerializer,
    SignupSerializer,
    UserSerializer,
    VerifyOTPSerializer,
)


class SignupView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        register_user(**serializer.validated_data)
        return success_response(
            "Account created. Please check your email for the verification code.",
            None,
            status_code=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = get_user_by_email(email=serializer.validated_data["email"])
        if user is None:
            from django.core.exceptions import ValidationError
            raise ValidationError("No account found with this email.")
        send_otp(user=user)
        return success_response(
            "Verification code sent to your email.",
            None,
        )


class VerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = verify_otp(
            email=serializer.validated_data["email"],
            code=serializer.validated_data["otp"],
        )
        refresh = RefreshToken.for_user(user)
        return success_response(
            "Email verified successfully.",
            {
                "user": UserSerializer(user).data,
                "tokens": {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                },
            },
        )


class ResendOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResendOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        resend_otp(email=serializer.validated_data["email"])
        return success_response(
            "Verification code resent to your email.",
            None,
        )
