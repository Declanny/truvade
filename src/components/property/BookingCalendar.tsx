"use client";

import React, { useState, useMemo, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface BookedRange {
  checkIn: Date;
  checkOut: Date;
}

interface BookingCalendarProps {
  bookedRanges: BookedRange[];
  minNights?: number;
  checkIn: string;
  checkOut: string;
  onSelect: (checkIn: string, checkOut: string) => void;
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isBooked(date: Date, ranges: BookedRange[]): boolean {
  const d = startOfDay(date).getTime();
  return ranges.some((r) => {
    const start = startOfDay(r.checkIn).getTime();
    const end = startOfDay(r.checkOut).getTime();
    return d >= start && d < end;
  });
}

function hasOverlap(start: Date, end: Date, ranges: BookedRange[]): boolean {
  const s = startOfDay(start).getTime();
  const e = startOfDay(end).getTime();
  return ranges.some((r) => {
    const rs = startOfDay(r.checkIn).getTime();
    const re = startOfDay(r.checkOut).getTime();
    return s < re && e > rs;
  });
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function MonthGrid({
  year,
  month,
  today,
  bookedRanges,
  selectionStart,
  selectionEnd,
  hoverDate,
  onDayClick,
  onDayHover,
}: {
  year: number;
  month: number;
  today: Date;
  bookedRanges: BookedRange[];
  selectionStart: Date | null;
  selectionEnd: Date | null;
  hoverDate: Date | null;
  onDayClick: (date: Date) => void;
  onDayHover: (date: Date | null) => void;
}) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);

  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const rangeEnd = selectionEnd || hoverDate;

  return (
    <div>
      <p className="text-sm font-semibold text-gray-900 text-center mb-3">
        {MONTHS[month]} {year}
      </p>
      <div className="grid grid-cols-7 gap-0">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 py-1.5">
            {d}
          </div>
        ))}
        {cells.map((date, i) => {
          if (!date) {
            return <div key={`empty-${i}`} className="h-10" />;
          }

          const isPast = startOfDay(date) < startOfDay(today);
          const isBookedDay = isBooked(date, bookedRanges);
          const disabled = isPast || isBookedDay;
          const isToday = isSameDay(date, today);

          let isStart = false;
          let isEnd = false;
          let inRange = false;

          if (selectionStart) {
            isStart = isSameDay(date, selectionStart);
            if (rangeEnd) {
              const [lo, hi] = selectionStart <= rangeEnd ? [selectionStart, rangeEnd] : [rangeEnd, selectionStart];
              isEnd = isSameDay(date, hi);
              isStart = isSameDay(date, lo);
              const dt = startOfDay(date).getTime();
              inRange = dt > startOfDay(lo).getTime() && dt < startOfDay(hi).getTime();
            }
          }

          let bgClass = "";
          let textClass = "text-gray-900";

          if (isStart || isEnd) {
            bgClass = "bg-[#0B3D2C]";
            textClass = "text-white";
          } else if (inRange) {
            bgClass = "bg-[#0B3D2C]/10";
          }

          if (disabled) {
            textClass = "text-gray-300";
            bgClass = "";
          }

          return (
            <button
              key={date.toISOString()}
              type="button"
              disabled={disabled}
              onClick={() => onDayClick(date)}
              onMouseEnter={() => onDayHover(date)}
              onMouseLeave={() => onDayHover(null)}
              className={`h-10 w-full flex items-center justify-center text-sm rounded-full transition-colors
                ${bgClass}
                ${textClass}
                ${isToday && !isStart && !isEnd ? "ring-1 ring-gray-300" : ""}
                ${disabled ? "cursor-not-allowed" : "hover:bg-[#0B3D2C]/10 cursor-pointer"}
                ${isBookedDay ? "line-through" : ""}
              `}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const BookingCalendar: React.FC<BookingCalendarProps> = ({
  bookedRanges,
  minNights = 1,
  checkIn,
  checkOut,
  onSelect,
}) => {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [baseMonth, setBaseMonth] = useState(() => today.getMonth());
  const [baseYear, setBaseYear] = useState(() => today.getFullYear());
  const [selectionStart, setSelectionStart] = useState<Date | null>(
    checkIn ? new Date(checkIn) : null
  );
  const [selectionEnd, setSelectionEnd] = useState<Date | null>(
    checkOut ? new Date(checkOut) : null
  );
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  const goNext = () => {
    if (baseMonth === 11) {
      setBaseMonth(0);
      setBaseYear((y) => y + 1);
    } else {
      setBaseMonth((m) => m + 1);
    }
  };

  const goPrev = () => {
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();
    if (baseYear === todayYear && baseMonth === todayMonth) return;
    if (baseMonth === 0) {
      setBaseMonth(11);
      setBaseYear((y) => y - 1);
    } else {
      setBaseMonth((m) => m - 1);
    }
  };

  const handleDayClick = useCallback(
    (date: Date) => {
      if (!selectionStart || selectionEnd) {
        // Start new selection
        setSelectionStart(date);
        setSelectionEnd(null);
        onSelect(toDateStr(date), "");
      } else {
        // Complete selection
        const [start, end] = date > selectionStart ? [selectionStart, date] : [date, selectionStart];

        // Check minimum nights
        const nights = Math.round((startOfDay(end).getTime() - startOfDay(start).getTime()) / 86400000);
        if (nights < minNights) return;

        // Check for overlap with booked dates
        if (hasOverlap(start, end, bookedRanges)) {
          // Reset — can't book across booked dates
          setSelectionStart(date);
          setSelectionEnd(null);
          onSelect(toDateStr(date), "");
          return;
        }

        setSelectionStart(start);
        setSelectionEnd(end);
        onSelect(toDateStr(start), toDateStr(end));
      }
    },
    [selectionStart, selectionEnd, bookedRanges, minNights, onSelect]
  );

  const handleClear = () => {
    setSelectionStart(null);
    setSelectionEnd(null);
    onSelect("", "");
  };

  const nextMonth = baseMonth === 11 ? 0 : baseMonth + 1;
  const nextYear = baseMonth === 11 ? baseYear + 1 : baseYear;
  const canGoPrev = !(baseYear === today.getFullYear() && baseMonth === today.getMonth());

  return (
    <div>
      {/* Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={goPrev}
          disabled={!canGoPrev}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="text-xs font-medium text-gray-500 underline hover:text-gray-700"
        >
          Clear dates
        </button>
        <button
          type="button"
          onClick={goNext}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Calendar grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MonthGrid
          year={baseYear}
          month={baseMonth}
          today={today}
          bookedRanges={bookedRanges}
          selectionStart={selectionStart}
          selectionEnd={selectionEnd}
          hoverDate={hoverDate}
          onDayClick={handleDayClick}
          onDayHover={setHoverDate}
        />
        <MonthGrid
          year={nextYear}
          month={nextMonth}
          today={today}
          bookedRanges={bookedRanges}
          selectionStart={selectionStart}
          selectionEnd={selectionEnd}
          hoverDate={hoverDate}
          onDayClick={handleDayClick}
          onDayHover={setHoverDate}
        />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#0B3D2C]" />
          Selected
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-gray-200" />
          Booked
        </div>
      </div>
    </div>
  );
};
