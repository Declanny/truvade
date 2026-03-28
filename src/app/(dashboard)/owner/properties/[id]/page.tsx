"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft, Star, MapPin, BedDouble, Bath, Users, TrendingUp, Eye,
  CalendarDays, DollarSign, BarChart3, UserCircle, Check, Circle, FileEdit, ImageIcon,
} from "lucide-react";
import { mockProperties, mockBookings, mockInvitations } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

// Mock stats per property
const mockStats: Record<string, { revenue: number; occupancy: number; views: number; avgRating: number }> = {
  "prop-1": { revenue: 2450000, occupancy: 78, views: 1240, avgRating: 4.8 },
  "prop-2": { revenue: 980000, occupancy: 62, views: 870, avgRating: 4.5 },
  "prop-3": { revenue: 3200000, occupancy: 85, views: 2100, avgRating: 4.9 },
  "prop-4": { revenue: 1800000, occupancy: 71, views: 960, avgRating: 4.6 },
  "prop-5": { revenue: 560000, occupancy: 45, views: 430, avgRating: 4.3 },
  "prop-6": { revenue: 1100000, occupancy: 58, views: 680, avgRating: 4.7 },
  "prop-7": { revenue: 750000, occupancy: 52, views: 510, avgRating: 4.4 },
};

type Tab = "overview" | "calendar" | "pricing" | "host";

export default function OwnerPropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const property = mockProperties.find((p) => p.id === id);
  const stats = mockStats[id] || { revenue: 0, occupancy: 0, views: 0, avgRating: 0 };

  const bookings = useMemo(() =>
    mockBookings.filter((b) => b.propertyId === id).map((b) => ({
      ...b,
      checkIn: new Date(b.checkIn),
      checkOut: new Date(b.checkOut),
    })),
    [id]
  );

  const verifiedHosts = mockInvitations.filter((inv) => inv.status === "ACCEPTED");
  const [assignedHostId, setAssignedHostId] = useState("");
  const [basePrice, setBasePrice] = useState(property?.basePrice || 0);
  const [cleaningFee, setCleaningFee] = useState(property?.cleaningFee || 0);
  const [minNights, setMinNights] = useState(property?.minNights || 1);
  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());

  if (!property) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center">
        <p className="text-gray-500">Property not found</p>
        <button onClick={() => router.back()} className="text-sm text-[#0B3D2C] underline mt-2">Go back</button>
      </div>
    );
  }

  const isDraft = property.status === "DRAFT";

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "overview", label: "Overview", icon: BarChart3 },
    { key: "calendar", label: "Calendar", icon: CalendarDays },
    { key: "pricing", label: "Pricing", icon: DollarSign },
    { key: "host", label: "Host", icon: UserCircle },
  ];

  const bookedRanges = useMemo(() =>
    bookings.map((b) => ({ checkIn: b.checkIn, checkOut: b.checkOut })),
    [bookings]
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors mt-1">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0">
              <div className="w-full h-full bg-gray-200" style={{ backgroundImage: `url(${property.images[0]})`, backgroundSize: "cover", backgroundPosition: "center" }} />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-gray-900 line-clamp-1">{property.title}</h1>
              <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                <MapPin className="w-3.5 h-3.5" />
                <span>{property.city}, {property.state}</span>
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" /> {property.bedrooms}</span>
                <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" /> {property.bathrooms}</span>
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {property.maxGuests}</span>
                {property.rating && (
                  <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-current" /> {property.rating.toFixed(1)}</span>
                )}
              </div>
            </div>
            <Link href={`/properties/${property.id}`} className="shrink-0 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-1">
              <Eye className="w-3 h-3" /> View public listing
            </Link>
          </div>
        </div>
      </div>

      {/* Draft view — side by side preview + completion */}
      {isDraft ? (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left — Property preview */}
          <div className="flex-1 border border-gray-200 rounded-xl overflow-hidden">
            {property.images.length > 0 ? (
              <div className="aspect-[16/9] relative">
                <div className="w-full h-full bg-gray-200" style={{ backgroundImage: `url(${property.images[0]})`, backgroundSize: "cover", backgroundPosition: "center" }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-white text-lg font-semibold line-clamp-1">{property.title || "Untitled listing"}</p>
                  <p className="text-white/70 text-sm mt-0.5">{property.city ? `${property.city}, ${property.state}` : "Location not set"}</p>
                </div>
                {property.images.length > 1 && (
                  <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded-lg">
                    {property.images.length} photos
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-[16/9] bg-gray-100 flex flex-col items-center justify-center gap-2">
                <ImageIcon className="w-8 h-8 text-gray-300" />
                <p className="text-sm text-gray-400">No photos yet</p>
              </div>
            )}
            <div className="p-4">
              <div className="flex items-center gap-4 text-sm text-gray-500">
                {property.bedrooms > 0 && <span>{property.bedrooms} bed{property.bedrooms !== 1 ? "s" : ""}</span>}
                {property.bathrooms > 0 && <span>{property.bathrooms} bath{property.bathrooms !== 1 ? "s" : ""}</span>}
                {property.maxGuests > 0 && <span>{property.maxGuests} guest{property.maxGuests !== 1 ? "s" : ""}</span>}
              </div>
              {property.basePrice > 0 && (
                <p className="text-base font-semibold text-gray-900 mt-2">{formatCurrency(property.basePrice)} <span className="text-sm text-gray-500 font-normal">/ night</span></p>
              )}
              {property.description && (
                <p className="text-sm text-gray-500 mt-3 line-clamp-3">{property.description}</p>
              )}
            </div>
          </div>

          {/* Right — Completion checklist */}
          <div className="lg:w-[320px] shrink-0">
            <div className="border border-gray-200 rounded-xl p-5">
              <h3 className="text-base font-semibold text-gray-900 mb-1">Finish your listing</h3>
              <p className="text-xs text-gray-500 mb-4">Complete these steps to publish.</p>

              <div className="space-y-1 mb-5">
                {[
                  { label: "Property type", done: !!property.propertyType },
                  { label: "Title & description", done: !!property.title && !!property.description },
                  { label: "Location", done: !!property.city },
                  { label: "Capacity", done: property.bedrooms > 0 },
                  { label: "Amenities", done: property.amenities.length > 0 },
                  { label: "Photos", done: property.images.length >= 5 },
                  { label: "Pricing", done: property.basePrice > 0 },
                ].map((step) => (
                  <div key={step.label} className="flex items-center gap-2.5 py-2">
                    {step.done ? (
                      <div className="w-5 h-5 rounded-full bg-[#0B3D2C] flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    ) : (
                      <Circle className="w-5 h-5 text-gray-300 shrink-0" />
                    )}
                    <span className={`text-sm ${step.done ? "text-gray-500" : "text-gray-900 font-medium"}`}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>

              <Link
                href={`/owner/properties/new?edit=${property.id}`}
                className="flex items-center justify-center gap-2 w-full py-3 bg-[#0B3D2C] text-white text-sm font-semibold rounded-xl hover:bg-[#0F5240] transition-colors"
              >
                <FileEdit className="w-4 h-4" />
                Continue editing
              </Link>
            </div>
          </div>
        </div>
      ) : (
      <>
      {/* Tabs — only for non-draft */}
      <div className="flex items-center gap-2 mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-[#0B3D2C] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>

        {/* ─── Overview ─────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div>
            {/* Stats + Bookings side by side */}
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Stats */}
              <div className="flex items-center gap-4 shrink-0">
                {[
                  { label: "Revenue", value: formatCurrency(stats.revenue) },
                  { label: "Occupancy", value: `${stats.occupancy}%` },
                  { label: "Views", value: stats.views.toLocaleString() },
                  { label: "Rating", value: stats.avgRating.toFixed(1), star: true },
                ].map((s) => (
                  <div key={s.label} className="border border-gray-200 rounded-xl px-4 py-3 text-center">
                    <p className="text-xs text-gray-500">{s.label}</p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5 flex items-center justify-center gap-1">
                      {s.star && <Star className="w-3 h-3 fill-amber-500 text-amber-500" />}
                      {s.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Recent bookings */}
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent bookings</h3>
                {bookings.length > 0 ? (
                  <div className="space-y-2">
                    {bookings.slice(0, 5).map((b) => (
                      <div key={b.id} className="flex items-center justify-between p-2.5 border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-900">
                            {b.checkIn.toLocaleDateString("en-NG", { month: "short", day: "numeric" })} — {b.checkOut.toLocaleDateString("en-NG", { month: "short", day: "numeric" })}
                          </span>
                          <span className="text-xs text-gray-400">{b.id.toUpperCase()}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          b.status === "CONFIRMED" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                        }`}>
                          {b.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 py-4 text-center">No bookings yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── Calendar ─────────────────────────────────────── */}
        {activeTab === "calendar" && (
          <div>
            {/* Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button type="button" onClick={() => {
                if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1);
              }} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-200" /> Booked</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400" /> Blocked</span>
              </div>
              <button type="button" onClick={() => {
                if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1);
              }} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Two month grids */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[0, 1].map((offset) => {
                const m = (calMonth + offset) % 12;
                const y = calMonth + offset > 11 ? calYear + 1 : calYear;
                const daysInMonth = new Date(y, m + 1, 0).getDate();
                const firstDay = new Date(y, m, 1).getDay();
                const monthName = new Date(y, m).toLocaleDateString("en-NG", { month: "long", year: "numeric" });
                const today = new Date();

                return (
                  <div key={`${y}-${m}`}>
                    <p className="text-sm font-semibold text-gray-900 text-center mb-3">{monthName}</p>
                    <div className="grid grid-cols-7 gap-0">
                      {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                        <div key={d} className="text-center text-xs font-medium text-gray-400 py-1.5">{d}</div>
                      ))}
                      {Array.from({ length: firstDay }).map((_, i) => (
                        <div key={`e-${i}`} className="h-10" />
                      ))}
                      {Array.from({ length: daysInMonth }, (_, i) => {
                        const day = i + 1;
                        const date = new Date(y, m, day);
                        const dateKey = `${y}-${m}-${day}`;
                        const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                        const isBooked = bookings.some((b) => date >= b.checkIn && date < b.checkOut);
                        const isBlocked = blockedDates.has(dateKey);
                        const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();

                        return (
                          <button
                            key={day}
                            type="button"
                            disabled={isPast || isBooked}
                            onClick={() => {
                              if (isPast || isBooked) return;
                              setBlockedDates(prev => {
                                const next = new Set(prev);
                                if (next.has(dateKey)) next.delete(dateKey); else next.add(dateKey);
                                return next;
                              });
                            }}
                            className={`h-10 w-full flex items-center justify-center text-sm rounded-full transition-colors ${
                              isBooked
                                ? "bg-emerald-100 text-emerald-700 cursor-default"
                                : isBlocked
                                ? "bg-red-100 text-red-600 hover:bg-red-200 cursor-pointer"
                                : isPast
                                ? "text-gray-300 cursor-default"
                                : "text-gray-900 hover:bg-gray-100 cursor-pointer"
                            } ${isToday && !isBooked && !isBlocked ? "ring-1 ring-gray-300" : ""}`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {blockedDates.size > 0 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">{blockedDates.size} date{blockedDates.size !== 1 ? "s" : ""} blocked</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setBlockedDates(new Set())}
                    className="text-xs font-medium text-gray-500 underline hover:text-gray-700 transition-colors"
                  >
                    Clear all
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 bg-[#0B3D2C] text-white text-xs font-semibold rounded-lg hover:bg-[#0F5240] transition-colors"
                  >
                    Save changes
                  </button>
                </div>
              </div>
            )}

            {blockedDates.size === 0 && (
              <p className="text-xs text-gray-400 mt-4">Tap available dates to block or unblock them.</p>
            )}
          </div>
        )}

        {/* ─── Pricing ──────────────────────────────────────── */}
        {activeTab === "pricing" && (
          <div className="max-w-md">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Base price per night</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₦</span>
                  <input
                    type="number"
                    value={basePrice}
                    onChange={(e) => setBasePrice(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:border-[#0B3D2C] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cleaning fee</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₦</span>
                  <input
                    type="number"
                    value={cleaningFee}
                    onChange={(e) => setCleaningFee(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:border-[#0B3D2C] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Minimum nights</label>
                <input
                  type="number"
                  value={minNights}
                  min={1}
                  onChange={(e) => setMinNights(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:border-[#0B3D2C] transition-colors"
                />
              </div>

              <button className="w-full py-3 bg-[#0B3D2C] text-white text-sm font-semibold rounded-xl hover:bg-[#0F5240] transition-colors">
                Save changes
              </button>
            </div>
          </div>
        )}

        {/* ─── Host ─────────────────────────────────────────── */}
        {activeTab === "host" && (
          <div className="max-w-md">
            <p className="text-sm text-gray-500 mb-4">Choose who manages this property day-to-day.</p>

            <div className="space-y-2">
              {/* Owner */}
              <button
                type="button"
                onClick={() => setAssignedHostId("")}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                  !assignedHostId ? "border-[#0B3D2C] bg-[#0B3D2C]/5" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-[#0B3D2C] flex items-center justify-center text-white text-xs font-medium shrink-0">You</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Me (Owner)</p>
                  <p className="text-xs text-gray-500">I manage this property</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  !assignedHostId ? "border-[#0B3D2C] bg-[#0B3D2C]" : "border-gray-300"
                }`}>
                  {!assignedHostId && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </button>

              {/* Verified hosts */}
              {verifiedHosts.map((inv) => (
                <button
                  key={inv.id}
                  type="button"
                  onClick={() => setAssignedHostId(inv.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                    assignedHostId === inv.id ? "border-[#0B3D2C] bg-[#0B3D2C]/5" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-medium shrink-0">
                    {inv.name?.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{inv.name}</p>
                    <p className="text-xs text-gray-500">{inv.role === "CO_HOST" ? "Co-Host" : "Host"} · {inv.commission}%</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    assignedHostId === inv.id ? "border-[#0B3D2C] bg-[#0B3D2C]" : "border-gray-300"
                  }`}>
                    {assignedHostId === inv.id && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </button>
              ))}
            </div>

            {verifiedHosts.length === 0 && (
              <p className="text-xs text-gray-400 mt-3">You can add hosts from your <Link href="/owner/hosts" className="text-[#0B3D2C] underline">Hosts</Link> page.</p>
            )}

            <button className="w-full mt-5 py-3 bg-[#0B3D2C] text-white text-sm font-semibold rounded-xl hover:bg-[#0F5240] transition-colors">
              Save changes
            </button>
          </div>
        )}

      </motion.div>
      </>
      )}
    </div>
  );
}
