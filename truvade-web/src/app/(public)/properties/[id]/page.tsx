"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  MapPin, Star, Users, BedDouble, Bath, Minus, Plus,
  ChevronLeft, Share2, Heart, ShieldCheck,
  Wifi, Wind, Car, UtensilsCrossed, Tv, Dumbbell, Waves,
  Zap, Droplets, TreePine, PawPrint, Monitor, Flame,
} from "lucide-react";
import { Container } from "@/components/layout";
import { Button, Badge, Card } from "@/components/ui";
import { PropertyGallery, HostSection, BookingCalendar, PropertyMap, ReviewsSection } from "@/components/property";
import { formatCurrency, calculateNights } from "@/lib/types";
import type { Property } from "@/lib/types";
import type { ApiAvailability } from "@/lib/api-types";
import { fetchPublicShortlet } from "@/lib/shortlet-utils";
import { api } from "@/lib/api";

const amenityIcons: Record<string, React.ElementType> = {
  WiFi: Wifi,
  "Air Conditioning": Wind,
  Parking: Car,
  Kitchen: UtensilsCrossed,
  TV: Tv,
  Gym: Dumbbell,
  Pool: Waves,
  Generator: Zap,
  "Water Heater": Droplets,
  Garden: TreePine,
  "Pet Friendly": PawPrint,
  Workspace: Monitor,
  BBQ: Flame,
  Security: ShieldCheck,
};

// ── Skeleton ──────────────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <Container size="lg">
      <div className="py-4 md:py-8 animate-pulse">
        <div className="aspect-[16/7] rounded-2xl bg-gray-200 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-32 bg-gray-200 rounded" />
          </div>
          <div className="h-64 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    </Container>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [property, setProperty] = useState<Property | null>(null);
  const [bookedRanges, setBookedRanges] = useState<{ checkIn: Date; checkOut: Date }[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guestCount, setGuestCount] = useState(1);
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    if (!id) return;

    Promise.all([
      fetchPublicShortlet(id),
      api.get<ApiAvailability[]>(`/v1/shortlets/${id}/availability/`),
    ])
      .then(([prop, availability]) => {
        setProperty(prop);
        setBookedRanges(
          availability.map((a) => ({
            checkIn: new Date(a.check_in),
            checkOut: new Date(a.check_out),
          }))
        );
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    return calculateNights(checkIn, checkOut);
  }, [checkIn, checkOut]);

  const subtotal = property ? property.basePrice * nights : 0;
  const serviceFee = Math.round(subtotal * 0.08);
  const total = property ? subtotal + property.cleaningFee + serviceFee : 0;

  if (loading) return <DetailSkeleton />;

  if (notFound || !property) {
    return (
      <Container size="lg">
        <div className="py-20 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Property Not Found</h1>
          <p className="text-gray-600 mb-6">
            This property does not exist or is no longer available.
          </p>
          <Link href="/shortlets">
            <Button variant="primary">Browse Shortlets</Button>
          </Link>
        </div>
      </Container>
    );
  }

  const handleReserve = () => {
    const params = new URLSearchParams();
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    params.set("guests", guestCount.toString());
    router.push(`/book/${property.id}?${params.toString()}`);
  };

  return (
    <Container size="lg">
      <div className="py-4 md:py-8">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium hidden md:inline">Back</span>
          </button>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Share2 className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Heart className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Gallery */}
        <PropertyGallery images={property.images} alt={property.title} />

        {/* Content grid */}
        <div className="mt-6 md:mt-8 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 lg:gap-12">
          {/* Left column */}
          <div>
            <div className="pb-6 border-b border-gray-200">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {property.verified && (
                  <Badge variant="success" size="sm" icon={<ShieldCheck className="w-3.5 h-3.5" />}>
                    Verified
                  </Badge>
                )}
                {property.featured && <Badge variant="accent" size="sm">Featured</Badge>}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{property.title}</h1>
              <div className="flex items-center gap-4 mt-3 text-gray-600">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">
                    {property.address}, {property.city}, {property.state}
                  </span>
                </div>
                {property.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-black text-black" />
                    <span className="text-sm font-medium text-gray-900">
                      {property.rating.toFixed(1)}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({property.reviewCount} reviews)
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-6 mt-4 text-sm text-gray-700">
                <div className="flex items-center gap-1.5">
                  <BedDouble className="w-4 h-4" />
                  {property.bedrooms} bedroom{property.bedrooms !== 1 && "s"}
                </div>
                <div className="flex items-center gap-1.5">
                  <Bath className="w-4 h-4" />
                  {property.bathrooms} bathroom{property.bathrooms !== 1 && "s"}
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  Up to {property.maxGuests} guests
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="py-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">About this property</h2>
              <p className="text-gray-600 leading-relaxed">{property.description}</p>
              <p className="mt-3 text-sm text-gray-500">
                Minimum stay: {property.minNights} night{property.minNights !== 1 && "s"}
              </p>
            </div>

            {/* Amenities */}
            {property.amenities.length > 0 && (
              <div className="py-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {property.amenities.map((amenity) => {
                    const Icon = amenityIcons[amenity] || ShieldCheck;
                    return (
                      <div key={amenity} className="flex items-center gap-3 text-gray-700">
                        <Icon className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        <span className="text-sm">{amenity}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Host */}
            <HostSection property={property} />

            {/* Reviews */}
            <ReviewsSection shortletId={property.id} />

            {/* Map */}
            <div className="py-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Location</h2>
              <p className="text-sm text-gray-600 mb-3">
                {property.city}, {property.state}, {property.country}
              </p>
              <div className="w-full h-64 md:h-80">
                <PropertyMap
                  lat={property.lat}
                  lng={property.lng}
                  city={property.city}
                  state={property.state}
                />
              </div>
            </div>
          </div>

          {/* Right sidebar — booking card */}
          <div className="order-first lg:order-last">
            <div className="lg:sticky lg:top-24">
              <Card variant="bordered" padding="lg">
                <div className="flex items-baseline justify-between mb-5">
                  <div>
                    <span className="text-2xl font-bold text-gray-900">
                      {formatCurrency(property.basePrice)}
                    </span>
                    <span className="text-gray-500 ml-1">/night</span>
                  </div>
                  {property.rating && (
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="w-4 h-4 fill-black text-black" />
                      <span className="font-medium">{property.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                {/* Date picker */}
                <div className="relative mb-4">
                  <button
                    type="button"
                    onClick={() => setCalendarOpen(!calendarOpen)}
                    className="w-full border border-gray-300 rounded-xl overflow-hidden text-left hover:border-gray-400 transition-colors"
                  >
                    <div className="grid grid-cols-2 divide-x divide-gray-300">
                      <div className="p-3">
                        <span className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                          Check-in
                        </span>
                        <span className={`text-sm ${checkIn ? "text-gray-900" : "text-gray-400"}`}>
                          {checkIn
                            ? new Date(checkIn + "T00:00:00").toLocaleDateString("en-NG", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "Add date"}
                        </span>
                      </div>
                      <div className="p-3">
                        <span className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                          Check-out
                        </span>
                        <span className={`text-sm ${checkOut ? "text-gray-900" : "text-gray-400"}`}>
                          {checkOut
                            ? new Date(checkOut + "T00:00:00").toLocaleDateString("en-NG", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "Add date"}
                        </span>
                      </div>
                    </div>
                  </button>

                  {calendarOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setCalendarOpen(false)} />
                      <div className="absolute left-0 right-0 lg:left-auto lg:right-0 lg:w-[580px] mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl z-20 p-5">
                        <BookingCalendar
                          bookedRanges={bookedRanges}
                          minNights={property.minNights}
                          checkIn={checkIn}
                          checkOut={checkOut}
                          onSelect={(ci, co) => {
                            setCheckIn(ci);
                            setCheckOut(co);
                            if (ci && co) setCalendarOpen(false);
                          }}
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Guests */}
                <div className="border border-gray-300 rounded-xl p-3 mb-4">
                  <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Guests
                  </label>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-900">
                      {guestCount} guest{guestCount !== 1 && "s"}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                        disabled={guestCount <= 1}
                        className="w-8 h-8 border border-gray-300 rounded-full flex items-center justify-center hover:border-gray-500 transition-colors disabled:opacity-30"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setGuestCount(Math.min(property.maxGuests, guestCount + 1))}
                        disabled={guestCount >= property.maxGuests}
                        className="w-8 h-8 border border-gray-300 rounded-full flex items-center justify-center hover:border-gray-500 transition-colors disabled:opacity-30"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <Button fullWidth size="lg" onClick={handleReserve}>
                  Reserve
                </Button>

                {nights > 0 && (
                  <div className="mt-5 space-y-3 text-sm">
                    <p className="text-center text-gray-500">You won&apos;t be charged yet</p>
                    <div className="flex justify-between text-gray-700">
                      <span className="underline">
                        {formatCurrency(property.basePrice)} × {nights} night{nights !== 1 && "s"}
                      </span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span className="underline">Cleaning fee</span>
                      <span>{formatCurrency(property.cleaningFee)}</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span className="underline">Service fee</span>
                      <span>{formatCurrency(serviceFee)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-gray-900 pt-3 border-t border-gray-200">
                      <span>Total</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
