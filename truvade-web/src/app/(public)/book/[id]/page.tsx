"use client";

import React, { Suspense, useState, useMemo, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, MapPin, Star, ShieldCheck, CheckCircle2, AlertCircle,
} from "lucide-react";
import { Container } from "@/components/layout";
import { Button, Card } from "@/components/ui";
import { formatCurrency, formatDate, calculateNights } from "@/lib/types";
import type { Property } from "@/lib/types";
import type { ApiBookingWithPayment } from "@/lib/api-types";
import { fetchPublicShortlet } from "@/lib/shortlet-utils";
import { api, extractErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

// ── Skeleton ──────────────────────────────────────────────────────────────────

function BookingSkeleton() {
  return (
    <Container>
      <div className="py-6 md:py-10 max-w-5xl mx-auto animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-32 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 lg:gap-12">
          <div className="space-y-6">
            <div className="h-8 bg-gray-200 rounded w-48" />
            <div className="h-32 bg-gray-200 rounded-xl" />
            <div className="h-48 bg-gray-200 rounded-xl" />
            <div className="h-16 bg-gray-200 rounded-xl" />
          </div>
          <div className="h-64 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    </Container>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <Container>
          <div className="flex justify-center py-12">
            <div className="animate-spin w-6 h-6 border-2 border-[#0B3D2C] border-t-transparent rounded-full" />
          </div>
        </Container>
      }
    >
      <BookingContent />
    </Suspense>
  );
}

function BookingContent() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [property, setProperty] = useState<Property | null>(null);
  const [propertyLoading, setPropertyLoading] = useState(true);
  const [specialRequests, setSpecialRequests] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const checkIn = searchParams.get("checkIn") || "";
  const checkOut = searchParams.get("checkOut") || "";
  const guestCount = parseInt(searchParams.get("guests") || "1", 10);

  useEffect(() => {
    if (!id) return;
    fetchPublicShortlet(id)
      .then(setProperty)
      .catch(() => router.replace("/shortlets"))
      .finally(() => setPropertyLoading(false));
  }, [id, router]);

  useEffect(() => {
    if (!authLoading && !user) {
      const redirect = `/book/${id}?${searchParams.toString()}`;
      router.replace(`/login?redirect=${encodeURIComponent(redirect)}`);
    }
  }, [authLoading, user, id, searchParams, router]);

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 1;
    const n = calculateNights(checkIn, checkOut);
    return n > 0 ? n : 1;
  }, [checkIn, checkOut]);

  if (propertyLoading || authLoading) return <BookingSkeleton />;
  if (!property || !user) return null;

  const subtotal = property.basePrice * nights;
  const serviceFee = Math.round(subtotal * 0.08);
  const total = subtotal + property.cleaningFee + serviceFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkIn || !checkOut) {
      setError("Please go back and select check-in and check-out dates.");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      const result = await api.post<ApiBookingWithPayment>("/v1/bookings/", {
        shortlet_id: parseInt(id),
        check_in: checkIn,
        check_out: checkOut,
        number_of_guests: guestCount,
        guest_note: specialRequests,
      });
      window.location.href = result.payment.authorization_url;
    } catch (err) {
      setError(extractErrorMessage(err));
      setIsSubmitting(false);
    }
  };

  return (
    <Container>
      <div className="py-6 md:py-10 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back to property</span>
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Confirm and Pay
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 lg:gap-12">
            {/* Left Column */}
            <div className="space-y-8">
              {/* Trip Details */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Your trip</h2>
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Dates</h3>
                      <p className="text-sm text-gray-600 mt-0.5">
                        {checkIn && checkOut
                          ? `${formatDate(checkIn)} – ${formatDate(checkOut)} (${nights} night${nights !== 1 ? "s" : ""})`
                          : "No dates selected"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => router.back()}
                      className="text-sm font-semibold text-[#0B3D2C] underline"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Guests</h3>
                      <p className="text-sm text-gray-600 mt-0.5">
                        {guestCount} guest{guestCount !== 1 && "s"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => router.back()}
                      className="text-sm font-semibold text-[#0B3D2C] underline"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>

              {/* Guest Info */}
              <div className="border-t border-gray-200 pt-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Guest information
                </h2>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>
                    {user.phone && (
                      <p className="text-sm text-gray-500">{user.phone}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Special requests{" "}
                      <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <textarea
                      placeholder="Early check-in, specific floor preference, etc."
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      rows={3}
                      className="block w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:border-[#0B3D2C] focus:ring-[#0B3D2C] resize-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Payment */}
              <div className="border-t border-gray-200 pt-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment</h2>
                <Card variant="bordered" padding="md">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#00C3F7]/10 rounded-xl flex items-center justify-center shrink-0">
                      <span className="text-lg font-bold text-[#00C3F7]">₦</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">Pay with Paystack</h3>
                      <p className="text-sm text-gray-500">Cards, bank transfer, USSD, and more</p>
                    </div>
                    <div className="w-5 h-5 border-2 border-[#0B3D2C] rounded-full flex items-center justify-center shrink-0">
                      <div className="w-2.5 h-2.5 bg-[#0B3D2C] rounded-full" />
                    </div>
                  </div>
                </Card>
                <div className="mt-4 flex items-start gap-2 text-sm text-gray-500">
                  <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0 text-green-600" />
                  <span>
                    Payments are processed securely by Paystack. You&apos;ll be redirected
                    to complete your payment.
                  </span>
                </div>
              </div>

              {/* Cancellation Policy */}
              <div className="border-t border-gray-200 pt-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Cancellation policy
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Free cancellation up to 48 hours before check-in. After that, the
                  first night is non-refundable.
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit */}
              <div className="border-t border-gray-200 pt-8 pb-4">
                <p className="text-xs text-gray-500 mb-4">
                  By clicking the button below, you agree to Truvade&apos;s Terms of
                  Service and Cancellation Policy.
                </p>
                <Button
                  type="submit"
                  size="lg"
                  fullWidth
                  loading={isSubmitting}
                  leftIcon={!isSubmitting ? <CheckCircle2 className="w-5 h-5" /> : undefined}
                >
                  {isSubmitting
                    ? "Redirecting to Paystack..."
                    : `Confirm and Pay ${formatCurrency(total)}`}
                </Button>
              </div>
            </div>

            {/* Right Column — Summary */}
            <div className="order-first lg:order-last">
              <div className="lg:sticky lg:top-24">
                <Card variant="bordered" padding="lg">
                  {/* Property Preview */}
                  <div className="flex gap-4 pb-5 border-b border-gray-200">
                    <div
                      className="w-28 h-20 rounded-xl bg-gray-200 shrink-0"
                      style={
                        property.images[0]
                          ? {
                              backgroundImage: `url(${property.images[0]})`,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                            }
                          : undefined
                      }
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">
                        {property.title}
                      </h3>
                      <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                        <MapPin className="w-3 h-3" />
                        {property.city}, {property.state}
                      </div>
                      {property.rating && (
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-3 h-3 fill-black text-black" />
                          <span className="text-xs font-medium">
                            {property.rating.toFixed(1)}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({property.reviewCount})
                          </span>
                        </div>
                      )}
                      {property.hostName && (
                        <p className="text-xs text-gray-500 mt-1">
                          Hosted by {property.hostName}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Price Breakdown */}
                  <div className="pt-5">
                    <h3 className="font-semibold text-gray-900 mb-4">Price details</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between text-gray-700">
                        <span>
                          {formatCurrency(property.basePrice)} × {nights} night
                          {nights !== 1 && "s"}
                        </span>
                        <span>{formatCurrency(subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-gray-700">
                        <span>Cleaning fee</span>
                        <span>{formatCurrency(property.cleaningFee)}</span>
                      </div>
                      <div className="flex justify-between text-gray-700">
                        <span>Service fee</span>
                        <span>{formatCurrency(serviceFee)}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-gray-900 pt-3 border-t border-gray-200 text-base">
                        <span>Total ({property.currency})</span>
                        <span>{formatCurrency(total)}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </form>
      </div>
    </Container>
  );
}
