"use client";

import { useState } from "react";
import { Upload, Check } from "lucide-react";

interface KYCAddressStepProps {
  onComplete: () => void;
}

const proofTypes = [
  { value: "utility_bill", label: "Utility Bill (3 months)" },
  { value: "bank_statement", label: "Bank Statement (3 months)" },
  { value: "tenancy_agreement", label: "Tenancy Agreement" },
];

export function KYCAddressStep({ onComplete }: KYCAddressStepProps) {
  const [proofType, setProofType] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const canSubmit = proofType && address && city && state && file;

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
      <h2 className="text-lg font-semibold text-gray-900">Address</h2>
      <p className="text-sm text-gray-500 mt-1 mb-6">
        Your residential address and a proof document.
      </p>

      <div className="space-y-4 mb-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Street address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. 12 Ahmadu Bello Way"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 transition-colors"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Lagos"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="Lagos"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Proof type — selection buttons */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">Proof of address</label>
        <div className="space-y-2">
          {proofTypes.map((pt) => (
            <button
              key={pt.value}
              onClick={() => setProofType(pt.value)}
              className={`w-full px-4 py-3 rounded-xl border-2 text-sm font-medium text-left transition-all ${
                proofType === pt.value
                  ? "border-gray-900 bg-gray-50 text-gray-900"
                  : "border-gray-200 text-gray-600 hover:border-gray-400"
              }`}
            >
              {pt.label}
            </button>
          ))}
        </div>
      </div>

      {/* File upload */}
      {proofType && (
        <div className="mb-6">
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
                <span className="text-sm text-gray-500 flex-1">Upload document</span>
                <span className="text-xs text-gray-400">JPG, PNG, PDF</span>
              </>
            )}
            <input
              type="file"
              className="hidden"
              accept="image/*,.pdf"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setFile(f);
              }}
            />
          </label>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!canSubmit || uploading}
        className="w-full px-6 py-3 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        {uploading ? "Saving..." : "Continue"}
      </button>
    </div>
  );
}
