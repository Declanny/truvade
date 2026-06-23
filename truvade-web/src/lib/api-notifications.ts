import { api } from "./api";
import type {
  ApiNotification,
  ApiNotificationPreference,
  ApiNotificationPreferencePatch,
} from "./api-types";

export function listNotifications(opts?: {
  unreadOnly?: boolean;
}): Promise<ApiNotification[]> {
  const qs = opts?.unreadOnly ? "?unread=1" : "";
  return api.get<ApiNotification[]>(`/v1/notifications/${qs}`);
}

export function getUnreadCount(): Promise<{ unread: number }> {
  return api.get<{ unread: number }>("/v1/notifications/unread-count/");
}

export function markNotificationRead(id: number): Promise<ApiNotification> {
  return api.post<ApiNotification>(`/v1/notifications/${id}/read/`);
}

export function markAllNotificationsRead(): Promise<{ updated: number }> {
  return api.post<{ updated: number }>("/v1/notifications/read-all/");
}

export function getNotificationPreferences(): Promise<ApiNotificationPreference> {
  return api.get<ApiNotificationPreference>("/v1/notifications/preferences/");
}

export function updateNotificationPreferences(
  patch: ApiNotificationPreferencePatch
): Promise<ApiNotificationPreference> {
  return api.patch<ApiNotificationPreference>(
    "/v1/notifications/preferences/",
    patch
  );
}
