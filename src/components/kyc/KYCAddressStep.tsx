"use client";

import { useState } from "react";
import { Upload, X, Camera } from "lucide-react";

interface KYCAddressStepProps {
  onComplete: () => void;
}

const proofTypes = [
  { value: "utility_bill", label: "Utility Bill", desc: "PHCN, water, or waste bill within 3 months" },
  { value: "bank_statement", label: "Bank Statement", desc: "Any Nigerian bank, within 3 months" },
];

export function KYCAddressStep({ onComplete }: KYCAddressStepProps) {
  const [proofType, setProofType] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const canSubmit = proofType && address && city && state && file;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setPreview(URL.createObjectURL(f)); }
  };

  const clearFile = () => { setFile(null); setPreview(null); };

  const handleSubmit = () => {
    if (!canSubmit) return;
    setUploading(true);
    setTimeout(() => { setUploading(false); onComplete(); }, 1200);
  };

  return (
    <div className="border border-gray-200 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-gray-900">Address verification</h2>
      <p className="text-sm text-gray-500 mt-1 mb-6">
        Enter your residential address and upload a proof document.
      </p>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left — Address form + proof type */}
        <div className="lg:w-[320px] shrink-0">
          <div className="space-y-4 mb-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Street address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 12 Ahmadu Bello Way"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#0B3D2C] transition-colors"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#0B3D2C] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="Lagos"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#0B3D2C] transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Proof type — radio buttons */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-3">Proof of address</label>
            <div className="space-y-2.5">
              {proofTypes.map((pt) => (
                <button
                  key={pt.value}
                  type="button"
                  onClick={() => { setProofType(pt.value); clearFile(); }}
                  className="w-full flex items-start gap-3 text-left"
                >
                  <div className={`w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${
                    proofType === pt.value ? "border-[#0B3D2C] bg-[#0B3D2C]" : "border-gray-300"
                  }`}>
                    {proofType === pt.value && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <div>
                    <span className="text-sm text-gray-900 font-medium">{pt.label}</span>
                    <p className="text-xs text-gray-500 mt-0.5">{pt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Continue — desktop */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || uploading}
            className="hidden lg:block w-full py-3.5 bg-[#0B3D2C] text-white text-sm font-semibold rounded-xl hover:bg-[#0F5240] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            {uploading ? "Saving..." : "Submit for review"}
          </button>
        </div>

        {/* Right — Upload area */}
        <div className="flex-1">
          {proofType ? (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Upload your {proofTypes.find(p => p.value === proofType)?.label.toLowerCase()}</p>
              {preview ? (
                <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden border border-gray-200">
                  <img src={preview} alt="Uploaded document" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={clearFile}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <div className="w-full aspect-[16/10] rounded-xl border-2 border-dashed border-gray-300 hover:border-[#0B3D2C]/40 hover:bg-[#0B3D2C]/5 transition-colors flex flex-col items-center justify-center gap-3">
                  <Upload className="w-5 h-5 text-[#0B3D2C]" />
                  <p className="text-sm text-gray-600">Upload your document</p>
                  <div className="flex items-center gap-2">
                    <label className="px-3 py-1.5 bg-[#0B3D2C] text-white text-xs font-medium rounded-lg cursor-pointer hover:bg-[#0F5240] transition-colors">
                      Choose file
                      <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileChange} />
                    </label>
                    <label className="px-3 py-1.5 border border-gray-300 text-gray-700 text-xs font-medium rounded-lg cursor-pointer hover:bg-gray-50 transition-colors flex items-center gap-1 md:hidden">
                      <Camera className="w-3.5 h-3.5" />
                      Snap
                      <input type="file" className="hidden" accept="image/*" capture="environment" onChange={handleFileChange} />
                    </label>
                  </div>
                  <p className="text-[11px] text-gray-400">JPG, PNG or PDF (max 5MB)</p>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full aspect-[16/10] rounded-xl border border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-2">
              <Upload className="w-6 h-6 text-gray-300" />
              <p className="text-sm text-gray-400">Select a proof type to continue</p>
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
        {uploading ? "Saving..." : "Submit for review"}
      </button>
    </div>
  );
}
