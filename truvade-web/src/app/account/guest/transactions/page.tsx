"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardHeader, Badge } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/types";

type PaymentStatus = "completed" | "pending" | "refunded";

interface GuestTransaction {
  id: string;
  amount: number;
  description: string;
  property: string;
  reference: string;
  status: PaymentStatus;
  date: string;
}

const statusVariant: Record<PaymentStatus, "success" | "warning" | "error"> = {
  completed: "success",
  pending: "warning",
  refunded: "error",
};

const statusOptions: PaymentStatus[] = ["completed", "pending", "refunded"];

const ITEMS_PER_PAGE = 5;

const mockTransactions: GuestTransaction[] = [
  { id: "gt-001", amount: 260000, description: "Booking payment", property: "Penthouse with Rooftop Pool", reference: "BK-003", status: "completed", date: "2026-03-15" },
  { id: "gt-002", amount: 160000, description: "Booking payment", property: "Luxury 3-Bedroom Apartment", reference: "BK-001", status: "completed", date: "2026-03-10" },
  { id: "gt-003", amount: 47500, description: "Booking payment", property: "Cozy Studio in Lekki", reference: "BK-002", status: "completed", date: "2026-03-05" },
  { id: "gt-004", amount: 90000, description: "Booking payment — awaiting confirmation", property: "Family Home in Maitama", reference: "BK-004", status: "pending", date: "2026-03-18" },
  { id: "gt-005", amount: 60000, description: "Booking payment — awaiting confirmation", property: "Serviced Apartment Ikeja", reference: "BK-005", status: "pending", date: "2026-03-22" },
  { id: "gt-006", amount: 225000, description: "Booking payment", property: "Penthouse with Rooftop Pool", reference: "BK-007", status: "completed", date: "2026-02-28" },
  { id: "gt-007", amount: 140000, description: "Booking payment", property: "Luxury 3-Bedroom Apartment", reference: "BK-008", status: "completed", date: "2026-02-20" },
  { id: "gt-008", amount: 47500, description: "Refund — cancelled booking", property: "Cozy Studio in Lekki", reference: "BK-009", status: "refunded", date: "2026-02-15" },
];

export default function GuestTransactionsPage() {
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "all">("all");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = useMemo(() => {
    let list = [...mockTransactions];
    if (statusFilter !== "all") list = list.filter((t) => t.status === statusFilter);
    if (dateFrom) list = list.filter((t) => t.date >= dateFrom);
    if (dateTo) list = list.filter((t) => t.date <= dateTo);
    return list;
  }, [statusFilter, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Transaction History</h1>

      <Card variant="bordered" padding="none">
        <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-5 pb-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-900">Payments</h2>

              {/* Desktop: date + status inline */}
              <div className="hidden sm:flex items-center gap-2">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-primary"
                />
                <span className="text-xs text-gray-400">to</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-primary"
                />
                <StatusDropdown
                  statusFilter={statusFilter}
                  isOpen={isDropdownOpen}
                  onToggle={() => setIsDropdownOpen((p) => !p)}
                  onSelect={(s) => { setStatusFilter(s); setCurrentPage(1); setIsDropdownOpen(false); }}
                />
              </div>

              {/* Mobile: status only */}
              <div className="sm:hidden">
                <StatusDropdown
                  statusFilter={statusFilter}
                  isOpen={isDropdownOpen}
                  onToggle={() => setIsDropdownOpen((p) => !p)}
                  onSelect={(s) => { setStatusFilter(s); setCurrentPage(1); setIsDropdownOpen(false); }}
                />
              </div>
            </div>

            {/* Mobile: date range */}
            <div className="flex sm:hidden items-center gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
                className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-primary"
              />
              <span className="text-xs text-gray-400 shrink-0">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
                className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </CardHeader>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Property</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ref</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-400">No transactions found.</td>
                </tr>
              ) : (
                paginated.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3.5 text-gray-600 whitespace-nowrap">{formatDate(tx.date)}</td>
                    <td className="px-6 py-3.5 text-gray-900 max-w-[200px] truncate">{tx.description}</td>
                    <td className="px-6 py-3.5 text-gray-500 max-w-[180px] truncate">{tx.property}</td>
                    <td className="px-6 py-3.5 text-gray-500 font-mono text-xs">{tx.reference}</td>
                    <td className="px-6 py-3.5 font-semibold text-gray-900 whitespace-nowrap">{formatCurrency(tx.amount)}</td>
                    <td className="px-6 py-3.5">
                      <Badge variant={statusVariant[tx.status]} size="sm">
                        {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile card list */}
        <div className="sm:hidden divide-y divide-gray-50">
          {paginated.length === 0 ? (
            <p className="px-4 py-12 text-center text-sm text-gray-400">No transactions found.</p>
          ) : (
            paginated.map((tx) => (
              <div key={tx.id} className="px-4 py-3.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900 truncate max-w-[60%]">{tx.property}</span>
                  <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">{formatCurrency(tx.amount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{formatDate(tx.date)} · {tx.reference}</span>
                  <Badge variant={statusVariant[tx.status]} size="sm">
                    {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {filtered.length > ITEMS_PER_PAGE && (
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-100">
            <span className="text-sm text-gray-500">
              {filtered.length} transaction{filtered.length !== 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 text-sm text-gray-700">{currentPage} of {totalPages}</span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function StatusDropdown({
  statusFilter,
  isOpen,
  onToggle,
  onSelect,
}: {
  statusFilter: PaymentStatus | "all";
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (s: PaymentStatus | "all") => void;
}) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        {statusFilter === "all" ? "All statuses" : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
        <div className="absolute right-0 z-10 mt-1 w-36 rounded-lg border border-gray-200 bg-white shadow-lg py-1">
          <DropdownItem label="All statuses" active={statusFilter === "all"} onClick={() => onSelect("all")} />
          {statusOptions.map((s) => (
            <DropdownItem key={s} label={s.charAt(0).toUpperCase() + s.slice(1)} active={statusFilter === s} onClick={() => onSelect(s)} />
          ))}
        </div>
      )}
    </div>
  );
}

function DropdownItem({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-gray-50 ${active ? "text-primary font-medium" : "text-gray-600"}`}
    >
      {label}
    </button>
  );
}
