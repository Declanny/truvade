"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Edit2,
  MapPin,
  Calendar,
  Check,
  Circle,
  Briefcase,
  Globe,
  Loader2,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import { Avatar, Button } from "@/components/ui";
import Link from "next/link";
import { api, extractErrorMessage } from "@/lib/api";
import { formatDate } from "@/lib/types";
import type { ApiProfile, ApiBooking } from "@/lib/api-types";

type Tab = "about" | "trips" | "reviews" | "complete";

interface ProfileCompletion {
  percentage: number;
  completed: number;
  total: number;
  checklist: { field: string; label: string; completed: boolean }[];
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<Tab>("about");
  const [profile, setProfile] = useState<ApiProfile | null>(null);
  const [completion, setCompletion] = useState<ProfileCompletion | null>(null);
  const [trips, setTrips] = useState<ApiBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [prof, comp, bookings] = await Promise.all([
        api.get<ApiProfile>("/v1/profile/me/"),
        api.get<ProfileCompletion>("/v1/profile/me/completion/"),
        api
          .get<ApiBooking[]>("/v1/bookings/mine/")
          .catch(() => [] as ApiBooking[]),
      ]);
      setProfile(prof);
      setCompletion(comp);
      setTrips(bookings.filter((b) => b.status === "COMPLETED"));
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#0B3D2C] animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-md mx-auto py-20">
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p>{error || "Couldn't load your profile."}</p>
            <button
              onClick={fetchAll}
              className="mt-2 underline font-semibold"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isComplete = completion ? completion.completed === completion.total : false;
  const joinedLabel = new Date(profile.date_joined).toLocaleDateString("en-NG", {
    month: "long",
    year: "numeric",
  });
  const yearsActive = Math.max(
    1,
    new Date().getFullYear() - new Date(profile.date_joined).getFullYear()
  );

  const tabs: { key: Tab; label: string; badge?: string }[] = [
    { key: "about", label: "About me" },
    { key: "trips", label: "Past trips" },
    { key: "reviews", label: "Reviews" },
    ...(!isComplete && completion
      ? [
          {
            key: "complete" as Tab,
            label: "Complete profile",
            badge: `${completion.completed}/${completion.total}`,
          },
        ]
      : []),
  ];

  return (
    <div>
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
        {/* Left sidebar */}
        <div className="lg:w-[280px] flex-shrink-0">
          <div className="lg:sticky lg:top-[100px]">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center shadow-sm">
              <Avatar
                src={profile.avatar ?? undefined}
                name={profile.name}
                size="xl"
                verified={profile.is_verified}
                className="mx-auto"
              />
              <h2 className="text-2xl font-bold text-gray-900 mt-4">
                {profile.preferred_name || profile.name}
              </h2>
              <p className="text-sm text-gray-500 mt-1 capitalize">
                {profile.role.toLowerCase()}
              </p>

              <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-gray-100">
                <div>
                  <p className="text-lg font-bold text-gray-900">
                    {trips.length}
                  </p>
                  <p className="text-xs text-gray-500">Trips</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">0</p>
                  <p className="text-xs text-gray-500">Reviews</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">
                    {yearsActive}
                  </p>
                  <p className="text-xs text-gray-500">
                    Year{yearsActive !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {profile.location && (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {profile.location}
                </div>
              )}
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Calendar className="w-4 h-4 text-gray-400" />
                Joined {joinedLabel}
              </div>
              {profile.is_verified && (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <ShieldCheck className="w-4 h-4 text-[#0B3D2C]" />
                  Identity verified
                </div>
              )}
            </div>

            <Link href="/account/settings" className="block mt-5">
              <Button
                variant="outline"
                fullWidth
                size="sm"
                leftIcon={<Edit2 className="w-3.5 h-3.5" />}
              >
                Edit profile
              </Button>
            </Link>
          </div>
        </div>

        {/* Right content */}
        <div className="flex-1 min-w-0">
          {/* Tabs */}
          <div
            className="flex items-center gap-2 mb-6 overflow-x-auto"
            style={{ scrollbarWidth: "none" }}
          >
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
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${
                      activeTab === tab.key
                        ? "bg-white/20"
                        : "bg-gray-200"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {/* About */}
              {activeTab === "about" && (
                <div>
                  {profile.bio ? (
                    <p className="text-gray-600 leading-relaxed mb-8 whitespace-pre-wrap">
                      {profile.bio}
                    </p>
                  ) : (
                    <p className="text-gray-400 italic mb-8">
                      No bio added yet.{" "}
                      <Link
                        href="/account/settings"
                        className="not-italic text-[#0B3D2C] underline"
                      >
                        Add one
                      </Link>
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {profile.work && (
                      <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50">
                        <Briefcase className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">Work</p>
                          <p className="text-sm font-medium text-gray-900 mt-0.5">
                            {profile.work}
                          </p>
                        </div>
                      </div>
                    )}

                    {profile.languages.length > 0 && (
                      <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50">
                        <Globe className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">Languages</p>
                          <p className="text-sm font-medium text-gray-900 mt-0.5">
                            {profile.languages.join(", ")}
                          </p>
                        </div>
                      </div>
                    )}

                    {profile.location && (
                      <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50">
                        <MapPin className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">Lives in</p>
                          <p className="text-sm font-medium text-gray-900 mt-0.5">
                            {profile.location}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50">
                      <Calendar className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">Member since</p>
                        <p className="text-sm font-medium text-gray-900 mt-0.5">
                          {joinedLabel}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Past trips */}
              {activeTab === "trips" && (
                <div>
                  {trips.length === 0 ? (
                    <div className="border border-dashed border-gray-200 rounded-xl py-10 text-center">
                      <p className="text-sm text-gray-500">
                        No completed trips yet.
                      </p>
                      <Link
                        href="/shortlets"
                        className="text-sm text-[#0B3D2C] underline mt-2 inline-block"
                      >
                        Browse shortlets
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {trips.map((trip) => (
                        <Link
                          key={trip.id}
                          href={`/properties/${trip.shortlet.id}`}
                          className="flex gap-4 p-3 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors"
                        >
                          <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-gray-200">
                            {trip.shortlet.cover_image && (
                              <div
                                className="w-full h-full"
                                style={{
                                  backgroundImage: `url(${trip.shortlet.cover_image})`,
                                  backgroundSize: "cover",
                                  backgroundPosition: "center",
                                }}
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 line-clamp-1">
                              {trip.shortlet.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {trip.shortlet.city}, {trip.shortlet.state}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-400">
                                {formatDate(trip.check_in)} —{" "}
                                {formatDate(trip.check_out)}
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Reviews — backend doesn't have reviews yet */}
              {activeTab === "reviews" && (
                <div className="border border-dashed border-gray-200 rounded-xl py-10 text-center">
                  <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No reviews yet.</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Reviews from hosts will appear here after your trips.
                  </p>
                </div>
              )}

              {/* Complete profile */}
              {activeTab === "complete" && completion && (
                <div>
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-900">
                        Profile completion
                      </p>
                      <p className="text-sm text-gray-500">
                        {completion.completed} of {completion.total}
                      </p>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#0B3D2C] rounded-full transition-all"
                        style={{ width: `${completion.percentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    {completion.checklist.map((field) => (
                      <Link
                        key={field.field}
                        href="/account/settings"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        {field.completed ? (
                          <div className="w-5 h-5 rounded-full bg-[#0B3D2C] flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        ) : (
                          <Circle className="w-5 h-5 text-gray-300 shrink-0" />
                        )}
                        <span
                          className={`text-sm flex-1 ${
                            field.completed
                              ? "text-gray-500 line-through"
                              : "text-gray-900 font-medium"
                          }`}
                        >
                          {field.label}
                        </span>
                        {!field.completed && (
                          <span className="text-xs text-[#0B3D2C] font-medium">
                            Add
                          </span>
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
