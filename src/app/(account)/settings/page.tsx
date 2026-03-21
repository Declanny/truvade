"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Lock, Eye } from "lucide-react";
import { SettingsRow, Input, Button } from "@/components/ui";

export default function PersonalInfoPage() {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [values, setValues] = useState({
    legalName: "Adaeze Nwosu",
    preferredName: "",
    email: "a***e@truvade.com",
    phone: "",
    address: "Lagos, Nigeria",
    emergencyContact: "",
    governmentId: "",
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
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Personal information</h2>

      <div className="mt-8">
        {/* Legal name */}
        <div className="border-b border-gray-100 py-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">Legal name</p>
              {editingField !== "legalName" && (
                <p className="text-sm text-gray-500 mt-0.5">{values.legalName}</p>
              )}
            </div>
            <button
              onClick={() => handleEdit("legalName")}
              className="text-sm font-semibold text-gray-900 underline hover:text-gray-600 transition-colors ml-4"
            >
              {editingField === "legalName" ? "Cancel" : "Edit"}
            </button>
          </div>
          {editingField === "legalName" && (
            <div className="mt-4 space-y-3">
              <Input
                label="Full name"
                value={editValues.legalName}
                onChange={(e) => setEditValues({ ...editValues, legalName: e.target.value })}
                fullWidth
              />
              <Button variant="primary" size="sm" onClick={() => handleSave("legalName")}>
                Save
              </Button>
            </div>
          )}
        </div>

        {/* Preferred first name */}
        <div className="border-b border-gray-100 py-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">Preferred first name</p>
              <p className="text-sm text-gray-500 mt-0.5">
                {values.preferredName || "Not provided"}
              </p>
            </div>
            <button
              onClick={() => handleEdit("preferredName")}
              className="text-sm font-semibold text-gray-900 underline hover:text-gray-600 transition-colors ml-4"
            >
              {editingField === "preferredName" ? "Cancel" : values.preferredName ? "Edit" : "Add"}
            </button>
          </div>
          {editingField === "preferredName" && (
            <div className="mt-4 space-y-3">
              <Input
                label="Preferred name"
                value={editValues.preferredName}
                onChange={(e) => setEditValues({ ...editValues, preferredName: e.target.value })}
                fullWidth
              />
              <Button variant="primary" size="sm" onClick={() => handleSave("preferredName")}>
                Save
              </Button>
            </div>
          )}
        </div>

        {/* Email */}
        <div className="border-b border-gray-100 py-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">Email address</p>
              <p className="text-sm text-gray-500 mt-0.5">{values.email}</p>
            </div>
            <button
              onClick={() => handleEdit("email")}
              className="text-sm font-semibold text-gray-900 underline hover:text-gray-600 transition-colors ml-4"
            >
              {editingField === "email" ? "Cancel" : "Edit"}
            </button>
          </div>
          {editingField === "email" && (
            <div className="mt-4 space-y-3">
              <Input
                label="Email"
                type="email"
                value={editValues.email}
                onChange={(e) => setEditValues({ ...editValues, email: e.target.value })}
                fullWidth
              />
              <Button variant="primary" size="sm" onClick={() => handleSave("email")}>
                Save
              </Button>
            </div>
          )}
        </div>

        {/* Phone */}
        <div className="border-b border-gray-100 py-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">Phone numbers</p>
              <p className="text-sm text-gray-500 mt-0.5">
                {values.phone || "Add a number so confirmed guests and Truvade can get in touch."}
              </p>
            </div>
            <button
              onClick={() => handleEdit("phone")}
              className="text-sm font-semibold text-gray-900 underline hover:text-gray-600 transition-colors ml-4"
            >
              {editingField === "phone" ? "Cancel" : values.phone ? "Edit" : "Add"}
            </button>
          </div>
          {editingField === "phone" && (
            <div className="mt-4 space-y-3">
              <Input
                label="Phone number"
                value={editValues.phone}
                onChange={(e) => setEditValues({ ...editValues, phone: e.target.value })}
                placeholder="+234 XXX XXX XXXX"
                fullWidth
              />
              <Button variant="primary" size="sm" onClick={() => handleSave("phone")}>
                Save
              </Button>
            </div>
          )}
        </div>

        {/* Identity verification */}
        <div className="border-b border-gray-100 py-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">Identity verification</p>
              <p className="text-sm text-gray-500 mt-0.5">
                {values.governmentId || "Not started"}
              </p>
            </div>
            <button
              onClick={() => handleEdit("governmentId")}
              className="text-sm font-semibold text-gray-900 underline hover:text-gray-600 transition-colors ml-4"
            >
              {values.governmentId ? "Edit" : "Start"}
            </button>
          </div>
        </div>

        {/* Address */}
        <div className="border-b border-gray-100 py-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">Address</p>
              <p className="text-sm text-gray-500 mt-0.5">
                {values.address || "Not provided"}
              </p>
            </div>
            <button
              onClick={() => handleEdit("address")}
              className="text-sm font-semibold text-gray-900 underline hover:text-gray-600 transition-colors ml-4"
            >
              {editingField === "address" ? "Cancel" : values.address ? "Edit" : "Add"}
            </button>
          </div>
          {editingField === "address" && (
            <div className="mt-4 space-y-3">
              <Input
                label="Address"
                value={editValues.address}
                onChange={(e) => setEditValues({ ...editValues, address: e.target.value })}
                fullWidth
              />
              <Button variant="primary" size="sm" onClick={() => handleSave("address")}>
                Save
              </Button>
            </div>
          )}
        </div>

        {/* Emergency contact */}
        <div className="py-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">Emergency contact</p>
              <p className="text-sm text-gray-500 mt-0.5">
                {values.emergencyContact || "Not provided"}
              </p>
            </div>
            <button
              onClick={() => handleEdit("emergencyContact")}
              className="text-sm font-semibold text-gray-900 underline hover:text-gray-600 transition-colors ml-4"
            >
              {values.emergencyContact ? "Edit" : "Add"}
            </button>
          </div>
        </div>
      </div>

      {/* Info cards */}
      <div className="mt-8 border border-gray-200 rounded-xl p-6 space-y-6">
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
            <Lock className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Why isn&apos;t my info shown here?</h3>
            <p className="text-sm text-gray-500 mt-1">
              We&apos;re hiding some account details to protect your identity.
            </p>
          </div>
        </div>
        <div className="border-t border-gray-100" />
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Which details can be edited?</h3>
            <p className="text-sm text-gray-500 mt-1">
              Contact info and personal details can be edited. If this info was used to verify your identity, you&apos;ll need to get verified again.
            </p>
          </div>
        </div>
        <div className="border-t border-gray-100" />
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
            <Eye className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">What info is shared with others?</h3>
            <p className="text-sm text-gray-500 mt-1">
              Truvade only releases contact information for hosts and guests after a reservation is confirmed.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
