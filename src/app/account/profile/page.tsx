"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Edit2, MessageSquare, MapPin, Briefcase, Calendar } from "lucide-react";
import { Avatar, Button, Card } from "@/components/ui";
import Link from "next/link";

export default function ProfilePage() {
  const user = {
    name: "Adaeze Nwosu",
    email: "adaeze@truvade.com",
    initials: "AN",
    role: "Guest",
    verified: true,
    joinedDate: "January 2024",
    location: "Lagos, Nigeria",
    work: "",
    bio: "",
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile</h1>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
        {/* Left sidebar */}
        <div className="lg:w-[280px] flex-shrink-0">
          {/* Profile card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center shadow-sm">
            <Avatar
              initials={user.initials}
              name={user.name}
              size="xl"
              verified={user.verified}
              className="mx-auto"
            />
            <h2 className="text-2xl font-bold text-gray-900 mt-4">{user.name}</h2>
            <p className="text-sm text-gray-500 mt-1">{user.role}</p>
          </div>

          {/* Nav links */}
          <nav className="mt-6 space-y-1">
            {[
              { label: "About me", href: "#about", icon: "👤", active: true },
              { label: "Past trips", href: "/guest/bookings", icon: "🧳", active: false },
              { label: "Connections", href: "#", icon: "👥", active: false },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  item.active
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right content */}
        <div className="flex-1 min-w-0">
          {/* About me header */}
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-2xl font-bold text-gray-900">About me</h2>
            <Link href="/account/settings">
              <Button variant="outline" size="sm" leftIcon={<Edit2 className="w-3.5 h-3.5" />}>
                Edit profile
              </Button>
            </Link>
          </div>

          {/* Profile details */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Complete your profile CTA */}
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar initials={user.initials} name={user.name} size="lg" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{user.name}</h3>
                    <p className="text-sm text-gray-500">{user.role}</p>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-gray-600">
                  {user.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {user.location}
                    </div>
                  )}
                  {user.work && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-gray-400" />
                      {user.work}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    Joined {user.joinedDate}
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm sm:w-[280px]">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Complete your profile</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Your Truvade profile is an important part of every reservation. Complete yours to help other hosts and guests get to know you.
                </p>
                <Link href="/account/settings">
                  <Button variant="primary" size="md" fullWidth>
                    Get started
                  </Button>
                </Link>
              </div>
            </div>

            {/* Reviews section */}
            <div className="mt-8">
              <div className="flex items-center gap-3 text-gray-500">
                <MessageSquare className="w-5 h-5" />
                <span className="text-sm font-medium">Reviews I&apos;ve written</span>
              </div>
              <p className="text-sm text-gray-400 mt-2">
                No reviews yet. After your first stay, your reviews will appear here.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
