"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  CalendarDays,
  TrendingUp,
  UserPlus,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Card, CardHeader, Badge, StatBar } from "@/components/ui";
import { KYCBanner } from "@/components/kyc";
import { formatCurrency, formatDate } from "@/lib/types";
import Link from "next/link";
import type { ApiBooking, ApiShortlet } from "@/lib/api-types";
import { api, extractErrorMessage } from "@/lib/api";

const STATUS_VARIANT: Record<string, "success" | "warning" | "info" | "gray"> = {
  CONFIRMED: "success",
  PENDING: "warning",
  COMPLETED: "gray",
  CANCELLED: "gray",
};

function TableSkeleton() {
  return (
    <div className="divide-y divide-gray-50">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center px-6 py-3.5 gap-6 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-28" />
          <div className="h-4 bg-gray-200 rounded flex-1" />
          <div className="h-4 bg-gray-200 rounded w-36" />
          <div className="h-5 bg-gray-200 rounded-full w-16" />
        </div>
      ))}
    </div>
  );
}

export default function OwnerDashboardPage() {
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [shortlets, setShortlets] = useState<ApiShortlet[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<Record<number, string>>({});

  useEffect(() => {
    Promise.all([
      api.get<ApiBooking[]>("/v1/owner-bookings/"),
      api.get<ApiShortlet[]>("/v1/shortlets/"),
    ])
      .then(([bks, sls]) => {
        setBookings(bks);
        setShortlets(sls);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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

  const activeShortlets = shortlets.filter((s) => s.status === "ACTIVE");
  const activeBookings = bookings.filter(
    (b) => b.status === "CONFIRMED" || b.status === "PENDING"
  );
  const recentBookings = [...bookings]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const stats = [
    {
      label: "Total Properties",
      value: loading ? "—" : String(shortlets.length),
      icon: <Building2 className="w-6 h-6" />,
      change: `${activeShortlets.length} active`,
      bg: "bg-[#0B3D2C]",
    },
    {
      label: "Active Bookings",
      value: loading ? "—" : String(activeBookings.length),
      icon: <CalendarDays className="w-6 h-6" />,
      change: `${bookings.length} total`,
      bg: "bg-[#0B3D2C]",
    },
    {
      label: "Total Revenue",
      value: loading
        ? "—"
        : formatCurrency(
            bookings
              .filter((b) => b.status === "CONFIRMED" || b.status === "COMPLETED")
              .reduce((sum, b) => sum + parseFloat(b.total_price), 0)
          ),
      icon: <TrendingUp className="w-6 h-6" />,
      change: "Confirmed + completed",
      bg: "bg-[#0B3D2C]",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back!</h1>
        <p className="text-gray-500 mt-1 pl-5">
          Here is an overview of your properties and bookings.
        </p>
      </div>

      <div className="mb-6">
        <KYCBanner />
      </div>

      <div className="mb-8">
        <StatBar items={stats} />
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Link href="/owner/properties/new">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:border-[#0B3D2C] transition-colors">
            <Building2 className="w-4 h-4" /> Add Property
          </button>
        </Link>
        <Link href="/owner/hosts">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:border-[#0B3D2C] transition-colors">
            <UserPlus className="w-4 h-4" /> Invite Host
          </button>
        </Link>
      </div>

      {/* Recent Bookings */}
      <Card variant="bordered" padding="none">
        <CardHeader className="px-6 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Bookings</h2>
            <Link
              href="/owner/properties"
              className="text-sm font-medium text-[#0B3D2C] hover:underline"
            >
              View properties
            </Link>
          </div>
        </CardHeader>

        {loading ? (
          <TableSkeleton />
        ) : recentBookings.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">
            No bookings yet. List a property to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Guest
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentBookings.map((booking) => {
                  const busy = actionId === booking.id;
                  const error = actionError[booking.id];
                  return (
                    <tr
                      key={booking.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-3.5 font-medium text-gray-900">
                        {booking.guest_name}
                      </td>
                      <td className="px-6 py-3.5 text-gray-600 max-w-[200px] truncate">
                        {booking.shortlet.title}
                      </td>
                      <td className="px-6 py-3.5 text-gray-500 whitespace-nowrap">
                        {formatDate(booking.check_in)} —{" "}
                        {formatDate(booking.check_out)}
                      </td>
                      <td className="px-6 py-3.5 text-gray-700 font-medium">
                        {formatCurrency(parseFloat(booking.total_price))}
                      </td>
                      <td className="px-6 py-3.5">
                        <Badge
                          variant={STATUS_VARIANT[booking.status] ?? "gray"}
                          size="sm"
                        >
                          {booking.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        {booking.status === "PENDING" && (
                          <button
                            type="button"
                            onClick={() =>
                              updateBookingStatus(booking.id, "confirm")
                            }
                            disabled={busy}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#0B3D2C] text-white text-xs font-semibold rounded-lg hover:bg-[#0F5240] disabled:opacity-50 transition-colors"
                          >
                            {busy ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Check className="w-3 h-3" />
                            )}
                            Confirm
                          </button>
                        )}
                        {booking.status === "CONFIRMED" && (
                          <button
                            type="button"
                            onClick={() =>
                              updateBookingStatus(booking.id, "complete")
                            }
                            disabled={busy}
                            className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"
                          >
                            {busy ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Check className="w-3 h-3" />
                            )}
                            Mark complete
                          </button>
                        )}
                        {error && (
                          <div className="inline-flex items-center gap-1 mt-1 text-[11px] text-red-600">
                            <AlertCircle className="w-3 h-3" />
                            {error}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
