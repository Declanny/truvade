"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, Eye, MoreHorizontal, MapPin, BedDouble, Bath, Star,
  FileEdit, AlertCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/types";
import type { ApiShortlet } from "@/lib/api-types";
import { api, extractErrorMessage } from "@/lib/api";
import { mapShortletToProperty } from "@/lib/shortlet-utils";
import type { Property } from "@/lib/types";
import Link from "next/link";

type Tab = "all" | "active" | "pending" | "draft";

// ── Skeleton ──────────────────────────────────────────────────────────────────

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

// ── Property card ─────────────────────────────────────────────────────────────

function OwnerPropertyCard({
  shortlet,
  onDelete,
}: {
  shortlet: ApiShortlet;
  onDelete: (id: number) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const property: Property = mapShortletToProperty(shortlet);
  const isDraft = shortlet.status === "DRAFT";

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError("");
    try {
      await api.delete(`/v1/shortlets/${shortlet.id}/`);
      onDelete(shortlet.id);
    } catch (err) {
      setDeleteError(extractErrorMessage(err));
      setDeleting(false);
    }
  };

  return (
    <div className="flex gap-4 p-3 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors group">
      {/* Thumbnail */}
      <Link
        href={`/owner/properties/${shortlet.id}`}
        className="shrink-0 w-[120px] sm:w-[160px] aspect-[4/3] rounded-lg overflow-hidden relative"
      >
        <div
          className="w-full h-full bg-gray-200 group-hover:scale-105 transition-transform duration-300"
          style={
            property.images[0]
              ? {
                  backgroundImage: `url(${property.images[0]})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
        />
        {isDraft && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <span className="text-white text-xs font-medium">Draft</span>
          </div>
        )}
      </Link>

      <div className="flex-1 min-w-0 py-0.5 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/owner/properties/${shortlet.id}`} className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">
              {property.title}
            </h3>
            <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-500">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">
                {property.city}, {property.state}
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                shortlet.status === "ACTIVE"
                  ? "bg-emerald-50 text-emerald-700"
                  : shortlet.status === "PENDING"
                  ? "bg-amber-50 text-amber-700"
                  : shortlet.status === "INACTIVE"
                  ? "bg-red-50 text-red-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {shortlet.status === "ACTIVE"
                ? "Active"
                : shortlet.status === "PENDING"
                ? "Under review"
                : shortlet.status === "INACTIVE"
                ? "Inactive"
                : "Draft"}
            </span>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <MoreHorizontal className="w-4 h-4 text-gray-500" />
              </button>
              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-50">
                    <Link
                      href={`/owner/properties/${shortlet.id}`}
                      onClick={() => setShowMenu(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </Link>
                    {isDraft && (
                      <Link
                        href={`/owner/properties/${shortlet.id}`}
                        onClick={() => setShowMenu(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full"
                      >
                        <FileEdit className="w-3.5 h-3.5" /> Edit
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setConfirmDelete(true);
                        setShowMenu(false);
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <BedDouble className="w-3 h-3" /> {property.bedrooms}
          </span>
          <span className="flex items-center gap-1">
            <Bath className="w-3 h-3" /> {property.bathrooms}
          </span>
          {property.rating && (
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-current" /> {property.rating.toFixed(1)}
            </span>
          )}
        </div>

        {property.hostName && (
          <p className="text-xs text-gray-500 mt-2">Hosted by {property.hostName.split(" ")[0]}</p>
        )}

        <div className="flex items-center justify-between mt-auto pt-2">
          <p className="text-sm text-gray-900">
            <span className="font-semibold">{formatCurrency(property.basePrice)}</span>
            <span className="text-xs text-gray-500"> / night</span>
          </p>
        </div>

        {/* Delete confirmation inline */}
        {confirmDelete && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm">
            <p className="font-medium text-red-900 mb-2">Delete this property?</p>
            {deleteError && (
              <div className="flex items-center gap-1 text-red-600 mb-2 text-xs">
                <AlertCircle className="w-3.5 h-3.5" />
                {deleteError}
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
              <button
                onClick={() => {
                  setConfirmDelete(false);
                  setDeleteError("");
                }}
                className="px-3 py-1.5 border border-red-300 text-red-700 text-xs font-medium rounded-lg hover:bg-red-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OwnerPropertiesPage() {
  const [shortlets, setShortlets] = useState<ApiShortlet[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("all");

  const fetchShortlets = useCallback(async () => {
    setLoading(true);
    setFetchError("");
    try {
      const data = await api.get<ApiShortlet[]>("/v1/shortlets/");
      setShortlets(data);
    } catch (err) {
      setFetchError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShortlets();
  }, [fetchShortlets]);

  const handleDelete = (id: number) => {
    setShortlets((prev) => prev.filter((s) => s.id !== id));
  };

  const byStatus = (status: ApiShortlet["status"]) =>
    shortlets.filter((s) => s.status === status);

  const active = byStatus("ACTIVE");
  const pending = byStatus("PENDING");
  const drafts = byStatus("DRAFT");

  const filtered =
    activeTab === "all"
      ? shortlets
      : activeTab === "active"
      ? active
      : activeTab === "pending"
      ? pending
      : drafts;

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "all", label: "All", count: shortlets.length },
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

      {fetchError && (
        <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 mb-6">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{fetchError}</span>
          <button
            onClick={fetchShortlets}
            className="ml-auto text-sm font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Tabs */}
      {!loading && (
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
              <span
                className={`text-xs ${
                  activeTab === tab.key ? "text-white/70" : "text-gray-400"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <PropertySkeleton key={i} />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {filtered.map((s) => (
                <OwnerPropertyCard key={s.id} shortlet={s} onDelete={handleDelete} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-sm text-gray-500 mb-4">
                {activeTab === "all"
                  ? "No listings yet. Create your first one."
                  : `No ${activeTab} listings.`}
              </p>
              {activeTab === "all" && (
                <Link href="/owner/properties/new">
                  <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0B3D2C] text-white text-sm font-semibold rounded-xl hover:bg-[#0F5240] transition-colors">
                    <Plus className="w-4 h-4" />
                    Create listing
                  </button>
                </Link>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
