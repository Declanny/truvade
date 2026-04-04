"use client";

import { motion } from "framer-motion";
import { SettingsRow } from "@/components/ui";

export default function PrivacyPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Privacy</h2>
      <p className="text-sm text-gray-500 mb-8">
        Control how your information is shared and used.
      </p>

      <div>
        <SettingsRow
          label="Profile visibility"
          value="Visible to other users"
          actionLabel="Edit"
        />
        <SettingsRow
          label="Data sharing"
          value="Share activity for personalized recommendations"
          actionLabel="Manage"
        />
        <SettingsRow
          label="Request your data"
          description="Download a copy of your personal data"
          actionLabel="Request"
        />
      </div>
    </motion.div>
  );
}
