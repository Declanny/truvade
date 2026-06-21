"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  CalendarDays,
  User,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Avatar } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/types";
import type { ApiBooking, BookingStatus } from "@/lib/api-types";
import { api, extractErrorMessage } from "@/lib/api";

type Tab = "all" | "pending" | "confirmed" | "completed" | "cancelled";

const tabs: { key: Tab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

const statusConfig: Record<
  BookingStatus,
  { label: string; bg: string; text: string }
> = {
  PENDING: { label: "Pending", bg: "bg-amber-50", text: "text-amber-700" },
  CONFIRMED: { label: "Confirmed", bg: "bg-emerald-50", text: "text-emerald-700" },
  COMPLETED: { label: "Completed", bg: "bg-gray-100", text: "text-gray-600" },
  CANCELLED: { label: "Cancelled", bg: "bg-red-50", text: "text-red-700" },
};

function filterByTab(bookings: ApiBooking[], tab: Tab): ApiBooking[] {
  if (tab === "all") return bookings;
  const statusMap: Record<Exclude<Tab, "all">, BookingStatus> = {
    pending: "PENDING",
    confirmed: "CONFIRMED",
    completed: "COMPLETED",
    cancelled: "CANCELLED",
  };
  return bookings.filter((b) => b.status === statusMap[tab]);
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function BookingSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 animate-pulse"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-3 bg-gray-200 rounded w-2/3" />
              <div className="h-3 bg-gray-200 rounded w-3/4" />
              <div className="h-8 bg-gray-200 rounded w-24 mt-2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HostBookingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [actionId, setActionId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<Record<number, string>>({});

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setFetchError("");
    try {
      const data = await api.get<ApiBooking[]>("/v1/host-bookings/");
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

  const updateBookingStatus = async (
    bookingId: number,
    action: "confirm" | "complete"
  ) => {
    setActionId(bookingId);
    setActionError((prev) => ({ ...prev, [bookingId]: "" }));
    try {
      const updated = await api.post<ApiBooking>(
        `/v1/bookings/${bookingId}/${action}/`,
        {}
      );
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? updated : b)));
    } catch (err) {
      setActionError((prev) => ({
        ...prev,
        [bookingId]: extractErrorMessage(err),
      }));
    } finally {
      setActionId(null);
    }
  };

  const filtered = filterByTab(bookings, activeTab);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
        <p className="text-sm text-gray-500 mt-1">
          {loading ? "Loading…" : `${bookings.length} total reservations`}
        </p>
      </div>

      {fetchError && (
        <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 mb-6">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{fetchError}</span>
          <button
            onClick={fetchBookings}
            className="ml-auto text-sm font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200 mb-8 overflow-x-auto">
        {tabs.map((tab) => {
          const count = filterByTab(bookings, tab.key).length;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative pb-3 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? "text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
              {!loading && count > 0 && (
                <span
                  className={`ml-1.5 text-xs ${
                    activeTab === tab.key ? "text-gray-900" : "text-gray-400"
                  }`}
                >
                  {count}
                </span>
              )}
              {activeTab === tab.key && (
                <motion.div
                  layoutId="activeHostBookingsTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 rounded-full"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* List */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {loading ? (
            <BookingSkeleton />
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <CalendarDays className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No bookings found</p>
              <p className="text-sm text-gray-400 mt-1">
                Bookings will appear here when guests make reservations
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {filtered.map((booking, i) => {
                const status = statusConfig[booking.status];
                const busy = actionId === booking.id;
                const error = actionError[booking.id];
                return (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 hover:border-gray-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <Avatar
                        initials={initials(booking.guest_name)}
                        name={booking.guest_name}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-gray-900 truncate">
                              {booking.guest_name}
                            </h3>
                            <p className="text-sm text-gray-500 mt-0.5 truncate">
                              {booking.shortlet.title}
                            </p>
                          </div>
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${status.bg} ${status.text}`}
                          >
                            {status.label}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1.5">
                            <CalendarDays className="w-3.5 h-3.5" />
                            {formatDate(booking.check_in)} —{" "}
                            {formatDate(booking.check_out)}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5" />
                            {booking.number_of_guests} guest
                            {booking.number_of_guests > 1 ? "s" : ""}
                          </span>
                          <span className="font-medium text-gray-900">
                            {formatCurrency(parseFloat(booking.total_price))}
                          </span>
                        </div>

                        {parseFloat(booking.host_payout_amount) > 0 && (
                          <p className="mt-2 text-xs text-gray-500">
                            Your payout:{" "}
                            <span className="text-emerald-700 font-medium">
                              {formatCurrency(
                                parseFloat(booking.host_payout_amount)
                              )}
                            </span>
                          </p>
                        )}

                        {/* Actions */}
                        <div className="flex items-center flex-wrap gap-2 mt-4">
                          {booking.status === "PENDING" && (
                            <button
                              onClick={() =>
                                updateBookingStatus(booking.id, "confirm")
                              }
                              disabled={busy}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
                            >
                              {busy ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                              Confirm
                            </button>
                          )}
                          {booking.status === "CONFIRMED" && (
                            <button
                              onClick={() =>
                                updateBookingStatus(booking.id, "complete")
                              }
                              disabled={busy}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
                            >
                              {busy ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                              Mark complete
                            </button>
                          )}
                          {booking.status === "COMPLETED" && (
                            <span className="text-sm text-gray-400">
                              Stay completed
                            </span>
                          )}
                          {booking.status === "CANCELLED" && (
                            <span className="text-sm text-gray-400">
                              Booking cancelled
                            </span>
                          )}
                        </div>

                        {error && (
                          <div className="flex items-start gap-1.5 mt-2 text-xs text-red-600">
                            <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                            <span>{error}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
