from django.core.exceptions import PermissionDenied, ValidationError
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.exceptions import NotFound
from rest_framework.exceptions import PermissionDenied as DRFPermissionDenied
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from core.utils.responses import success_response
from organizations.domain.selectors import (
    get_invitation_by_token,
    get_invitations,
    get_memberships_for_user,
    get_organization_for_user,
)
from organizations.domain.services import (
    accept_invitation,
    create_organization,
    decline_invitation,
    invite_member,
    remove_member,
    revoke_invitation,
    update_organization,
)
from organizations.models import OrganizationInvitation, OrganizationMember

from .serializers import (
    CreateOrganizationSerializer,
    InviteMemberSerializer,
    OrganizationInvitationSerializer,
    OrganizationMemberSerializer,
    OrganizationSerializer,
    UpdateOrganizationSerializer,
)


def _first_message(exc):
    if hasattr(exc, "messages") and exc.messages:
        return exc.messages[0]
    return str(exc)


@extend_schema(tags=["Organizations"])
class MyOrganizationView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(summary="Get my organization")
    def get(self, request):
        org = get_organization_for_user(user=request.user)
        if org is None:
            return success_response("No organization yet.", None)
        return success_response(
            "Organization retrieved.",
            OrganizationSerializer(org).data,
        )

    @extend_schema(
        request=CreateOrganizationSerializer,
        summary="Create my organization",
    )
    def post(self, request):
        serializer = CreateOrganizationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            org = create_organization(owner=request.user, **serializer.validated_data)
        except ValidationError as exc:
            raise DRFValidationError(_first_message(exc))
        return success_response(
            "Organization created.",
            OrganizationSerializer(org).data,
            status_code=status.HTTP_201_CREATED,
        )

    @extend_schema(
        request=UpdateOrganizationSerializer,
        summary="Update my organization",
    )
    def patch(self, request):
        org = get_organization_for_user(user=request.user)
        if org is None:
            raise NotFound("Organization not found.")
        serializer = UpdateOrganizationSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        try:
            org = update_organization(
                organization=org, user=request.user, **serializer.validated_data
            )
        except PermissionDenied as exc:
            raise DRFPermissionDenied(str(exc))
        return success_response(
            "Organization updated.", OrganizationSerializer(org).data
        )


@extend_schema(tags=["Organizations"], summary="My organization memberships")
class MyMembershipsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        memberships = get_memberships_for_user(user=request.user)
        data = [
            {
                "id": m.id,
                "organization": {
                    "id": m.organization_id,
                    "name": m.organization.name,
                    "slug": m.organization.slug,
                },
                "role": m.role,
                "title": m.title,
                "is_active": m.is_active,
                "joined_at": m.joined_at.isoformat(),
            }
            for m in memberships
        ]
        return success_response("Memberships retrieved.", data)


@extend_schema(tags=["Organizations"])
class OrganizationInvitationsView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(summary="List invitations for my organization")
    def get(self, request):
        org = get_organization_for_user(user=request.user)
        if org is None:
            raise NotFound("Organization not found.")
        invitations = get_invitations(organization=org)
        return success_response(
            "Invitations retrieved.",
            OrganizationInvitationSerializer(invitations, many=True).data,
        )

    @extend_schema(
        request=InviteMemberSerializer,
        summary="Invite someone to my organization",
    )
    def post(self, request):
        org = get_organization_for_user(user=request.user)
        if org is None:
            raise NotFound("Organization not found.")
        serializer = InviteMemberSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            invitation = invite_member(
                organization=org,
                inviter=request.user,
                email=serializer.validated_data["email"],
                role=serializer.validated_data.get(
                    "role", OrganizationMember.Role.HOST
                ),
            )
        except PermissionDenied as exc:
            raise DRFPermissionDenied(str(exc))
        except ValidationError as exc:
            raise DRFValidationError(_first_message(exc))
        return success_response(
            "Invitation sent.",
            OrganizationInvitationSerializer(invitation).data,
            status_code=status.HTTP_201_CREATED,
        )


@extend_schema(tags=["Organizations"], summary="Invitations sent to me")
class MyInvitationsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        invitations = (
            OrganizationInvitation.objects.filter(
                email__iexact=request.user.email,
                status=OrganizationInvitation.Status.PENDING,
            )
            .select_related("organization", "invited_by")
            .order_by("-created_at")
        )
        return success_response(
            "Invitations retrieved.",
            OrganizationInvitationSerializer(invitations, many=True).data,
        )


@extend_schema(tags=["Organizations"])
class InvitationActionView(APIView):
    """Accept or decline an invitation as the invited user."""

    permission_classes = [IsAuthenticated]

    def _get_invitation(self, token):
        invitation = get_invitation_by_token(token=token)
        if invitation is None:
            raise NotFound("Invitation not found.")
        return invitation

    @extend_schema(summary="Accept an invitation")
    def post(self, request, token):
        invitation = self._get_invitation(token)
        try:
            accept_invitation(invitation=invitation, user=request.user)
        except PermissionDenied as exc:
            raise DRFPermissionDenied(str(exc))
        except ValidationError as exc:
            raise DRFValidationError(_first_message(exc))
        invitation.refresh_from_db()
        return success_response(
            "Invitation accepted.",
            OrganizationInvitationSerializer(invitation).data,
        )

    @extend_schema(summary="Decline an invitation")
    def delete(self, request, token):
        invitation = self._get_invitation(token)
        try:
            decline_invitation(invitation=invitation, user=request.user)
        except PermissionDenied as exc:
            raise DRFPermissionDenied(str(exc))
        except ValidationError as exc:
            raise DRFValidationError(_first_message(exc))
        invitation.refresh_from_db()
        return success_response(
            "Invitation declined.",
            OrganizationInvitationSerializer(invitation).data,
        )


@extend_schema(
    tags=["Organizations"], summary="Revoke a pending invitation (owner/manager)"
)
class RevokeInvitationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, invitation_id):
        try:
            invitation = OrganizationInvitation.objects.select_related(
                "organization"
            ).get(pk=invitation_id)
        except OrganizationInvitation.DoesNotExist:
            raise NotFound("Invitation not found.")
        try:
            revoke_invitation(invitation=invitation, user=request.user)
        except PermissionDenied as exc:
            raise DRFPermissionDenied(str(exc))
        except ValidationError as exc:
            raise DRFValidationError(_first_message(exc))
        invitation.refresh_from_db()
        return success_response(
            "Invitation revoked.",
            OrganizationInvitationSerializer(invitation).data,
        )


@extend_schema(tags=["Organizations"], summary="Remove a member from the organization")
class RemoveMemberView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, member_id):
        try:
            member = OrganizationMember.objects.select_related("organization").get(
                pk=member_id
            )
        except OrganizationMember.DoesNotExist:
            raise NotFound("Member not found.")
        try:
            remove_member(member=member, actor=request.user)
        except PermissionDenied as exc:
            raise DRFPermissionDenied(str(exc))
        except ValidationError as exc:
            raise DRFValidationError(_first_message(exc))
        return success_response("Member removed.", None)


@extend_schema(tags=["Organizations"], summary="List members of my organization")
class OrganizationMembersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        org = get_organization_for_user(user=request.user)
        if org is None:
            raise NotFound("Organization not found.")
        members = (
            OrganizationMember.objects.filter(organization=org)
            .select_related("user")
            .order_by("role", "joined_at")
        )
        return success_response(
            "Members retrieved.",
            OrganizationMemberSerializer(members, many=True).data,
        )
