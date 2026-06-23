import { api } from "./api";
import type {
  ApiMessage,
  ApiThreadDetail,
  ApiThreadSummary,
} from "./api-types";

export function listThreads(opts?: {
  includeArchived?: boolean;
}): Promise<ApiThreadSummary[]> {
  const qs = opts?.includeArchived ? "?archived=1" : "";
  return api.get<ApiThreadSummary[]>(`/v1/threads/${qs}`);
}

export function getUnreadThreadCount(): Promise<{ unread: number }> {
  return api.get<{ unread: number }>("/v1/threads/unread-count/");
}

export function getThread(threadId: number): Promise<ApiThreadDetail> {
  return api.get<ApiThreadDetail>(`/v1/threads/${threadId}/`);
}

export function sendMessage(
  threadId: number,
  body: string
): Promise<ApiMessage> {
  return api.post<ApiMessage>(`/v1/threads/${threadId}/messages/`, { body });
}

export function markThreadRead(threadId: number): Promise<void> {
  return api.post<void>(`/v1/threads/${threadId}/read/`);
}

export function setThreadArchived(
  threadId: number,
  archived: boolean
): Promise<ApiThreadSummary> {
  return api.patch<ApiThreadSummary>(`/v1/threads/${threadId}/`, {
    is_archived: archived,
  });
}

export function startThreadWithUser(
  userId: number,
  initialMessage?: string
): Promise<ApiThreadSummary> {
  return api.post<ApiThreadSummary>("/v1/threads/", {
    user_id: userId,
    initial_message: initialMessage ?? "",
  });
}

export function startThreadForBooking(
  bookingId: number,
  initialMessage?: string
): Promise<ApiThreadSummary> {
  return api.post<ApiThreadSummary>("/v1/threads/", {
    booking_id: bookingId,
    initial_message: initialMessage ?? "",
  });
}
