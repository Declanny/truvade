"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, LogIn, LogOut, CalendarDays, User } from "lucide-react";
import { Card, CardBody, Button, Badge } from "@/components/ui";
import { formatDate } from "@/lib/types";
import type { BookingStatus } from "@/lib/types";

type Tab = "all" | "pending" | "confirmed" | "checked_in" | "completed";

interface HostBooking {
  id: string;
  guestName: string;
  guestEmail: string;
  propertyName: string;
  propertyImage: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  status: BookingStatus;
}

const mockBookings: HostBooking[] = [
  { id: "HBK-001", guestName: "Adaeze Nwosu", guestEmail: "adaeze@email.com", propertyName: "Luxury 3-Bedroom Apartment", propertyImage: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=200", checkIn: "2026-04-01", checkOut: "2026-04-05", guests: 4, status: "PENDING" },
  { id: "HBK-002", guestName: "Emeka Obi", guestEmail: "emeka@email.com", propertyName: "Cozy Studio in Lekki", propertyImage: "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=200", checkIn: "2026-04-03", checkOut: "2026-04-06", guests: 2, status: "CONFIRMED" },
  { id: "HBK-003", guestName: "Fatima Bello", guestEmail: "fatima@email.com", propertyName: "Penthouse with Rooftop Pool", propertyImage: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=200", checkIn: "2026-03-28", checkOut: "2026-04-02", guests: 3, status: "CHECKED_IN" },
  { id: "HBK-004", guestName: "Kola Adeyemi", guestEmail: "kola@email.com", propertyName: "Family Home in Maitama", propertyImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=200", checkIn: "2026-03-20", checkOut: "2026-03-25", guests: 6, status: "CHECKED_OUT" },
  { id: "HBK-005", guestName: "Amina Yusuf", guestEmail: "amina@email.com", propertyName: "Serviced Apartment Ikeja", propertyImage: "https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=200", checkIn: "2026-04-10", checkOut: "2026-04-14", guests: 2, status: "PENDING" },
  { id: "HBK-006", guestName: "Tunde Bakare", guestEmail: "tunde@email.com", propertyName: "Luxury 3-Bedroom Apartment", propertyImage: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=200", checkIn: "2026-04-08", checkOut: "2026-04-12", guests: 5, status: "CONFIRMED" },
];

const tabs: { key: Tab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "checked_in", label: "Checked In" },
  { key: "completed", label: "Completed" },
];

const statusVariant: Record<BookingStatus, "success" | "warning" | "info" | "gray" | "error" | "primary"> = {
  CONFIRMED: "success",
  PENDING: "warning",
  CHECKED_IN: "info",
  CHECKED_OUT: "gray",
  CANCELLED: "error",
  REFUNDED: "primary",
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
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 border-l-4 border-[#0B3D2C] pl-4 mb-6">Bookings</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-6 overflow-x-auto w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 whitespace-nowrap ${
              activeTab === tab.key
                ? "bg-[#0B3D2C] text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Booking Cards */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          {filtered.length === 0 ? (
            <Card variant="bordered" padding="lg">
              <div className="text-center py-12">
                <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">No bookings found</p>
              </div>
            </Card>
          ) : (
            filtered.map((booking) => (
              <Card key={booking.id} variant="bordered" padding="none">
                <div className="flex flex-col sm:flex-row">
                  <div className="sm:w-36 h-32 sm:h-auto">
                    <img
                      src={booking.propertyImage}
                      alt={booking.propertyName}
                      className="w-full h-full object-cover rounded-t-lg sm:rounded-l-lg sm:rounded-tr-none"
                    />
                  </div>
                  <CardBody className="flex-1 p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">{booking.propertyName}</h3>
                        <span className="text-xs text-gray-400 font-mono">{booking.id}</span>
                      </div>
                      <Badge variant={statusVariant[booking.status]} size="sm">
                        {booking.status.replace("_", " ")}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{booking.guestName}</span>
                      <span className="text-gray-400">&middot;</span>
                      <span className="text-gray-500">{booking.guestEmail}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                      <CalendarDays className="w-4 h-4 text-gray-400" />
                      <span>{formatDate(booking.checkIn)} — {formatDate(booking.checkOut)}</span>
                      <span className="text-gray-300">|</span>
                      <span>{booking.guests} guest{booking.guests > 1 ? "s" : ""}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                      {booking.status === "PENDING" && (
                        <>
                          <Button
                            size="sm"
                            variant="primary"
                            leftIcon={<Check className="w-3.5 h-3.5" />}
                            onClick={() => updateStatus(booking.id, "CONFIRMED")}
                          >
                            Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            leftIcon={<X className="w-3.5 h-3.5" />}
                            onClick={() => updateStatus(booking.id, "CANCELLED")}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      {booking.status === "CONFIRMED" && (
                        <Button
                          size="sm"
                          variant="primary"
                          leftIcon={<LogIn className="w-3.5 h-3.5" />}
                          onClick={() => updateStatus(booking.id, "CHECKED_IN")}
                        >
                          Check In
                        </Button>
                      )}
                      {booking.status === "CHECKED_IN" && (
                        <Button
                          size="sm"
                          variant="accent"
                          leftIcon={<LogOut className="w-3.5 h-3.5" />}
                          onClick={() => updateStatus(booking.id, "CHECKED_OUT")}
                        >
                          Check Out
                        </Button>
                      )}
                      {booking.status === "CHECKED_OUT" && (
                        <span className="text-sm text-gray-400">Stay completed</span>
                      )}
                    </div>
                  </CardBody>
                </div>
              </Card>
            ))
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
