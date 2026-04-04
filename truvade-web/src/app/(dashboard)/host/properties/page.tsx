"use client";

import { Star, MapPin, BedDouble, Bath, Users } from "lucide-react";
import { mockProperties } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/types";
import { useWorkspace } from "@/context/WorkspaceContext";
import Link from "next/link";

// Mock: host's assigned properties per workspace
const assignedPropertyIds: Record<string, string[]> = {
  "org-1": ["prop-1", "prop-2", "prop-3", "prop-4"],
  "org-2": ["prop-5", "prop-6"],
};

export default function HostPropertiesPage() {
  const { activeWorkspace, current } = useWorkspace();
  const propertyIds = assignedPropertyIds[activeWorkspace] || [];
  const properties = mockProperties.filter((p) => propertyIds.includes(p.id));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Assigned Properties</h1>
        <p className="text-sm text-gray-500 mt-1">{properties.length} properties managed for {current.orgName}</p>
      </div>

      {properties.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {properties.map((property) => (
            <Link key={property.id} href={`/properties/${property.id}`} className="block group">
              <div className="flex gap-4 p-3 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors">
                <div className="shrink-0 w-[120px] sm:w-[160px] aspect-[4/3] rounded-lg overflow-hidden">
                  <div
                    className="w-full h-full bg-gray-200 group-hover:scale-105 transition-transform duration-300"
                    style={{ backgroundImage: `url(${property.images[0]})`, backgroundSize: "cover", backgroundPosition: "center" }}
                  />
                </div>
                <div className="flex-1 min-w-0 py-0.5 flex flex-col">
                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">{property.title}</h3>
                  <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-500">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">{property.city}, {property.state}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><BedDouble className="w-3 h-3" /> {property.bedrooms}</span>
                    <span className="flex items-center gap-1"><Bath className="w-3 h-3" /> {property.bathrooms}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {property.maxGuests}</span>
                    {property.rating && (
                      <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-current" /> {property.rating.toFixed(1)}</span>
                    )}
                  </div>
                  <div className="mt-auto pt-2">
                    <p className="text-sm text-gray-900">
                      <span className="font-semibold">{formatCurrency(property.basePrice)}</span>
                      <span className="text-xs text-gray-500"> / night</span>
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-sm text-gray-500">No properties assigned to you yet.</p>
          <p className="text-xs text-gray-400 mt-1">Your property owner will assign properties from their dashboard.</p>
        </div>
      )}
    </div>
  );
}
