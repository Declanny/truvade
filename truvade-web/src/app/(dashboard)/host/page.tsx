"use client";

import { useEffect, useMemo, useState } from "react";
import { LogIn, LogOut, Clock, AlertCircle } from "lucide-react";
import { KYCBanner } from "@/components/kyc";
import { formatCurrency, formatDate } from "@/lib/types";
import Link from "next/link";
import { api, extractErrorMessage } from "@/lib/api";
import type { ApiBooking } from "@/lib/api-types";

function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function StatSkeleton() {
  return (
    <div className="flex items-center gap-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="border border-gray-200 rounded-xl px-4 py-3 text-center w-24 animate-pulse"
        >
          <div className="h-3 bg-gray-200 rounded w-12 mx-auto" />
          <div className="h-4 bg-gray-200 rounded w-16 mx-auto mt-2" />
        </div>
      ))}
    </div>
  );
}

export default function HostDashboardPage() {
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<ApiBooking[]>("/v1/host-bookings/")
      .then(setBookings)
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const { activeCount, payoutTotal, checkInsToday, checkOutsToday, currentGuests } =
    useMemo(() => {
      const today = new Date();
      let payoutTotal = 0;
      const checkIns: ApiBooking[] = [];
      const checkOuts: ApiBooking[] = [];
      const current: ApiBooking[] = [];
      let active = 0;

      for (const b of bookings) {
        const checkIn = new Date(b.check_in);
        const checkOut = new Date(b.check_out);

        if (b.status === "CONFIRMED" || b.status === "COMPLETED") {
          payoutTotal += parseFloat(b.host_payout_amount) || 0;
        }
        if (b.status === "PENDING" || b.status === "CONFIRMED") {
          active += 1;
        }
        if (b.status !== "CONFIRMED") continue;

        if (isSameLocalDay(checkIn, today)) {
          checkIns.push(b);
        }
        if (isSameLocalDay(checkOut, today)) {
          checkOuts.push(b);
        }
        if (checkIn <= today && checkOut > today) {
          current.push(b);
        }
      }

      return {
        activeCount: active,
        payoutTotal,
        checkInsToday: checkIns,
        checkOutsToday: checkOuts,
        currentGuests: current,
      };
    }, [bookings]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Your activity across all assigned properties
          </p>
        </div>
      </div>

      {/* KYC Banner */}
      <div className="mb-6">
        <KYCBanner />
      </div>

      {error && (
        <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 mb-6">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats */}
      <div className="flex flex-col lg:flex-row gap-4 mb-8">
        {loading ? (
          <StatSkeleton />
        ) : (
          <div className="flex items-center gap-3 flex-wrap">
            {[
              { label: "Active bookings", value: String(activeCount) },
              { label: "Total bookings", value: String(bookings.length) },
              { label: "Earnings (paid)", value: formatCurrency(payoutTotal) },
            ].map((s) => (
              <div
                key={s.label}
                className="border border-gray-200 rounded-xl px-4 py-3 text-center"
              >
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activity columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ActivityColumn
          icon={<LogIn className="w-4 h-4 text-[#0B3D2C]" />}
          title="Check-ins today"
          empty="No check-ins today"
          loading={loading}
          bookings={checkInsToday}
          renderMeta={(b) => formatDate(b.check_in)}
        />
        <ActivityColumn
          icon={<LogOut className="w-4 h-4 text-gray-500" />}
          title="Check-outs today"
          empty="No check-outs today"
          loading={loading}
          bookings={checkOutsToday}
          renderMeta={(b) => formatDate(b.check_out)}
        />
        <ActivityColumn
          icon={<Clock className="w-4 h-4 text-blue-500" />}
          title="Currently hosting"
          empty="No current guests"
          loading={loading}
          bookings={currentGuests}
          renderMeta={(b) => `Checks out ${formatDate(b.check_out)}`}
        />
      </div>

      {!loading && bookings.length > 0 && (
        <div className="mt-8 flex justify-end">
          <Link
            href="/host/bookings"
            className="text-sm font-medium text-[#0B3D2C] hover:underline"
          >
            View all bookings →
          </Link>
        </div>
      )}
    </div>
  );
}

function ActivityColumn({
  icon,
  title,
  empty,
  loading,
  bookings,
  renderMeta,
}: {
  icon: React.ReactNode;
  title: string;
  empty: string;
  loading: boolean;
  bookings: ApiBooking[];
  renderMeta: (b: ApiBooking) => string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        {!loading && (
          <span className="text-xs text-gray-400">{bookings.length}</span>
        )}
      </div>
      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2].map((i) => (
            <div key={i} className="p-3 border border-gray-100 rounded-xl">
              <div className="h-4 bg-gray-200 rounded w-2/3" />
              <div className="h-3 bg-gray-200 rounded w-1/2 mt-2" />
              <div className="h-3 bg-gray-200 rounded w-1/3 mt-1.5" />
            </div>
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <p className="text-sm text-gray-400 py-4">{empty}</p>
      ) : (
        <div className="space-y-2">
          {bookings.map((b) => (
            <div key={b.id} className="p-3 border border-gray-200 rounded-xl">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {b.guest_name}
                </p>
                <span className="text-xs text-gray-500 shrink-0">
                  {renderMeta(b)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5 truncate">
                {b.shortlet.title}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {b.number_of_guests} guest
                {b.number_of_guests !== 1 ? "s" : ""} · #{b.id}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
