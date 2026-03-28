"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Edit2, MapPin, Calendar, Star, Check, Circle, Briefcase, Globe } from "lucide-react";
import { Avatar, Button } from "@/components/ui";
import Link from "next/link";

type Tab = "about" | "trips" | "reviews" | "complete";

const pastTrips = [
  { property: "Luxury 3-Bedroom Apartment with Ocean View", city: "Victoria Island, Lagos", checkIn: "Dec 15, 2025", checkOut: "Dec 20, 2025", image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400", host: "Amara", rating: 5 },
  { property: "Spacious Family Home in Maitama", city: "Abuja, FCT", checkIn: "Oct 3, 2025", checkOut: "Oct 7, 2025", image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400", host: "Chidi", rating: 4 },
  { property: "Modern 2-Bedroom Penthouse with Rooftop Pool", city: "Ikoyi, Lagos", checkIn: "Aug 22, 2025", checkOut: "Aug 26, 2025", image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400", host: "Amara", rating: 5 },
  { property: "Cozy Studio in the Heart of Lekki", city: "Lekki, Lagos", checkIn: "Jun 10, 2025", checkOut: "Jun 13, 2025", image: "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=400", host: "Ngozi", rating: 4 },
  { property: "Waterfront Apartment in Port Harcourt", city: "Port Harcourt, Rivers", checkIn: "Apr 1, 2025", checkOut: "Apr 4, 2025", image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400", host: "Chidi", rating: 5 },
];

const mockReviews = [
  { property: "Luxury 3-Bedroom Apartment with Ocean View", host: "Amara", date: "Dec 2025", rating: 5, text: "Absolutely stunning apartment! The ocean view was breathtaking and Amara was incredibly responsive. Everything was spotless and well-stocked. Will definitely return." },
  { property: "Spacious Family Home in Maitama", host: "Chidi", date: "Oct 2025", rating: 4, text: "Great family home with plenty of space. Chidi was very helpful with restaurant recommendations. Only minor issue was the WiFi speed but overall a wonderful stay." },
  { property: "Modern 2-Bedroom Penthouse with Rooftop Pool", host: "Amara", date: "Aug 2025", rating: 5, text: "The rooftop pool alone makes this worth every naira. Amara went above and beyond — arranged airport pickup and left a welcome basket. Five stars." },
];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<Tab>("about");

  // Shape of user profile data the backend should return
  // Private fields (phone, email, emergencyContact) are NEVER shown on public profile
  const user = {
    name: "Adaeze Nwosu",
    email: "adaeze@truvade.com",             // private — never on public profile
    phone: "+234 801 234 5678",              // private
    initials: "AN",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&fit=crop&crop=face",
    role: "Guest",                            // "Guest" | "Owner" | "Host"
    verified: true,                           // KYC verified
    joinedDate: "January 2024",
    location: "Lagos, Nigeria",               // public
    work: "Product Designer at TechCo",       // public
    bio: "Hey there! I'm Adaeze — a Lagos-based product designer who loves exploring new cities through short stays. I travel for work and for fun, and I always appreciate a clean, well-located apartment with fast WiFi. I'm a quiet guest who respects house rules. Looking forward to discovering more amazing spaces on Truvade!",
    languages: ["English", "Yoruba", "Pidgin"],
    emergencyContact: "Kemi Nwosu — +234 802 345 6789",
  };

  // Profile completeness checklist
  const profileFields = [
    { key: "avatar", label: "Profile photo", done: !!user.avatar },
    { key: "bio", label: "Bio", done: !!user.bio },
    { key: "work", label: "Work", done: !!user.work },
    { key: "languages", label: "Languages", done: user.languages.length > 0 },
    { key: "phone", label: "Phone number", done: !!user.phone },
    { key: "email", label: "Email address", done: !!user.email },
    { key: "emergencyContact", label: "Emergency contact", done: !!user.emergencyContact },
  ];
  const completedCount = profileFields.filter((f) => f.done).length;
  const totalFields = profileFields.length;
  const isComplete = completedCount === totalFields;

  const tabs: { key: Tab; label: string; badge?: string }[] = [
    { key: "about", label: "About me" },
    { key: "trips", label: "Past trips" },
    { key: "reviews", label: "Reviews" },
    ...(!isComplete ? [{ key: "complete" as Tab, label: "Complete profile", badge: `${completedCount}/${totalFields}` }] : []),
  ];

  return (
    <div>
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
        {/* Left sidebar */}
        <div className="lg:w-[280px] flex-shrink-0">
          <div className="lg:sticky lg:top-[100px]">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center shadow-sm">
              <Avatar
                src={user.avatar}
                initials={user.initials}
                name={user.name}
                size="xl"
                verified={user.verified}
                className="mx-auto"
              />
              <h2 className="text-2xl font-bold text-gray-900 mt-4">{user.name}</h2>
              <p className="text-sm text-gray-500 mt-1">{user.role}</p>

              <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-gray-100">
                <div>
                  <p className="text-lg font-bold text-gray-900">{pastTrips.length}</p>
                  <p className="text-xs text-gray-500">Trips</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">{mockReviews.length}</p>
                  <p className="text-xs text-gray-500">Reviews</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">2</p>
                  <p className="text-xs text-gray-500">Years</p>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {user.location && (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {user.location}
                </div>
              )}
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Calendar className="w-4 h-4 text-gray-400" />
                Joined {user.joinedDate}
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <ShieldCheck className="w-4 h-4 text-[#0B3D2C]" />
                Identity verified
              </div>
            </div>

            <Link href="/account/settings" className="block mt-5">
              <Button variant="outline" fullWidth size="sm" leftIcon={<Edit2 className="w-3.5 h-3.5" />}>
                Edit profile
              </Button>
            </Link>
          </div>
        </div>

        {/* Right content */}
        <div className="flex-1 min-w-0">
          {/* Tabs */}
          <div className="flex items-center gap-2 mb-6 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                  activeTab === tab.key
                    ? "bg-[#0B3D2C] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {tab.label}
                {tab.badge && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.key ? "bg-white/20" : "bg-gray-200"
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {/* About — public fields only */}
              {activeTab === "about" && (
                <div>
                  {/* Bio */}
                  {user.bio ? (
                    <p className="text-gray-600 leading-relaxed mb-8">{user.bio}</p>
                  ) : (
                    <p className="text-gray-400 italic mb-8">No bio added yet</p>
                  )}

                  {/* Details grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {user.work && (
                      <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50">
                        <Briefcase className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">Work</p>
                          <p className="text-sm font-medium text-gray-900 mt-0.5">{user.work}</p>
                        </div>
                      </div>
                    )}

                    {user.languages.length > 0 && (
                      <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50">
                        <Globe className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">Languages</p>
                          <p className="text-sm font-medium text-gray-900 mt-0.5">{user.languages.join(", ")}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Lives in</p>
                        <p className="text-sm font-medium text-gray-900 mt-0.5">{user.location}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50">
                      <Calendar className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Member since</p>
                        <p className="text-sm font-medium text-gray-900 mt-0.5">{user.joinedDate}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Past trips */}
              {activeTab === "trips" && (
                <div className="space-y-3">
                  {pastTrips.map((trip, i) => (
                    <div key={i} className="flex gap-4 p-3 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
                      <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0">
                        <div className="w-full h-full bg-gray-200" style={{ backgroundImage: `url(${trip.image})`, backgroundSize: "cover", backgroundPosition: "center" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 line-clamp-1">{trip.property}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{trip.city}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-400">{trip.checkIn} — {trip.checkOut}</span>
                        </div>
                        <div className="flex items-center justify-between mt-1.5">
                          <p className="text-xs text-gray-400">Hosted by {trip.host}</p>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: trip.rating }).map((_, j) => (
                              <Star key={j} className="w-3 h-3 fill-[#B87333] text-[#B87333]" />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Reviews */}
              {activeTab === "reviews" && (
                <div className="space-y-5">
                  {mockReviews.map((review, i) => (
                    <div key={i} className="pb-5 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{review.property}</p>
                          <p className="text-xs text-gray-500">Hosted by {review.host} · {review.date}</p>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: review.rating }).map((_, j) => (
                            <Star key={j} className="w-3.5 h-3.5 fill-[#B87333] text-[#B87333]" />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{review.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Complete profile — self-view only, shows checklist */}
              {activeTab === "complete" && (
                <div>
                  {/* Progress */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-900">Profile completion</p>
                      <p className="text-sm text-gray-500">{completedCount} of {totalFields}</p>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#0B3D2C] rounded-full transition-all"
                        style={{ width: `${(completedCount / totalFields) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Checklist */}
                  <div className="space-y-1">
                    {profileFields.map((field) => (
                      <Link
                        key={field.key}
                        href="/account/settings"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        {field.done ? (
                          <div className="w-5 h-5 rounded-full bg-[#0B3D2C] flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        ) : (
                          <Circle className="w-5 h-5 text-gray-300 shrink-0" />
                        )}
                        <span className={`text-sm flex-1 ${field.done ? "text-gray-500 line-through" : "text-gray-900 font-medium"}`}>
                          {field.label}
                        </span>
                        {!field.done && (
                          <span className="text-xs text-[#0B3D2C] font-medium">Add</span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
