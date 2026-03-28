"use client";

import { useState } from "react";
import { Upload, X, Camera, ThumbsUp, ThumbsDown } from "lucide-react";
import Image from "next/image";
import type { KYCDocumentType } from "@/lib/types";

interface KYCIdentityStepProps {
  onComplete: () => void;
}

const documentTypes: { value: KYCDocumentType; label: string }[] = [
  { value: "NATIONAL_ID", label: "National ID (NIN)" },
  { value: "PASSPORT", label: "Passport" },
  { value: "DRIVERS_LICENSE", label: "Driver's License" },
  { value: "VOTERS_CARD", label: "Voter's Card" },
];

function UploadCard({ label, placeholder, file, preview, onFileChange, onClear }: {
  label: string;
  placeholder: string;
  file: File | null;
  preview: string | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">{label}</p>
      {preview ? (
        <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden border border-gray-200">
          <img src={preview} alt={label} className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={onClear}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      ) : (
        <div className="w-full aspect-[16/10] rounded-xl border-2 border-dashed border-gray-300 hover:border-[#0B3D2C]/40 hover:bg-[#0B3D2C]/5 transition-colors flex flex-col items-center justify-center gap-3 relative">
          {/* Example watermark */}
          <Image src={placeholder} alt="" fill className="object-cover opacity-[0.06] rounded-xl" />
          <div className="relative flex flex-col items-center gap-2">
            <Upload className="w-5 h-5 text-[#0B3D2C]" />
            <p className="text-sm text-gray-600">Upload {label.toLowerCase()}</p>
          </div>
          {/* Two input options: gallery + camera */}
          <div className="relative flex items-center gap-2">
            <label className="px-3 py-1.5 bg-[#0B3D2C] text-white text-xs font-medium rounded-lg cursor-pointer hover:bg-[#0F5240] transition-colors">
              Choose file
              <input type="file" className="hidden" accept="image/*,.pdf" onChange={onFileChange} />
            </label>
            {/* Camera — uses capture="environment" for back camera on mobile */}
            <label className="px-3 py-1.5 border border-gray-300 text-gray-700 text-xs font-medium rounded-lg cursor-pointer hover:bg-gray-50 transition-colors flex items-center gap-1 md:hidden">
              <Camera className="w-3.5 h-3.5" />
              Snap
              <input type="file" className="hidden" accept="image/*" capture="environment" onChange={onFileChange} />
            </label>
          </div>
          <p className="relative text-[11px] text-gray-400">JPG, PNG or PDF (max 5MB)</p>
        </div>
      )}
    </div>
  );
}

export function KYCIdentityStep({ onComplete }: KYCIdentityStepProps) {
  const [docType, setDocType] = useState<KYCDocumentType | "">("");
  const [bvnOrNin, setBvnOrNin] = useState("");
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const needsBack = docType !== "PASSPORT" && docType !== "";
  const canSubmit = docType && frontFile && bvnOrNin.length >= 10 && (!needsBack || backFile);

  const handleFrontChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setFrontFile(f); setFrontPreview(URL.createObjectURL(f)); }
  };
  const handleBackChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setBackFile(f); setBackPreview(URL.createObjectURL(f)); }
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    setUploading(true);
    setTimeout(() => { setUploading(false); onComplete(); }, 1200);
  };

  return (
    <div className="border border-gray-200 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-gray-900">Verification required</h2>
      <p className="text-sm text-gray-500 mt-1 mb-6">
        Provide your BVN or NIN and upload both sides of your government-issued ID.
      </p>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left — Form fields */}
        <div className="lg:w-[320px] shrink-0">
          {/* BVN / NIN */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">BVN or NIN</label>
            <input
              type="text"
              inputMode="numeric"
              value={bvnOrNin}
              onChange={(e) => setBvnOrNin(e.target.value.replace(/\D/g, "").slice(0, 11))}
              placeholder="Enter your 11-digit BVN or NIN"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#0B3D2C] transition-colors"
            />
            <p className="text-xs text-gray-400 mt-1.5">Kept secure and encrypted.</p>
          </div>

          {/* Document type */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-3">Choose your document type</label>
            <div className="space-y-2.5">
              {documentTypes.map((dt) => (
                <button
                  key={dt.value}
                  type="button"
                  onClick={() => { setDocType(dt.value); setFrontFile(null); setFrontPreview(null); setBackFile(null); setBackPreview(null); }}
                  className="w-full flex items-center gap-3 text-left"
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    docType === dt.value ? "border-[#0B3D2C] bg-[#0B3D2C]" : "border-gray-300"
                  }`}>
                    {docType === dt.value && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <span className="text-sm text-gray-900">{dt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Guidelines */}
          {docType && (
            <div className="mb-5">
              <p className="text-sm font-medium text-gray-700 mb-2">Photo guidelines:</p>
              <div className="space-y-1.5 mb-3">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-sm bg-[#0B3D2C] shrink-0" />
                  <span><span className="font-medium text-gray-900">bright and clear</span> <span className="text-gray-500">(good quality)</span></span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-sm bg-[#0B3D2C] shrink-0" />
                  <span><span className="font-medium text-gray-900">uncut</span> <span className="text-gray-500">(all corners visible)</span></span>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="relative w-20 h-14 rounded-lg overflow-hidden">
                  <Image src="/idcard.jpg" alt="Good" fill className="object-cover" />
                  <ThumbsUp className="absolute bottom-1 right-1 w-4 h-4 text-[#0B3D2C]" />
                </div>
                <div className="relative w-20 h-14 rounded-lg overflow-hidden">
                  <Image src="/idcard.jpg" alt="Blurry" fill className="object-cover blur-[2px] opacity-60" />
                  <ThumbsDown className="absolute bottom-1 right-1 w-4 h-4 text-red-500" />
                </div>
                <div className="relative w-20 h-14 rounded-lg overflow-hidden">
                  <Image src="/idcard.jpg" alt="Cropped" fill className="object-cover scale-150 translate-x-4 opacity-60" />
                  <ThumbsDown className="absolute bottom-1 right-1 w-4 h-4 text-red-500" />
                </div>
              </div>
            </div>
          )}

          {/* Continue — desktop */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || uploading}
            className="hidden lg:block w-full py-3.5 bg-[#0B3D2C] text-white text-sm font-semibold rounded-xl hover:bg-[#0F5240] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            {uploading ? "Verifying..." : "Continue"}
          </button>
        </div>

        {/* Right — Upload areas */}
        <div className="flex-1 space-y-4">
          {docType ? (
            <>
              <UploadCard
                label="Front of ID"
                placeholder="/idcard.jpg"
                file={frontFile}
                preview={frontPreview}
                onFileChange={handleFrontChange}
                onClear={() => { setFrontFile(null); setFrontPreview(null); }}
              />
              {needsBack && (
                <UploadCard
                  label="Back of ID"
                  placeholder="/idback.webp"
                  file={backFile}
                  preview={backPreview}
                  onFileChange={handleBackChange}
                  onClear={() => { setBackFile(null); setBackPreview(null); }}
                />
              )}
            </>
          ) : (
            <div className="w-full aspect-[16/10] rounded-xl border border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-2">
              <Upload className="w-6 h-6 text-gray-300" />
              <p className="text-sm text-gray-400">Select a document type to continue</p>
            </div>
          )}
        </div>
      </div>

      {/* Continue — mobile */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit || uploading}
        className="lg:hidden w-full mt-6 py-3.5 bg-[#0B3D2C] text-white text-sm font-semibold rounded-xl hover:bg-[#0F5240] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        {uploading ? "Verifying..." : "Continue"}
      </button>
    </div>
  );
}
