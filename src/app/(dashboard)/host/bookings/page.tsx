"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, LogIn, LogOut, CalendarDays, User, MoreHorizontal, MessageSquare } from "lucide-react";
import { Avatar } from "@/components/ui";
import { formatDate } from "@/lib/types";
import type { BookingStatus } from "@/lib/types";

type Tab = "all" | "pending" | "confirmed" | "checked_in" | "completed";

interface HostBooking {
  id: string;
  guestName: string;
  guestEmail: string;
  guestInitials: string;
  propertyName: string;
  propertyImage: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  status: BookingStatus;
  amount: string;
}

const mockBookings: HostBooking[] = [
  { id: "HBK-001", guestName: "Adaeze Nwosu", guestEmail: "adaeze@email.com", guestInitials: "AN", propertyName: "Luxury 3-Bedroom Apartment", propertyImage: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=200", checkIn: "2026-04-01", checkOut: "2026-04-05", guests: 4, status: "PENDING", amount: "₦340,000" },
  { id: "HBK-002", guestName: "Emeka Obi", guestEmail: "emeka@email.com", guestInitials: "EO", propertyName: "Cozy Studio in Lekki", propertyImage: "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=200", checkIn: "2026-04-03", checkOut: "2026-04-06", guests: 2, status: "CONFIRMED", amount: "₦105,000" },
  { id: "HBK-003", guestName: "Fatima Bello", guestEmail: "fatima@email.com", guestInitials: "FB", propertyName: "Penthouse with Rooftop Pool", propertyImage: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=200", checkIn: "2026-03-28", checkOut: "2026-04-02", guests: 3, status: "CHECKED_IN", amount: "₦750,000" },
  { id: "HBK-004", guestName: "Kola Adeyemi", guestEmail: "kola@email.com", guestInitials: "KA", propertyName: "Family Home in Maitama", propertyImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=200", checkIn: "2026-03-20", checkOut: "2026-03-25", guests: 6, status: "CHECKED_OUT", amount: "₦480,000" },
  { id: "HBK-005", guestName: "Amina Yusuf", guestEmail: "amina@email.com", guestInitials: "AY", propertyName: "Serviced Apartment Ikeja", propertyImage: "https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=200", checkIn: "2026-04-10", checkOut: "2026-04-14", guests: 2, status: "PENDING", amount: "₦200,000" },
  { id: "HBK-006", guestName: "Tunde Bakare", guestEmail: "tunde@email.com", guestInitials: "TB", propertyName: "Luxury 3-Bedroom Apartment", propertyImage: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=200", checkIn: "2026-04-08", checkOut: "2026-04-12", guests: 5, status: "CONFIRMED", amount: "₦340,000" },
];

const tabs: { key: Tab; label: string; count?: number }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "checked_in", label: "Checked In" },
  { key: "completed", label: "Completed" },
];

const statusConfig: Record<BookingStatus, { label: string; bg: string; text: string }> = {
  CONFIRMED: { label: "Confirmed", bg: "bg-emerald-50", text: "text-emerald-700" },
  PENDING: { label: "Pending", bg: "bg-amber-50", text: "text-amber-700" },
  CHECKED_IN: { label: "Checked in", bg: "bg-blue-50", text: "text-blue-700" },
  CHECKED_OUT: { label: "Completed", bg: "bg-gray-100", text: "text-gray-600" },
  CANCELLED: { label: "Cancelled", bg: "bg-red-50", text: "text-red-700" },
  REFUNDED: { label: "Refunded", bg: "bg-purple-50", text: "text-purple-700" },
};

function filterByTab(bookings: HostBooking[], tab: Tab): HostBooking[] {
  if (tab === "all") return bookings;
  const statusMap: Record<string, BookingStatus[]> = {
    pending: ["PENDING"],
    confirmed: ["CONFIRMED"],
    checked_in: ["CHECKED_IN"],
    completed: ["CHECKED_OUT"],
  };
  return bookings.filter((b) => statusMap[tab]?.includes(b.status));
}

export default function HostBookingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [bookings, setBookings] = useState(mockBookings);
  const filtered = filterByTab(bookings, activeTab);

  const updateStatus = (id: string, newStatus: BookingStatus) => {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b)));
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
        <p className="text-sm text-gray-500 mt-1">{bookings.length} total reservations</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200 mb-8">
        {tabs.map((tab) => {
          const count = filterByTab(bookings, tab.key).length;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative pb-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`ml-1.5 text-xs ${activeTab === tab.key ? "text-gray-900" : "text-gray-400"}`}>
                  {count}
                </span>
              )}
              {activeTab === tab.key && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 rounded-full"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Booking list */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <CalendarDays className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No bookings found</p>
              <p className="text-sm text-gray-400 mt-1">Bookings will appear here when guests make reservations</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((booking, i) => {
                const status = statusConfig[booking.status];
                return (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group bg-white border border-gray-200 rounded-xl p-4 sm:p-5 hover:border-gray-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start gap-4">
                      {/* Guest avatar */}
                      <Avatar initials={booking.guestInitials} name={booking.guestName} size="md" />

                      {/* Main content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900">{booking.guestName}</h3>
                            <p className="text-sm text-gray-500 mt-0.5">{booking.propertyName}</p>
                          </div>
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                            {status.label}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1.5">
                            <CalendarDays className="w-3.5 h-3.5" />
                            {formatDate(booking.checkIn)} — {formatDate(booking.checkOut)}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5" />
                            {booking.guests} guest{booking.guests > 1 ? "s" : ""}
                          </span>
                          <span className="font-medium text-gray-900">{booking.amount}</span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-4">
                          {booking.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => updateStatus(booking.id, "CONFIRMED")}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Accept
                              </button>
                              <button
                                onClick={() => updateStatus(booking.id, "CANCELLED")}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                Decline
                              </button>
                            </>
                          )}
                          {booking.status === "CONFIRMED" && (
                            <button
                              onClick={() => updateStatus(booking.id, "CHECKED_IN")}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                            >
                              <LogIn className="w-3.5 h-3.5" />
                              Check in
                            </button>
                          )}
                          {booking.status === "CHECKED_IN" && (
                            <button
                              onClick={() => updateStatus(booking.id, "CHECKED_OUT")}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                              Check out
                            </button>
                          )}
                          {booking.status === "CHECKED_OUT" && (
                            <span className="text-sm text-gray-400">Stay completed</span>
                          )}
                          <button className="ml-auto p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100">
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
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
