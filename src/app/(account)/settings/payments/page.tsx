"use client";

import { motion } from "framer-motion";
import { SettingsRow } from "@/components/ui";

export default function PaymentsPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Payments</h2>
      <p className="text-sm text-gray-500 mb-8">
        Manage your payment methods and payout preferences.
      </p>

      <div>
        <SettingsRow
          label="Payment methods"
          value="No payment methods added"
          actionLabel="Add"
        />
        <SettingsRow
          label="Payout methods"
          description="Add a bank account to receive payouts"
          actionLabel="Set up"
        />
        <SettingsRow
          label="Transaction history"
          description="View your payment and payout history"
          actionLabel="View"
        />
      </div>
    </motion.div>
  );
}
