"use client";

import { useState } from "react";
import { Shield, ChevronDown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { KYCStatus } from "@/lib/types";

const KYC_STATUSES: KYCStatus[] = ["NOT_STARTED", "PENDING_REVIEW", "APPROVED", "REJECTED"];

export function DevUserSwitcher() {
  const { user, updateKYCStatus } = useAuth();
  const [open, setOpen] = useState(false);

  if (process.env.NODE_ENV === "production") return null;
  if (!user) return null;
  if (user.roles[0] !== "OWNER" && user.roles[0] !== "HOST") return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-gray-900 text-white text-xs px-3 py-2 rounded-full shadow-lg hover:bg-gray-800 transition-colors"
      >
        <Shield className="w-3.5 h-3.5" />
        <span>KYC: {user.kycStatus.replace(/_/g, " ")}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-3 border-b border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Dev: KYC Override
            </p>
          </div>
          <div className="p-3 flex flex-col gap-1">
            {KYC_STATUSES.map((status) => (
              <button
                key={status}
                onClick={() => {
                  updateKYCStatus(status);
                  setOpen(false);
                }}
                className={`text-xs px-3 py-2 rounded-lg text-left transition-colors ${
                  user.kycStatus === status
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {status.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
