"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, MapPin, Clock, X, AlertCircle } from "lucide-react";
import { Card, CardBody, Badge, Button } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/types";
import type { ApiBooking } from "@/lib/api-types";
import type { BookingStatus } from "@/lib/api-types";
import { api, extractErrorMessage } from "@/lib/api";
import Link from "next/link";

type Tab = "upcoming" | "completed" | "cancelled";

const STATUS_BADGE: Record<BookingStatus, "success" | "warning" | "info" | "gray" | "error"> = {
  CONFIRMED: "success",
  PENDING: "warning",
  COMPLETED: "gray",
  CANCELLED: "error",
};

const STATUS_LABEL: Record<BookingStatus, string> = {
  CONFIRMED: "Confirmed",
  PENDING: "Pending",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const tabs: { key: Tab; label: string }[] = [
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

function filterByTab(bookings: ApiBooking[], tab: Tab): ApiBooking[] {
  switch (tab) {
    case "upcoming":
      return bookings.filter((b) => b.status === "PENDING" || b.status === "CONFIRMED");
    case "completed":
      return bookings.filter((b) => b.status === "COMPLETED");
    case "cancelled":
      return bookings.filter((b) => b.status === "CANCELLED");
  }
}

function BookingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border border-gray-200 rounded-xl overflow-hidden animate-pulse">
          <div className="flex flex-col sm:flex-row">
            <div className="sm:w-48 h-40 bg-gray-200" />
            <div className="flex-1 p-5 space-y-3">
              <div className="h-5 bg-gray-200 rounded w-2/3" />
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-px bg-gray-100" />
              <div className="flex justify-between">
                <div className="h-5 bg-gray-200 rounded w-24" />
                <div className="h-8 bg-gray-200 rounded-lg w-28" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function GuestBookingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("upcoming");
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [cancelError, setCancelError] = useState<Record<number, string>>({});
  const [confirmCancel, setConfirmCancel] = useState<number | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setFetchError("");
    try {
      const data = await api.get<ApiBooking[]>("/v1/bookings/mine/");
      setBookings(data);
    } catch (err) {
      setFetchError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleCancel = async (bookingId: number) => {
    setCancellingId(bookingId);
    setCancelError((prev) => ({ ...prev, [bookingId]: "" }));
    try {
      await api.post(`/v1/bookings/${bookingId}/cancel/`, {});
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: "CANCELLED" as BookingStatus } : b
        )
      );
      setConfirmCancel(null);
    } catch (err) {
      setCancelError((prev) => ({
        ...prev,
        [bookingId]: extractErrorMessage(err),
      }));
    } finally {
      setCancellingId(null);
    }
  };

  const filtered = filterByTab(bookings, activeTab);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Bookings</h1>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`relative pb-3 text-sm font-medium transition-colors ${
              activeTab === tab.key ? "text-gray-900" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 rounded-full"
              />
            )}
          </button>
        ))}
      </div>

      {/* Fetch error */}
      {fetchError && (
        <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 mb-6">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{fetchError}</span>
          <button
            onClick={fetchBookings}
            className="ml-auto text-sm font-semibold underline text-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Booking List */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          {loading ? (
            <BookingSkeleton />
          ) : filtered.length === 0 ? (
            <Card variant="bordered" padding="lg">
              <div className="text-center py-12">
                <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">
                  No {activeTab} bookings
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  {activeTab === "upcoming"
                    ? "Browse properties to make your next booking"
                    : activeTab === "completed"
                    ? "Your completed stays will appear here"
                    : "No cancelled bookings to show"}
                </p>
                {activeTab === "upcoming" && (
                  <Link href="/shortlets">
                    <Button variant="primary" size="sm" className="mt-4">
                      Browse Shortlets
                    </Button>
                  </Link>
                )}
              </div>
            </Card>
          ) : (
            filtered.map((booking) => {
              const canCancel =
                booking.status === "PENDING" || booking.status === "CONFIRMED";
              const isConfirmingCancel = confirmCancel === booking.id;

              return (
                <Card key={booking.id} variant="bordered" padding="none" hover>
                  <div className="flex flex-col sm:flex-row">
                    {/* Property image */}
                    <div className="sm:w-48 h-40 sm:h-auto shrink-0">
                      {booking.shortlet.cover_image ? (
                        <img
                          src={booking.shortlet.cover_image}
                          alt={booking.shortlet.title}
                          className="w-full h-full object-cover rounded-t-lg sm:rounded-l-lg sm:rounded-tr-none"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 rounded-t-lg sm:rounded-l-lg sm:rounded-tr-none" />
                      )}
                    </div>

                    <CardBody className="flex-1 p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <Link
                          href={`/properties/${booking.shortlet.id}`}
                          className="font-semibold text-gray-900 line-clamp-1 hover:underline"
                        >
                          {booking.shortlet.title}
                        </Link>
                        <Badge
                          variant={STATUS_BADGE[booking.status]}
                          size="sm"
                        >
                          {STATUS_LABEL[booking.status]}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
                        <MapPin className="w-4 h-4" />
                        <span>
                          {booking.shortlet.city}, {booking.shortlet.state}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span>
                            {formatDate(booking.check_in)} —{" "}
                            {formatDate(booking.check_out)}
                          </span>
                        </div>
                        <span className="text-gray-300">|</span>
                        <span>
                          {booking.number_of_guests} guest
                          {booking.number_of_guests > 1 ? "s" : ""}
                        </span>
                        <span className="text-gray-300">|</span>
                        <span>
                          {booking.number_of_nights} night
                          {booking.number_of_nights > 1 ? "s" : ""}
                        </span>
                      </div>

                      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
                        <div>
                          <span className="text-lg font-bold text-[#0B3D2C]">
                            {formatCurrency(parseFloat(booking.total_price))}
                          </span>
                          <span className="text-xs text-gray-400 ml-2">
                            Ref: {booking.id}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {cancelError[booking.id] && (
                            <span className="text-xs text-red-600">
                              {cancelError[booking.id]}
                            </span>
                          )}
                          {canCancel && (
                            isConfirmingCancel ? (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-600">Cancel booking?</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setConfirmCancel(null)}
                                >
                                  No
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleCancel(booking.id)}
                                  loading={cancellingId === booking.id}
                                  className="!bg-red-600 !text-white hover:!bg-red-700"
                                >
                                  Yes, cancel
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setConfirmCancel(booking.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                Cancel
                              </Button>
                            )
                          )}
                        </div>
                      </div>
                    </CardBody>
                  </div>
                </Card>
              );
            })
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
