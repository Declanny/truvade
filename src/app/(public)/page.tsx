"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
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
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 260;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <section className="py-6">
      <div className="max-w-[1760px] mx-auto px-3 sm:px-5 lg:px-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[22px] font-semibold text-gray-900">Top locations</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll("left")}
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:shadow-md transition-shadow"
            >
              <ChevronLeft className="w-4 h-4 text-gray-700" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:shadow-md transition-shadow"
            >
              <ChevronRight className="w-4 h-4 text-gray-700" />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-5 sm:gap-6 overflow-x-auto scrollbar-hide pb-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {CITIES.map((city) => (
            <LocationCard
              key={city.name}
              name={city.name}
              image={city.image}
              href={`/properties?city=${encodeURIComponent(city.name)}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const lagosProperties = mockProperties.filter(
    (p) => p.state === "Lagos"
  );
  const lekkiProperties = getPropertiesByCity("Lekki");
  const ikejaProperties = getPropertiesByCity("Ikeja");
  const abujaProperties = getPropertiesByCity("Abuja");
  const victoriaIslandProperties = getPropertiesByCity("Victoria Island");
  const portHarcourtProperties = getPropertiesByCity("Port Harcourt");
  const ikoyiProperties = getPropertiesByCity("Ikoyi");
  const ibadanProperties = getPropertiesByCity("Ibadan");
  const ajahProperties = getPropertiesByCity("Ajah");
  const surulereProperties = getPropertiesByCity("Surulere");
  const yabaProperties = getPropertiesByCity("Yaba");
  const enuguProperties = getPropertiesByCity("Enugu");

  return (
    <div className="bg-white pt-4 pb-8">
      <LocationCardsSection />
      <CarouselSection
        title="Popular homes in Lagos"
        properties={lagosProperties}
        href="/properties?city=Lagos"
      />
      <CarouselSection
        title="Available in Lekki this weekend"
        properties={lekkiProperties}
        href="/properties?city=Lekki"
      />
      <CarouselSection
        title="Stays in Victoria Island"
        properties={victoriaIslandProperties}
        href="/properties?city=Victoria+Island"
      />
      <CarouselSection
        title="Homes in Ikeja"
        properties={ikejaProperties}
        href="/properties?city=Ikeja"
      />
      <CarouselSection
        title="Stays in Abuja"
        properties={abujaProperties}
        href="/properties?city=Abuja"
      />
      <CarouselSection
        title="Explore Port Harcourt"
        properties={portHarcourtProperties}
        href="/properties?city=Port+Harcourt"
      />
      <CarouselSection
        title="Stays in Ikoyi"
        properties={ikoyiProperties}
        href="/properties?city=Ikoyi"
      />
      <CarouselSection
        title="Explore Ibadan"
        properties={ibadanProperties}
        href="/properties?city=Ibadan"
      />
      <CarouselSection
        title="Stays in Ajah"
        properties={ajahProperties}
        href="/properties?city=Ajah"
      />
      <CarouselSection
        title="Homes in Surulere"
        properties={surulereProperties}
        href="/properties?city=Surulere"
      />
      <CarouselSection
        title="Explore Yaba"
        properties={yabaProperties}
        href="/properties?city=Yaba"
      />
      <CarouselSection
        title="Stays in Enugu"
        properties={enuguProperties}
        href="/properties?city=Enugu"
      />
    </div>
  );
}
