"use client";

import React, { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Star, Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/types";
import type { Property } from "@/lib/types";

export interface PropertyCardProps {
  property: Property;
  onFavorite?: (propertyId: string) => void;
  isFavorite?: boolean;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property, onFavorite, isFavorite = false }) => {
  const router = useRouter();
  const propertyHref = `/properties/${property.id}`;
  const hostSlug = property.hostName?.toLowerCase().replace(/\s+/g, "-");
  const images = property.images.slice(0, 5);
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);

  const goTo = useCallback((index: number) => {
    setCurrentIndex(Math.max(0, Math.min(index, images.length - 1)));
  }, [images.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };

  const handleTouchEnd = () => {
    if (Math.abs(touchDeltaX.current) > 40) {
      if (touchDeltaX.current < 0) goTo(currentIndex + 1);
      else goTo(currentIndex - 1);
    }
    touchDeltaX.current = 0;
  };

  return (
    <div className="group cursor-pointer">
      {/* Image carousel */}
      <div
        className="relative aspect-square overflow-hidden rounded-xl mb-2"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Images */}
        <div
          className="flex h-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          onClick={() => router.push(propertyHref)}
        >
          {images.map((img, i) => (
            <div
              key={i}
              className="w-full h-full shrink-0 bg-gradient-to-br from-gray-200 to-gray-300"
              style={{
                backgroundImage: `url(${img})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          ))}
        </div>

        {/* Nav arrows — desktop only, show on hover */}
        {images.length > 1 && (
          <>
            {currentIndex > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); goTo(currentIndex - 1); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronLeft className="w-4 h-4 text-gray-700" />
              </button>
            )}
            {currentIndex < images.length - 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); goTo(currentIndex + 1); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronRight className="w-4 h-4 text-gray-700" />
              </button>
            )}
          </>
        )}

        {/* Dots */}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1">
            {images.map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all ${
                  i === currentIndex ? "w-1.5 h-1.5 bg-white" : "w-1 h-1 bg-white/60"
                }`}
              />
            ))}
          </div>
        )}

        {/* Favorite */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onFavorite?.(property.id); }}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center transition-all hover:scale-110"
        >
          <Heart className={`w-5 h-5 transition-all ${isFavorite ? "fill-red-500 text-red-500" : "fill-white/70 text-white/70 hover:fill-red-500/50 hover:text-red-500/50"}`} strokeWidth={2} />
        </button>

        {/* Guest favorite badge */}
        {property.guestFavorite && (
          <div className="absolute top-3 left-3">
            <div className="bg-white px-3 py-1 rounded-full text-xs font-semibold text-gray-900 shadow-sm">
              Guest favorite
            </div>
          </div>
        )}
      </div>

      {/* Text info */}
      <div className="space-y-0.5" onClick={() => router.push(propertyHref)}>
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-[15px] text-gray-900 truncate">
            {property.propertyType} in {property.city}
          </h3>
          {property.rating && (
            <div className="flex items-center gap-1 ml-2 shrink-0">
              <Star className="w-3.5 h-3.5 fill-black text-black" />
              <span className="text-sm text-gray-900">{property.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
        <p className="text-sm text-gray-500 truncate">{property.title}</p>
        <p className="text-[15px] text-gray-900">
          <span className="font-semibold">{formatCurrency(property.basePrice * 2)}</span>
          <span className="font-normal"> for 2 nights</span>
        </p>
      </div>

      {/* Host — links to host profile */}
      {property.hostName && hostSlug && (
        <Link
          href={`/hosts/${hostSlug}`}
          className="flex items-center gap-2 mt-1.5 group/host"
        >
          {property.hostAvatar?.startsWith("http") ? (
            <img
              src={property.hostAvatar}
              alt={property.hostName}
              className="w-7 h-7 rounded-full object-cover"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-[#0B3D2C] flex items-center justify-center text-white text-[10px] font-medium">
              {property.hostAvatar}
            </div>
          )}
          <span className="text-sm text-gray-500 group-hover/host:text-gray-900 group-hover/host:underline transition-colors">
            Hosted by {property.hostName.split(" ")[0]}
          </span>
        </Link>
      )}
    </div>
  );
};
