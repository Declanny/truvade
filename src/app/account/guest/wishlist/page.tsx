"use client";

import { useState, useRef, useCallback } from "react";
import { Heart, Clock, LayoutGrid, List, Map, Star, MapPin, BedDouble, Bath, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { PropertyCard } from "@/components/property/PropertyCard";
import { PropertyMap } from "@/components/property/PropertyMap";
import { mockProperties } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/types";
import type { Property } from "@/lib/types";
import Link from "next/link";

const recentlyViewed = mockProperties.slice(10, 18);
const wishlistProperties = mockProperties.slice(0, 6);

type Tab = "recent" | "wishlist";
type ViewMode = "grid" | "list" | "map";

// ─── Image Carousel (reusable for list cards) ────────────
function ImageCarousel({ images, guestFavorite, isFavorite, onFavorite, className }: {
  images: string[];
  guestFavorite?: boolean;
  isFavorite: boolean;
  onFavorite: () => void;
  className?: string;
}) {
  const [idx, setIdx] = useState(0);
  const touchX = useRef(0);
  const deltaX = useRef(0);
  const slides = images.slice(0, 5);

  const go = useCallback((i: number) => setIdx(Math.max(0, Math.min(i, slides.length - 1))), [slides.length]);

  return (
    <div
      className={`relative overflow-hidden rounded-lg ${className}`}
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; deltaX.current = 0; }}
      onTouchMove={(e) => { deltaX.current = e.touches[0].clientX - touchX.current; }}
      onTouchEnd={() => { if (Math.abs(deltaX.current) > 40) { deltaX.current < 0 ? go(idx + 1) : go(idx - 1); } }}
    >
      <div className="flex h-full transition-transform duration-300 ease-out" style={{ transform: `translateX(-${idx * 100}%)` }}>
        {slides.map((img, i) => (
          <div key={i} className="w-full h-full shrink-0 bg-gray-200" style={{ backgroundImage: `url(${img})`, backgroundSize: "cover", backgroundPosition: "center" }} />
        ))}
      </div>

      {/* Arrows — desktop hover */}
      {slides.length > 1 && (
        <>
          {idx > 0 && (
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); go(idx - 1); }}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronLeft className="w-3.5 h-3.5 text-gray-700" />
            </button>
          )}
          {idx < slides.length - 1 && (
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); go(idx + 1); }}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
              <ChevronRight className="w-3.5 h-3.5 text-gray-700" />
            </button>
          )}
        </>
      )}

      {/* Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex items-center gap-1">
          {slides.map((_, i) => (
            <div key={i} className={`rounded-full transition-all ${i === idx ? "w-1.5 h-1.5 bg-white" : "w-1 h-1 bg-white/60"}`} />
          ))}
        </div>
      )}

      {/* Favorite */}
      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onFavorite(); }}
        className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center">
        <Heart className={`w-4 h-4 ${isFavorite ? "fill-red-500 text-red-500" : "fill-white/70 text-white/70"}`} strokeWidth={2} />
      </button>

      {/* Guest favorite */}
      {guestFavorite && (
        <div className="absolute top-2 left-2">
          <div className="bg-white px-2 py-0.5 rounded-full text-[10px] font-semibold text-gray-900 shadow-sm">Guest favorite</div>
        </div>
      )}
    </div>
  );
}

// ─── List Card ───────────────────────────────────────────
function PropertyListCard({ property, isFavorite, onFavorite, compact }: {
  property: Property; isFavorite: boolean; onFavorite: (id: string) => void; compact?: boolean;
}) {
  const hostSlug = property.hostName?.toLowerCase().replace(/\s+/g, "-");
  const imgSize = compact ? "w-[160px]" : "w-[200px] sm:w-[280px]";

  return (
    <Link href={`/properties/${property.id}`} className="block group">
      <div className="flex gap-4 sm:gap-5 p-2.5 sm:p-3 border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all">
        {/* Image carousel */}
        <ImageCarousel
          images={property.images}
          guestFavorite={property.guestFavorite}
          isFavorite={isFavorite}
          onFavorite={() => onFavorite(property.id)}
          className={`shrink-0 ${imgSize} aspect-[4/3]`}
        />

        {/* Details */}
        <div className="flex-1 min-w-0 py-0.5 flex flex-col">
          {compact ? (
            <>
              <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">{property.title}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{property.city}</p>
              <div className="flex items-center justify-between mt-auto pt-1.5">
                <p className="text-sm text-gray-900">
                  <span className="font-semibold">{formatCurrency(property.basePrice)}</span>
                  <span className="text-xs text-gray-500"> / night</span>
                </p>
                {property.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-black text-black" />
                    <span className="text-xs font-medium text-gray-900">{property.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900">{property.title}</h3>
                {property.rating && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Star className="w-3.5 h-3.5 fill-black text-black" />
                    <span className="text-sm font-medium text-gray-900">{property.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span>{property.address}, {property.city}</span>
              </div>

              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" /> {property.bedrooms} bed{property.bedrooms !== 1 ? "s" : ""}</span>
                <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" /> {property.bathrooms} bath{property.bathrooms !== 1 ? "s" : ""}</span>
                <span className="hidden sm:flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {property.maxGuests}</span>
              </div>

              <div className="flex items-center justify-between mt-auto pt-2">
                <p className="text-gray-900">
                  <span className="font-semibold">{formatCurrency(property.basePrice)}</span>
                  <span className="text-sm text-gray-500 font-normal"> / night</span>
                </p>
                {property.hostName && hostSlug && (
                  <div className="flex items-center gap-1.5">
                    {property.hostAvatar?.startsWith("http") ? (
                      <img src={property.hostAvatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-[#0B3D2C] flex items-center justify-center text-white text-[8px] font-medium">{property.hostAvatar}</div>
                    )}
                    <span className="text-xs text-gray-500 hidden sm:inline">{property.hostName.split(" ")[0]}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Map View ────────────────────────────────────────────
function PropertiesMapView({ properties, favorites, onFavorite }: {
  properties: Property[]; favorites: Set<string>; onFavorite: (id: string) => void;
}) {
  const avgLat = properties.reduce((sum, p) => sum + (p.lat || 6.45), 0) / properties.length;
  const avgLng = properties.reduce((sum, p) => sum + (p.lng || 3.4), 0) / properties.length;

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-auto lg:h-[calc(100vh-180px)]">
      {/* Map */}
      <div className="h-[300px] lg:h-full lg:flex-1 rounded-xl overflow-hidden">
        <PropertyMap lat={avgLat} lng={avgLng} city="" state="" />
      </div>

      {/* Scrollable list */}
      <div className="lg:w-[420px] lg:overflow-y-auto space-y-3 lg:pr-1" style={{ scrollbarWidth: "thin" }}>
        {properties.map((property) => (
          <PropertyListCard
            key={property.id}
            property={property}
            isFavorite={favorites.has(property.id)}
            onFavorite={onFavorite}
            compact
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────
export default function GuestWishlistPage() {
  const [activeTab, setActiveTab] = useState<Tab>("recent");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [favorites, setFavorites] = useState<Set<string>>(
    new Set(wishlistProperties.map((p) => p.id))
  );

  const handleFavorite = (propertyId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(propertyId)) next.delete(propertyId);
      else next.add(propertyId);
      return next;
    });
  };

  const visibleWishlist = wishlistProperties.filter((p) => favorites.has(p.id));
  const properties = activeTab === "recent" ? recentlyViewed : visibleWishlist;
  const isEmpty = properties.length === 0;

  return (
    <div>
      {/* Header: tabs + view toggle */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("recent")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === "recent" ? "bg-[#0B3D2C] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Recently Viewed
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("wishlist")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === "wishlist" ? "bg-[#0B3D2C] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Wishlist
            {visibleWishlist.length > 0 && (
              <span className="ml-1.5 text-xs opacity-70">({visibleWishlist.length})</span>
            )}
          </button>
        </div>

        {!isEmpty && (
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            {([
              { mode: "grid" as ViewMode, icon: LayoutGrid, title: "Grid" },
              { mode: "list" as ViewMode, icon: List, title: "List" },
              { mode: "map" as ViewMode, icon: Map, title: "Map" },
            ]).map(({ mode, icon: Icon, title }) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`p-2 transition-colors ${viewMode === mode ? "bg-[#0B3D2C] text-white" : "text-gray-500 hover:bg-gray-50"}`}
                title={title}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      {isEmpty ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
            {activeTab === "wishlist" ? <Heart className="w-7 h-7 text-gray-400" /> : <Clock className="w-7 h-7 text-gray-400" />}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {activeTab === "wishlist" ? "No saved properties" : "No recently viewed"}
          </h3>
          <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
            {activeTab === "wishlist" ? "Tap the heart icon on any property to save it here." : "Properties you view will appear here."}
          </p>
          <Link href="/shortlets" className="px-5 py-2.5 border-2 border-[#0B3D2C] text-[#0B3D2C] text-sm font-semibold rounded-full hover:bg-gray-50 transition-colors inline-block">
            Browse shortlets
          </Link>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} isFavorite={favorites.has(property.id)} onFavorite={handleFavorite} />
          ))}
        </div>
      ) : viewMode === "list" ? (
        <div className="space-y-3">
          {properties.map((property) => (
            <PropertyListCard key={property.id} property={property} isFavorite={favorites.has(property.id)} onFavorite={handleFavorite} />
          ))}
        </div>
      ) : (
        <PropertiesMapView properties={properties} favorites={favorites} onFavorite={handleFavorite} />
      )}
    </div>
  );
}
