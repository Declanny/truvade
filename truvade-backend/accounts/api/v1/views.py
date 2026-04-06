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
    get_profile_completion,
    get_public_profile,
    get_user_by_email,
    get_verifications_for_user,
)
from accounts.domain.services import (
    accept_invitation,
    create_invitation,
    decline_invitation,
    register_user,
    remove_host,
    resend_otp,
    revoke_invitation,
    send_otp,
    submit_verification,
    update_profile,
    upload_avatar,
    verify_otp,
)
from core.utils.responses import success_response

from .permissions import (
    IsHostOrOwnerRole,
    IsHostRole,
    IsOwnerRole,
)
from .serializers import (
    AvatarUploadSerializer,
    CreateInvitationSerializer,
    InvitationSerializer,
    InvitedSignupSerializer,
    LoginSerializer,
    MembershipSerializer,
    OwnProfileSerializer,
    PublicProfileSerializer,
    ResendOTPSerializer,
    SignupSerializer,
    SubmitVerificationSerializer,
    UpdateProfileSerializer,
    UserSerializer,
    VerificationSerializer,
    VerifyOTPSerializer,
)


# --- Auth views ---


@extend_schema(tags=["Auth"], request=SignupSerializer, summary="Signup")
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


@extend_schema(tags=["Auth"], request=LoginSerializer, summary="Login")
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


@extend_schema(tags=["Auth"], request=VerifyOTPSerializer, summary="Verify OTP")
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


@extend_schema(
    tags=["Auth"], request=ResendOTPSerializer, summary="Resend verification code"
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


@extend_schema(tags=["Auth"], request=InvitedSignupSerializer, summary="Invited signup")
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
    summary="Create invitation",
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


@extend_schema(
    tags=["Invitations"],
    responses=InvitationSerializer(many=True),
    summary="Get invitations sent by owner",
)
class InvitationListView(APIView):
    permission_classes = [IsAuthenticated, IsOwnerRole]

    def get(self, request):
        invitations = get_invitations_sent_by_owner(owner=request.user)
        return success_response(
            "Invitations retrieved successfully.",
            InvitationSerializer(invitations, many=True).data,
        )


@extend_schema(
    tags=["Invitations"],
    responses=InvitationSerializer,
    summary="Revoke invitation by id",
)
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


@extend_schema(
    tags=["Invitations"],
    responses=InvitationSerializer,
    summary="Get invitation detail by token",
)
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


@extend_schema(
    tags=["Invitations"],
    responses=MembershipSerializer,
    summary="Accept invitation by token",
)
class AcceptInvitationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, token):
        membership = accept_invitation(token=token, user=request.user)
        return success_response(
            "Invitation accepted.",
            MembershipSerializer(membership).data,
        )


@extend_schema(
    tags=["Invitations"], responses=InvitationSerializer, summary="Decline invitation"
)
class DeclineInvitationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, token):
        invitation = decline_invitation(token=token, user=request.user)
        return success_response(
            "Invitation declined.",
            InvitationSerializer(invitation).data,
        )


@extend_schema(
    tags=["Invitations"],
    responses=InvitationSerializer(many=True),
    summary="Get pending invitations",
)
class PendingInvitationsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        invitations = get_invitations_for_email(email=request.user.email)
        return success_response(
            "Pending invitations retrieved.",
            InvitationSerializer(invitations, many=True).data,
        )


# --- Membership views ---


@extend_schema(
    tags=["Memberships"],
    responses=MembershipSerializer(many=True),
    summary="Get hosts for owner",
)
class HostListView(APIView):
    permission_classes = [IsAuthenticated, IsOwnerRole]

    def get(self, request):
        memberships = get_hosts_for_owner(owner=request.user)
        return success_response(
            "Hosts retrieved successfully.",
            MembershipSerializer(memberships, many=True).data,
        )


@extend_schema(
    tags=["Memberships"],
    responses=MembershipSerializer(many=True),
    summary="Get owners for host",
)
class OwnerListView(APIView):
    permission_classes = [IsAuthenticated, IsHostRole]

    def get(self, request):
        memberships = get_owners_for_host(host=request.user)
        return success_response(
            "Owners retrieved successfully.",
            MembershipSerializer(memberships, many=True).data,
        )


@extend_schema(
    tags=["Memberships"], responses=MembershipSerializer, summary="Remove host"
)
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
    summary="Submit verification",
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


@extend_schema(
    tags=["Verification"],
    responses=VerificationSerializer(many=True),
    summary="Get my verifications",
)
class MyVerificationsView(APIView):
    permission_classes = [IsAuthenticated, IsHostOrOwnerRole]

    def get(self, request):
        verifications = get_verifications_for_user(user=request.user)
        return success_response(
            "Verifications retrieved successfully.",
            VerificationSerializer(verifications, many=True).data,
        )


# --- Profile views ---


@extend_schema(
    tags=["Profile"],
    responses=OwnProfileSerializer,
    summary="Get or update own profile",
)
class MyProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return success_response(
            "Profile retrieved successfully.",
            OwnProfileSerializer(request.user).data,
        )

    @extend_schema(request=UpdateProfileSerializer)
    def patch(self, request):
        serializer = UpdateProfileSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = update_profile(user=request.user, **serializer.validated_data)
        return success_response(
            "Profile updated successfully.",
            OwnProfileSerializer(user).data,
        )


@extend_schema(
    tags=["Profile"],
    request=AvatarUploadSerializer,
    responses=OwnProfileSerializer,
    summary="Upload avatar",
)
class AvatarUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = AvatarUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = upload_avatar(
            user=request.user, avatar=serializer.validated_data["avatar"]
        )
        return success_response(
            "Avatar uploaded successfully.",
            OwnProfileSerializer(user).data,
        )


@extend_schema(
    tags=["Profile"],
    responses=PublicProfileSerializer,
    summary="Get public profile",
)
class PublicProfileView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, user_id):
        user = get_public_profile(user_id=user_id)
        if user is None:
            return success_response(
                "User not found.",
                None,
                status_code=status.HTTP_404_NOT_FOUND,
            )
        return success_response(
            "Profile retrieved successfully.",
            PublicProfileSerializer(user).data,
        )


@extend_schema(
    tags=["Profile"],
    summary="Get profile completion",
)
class ProfileCompletionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        completion = get_profile_completion(user=request.user)
        return success_response(
            "Profile completion retrieved successfully.",
            completion,
        )
