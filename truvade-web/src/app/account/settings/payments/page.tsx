"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Input, Button, Select } from "@/components/ui";

export default function PaymentsPage() {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [values, setValues] = useState({
    paymentMethod: "",
    bankName: "Guaranty Trust Bank",
    accountNumber: "012****789",
    accountName: "TruVade Properties Ltd",
    payoutSchedule: "Weekly",
  });
  const [editValues, setEditValues] = useState({ ...values });

  const handleEdit = (field: string) => {
    setEditValues({ ...values });
    setEditingField(editingField === field ? null : field);
  };

  const handleSave = (field: string) => {
    setValues({ ...editValues });
    setEditingField(null);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Payments & payouts</h2>

      {/* Section: Paying for stays (Guest) */}
      <div className="mt-8">
        <h3 className="text-base font-semibold text-gray-900">Payment methods</h3>
        <p className="text-sm text-gray-500 mt-0.5 mb-4">Add a payment method to book shortlets on Truvade.</p>

        <div className="border-b border-gray-100 py-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">Card or bank account</p>
              <p className="text-sm text-gray-500 mt-0.5">No payment method on file</p>
            </div>
            <button
              onClick={() => handleEdit("paymentMethod")}
              className="text-sm font-semibold text-gray-900 underline hover:text-gray-600 transition-colors ml-4"
            >
              {editingField === "paymentMethod" ? "Cancel" : "Add"}
            </button>
          </div>
          {editingField === "paymentMethod" && (
            <div className="mt-4 space-y-3">
              <Input label="Card number" placeholder="0000 0000 0000 0000" fullWidth />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Expiry" placeholder="MM/YY" fullWidth />
                <Input label="CVV" placeholder="123" fullWidth />
              </div>
              <Button variant="primary" size="sm" onClick={() => handleSave("paymentMethod")}>
                Save
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Section: Receiving payouts (Owner/Host) */}
      <div className="mt-10">
        <h3 className="text-base font-semibold text-gray-900">Payouts</h3>
        <p className="text-sm text-gray-500 mt-0.5 mb-4">How you get paid for hosting on Truvade.</p>

        <div className="border-b border-gray-100 py-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">Payout method</p>
              {editingField !== "bankAccount" && (
                <p className="text-sm text-gray-500 mt-0.5">
                  {values.bankName} · {values.accountNumber}
                </p>
              )}
            </div>
            <button
              onClick={() => handleEdit("bankAccount")}
              className="text-sm font-semibold text-gray-900 underline hover:text-gray-600 transition-colors ml-4"
            >
              {editingField === "bankAccount" ? "Cancel" : "Edit"}
            </button>
          </div>
          {editingField === "bankAccount" && (
            <div className="mt-4 space-y-3">
              <Input
                label="Bank name"
                value={editValues.bankName}
                onChange={(e) => setEditValues({ ...editValues, bankName: e.target.value })}
                placeholder="e.g. Guaranty Trust Bank"
                fullWidth
              />
              <Input
                label="Account number"
                value={editValues.accountNumber}
                onChange={(e) => setEditValues({ ...editValues, accountNumber: e.target.value })}
                placeholder="10-digit account number"
                fullWidth
              />
              <Input
                label="Account name"
                value={editValues.accountName}
                onChange={(e) => setEditValues({ ...editValues, accountName: e.target.value })}
                placeholder="Name on the account"
                fullWidth
              />
              <Button variant="primary" size="sm" onClick={() => handleSave("bankAccount")}>
                Save
              </Button>
            </div>
          )}
        </div>

        <div className="border-b border-gray-100 py-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">Payout schedule</p>
              <p className="text-sm text-gray-500 mt-0.5">{values.payoutSchedule}</p>
            </div>
            <button
              onClick={() => handleEdit("payoutSchedule")}
              className="text-sm font-semibold text-gray-900 underline hover:text-gray-600 transition-colors ml-4"
            >
              {editingField === "payoutSchedule" ? "Cancel" : "Edit"}
            </button>
          </div>
          {editingField === "payoutSchedule" && (
            <div className="mt-4 space-y-3">
              <Select
                label="Schedule"
                value={editValues.payoutSchedule}
                onChange={(e) => setEditValues({ ...editValues, payoutSchedule: e.target.value })}
                options={[
                  { value: "Daily", label: "Daily" },
                  { value: "Weekly", label: "Weekly" },
                  { value: "Biweekly", label: "Every 2 weeks" },
                  { value: "Monthly", label: "Monthly" },
                ]}
                fullWidth
              />
              <Button variant="primary" size="sm" onClick={() => handleSave("payoutSchedule")}>
                Save
              </Button>
            </div>
          )}
        </div>

        <div className="py-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">Tax information</p>
              <p className="text-sm text-gray-500 mt-0.5">Not provided</p>
            </div>
            <button className="text-sm font-semibold text-gray-900 underline hover:text-gray-600 transition-colors ml-4">
              Add
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
