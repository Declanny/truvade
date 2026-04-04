"use client";

import { useState, useMemo } from "react";
import { CheckCircle2, ChevronLeft } from "lucide-react";
import { Modal, Button } from "@/components/ui";
import { formatCurrency } from "@/lib/types";

type Step = "amount" | "review" | "success";

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
  currency?: string;
}

export function WithdrawModal({ isOpen, onClose, availableBalance, currency = "NGN" }: WithdrawModalProps) {
  const [step, setStep] = useState<Step>("amount");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const parsed = useMemo(() => Math.max(parseFloat(amount) || 0, 0), [amount]);
  const fee = useMemo(() => Number((parsed * 0.01).toFixed(2)), [parsed]);
  const received = useMemo(() => Math.max(parsed - fee, 0), [parsed, fee]);

  function reset() {
    setStep("amount");
    setAmount("");
    setError("");
    setIsProcessing(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleProceed() {
    if (step === "amount") {
      if (parsed <= 0) { setError("Enter a valid amount."); return; }
      if (parsed > availableBalance) { setError("Amount exceeds your available balance."); return; }
      setError("");
      setStep("review");
      return;
    }

    if (step === "review") {
      setIsProcessing(true);
      // Simulate API call
      setTimeout(() => {
        setIsProcessing(false);
        setStep("success");
      }, 1500);
      return;
    }

    handleClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="sm" showCloseButton title={step === "review" ? undefined : step === "success" ? undefined : undefined}>
      {/* Amount step */}
      {step === "amount" && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Withdraw Earnings</h3>
          <p className="text-sm text-gray-500 mb-5">
            Funds will be sent to your connected Stripe account.
          </p>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-100 px-4 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Amount</label>
          <div className={`flex items-center rounded-xl border ${error ? "border-red-300" : "border-gray-200"} bg-white px-4 py-3 text-lg font-semibold text-gray-900 focus-within:border-primary transition-colors`}>
            <span className="text-gray-400 mr-2">₦</span>
            <input
              type="number"
              min="0"
              step="100"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setError(""); }}
              inputMode="decimal"
              className="w-full bg-transparent placeholder:text-gray-300 focus:outline-none"
              placeholder="0"
              autoFocus
            />
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            Available: {formatCurrency(availableBalance, currency)}
          </p>

          <Button variant="primary" fullWidth className="mt-6" onClick={handleProceed}>
            Continue
          </Button>
        </div>
      )}

      {/* Review step */}
      {step === "review" && (
        <div>
          <button onClick={() => { setStep("amount"); setError(""); }} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-4 -mt-1 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          <h3 className="text-lg font-semibold text-gray-900 mb-1">Review & Confirm</h3>
          <p className="text-sm text-gray-500 mb-5">Check the details below before confirming.</p>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-100 px-4 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="rounded-xl border border-gray-100 bg-gray-50 divide-y divide-gray-100">
            <SummaryRow label="Amount" value={formatCurrency(parsed, currency)} />
            <SummaryRow label="Fee (1%)" value={formatCurrency(fee, currency)} />
            <SummaryRow label="You receive" value={formatCurrency(received, currency)} bold />
          </div>

          <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#635BFF] flex items-center justify-center text-white text-[10px] font-bold">S</div>
            <div>
              <p className="text-sm font-medium text-gray-900">Stripe</p>
              <p className="text-xs text-gray-500">Connected account</p>
            </div>
          </div>

          <Button variant="primary" fullWidth className="mt-6" onClick={handleProceed} loading={isProcessing}>
            Confirm Withdrawal
          </Button>
        </div>
      )}

      {/* Success step */}
      {step === "success" && (
        <div className="text-center py-4">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
            <CheckCircle2 className="w-8 h-8 text-success" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Withdrawal Processing</h3>
          <p className="text-sm text-gray-500 mb-6">
            Your withdrawal of {formatCurrency(parsed, currency)} is being processed. We'll notify you when it's complete.
          </p>
          <Button variant="primary" fullWidth onClick={handleClose}>
            Done
          </Button>
        </div>
      )}
    </Modal>
  );
}

function SummaryRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm ${bold ? "font-semibold text-gray-900" : "text-gray-700"}`}>{value}</span>
    </div>
  );
}
