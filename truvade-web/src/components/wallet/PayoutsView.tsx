"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Wallet,
  Clock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CreditCard,
  Loader2,
} from "lucide-react";
import { Card, CardHeader, Badge } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/types";
import { api, extractErrorMessage } from "@/lib/api";
import type { ApiPayout } from "@/lib/api-types";

type StatusFilter = "all" | "PENDING" | "SUCCESS" | "FAILED";

const statusBadgeVariant: Record<
  ApiPayout["status"],
  "success" | "warning" | "error"
> = {
  PENDING: "warning",
  SUCCESS: "success",
  FAILED: "error",
};

const ITEMS_PER_PAGE = 10;

export function PayoutsView() {
  const [payouts, setPayouts] = useState<ApiPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);

  const fetchPayouts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.get<ApiPayout[]>("/v1/payouts/mine/");
      setPayouts(data);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  const totals = useMemo(() => {
    let totalEarned = 0;
    let pendingAmount = 0;
    let paidOut = 0;
    for (const p of payouts) {
      const amount = parseFloat(p.amount) || 0;
      if (p.status === "SUCCESS") {
        totalEarned += amount;
        paidOut += amount;
      } else if (p.status === "PENDING") {
        totalEarned += amount;
        pendingAmount += amount;
      }
    }
    return { totalEarned, pendingAmount, paidOut };
  }, [payouts]);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return payouts;
    return payouts.filter((p) => p.status === statusFilter);
  }, [payouts, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const statTiles = [
    {
      label: "Total earnings",
      value: formatCurrency(totals.totalEarned),
      icon: <Wallet className="w-5 h-5" />,
    },
    {
      label: "Pending",
      value: formatCurrency(totals.pendingAmount),
      icon: <Clock className="w-5 h-5" />,
    },
    {
      label: "Paid out",
      value: formatCurrency(totals.paidOut),
      icon: <CheckCircle2 className="w-5 h-5" />,
    },
  ];

  if (loading) {
    return (
      <div className="py-12 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#0B3D2C] animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="flex items-start gap-2 mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
          <button
            onClick={fetchPayouts}
            className="ml-auto text-sm font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Stat tiles */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
        {statTiles.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg border border-gray-200 bg-white"
          >
            <span className="text-gray-400 hidden sm:block">{s.icon}</span>
            <span className="text-xs sm:text-sm text-gray-500 font-medium">
              {s.label}
            </span>
            <span className="text-xs sm:text-sm font-bold text-gray-900">
              {s.value}
            </span>
          </motion.div>
        ))}
      </div>

      <Card variant="bordered" padding="none">
        <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-5 pb-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-base font-semibold text-gray-900">
              Payout history
            </h2>
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              {(
                [
                  { key: "all", label: "All" },
                  { key: "PENDING", label: "Pending" },
                  { key: "SUCCESS", label: "Paid" },
                  { key: "FAILED", label: "Failed" },
                ] as { key: StatusFilter; label: string }[]
              ).map((f) => (
                <button
                  key={f.key}
                  onClick={() => {
                    setStatusFilter(f.key);
                    setPage(1);
                  }}
                  className={`px-2.5 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                    statusFilter === f.key
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>

        {paginated.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <CreditCard className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">
              No payouts {statusFilter !== "all" ? `(${statusFilter.toLowerCase()})` : "yet"}.
            </p>
            {payouts.length === 0 && (
              <p className="text-xs text-gray-400 mt-1">
                Payouts appear here after bookings complete.
              </p>
            )}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Bank account
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Reference
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginated.map((payout) => (
                    <tr
                      key={payout.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-3.5 text-gray-600 whitespace-nowrap">
                        {formatDate(
                          payout.completed_at || payout.created_at
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-gray-700 capitalize">
                        {payout.recipient_type.toLowerCase()}
                      </td>
                      <td className="px-6 py-3.5 text-gray-500 max-w-[200px] truncate">
                        {payout.bank_account
                          ? `${payout.bank_account.bank_name} •••• ${payout.bank_account.account_number.slice(
                              -4
                            )}`
                          : "—"}
                      </td>
                      <td className="px-6 py-3.5 text-gray-500 font-mono text-xs">
                        {payout.transfer_reference || "—"}
                      </td>
                      <td className="px-6 py-3.5 font-semibold text-gray-900 whitespace-nowrap">
                        {formatCurrency(parseFloat(payout.amount))}
                      </td>
                      <td className="px-6 py-3.5">
                        <Badge
                          variant={statusBadgeVariant[payout.status]}
                          size="sm"
                        >
                          {payout.status.charAt(0) +
                            payout.status.slice(1).toLowerCase()}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="sm:hidden divide-y divide-gray-50">
              {paginated.map((payout) => (
                <div key={payout.id} className="px-4 py-3.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {payout.recipient_type.toLowerCase()} payout
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(parseFloat(payout.amount))}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {payout.bank_account
                      ? `${payout.bank_account.bank_name} •••• ${payout.bank_account.account_number.slice(
                          -4
                        )}`
                      : "No bank account on file"}
                  </p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-xs text-gray-400">
                      {formatDate(payout.completed_at || payout.created_at)}
                    </span>
                    <Badge
                      variant={statusBadgeVariant[payout.status]}
                      size="sm"
                    >
                      {payout.status.charAt(0) +
                        payout.status.slice(1).toLowerCase()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {filtered.length > ITEMS_PER_PAGE && (
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-100">
            <span className="text-sm text-gray-500">
              {filtered.length} payout{filtered.length !== 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 text-sm text-gray-700">
                {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
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
