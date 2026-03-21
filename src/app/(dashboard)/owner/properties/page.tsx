"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Clock } from "lucide-react";
import { PropertyCard } from "@/components/property/PropertyCard";
import { mockProperties } from "@/lib/mock-data";
import type { Property } from "@/lib/types";
import Link from "next/link";

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  ACTIVE: { label: "Active", bg: "bg-emerald-50", text: "text-emerald-700" },
  PENDING: { label: "Under review", bg: "bg-amber-50", text: "text-amber-700" },
  DRAFT: { label: "Draft", bg: "bg-gray-100", text: "text-gray-600" },
  INACTIVE: { label: "Inactive", bg: "bg-red-50", text: "text-red-700" },
  ARCHIVED: { label: "Archived", bg: "bg-gray-100", text: "text-gray-500" },
};

export default function OwnerPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>(mockProperties.slice(0, 6));

  const handleDelete = (id: string) => {
    setProperties((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your listings</h1>
          <p className="text-sm text-gray-500 mt-1">{properties.length} properties</p>
        </div>
        <Link href="/owner/properties/new">
          <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors">
            <Plus className="w-4 h-4" />
            Create listing
          </button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence>
          {properties.map((property, i) => {
            const status = statusConfig[property.status];
            return (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
                className="relative group/owner"
              >
                {/* Same card as public shortlets page */}
                <PropertyCard property={property} />

                {/* Owner status badge overlay */}
                {property.status !== "ACTIVE" && status && (
                  <div className="absolute top-3 left-3 z-10">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium shadow-sm ${status.bg} ${status.text}`}>
                      {property.status === "PENDING" && <Clock className="w-3 h-3" />}
                      {status.label}
                    </span>
                  </div>
                )}

                {/* Owner action buttons — appear on hover */}
                <div className="absolute top-3 right-12 z-10 flex items-center gap-1 opacity-0 group-hover/owner:opacity-100 transition-opacity">
                  <button className="w-8 h-8 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(property.id); }}
                    className="w-8 h-8 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
