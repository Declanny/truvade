"use client";

import { useState } from "react";
import { Upload, FileText, Check } from "lucide-react";
import type { KYCDocumentType } from "@/lib/types";

interface KYCIdentityStepProps {
  onComplete: () => void;
}

const documentTypes: { value: KYCDocumentType; label: string }[] = [
  { value: "NATIONAL_ID", label: "National ID (NIN)" },
  { value: "PASSPORT", label: "International Passport" },
  { value: "DRIVERS_LICENSE", label: "Driver's License" },
  { value: "VOTERS_CARD", label: "Voter's Card" },
];

export function KYCIdentityStep({ onComplete }: KYCIdentityStepProps) {
  const [docType, setDocType] = useState<KYCDocumentType | "">("");
  const [bvnOrNin, setBvnOrNin] = useState("");
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const canSubmit = docType && frontFile && bvnOrNin.length >= 10;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      onComplete();
    }, 1200);
  };

  return (
    <div className="border border-gray-200 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-gray-900">Identity</h2>
      <p className="text-sm text-gray-500 mt-1 mb-6">
        Provide your BVN or NIN and a government-issued ID.
      </p>

      {/* BVN / NIN */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">BVN or NIN</label>
        <input
          type="text"
          inputMode="numeric"
          value={bvnOrNin}
          onChange={(e) => setBvnOrNin(e.target.value.replace(/\D/g, "").slice(0, 11))}
          placeholder="11-digit BVN or NIN"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 transition-colors"
        />
        <p className="text-xs text-gray-400 mt-1.5">Kept secure and encrypted.</p>
      </div>

      {/* Document type — selection buttons */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">ID Document</label>
        <div className="grid grid-cols-2 gap-2">
          {documentTypes.map((dt) => (
            <button
              key={dt.value}
              onClick={() => setDocType(dt.value)}
              className={`px-3 py-2.5 rounded-xl border-2 text-sm font-medium text-left transition-all ${
                docType === dt.value
                  ? "border-gray-900 bg-gray-50 text-gray-900"
                  : "border-gray-200 text-gray-600 hover:border-gray-400"
              }`}
            >
              {dt.label}
            </button>
          ))}
        </div>
      </div>

      {/* File uploads — compact rows */}
      {docType && (
        <div className="space-y-2 mb-6">
          <FileRow label="Front of ID" file={frontFile} onFileSelect={setFrontFile} />
          {docType !== "PASSPORT" && (
            <FileRow label="Back of ID" file={backFile} onFileSelect={setBackFile} optional />
          )}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit || uploading}
        className="w-full px-6 py-3 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        {uploading ? "Verifying..." : "Continue"}
      </button>
    </div>
  );
}

function FileRow({
  label,
  file,
  onFileSelect,
  optional,
}: {
  label: string;
  file: File | null;
  onFileSelect: (f: File) => void;
  optional?: boolean;
}) {
  return (
    <label className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border cursor-pointer transition-all ${
      file ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-400"
    }`}>
      {file ? (
        <>
          <div className="w-5 h-5 rounded-full bg-gray-900 flex items-center justify-center shrink-0">
            <Check className="w-3 h-3 text-white" />
          </div>
          <span className="text-sm text-gray-900 font-medium truncate flex-1">{file.name}</span>
        </>
      ) : (
        <>
          <Upload className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="text-sm text-gray-500 flex-1">
            {label}{optional ? " (optional)" : ""}
          </span>
          <span className="text-xs text-gray-400">JPG, PNG, PDF</span>
        </>
      )}
      <input
        type="file"
        className="hidden"
        accept="image/*,.pdf"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFileSelect(f);
        }}
      />
    </label>
  );
}
