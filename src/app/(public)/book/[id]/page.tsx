"use client";

import React, { Suspense, useState, useMemo } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  MapPin,
  Calendar,
  Users,
  Star,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
} from "lucide-react";
import Image from "next/image";
import { Container } from "@/components/layout";
import { Button, Input, Card } from "@/components/ui";
import { mockProperties } from "@/lib/mock-data";
import { formatCurrency, formatDate, calculateNights } from "@/lib/types";

export default function BookingPage() {
  return (
    <Suspense fallback={<Container><div className="flex justify-center py-12"><div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" /></div></Container>}>
      <BookingContent />
    </Suspense>
  );
}

function BookingContent() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const property = mockProperties.find((p) => p.id === id);

  const checkIn = searchParams.get("checkIn") || "";
  const checkOut = searchParams.get("checkOut") || "";
  const guestCount = parseInt(searchParams.get("guests") || "1", 10);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 1;
    const n = calculateNights(checkIn, checkOut);
    return n > 0 ? n : 1;
  }, [checkIn, checkOut]);

  if (!property) {
    return (
      <Container>
        <div className="py-20 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Property Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            The property you are trying to book does not exist.
          </p>
          <Link href="/properties">
            <Button variant="primary">Browse Properties</Button>
          </Link>
        </div>
      </Container>
    );
  }

  const subtotal = property.basePrice * nights;
  const serviceFee = Math.round(subtotal * 0.08);
  const total = subtotal + property.cleaningFee + serviceFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // In production, this would integrate with Stripe
    alert("Booking confirmed! (Demo mode - Stripe integration coming soon)");
    setIsSubmitting(false);
    router.push("/properties");
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
            {/* Left Column - Form */}
            <div className="space-y-8">
              {/* Trip Details */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Your trip
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Dates</h3>
                      <p className="text-sm text-gray-600 mt-0.5">
                        {checkIn && checkOut
                          ? `${formatDate(checkIn)} - ${formatDate(checkOut)} (${nights} night${nights !== 1 ? "s" : ""})`
                          : "Dates not selected"}
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

              {/* Guest Information */}
              <div className="border-t border-gray-200 pt-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Guest information
                </h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="First name"
                      placeholder="Enter your first name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      fullWidth
                    />
                    <Input
                      label="Last name"
                      placeholder="Enter your last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      fullWidth
                    />
                  </div>
                  <Input
                    label="Email address"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    fullWidth
                  />
                  <Input
                    label="Phone number"
                    type="tel"
                    placeholder="+234 800 000 0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    fullWidth
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Special requests (optional)
                    </label>
                    <textarea
                      placeholder="Any special requirements or requests..."
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      rows={3}
                      className="block w-full bg-white border border-gray-300 rounded-[var(--radius-button)] px-4 py-2.5 text-gray-900 placeholder-gray-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:border-primary focus:ring-primary resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Section */}
              <div className="border-t border-gray-200 pt-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Payment
                </h2>
                <Card variant="bordered" padding="md">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#635BFF]/10 rounded-xl flex items-center justify-center overflow-hidden">
                      <Image src="/tripe.png" alt="Stripe" width={32} height={32} className="object-contain" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        Pay with Stripe
                      </h3>
                      <p className="text-sm text-gray-500">
                        Cards, bank transfer, and more
                      </p>
                    </div>
                    <div className="w-5 h-5 border-2 border-[#0B3D2C] rounded-full flex items-center justify-center">
                      <div className="w-2.5 h-2.5 bg-[#0B3D2C] rounded-full" />
                    </div>
                  </div>
                </Card>
                <div className="mt-4 flex items-start gap-2 text-sm text-gray-500">
                  <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600" />
                  <span>
                    Your payment is secured by Stripe. We never store your card
                    details.
                  </span>
                </div>
              </div>

              {/* Cancellation Policy */}
              <div className="border-t border-gray-200 pt-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Cancellation policy
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Free cancellation up to 48 hours before check-in. After that,
                  the first night is non-refundable. Cancel before check-in and
                  get a full refund minus the first night and service fee.
                </p>
              </div>

              {/* Submit Button */}
              <div className="border-t border-gray-200 pt-8 pb-4">
                <p className="text-xs text-gray-500 mb-4">
                  By clicking the button below, you agree to Truvade&apos;s Terms
                  of Service, Payment Terms, and Cancellation Policy.
                </p>
                <Button
                  type="submit"
                  size="lg"
                  fullWidth
                  loading={isSubmitting}
                  leftIcon={!isSubmitting ? <CheckCircle2 className="w-5 h-5" /> : undefined}
                >
                  {isSubmitting ? "Processing..." : `Confirm and Pay ${formatCurrency(total)}`}
                </Button>
              </div>
            </div>

            {/* Right Column - Booking Summary */}
            <div className="order-first lg:order-last">
              <div className="lg:sticky lg:top-24">
                <Card variant="bordered" padding="lg">
                  {/* Property Preview */}
                  <div className="flex gap-4 pb-5 border-b border-gray-200">
                    <div
                      className="w-28 h-20 rounded-xl bg-gray-200 flex-shrink-0"
                      style={{
                        backgroundImage: property.images[0]
                          ? `url(${property.images[0]})`
                          : undefined,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
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
                    <h3 className="font-semibold text-gray-900 mb-4">
                      Price details
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between text-gray-700">
                        <span>
                          {formatCurrency(property.basePrice)} x {nights} night
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
