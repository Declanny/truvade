"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button, Modal } from "@/components/ui";
import { extractErrorMessage } from "@/lib/api";
import { createReviewForBooking } from "@/lib/api-reviews";
import type { ApiCreateReviewPayload, ApiReview } from "@/lib/api-types";

interface ReviewFormModalProps {
  bookingId: number;
  shortletTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmitted?: (review: ApiReview) => void;
}

const SUB_FIELDS: { key: keyof ApiCreateReviewPayload; label: string }[] = [
  { key: "cleanliness", label: "Cleanliness" },
  { key: "accuracy", label: "Accuracy" },
  { key: "communication", label: "Communication" },
  { key: "location", label: "Location" },
  { key: "check_in_experience", label: "Check-in" },
  { key: "value", label: "Value" },
];

export function ReviewFormModal({
  bookingId,
  shortletTitle,
  isOpen,
  onClose,
  onSubmitted,
}: ReviewFormModalProps) {
  const [rating, setRating] = useState(0);
  const [sub, setSub] = useState<Record<string, number>>({});
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setRating(0);
    setSub({});
    setComment("");
    setError(null);
    setSubmitting(false);
  }

  function handleClose() {
    if (submitting) return;
    reset();
    onClose();
  }

  async function handleSubmit() {
    if (rating < 1) {
      setError("Please pick an overall rating.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload: ApiCreateReviewPayload = {
        rating,
        comment,
        ...sub,
      };
      const review = await createReviewForBooking(bookingId, payload);
      onSubmitted?.(review);
      reset();
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Review ${shortletTitle}`}
      size="lg"
    >
      <div className="space-y-6">
        <StarPicker
          label="Overall rating"
          value={rating}
          onChange={setRating}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          {SUB_FIELDS.map(({ key, label }) => (
            <StarPicker
              key={key}
              label={label}
              value={(sub[key] as number) ?? 0}
              onChange={(v) => setSub((prev) => ({ ...prev, [key]: v }))}
            />
          ))}
        </div>

        <div>
          <label
            htmlFor="review-comment"
            className="block text-sm font-semibold text-gray-900 mb-1"
          >
            Tell other guests about your stay
          </label>
          <textarea
            id="review-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            placeholder="What did you love? What could be improved?"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={submitting}>
            Submit review
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function StarPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  const display = hover || value;
  return (
    <div>
      <div className="text-sm font-semibold text-gray-900 mb-1">{label}</div>
      <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHover(n)}
            onClick={() => onChange(n)}
            aria-label={`${n} star${n !== 1 ? "s" : ""}`}
            className="p-0.5"
          >
            <Star
              className={`w-6 h-6 ${
                n <= display ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
