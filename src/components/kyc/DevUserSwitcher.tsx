"use client";

import { useState } from "react";
import { Users, ChevronDown, Shield } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { mockUsers } from "@/lib/mock-data";
import { Badge } from "@/components/ui/Badge";

const kycBadgeVariant = {
  NOT_STARTED: "gray",
  IN_PROGRESS: "info",
  PENDING_REVIEW: "warning",
  APPROVED: "success",
  REJECTED: "error",
} as const;

export function DevUserSwitcher() {
  const { user, switchUser, updateKYCStatus } = useAuth();
  const [open, setOpen] = useState(false);

  if (process.env.NODE_ENV === "production") return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-gray-900 text-white text-xs px-3 py-2 rounded-full shadow-lg hover:bg-gray-800 transition-colors"
      >
        <Users className="w-3.5 h-3.5" />
        <span>{user?.name || "No user"}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-3 border-b border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Dev: Switch User</p>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {mockUsers.map((u) => (
              <button
                key={u.id}
                onClick={() => {
                  switchUser(u.id);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors ${
                  user?.id === u.id ? "bg-primary/5" : ""
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden shrink-0">
                  {u.avatar && (
                    <img src={u.avatar} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{u.name}</p>
                  <p className="text-xs text-gray-500">
                    {u.roles.join(", ")}
                  </p>
                </div>
                <Badge variant={kycBadgeVariant[u.kycStatus]} size="sm">
                  {u.kycStatus.replace("_", " ")}
                </Badge>
              </button>
            ))}
          </div>
          {/* Quick KYC status override */}
          {user && (user.roles.includes("OWNER") || user.roles.includes("HOST")) && (
            <div className="p-3 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-2">Quick KYC Override</p>
              <div className="flex flex-wrap gap-1">
                {(["NOT_STARTED", "PENDING_REVIEW", "APPROVED", "REJECTED"] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      updateKYCStatus(status);
                      setOpen(false);
                    }}
                    className={`text-xs px-2 py-1 rounded-md transition-colors ${
                      user.kycStatus === status
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {status.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
