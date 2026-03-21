"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, CalendarDays, MessageSquare, TrendingUp, Building2 } from "lucide-react";
import { Card, CardHeader, CardBody, Badge } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/types";

interface Workspace {
  id: string;
  orgName: string;
  propertyCount: number;
}

const workspaces: Workspace[] = [
  { id: "org-1", orgName: "TruVade Properties Ltd", propertyCount: 4 },
  { id: "org-2", orgName: "Ikoyi Luxury Stays", propertyCount: 2 },
];

interface WorkspaceStats {
  managedBookings: number;
  messages: number;
  commissionEarned: number;
}

const statsPerWorkspace: Record<string, WorkspaceStats> = {
  "org-1": { managedBookings: 8, messages: 14, commissionEarned: 285000 },
  "org-2": { managedBookings: 3, messages: 5, commissionEarned: 120000 },
};

const recentBookings = [
  { id: "BK-101", guest: "Adaeze Nwosu", property: "Luxury 3-Bedroom Apartment", checkIn: "2026-04-01", status: "CONFIRMED" },
  { id: "BK-102", guest: "Emeka Obi", property: "Cozy Studio in Lekki", checkIn: "2026-04-03", status: "PENDING" },
  { id: "BK-103", guest: "Fatima Bello", property: "Serviced Apartment Ikeja", checkIn: "2026-04-05", status: "CONFIRMED" },
  { id: "BK-104", guest: "Kola Adeyemi", property: "Luxury 3-Bedroom Apartment", checkIn: "2026-03-28", status: "CHECKED_IN" },
];

const statusVariant: Record<string, "success" | "warning" | "info" | "gray"> = {
  CONFIRMED: "success",
  PENDING: "warning",
  CHECKED_IN: "info",
  CHECKED_OUT: "gray",
};

function WorkspaceSwitcher({
  workspaces,
  selected,
  onSelect,
}: {
  workspaces: Workspace[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = workspaces.find((w) => w.id === selected);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-[#0B3D2C] transition-colors w-full sm:w-auto"
      >
        <div className="w-9 h-9 rounded-lg bg-[#0B3D2C]/10 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-[#0B3D2C]" />
        </div>
        <div className="text-left">
          <p className="text-sm font-semibold text-gray-900">{current?.orgName}</p>
          <p className="text-xs text-gray-500">{current?.propertyCount} properties</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 ml-2 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => {
                  onSelect(ws.id);
                  setOpen(false);
                }}
                className={`flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                  ws.id === selected ? "bg-[#0B3D2C]/5" : ""
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-[#0B3D2C]/10 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-[#0B3D2C]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{ws.orgName}</p>
                  <p className="text-xs text-gray-500">{ws.propertyCount} properties</p>
                </div>
                {ws.id === selected && (
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

export default function HostDashboardPage() {
  const [activeWorkspace, setActiveWorkspace] = useState(workspaces[0].id);
  const stats = statsPerWorkspace[activeWorkspace];

  const statCards = [
    { label: "Managed Bookings", value: String(stats.managedBookings), icon: <CalendarDays className="w-6 h-6" />, bg: "bg-[#0B3D2C]" },
    { label: "Messages", value: String(stats.messages), icon: <MessageSquare className="w-6 h-6" />, bg: "bg-[#0B3D2C]" },
    { label: "Commission Earned", value: formatCurrency(stats.commissionEarned), icon: <TrendingUp className="w-6 h-6" />, bg: "bg-[#0B3D2C]" },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Workspace Switcher */}
      <div className="mb-6">
        <WorkspaceSwitcher
          workspaces={workspaces}
          selected={activeWorkspace}
          onSelect={setActiveWorkspace}
        />
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Host Dashboard</h1>
        <p className="text-gray-500 mt-1 pl-5">
          Managing properties for {workspaces.find((w) => w.id === activeWorkspace)?.orgName}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card className={`${stat.bg} border-none`} padding="lg">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-white/70 font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                </div>
                <div className="bg-white/15 text-white p-2.5 rounded-lg">{stat.icon}</div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Bookings */}
      <Card variant="bordered" padding="none">
        <CardHeader className="px-6 pt-5 pb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Bookings</h2>
        </CardHeader>
        <CardBody className="p-0">
          <div className="divide-y divide-gray-50">
            {recentBookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-600">
                    {booking.guest.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{booking.guest}</p>
                    <p className="text-xs text-gray-500">{booking.property}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500 hidden sm:block">
                    {formatDate(booking.checkIn)}
                  </span>
                  <Badge variant={statusVariant[booking.status] || "gray"} size="sm">
                    {booking.status.replace("_", " ")}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
