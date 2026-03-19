"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, Building2, Save } from "lucide-react";
import { Card, CardHeader, CardBody, Input, Button } from "@/components/ui";

export default function OrganizationSettingsPage() {
  const [orgName, setOrgName] = useState("TruVade Properties Ltd");
  const [description, setDescription] = useState(
    "Premium shortlet accommodation provider in Lagos and Abuja. We offer verified, luxury stays for business and leisure travelers."
  );
  const [bankName, setBankName] = useState("Guaranty Trust Bank");
  const [accountNumber, setAccountNumber] = useState("0123456789");
  const [accountName, setAccountName] = useState("TruVade Properties Ltd");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // Simulate save
    await new Promise((r) => setTimeout(r, 1500));
    setSaving(false);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 border-l-4 border-[#0B3D2C] pl-4 mb-6">Organization Settings</h1>

      <div className="space-y-6">
        {/* General Info */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card variant="bordered" padding="lg">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#0B3D2C]" />
                <h2 className="text-lg font-semibold text-gray-900">General Information</h2>
              </div>
            </CardHeader>
            <CardBody className="space-y-5">
              <Input
                label="Organization Name"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                fullWidth
              />

              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Organization Logo
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-[#0B3D2C] hover:bg-[#0B3D2C]/5 transition-colors cursor-pointer">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    PNG, JPG up to 2MB. Recommended 200x200px.
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="block w-full bg-white border border-gray-300 rounded-[var(--radius-button)] px-4 py-2.5 text-gray-900 placeholder-gray-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:border-[#0B3D2C] focus:ring-[#0B3D2C] resize-none"
                  placeholder="Describe your organization..."
                />
              </div>
            </CardBody>
          </Card>
        </motion.div>

        {/* Payout Settings */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card variant="bordered" padding="lg">
            <CardHeader>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#B87333]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
                </svg>
                <h2 className="text-lg font-semibold text-gray-900">Payout Settings</h2>
              </div>
            </CardHeader>
            <CardBody className="space-y-5">
              <Input
                label="Bank Name"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. Guaranty Trust Bank"
                fullWidth
              />
              <Input
                label="Account Number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="10-digit account number"
                fullWidth
              />
              <Input
                label="Account Name"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Account holder name"
                fullWidth
              />
            </CardBody>
          </Card>
        </motion.div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            variant="primary"
            size="lg"
            leftIcon={<Save className="w-4 h-4" />}
            loading={saving}
            onClick={handleSave}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
