from django.urls import path

from .views import (
    AcceptInvitationView,
    CreateInvitationView,
    DeclineInvitationView,
    HostListView,
    InvitationDetailView,
    InvitationListView,
    InvitedSignupView,
    LoginView,
    MyVerificationsView,
    OwnerListView,
    PendingInvitationsView,
    RemoveHostView,
    ResendOTPView,
    RevokeInvitationView,
    SignupView,
    SubmitVerificationView,
    VerifyOTPView,
)

urlpatterns = [
    # Auth
    path("auth/signup/", SignupView.as_view(), name="signup"),
    path("auth/signup/invited/", InvitedSignupView.as_view(), name="invited-signup"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/verify-otp/", VerifyOTPView.as_view(), name="verify-otp"),
    path("auth/resend-otp/", ResendOTPView.as_view(), name="resend-otp"),
    # Invitations
    path("invitations/", CreateInvitationView.as_view(), name="invitation-create"),
    path("invitations/sent/", InvitationListView.as_view(), name="invitation-list"),
    path(
        "invitations/pending/",
        PendingInvitationsView.as_view(),
        name="invitation-pending",
    ),
    path(
        "invitations/<uuid:token>/",
        InvitationDetailView.as_view(),
        name="invitation-detail",
    ),
    path(
        "invitations/<uuid:token>/accept/",
        AcceptInvitationView.as_view(),
        name="invitation-accept",
    ),
    path(
        "invitations/<uuid:token>/decline/",
        DeclineInvitationView.as_view(),
        name="invitation-decline",
    ),
    path(
        "invitations/<int:invitation_id>/revoke/",
        RevokeInvitationView.as_view(),
        name="invitation-revoke",
    ),
    # Memberships
    path("hosts/", HostListView.as_view(), name="host-list"),
    path(
        "hosts/<int:membership_id>/remove/",
        RemoveHostView.as_view(),
        name="host-remove",
    ),
    path("my-owners/", OwnerListView.as_view(), name="owner-list"),
    # KYC Verification
    path(
        "verifications/",
        SubmitVerificationView.as_view(),
        name="verification-submit",
    ),
    path(
        "verifications/me/",
        MyVerificationsView.as_view(),
        name="verification-mine",
    ),
]
