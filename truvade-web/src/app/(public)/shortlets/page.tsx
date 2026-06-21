"use client";

import React, { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, X, ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { Container } from "@/components/layout";
import { PropertyCard } from "@/components/property";
import { CITIES } from "@/lib/mock-data";
import type { Property } from "@/lib/types";
import { fetchPublicShortlets } from "@/lib/shortlet-utils";

const PER_PAGE = 20;

const cityOptions = [
  { value: "", label: "All Shortlets" },
  ...CITIES.map((c) => ({ value: c.name, label: c.name })),
];

// ── Skeleton grid ─────────────────────────────────────────────────────────────

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i}>
          <div className="aspect-square rounded-xl bg-gray-200 animate-pulse mb-2" />
          <div className="h-4 bg-gray-200 rounded animate-pulse mb-1 w-3/4" />
          <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
        </div>
      ))}
    </div>
  );
}

// ── Filter panel ──────────────────────────────────────────────────────────────

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  priceRange: string;
  setPriceRange: (v: string) => void;
  bedrooms: string;
  setBedrooms: (v: string) => void;
  sortBy: string;
  setSortBy: (v: string) => void;
  resultCount: number;
}

function FilterPanel(props: FilterPanelProps) {
  const { isOpen, onClose } = props;

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  const priceRanges = [
    { value: "", label: "Any" },
    { value: "0-50000", label: "Under ₦50k" },
    { value: "50000-100000", label: "₦50k – 100k" },
    { value: "100000-200000", label: "₦100k – 200k" },
    { value: "200000-999999999", label: "₦200k+" },
  ];
  const bedroomCounts = [
    { value: "", label: "Any" },
    { value: "1", label: "1" },
    { value: "2", label: "2" },
    { value: "3", label: "3" },
    { value: "4", label: "4+" },
  ];
  const sortOpts = [
    { value: "newest", label: "Newest" },
    { value: "price_asc", label: "Price: Low to High" },
    { value: "price_desc", label: "Price: High to Low" },
  ];

  const handleClear = () => {
    props.setPriceRange("");
    props.setBedrooms("");
    props.setSortBy("newest");
  };

  const content = (
    <>
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
        <button onClick={onClose} className="p-1 -ml-1 hover:bg-gray-100 rounded-lg transition-colors">
          <X className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="text-base font-semibold text-gray-900">Filters</h2>
        <button onClick={handleClear} className="text-sm font-medium text-gray-900 underline">
          Clear all
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Price range</h3>
          <div className="flex flex-wrap gap-2">
            {priceRanges.map((opt) => (
              <button
                key={opt.value}
                onClick={() => props.setPriceRange(opt.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  props.priceRange === opt.value
                    ? "bg-[#0B3D2C] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Bedrooms</h3>
          <div className="flex gap-2">
            {bedroomCounts.map((opt) => (
              <button
                key={opt.value}
                onClick={() => props.setBedrooms(opt.value)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  props.bedrooms === opt.value
                    ? "bg-[#0B3D2C] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Sort by</h3>
          <div className="space-y-1">
            {sortOpts.map((opt) => (
              <button
                key={opt.value}
                onClick={() => props.setSortBy(opt.value)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all ${
                  props.sortBy === opt.value
                    ? "bg-[#0B3D2C] text-white font-medium"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="px-6 py-4 border-t border-gray-100 shrink-0">
        <button
          onClick={onClose}
          className="w-full py-3 bg-[#0B3D2C] text-white text-sm font-semibold rounded-xl hover:bg-[#0F5240] transition-colors"
        >
          Show {props.resultCount} result{props.resultCount === 1 ? "" : "s"}
        </button>
      </div>
    </>
  );

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="md:hidden absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[80vh] flex flex-col">
        {content}
      </div>
      <div className="hidden md:flex absolute top-0 right-0 bottom-0 w-[380px] bg-white shadow-2xl flex-col">
        {content}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ShortletsPage() {
  return (
    <Suspense
      fallback={
        <Container>
          <div className="pt-2 pb-12">
            <SkeletonGrid />
          </div>
        </Container>
      }
    >
      <ShortletsContent />
    </Suspense>
  );
}

function ShortletsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showFilters, setShowFilters] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  const city = searchParams.get("city") || "";
  const priceRange = searchParams.get("price") || "";
  const bedrooms = searchParams.get("bedrooms") || "";
  const sortBy = searchParams.get("sort") || "newest";
  const currentPage = Number(searchParams.get("page") || "1");

  const updateFilters = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, val] of Object.entries(updates)) {
        if (val) params.set(key, val);
        else params.delete(key);
      }
      if (!("page" in updates)) params.delete("page");
      const qs = params.toString();
      router.replace(`/shortlets${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [searchParams, router]
  );

  const setCity = (v: string) => updateFilters({ city: v });
  const setPriceRange = (v: string) => updateFilters({ price: v });
  const setBedrooms = (v: string) => updateFilters({ bedrooms: v });
  const setSortBy = (v: string) => updateFilters({ sort: v === "newest" ? "" : v });

  // Fetch from API whenever filters change
  useEffect(() => {
    setLoading(true);

    const filters: Parameters<typeof fetchPublicShortlets>[0] = {
      sort: (sortBy as "newest" | "price_asc" | "price_desc") || "newest",
    };
    if (city) filters.city = city;
    if (bedrooms) {
      const n = parseInt(bedrooms);
      filters.bedrooms = n; // min_bedrooms on backend
    }
    if (priceRange) {
      const [min, max] = priceRange.split("-").map(Number);
      filters.min_price = min;
      filters.max_price = max;
    }

    fetchPublicShortlets(filters)
      .then(setProperties)
      .catch(() => setProperties([]))
      .finally(() => setLoading(false));
  }, [city, priceRange, bedrooms, sortBy]);

  const totalPages = Math.ceil(properties.length / PER_PAGE);
  const paginated = properties.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const goToPage = (page: number) => {
    updateFilters({ page: page > 1 ? String(page) : "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const activeFilterCount = [priceRange, bedrooms, sortBy !== "newest" ? sortBy : ""].filter(
    Boolean
  ).length;

  return (
    <Container>
      <div className="pt-1 md:pt-2 pb-12">
        {/* City pill bar */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className="flex-1 flex items-center gap-2 overflow-x-auto py-1"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {cityOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setCity(opt.value)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  city === opt.value
                    ? "bg-[#0B3D2C] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowFilters(true)}
            className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeFilterCount > 0
                ? "border-2 border-[#0B3D2C] text-[#0B3D2C]"
                : "border border-gray-200 text-gray-700 hover:border-gray-400"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#0B3D2C] text-white text-xs flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        <FilterPanel
          isOpen={showFilters}
          onClose={() => setShowFilters(false)}
          priceRange={priceRange}
          setPriceRange={setPriceRange}
          bedrooms={bedrooms}
          setBedrooms={setBedrooms}
          sortBy={sortBy}
          setSortBy={setSortBy}
          resultCount={properties.length}
        />

        {loading ? (
          <SkeletonGrid />
        ) : paginated.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {paginated.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${
                      page === currentPage ? "bg-[#0B3D2C] text-white" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Search className="w-7 h-7 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No shortlets found</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
              Try adjusting your filters or check back soon as new properties are added.
            </p>
            <button
              onClick={() => router.replace("/shortlets", { scroll: false })}
              className="px-5 py-2.5 border-2 border-[#0B3D2C] text-[#0B3D2C] text-sm font-semibold rounded-full hover:bg-gray-50 transition-colors"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </Container>
  );
}
