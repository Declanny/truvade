"use client";

import { motion } from "framer-motion";
import { TrendingUp, Clock, ArrowDownToLine } from "lucide-react";
import { Card, CardHeader, Badge } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/types";

const summaryCards = [
  { label: "Total Earned", value: formatCurrency(2450000), icon: <TrendingUp className="w-6 h-6" />, bg: "bg-[#0B3D2C]" },
  { label: "Pending Payout", value: formatCurrency(380000), icon: <Clock className="w-6 h-6" />, bg: "bg-[#0B3D2C]" },
  { label: "Last Payout", value: formatCurrency(520000), icon: <ArrowDownToLine className="w-6 h-6" />, bg: "bg-[#0B3D2C]" },
];

interface PayoutEntry {
  id: string;
  date: string;
  amount: number;
  status: "completed" | "pending" | "processing";
  bookingRef: string;
  property: string;
}

const payoutHistory: PayoutEntry[] = [
  { id: "po-001", date: "2026-03-15", amount: 520000, status: "completed", bookingRef: "BK-003", property: "Penthouse with Rooftop Pool" },
  { id: "po-002", date: "2026-03-10", amount: 320000, status: "completed", bookingRef: "BK-001", property: "Luxury 3-Bedroom Apartment" },
  { id: "po-003", date: "2026-03-05", amount: 95000, status: "completed", bookingRef: "BK-002", property: "Cozy Studio in Lekki" },
  { id: "po-004", date: "2026-03-18", amount: 180000, status: "processing", bookingRef: "BK-004", property: "Family Home in Maitama" },
  { id: "po-005", date: "2026-03-20", amount: 120000, status: "pending", bookingRef: "BK-005", property: "Serviced Apartment Ikeja" },
  { id: "po-006", date: "2026-03-22", amount: 80000, status: "pending", bookingRef: "BK-006", property: "Waterfront Apartment PH" },
  { id: "po-007", date: "2026-02-28", amount: 450000, status: "completed", bookingRef: "BK-007", property: "Penthouse with Rooftop Pool" },
  { id: "po-008", date: "2026-02-20", amount: 280000, status: "completed", bookingRef: "BK-008", property: "Luxury 3-Bedroom Apartment" },
];

const statusVariant: Record<string, "success" | "warning" | "info"> = {
  completed: "success",
  pending: "warning",
  processing: "info",
};

export default function OwnerPayoutsPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 border-l-4 border-[#0B3D2C] pl-4 mb-6">Payouts</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {summaryCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card className={`${card.bg} border-none`} padding="lg">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-white/70 font-medium">{card.label}</p>
                  <p className="text-2xl font-bold text-white mt-1">{card.value}</p>
                </div>
                <div className="bg-white/15 text-white p-2.5 rounded-lg">
                  {card.icon}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Payout History Table */}
      <Card variant="bordered" padding="none">
        <CardHeader className="px-6 pt-5 pb-4">
          <h2 className="text-lg font-semibold text-gray-900">Payout History</h2>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Property</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Booking Ref</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {payoutHistory.map((payout) => (
                <tr key={payout.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3.5 text-gray-600 whitespace-nowrap">
                    {formatDate(payout.date)}
                  </td>
                  <td className="px-6 py-3.5 text-gray-900 font-medium max-w-[200px] truncate">
                    {payout.property}
                  </td>
                  <td className="px-6 py-3.5 text-gray-500 font-mono text-xs">
                    {payout.bookingRef}
                  </td>
                  <td className="px-6 py-3.5 font-semibold text-gray-900">
                    {formatCurrency(payout.amount)}
                  </td>
                  <td className="px-6 py-3.5">
                    <Badge variant={statusVariant[payout.status]} size="sm">
                      {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
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
