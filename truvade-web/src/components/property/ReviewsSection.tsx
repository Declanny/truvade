"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { Avatar, Skeleton } from "@/components/ui";
import { extractErrorMessage } from "@/lib/api";
import { getRatingSummary, listReviewsForShortlet } from "@/lib/api-reviews";
import type { ApiRatingSummary, ApiReview } from "@/lib/api-types";

interface ReviewsSectionProps {
  shortletId: number | string;
}

const SUB_RATINGS: { key: keyof ApiRatingSummary; label: string }[] = [
  { key: "cleanliness", label: "Cleanliness" },
  { key: "accuracy", label: "Accuracy" },
  { key: "communication", label: "Communication" },
  { key: "location", label: "Location" },
  { key: "check_in_experience", label: "Check-in" },
  { key: "value", label: "Value" },
];

export function ReviewsSection({ shortletId }: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [summary, setSummary] = useState<ApiRatingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      listReviewsForShortlet(shortletId),
      getRatingSummary(shortletId),
    ])
      .then(([rs, sm]) => {
        if (cancelled) return;
        setReviews(rs);
        setSummary(sm);
      })
      .catch((err) => {
        if (!cancelled) setError(extractErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [shortletId]);

  if (loading) return <ReviewsSkeleton />;

  if (error) {
    return (
      <div className="py-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Reviews</h2>
        <p className="text-sm text-gray-500">Reviews couldn’t load right now.</p>
      </div>
    );
  }

  if (!summary || summary.count === 0) {
    return (
      <div className="py-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Reviews</h2>
        <p className="text-sm text-gray-500">No reviews yet. Be the first to stay!</p>
      </div>
    );
  }

  const visible = expanded ? reviews : reviews.slice(0, 6);

  return (
    <div className="py-6 border-b border-gray-200">
      <div className="flex items-center gap-3 mb-6">
        <Star className="w-6 h-6 fill-black text-black" />
        <span className="text-2xl font-bold">
          {summary.rating?.toFixed(2) ?? "—"}
        </span>
        <span className="text-gray-500">
          · {summary.count} review{summary.count !== 1 && "s"}
        </span>
      </div>

      {/* Sub-rating bars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-3 mb-8">
        {SUB_RATINGS.map(({ key, label }) => {
          const v = summary[key] as number | null;
          if (v == null) return null;
          return (
            <div key={key} className="flex items-center gap-4 text-sm">
              <span className="w-28 text-gray-700">{label}</span>
              <div className="flex-1 h-1 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-full bg-gray-900"
                  style={{ width: `${(v / 5) * 100}%` }}
                />
              </div>
              <span className="w-10 text-right text-gray-900 font-medium">
                {v.toFixed(1)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Individual reviews */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
        {visible.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      {reviews.length > 6 && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="mt-6 text-sm font-semibold text-gray-900 underline hover:text-gray-700"
        >
          Show all {reviews.length} reviews
        </button>
      )}
    </div>
  );
}

function ReviewCard({ review }: { review: ApiReview }) {
  const initials = review.guest_name
    ? review.guest_name
        .split(" ")
        .map((s) => s[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "G";

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <Avatar
          src={review.guest_avatar ?? undefined}
          initials={initials}
          size="md"
        />
        <div>
          <p className="font-semibold text-gray-900">
            {review.guest_name || "Guest"}
          </p>
          <p className="text-xs text-gray-500">{formatDate(review.created_at)}</p>
        </div>
      </div>
      <div className="flex items-center gap-1 mb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`w-3.5 h-3.5 ${
              i < review.rating ? "fill-black text-black" : "text-gray-300"
            }`}
          />
        ))}
      </div>
      {review.comment && (
        <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>
      )}
      {review.reply && (
        <div className="mt-3 ml-6 pl-3 border-l-2 border-gray-200">
          <p className="text-xs font-semibold text-gray-900">
            Response from {review.reply.author_name || "host"}
          </p>
          <p className="text-sm text-gray-700 mt-1">{review.reply.body}</p>
        </div>
      )}
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-NG", {
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function ReviewsSkeleton() {
  return (
    <div className="py-6 border-b border-gray-200">
      <Skeleton className="h-8 w-48 mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-3 w-full" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {[1, 2].map((i) => (
          <div key={i} className="space-y-2">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}
