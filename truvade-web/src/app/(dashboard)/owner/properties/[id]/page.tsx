"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type ChangeEvent,
} from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  BedDouble,
  Bath,
  Users,
  DollarSign,
  BarChart3,
  UserCircle,
  Check,
  Circle,
  ImageIcon,
  AlertCircle,
  Trash2,
  Plus,
  Loader2,
  Eye,
  Sparkles,
  FileEdit,
} from "lucide-react";
import { api, extractErrorMessage } from "@/lib/api";
import type {
  ApiShortlet,
  ApiBooking,
  ApiAmenity,
  ApiAvailableHost,
  ApiHostAssignment,
  ApiShortletImage,
} from "@/lib/api-types";
import { formatCurrency } from "@/lib/types";

type Tab = "overview" | "details" | "pricing" | "host";

const STATUS_BADGE: Record<ApiShortlet["status"], string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  PENDING: "bg-amber-50 text-amber-700",
  ACTIVE: "bg-emerald-50 text-emerald-700",
  INACTIVE: "bg-red-50 text-red-700",
  ARCHIVED: "bg-gray-100 text-gray-500",
};

const STATUS_LABEL: Record<ApiShortlet["status"], string> = {
  DRAFT: "Draft",
  PENDING: "Under review",
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  ARCHIVED: "Archived",
};

// ─── Skeleton ────────────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-9 h-9 bg-gray-200 rounded-lg" />
        <div className="flex items-start gap-4 flex-1">
          <div className="w-20 h-20 bg-gray-200 rounded-xl" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-5 bg-gray-200 rounded w-2/3" />
            <div className="h-3 bg-gray-200 rounded w-1/3" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      </div>
      <div className="flex gap-2 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-9 w-24 bg-gray-200 rounded-full" />
        ))}
      </div>
      <div className="h-64 bg-gray-100 rounded-xl" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OwnerPropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [shortlet, setShortlet] = useState<ApiShortlet | null>(null);
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const fetchShortlet = useCallback(async () => {
    if (!id) return;
    setLoadError("");
    try {
      const [sl, bks] = await Promise.all([
        api.get<ApiShortlet>(`/v1/shortlets/${id}/`),
        api.get<ApiBooking[]>("/v1/owner-bookings/"),
      ]);
      setShortlet(sl);
      setBookings(bks.filter((b) => b.shortlet.id === sl.id));
    } catch (err) {
      setLoadError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchShortlet();
  }, [fetchShortlet]);

  if (loading) {
    return <DetailSkeleton />;
  }

  if (loadError || !shortlet) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-gray-700 font-medium">
          {loadError || "Property not found"}
        </p>
        <div className="flex items-center gap-3 justify-center mt-4">
          <button
            onClick={() => router.push("/owner/properties")}
            className="text-sm text-[#0B3D2C] underline"
          >
            Back to listings
          </button>
          {loadError && (
            <button
              onClick={fetchShortlet}
              className="text-sm text-[#0B3D2C] underline"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  const isDraft = shortlet.status === "DRAFT";
  const coverImage = [...shortlet.images].sort((a, b) => a.order - b.order)[0];

  const checklist = [
    { label: "Property type", done: !!shortlet.shortlet_type },
    { label: "Title", done: !!shortlet.title },
    { label: "Description", done: !!shortlet.description },
    { label: "Location (city)", done: !!shortlet.city },
    { label: "Capacity", done: shortlet.bedrooms > 0 },
    { label: "Amenities", done: shortlet.amenities.length > 0 },
    { label: "Photos (≥5)", done: shortlet.images.length >= 5 },
    { label: "Base price", done: parseFloat(shortlet.base_price) > 0 },
    { label: "At least 1 host assigned", done: shortlet.host_assignments.length > 0 },
  ];
  const allComplete = checklist.every((c) => c.done);

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "overview", label: "Overview", icon: BarChart3 },
    { key: "details", label: "Details", icon: FileEdit },
    { key: "pricing", label: "Pricing", icon: DollarSign },
    { key: "host", label: "Hosts", icon: UserCircle },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors mt-1"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-gray-200">
              {coverImage && (
                <div
                  className="w-full h-full"
                  style={{
                    backgroundImage: `url(${coverImage.image})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900 line-clamp-1">
                  {shortlet.title || "Untitled listing"}
                </h1>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_BADGE[shortlet.status]}`}
                >
                  {STATUS_LABEL[shortlet.status]}
                </span>
              </div>
              {(shortlet.city || shortlet.state) && (
                <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>
                    {shortlet.city}
                    {shortlet.state && `, ${shortlet.state}`}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <BedDouble className="w-3.5 h-3.5" /> {shortlet.bedrooms}
                </span>
                <span className="flex items-center gap-1">
                  <Bath className="w-3.5 h-3.5" /> {shortlet.bathrooms}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> {shortlet.max_guests}
                </span>
              </div>
            </div>
            {shortlet.status === "ACTIVE" && (
              <Link
                href={`/properties/${shortlet.id}`}
                className="shrink-0 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-1"
              >
                <Eye className="w-3 h-3" /> View public
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Draft banner with publish action */}
      {isDraft && (
        <DraftBanner
          checklist={checklist}
          allComplete={allComplete}
          shortletId={shortlet.id}
          onPublished={fetchShortlet}
        />
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all shrink-0 ${
                activeTab === tab.key
                  ? "bg-[#0B3D2C] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === "overview" && (
          <OverviewTab shortlet={shortlet} bookings={bookings} />
        )}
        {activeTab === "details" && (
          <DetailsTab shortlet={shortlet} onUpdated={fetchShortlet} />
        )}
        {activeTab === "pricing" && (
          <PricingTab shortlet={shortlet} onUpdated={fetchShortlet} />
        )}
        {activeTab === "host" && (
          <HostTab shortlet={shortlet} onUpdated={fetchShortlet} />
        )}
      </motion.div>
    </div>
  );
}

// ─── Draft banner ─────────────────────────────────────────────────────────────

function DraftBanner({
  checklist,
  allComplete,
  shortletId,
  onPublished,
}: {
  checklist: { label: string; done: boolean }[];
  allComplete: boolean;
  shortletId: number;
  onPublished: () => void;
}) {
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const remaining = checklist.filter((c) => !c.done).length;

  const handlePublish = async () => {
    setPublishing(true);
    setError("");
    try {
      await api.post(`/v1/shortlets/${shortletId}/publish/`, {});
      onPublished();
    } catch (err) {
      setError(extractErrorMessage(err));
      setPublishing(false);
    }
  };

  return (
    <div className="mb-6 border border-gray-200 rounded-xl p-5">
      <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#0B3D2C]" />
            {allComplete ? "Ready to publish" : "Finish your listing"}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {allComplete
              ? "All required steps are complete. Submit your listing for review."
              : `${remaining} step${remaining !== 1 ? "s" : ""} left before you can publish.`}
          </p>
        </div>
        <button
          type="button"
          disabled={!allComplete || publishing}
          onClick={handlePublish}
          className="px-5 py-2.5 bg-[#0B3D2C] text-white text-sm font-semibold rounded-xl hover:bg-[#0F5240] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
        >
          {publishing && <Loader2 className="w-4 h-4 animate-spin" />}
          {publishing ? "Submitting…" : "Publish listing"}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 mt-4">
        {checklist.map((step) => (
          <div key={step.label} className="flex items-center gap-2.5 py-1.5">
            {step.done ? (
              <div className="w-4 h-4 rounded-full bg-[#0B3D2C] flex items-center justify-center shrink-0">
                <Check className="w-2.5 h-2.5 text-white" />
              </div>
            ) : (
              <Circle className="w-4 h-4 text-gray-300 shrink-0" />
            )}
            <span
              className={`text-sm ${step.done ? "text-gray-500" : "text-gray-900"}`}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-start gap-2 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

// ─── Overview tab ─────────────────────────────────────────────────────────────

function OverviewTab({
  shortlet,
  bookings,
}: {
  shortlet: ApiShortlet;
  bookings: ApiBooking[];
}) {
  const revenue = bookings
    .filter((b) => b.status === "CONFIRMED" || b.status === "COMPLETED")
    .reduce((sum, b) => sum + parseFloat(b.total_price), 0);

  const upcomingCount = bookings.filter(
    (b) => b.status === "CONFIRMED" || b.status === "PENDING"
  ).length;

  const stats = [
    { label: "Revenue", value: formatCurrency(revenue) },
    { label: "Total bookings", value: bookings.length.toString() },
    { label: "Upcoming", value: upcomingCount.toString() },
    { label: "Photos", value: shortlet.images.length.toString() },
  ];

  const recent = [...bookings]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 5);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {stats.map((s) => (
          <div
            key={s.label}
            className="border border-gray-200 rounded-xl px-4 py-3"
          >
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="text-sm font-semibold text-gray-900 mt-0.5">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <h3 className="text-sm font-semibold text-gray-900 mb-3">
        Recent bookings
      </h3>
      {recent.length === 0 ? (
        <div className="border border-dashed border-gray-200 rounded-xl py-10 text-center text-sm text-gray-400">
          No bookings yet.
        </div>
      ) : (
        <div className="space-y-2">
          {recent.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {b.guest_name}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {new Date(b.check_in).toLocaleDateString("en-NG", {
                    month: "short",
                    day: "numeric",
                  })}{" "}
                  —{" "}
                  {new Date(b.check_out).toLocaleDateString("en-NG", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-700 font-medium">
                  {formatCurrency(parseFloat(b.total_price))}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                    b.status === "CONFIRMED"
                      ? "bg-emerald-50 text-emerald-700"
                      : b.status === "COMPLETED"
                      ? "bg-gray-100 text-gray-600"
                      : b.status === "CANCELLED"
                      ? "bg-red-50 text-red-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {b.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Details tab ──────────────────────────────────────────────────────────────

function DetailsTab({
  shortlet,
  onUpdated,
}: {
  shortlet: ApiShortlet;
  onUpdated: () => void;
}) {
  const [title, setTitle] = useState(shortlet.title);
  const [description, setDescription] = useState(shortlet.description);
  const [address, setAddress] = useState(shortlet.address);
  const [city, setCity] = useState(shortlet.city);
  const [state, setState] = useState(shortlet.state);
  const [bedrooms, setBedrooms] = useState(shortlet.bedrooms);
  const [bathrooms, setBathrooms] = useState(shortlet.bathrooms);
  const [maxGuests, setMaxGuests] = useState(shortlet.max_guests);
  const [selectedAmenityIds, setSelectedAmenityIds] = useState<number[]>(
    shortlet.amenities.map((a) => a.id)
  );
  const [amenities, setAmenities] = useState<ApiAmenity[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api
      .get<ApiAmenity[]>("/v1/amenities/")
      .then(setAmenities)
      .catch(() => {});
  }, []);

  const toggleAmenity = (id: number) => {
    setSelectedAmenityIds((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    setSaved(false);
    try {
      await api.patch(`/v1/shortlets/${shortlet.id}/`, {
        title,
        description,
        address,
        city,
        state,
        bedrooms,
        bathrooms,
        max_guests: maxGuests,
        amenity_ids: selectedAmenityIds,
      });
      setSaved(true);
      onUpdated();
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setSaveError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <PhotoManager shortletId={shortlet.id} images={shortlet.images} onChanged={onUpdated} />

      <div className="space-y-5 max-w-2xl">
        <Field label="Title">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
            className={inputCls}
          />
        </Field>

        <Field label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            maxLength={1000}
            className={`${inputCls} resize-none`}
          />
        </Field>

        <Field label="Street address">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className={inputCls}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="City">
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="State">
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Bedrooms">
            <input
              type="number"
              min={0}
              value={bedrooms}
              onChange={(e) => setBedrooms(Number(e.target.value))}
              className={inputCls}
            />
          </Field>
          <Field label="Bathrooms">
            <input
              type="number"
              min={0}
              value={bathrooms}
              onChange={(e) => setBathrooms(Number(e.target.value))}
              className={inputCls}
            />
          </Field>
          <Field label="Max guests">
            <input
              type="number"
              min={1}
              value={maxGuests}
              onChange={(e) => setMaxGuests(Number(e.target.value))}
              className={inputCls}
            />
          </Field>
        </div>

        <Field label="Amenities">
          {amenities.length === 0 ? (
            <p className="text-sm text-gray-400">Loading amenities…</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {amenities.map((a) => {
                const selected = selectedAmenityIds.includes(a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => toggleAmenity(a.id)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                      selected
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-white text-gray-700 border-gray-300 hover:border-gray-900"
                    }`}
                  >
                    {selected && (
                      <Check className="w-3 h-3 inline mr-1 -mt-0.5" />
                    )}
                    {a.name}
                  </button>
                );
              })}
            </div>
          )}
        </Field>

        <SaveRow
          onSave={handleSave}
          saving={saving}
          saved={saved}
          error={saveError}
        />
      </div>
    </div>
  );
}

// ─── Photo manager ────────────────────────────────────────────────────────────

function PhotoManager({
  shortletId,
  images,
  onChanged,
}: {
  shortletId: number;
  images: ApiShortletImage[];
  onChanged: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const sorted = [...images].sort((a, b) => a.order - b.order);

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      Array.from(e.target.files).forEach((f) => formData.append("images", f));
      await api.post(`/v1/shortlets/${shortletId}/upload-images/`, formData);
      onChanged();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDelete = async (imageId: number) => {
    setDeletingId(imageId);
    setError("");
    try {
      await api.delete(`/v1/shortlets/${shortletId}/images/${imageId}/`);
      onChanged();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">
          Photos{" "}
          <span className="text-gray-400 font-normal">
            ({sorted.length})
          </span>
        </h3>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 text-xs font-medium text-[#0B3D2C] hover:underline disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Plus className="w-3.5 h-3.5" />
          )}
          {uploading ? "Uploading…" : "Add photos"}
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-xl py-10 flex flex-col items-center justify-center text-gray-400">
          <ImageIcon className="w-6 h-6 mb-2" />
          <p className="text-sm">No photos yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {sorted.map((img, i) => (
            <div
              key={img.id}
              className="relative group aspect-[4/3] rounded-xl overflow-hidden bg-gray-100"
            >
              <img
                src={img.image}
                alt={`Photo ${i + 1}`}
                className="w-full h-full object-cover"
              />
              {i === 0 && (
                <span className="absolute top-2 left-2 bg-white/90 text-xs font-medium px-2 py-0.5 rounded-md">
                  Cover
                </span>
              )}
              <button
                type="button"
                onClick={() => handleDelete(img.id)}
                disabled={deletingId === img.id}
                className="absolute top-2 right-2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white disabled:opacity-50"
              >
                {deletingId === img.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-700" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

// ─── Pricing tab ──────────────────────────────────────────────────────────────

function PricingTab({
  shortlet,
  onUpdated,
}: {
  shortlet: ApiShortlet;
  onUpdated: () => void;
}) {
  const [basePrice, setBasePrice] = useState(parseFloat(shortlet.base_price) || 0);
  const [cleaningFee, setCleaningFee] = useState(
    parseFloat(shortlet.cleaning_fee) || 0
  );
  const [minNights, setMinNights] = useState(shortlet.min_nights || 1);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    setSaved(false);
    try {
      await api.patch(`/v1/shortlets/${shortlet.id}/`, {
        base_price: basePrice,
        cleaning_fee: cleaningFee,
        min_nights: minNights,
      });
      setSaved(true);
      onUpdated();
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setSaveError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-md space-y-5">
      <Field label="Base price per night">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
            ₦
          </span>
          <input
            type="number"
            min={0}
            value={basePrice}
            onChange={(e) => setBasePrice(Number(e.target.value))}
            className={`${inputCls} pl-8`}
          />
        </div>
      </Field>

      <Field label="Cleaning fee">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
            ₦
          </span>
          <input
            type="number"
            min={0}
            value={cleaningFee}
            onChange={(e) => setCleaningFee(Number(e.target.value))}
            className={`${inputCls} pl-8`}
          />
        </div>
      </Field>

      <Field label="Minimum nights">
        <input
          type="number"
          min={1}
          value={minNights}
          onChange={(e) => setMinNights(Number(e.target.value))}
          className={inputCls}
        />
      </Field>

      <SaveRow
        onSave={handleSave}
        saving={saving}
        saved={saved}
        error={saveError}
      />
    </div>
  );
}

// ─── Host tab ─────────────────────────────────────────────────────────────────

function HostTab({
  shortlet,
  onUpdated,
}: {
  shortlet: ApiShortlet;
  onUpdated: () => void;
}) {
  const [availableHosts, setAvailableHosts] = useState<ApiAvailableHost[]>([]);
  const [loadingHosts, setLoadingHosts] = useState(true);
  const [selectedHostId, setSelectedHostId] = useState<string>("");
  const [role, setRole] = useState<"HOST" | "COHOST">("HOST");
  const [commission, setCommission] = useState(0);
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState("");
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [removeError, setRemoveError] = useState("");

  const loadAvailableHosts = useCallback(async () => {
    setLoadingHosts(true);
    try {
      const hosts = await api.get<ApiAvailableHost[]>(
        `/v1/shortlets/${shortlet.id}/available-hosts/`
      );
      setAvailableHosts(hosts);
    } catch {
      setAvailableHosts([]);
    } finally {
      setLoadingHosts(false);
    }
  }, [shortlet.id]);

  useEffect(() => {
    loadAvailableHosts();
  }, [loadAvailableHosts]);

  const existingRoles = new Set(shortlet.host_assignments.map((a) => a.role));
  const availableRoles: ("HOST" | "COHOST")[] = (["HOST", "COHOST"] as const).filter(
    (r) => !existingRoles.has(r)
  );

  useEffect(() => {
    if (availableRoles.length > 0 && !availableRoles.includes(role)) {
      setRole(availableRoles[0]);
    }
  }, [availableRoles, role]);

  const handleAssign = async () => {
    if (!selectedHostId) return;
    setAssigning(true);
    setAssignError("");
    try {
      await api.post(`/v1/shortlets/${shortlet.id}/assign-host/`, {
        host_id: parseInt(selectedHostId),
        role,
        commission_percentage: commission,
      });
      setSelectedHostId("");
      setCommission(0);
      onUpdated();
      loadAvailableHosts();
    } catch (err) {
      setAssignError(extractErrorMessage(err));
    } finally {
      setAssigning(false);
    }
  };

  const handleRemove = async (assignment: ApiHostAssignment) => {
    setRemovingId(assignment.id);
    setRemoveError("");
    try {
      await api.delete(
        `/v1/shortlets/${shortlet.id}/assignments/${assignment.id}/`
      );
      onUpdated();
      loadAvailableHosts();
    } catch (err) {
      setRemoveError(extractErrorMessage(err));
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Existing assignments */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Assigned hosts
        </h3>
        {shortlet.host_assignments.length === 0 ? (
          <div className="border border-dashed border-gray-200 rounded-xl py-8 text-center text-sm text-gray-400">
            No hosts assigned yet. Assign at least one before publishing.
          </div>
        ) : (
          <div className="space-y-2">
            {shortlet.host_assignments.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl"
              >
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-xs font-semibold shrink-0">
                  {a.host_name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {a.host_name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {a.host_email}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-medium text-gray-700">
                    {a.role === "COHOST" ? "Co-Host" : "Host"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {parseFloat(a.commission_percentage).toFixed(0)}%
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(a)}
                  disabled={removingId === a.id}
                  className="p-2 rounded-lg hover:bg-red-50 text-red-500 disabled:opacity-50"
                  title="Remove host"
                >
                  {removingId === a.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        {removeError && (
          <div className="flex items-start gap-2 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>{removeError}</span>
          </div>
        )}
      </div>

      {/* Assign new */}
      {availableRoles.length > 0 && (
        <div className="border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            Assign a host
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Hosts must be verified and linked to you from your{" "}
            <Link href="/owner/hosts" className="text-[#0B3D2C] underline">
              Hosts
            </Link>{" "}
            page.
          </p>

          {loadingHosts ? (
            <p className="text-sm text-gray-400">Loading hosts…</p>
          ) : availableHosts.length === 0 ? (
            <p className="text-sm text-gray-500">
              No verified hosts available yet.
            </p>
          ) : (
            <div className="space-y-4">
              <Field label="Host">
                <select
                  value={selectedHostId}
                  onChange={(e) => setSelectedHostId(e.target.value)}
                  className={inputCls}
                >
                  <option value="">Select a host…</option>
                  {availableHosts.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.email})
                    </option>
                  ))}
                </select>
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Role">
                  <select
                    value={role}
                    onChange={(e) =>
                      setRole(e.target.value as "HOST" | "COHOST")
                    }
                    className={inputCls}
                  >
                    {availableRoles.map((r) => (
                      <option key={r} value={r}>
                        {r === "COHOST" ? "Co-Host" : "Host"}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Commission (%)">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={commission}
                    onChange={(e) => setCommission(Number(e.target.value))}
                    className={inputCls}
                  />
                </Field>
              </div>

              {assignError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>{assignError}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleAssign}
                disabled={!selectedHostId || assigning}
                className="px-5 py-2.5 bg-[#0B3D2C] text-white text-sm font-semibold rounded-xl hover:bg-[#0F5240] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {assigning && <Loader2 className="w-4 h-4 animate-spin" />}
                {assigning ? "Assigning…" : "Assign host"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Reusable bits ────────────────────────────────────────────────────────────

const inputCls =
  "w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#0B3D2C] transition-colors";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      {children}
    </div>
  );
}

function SaveRow({
  onSave,
  saving,
  saved,
  error,
}: {
  onSave: () => void;
  saving: boolean;
  saved: boolean;
  error: string;
}) {
  return (
    <div>
      {error && (
        <div className="flex items-start gap-2 mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="px-5 py-2.5 bg-[#0B3D2C] text-white text-sm font-semibold rounded-xl hover:bg-[#0F5240] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? "Saving…" : "Save changes"}
        </button>
        {saved && (
          <span className="text-xs text-emerald-700 flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> Saved
          </span>
        )}
      </div>
    </div>
  );
}

