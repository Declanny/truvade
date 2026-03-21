"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, MoreVertical, Shield, Mail } from "lucide-react";
import { Card, CardBody, Button, Badge, Input, Modal, ModalFooter } from "@/components/ui";

interface HostEntry {
  id: string;
  name: string;
  email: string;
  avatar: string;
  permissions: string[];
  commission: number;
  status: "active" | "pending";
  joinedAt: string;
}

const PERMISSION_OPTIONS = [
  { key: "manage_bookings", label: "Manage Bookings", description: "View, confirm, and manage guest bookings" },
  { key: "manage_messages", label: "Manage Messages", description: "Read and respond to guest messages" },
  { key: "manage_properties", label: "Manage Properties", description: "Edit property details and photos" },
  { key: "manage_calendar", label: "Manage Calendar", description: "Block/unblock dates and manage availability" },
];

const mockHosts: HostEntry[] = [
  {
    id: "h1",
    name: "Amara Okafor",
    email: "amara@example.com",
    avatar: "AO",
    permissions: ["manage_bookings", "manage_messages", "manage_calendar"],
    commission: 15,
    status: "active",
    joinedAt: "Jan 2026",
  },
  {
    id: "h2",
    name: "Chidi Eze",
    email: "chidi@example.com",
    avatar: "CE",
    permissions: ["manage_bookings", "manage_messages", "manage_properties", "manage_calendar"],
    commission: 20,
    status: "active",
    joinedAt: "Feb 2026",
  },
  {
    id: "h3",
    name: "Invited User",
    email: "newhost@example.com",
    avatar: "IU",
    permissions: ["manage_bookings", "manage_messages"],
    commission: 12,
    status: "pending",
    joinedAt: "Mar 2026",
  },
];

const permissionLabels: Record<string, string> = {
  manage_bookings: "Bookings",
  manage_messages: "Messages",
  manage_properties: "Properties",
  manage_calendar: "Calendar",
};

export default function OwnerHostsPage() {
  const [hosts, setHosts] = useState(mockHosts);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteCommission, setInviteCommission] = useState("15");
  const [invitePermissions, setInvitePermissions] = useState<string[]>(["manage_bookings", "manage_messages"]);

  const handleTogglePermission = (perm: string) => {
    setInvitePermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const handleInvite = () => {
    const newHost: HostEntry = {
      id: `h${Date.now()}`,
      name: "Invited User",
      email: inviteEmail,
      avatar: inviteEmail.substring(0, 2).toUpperCase(),
      permissions: invitePermissions,
      commission: Number(inviteCommission),
      status: "pending",
      joinedAt: "Mar 2026",
    };
    setHosts((prev) => [...prev, newHost]);
    setInviteEmail("");
    setInviteCommission("15");
    setInvitePermissions(["manage_bookings", "manage_messages"]);
    setShowInviteModal(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manage Hosts</h1>
        <Button
          variant="primary"
          leftIcon={<UserPlus className="w-4 h-4" />}
          onClick={() => setShowInviteModal(true)}
        >
          Invite Host
        </Button>
      </div>

      {/* Host List */}
      <div className="space-y-4">
        <AnimatePresence>
          {hosts.map((host, i) => (
            <motion.div
              key={host.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card variant="bordered" padding="lg">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#0B3D2C]/10 text-[#0B3D2C] flex items-center justify-center font-semibold text-sm flex-shrink-0">
                    {host.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-gray-900">{host.name}</h3>
                      <Badge
                        variant={host.status === "active" ? "success" : "warning"}
                        size="sm"
                      >
                        {host.status === "active" ? "Active" : "Pending Invite"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">{host.email}</p>

                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <Shield className="w-4 h-4 text-gray-400" />
                      {host.permissions.map((perm) => (
                        <Badge key={perm} variant="gray" size="sm">
                          {permissionLabels[perm] || perm}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>
                        Commission:{" "}
                        <span className="font-semibold text-[#B87333]">{host.commission}%</span>
                      </span>
                      <span className="text-gray-300">|</span>
                      <span>Joined {host.joinedAt}</span>
                    </div>
                  </div>
                  <button className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Invite Host Modal */}
      <Modal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)} title="Invite Host" size="md">
        <div className="space-y-5">
          <Input
            label="Email Address"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="host@example.com"
            leftIcon={<Mail className="w-4 h-4" />}
            fullWidth
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Permissions</label>
            <div className="space-y-3">
              {PERMISSION_OPTIONS.map((perm) => (
                <label
                  key={perm.key}
                  className="flex items-start gap-3 cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    checked={invitePermissions.includes(perm.key)}
                    onChange={() => handleTogglePermission(perm.key)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#0B3D2C] focus:ring-[#0B3D2C]"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900 group-hover:text-[#0B3D2C] transition-colors">
                      {perm.label}
                    </p>
                    <p className="text-xs text-gray-500">{perm.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <Input
            label="Commission Percentage"
            type="number"
            value={inviteCommission}
            onChange={(e) => setInviteCommission(e.target.value)}
            placeholder="e.g. 15"
            helperText="Percentage of booking revenue the host earns"
            fullWidth
          />
        </div>

        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowInviteModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleInvite}
            disabled={!inviteEmail.trim()}
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            Send Invitation
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
