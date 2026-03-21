"use client";

import { motion } from "framer-motion";
import { SettingsRow } from "@/components/ui";

export default function NotificationsPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Notifications</h2>
      <p className="text-sm text-gray-500 mb-8">
        Choose how and when you want to be notified.
      </p>

      <div>
        <SettingsRow
          label="Email notifications"
          value="Enabled for bookings and messages"
          actionLabel="Edit"
        />
        <SettingsRow
          label="SMS notifications"
          value="Enabled for booking confirmations"
          actionLabel="Edit"
        />
        <SettingsRow
          label="Push notifications"
          value="Enabled"
          actionLabel="Edit"
        />
        <SettingsRow
          label="Marketing emails"
          value="Subscribed to deals and recommendations"
          actionLabel="Edit"
        />
      </div>
    </motion.div>
  );
}
