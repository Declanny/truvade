"use client";

import { useState } from "react";
import { Upload, Check } from "lucide-react";

interface KYCBusinessStepProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function KYCBusinessStep({ onComplete, onSkip }: KYCBusinessStepProps) {
  const [regNumber, setRegNumber] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const canSubmit = regNumber && businessName;

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
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-semibold text-gray-900">Business</h2>
        <span className="text-xs text-gray-400 font-medium">Optional</span>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Add your CAC details for a verified business badge.
      </p>

      <div className="space-y-4 mb-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Business name</label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="e.g. TruVade Properties Ltd"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">CAC registration number</label>
          <input
            type="text"
            value={regNumber}
            onChange={(e) => setRegNumber(e.target.value)}
            placeholder="e.g. RC-1234567"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 transition-colors"
          />
        </div>
      </div>

      {/* Optional certificate upload */}
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
              <span className="text-sm text-gray-500 flex-1">CAC certificate (optional)</span>
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

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={onSkip}
          className="text-sm font-semibold text-gray-900 underline hover:text-gray-600 transition-colors"
        >
          Skip for now
        </button>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || uploading}
          className="px-6 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          {uploading ? "Submitting..." : "Submit"}
        </button>
      </div>
    </div>
  );
}
