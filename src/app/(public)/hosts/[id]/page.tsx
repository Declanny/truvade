"use client";

import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Star, ShieldCheck, MapPin, Calendar, MessageSquare, Clock, ChevronRight } from "lucide-react";
import { Avatar, Button } from "@/components/ui";
import { Container } from "@/components/layout";
import { mockProperties } from "@/lib/mock-data";
import Link from "next/link";

// Mock host data keyed by slug
const mockHosts: Record<string, {
  id: string;
  name: string;
  initials: string;
  verified: boolean;
  rating: number;
  reviewCount: number;
  yearsHosting: number;
  responseRate: string;
  responseTime: string;
  bio: string;
  location: string;
  joinedDate: string;
  coHosts: { name: string; initials: string }[];
  propertyIds: string[];
}> = {
  "amara-okafor": {
    id: "amara-okafor",
    name: "Amara Okafor",
    initials: "AO",
    verified: true,
    rating: 4.9,
    reviewCount: 142,
    yearsHosting: 3,
    responseRate: "98%",
    responseTime: "within an hour",
    bio: "Hi, I'm Amara! I've been hosting in Lagos for over 3 years. I love helping guests discover the best of Nigerian hospitality. My properties are carefully maintained and located in prime areas across Victoria Island and Lekki.",
    location: "Lagos, Nigeria",
    joinedDate: "January 2024",
    coHosts: [
      { name: "Chidi Eze", initials: "CE" },
      { name: "Ngozi Adamu", initials: "NA" },
    ],
    propertyIds: ["prop-1", "prop-2"],
  },
  "chidi-eze": {
    id: "chidi-eze",
    name: "Chidi Eze",
    initials: "CE",
    verified: true,
    rating: 4.95,
    reviewCount: 87,
    yearsHosting: 5,
    responseRate: "100%",
    responseTime: "within an hour",
    bio: "I'm a professional host managing premium shortlet properties in Ikoyi and surrounding areas. Every stay is carefully curated with attention to detail, cleanliness, and comfort.",
    location: "Lagos, Nigeria",
    joinedDate: "March 2023",
    coHosts: [
      { name: "Amara Okafor", initials: "AO" },
    ],
    propertyIds: ["prop-3"],
  },
};

// Mock reviews
const mockReviews = [
  { guest: "Fatima B.", initials: "FB", rating: 5, date: "February 2026", text: "Amazing host! Very responsive and the property was exactly as described. Would definitely book again." },
  { guest: "Kola A.", initials: "KA", rating: 5, date: "January 2026", text: "Amara went above and beyond. She recommended great restaurants and arranged airport pickup. The apartment was spotless." },
  { guest: "Emeka O.", initials: "EO", rating: 4, date: "December 2025", text: "Great communication and a beautiful property. Minor issue with hot water but was fixed within an hour." },
  { guest: "Adaeze N.", initials: "AN", rating: 5, date: "November 2025", text: "One of the best stays I've had. The location is perfect and Amara is an excellent host." },
];

export default function HostProfilePage() {
  const { id } = useParams();
  const host = mockHosts[id as string];

  if (!host) {
    return (
      <Container size="md">
        <div className="py-20 text-center">
          <p className="text-gray-500 text-lg">Host not found</p>
          <Link href="/" className="text-sm text-gray-900 underline mt-2 inline-block">Back to home</Link>
        </div>
      </Container>
    );
  }

  const hostProperties = mockProperties.filter((p) => host.propertyIds.includes(p.id));

  return (
    <Container size="lg">
      <div className="py-8 sm:py-12">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">

          {/* Left — Host card (sticky on desktop) */}
          <div className="lg:w-[320px] flex-shrink-0">
            <div className="lg:sticky lg:top-[140px]">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm"
              >
                <Avatar initials={host.initials} name={host.name} size="xl" verified={host.verified} className="mx-auto" />
                <h1 className="text-2xl font-bold text-gray-900 mt-4">{host.name}</h1>
                {host.verified && (
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <ShieldCheck className="w-4 h-4 text-[#0B3D2C]" />
                    <span className="text-sm text-gray-500">Verified host</span>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-gray-100">
                  <div>
                    <p className="text-xl font-bold text-gray-900">{host.reviewCount}</p>
                    <p className="text-xs text-gray-500">Reviews</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-gray-900 flex items-center justify-center gap-0.5">
                      {host.rating.toFixed(1)}
                      <Star className="w-3.5 h-3.5 fill-current" />
                    </p>
                    <p className="text-xs text-gray-500">Rating</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-gray-900">{host.yearsHosting}</p>
                    <p className="text-xs text-gray-500">Years hosting</p>
                  </div>
                </div>
              </motion.div>

              {/* Quick info */}
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {host.location}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  Joined {host.joinedDate}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Clock className="w-4 h-4 text-gray-400" />
                  Responds {host.responseTime}
                </div>
              </div>
            </div>
          </div>

          {/* Right — Content */}
          <div className="flex-1 min-w-0">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>

              {/* About */}
              <section className="mb-10">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">About {host.name.split(" ")[0]}</h2>
                <p className="text-gray-600 leading-relaxed">{host.bio}</p>
              </section>

              {/* Co-hosts */}
              {host.coHosts.length > 0 && (
                <section className="mb-10 pb-10 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Co-hosts</h2>
                  <div className="flex items-center gap-4">
                    {host.coHosts.map((co) => (
                      <div key={co.name} className="flex items-center gap-2.5">
                        <Avatar initials={co.initials} name={co.name} size="sm" />
                        <span className="text-sm text-gray-700">{co.name}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Host details */}
              <section className="mb-10 pb-10 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Host details</h2>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>Response rate: {host.responseRate}</p>
                  <p>Responds {host.responseTime}</p>
                </div>
                <Link href="/account/guest/messages" className="inline-block mt-5">
                  <Button variant="outline" size="lg" leftIcon={<MessageSquare className="w-4 h-4" />}>
                    Message {host.name.split(" ")[0]}
                  </Button>
                </Link>
              </section>

              {/* Listings */}
              {hostProperties.length > 0 && (
                <section className="mb-10 pb-10 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    {host.name.split(" ")[0]}&apos;s listings
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {hostProperties.map((prop) => (
                      <Link key={prop.id} href={`/properties/${prop.id}`} className="group">
                        <div className="flex gap-4 p-3 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all">
                          <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                            <div
                              className="w-full h-full bg-gray-200 group-hover:scale-105 transition-transform"
                              style={{ backgroundImage: `url(${prop.images[0]})`, backgroundSize: "cover", backgroundPosition: "center" }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-gray-900 line-clamp-1">{prop.title}</h3>
                            <p className="text-xs text-gray-500 mt-0.5">{prop.city}</p>
                            {prop.rating && (
                              <div className="flex items-center gap-1 mt-1.5">
                                <Star className="w-3 h-3 fill-black text-black" />
                                <span className="text-xs text-gray-900">{prop.rating.toFixed(1)}</span>
                                <span className="text-xs text-gray-400">({prop.reviewCount})</span>
                              </div>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400 self-center" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Reviews */}
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <Star className="w-5 h-5 fill-black text-black" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    {host.reviewCount} reviews
                  </h2>
                </div>
                <div className="space-y-6">
                  {mockReviews.map((review, i) => (
                    <div key={i} className="pb-6 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar initials={review.initials} name={review.guest} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{review.guest}</p>
                          <p className="text-xs text-gray-500">{review.date}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{review.text}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Safety note */}
              <div className="mt-10 flex items-start gap-2 text-xs text-gray-500">
                <ShieldCheck className="w-4 h-4 text-[#0B3D2C] flex-shrink-0 mt-0.5" />
                <p>To help protect your payment, always use Truvade to send money and communicate with hosts.</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </Container>
  );
}
