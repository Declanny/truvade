"use client";

import { CalendarDays, MessageSquare, TrendingUp } from "lucide-react";
import { Card, CardHeader, CardBody, Badge, StatBar } from "@/components/ui";
import { KYCBanner } from "@/components/kyc";
import { formatCurrency, formatDate } from "@/lib/types";
import { useWorkspace } from "@/context/WorkspaceContext";

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

export default function HostDashboardPage() {
  const { activeWorkspace, current } = useWorkspace();
  const stats = statsPerWorkspace[activeWorkspace];

  const statCards = [
    { label: "Managed Bookings", value: String(stats.managedBookings), icon: <CalendarDays className="w-6 h-6" /> },
    { label: "Messages", value: String(stats.messages), icon: <MessageSquare className="w-6 h-6" /> },
    { label: "Commission Earned", value: formatCurrency(stats.commissionEarned), icon: <TrendingUp className="w-6 h-6" /> },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Host Dashboard</h1>
        <p className="text-gray-500 mt-1 pl-5">
          Managing properties for {current.orgName}
        </p>
      </div>

      {/* KYC Banner */}
      <div className="mb-6">
        <KYCBanner />
      </div>

      {/* Stats */}
      <div className="mb-8">
        <StatBar items={statCards} />
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
