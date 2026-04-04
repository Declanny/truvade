"use client";

import React, { Suspense, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, Search, X } from "lucide-react";
import { Container } from "@/components/layout";
import { Button, Input, Select } from "@/components/ui";
import { PropertyCard } from "@/components/property";
import { mockProperties, CITIES } from "@/lib/mock-data";
import type { Property } from "@/lib/types";

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

export default function PropertiesPage() {
  return (
    <Suspense fallback={<Container><div className="flex justify-center py-12"><div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" /></div></Container>}>
      <PropertiesContent />
    </Suspense>
  );
}

function PropertiesContent() {
  const searchParams = useSearchParams();

  const [city, setCity] = useState(searchParams.get("city") || "");
  const [priceRange, setPriceRange] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);

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
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {city ? `Shortlets in ${city}` : "All Properties"}
          </h1>
          <p className="mt-1 text-gray-600">
            {filteredProperties.length} propert{filteredProperties.length === 1 ? "y" : "ies"} available
          </p>
        </div>

        {/* Filter Bar */}
        <div className="mb-8">
          {/* Desktop Filters */}
          <div className="hidden md:flex items-center gap-3">
            <Select
              options={cityOptions}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="All Cities"
              className="w-44"
            />
            <Select
              options={priceOptions}
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              placeholder="Any Price"
              className="w-48"
            />
            <Select
              options={bedroomOptions}
              value={bedrooms}
              onChange={(e) => setBedrooms(e.target.value)}
              placeholder="Bedrooms"
              className="w-40"
            />
            <Select
              options={sortOptions}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-48"
            />
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} leftIcon={<X className="w-4 h-4" />}>
                Clear
              </Button>
            )}
          </div>

          {/* Mobile Filter Toggle */}
          <div className="md:hidden">
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                fullWidth
                onClick={() => setShowFilters(!showFilters)}
                leftIcon={<SlidersHorizontal className="w-4 h-4" />}
              >
                Filters {hasActiveFilters && `(active)`}
              </Button>
              <Select
                options={sortOptions}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1"
              />
            </div>

            {showFilters && (
              <div className="mt-3 p-4 bg-gray-50 rounded-xl space-y-3">
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
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" fullWidth onClick={clearFilters}>
                    Clear All Filters
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Results Grid */}
        {filteredProperties.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filteredProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No properties found
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              We could not find any properties matching your filters. Try
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
