"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, MapPin, Clock, Star, X } from "lucide-react";
import { Card, CardBody, Badge, Button } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/types";
import type { BookingStatus } from "@/lib/types";

type Tab = "upcoming" | "completed" | "cancelled";

interface MockBooking {
  id: string;
  propertyName: string;
  propertyImage: string;
  location: string;
  checkIn: string;
  checkOut: string;
  status: BookingStatus;
  totalPrice: number;
  guests: number;
}

const mockBookings: MockBooking[] = [
  {
    id: "bk-001",
    propertyName: "Luxury 3-Bedroom Apartment with Ocean View",
    propertyImage: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400",
    location: "Victoria Island, Lagos",
    checkIn: "2026-04-01",
    checkOut: "2026-04-05",
    status: "CONFIRMED",
    totalPrice: 355000,
    guests: 4,
  },
  {
    id: "bk-002",
    propertyName: "Cozy Studio in the Heart of Lekki Phase 1",
    propertyImage: "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=400",
    location: "Lekki, Lagos",
    checkIn: "2026-04-15",
    checkOut: "2026-04-18",
    status: "PENDING",
    totalPrice: 110000,
    guests: 2,
  },
  {
    id: "bk-003",
    propertyName: "Modern 2-Bedroom Penthouse with Rooftop Pool",
    propertyImage: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400",
    location: "Ikoyi, Lagos",
    checkIn: "2026-02-10",
    checkOut: "2026-02-14",
    status: "CHECKED_OUT",
    totalPrice: 625000,
    guests: 3,
  },
  {
    id: "bk-004",
    propertyName: "Spacious Family Home in Maitama",
    propertyImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400",
    location: "Abuja, FCT",
    checkIn: "2026-01-05",
    checkOut: "2026-01-10",
    status: "CHECKED_OUT",
    totalPrice: 620000,
    guests: 6,
  },
  {
    id: "bk-005",
    propertyName: "Waterfront Apartment in Port Harcourt",
    propertyImage: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400",
    location: "Port Harcourt, Rivers",
    checkIn: "2026-03-01",
    checkOut: "2026-03-03",
    status: "CANCELLED",
    totalPrice: 120000,
    guests: 2,
  },
];

const statusBadgeVariant: Record<BookingStatus, "success" | "warning" | "info" | "gray" | "error" | "primary"> = {
  CONFIRMED: "success",
  PENDING: "warning",
  CHECKED_IN: "info",
  CHECKED_OUT: "gray",
  CANCELLED: "error",
  REFUNDED: "primary",
};

function filterBookings(tab: Tab): MockBooking[] {
  switch (tab) {
    case "upcoming":
      return mockBookings.filter((b) => ["CONFIRMED", "PENDING", "CHECKED_IN"].includes(b.status));
    case "completed":
      return mockBookings.filter((b) => b.status === "CHECKED_OUT");
    case "cancelled":
      return mockBookings.filter((b) => ["CANCELLED", "REFUNDED"].includes(b.status));
  }
}

const tabs: { key: Tab; label: string }[] = [
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

export default function GuestBookingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("upcoming");
  const [reviewedBookings, setReviewedBookings] = useState<Record<string, number>>({}); // bookingId -> rating
  const [reviewModal, setReviewModal] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const filtered = filterBookings(activeTab);

  const handleSubmitReview = () => {
    if (reviewModal && reviewRating > 0) {
      setReviewedBookings((prev) => ({ ...prev, [reviewModal]: reviewRating }));
      setReviewModal(null);
      setReviewRating(0);
      setReviewText("");
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Bookings</h1>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200 mb-8">
        {tabs.map((tab) => (
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
            {activeTab === tab.key && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 rounded-full"
              />
            )}
          </button>
        ))}
      </div>

      {/* Booking List */}
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
                <p className="text-gray-500 text-lg font-medium">No {activeTab} bookings</p>
                <p className="text-gray-400 text-sm mt-1">
                  {activeTab === "upcoming"
                    ? "Browse properties to make your next booking"
                    : activeTab === "completed"
                    ? "Your completed stays will appear here"
                    : "No cancelled bookings to show"}
                </p>
              </div>
            </Card>
          ) : (
            filtered.map((booking) => (
              <Card key={booking.id} variant="bordered" padding="none" hover>
                <div className="flex flex-col sm:flex-row">
                  <div className="sm:w-48 h-40 sm:h-auto">
                    <img
                      src={booking.propertyImage}
                      alt={booking.propertyName}
                      className="w-full h-full object-cover rounded-t-lg sm:rounded-l-lg sm:rounded-tr-none"
                    />
                  </div>
                  <CardBody className="flex-1 p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 line-clamp-1">
                        {booking.propertyName}
                      </h3>
                      <Badge variant={statusBadgeVariant[booking.status]} size="sm">
                        {booking.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
                      <MapPin className="w-4 h-4" />
                      <span>{booking.location}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>
                          {formatDate(booking.checkIn)} — {formatDate(booking.checkOut)}
                        </span>
                      </div>
                      <span className="text-gray-300">|</span>
                      <span>{booking.guests} guest{booking.guests > 1 ? "s" : ""}</span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-lg font-bold text-[#0B3D2C]">
                        {formatCurrency(booking.totalPrice)}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400">Ref: {booking.id.toUpperCase()}</span>
                        {booking.status === "CHECKED_OUT" && (
                          reviewedBookings[booking.id] ? (
                            <span className="text-sm text-gray-400 flex items-center gap-1">
                              Review Submitted <Star className="w-3.5 h-3.5 fill-[#B87333] text-[#B87333]" /> {reviewedBookings[booking.id].toFixed(1)}
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => {
                                setReviewModal(booking.id);
                                setReviewRating(0);
                                setReviewText("");
                              }}
                            >
                              Leave a Review
                            </Button>
                          )
                        )}
                      </div>
                    </div>
                  </CardBody>
                </div>
              </Card>
            ))
          )}
        </motion.div>
      </AnimatePresence>

      {/* Review Modal */}
      <AnimatePresence>
        {reviewModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setReviewModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-gray-900">Leave a Review</h3>
                <button onClick={() => setReviewModal(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Star Rating */}
              <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewRating(star)}
                    className="p-0.5"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        star <= reviewRating
                          ? "fill-[#B87333] text-[#B87333]"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>

              {/* Review Text */}
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share your experience..."
                rows={4}
                className="block w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0B3D2C] focus:border-[#0B3D2C] resize-none mb-4"
              />

              <Button
                variant="primary"
                fullWidth
                onClick={handleSubmitReview}
                disabled={reviewRating === 0}
              >
                Submit Review
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
