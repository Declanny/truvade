"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Building2,
  Hotel,
  Castle,
  X,
  Plus,
  Check,
  Clock,
  ImageIcon,
  Star,
} from "lucide-react";
import { formatCurrency } from "@/lib/types";
import { AMENITIES, mockInvitations } from "@/lib/mock-data";

// ─── Types ───────────────────────────────────────────────
type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface ListingDraft {
  propertyType: string;
  title: string;
  description: string;
  address: string;
  city: string;
  state: string;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  amenities: string[];
  images: string[];
  basePrice: number;
  cleaningFee: number;
  assignedHostId: string;
}

const PROPERTY_TYPES = [
  { value: "apartment", label: "Apartment", icon: Building2, desc: "A rented unit within a larger building" },
  { value: "house", label: "House", icon: Home, desc: "A standalone residential building" },
  { value: "studio", label: "Studio", icon: Hotel, desc: "A single open-plan living space" },
  { value: "villa", label: "Villa", icon: Castle, desc: "A luxury standalone property" },
];

const STEP_TITLES: Record<Step, string> = {
  1: "What type of property is this?",
  2: "Tell guests about your place",
  3: "How many guests can stay?",
  4: "What amenities do you offer?",
  5: "Add photos of your place",
  6: "Set your price",
  7: "Review your listing",
};

const STEP_SUBTITLES: Record<Step, string> = {
  1: "Choose the option that best describes your property",
  2: "A great title and description help guests find your listing",
  3: "Set the capacity and sleeping arrangements",
  4: "Guests often filter by these when searching",
  5: "You need at least 5 photos. You can add up to 7.",
  6: "You can always change this later",
  7: "Here's what guests will see. Make sure everything looks good.",
};

const SAMPLE_IMAGES = [
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600",
  "https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=600",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600",
];

const emptyDraft: ListingDraft = {
  propertyType: "",
  title: "",
  description: "",
  address: "",
  city: "",
  state: "Lagos",
  bedrooms: 1,
  bathrooms: 1,
  maxGuests: 2,
  amenities: [],
  images: [],
  basePrice: 0,
  cleaningFee: 0,
  assignedHostId: "",
};

// ─── Counter ─────────────────────────────────────────────
function Counter({ label, value, onChange, min = 1, max = 16 }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number;
}) {
  return (
    <div className="flex items-center justify-between py-5 border-b border-gray-100 last:border-b-0">
      <span className="text-base text-gray-900">{label}</span>
      <div className="flex items-center gap-4">
        <button onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}
          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <span className="text-lg leading-none">−</span>
        </button>
        <span className="text-base font-medium text-gray-900 w-6 text-center">{value}</span>
        <button onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}
          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <span className="text-lg leading-none">+</span>
        </button>
      </div>
    </div>
  );
}

// ─── Step indicator ──────────────────────────────────────
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-1 rounded-full transition-all ${
            i + 1 <= current ? "bg-gray-900 w-8" : "bg-gray-200 w-4"
          }`}
        />
      ))}
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────
export default function NewPropertyWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [draft, setDraft] = useState<ListingDraft>(emptyDraft);
  const [saving, setSaving] = useState(false);

  const totalSteps = 7;

  const canProceed = useMemo(() => {
    switch (step) {
      case 1: return draft.propertyType !== "";
      case 2: return draft.title.trim().length > 0 && draft.city.trim().length > 0;
      case 3: return true;
      case 4: return draft.amenities.length > 0;
      case 5: return draft.images.length >= 5;
      case 6: return draft.basePrice > 0;
      case 7: return true;
      default: return false;
    }
  }, [step, draft]);

  const handleNext = () => { if (step < 7) setStep((s) => (s + 1) as Step); };
  const handleBack = () => { if (step > 1) setStep((s) => (s - 1) as Step); };

  const handleSaveDraft = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSaving(false);
    router.push("/owner/properties");
  };

  const handlePublish = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1500));
    setSaving(false);
    router.push("/owner/properties");
  };

  const handleAddImage = (url: string) => {
    if (draft.images.length < 7 && !draft.images.includes(url)) {
      setDraft((d) => ({ ...d, images: [...d.images, url] }));
    }
  };

  const handleRemoveImage = (index: number) => {
    setDraft((d) => ({ ...d, images: d.images.filter((_, i) => i !== index) }));
  };

  const handleToggleAmenity = (amenity: string) => {
    setDraft((d) => ({
      ...d,
      amenities: d.amenities.includes(amenity)
        ? d.amenities.filter((a) => a !== amenity)
        : [...d.amenities, amenity],
    }));
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PROPERTY_TYPES.map((type) => {
              const Icon = type.icon;
              const selected = draft.propertyType === type.value;
              return (
                <button key={type.value} onClick={() => setDraft((d) => ({ ...d, propertyType: type.value }))}
                  className={`flex items-start gap-4 p-5 rounded-xl border-2 text-left transition-all ${
                    selected ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-400"
                  }`}>
                  <Icon className={`w-7 h-7 flex-shrink-0 ${selected ? "text-gray-900" : "text-gray-400"}`} />
                  <div>
                    <p className="font-semibold text-gray-900">{type.label}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{type.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Property title</label>
              <input type="text" value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                placeholder="e.g. Stunning oceanfront apartment in VI" maxLength={80}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 transition-colors" />
              <p className="text-xs text-gray-400 mt-1.5">{draft.title.length}/80</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                rows={4} placeholder="Describe what makes your place special..." maxLength={500}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 transition-colors resize-none" />
              <p className="text-xs text-gray-400 mt-1.5">{draft.description.length}/500</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <input type="text" value={draft.city} onChange={(e) => setDraft((d) => ({ ...d, city: e.target.value }))}
                  placeholder="e.g. Victoria Island"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                <input type="text" value={draft.state} onChange={(e) => setDraft((d) => ({ ...d, state: e.target.value }))}
                  placeholder="e.g. Lagos"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 transition-colors" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Street address</label>
              <input type="text" value={draft.address} onChange={(e) => setDraft((d) => ({ ...d, address: e.target.value }))}
                placeholder="e.g. 12 Ahmadu Bello Way"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 transition-colors" />
            </div>
          </div>
        );

      case 3:
        return (
          <div>
            <Counter label="Bedrooms" value={draft.bedrooms} onChange={(v) => setDraft((d) => ({ ...d, bedrooms: v }))} />
            <Counter label="Bathrooms" value={draft.bathrooms} onChange={(v) => setDraft((d) => ({ ...d, bathrooms: v }))} />
            <Counter label="Maximum guests" value={draft.maxGuests} onChange={(v) => setDraft((d) => ({ ...d, maxGuests: v }))} max={20} />
          </div>
        );

      case 4:
        return (
          <div>
            <div className="flex flex-wrap gap-3">
              {AMENITIES.map((amenity) => {
                const selected = draft.amenities.includes(amenity);
                return (
                  <button key={amenity} onClick={() => handleToggleAmenity(amenity)}
                    className={`px-4 py-2.5 rounded-full text-sm font-medium border transition-all ${
                      selected ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-300 hover:border-gray-900"
                    }`}>
                    {selected && <Check className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />}
                    {amenity}
                  </button>
                );
              })}
            </div>
            <p className="text-sm text-gray-500 mt-4">{draft.amenities.length} selected</p>
          </div>
        );

      case 5:
        return (
          <div>
            {draft.images.length > 0 && (
              <div className="mb-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {draft.images.map((img, i) => (
                    <div key={i} className="relative group aspect-[4/3] rounded-xl overflow-hidden">
                      <img src={img} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                      {i === 0 && (
                        <span className="absolute top-2 left-2 bg-white/90 text-xs font-medium px-2 py-1 rounded-md">Cover photo</span>
                      )}
                      <button onClick={() => handleRemoveImage(i)}
                        className="absolute top-2 right-2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white">
                        <X className="w-3.5 h-3.5 text-gray-700" />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-3">
                  {draft.images.length}/7 photos
                  {draft.images.length < 5 && (
                    <span className="text-amber-600 ml-1">— Need at least {5 - draft.images.length} more</span>
                  )}
                </p>
              </div>
            )}
            {draft.images.length < 7 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">
                  {draft.images.length === 0 ? "Choose photos for your listing" : "Add more photos"}
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {SAMPLE_IMAGES.filter((img) => !draft.images.includes(img)).map((img, i) => (
                    <button key={i} onClick={() => handleAddImage(img)}
                      className="relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-gray-900 transition-all group">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <Plus className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  In production, you&apos;ll upload your own photos. These are samples for demo.
                </p>
              </div>
            )}
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price per night</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">₦</span>
                <input type="number" value={draft.basePrice || ""} onChange={(e) => setDraft((d) => ({ ...d, basePrice: Number(e.target.value) }))}
                  placeholder="0"
                  className="w-full pl-10 pr-4 py-4 border border-gray-300 rounded-xl text-2xl font-semibold text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-gray-900 transition-colors" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cleaning fee (optional)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₦</span>
                <input type="number" value={draft.cleaningFee || ""} onChange={(e) => setDraft((d) => ({ ...d, cleaningFee: Number(e.target.value) }))}
                  placeholder="0"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-gray-900 transition-colors" />
              </div>
            </div>
            {draft.basePrice > 0 && (
              <div className="bg-gray-50 rounded-xl p-5 space-y-3">
                <h4 className="text-sm font-medium text-gray-900">Guest price breakdown (2 nights)</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>{formatCurrency(draft.basePrice)} x 2 nights</span>
                    <span>{formatCurrency(draft.basePrice * 2)}</span>
                  </div>
                  {draft.cleaningFee > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Cleaning fee</span>
                      <span>{formatCurrency(draft.cleaningFee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Truvade service fee</span>
                    <span>{formatCurrency(Math.round((draft.basePrice * 2 + draft.cleaningFee) * 0.1))}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-gray-900 pt-2 border-t border-gray-200">
                    <span>Guest total</span>
                    <span>{formatCurrency(Math.round((draft.basePrice * 2 + draft.cleaningFee) * 1.1))}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 7:
        return (
          <div>
            <div className="border border-gray-200 rounded-2xl overflow-hidden">
              {draft.images.length > 0 && (
                <div className="grid grid-cols-4 grid-rows-2 gap-1 h-64 sm:h-80">
                  <div className="col-span-2 row-span-2 relative">
                    <img src={draft.images[0]} alt="Cover" className="w-full h-full object-cover" />
                  </div>
                  {draft.images.slice(1, 5).map((img, i) => (
                    <div key={i} className="relative">
                      <img src={img} alt={`Photo ${i + 2}`} className="w-full h-full object-cover" />
                      {i === 3 && draft.images.length > 5 && (
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <span className="text-white text-sm font-medium">+{draft.images.length - 5} more</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900">{draft.title || "Untitled listing"}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {[draft.city, draft.state].filter(Boolean).join(", ") || "Location not set"}
                </p>
                <div className="flex items-center gap-3 mt-3 text-sm text-gray-600">
                  <span>{draft.maxGuests} guest{draft.maxGuests > 1 ? "s" : ""}</span>
                  <span className="text-gray-300">&middot;</span>
                  <span>{draft.bedrooms} bedroom{draft.bedrooms > 1 ? "s" : ""}</span>
                  <span className="text-gray-300">&middot;</span>
                  <span>{draft.bathrooms} bathroom{draft.bathrooms > 1 ? "s" : ""}</span>
                </div>
                {draft.description && <p className="text-sm text-gray-600 mt-4 leading-relaxed">{draft.description}</p>}
                {draft.amenities.length > 0 && (
                  <div className="mt-5 pt-5 border-t border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Amenities</h3>
                    <div className="flex flex-wrap gap-2">
                      {draft.amenities.map((a) => (
                        <span key={a} className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">{a}</span>
                      ))}
                    </div>
                  </div>
                )}
                {draft.basePrice > 0 && (
                  <div className="mt-5 pt-5 border-t border-gray-100">
                    <span className="text-xl font-bold text-gray-900">{formatCurrency(draft.basePrice)}</span>
                    <span className="text-sm text-gray-500 ml-1">/night</span>
                  </div>
                )}
              </div>
            </div>
            {/* Host assignment */}
            {(() => {
              const verifiedHosts = mockInvitations.filter((inv) => inv.status === "ACCEPTED");
              return (
                <div className="mt-6 border border-gray-200 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Property host</h3>

                  <div className="space-y-2">
                    {/* Owner — default */}
                    <button
                      type="button"
                      onClick={() => setDraft((d) => ({ ...d, assignedHostId: "" }))}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                        !draft.assignedHostId ? "border-[#0B3D2C] bg-[#0B3D2C]/5" : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-[#0B3D2C] flex items-center justify-center text-white text-xs font-medium shrink-0">You</div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Me (Owner)</p>
                        <p className="text-xs text-gray-500">I will host this property</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        !draft.assignedHostId ? "border-[#0B3D2C] bg-[#0B3D2C]" : "border-gray-300"
                      }`}>
                        {!draft.assignedHostId && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </button>

                    {/* Verified hosts */}
                    {verifiedHosts.map((inv) => (
                      <button
                        key={inv.id}
                        type="button"
                        onClick={() => setDraft((d) => ({ ...d, assignedHostId: inv.id }))}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                          draft.assignedHostId === inv.id ? "border-[#0B3D2C] bg-[#0B3D2C]/5" : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-medium shrink-0">
                          {inv.name?.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{inv.name}</p>
                          <p className="text-xs text-gray-500">{inv.role === "CO_HOST" ? "Co-Host" : "Host"} · {inv.commission}%</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          draft.assignedHostId === inv.id ? "border-[#0B3D2C] bg-[#0B3D2C]" : "border-gray-300"
                        }`}>
                          {draft.assignedHostId === inv.id && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </button>
                    ))}
                  </div>

                  {verifiedHosts.length === 0 && (
                    <p className="text-xs text-gray-400 mt-3">You can add hosts from your Hosts page to assign them here.</p>
                  )}
                </div>
              );
            })()}

            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">!</span>
              </div>
              <div>
                <p className="text-sm font-medium text-amber-900">Your listing will be reviewed</p>
                <p className="text-sm text-amber-700 mt-0.5">After publishing, our team reviews your listing before it goes live. Usually 24-48 hours.</p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Step indicator */}
      <div className="mb-8">
        <StepIndicator current={step} total={totalSteps} />
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
        >
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-400 mb-1">Step {step} of {totalSteps}</p>
            <h1 className="text-2xl font-bold text-gray-900">{STEP_TITLES[step]}</h1>
            <p className="text-sm text-gray-500 mt-1">{STEP_SUBTITLES[step]}</p>
          </div>

          {renderStep()}
        </motion.div>
      </AnimatePresence>

      {/* Bottom actions */}
      <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-200">
        <button
          onClick={step === 1 ? () => router.push("/owner/properties") : handleBack}
          className="text-sm font-semibold text-gray-900 underline hover:text-gray-600 transition-colors"
        >
          {step === 1 ? "Cancel" : "Back"}
        </button>

        {step < 7 ? (
          <button onClick={handleNext} disabled={!canProceed}
            className="px-8 py-3 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
            Next
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button onClick={handleSaveDraft} disabled={saving}
              className="px-5 py-3 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors">
              Save as draft
            </button>
            <button onClick={handlePublish} disabled={saving}
              className="px-8 py-3 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-60 transition-all">
              {saving ? "Publishing..." : "Publish listing"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
