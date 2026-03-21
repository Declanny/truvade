"use client";

import { motion } from "framer-motion";
import { SettingsRow } from "@/components/ui";

export default function SecurityPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Login & security</h2>
      <p className="text-sm text-gray-500 mb-8">
        Manage your account security and login preferences.
      </p>

      <div>
        <SettingsRow
          label="Password"
          value="Last updated 3 months ago"
          actionLabel="Update"
        />
        <SettingsRow
          label="Two-factor authentication"
          value="Not enabled"
          actionLabel="Set up"
        />
        <SettingsRow
          label="Active sessions"
          value="1 active session"
          actionLabel="Manage"
        />
        <SettingsRow
          label="Account deactivation"
          description="Permanently deactivate your account"
          actionLabel="Deactivate"
        />
      </div>
    </motion.div>
  );
}
