"use client";

import { useEffect, useState } from "react";
import { Star, MapPin, BedDouble, Bath, Users, AlertCircle } from "lucide-react";
import Link from "next/link";
import { api, extractErrorMessage } from "@/lib/api";
import type { ApiShortlet } from "@/lib/api-types";
import { mapShortletToProperty } from "@/lib/shortlet-utils";
import { formatCurrency } from "@/lib/types";

function PropertySkeleton() {
  return (
    <div className="flex gap-4 p-3 border border-gray-100 rounded-xl animate-pulse">
      <div className="w-[120px] sm:w-[160px] aspect-[4/3] rounded-lg bg-gray-200 shrink-0" />
      <div className="flex-1 py-0.5 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/3" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-1/4 mt-auto" />
      </div>
    </div>
  );
}

export default function HostPropertiesPage() {
  const [shortlets, setShortlets] = useState<ApiShortlet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<ApiShortlet[]>("/v1/my-shortlets/")
      .then(setShortlets)
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Assigned Properties</h1>
        <p className="text-sm text-gray-500 mt-1">
          {loading
            ? "Loading…"
            : `${shortlets.length} ${shortlets.length === 1 ? "property" : "properties"} assigned to you`}
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 mb-6">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <PropertySkeleton key={i} />
          ))}
        </div>
      ) : shortlets.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-gray-500">No properties assigned to you yet.</p>
          <p className="text-xs text-gray-400 mt-1">
            Your property owner will assign properties from their dashboard.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {shortlets.map((shortlet) => {
            const property = mapShortletToProperty(shortlet);
            return (
              <Link
                key={shortlet.id}
                href={`/properties/${shortlet.id}`}
                className="block group"
              >
                <div className="flex gap-4 p-3 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors">
                  <div className="shrink-0 w-[120px] sm:w-[160px] aspect-[4/3] rounded-lg overflow-hidden bg-gray-200">
                    {property.images[0] && (
                      <div
                        className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                        style={{
                          backgroundImage: `url(${property.images[0]})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 py-0.5 flex flex-col">
                    <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">
                      {property.title}
                    </h3>
                    <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-500">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">
                        {property.city}, {property.state}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <BedDouble className="w-3 h-3" /> {property.bedrooms}
                      </span>
                      <span className="flex items-center gap-1">
                        <Bath className="w-3 h-3" /> {property.bathrooms}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> {property.maxGuests}
                      </span>
                      {property.rating && (
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-current" />{" "}
                          {property.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <div className="mt-auto pt-2">
                      <p className="text-sm text-gray-900">
                        <span className="font-semibold">
                          {formatCurrency(property.basePrice)}
                        </span>
                        <span className="text-xs text-gray-500"> / night</span>
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
