"use client";

import { useState, useRef, useEffect } from "react";
import { CalendarDays, MessageSquare, TrendingUp, LogIn, LogOut, Clock, ChevronDown } from "lucide-react";
import { KYCBanner } from "@/components/kyc";
import { formatCurrency, formatDate } from "@/lib/types";
import { useWorkspace } from "@/context/WorkspaceContext";
import Link from "next/link";

type DatePreset = "today" | "yesterday" | "7d" | "30d" | "90d" | "custom";

const presets: { key: DatePreset; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "90d", label: "Last 90 days" },
];

// Mock stats per period
const statsByPeriod: Record<string, { bookings: number; messages: number; earned: number }> = {
  today: { bookings: 2, messages: 3, earned: 45000 },
  yesterday: { bookings: 1, messages: 5, earned: 85000 },
  "7d": { bookings: 8, messages: 14, earned: 285000 },
  "30d": { bookings: 24, messages: 42, earned: 920000 },
  "90d": { bookings: 61, messages: 118, earned: 2850000 },
  custom: { bookings: 8, messages: 14, earned: 285000 },
};

const todayCheckIns = [
  { id: "BK-101", guest: "Adaeze Nwosu", property: "Luxury 3-Bedroom Apartment", time: "2:00 PM", guests: 4 },
  { id: "BK-106", guest: "Tunde Bakare", property: "Luxury 3-Bedroom Apartment", time: "3:30 PM", guests: 5 },
];

const todayCheckOuts = [
  { id: "BK-098", guest: "Fatima Bello", property: "Penthouse with Rooftop Pool", time: "11:00 AM", guests: 3 },
];

const currentGuests = [
  { id: "BK-100", guest: "Kola Adeyemi", property: "Luxury 3-Bedroom Apartment", checkOut: "2026-03-30", guests: 6 },
  { id: "BK-099", guest: "Amina Yusuf", property: "Cozy Studio in Lekki", checkOut: "2026-04-01", guests: 2 },
];

const urgentMessages = [
  { guest: "Fatima Bello", message: "The WiFi password isn't working. Can you help?", time: "1h ago", property: "Penthouse with Rooftop Pool" },
];

// ─── Date Filter ─────────────────────────────────────────
function DateFilter({ value, onChange }: {
  value: DatePreset;
  onChange: (v: DatePreset) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const activeLabel = presets.find((p) => p.key === value)?.label || "Today";

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:border-gray-400 transition-colors"
      >
        {activeLabel}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1.5 bg-white border border-gray-100 rounded-xl shadow-lg z-50 py-1">
          {presets.filter((p) => p.key !== "custom").map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => { onChange(p.key); setOpen(false); }}
              className={`w-full px-4 py-2 text-sm text-left transition-colors whitespace-nowrap ${
                value === p.key ? "text-[#0B3D2C] font-medium" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────
export default function HostDashboardPage() {
  const { current } = useWorkspace();
  const [period, setPeriod] = useState<DatePreset>("today");

  const stats = statsByPeriod[period] || statsByPeriod.today;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">{current.orgName}</p>
        </div>
        <DateFilter value={period} onChange={setPeriod} />
      </div>

      {/* KYC Banner */}
      <div className="mb-6">
        <KYCBanner />
      </div>

      {/* Stats + urgent */}
      <div className="flex flex-col lg:flex-row gap-4 mb-8">
        <div className="flex items-center gap-3">
          {[
            { label: "Bookings", value: String(stats.bookings) },
            { label: "Messages", value: String(stats.messages) },
            { label: "Earned", value: formatCurrency(stats.earned) },
          ].map((s) => (
            <div key={s.label} className="border border-gray-200 rounded-xl px-4 py-3 text-center">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">{s.value}</p>
            </div>
          ))}
        </div>

        {urgentMessages.length > 0 && (
          <div className="flex-1 flex items-center">
            <Link href="/host/messages" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
              <span className="w-2 h-2 rounded-full bg-[#B87333] shrink-0" />
              <span><span className="font-medium">{urgentMessages[0].guest}</span> — {urgentMessages[0].message}</span>
              <span className="text-xs text-gray-400 shrink-0">{urgentMessages[0].time}</span>
            </Link>
          </div>
        )}
      </div>

      {/* Activity columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Check-ins */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <LogIn className="w-4 h-4 text-[#0B3D2C]" />
            <h2 className="text-sm font-semibold text-gray-900">Check-ins today</h2>
            <span className="text-xs text-gray-400">{todayCheckIns.length}</span>
          </div>
          {todayCheckIns.length > 0 ? (
            <div className="space-y-2">
              {todayCheckIns.map((ci) => (
                <div key={ci.id} className="p-3 border border-gray-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{ci.guest}</p>
                    <span className="text-xs text-gray-500">{ci.time}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{ci.property}</p>
                  <p className="text-xs text-gray-400 mt-1">{ci.guests} guest{ci.guests !== 1 ? "s" : ""} · {ci.id}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-4">No check-ins today</p>
          )}
        </div>

        {/* Check-outs */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <LogOut className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-900">Check-outs today</h2>
            <span className="text-xs text-gray-400">{todayCheckOuts.length}</span>
          </div>
          {todayCheckOuts.length > 0 ? (
            <div className="space-y-2">
              {todayCheckOuts.map((co) => (
                <div key={co.id} className="p-3 border border-gray-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{co.guest}</p>
                    <span className="text-xs text-gray-500">{co.time}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{co.property}</p>
                  <p className="text-xs text-gray-400 mt-1">{co.guests} guest{co.guests !== 1 ? "s" : ""} · {co.id}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-4">No check-outs today</p>
          )}
        </div>

        {/* Currently hosting */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-blue-500" />
            <h2 className="text-sm font-semibold text-gray-900">Currently hosting</h2>
            <span className="text-xs text-gray-400">{currentGuests.length}</span>
          </div>
          {currentGuests.length > 0 ? (
            <div className="space-y-2">
              {currentGuests.map((g) => (
                <div key={g.id} className="p-3 border border-gray-200 rounded-xl">
                  <p className="text-sm font-medium text-gray-900">{g.guest}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{g.property}</p>
                  <p className="text-xs text-gray-400 mt-1">{g.guests} guest{g.guests !== 1 ? "s" : ""} · checks out {formatDate(g.checkOut)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-4">No current guests</p>
          )}
        </div>
      </div>
    </div>
  );
}
