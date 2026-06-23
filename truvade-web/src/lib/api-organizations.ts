import { api } from "./api";
import type {
  ApiCreateOrganizationPayload,
  ApiOrganization,
  ApiOrganizationInvitation,
  ApiOrgMemberRole,
  ApiUpdateOrganizationPayload,
} from "./api-types";

export function getMyOrganization(): Promise<ApiOrganization | null> {
  return api.get<ApiOrganization | null>("/v1/organization/");
}

export function createMyOrganization(
  payload: ApiCreateOrganizationPayload
): Promise<ApiOrganization> {
  return api.post<ApiOrganization>("/v1/organization/", payload);
}

export function updateMyOrganization(
  payload: ApiUpdateOrganizationPayload
): Promise<ApiOrganization> {
  return api.patch<ApiOrganization>("/v1/organization/", payload);
}

export function listOrganizationInvitations(): Promise<
  ApiOrganizationInvitation[]
> {
  return api.get<ApiOrganizationInvitation[]>(
    "/v1/organization/invitations/"
  );
}

export function inviteOrganizationMember(
  email: string,
  role: ApiOrgMemberRole = "HOST"
): Promise<ApiOrganizationInvitation> {
  return api.post<ApiOrganizationInvitation>(
    "/v1/organization/invitations/",
    { email, role }
  );
}

export function revokeOrganizationInvitation(
  invitationId: number
): Promise<ApiOrganizationInvitation> {
  return api.post<ApiOrganizationInvitation>(
    `/v1/organization/invitations/${invitationId}/revoke/`
  );
}

export function removeOrganizationMember(memberId: number): Promise<void> {
  return api.delete<void>(`/v1/organization/members/${memberId}/remove/`);
}

export function listMyInvitations(): Promise<ApiOrganizationInvitation[]> {
  return api.get<ApiOrganizationInvitation[]>("/v1/organization-invitations/");
}

export function acceptInvitation(
  token: string
): Promise<ApiOrganizationInvitation> {
  return api.post<ApiOrganizationInvitation>(
    `/v1/organization-invitations/${token}/`
  );
}

export function declineInvitation(
  token: string
): Promise<ApiOrganizationInvitation> {
  return api.delete<ApiOrganizationInvitation>(
    `/v1/organization-invitations/${token}/`
  );
}
