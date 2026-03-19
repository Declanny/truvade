"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Save, ShieldCheck, Trash2 } from "lucide-react";
import { Card, CardHeader, CardBody, Input, Button, Badge } from "@/components/ui";
import Link from "next/link";

export default function GuestProfilePage() {
  const [fullName, setFullName] = useState("Adaeze Nwosu");
  const [email, setEmail] = useState("adaeze@truvade.com");
  const [phone, setPhone] = useState("+234 801 234 5678");
  const [saving, setSaving] = useState(false);

  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1500));
    setSaving(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 border-l-4 border-[#0B3D2C] pl-4 mb-6">My Profile</h1>

      <div className="space-y-6">
        {/* Avatar & Name */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card variant="bordered" padding="lg">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-full bg-[#0B3D2C] flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                {initials}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{fullName}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="success" size="sm" icon={<ShieldCheck className="w-3.5 h-3.5" />}>
                    Verified
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <Badge variant="primary" size="sm">Guest</Badge>
                  <Link href="/owner" className="text-xs text-[#0B3D2C] hover:underline font-medium">
                    Become an Owner →
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Personal Info */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <Card variant="bordered" padding="lg">
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
            </CardHeader>
            <CardBody className="space-y-5">
              <Input
                label="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                fullWidth
              />
              <div>
                <Input
                  label="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  fullWidth
                />
                <div className="flex items-center gap-1.5 mt-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-xs text-emerald-600 font-medium">Verified</span>
                </div>
              </div>
              <Input
                label="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+234 XXX XXX XXXX"
                fullWidth
              />
            </CardBody>
          </Card>
        </motion.div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button
            variant="danger"
            size="md"
            leftIcon={<Trash2 className="w-4 h-4" />}
            disabled
          >
            Delete Account
          </Button>
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
