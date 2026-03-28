"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Clock, CheckCircle, FileEdit, Star, MapPin, BedDouble, Bath, Eye, MoreHorizontal } from "lucide-react";
import { mockProperties } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/types";
import type { Property, PropertyStatus } from "@/lib/types";
import Link from "next/link";

const ownerProperties: Property[] = [
  ...mockProperties.slice(0, 3).map((p) => ({ ...p, status: "ACTIVE" as PropertyStatus })),
  ...mockProperties.slice(3, 5).map((p) => ({ ...p, status: "PENDING" as PropertyStatus })),
  ...mockProperties.slice(5, 7).map((p) => ({ ...p, status: "DRAFT" as PropertyStatus })),
];

type Tab = "all" | "active" | "pending" | "draft";

function OwnerPropertyCard({ property, onDelete }: { property: Property; onDelete: (id: string) => void }) {
  const [showMenu, setShowMenu] = useState(false);
  const isDraft = property.status === "DRAFT";

  return (
    <div className="flex gap-4 p-3 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors group">
      <Link href={`/owner/properties/${property.id}`} className="shrink-0 w-[120px] sm:w-[160px] aspect-[4/3] rounded-lg overflow-hidden relative">
        <div
          className="w-full h-full bg-gray-200 group-hover:scale-105 transition-transform duration-300"
          style={{ backgroundImage: `url(${property.images[0]})`, backgroundSize: "cover", backgroundPosition: "center" }}
        />
        {isDraft && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <span className="text-white text-xs font-medium">Draft</span>
          </div>
        )}
      </Link>

      <div className="flex-1 min-w-0 py-0.5 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/owner/properties/${property.id}`} className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">{property.title}</h3>
            <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-500">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{property.city}, {property.state}</span>
            </div>
          </Link>

          <div className="flex items-center gap-2 shrink-0">
            {/* Status badge */}
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
              property.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" :
              property.status === "PENDING" ? "bg-amber-50 text-amber-700" :
              "bg-gray-100 text-gray-600"
            }`}>
              {property.status === "ACTIVE" ? "Active" : property.status === "PENDING" ? "Pending" : "Draft"}
            </span>

            {/* Menu */}
            <div className="relative">
              <button type="button" onClick={() => setShowMenu(!showMenu)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <MoreHorizontal className="w-4 h-4 text-gray-500" />
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-50">
                    {isDraft && (
                      <Link href={`/owner/properties/new?edit=${property.id}`} onClick={() => setShowMenu(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full">
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </Link>
                    )}
                    <Link href={`/owner/properties/${property.id}`} onClick={() => setShowMenu(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full">
                      <Eye className="w-3.5 h-3.5" /> View
                    </Link>
                    <button onClick={() => { onDelete(property.id); setShowMenu(false); }}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
          <span className="flex items-center gap-1"><BedDouble className="w-3 h-3" /> {property.bedrooms}</span>
          <span className="flex items-center gap-1"><Bath className="w-3 h-3" /> {property.bathrooms}</span>
          {property.rating && (
            <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-current" /> {property.rating.toFixed(1)}</span>
          )}
        </div>

        {/* Host */}
        {property.hostName && (
          <div className="flex items-center gap-1.5 mt-2">
            {property.hostAvatar?.startsWith("http") ? (
              <img src={property.hostAvatar} alt="" className="w-4 h-4 rounded-full object-cover" />
            ) : (
              <div className="w-4 h-4 rounded-full bg-[#0B3D2C] flex items-center justify-center text-white text-[7px] font-medium">{property.hostAvatar?.slice(0,2)}</div>
            )}
            <span className="text-xs text-gray-500">Hosted by {property.hostName.split(" ")[0]}</span>
          </div>
        )}

        <div className="flex items-center justify-between mt-auto pt-2">
          <p className="text-sm text-gray-900">
            <span className="font-semibold">{formatCurrency(property.basePrice)}</span>
            <span className="text-xs text-gray-500"> / night</span>
          </p>
          {isDraft && (
            <Link href={`/owner/properties/new?edit=${property.id}`}
              className="text-xs font-medium text-[#0B3D2C] hover:underline flex items-center gap-1">
              <FileEdit className="w-3 h-3" /> Continue editing
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OwnerPropertiesPage() {
  const [properties, setProperties] = useState(ownerProperties);
  const [activeTab, setActiveTab] = useState<Tab>("all");

  const handleDelete = (id: string) => {
    setProperties((prev) => prev.filter((p) => p.id !== id));
  };

  const active = properties.filter((p) => p.status === "ACTIVE");
  const pending = properties.filter((p) => p.status === "PENDING");
  const drafts = properties.filter((p) => p.status === "DRAFT");

  const filtered = activeTab === "all" ? properties :
    activeTab === "active" ? active :
    activeTab === "pending" ? pending : drafts;

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "all", label: "All", count: properties.length },
    { key: "active", label: "Active", count: active.length },
    { key: "pending", label: "Pending", count: pending.length },
    { key: "draft", label: "Drafts", count: drafts.length },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Your listings</h1>
        <Link href="/owner/properties/new">
          <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0B3D2C] text-white text-sm font-semibold rounded-xl hover:bg-[#0F5240] transition-colors">
            <Plus className="w-4 h-4" />
            Create listing
          </button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
              activeTab === tab.key
                ? "bg-[#0B3D2C] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
            <span className={`text-xs ${activeTab === tab.key ? "text-white/70" : "text-gray-400"}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {filtered.map((p) => (
                <OwnerPropertyCard key={p.id} property={p} onDelete={handleDelete} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-sm text-gray-500">No {activeTab === "all" ? "" : activeTab} listings</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
