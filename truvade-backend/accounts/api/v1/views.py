from django.core.exceptions import ValidationError

from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.domain.selectors import (
    get_hosts_for_owner,
    get_invitation_by_token,
    get_invitations_for_email,
    get_invitations_sent_by_owner,
    get_owners_for_host,
    get_pending_verifications,
    get_user_by_email,
    get_verification_by_id,
    get_verifications_for_user,
)
from accounts.domain.services import (
    accept_invitation,
    create_invitation,
    decline_invitation,
    register_user,
    remove_host,
    resend_otp,
    review_verification,
    revoke_invitation,
    send_otp,
    submit_verification,
    verify_otp,
)
from core.utils.responses import success_response

from .permissions import (
    IsAdminRole,
    IsHostOrOwnerRole,
    IsHostRole,
    IsOwnerRole,
)
from .serializers import (
    CreateInvitationSerializer,
    InvitationSerializer,
    InvitedSignupSerializer,
    LoginSerializer,
    MembershipSerializer,
    ResendOTPSerializer,
    ReviewVerificationSerializer,
    SignupSerializer,
    SubmitVerificationSerializer,
    UserSerializer,
    VerificationSerializer,
    VerifyOTPSerializer,
)


# --- Auth views ---


@extend_schema(tags=["Auth"], request=SignupSerializer)
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


@extend_schema(tags=["Auth"], request=LoginSerializer)
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = get_user_by_email(email=serializer.validated_data["email"])
        if user is None:
            raise ValidationError("No account found with this email.")
        send_otp(user=user)
        return success_response(
            "Verification code sent to your email.",
            None,
        )


@extend_schema(tags=["Auth"], request=VerifyOTPSerializer)
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


@extend_schema(tags=["Auth"], request=ResendOTPSerializer)
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


@extend_schema(tags=["Auth"], request=InvitedSignupSerializer)
class InvitedSignupView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = InvitedSignupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        register_user(
            name=serializer.validated_data["name"],
            email=serializer.validated_data["email"],
            phone=serializer.validated_data["phone"],
            role="HOST",
            invitation_token=serializer.validated_data["invitation_token"],
        )
        return success_response(
            "Account created. Please check your email for the verification code.",
            None,
            status_code=status.HTTP_201_CREATED,
        )


# --- Invitation views ---


@extend_schema(
    tags=["Invitations"],
    request=CreateInvitationSerializer,
    responses=InvitationSerializer,
)
class CreateInvitationView(APIView):
    permission_classes = [IsAuthenticated, IsOwnerRole]

    def post(self, request):
        serializer = CreateInvitationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        invitation = create_invitation(
            owner=request.user,
            email=serializer.validated_data["email"],
        )
        return success_response(
            "Invitation sent successfully.",
            InvitationSerializer(invitation).data,
            status_code=status.HTTP_201_CREATED,
        )


@extend_schema(tags=["Invitations"], responses=InvitationSerializer(many=True))
class InvitationListView(APIView):
    permission_classes = [IsAuthenticated, IsOwnerRole]

    def get(self, request):
        invitations = get_invitations_sent_by_owner(owner=request.user)
        return success_response(
            "Invitations retrieved successfully.",
            InvitationSerializer(invitations, many=True).data,
        )


@extend_schema(tags=["Invitations"], responses=InvitationSerializer)
class RevokeInvitationView(APIView):
    permission_classes = [IsAuthenticated, IsOwnerRole]

    def post(self, request, invitation_id):
        invitation = revoke_invitation(
            invitation_id=invitation_id,
            owner=request.user,
        )
        return success_response(
            "Invitation revoked.",
            InvitationSerializer(invitation).data,
        )


@extend_schema(tags=["Invitations"], responses=InvitationSerializer)
class InvitationDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, token):
        invitation = get_invitation_by_token(token=token)
        if invitation is None:
            raise ValidationError("Invalid invitation token.")
        return success_response(
            "Invitation details retrieved.",
            InvitationSerializer(invitation).data,
        )


@extend_schema(tags=["Invitations"], responses=MembershipSerializer)
class AcceptInvitationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, token):
        membership = accept_invitation(token=token, user=request.user)
        return success_response(
            "Invitation accepted.",
            MembershipSerializer(membership).data,
        )


@extend_schema(tags=["Invitations"], responses=InvitationSerializer)
class DeclineInvitationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, token):
        invitation = decline_invitation(token=token, user=request.user)
        return success_response(
            "Invitation declined.",
            InvitationSerializer(invitation).data,
        )


@extend_schema(tags=["Invitations"], responses=InvitationSerializer(many=True))
class PendingInvitationsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        invitations = get_invitations_for_email(email=request.user.email)
        return success_response(
            "Pending invitations retrieved.",
            InvitationSerializer(invitations, many=True).data,
        )


# --- Membership views ---


@extend_schema(tags=["Memberships"], responses=MembershipSerializer(many=True))
class HostListView(APIView):
    permission_classes = [IsAuthenticated, IsOwnerRole]

    def get(self, request):
        memberships = get_hosts_for_owner(owner=request.user)
        return success_response(
            "Hosts retrieved successfully.",
            MembershipSerializer(memberships, many=True).data,
        )


@extend_schema(tags=["Memberships"], responses=MembershipSerializer(many=True))
class OwnerListView(APIView):
    permission_classes = [IsAuthenticated, IsHostRole]

    def get(self, request):
        memberships = get_owners_for_host(host=request.user)
        return success_response(
            "Owners retrieved successfully.",
            MembershipSerializer(memberships, many=True).data,
        )


@extend_schema(tags=["Memberships"], responses=MembershipSerializer)
class RemoveHostView(APIView):
    permission_classes = [IsAuthenticated, IsOwnerRole]

    def post(self, request, membership_id):
        membership = remove_host(membership_id=membership_id, owner=request.user)
        return success_response(
            "Host removed successfully.",
            MembershipSerializer(membership).data,
        )


# --- KYC views ---


@extend_schema(
    tags=["Verification"],
    request=SubmitVerificationSerializer,
    responses=VerificationSerializer,
)
class SubmitVerificationView(APIView):
    permission_classes = [IsAuthenticated, IsHostOrOwnerRole]

    def post(self, request):
        serializer = SubmitVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        verification = submit_verification(
            user=request.user,
            verification_type=serializer.validated_data["verification_type"],
            id_number=serializer.validated_data["id_number"],
            id_document=serializer.validated_data["id_document"],
            selfie=serializer.validated_data["selfie"],
        )
        return success_response(
            "Verification submitted successfully.",
            VerificationSerializer(verification).data,
            status_code=status.HTTP_201_CREATED,
        )


@extend_schema(tags=["Verification"], responses=VerificationSerializer(many=True))
class MyVerificationsView(APIView):
    permission_classes = [IsAuthenticated, IsHostOrOwnerRole]

    def get(self, request):
        verifications = get_verifications_for_user(user=request.user)
        return success_response(
            "Verifications retrieved successfully.",
            VerificationSerializer(verifications, many=True).data,
        )


@extend_schema(tags=["Verification"], responses=VerificationSerializer(many=True))
class AdminPendingVerificationsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        verifications = get_pending_verifications()
        return success_response(
            "Pending verifications retrieved.",
            VerificationSerializer(verifications, many=True).data,
        )


@extend_schema(
    tags=["Verification"],
    request=ReviewVerificationSerializer,
    responses=VerificationSerializer,
)
class AdminReviewVerificationView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def post(self, request, verification_id):
        serializer = ReviewVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        verification = review_verification(
            verification_id=verification_id,
            admin=request.user,
            status=serializer.validated_data["status"],
            admin_notes=serializer.validated_data.get("admin_notes", ""),
        )
        return success_response(
            f"Verification {verification.status.lower()}.",
            VerificationSerializer(verification).data,
        )


@extend_schema(tags=["Verification"], responses=VerificationSerializer)
class AdminVerificationDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request, verification_id):
        verification = get_verification_by_id(verification_id=verification_id)
        if verification is None:
            raise ValidationError("Verification not found.")
        return success_response(
            "Verification retrieved.",
            VerificationSerializer(verification).data,
        )
