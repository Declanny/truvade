from django.urls import path

from .views import (
    InvitationActionView,
    MyInvitationsView,
    MyMembershipsView,
    MyOrganizationView,
    OrganizationInvitationsView,
    OrganizationMembersView,
    RemoveMemberView,
    RevokeInvitationView,
)

urlpatterns = [
    path("organization/", MyOrganizationView.as_view(), name="my-organization"),
    path(
        "organization/members/",
        OrganizationMembersView.as_view(),
        name="organization-members",
    ),
    path(
        "organization/members/<int:member_id>/remove/",
        RemoveMemberView.as_view(),
        name="organization-member-remove",
    ),
    path(
        "organization/invitations/",
        OrganizationInvitationsView.as_view(),
        name="organization-invitations",
    ),
    path(
        "organization/invitations/<int:invitation_id>/revoke/",
        RevokeInvitationView.as_view(),
        name="organization-invitation-revoke",
    ),
    path(
        "organization-memberships/",
        MyMembershipsView.as_view(),
        name="my-organization-memberships",
    ),
    path(
        "organization-invitations/",
        MyInvitationsView.as_view(),
        name="my-organization-invitations",
    ),
    path(
        "organization-invitations/<uuid:token>/",
        InvitationActionView.as_view(),
        name="organization-invitation-action",
    ),
]
