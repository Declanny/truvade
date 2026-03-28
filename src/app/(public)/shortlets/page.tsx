"use client";

import React, { Suspense, useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, X, ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { Container } from "@/components/layout";
import { PropertyCard } from "@/components/property";
import { mockProperties, CITIES } from "@/lib/mock-data";

const PER_PAGE = 20;

const cityOptions = [
  { value: "", label: "All Shortlets" },
  ...CITIES.map((c) => ({ value: c.name, label: c.name })),
];

// ─── Filter Sidebar / Bottom Sheet ───────────────────────
function FilterPanel({
  isOpen,
  onClose,
  priceRange,
  setPriceRange,
  bedrooms,
  setBedrooms,
  sortBy,
  setSortBy,
  resultCount,
}: {
  isOpen: boolean;
  onClose: () => void;
  priceRange: string;
  setPriceRange: (v: string) => void;
  bedrooms: string;
  setBedrooms: (v: string) => void;
  sortBy: string;
  setSortBy: (v: string) => void;
  resultCount: number;
}) {
  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  const priceRanges = [
    { value: "", label: "Any" },
    { value: "0-50000", label: "Under \u20A650k" },
    { value: "50000-100000", label: "\u20A650k – 100k" },
    { value: "100000-200000", label: "\u20A6100k – 200k" },
    { value: "200000-999999999", label: "\u20A6200k+" },
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
    { value: "rating", label: "Top Rated" },
  ];

  const handleClear = () => {
    setPriceRange("");
    setBedrooms("");
    setSortBy("newest");
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Mobile: bottom sheet */}
      <div className="md:hidden absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[80vh] flex flex-col">
        <PanelContent
          priceRanges={priceRanges}
          bedroomCounts={bedroomCounts}
          sortOpts={sortOpts}
          priceRange={priceRange}
          setPriceRange={setPriceRange}
          bedrooms={bedrooms}
          setBedrooms={setBedrooms}
          sortBy={sortBy}
          setSortBy={setSortBy}
          resultCount={resultCount}
          onClose={onClose}
          onClear={handleClear}
        />
      </div>

      {/* Desktop: right sidebar */}
      <div className="hidden md:flex absolute top-0 right-0 bottom-0 w-[380px] bg-white shadow-2xl flex-col">
        <PanelContent
          priceRanges={priceRanges}
          bedroomCounts={bedroomCounts}
          sortOpts={sortOpts}
          priceRange={priceRange}
          setPriceRange={setPriceRange}
          bedrooms={bedrooms}
          setBedrooms={setBedrooms}
          sortBy={sortBy}
          setSortBy={setSortBy}
          resultCount={resultCount}
          onClose={onClose}
          onClear={handleClear}
        />
      </div>
    </div>
  );
}

function PanelContent({
  priceRanges,
  bedroomCounts,
  sortOpts,
  priceRange,
  setPriceRange,
  bedrooms,
  setBedrooms,
  sortBy,
  setSortBy,
  resultCount,
  onClose,
  onClear,
}: {
  priceRanges: { value: string; label: string }[];
  bedroomCounts: { value: string; label: string }[];
  sortOpts: { value: string; label: string }[];
  priceRange: string;
  setPriceRange: (v: string) => void;
  bedrooms: string;
  setBedrooms: (v: string) => void;
  sortBy: string;
  setSortBy: (v: string) => void;
  resultCount: number;
  onClose: () => void;
  onClear: () => void;
}) {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
        <button onClick={onClose} className="p-1 -ml-1 hover:bg-gray-100 rounded-lg transition-colors">
          <X className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="text-base font-semibold text-gray-900">Filters</h2>
        <button onClick={onClear} className="text-sm font-medium text-gray-900 underline">
          Clear all
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
        {/* Price range */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Price range</h3>
          <div className="flex flex-wrap gap-2">
            {priceRanges.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPriceRange(opt.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  priceRange === opt.value
                    ? "bg-[#0B3D2C] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bedrooms */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Bedrooms</h3>
          <div className="flex gap-2">
            {bedroomCounts.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setBedrooms(opt.value)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  bedrooms === opt.value
                    ? "bg-[#0B3D2C] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sort */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Sort by</h3>
          <div className="space-y-1">
            {sortOpts.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSortBy(opt.value)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all ${
                  sortBy === opt.value
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

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-100 shrink-0">
        <button
          onClick={onClose}
          className="w-full py-3 bg-[#0B3D2C] text-white text-sm font-semibold rounded-xl hover:bg-[#0F5240] transition-colors"
        >
          Show {resultCount} result{resultCount === 1 ? "" : "s"}
        </button>
      </div>
    </>
  );
}

// ─── Main Page ───────────────────────────────────────────
export default function ShortletsPage() {
  return (
    <Suspense fallback={<Container><div className="flex justify-center py-12"><div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" /></div></Container>}>
      <ShortletsContent />
    </Suspense>
  );
}

function ShortletsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showFilters, setShowFilters] = useState(false);

  // All filter state from URL — single source of truth
  const city = searchParams.get("city") || "";
  const priceRange = searchParams.get("price") || "";
  const bedrooms = searchParams.get("bedrooms") || "";
  const sortBy = searchParams.get("sort") || "newest";
  const currentPage = Number(searchParams.get("page") || "1");

  // Update URL when any filter changes
  const updateFilters = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, val] of Object.entries(updates)) {
      if (val) {
        params.set(key, val);
      } else {
        params.delete(key);
      }
    }
    // Reset page when filters change
    if (!("page" in updates)) params.delete("page");
    const qs = params.toString();
    router.replace(`/shortlets${qs ? `?${qs}` : ""}`, { scroll: false });
  };

  const setCity = (v: string) => updateFilters({ city: v });
  const setPriceRange = (v: string) => updateFilters({ price: v });
  const setBedrooms = (v: string) => updateFilters({ bedrooms: v });
  const setSortBy = (v: string) => updateFilters({ sort: v === "newest" ? "" : v });

  const filteredProperties = useMemo(() => {
    let results = [...mockProperties].filter((p) => p.status === "ACTIVE");

    if (city) {
      results = results.filter((p) => p.city.toLowerCase() === city.toLowerCase());
    }
    if (priceRange) {
      const [min, max] = priceRange.split("-").map(Number);
      results = results.filter((p) => p.basePrice >= min && p.basePrice <= max);
    }
    if (bedrooms) {
      const count = parseInt(bedrooms);
      results = results.filter((p) => count === 4 ? p.bedrooms >= 4 : p.bedrooms === count);
    }

    switch (sortBy) {
      case "price_asc": results.sort((a, b) => a.basePrice - b.basePrice); break;
      case "price_desc": results.sort((a, b) => b.basePrice - a.basePrice); break;
      case "rating": results.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
      default: results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return results;
  }, [city, priceRange, bedrooms, sortBy]);

  const totalPages = Math.ceil(filteredProperties.length / PER_PAGE);
  const paginatedProperties = filteredProperties.slice(
    (currentPage - 1) * PER_PAGE,
    currentPage * PER_PAGE
  );

  const goToPage = (page: number) => {
    updateFilters({ page: page > 1 ? String(page) : "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearAllFilters = () => {
    router.replace("/shortlets", { scroll: false });
  };

  const activeFilterCount = [priceRange, bedrooms, sortBy !== "newest" ? sortBy : ""].filter(Boolean).length;

  return (
    <Container>
      <div className="pt-1 md:pt-2 pb-12">
        {/* City pill bar + filter button */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className="flex-1 flex items-center gap-2 overflow-x-auto py-1"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {cityOptions.map((opt) => (
              <button
                type="button"
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

          {/* Filter button */}
          <button
            type="button"
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

        {/* Filter panel */}
        <FilterPanel
          isOpen={showFilters}
          onClose={() => setShowFilters(false)}
          priceRange={priceRange}
          setPriceRange={setPriceRange}
          bedrooms={bedrooms}
          setBedrooms={setBedrooms}
          sortBy={sortBy}
          setSortBy={setSortBy}
          resultCount={filteredProperties.length}
        />

        {/* Results Grid */}
        {paginatedProperties.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {paginatedProperties.map((property) => (
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
              Try adjusting your filters to see more results.
            </p>
            <button
              onClick={clearAllFilters}
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
