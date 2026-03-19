"use client";

import React, { Suspense, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SlidersHorizontal, Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Container } from "@/components/layout";
import { Button, Select } from "@/components/ui";
import { PropertyCard } from "@/components/property";
import { mockProperties, CITIES } from "@/lib/mock-data";

const PER_PAGE = 20;

const bedroomOptions = [
  { value: "", label: "Any" },
  { value: "1", label: "1 Bedroom" },
  { value: "2", label: "2 Bedrooms" },
  { value: "3", label: "3 Bedrooms" },
  { value: "4", label: "4+ Bedrooms" },
];

const sortOptions = [
  { value: "newest", label: "Newest First" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Highest Rated" },
];

const priceOptions = [
  { value: "", label: "Any Price" },
  { value: "0-50000", label: "Under \u20A650,000" },
  { value: "50000-100000", label: "\u20A650,000 - \u20A6100,000" },
  { value: "100000-200000", label: "\u20A6100,000 - \u20A6200,000" },
  { value: "200000-999999999", label: "\u20A6200,000+" },
];

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

  const [city, setCity] = useState(searchParams.get("city") || "");
  const [priceRange, setPriceRange] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);

  const currentPage = Number(searchParams.get("page") || "1");

  const cityOptions = [
    { value: "", label: "All Cities" },
    ...CITIES.map((c) => ({ value: c.name, label: c.name })),
  ];

  const filteredProperties = useMemo(() => {
    let results = [...mockProperties].filter((p) => p.status === "ACTIVE");

    if (city) {
      results = results.filter(
        (p) => p.city.toLowerCase() === city.toLowerCase()
      );
    }

    if (priceRange) {
      const [min, max] = priceRange.split("-").map(Number);
      results = results.filter((p) => p.basePrice >= min && p.basePrice <= max);
    }

    if (bedrooms) {
      const bedroomCount = parseInt(bedrooms);
      if (bedroomCount === 4) {
        results = results.filter((p) => p.bedrooms >= 4);
      } else {
        results = results.filter((p) => p.bedrooms === bedroomCount);
      }
    }

    switch (sortBy) {
      case "price_asc":
        results.sort((a, b) => a.basePrice - b.basePrice);
        break;
      case "price_desc":
        results.sort((a, b) => b.basePrice - a.basePrice);
        break;
      case "rating":
        results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "newest":
      default:
        results.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
    }

    return results;
  }, [city, priceRange, bedrooms, sortBy]);

  const totalPages = Math.ceil(filteredProperties.length / PER_PAGE);
  const paginatedProperties = filteredProperties.slice(
    (currentPage - 1) * PER_PAGE,
    currentPage * PER_PAGE
  );

  const goToPage = (page: number) => {
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    router.push(`/shortlets${qs ? `?${qs}` : ""}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearFilters = () => {
    setCity("");
    setPriceRange("");
    setBedrooms("");
    setSortBy("newest");
  };

  const hasActiveFilters = city || priceRange || bedrooms;

  return (
    <Container>
      <div className="py-6 md:py-10">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {city ? `Shortlets in ${city}` : "All Shortlets"}
            </h1>
            <p className="mt-1 text-gray-600">
              {filteredProperties.length} shortlet{filteredProperties.length === 1 ? "" : "s"} available
            </p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-[#0B3D2C]" />}
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mb-8">
            <div className="p-4 bg-gray-50 rounded-xl space-y-3 md:space-y-0 md:flex md:items-end md:gap-3">
              <Select
                label="City"
                options={cityOptions}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="All Cities"
                fullWidth
              />
              <Select
                label="Price Range"
                options={priceOptions}
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                placeholder="Any Price"
                fullWidth
              />
              <Select
                label="Bedrooms"
                options={bedroomOptions}
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
                placeholder="Bedrooms"
                fullWidth
              />
              <Select
                label="Sort by"
                options={sortOptions}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                fullWidth
              />
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" fullWidth onClick={clearFilters}>
                  Clear All Filters
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Results Grid */}
        {paginatedProperties.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {paginatedProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                      page === currentPage
                        ? "bg-[#0B3D2C] text-white"
                        : "text-gray-700 hover:bg-gray-50 border border-gray-200"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Page info */}
            {totalPages > 1 && (
              <p className="text-center text-sm text-gray-500 mt-3">
                Showing {(currentPage - 1) * PER_PAGE + 1}–{Math.min(currentPage * PER_PAGE, filteredProperties.length)} of {filteredProperties.length} shortlets
              </p>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No shortlets found
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              We could not find any shortlets matching your filters. Try
              adjusting your search criteria.
            </p>
            <Button variant="outline" onClick={clearFilters}>
              Clear All Filters
            </Button>
          </div>
        )}
      </div>
    </Container>
  );
}
