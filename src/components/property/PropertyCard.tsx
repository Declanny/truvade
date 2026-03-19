"use client";

import React from "react";
import Link from "next/link";
import { Star, Heart } from "lucide-react";
import { formatCurrency } from "@/lib/types";
import type { Property } from "@/lib/types";

export interface PropertyCardProps {
  property: Property;
  onFavorite?: (propertyId: string) => void;
  isFavorite?: boolean;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property, onFavorite, isFavorite = false }) => {
  return (
    <Link href={`/properties/${property.id}`} className="block">
      <div className="group cursor-pointer">
        <div className="relative aspect-square overflow-hidden rounded-xl mb-2">
          <div
            className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 group-hover:scale-105 transition-transform duration-500 ease-out"
            style={{
              backgroundImage: property.images[0] ? `url(${property.images[0]})` : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {!property.images[0] && (
              <div className="flex items-center justify-center h-full text-gray-400 text-4xl font-semibold">
                TruVade
              </div>
            )}
          </div>

          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onFavorite?.(property.id); }}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center transition-all hover:scale-110"
          >
            <Heart className={`w-5 h-5 transition-all ${isFavorite ? "fill-red-500 text-red-500" : "fill-white/70 text-white/70 hover:fill-red-500/50 hover:text-red-500/50"}`} strokeWidth={2} />
          </button>

          {property.guestFavorite && (
            <div className="absolute top-3 left-3">
              <div className="bg-white px-3 py-1 rounded-full text-xs font-semibold text-gray-900 shadow-sm">
                Guest favorite
              </div>
            </div>
          )}
        </div>

        <div className="space-y-0.5">
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
          {property.hostName && (
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-5 h-5 rounded-full bg-[#0B3D2C] flex items-center justify-center text-white text-[10px] font-medium">
                {property.hostAvatar}
              </div>
              <span className="text-xs text-gray-500">Hosted by {property.hostName.split(" ")[0]}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};
