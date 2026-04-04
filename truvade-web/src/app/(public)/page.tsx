"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { PropertyCard } from "@/components/property";
import { LocationCard } from "@/components/ui";
import { mockProperties, CITIES } from "@/lib/mock-data";
import type { Property } from "@/lib/types";

interface CarouselSectionProps {
  title: string;
  properties: Property[];
  href?: string;
}

function CarouselSection({ title, properties, href }: CarouselSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 260;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  if (properties.length === 0) return null;

  return (
    <section className="py-6">
      <div className="max-w-[1760px] mx-auto px-3 sm:px-5 lg:px-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[22px] font-semibold text-gray-900">{title}</h2>
          <div className="flex items-center gap-2">
            {href && (
              <Link href={href} className="text-sm font-semibold text-gray-900 underline hover:text-gray-600 mr-2">
                Show all
              </Link>
            )}
            <button
              onClick={() => scroll("left")}
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:shadow-md transition-shadow disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4 text-gray-700" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:shadow-md transition-shadow disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4 text-gray-700" />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {properties.map((property) => (
            <div key={property.id} className="min-w-[200px] w-[200px] md:min-w-[240px] md:w-[240px] shrink-0">
              <PropertyCard property={property} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Group properties by city
function getPropertiesByCity(city: string) {
  return mockProperties.filter((p) => p.city === city);
}

function LocationCardsSection() {
  // Show only first 8 locations (2 rows of 4)
  const locations = CITIES.slice(0, 8);

  return (
    <section className="py-6">
      <div className="max-w-[1760px] mx-auto px-3 sm:px-5 lg:px-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[22px] font-semibold text-gray-900">Top locations</h2>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-4 sm:gap-6">
          {locations.map((city) => (
            <LocationCard
              key={city.name}
              name={city.name}
              image={city.image}
              href={`/shortlets?city=${encodeURIComponent(city.name)}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function HeroBanner() {
  const router = useRouter();
  const [where, setWhere] = useState("");
  const [space, setSpace] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (where.trim()) params.set("city", where.trim());
    if (space.trim()) params.set("q", space.trim());
    router.push(`/shortlets${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <section className="hidden lg:block -mt-[68px] relative -top-[2px]">
      <div className="relative overflow-hidden h-[390px]">
        {/* Background image */}
        <Image
          src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1920&h=400&fit=crop&crop=center&q=80"
          alt="Modern shortlet interior"
          fill
          className="object-cover"
          priority
        />
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/60" />

        {/* Content */}
        <div className="relative h-full flex flex-col items-center justify-center px-8 pt-[68px]">
          <h1 className="text-4xl md:text-5xl font-bold text-white text-center max-w-3xl leading-tight">
            Stay Different. Stay Anywhere.
          </h1>

          {/* Search bar */}
          <form
            onSubmit={handleSearch}
            className="mt-10 flex items-center bg-white rounded-full shadow-xl px-3 py-3 w-full max-w-2xl"
          >
            {/* Where */}
            <div className="flex-1 px-5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Where</label>
              <input
                type="text"
                value={where}
                onChange={(e) => setWhere(e.target.value)}
                placeholder="Search Destination"
                className="w-full text-base text-gray-900 placeholder:text-gray-400 outline-none bg-transparent mt-0.5"
              />
            </div>

            {/* Divider */}
            <div className="h-12 w-px bg-gray-200 shrink-0" />

            {/* Space */}
            <div className="flex-1 px-5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Space</label>
              <input
                type="text"
                value={space}
                onChange={(e) => setSpace(e.target.value)}
                placeholder="Search Accommodation"
                className="w-full text-base text-gray-900 placeholder:text-gray-400 outline-none bg-transparent mt-0.5"
              />
            </div>

            {/* Search button */}
            <button
              type="submit"
              className="shrink-0 flex items-center gap-2 bg-[#0B3D2C] hover:bg-[#0B3D2C]/90 text-white text-base font-semibold px-7 py-3.5 rounded-full transition-colors"
            >
              <Search className="w-4 h-4" />
              Search
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const lagosProperties = mockProperties.filter((p) => p.state === "Lagos");
  const lekkiProperties = getPropertiesByCity("Lekki");
  const victoriaIslandProperties = getPropertiesByCity("Victoria Island");
  const abujaProperties = getPropertiesByCity("Abuja");
  const portHarcourtProperties = getPropertiesByCity("Port Harcourt");

  return (
    <div className="pb-8">
      <HeroBanner />
      <LocationCardsSection />
      <CarouselSection
        title="Popular homes in Lagos"
        properties={lagosProperties}
        href="/shortlets?city=Lagos"
      />
      <CarouselSection
        title="Available in Lekki this weekend"
        properties={lekkiProperties}
        href="/shortlets?city=Lekki"
      />
      <CarouselSection
        title="Stays in Victoria Island"
        properties={victoriaIslandProperties}
        href="/shortlets?city=Victoria+Island"
      />
      <CarouselSection
        title="Stays in Abuja"
        properties={abujaProperties}
        href="/shortlets?city=Abuja"
      />
      <CarouselSection
        title="Explore Port Harcourt"
        properties={portHarcourtProperties}
        href="/shortlets?city=Port+Harcourt"
      />
    </div>
  );
}
