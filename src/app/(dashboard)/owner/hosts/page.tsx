"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus,
  ChevronDown,
  ChevronUp,
  Shield,
  X,
  Check,
  Trash2,
  Building2,
  Mail,
  AlertTriangle,
} from "lucide-react";
import { Avatar } from "@/components/ui";

// ─── Types ───────────────────────────────────────────────
interface AssignedProperty {
  id: string;
  title: string;
  city: string;
  image: string;
}

interface HostEntry {
  id: string;
  name: string;
  email: string;
  initials: string;
  permissions: string[];
  commission: number;
  status: "active" | "pending";
  joinedAt: string;
  assignedProperties: AssignedProperty[];
}

const PERMISSION_OPTIONS = [
  { key: "manage_bookings", label: "Manage Bookings", desc: "View, confirm, and manage guest bookings" },
  { key: "manage_messages", label: "Manage Messages", desc: "Read and respond to guest messages" },
  { key: "manage_properties", label: "Manage Properties", desc: "Edit property details and photos" },
  { key: "manage_calendar", label: "Manage Calendar", desc: "Block/unblock dates and manage availability" },
];

const OWNER_PROPERTIES: AssignedProperty[] = [
  { id: "p1", title: "Luxury 3-Bedroom Apartment with Ocean View", city: "Victoria Island", image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=200" },
  { id: "p2", title: "Cozy Studio in the Heart of Lekki", city: "Lekki", image: "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=200" },
  { id: "p3", title: "Modern 2-Bedroom Penthouse", city: "Ikoyi", image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=200" },
  { id: "p4", title: "Spacious Family Home in Maitama", city: "Abuja", image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=200" },
  { id: "p5", title: "Waterfront Apartment", city: "Port Harcourt", image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=200" },
  { id: "p6", title: "Serviced Apartment in Ikeja GRA", city: "Ikeja", image: "https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=200" },
];

const mockHosts: HostEntry[] = [
  {
    id: "h1", name: "Amara Okafor", email: "amara@example.com", initials: "AO",
    permissions: ["manage_bookings", "manage_messages", "manage_calendar"],
    commission: 15, status: "active", joinedAt: "Jan 2026",
    assignedProperties: [OWNER_PROPERTIES[0], OWNER_PROPERTIES[1], OWNER_PROPERTIES[2]],
  },
  {
    id: "h2", name: "Chidi Eze", email: "chidi@example.com", initials: "CE",
    permissions: ["manage_bookings", "manage_messages", "manage_properties", "manage_calendar"],
    commission: 20, status: "active", joinedAt: "Feb 2026",
    assignedProperties: [OWNER_PROPERTIES[2], OWNER_PROPERTIES[3]],
  },
  {
    id: "h3", name: "Ngozi Adamu", email: "ngozi@example.com", initials: "NA",
    permissions: ["manage_bookings", "manage_messages"],
    commission: 12, status: "pending", joinedAt: "Mar 2026",
    assignedProperties: [],
  },
];

const permLabel: Record<string, string> = {
  manage_bookings: "Bookings",
  manage_messages: "Messages",
  manage_properties: "Properties",
  manage_calendar: "Calendar",
};

// ─── Main Page ───────────────────────────────────────────
export default function OwnerHostsPage() {
  const [hosts, setHosts] = useState(mockHosts);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteStep, setInviteStep] = useState(1);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  // Invite form state
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePerms, setInvitePerms] = useState<string[]>(["manage_bookings", "manage_messages"]);
  const [inviteCommission, setInviteCommission] = useState("15");
  const [inviteProperties, setInviteProperties] = useState<string[]>([]);

  const resetInvite = () => {
    setShowInvite(false);
    setInviteStep(1);
    setInviteName("");
    setInviteEmail("");
    setInvitePerms(["manage_bookings", "manage_messages"]);
    setInviteCommission("15");
    setInviteProperties([]);
  };

  const handleSendInvite = () => {
    const newHost: HostEntry = {
      id: `h${Date.now()}`,
      name: inviteName || "Invited User",
      email: inviteEmail,
      initials: (inviteName || inviteEmail).substring(0, 2).toUpperCase(),
      permissions: invitePerms,
      commission: Number(inviteCommission),
      status: "pending",
      joinedAt: "Mar 2026",
      assignedProperties: OWNER_PROPERTIES.filter((p) => inviteProperties.includes(p.id)),
    };
    setHosts((prev) => [...prev, newHost]);
    resetInvite();
  };

  const handleRemoveHost = (id: string) => {
    setHosts((prev) => prev.filter((h) => h.id !== id));
    setConfirmRemoveId(null);
  };

  const handleToggleProperty = (hostId: string, prop: AssignedProperty) => {
    setHosts((prev) =>
      prev.map((h) => {
        if (h.id !== hostId) return h;
        const has = h.assignedProperties.some((p) => p.id === prop.id);
        return {
          ...h,
          assignedProperties: has
            ? h.assignedProperties.filter((p) => p.id !== prop.id)
            : [...h.assignedProperties, prop],
        };
      })
    );
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hosts</h1>
          <p className="text-sm text-gray-500 mt-1">
            {hosts.filter((h) => h.status === "active").length} active &middot; {hosts.filter((h) => h.status === "pending").length} pending
          </p>
        </div>
        {!showInvite && (
          <button
            onClick={() => setShowInvite(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Invite host
          </button>
        )}
      </div>

      {/* ─── Invite Flow (inline) ─────────────────────────── */}
      <AnimatePresence>
        {showInvite && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8 overflow-hidden"
          >
            <div className="border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Invite a host</h2>
                <button onClick={resetInvite} className="p-1 text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Step indicator */}
              <div className="flex items-center gap-1.5 mb-6">
                {[1, 2, 3, 4].map((s) => (
                  <div key={s} className={`h-1 rounded-full transition-all ${s <= inviteStep ? "bg-gray-900 w-8" : "bg-gray-200 w-4"}`} />
                ))}
              </div>

              {/* Step 1: Email & Name */}
              {inviteStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email address</label>
                    <input
                      type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="host@example.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name (optional)</label>
                    <input
                      type="text" value={inviteName} onChange={(e) => setInviteName(e.target.value)}
                      placeholder="Host's name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Permissions */}
              {inviteStep === 2 && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500 mb-4">Choose what this host can do</p>
                  {PERMISSION_OPTIONS.map((perm) => {
                    const checked = invitePerms.includes(perm.key);
                    return (
                      <button
                        key={perm.key}
                        onClick={() => setInvitePerms((prev) =>
                          prev.includes(perm.key) ? prev.filter((p) => p !== perm.key) : [...prev, perm.key]
                        )}
                        className={`w-full flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                          checked ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-400"
                        }`}
                      >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          checked ? "bg-gray-900 border-gray-900" : "border-gray-300"
                        }`}>
                          {checked && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{perm.label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{perm.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Step 3: Commission */}
              {inviteStep === 3 && (
                <div>
                  <p className="text-sm text-gray-500 mb-4">Set the percentage of booking revenue this host earns</p>
                  <div className="relative max-w-xs">
                    <input
                      type="number" value={inviteCommission} onChange={(e) => setInviteCommission(e.target.value)}
                      min={0} max={50} placeholder="15"
                      className="w-full pl-4 pr-10 py-4 border border-gray-300 rounded-xl text-2xl font-semibold text-gray-900 focus:outline-none focus:border-gray-900 transition-colors"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl">%</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Typical range: 10% — 25%</p>
                </div>
              )}

              {/* Step 4: Assign Properties */}
              {inviteStep === 4 && (
                <div>
                  <p className="text-sm text-gray-500 mb-4">Select which properties this host will manage</p>
                  <div className="space-y-2">
                    {OWNER_PROPERTIES.map((prop) => {
                      const selected = inviteProperties.includes(prop.id);
                      return (
                        <button
                          key={prop.id}
                          onClick={() => setInviteProperties((prev) =>
                            prev.includes(prop.id) ? prev.filter((id) => id !== prop.id) : [...prev, prop.id]
                          )}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                            selected ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-400"
                          }`}
                        >
                          <img src={prop.image} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{prop.title}</p>
                            <p className="text-xs text-gray-500">{prop.city}</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            selected ? "bg-gray-900 border-gray-900" : "border-gray-300"
                          }`}>
                            {selected && <Check className="w-3 h-3 text-white" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-400 mt-3">{inviteProperties.length} properties selected</p>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={() => inviteStep === 1 ? resetInvite() : setInviteStep((s) => s - 1)}
                  className="text-sm font-semibold text-gray-900 underline hover:text-gray-600"
                >
                  {inviteStep === 1 ? "Cancel" : "Back"}
                </button>
                {inviteStep < 4 ? (
                  <button
                    onClick={() => setInviteStep((s) => s + 1)}
                    disabled={inviteStep === 1 && !inviteEmail.trim()}
                    className="px-6 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={handleSendInvite}
                    className="px-6 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Send invitation
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Host List ────────────────────────────────────── */}
      <div className="space-y-3">
        {hosts.map((host, i) => {
          const isExpanded = expandedId === host.id;
          const isConfirmingRemove = confirmRemoveId === host.id;
          const isAssigning = assigningId === host.id;

          return (
            <motion.div
              key={host.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 transition-colors"
            >
              {/* Main row */}
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <Avatar initials={host.initials} name={host.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-sm font-semibold text-gray-900">{host.name}</h3>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        host.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                      }`}>
                        {host.status === "active" ? "Active" : "Pending invite"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{host.email}</p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" />
                        {host.assignedProperties.length} propert{host.assignedProperties.length === 1 ? "y" : "ies"}
                      </span>
                      <span>{host.commission}% commission</span>
                      <span className="flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5" />
                        {host.permissions.map((p) => permLabel[p]).join(", ")}
                      </span>
                    </div>

                    {/* Assigned property thumbnails */}
                    {host.assignedProperties.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-3">
                        {host.assignedProperties.slice(0, 4).map((prop) => (
                          <img key={prop.id} src={prop.image} alt={prop.title}
                            className="w-8 h-8 rounded-md object-cover" title={prop.title} />
                        ))}
                        {host.assignedProperties.length > 4 && (
                          <span className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center text-xs text-gray-500 font-medium">
                            +{host.assignedProperties.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Expand toggle */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : host.id)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Expanded section */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 pt-2 border-t border-gray-100">
                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <button
                          onClick={() => setAssigningId(isAssigning ? null : host.id)}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg border transition-colors ${
                            isAssigning ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <Building2 className="w-3.5 h-3.5" />
                          Assign properties
                        </button>
                        <button
                          onClick={() => setConfirmRemoveId(isConfirmingRemove ? null : host.id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg border border-gray-300 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove host
                        </button>
                      </div>

                      {/* Assign properties panel */}
                      {isAssigning && (
                        <div className="mb-4 bg-gray-50 rounded-xl p-4">
                          <p className="text-sm font-medium text-gray-700 mb-3">Select properties for {host.name}</p>
                          <div className="space-y-2">
                            {OWNER_PROPERTIES.map((prop) => {
                              const assigned = host.assignedProperties.some((p) => p.id === prop.id);
                              return (
                                <button
                                  key={prop.id}
                                  onClick={() => handleToggleProperty(host.id, prop)}
                                  className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-all ${
                                    assigned ? "bg-white border border-gray-900" : "bg-white border border-gray-200 hover:border-gray-400"
                                  }`}
                                >
                                  <img src={prop.image} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{prop.title}</p>
                                    <p className="text-xs text-gray-500">{prop.city}</p>
                                  </div>
                                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                                    assigned ? "bg-gray-900 border-gray-900" : "border-gray-300"
                                  }`}>
                                    {assigned && <Check className="w-3 h-3 text-white" />}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                          <button
                            onClick={() => setAssigningId(null)}
                            className="mt-3 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                          >
                            Done
                          </button>
                        </div>
                      )}

                      {/* Remove confirmation */}
                      {isConfirmingRemove && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-red-900">
                              Remove {host.name}?
                            </p>
                            <p className="text-sm text-red-700 mt-0.5">
                              They will lose access to all {host.assignedProperties.length} assigned properties.
                            </p>
                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={() => handleRemoveHost(host.id)}
                                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                              >
                                Remove
                              </button>
                              <button
                                onClick={() => setConfirmRemoveId(null)}
                                className="px-4 py-2 border border-red-300 text-red-700 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Info */}
                      {!isAssigning && !isConfirmingRemove && (
                        <div className="text-sm text-gray-500">
                          <p>Joined {host.joinedAt}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {hosts.length === 0 && (
        <div className="text-center py-16">
          <UserPlus className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No hosts yet</p>
          <p className="text-sm text-gray-400 mt-1">Invite hosts to help manage your properties</p>
        </div>
      )}
    </div>
  );
}
