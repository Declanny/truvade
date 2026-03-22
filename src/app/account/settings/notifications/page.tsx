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

      {/* General */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-4">Account activity</h3>
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
      </div>

      {/* Hosting */}
      <div className="mt-10">
        <h3 className="text-base font-semibold text-gray-900 mb-1">Hosting</h3>
        <p className="text-sm text-gray-500 mb-4">Notifications for your properties and guests.</p>
        <SettingsRow
          label="New booking requests"
          value="Email and push"
          actionLabel="Edit"
        />
        <SettingsRow
          label="Guest messages"
          value="Email and push"
          actionLabel="Edit"
        />
        <SettingsRow
          label="Payout updates"
          value="Email when payout is processed"
          actionLabel="Edit"
        />
        <SettingsRow
          label="Review reminders"
          value="Email after guest check-out"
          actionLabel="Edit"
        />
      </div>

      {/* Marketing */}
      <div className="mt-10">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Marketing</h3>
        <SettingsRow
          label="Deals and recommendations"
          value="Subscribed"
          actionLabel="Edit"
        />
      </div>
    </motion.div>
  );
}
