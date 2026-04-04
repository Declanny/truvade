"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Wallet, Clock, ArrowUpRight, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardHeader, Badge, Button } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/types";
import { WithdrawModal } from "./WithdrawModal";
import type { WalletBalance, WalletTransaction, TransactionType, TransactionStatus } from "@/lib/mock-wallet";

interface WalletViewProps {
  balance: WalletBalance;
  transactions: WalletTransaction[];
}

const statusVariant: Record<TransactionStatus, "success" | "warning" | "info"> = {
  completed: "success",
  pending: "warning",
  processing: "info",
};

const tabLabels: Record<TransactionType, string> = {
  credit: "Earnings",
  debit: "Withdrawals",
};

const statusOptions: TransactionStatus[] = ["completed", "pending", "processing"];
const ITEMS_PER_PAGE = 5;

export function WalletView({ balance, transactions }: WalletViewProps) {
  const [activeTab, setActiveTab] = useState<TransactionType>("credit");
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | "all">("all");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = useMemo(() => {
    let list = transactions.filter((t) => t.type === activeTab);
    if (statusFilter !== "all") list = list.filter((t) => t.status === statusFilter);
    if (dateFrom) list = list.filter((t) => t.date >= dateFrom);
    if (dateTo) list = list.filter((t) => t.date <= dateTo);
    return list;
  }, [transactions, activeTab, statusFilter, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const balanceCards = [
    { label: "Total Earnings", value: formatCurrency(balance.totalEarnings, balance.currency), icon: <Wallet className="w-5 h-5" /> },
    { label: "Pending", value: formatCurrency(balance.pendingBalance, balance.currency), icon: <Clock className="w-5 h-5" /> },
    { label: "Available", value: formatCurrency(balance.availableBalance, balance.currency), icon: <ArrowUpRight className="w-5 h-5" /> },
  ];

  return (
    <div>
      {/* Balance cards + Withdraw */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
        {balanceCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg border border-gray-200 bg-white"
          >
            <span className="text-gray-400 hidden sm:block">{card.icon}</span>
            <span className="text-xs sm:text-sm text-gray-500 font-medium">{card.label}</span>
            <span className="text-xs sm:text-sm font-bold text-gray-900">{card.value}</span>
          </motion.div>
        ))}
        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsWithdrawOpen(true)}
          disabled={!balance.canWithdraw || balance.availableBalance <= 0}
        >
          Withdraw
        </Button>
      </div>

      {/* Transactions */}
      <Card variant="bordered" padding="none">
        <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-5 pb-4">
          <div className="flex flex-col gap-3">
            {/* Tabs */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                {(["credit", "debit"] as TransactionType[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => { setActiveTab(tab); setStatusFilter("all"); setCurrentPage(1); setDateFrom(""); setDateTo(""); }}
                    className={`px-3 sm:px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      activeTab === tab ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {tabLabels[tab]}
                  </button>
                ))}
              </div>

              {/* Status + Date filters — inline on desktop, stacked on mobile */}
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
                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen((p) => !p)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {statusFilter === "all" ? "All statuses" : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                    <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isDropdownOpen && (
                    <div className="absolute right-0 z-10 mt-1 w-36 rounded-lg border border-gray-200 bg-white shadow-lg py-1">
                      <DropdownItem
                        label="All statuses"
                        active={statusFilter === "all"}
                        onClick={() => { setStatusFilter("all"); setCurrentPage(1); setIsDropdownOpen(false); }}
                      />
                      {statusOptions.map((s) => (
                        <DropdownItem
                          key={s}
                          label={s.charAt(0).toUpperCase() + s.slice(1)}
                          active={statusFilter === s}
                          onClick={() => { setStatusFilter(s); setCurrentPage(1); setIsDropdownOpen(false); }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile: status only */}
              <div className="sm:hidden relative">
                <button
                  onClick={() => setIsDropdownOpen((p) => !p)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {statusFilter === "all" ? "All statuses" : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                {isDropdownOpen && (
                  <div className="absolute right-0 z-10 mt-1 w-36 rounded-lg border border-gray-200 bg-white shadow-lg py-1">
                    <DropdownItem
                      label="All statuses"
                      active={statusFilter === "all"}
                      onClick={() => { setStatusFilter("all"); setCurrentPage(1); setIsDropdownOpen(false); }}
                    />
                    {statusOptions.map((s) => (
                      <DropdownItem
                        key={s}
                        label={s.charAt(0).toUpperCase() + s.slice(1)}
                        active={statusFilter === s}
                        onClick={() => { setStatusFilter(s); setCurrentPage(1); setIsDropdownOpen(false); }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Mobile: date range on its own row */}
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
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-400">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                paginated.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3.5 text-gray-600 whitespace-nowrap">{formatDate(tx.date)}</td>
                    <td className="px-6 py-3.5 text-gray-900 max-w-[200px] truncate">{tx.description}</td>
                    <td className="px-6 py-3.5 text-gray-500 max-w-[180px] truncate">{tx.property}</td>
                    <td className="px-6 py-3.5 text-gray-500 font-mono text-xs">{tx.reference}</td>
                    <td className="px-6 py-3.5 font-semibold text-gray-900 whitespace-nowrap">
                      {tx.type === "debit" ? "−" : ""}{formatCurrency(tx.amount, balance.currency)}
                    </td>
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
                  <span className="text-sm font-medium text-gray-900 truncate max-w-[60%]">{tx.description}</span>
                  <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                    {tx.type === "debit" ? "−" : ""}{formatCurrency(tx.amount, balance.currency)}
                  </span>
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
              <span className="px-3 text-sm text-gray-700">
                {currentPage} of {totalPages}
              </span>
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

      <WithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        availableBalance={balance.availableBalance}
        currency={balance.currency}
      />
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
