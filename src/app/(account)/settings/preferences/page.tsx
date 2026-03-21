"use client";

import { motion } from "framer-motion";
import { SettingsRow } from "@/components/ui";

export default function PreferencesPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Languages & currency</h2>
      <p className="text-sm text-gray-500 mb-8">
        Set your language and currency preferences.
      </p>

      <div>
        <SettingsRow
          label="Language"
          value="English"
          actionLabel="Edit"
        />
        <SettingsRow
          label="Currency"
          value="Nigerian Naira (NGN)"
          actionLabel="Edit"
        />
        <SettingsRow
          label="Time zone"
          value="West Africa Time (WAT)"
          actionLabel="Edit"
        />
      </div>
    </motion.div>
  );
}
