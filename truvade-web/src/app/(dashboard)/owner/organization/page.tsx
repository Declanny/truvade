"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Building2, Save, UserPlus, X, AlertCircle } from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Select,
  Skeleton,
} from "@/components/ui";
import { extractErrorMessage } from "@/lib/api";
import {
  createMyOrganization,
  getMyOrganization,
  inviteOrganizationMember,
  listOrganizationInvitations,
  removeOrganizationMember,
  revokeOrganizationInvitation,
  updateMyOrganization,
} from "@/lib/api-organizations";
import type {
  ApiCreateOrganizationPayload,
  ApiOrganization,
  ApiOrganizationInvitation,
  ApiOrgBusinessType,
  ApiOrgMemberRole,
  ApiUpdateOrganizationPayload,
} from "@/lib/api-types";

const BUSINESS_TYPES: { value: ApiOrgBusinessType; label: string }[] = [
  { value: "SOLE", label: "Sole proprietor" },
  { value: "LIMITED", label: "Limited company" },
  { value: "PARTNERSHIP", label: "Partnership" },
  { value: "OTHER", label: "Other" },
];

const INVITE_ROLES: { value: ApiOrgMemberRole; label: string }[] = [
  { value: "HOST", label: "Host" },
  { value: "COHOST", label: "Co-host" },
  { value: "MANAGER", label: "Manager" },
  { value: "VIEWER", label: "Viewer" },
];

export default function OrganizationSettingsPage() {
  const [org, setOrg] = useState<ApiOrganization | null>(null);
  const [invitations, setInvitations] = useState<ApiOrganizationInvitation[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const o = await getMyOrganization();
      setOrg(o);
      if (o) {
        try {
          setInvitations(await listOrganizationInvitations());
        } catch {
          // Non-fatal — invitations are auxiliary
        }
      }
    } catch (err) {
      setLoadError(extractErrorMessage(err));
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  if (loading) {
    return <PageSkeleton />;
  }

  if (loadError) {
    return (
      <div className="max-w-2xl">
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{loadError}</span>
        </div>
      </div>
    );
  }

  if (!org) {
    return (
      <CreateOrganizationForm
        onCreated={(created) => {
          setOrg(created);
          setInvitations([]);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{org.name}</h1>

      <OrganizationDetailsForm
        org={org}
        onSaved={(updated) => setOrg(updated)}
      />

      <MembersCard
        org={org}
        onRemoved={(memberId) =>
          setOrg({
            ...org,
            members: org.members.filter((m) => m.id !== memberId),
            member_count: Math.max(0, org.member_count - 1),
          })
        }
      />

      <InvitationsCard
        invitations={invitations}
        onInvited={(inv) => setInvitations((prev) => [inv, ...prev])}
        onRevoked={(inv) =>
          setInvitations((prev) =>
            prev.map((i) => (i.id === inv.id ? inv : i))
          )
        }
      />
    </div>
  );
}

// ── Create form ───────────────────────────────────────────────────────────────

function CreateOrganizationForm({
  onCreated,
}: {
  onCreated: (org: ApiOrganization) => void;
}) {
  const [name, setName] = useState("");
  const [businessType, setBusinessType] = useState<ApiOrgBusinessType>("SOLE");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!name.trim()) {
      setError("Organization name is required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload: ApiCreateOrganizationPayload = {
        name: name.trim(),
        business_type: businessType,
      };
      const created = await createMyOrganization(payload);
      onCreated(created);
    } catch (err) {
      setError(extractErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card variant="bordered" padding="lg">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#0B3D2C]" />
              <h2 className="text-lg font-semibold text-gray-900">
                Set up your organization
              </h2>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Formalize your hosting business so you can invite team members
              and manage listings together.
            </p>
          </CardHeader>
          <CardBody className="space-y-4">
            <Input
              label="Organization name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Stays"
              fullWidth
            />
            <Select
              label="Business type"
              value={businessType}
              onChange={(e) =>
                setBusinessType(e.target.value as ApiOrgBusinessType)
              }
              options={BUSINESS_TYPES}
              fullWidth
            />
            {error && (
              <div
                role="alert"
                className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {error}
              </div>
            )}
            <div className="flex justify-end pt-2">
              <Button
                variant="primary"
                onClick={handleSubmit}
                loading={submitting}
              >
                Create organization
              </Button>
            </div>
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
}

// ── Details form ──────────────────────────────────────────────────────────────

function OrganizationDetailsForm({
  org,
  onSaved,
}: {
  org: ApiOrganization;
  onSaved: (org: ApiOrganization) => void;
}) {
  const [name, setName] = useState(org.name);
  const [businessType, setBusinessType] = useState<ApiOrgBusinessType>(
    org.business_type
  );
  const [registrationNumber, setRegistrationNumber] = useState(
    org.registration_number
  );
  const [taxId, setTaxId] = useState(org.tax_id);
  const [contactEmail, setContactEmail] = useState(org.contact_email);
  const [contactPhone, setContactPhone] = useState(org.contact_phone);
  const [website, setWebsite] = useState(org.website);
  const [address, setAddress] = useState(org.address);
  const [country, setCountry] = useState(org.country);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const payload: ApiUpdateOrganizationPayload = {
        name,
        business_type: businessType,
        registration_number: registrationNumber,
        tax_id: taxId,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        website,
        address,
        country,
      };
      const updated = await updateMyOrganization(payload);
      onSaved(updated);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card variant="bordered" padding="lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#0B3D2C]" />
            <h2 className="text-lg font-semibold text-gray-900">
              General information
            </h2>
          </div>
        </CardHeader>
        <CardBody className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Organization name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
            />
            <Select
              label="Business type"
              value={businessType}
              onChange={(e) =>
                setBusinessType(e.target.value as ApiOrgBusinessType)
              }
              options={BUSINESS_TYPES}
              fullWidth
            />
            <Input
              label="Registration number"
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value)}
              placeholder="RC123456"
              fullWidth
            />
            <Input
              label="Tax ID"
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              fullWidth
            />
            <Input
              label="Contact email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              fullWidth
            />
            <Input
              label="Contact phone"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              fullWidth
            />
            <Input
              label="Website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://"
              fullWidth
            />
            <Input
              label="Country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              fullWidth
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Business address
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              className="block w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 transition-colors focus:outline-none focus:border-[#0B3D2C] resize-none"
            />
          </div>
          {error && (
            <div
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </div>
          )}
          <div className="flex justify-end pt-1">
            <Button
              variant="primary"
              leftIcon={<Save className="w-4 h-4" />}
              loading={saving}
              onClick={handleSave}
            >
              Save changes
            </Button>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
}

// ── Members ───────────────────────────────────────────────────────────────────

function MembersCard({
  org,
  onRemoved,
}: {
  org: ApiOrganization;
  onRemoved: (memberId: number) => void;
}) {
  const [removingId, setRemovingId] = useState<number | null>(null);

  async function handleRemove(memberId: number) {
    setRemovingId(memberId);
    try {
      await removeOrganizationMember(memberId);
      onRemoved(memberId);
    } catch {
      // Surface inline next iteration; quiet failure for now.
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card variant="bordered" padding="lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Members ({org.member_count})
            </h2>
          </div>
        </CardHeader>
        <CardBody>
          <ul className="divide-y divide-gray-100">
            {org.members.map((member) => (
              <li
                key={member.id}
                className="flex items-center justify-between py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar
                    src={member.user_avatar ?? undefined}
                    initials={initials(member.user_name)}
                    size="md"
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {member.user_name || member.user_email}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {member.user_email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={member.role === "OWNER" ? "accent" : "gray"}>
                    {member.role.toLowerCase()}
                  </Badge>
                  {member.role !== "OWNER" && (
                    <button
                      onClick={() => handleRemove(member.id)}
                      disabled={removingId === member.id}
                      className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </motion.div>
  );
}

// ── Invitations ───────────────────────────────────────────────────────────────

function InvitationsCard({
  invitations,
  onInvited,
  onRevoked,
}: {
  invitations: ApiOrganizationInvitation[];
  onInvited: (inv: ApiOrganizationInvitation) => void;
  onRevoked: (inv: ApiOrganizationInvitation) => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ApiOrgMemberRole>("HOST");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<number | null>(null);

  async function handleInvite() {
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const inv = await inviteOrganizationMember(email.trim(), role);
      onInvited(inv);
      setEmail("");
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRevoke(invId: number) {
    setRevokingId(invId);
    try {
      const updated = await revokeOrganizationInvitation(invId);
      onRevoked(updated);
    } catch {
      // Quiet failure for now
    } finally {
      setRevokingId(null);
    }
  }

  const pending = invitations.filter((i) => i.status === "PENDING");
  const past = invitations.filter((i) => i.status !== "PENDING");

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card variant="bordered" padding="lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[#0B3D2C]" />
            <h2 className="text-lg font-semibold text-gray-900">
              Invite a team member
            </h2>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_auto] gap-2 items-end">
            <Input
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teammate@example.com"
              fullWidth
            />
            <Select
              label="Role"
              value={role}
              onChange={(e) => setRole(e.target.value as ApiOrgMemberRole)}
              options={INVITE_ROLES}
              fullWidth
            />
            <Button onClick={handleInvite} loading={submitting}>
              Send invite
            </Button>
          </div>
          {error && (
            <div
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {pending.length > 0 && (
            <div className="pt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Pending
              </h3>
              <ul className="divide-y divide-gray-100">
                {pending.map((inv) => (
                  <li
                    key={inv.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {inv.email}
                      </p>
                      <p className="text-xs text-gray-500">
                        Role: {inv.role.toLowerCase()} · expires{" "}
                        {formatDate(inv.expires_at)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRevoke(inv.id)}
                      disabled={revokingId === inv.id}
                      className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" />
                      Revoke
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {past.length > 0 && (
            <div className="pt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Past invitations
              </h3>
              <ul className="divide-y divide-gray-100">
                {past.slice(0, 10).map((inv) => (
                  <li
                    key={inv.id}
                    className="flex items-center justify-between py-2 text-sm"
                  >
                    <span className="text-gray-700 truncate">{inv.email}</span>
                    <Badge variant={badgeForStatus(inv.status)}>
                      {inv.status.toLowerCase()}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardBody>
      </Card>
    </motion.div>
  );
}

// ── helpers ───────────────────────────────────────────────────────────────────

function initials(name: string | undefined | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-NG", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function badgeForStatus(
  status: string
): "success" | "warning" | "error" | "gray" {
  switch (status) {
    case "ACCEPTED":
      return "success";
    case "PENDING":
      return "warning";
    case "EXPIRED":
    case "DECLINED":
    case "REVOKED":
      return "gray";
    default:
      return "gray";
  }
}

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-64 w-full rounded-xl" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}
