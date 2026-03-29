"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { Card, CardBody, Select } from "@/components/ui";
import type { SelectOption } from "@/components/ui";

const properties: SelectOption[] = [
  { value: "p1", label: "Luxury 3-Bedroom Apartment" },
  { value: "p2", label: "Cozy Studio in Lekki" },
  { value: "p3", label: "Penthouse with Rooftop Pool" },
  { value: "p4", label: "Serviced Apartment Ikeja" },
];

interface BookingBlock {
  propertyId: string;
  guestName: string;
  startDate: string;
  endDate: string;
  color: string;
}

const bookingBlocks: BookingBlock[] = [
  { propertyId: "p1", guestName: "Adaeze N.", startDate: "2026-04-01", endDate: "2026-04-05", color: "bg-emerald-200 text-emerald-800" },
  { propertyId: "p1", guestName: "Tunde B.", startDate: "2026-04-08", endDate: "2026-04-12", color: "bg-blue-200 text-blue-800" },
  { propertyId: "p1", guestName: "Kemi A.", startDate: "2026-05-03", endDate: "2026-05-07", color: "bg-purple-200 text-purple-800" },
  { propertyId: "p2", guestName: "Emeka O.", startDate: "2026-04-03", endDate: "2026-04-06", color: "bg-purple-200 text-purple-800" },
  { propertyId: "p3", guestName: "Fatima B.", startDate: "2026-03-28", endDate: "2026-04-02", color: "bg-amber-200 text-amber-800" },
  { propertyId: "p4", guestName: "Kola A.", startDate: "2026-04-15", endDate: "2026-04-18", color: "bg-rose-200 text-rose-800" },
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function formatDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function isDateInRange(dateStr: string, start: string, end: string) {
  return dateStr >= start && dateStr <= end;
}

// ─── Single Month Grid ───────────────────────────────────
function MonthGrid({ year, month, todayKey, propertyBookings, blockedDates, onToggleBlock }: {
  year: number;
  month: number;
  todayKey: string;
  propertyBookings: BookingBlock[];
  blockedDates: Set<string>;
  onToggleBlock: (key: string) => void;
}) {
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
        {DAYS.map((day) => (
          <div key={day} className="text-center text-xs font-semibold text-gray-500 uppercase py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} className="h-20" />;

          const dateKey = formatDateKey(year, month, day);
          const isToday = dateKey === todayKey;
          const isBlocked = blockedDates.has(dateKey);
          const booking = propertyBookings.find((b) => isDateInRange(dateKey, b.startDate, b.endDate));
          const hasBooking = Boolean(booking);

          return (
            <motion.button
              key={dateKey}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { if (!hasBooking) onToggleBlock(dateKey); }}
              disabled={hasBooking}
              className={`h-20 rounded-lg border text-left p-1.5 transition-all relative ${
                isBlocked
                  ? "bg-red-50 border-red-200"
                  : hasBooking
                  ? "border-gray-200 cursor-default"
                  : isToday
                  ? "border-[#0B3D2C] bg-[#0B3D2C]/5"
                  : "border-gray-100 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <span className={`text-sm font-medium ${
                isToday ? "text-[#0B3D2C] font-bold" : isBlocked ? "text-red-500" : "text-gray-700"
              }`}>
                {day}
              </span>

              {hasBooking && booking && (
                <div className={`mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium truncate ${booking.color}`}>
                  {booking.guestName}
                </div>
              )}

              {isBlocked && !hasBooking && (
                <div className="absolute bottom-1.5 right-1.5">
                  <Lock className="w-3.5 h-3.5 text-red-400" />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────
export default function HostCalendarPage() {
  const [selectedProperty, setSelectedProperty] = useState("p1");
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(3);
  const [blockedDates, setBlockedDates] = useState<Set<string>>(
    new Set(["2026-04-20", "2026-04-21", "2026-04-22"])
  );

  const propertyBookings = useMemo(
    () => bookingBlocks.filter((b) => b.propertyId === selectedProperty),
    [selectedProperty]
  );

  const toggleBlockDate = (dateKey: string) => {
    setBlockedDates((prev) => {
      const next = new Set(prev);
      if (next.has(dateKey)) next.delete(dateKey); else next.add(dateKey);
      return next;
    });
  };

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear((y) => y - 1); }
    else setCurrentMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear((y) => y + 1); }
    else setCurrentMonth((m) => m + 1);
  };

  const today = new Date();
  const todayKey = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate());

  const nextM = (currentMonth + 1) % 12;
  const nextY = currentMonth === 11 ? currentYear + 1 : currentYear;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Availability Calendar</h1>
        <div className="w-64">
          <Select
            options={properties}
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value)}
            fullWidth
          />
        </div>
      </div>

      <Card variant="bordered" padding="lg">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <CardBody>
          {/* Two month grids */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <MonthGrid
              year={currentYear}
              month={currentMonth}
              todayKey={todayKey}
              propertyBookings={propertyBookings}
              blockedDates={blockedDates}
              onToggleBlock={toggleBlockDate}
            />
            <MonthGrid
              year={nextY}
              month={nextM}
              todayKey={todayKey}
              propertyBookings={propertyBookings}
              blockedDates={blockedDates}
              onToggleBlock={toggleBlockDate}
            />
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-4 h-4 rounded bg-emerald-200 border border-emerald-300" />
              <span>Booked</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-4 h-4 rounded bg-red-50 border border-red-200 flex items-center justify-center">
                <Lock className="w-2.5 h-2.5 text-red-400" />
              </div>
              <span>Blocked</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-4 h-4 rounded bg-[#0B3D2C]/10 border border-[#0B3D2C]" />
              <span>Today</span>
            </div>
            <div className="ml-auto text-xs text-gray-400">
              Click available dates to block/unblock
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
