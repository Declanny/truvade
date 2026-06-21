"use client";

import { useState, type ChangeEvent } from "react";
import { Upload, X, Camera, ThumbsUp, ThumbsDown, AlertCircle, Loader2 } from "lucide-react";
import Image from "next/image";
import { api, extractErrorMessage } from "@/lib/api";
import type { ApiVerification } from "@/lib/api-types";

interface KYCSubmissionFormProps {
  onSubmitted: (verification: ApiVerification) => void;
  previousRejection?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;

function UploadCard({
  label,
  hint,
  preview,
  onChange,
  onClear,
  acceptCapture,
}: {
  label: string;
  hint: string;
  preview: string | null;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  acceptCapture?: "user" | "environment";
}) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">{label}</p>
      {preview ? (
        <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden border border-gray-200">
          <img
            src={preview}
            alt={label}
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={onClear}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      ) : (
        <div className="w-full aspect-[16/10] rounded-xl border-2 border-dashed border-gray-300 hover:border-[#0B3D2C]/40 hover:bg-[#0B3D2C]/5 transition-colors flex flex-col items-center justify-center gap-3 px-4">
          <Upload className="w-5 h-5 text-[#0B3D2C]" />
          <p className="text-sm text-gray-600 text-center">{hint}</p>
          <div className="flex items-center gap-2">
            <label className="px-3 py-1.5 bg-[#0B3D2C] text-white text-xs font-medium rounded-lg cursor-pointer hover:bg-[#0F5240] transition-colors">
              Choose file
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={onChange}
              />
            </label>
            <label className="px-3 py-1.5 border border-gray-300 text-gray-700 text-xs font-medium rounded-lg cursor-pointer hover:bg-gray-50 transition-colors flex items-center gap-1 md:hidden">
              <Camera className="w-3.5 h-3.5" />
              Snap
              <input
                type="file"
                className="hidden"
                accept="image/*"
                capture={acceptCapture}
                onChange={onChange}
              />
            </label>
          </div>
          <p className="text-[11px] text-gray-400">JPG or PNG, max 5MB</p>
        </div>
      )}
    </div>
  );
}

export function KYCSubmissionForm({
  onSubmitted,
  previousRejection,
}: KYCSubmissionFormProps) {
  const [ninNumber, setNinNumber] = useState("");
  const [idFile, setIdFile] = useState<File | null>(null);
  const [idPreview, setIdPreview] = useState<string | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handlePickFile = (
    e: ChangeEvent<HTMLInputElement>,
    kind: "id" | "selfie"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setError(`${file.name} is larger than 5MB.`);
      return;
    }
    setError("");
    const preview = URL.createObjectURL(file);
    if (kind === "id") {
      if (idPreview) URL.revokeObjectURL(idPreview);
      setIdFile(file);
      setIdPreview(preview);
    } else {
      if (selfiePreview) URL.revokeObjectURL(selfiePreview);
      setSelfieFile(file);
      setSelfiePreview(preview);
    }
  };

  const clearId = () => {
    if (idPreview) URL.revokeObjectURL(idPreview);
    setIdFile(null);
    setIdPreview(null);
  };

  const clearSelfie = () => {
    if (selfiePreview) URL.revokeObjectURL(selfiePreview);
    setSelfieFile(null);
    setSelfiePreview(null);
  };

  const ninValid = /^\d{11}$/.test(ninNumber.trim());
  const canSubmit = ninValid && idFile && selfieFile && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("verification_type", "NIN");
      formData.append("id_number", ninNumber.trim());
      formData.append("id_document", idFile);
      formData.append("selfie", selfieFile);
      const created = await api.post<ApiVerification>(
        "/v1/verifications/",
        formData
      );
      onSubmitted(created);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-gray-900">Identity verification</h2>
      <p className="text-sm text-gray-500 mt-1 mb-6">
        Submit your NIN, a photo of your government-issued ID, and a selfie. Our
        team usually reviews submissions within 24–48 hours.
      </p>

      {previousRejection && (
        <div className="flex items-start gap-2 mb-6 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Your last submission was rejected.</p>
            <p className="text-xs mt-1">{previousRejection}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left — NIN + guidelines */}
        <div className="lg:w-[320px] shrink-0">
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              National Identification Number (NIN)
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={ninNumber}
              onChange={(e) =>
                setNinNumber(e.target.value.replace(/\D/g, "").slice(0, 11))
              }
              placeholder="11-digit NIN"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#0B3D2C] transition-colors tracking-wider"
            />
            <p className="text-xs text-gray-400 mt-1.5">
              {ninNumber.length}/11 digits
            </p>
          </div>

          <div className="mb-5">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Photo guidelines
            </p>
            <div className="space-y-1.5 mb-3">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-sm bg-[#0B3D2C] shrink-0" />
                <span>
                  <span className="font-medium text-gray-900">
                    Bright &amp; clear
                  </span>{" "}
                  <span className="text-gray-500">(good quality)</span>
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-sm bg-[#0B3D2C] shrink-0" />
                <span>
                  <span className="font-medium text-gray-900">Uncut</span>{" "}
                  <span className="text-gray-500">(all corners visible)</span>
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-sm bg-[#0B3D2C] shrink-0" />
                <span>
                  <span className="font-medium text-gray-900">
                    Face matches the ID
                  </span>{" "}
                  <span className="text-gray-500">(for the selfie)</span>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="relative w-20 h-14 rounded-lg overflow-hidden">
                <Image
                  src="/idcard.jpg"
                  alt="Good"
                  fill
                  className="object-cover"
                />
                <ThumbsUp className="absolute bottom-1 right-1 w-4 h-4 text-[#0B3D2C]" />
              </div>
              <div className="relative w-20 h-14 rounded-lg overflow-hidden">
                <Image
                  src="/idcard.jpg"
                  alt="Blurry"
                  fill
                  className="object-cover blur-[2px] opacity-60"
                />
                <ThumbsDown className="absolute bottom-1 right-1 w-4 h-4 text-red-500" />
              </div>
              <div className="relative w-20 h-14 rounded-lg overflow-hidden">
                <Image
                  src="/idcard.jpg"
                  alt="Cropped"
                  fill
                  className="object-cover scale-150 translate-x-4 opacity-60"
                />
                <ThumbsDown className="absolute bottom-1 right-1 w-4 h-4 text-red-500" />
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="hidden lg:flex items-center justify-center gap-2 w-full py-3.5 bg-[#0B3D2C] text-white text-sm font-semibold rounded-xl hover:bg-[#0F5240] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? "Submitting…" : "Submit for review"}
          </button>
        </div>

        {/* Right — Uploads */}
        <div className="flex-1 space-y-4">
          <UploadCard
            label="Government-issued ID"
            hint="Upload a clear photo of your ID"
            preview={idPreview}
            onChange={(e) => handlePickFile(e, "id")}
            onClear={clearId}
            acceptCapture="environment"
          />
          <UploadCard
            label="Selfie"
            hint="Upload a clear selfie holding your ID"
            preview={selfiePreview}
            onChange={(e) => handlePickFile(e, "selfie")}
            onClear={clearSelfie}
            acceptCapture="user"
          />
        </div>
      </div>

      {/* Continue — mobile */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="lg:hidden flex items-center justify-center gap-2 w-full mt-6 py-3.5 bg-[#0B3D2C] text-white text-sm font-semibold rounded-xl hover:bg-[#0F5240] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
        {submitting ? "Submitting…" : "Submit for review"}
      </button>
    </div>
  );
}
