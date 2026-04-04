"use client";

import { motion } from "framer-motion";
import { Building2, CalendarDays, TrendingUp, CreditCard, UserPlus } from "lucide-react";
import { Card, CardHeader, Badge, StatBar } from "@/components/ui";
import { KYCBanner } from "@/components/kyc";
import { formatCurrency, formatDate } from "@/lib/types";
import Link from "next/link";

const stats = [
  { label: "Total Properties", value: "6", icon: <Building2 className="w-6 h-6" />, change: "+2 this month", bg: "bg-[#0B3D2C]" },
  { label: "Active Bookings", value: "12", icon: <CalendarDays className="w-6 h-6" />, change: "+5 this week", bg: "bg-[#0B3D2C]" },
  { label: "Total Revenue", value: formatCurrency(2450000), icon: <TrendingUp className="w-6 h-6" />, change: "+18% vs last month", bg: "bg-[#0B3D2C]" },
  { label: "Pending Payouts", value: formatCurrency(380000), icon: <CreditCard className="w-6 h-6" />, change: "3 pending", bg: "bg-[#B87333]" },
];

const recentBookings = [
  { id: "BK-001", guest: "Adaeze Nwosu", property: "Luxury 3-Bedroom Apartment", checkIn: "2026-04-01", checkOut: "2026-04-05", amount: 355000, status: "CONFIRMED" as const },
  { id: "BK-002", guest: "Emeka Obi", property: "Cozy Studio in Lekki", checkIn: "2026-04-03", checkOut: "2026-04-06", amount: 110000, status: "PENDING" as const },
  { id: "BK-003", guest: "Fatima Bello", property: "Penthouse with Rooftop Pool", checkIn: "2026-04-10", checkOut: "2026-04-15", amount: 775000, status: "CONFIRMED" as const },
  { id: "BK-004", guest: "Kola Adeyemi", property: "Family Home in Maitama", checkIn: "2026-03-20", checkOut: "2026-03-25", amount: 620000, status: "CHECKED_IN" as const },
  { id: "BK-005", guest: "Amina Yusuf", property: "Serviced Apartment in Ikeja", checkIn: "2026-03-15", checkOut: "2026-03-18", amount: 141000, status: "CHECKED_OUT" as const },
];

const statusVariant: Record<string, "success" | "warning" | "info" | "gray"> = {
  CONFIRMED: "success",
  PENDING: "warning",
  CHECKED_IN: "info",
  CHECKED_OUT: "gray",
};

export default function OwnerDashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back!</h1>
        <p className="text-gray-500 mt-1 pl-5">Here is an overview of your properties and bookings.</p>
      </div>

      {/* KYC Banner */}
      <div className="mb-6">
        <KYCBanner />
      </div>

      {/* Stats */}
      <div className="mb-8">
        <StatBar items={stats} />
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Link href="/owner/properties">
          <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:border-[#0B3D2C] transition-colors">
            <Building2 className="w-4 h-4" /> Add Property
          </motion.button>
        </Link>
        <Link href="/owner/hosts">
          <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:border-[#0B3D2C] transition-colors">
            <UserPlus className="w-4 h-4" /> Invite Host
          </motion.button>
        </Link>
        <Link href="/owner/payouts">
          <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.48 }}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:border-[#0B3D2C] transition-colors">
            <CreditCard className="w-4 h-4" /> View Payouts
          </motion.button>
        </Link>
      </div>

      {/* Recent Bookings - Full Width */}
      <Card variant="bordered" padding="none">
        <CardHeader className="px-6 pt-5 pb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Bookings</h2>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Guest</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Property</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Dates</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3.5 font-medium text-gray-900">{booking.guest}</td>
                  <td className="px-6 py-3.5 text-gray-600 max-w-[180px] truncate">{booking.property}</td>
                  <td className="px-6 py-3.5 text-gray-500 whitespace-nowrap">
                    {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
                  </td>
                  <td className="px-6 py-3.5">
                    <Badge variant={statusVariant[booking.status] || "gray"} size="sm">
                      {booking.status.replace("_", " ")}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
