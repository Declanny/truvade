"use client";

import { useState } from "react";
import { ChevronDown, Building2 } from "lucide-react";
import { useWorkspace } from "@/context/WorkspaceContext";

export function WorkspaceSwitcher() {
  const { workspaces, activeWorkspace, setActiveWorkspace, current } = useWorkspace();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5 hover:border-[#0B3D2C] transition-colors text-sm"
      >
        <Building2 className="w-4 h-4 text-[#0B3D2C]" />
        <span className="font-medium text-gray-900">{current.orgName}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => {
                  setActiveWorkspace(ws.id);
                  setOpen(false);
                }}
                className={`flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors ${
                  ws.id === activeWorkspace ? "bg-[#0B3D2C]/5" : ""
                }`}
              >
                <Building2 className="w-4 h-4 text-[#0B3D2C]" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{ws.orgName}</p>
                  <p className="text-xs text-gray-500">{ws.propertyCount} properties</p>
                </div>
                {ws.id === activeWorkspace && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-[#0B3D2C]" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
