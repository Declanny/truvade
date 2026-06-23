import { api } from "./api";
import type {
  ApiCreateReviewPayload,
  ApiPendingReview,
  ApiRatingSummary,
  ApiReview,
} from "./api-types";

export function listReviewsForShortlet(
  shortletId: number | string
): Promise<ApiReview[]> {
  return api.get<ApiReview[]>(`/v1/shortlets/${shortletId}/reviews/`);
}

export function getRatingSummary(
  shortletId: number | string
): Promise<ApiRatingSummary> {
  return api.get<ApiRatingSummary>(
    `/v1/shortlets/${shortletId}/reviews/summary/`
  );
}

export function getPendingReviews(): Promise<ApiPendingReview[]> {
  return api.get<ApiPendingReview[]>("/v1/reviews/pending/");
}

export function createReviewForBooking(
  bookingId: number,
  payload: ApiCreateReviewPayload
): Promise<ApiReview> {
  return api.post<ApiReview>(`/v1/bookings/${bookingId}/review/`, payload);
}

export function updateReview(
  reviewId: number,
  payload: Partial<ApiCreateReviewPayload>
): Promise<ApiReview> {
  return api.patch<ApiReview>(`/v1/reviews/${reviewId}/`, payload);
}

export function replyToReview(
  reviewId: number,
  body: string
): Promise<ApiReview> {
  return api.post<ApiReview>(`/v1/reviews/${reviewId}/reply/`, { body });
}
