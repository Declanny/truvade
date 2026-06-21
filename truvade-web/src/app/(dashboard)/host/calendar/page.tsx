"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
  CalendarDays,
} from "lucide-react";
import { Card, CardBody, Select } from "@/components/ui";
import type { SelectOption } from "@/components/ui";
import { api, extractErrorMessage } from "@/lib/api";
import type { ApiBooking, ApiShortlet } from "@/lib/api-types";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function formatDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(
    2,
    "0"
  )}`;
}

// Returns true if dateKey is in [check_in, check_out)
function isOccupied(dateKey: string, booking: ApiBooking): boolean {
  return dateKey >= booking.check_in && dateKey < booking.check_out;
}

const STATUS_COLOR: Record<ApiBooking["status"], string> = {
  PENDING: "bg-amber-200 text-amber-900",
  CONFIRMED: "bg-emerald-200 text-emerald-900",
  COMPLETED: "bg-gray-200 text-gray-700",
  CANCELLED: "bg-red-100 text-red-700 line-through",
};

interface CalendarMonthProps {
  year: number;
  month: number;
  todayKey: string;
  bookings: ApiBooking[];
  onBookingClick?: (b: ApiBooking) => void;
}

function MonthGrid({
  year,
  month,
  todayKey,
  bookings,
  onBookingClick,
}: CalendarMonthProps) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      <p className="text-base font-semibold text-gray-900 text-center mb-3">
        {MONTHS[month]} {year}
      </p>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS.map((d) => (
          <div
            key={d}
            className="text-center text-xs font-semibold text-gray-500 uppercase py-2"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null)
            return <div key={`empty-${i}`} className="h-20" />;
          const dateKey = formatDateKey(year, month, day);
          const isToday = dateKey === todayKey;
          const dayBookings = bookings.filter((b) =>
            isOccupied(dateKey, b)
          );
          const first = dayBookings[0];
          const remaining = dayBookings.length - 1;

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => {
                if (first && onBookingClick) onBookingClick(first);
              }}
              disabled={dayBookings.length === 0}
              className={`h-20 rounded-lg border text-left p-1.5 transition-colors relative ${
                first
                  ? "border-gray-200 hover:border-gray-300"
                  : isToday
                  ? "border-[#0B3D2C] bg-[#0B3D2C]/5"
                  : "border-gray-100"
              }`}
            >
              <span
                className={`text-sm font-medium ${
                  isToday
                    ? "text-[#0B3D2C] font-bold"
                    : first
                    ? "text-gray-900"
                    : "text-gray-400"
                }`}
              >
                {day}
              </span>
              {first && (
                <div
                  className={`mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium truncate ${
                    STATUS_COLOR[first.status]
                  }`}
                  title={`${first.guest_name} — ${first.shortlet.title}`}
                >
                  {first.guest_name.split(" ")[0]}
                </div>
              )}
              {remaining > 0 && (
                <div className="mt-1 px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 text-[10px] font-medium">
                  +{remaining} more
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function HostCalendarPage() {
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [shortlets, setShortlets] = useState<ApiShortlet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedShortletId, setSelectedShortletId] = useState<string>("all");

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [bks, sls] = await Promise.all([
        api.get<ApiBooking[]>("/v1/host-bookings/"),
        api
          .get<ApiShortlet[]>("/v1/my-shortlets/")
          .catch(() => [] as ApiShortlet[]),
      ]);
      setBookings(bks);
      setShortlets(sls);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const filteredBookings = useMemo(() => {
    const live = bookings.filter((b) => b.status !== "CANCELLED");
    if (selectedShortletId === "all") return live;
    const id = parseInt(selectedShortletId);
    return live.filter((b) => b.shortlet.id === id);
  }, [bookings, selectedShortletId]);

  const shortletOptions: SelectOption[] = useMemo(
    () => [
      { value: "all", label: "All assigned shortlets" },
      ...shortlets.map((s) => ({
        value: String(s.id),
        label: s.title || `Shortlet #${s.id}`,
      })),
    ],
    [shortlets]
  );

  const todayKey = formatDateKey(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else setCurrentMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else setCurrentMonth((m) => m + 1);
  };

  const nextM = (currentMonth + 1) % 12;
  const nextY = currentMonth === 11 ? currentYear + 1 : currentYear;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="text-sm text-gray-500 mt-1">
            Bookings across your assigned shortlets.
          </p>
        </div>
        {shortlets.length > 1 && (
          <div className="w-full sm:w-64">
            <Select
              options={shortletOptions}
              value={selectedShortletId}
              onChange={(e) => setSelectedShortletId(e.target.value)}
              fullWidth
            />
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
          <button
            onClick={fetchAll}
            className="ml-auto text-sm font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="border border-gray-200 rounded-xl p-12 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-[#0B3D2C] animate-spin" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="border border-dashed border-gray-200 rounded-xl py-16 text-center">
          <CalendarDays className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No bookings yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Confirmed bookings will appear here on the dates of stay.
          </p>
        </div>
      ) : (
        <Card variant="bordered" padding="lg">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={prevMonth}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <p className="text-sm font-medium text-gray-600">
              {MONTHS[currentMonth]} {currentYear} — {MONTHS[nextM]} {nextY}
            </p>
            <button
              onClick={nextMonth}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <CardBody>
            <motion.div
              key={`${currentYear}-${currentMonth}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              <MonthGrid
                year={currentYear}
                month={currentMonth}
                todayKey={todayKey}
                bookings={filteredBookings}
              />
              <MonthGrid
                year={nextY}
                month={nextM}
                todayKey={todayKey}
                bookings={filteredBookings}
              />
            </motion.div>

            <div className="flex flex-wrap items-center gap-4 mt-6 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-4 h-4 rounded bg-emerald-200 border border-emerald-300" />
                <span>Confirmed</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-4 h-4 rounded bg-amber-200 border border-amber-300" />
                <span>Pending</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-4 h-4 rounded bg-gray-200 border border-gray-300" />
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-4 h-4 rounded bg-[#0B3D2C]/10 border border-[#0B3D2C]" />
                <span>Today</span>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
