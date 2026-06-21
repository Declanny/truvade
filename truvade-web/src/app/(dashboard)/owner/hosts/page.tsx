"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus,
  X,
  Check,
  Trash2,
  AlertTriangle,
  Copy,
  AlertCircle,
  Loader2,
  Mail,
} from "lucide-react";
import { Avatar, Badge } from "@/components/ui";
import { api, extractErrorMessage } from "@/lib/api";
import type { ApiInvitation, ApiMembership } from "@/lib/api-types";

function initialsOf(text: string): string {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatJoined(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NG", {
    month: "short",
    year: "numeric",
  });
}

function daysUntil(iso: string): number {
  return Math.max(
    0,
    Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );
}

function SectionSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {[1, 2].map((i) => (
        <div
          key={i}
          className="border border-gray-200 rounded-xl p-5 animate-pulse"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-3 bg-gray-200 rounded w-2/3" />
              <div className="h-3 bg-gray-200 rounded w-1/3 mt-3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function OwnerHostsPage() {
  const [memberships, setMemberships] = useState<ApiMembership[]>([]);
  const [invitations, setInvitations] = useState<ApiInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

  const [revokingId, setRevokingId] = useState<number | null>(null);
  const [revokeError, setRevokeError] = useState<Record<number, string>>({});
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [removeError, setRemoveError] = useState<Record<number, string>>({});
  const [confirmRevokeId, setConfirmRevokeId] = useState<number | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<number | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setFetchError("");
    try {
      const [ms, invs] = await Promise.all([
        api.get<ApiMembership[]>("/v1/hosts/"),
        api.get<ApiInvitation[]>("/v1/invitations/sent/"),
      ]);
      setMemberships(ms);
      setInvitations(invs);
    } catch (err) {
      setFetchError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleSendInvite = async () => {
    const email = inviteEmail.trim();
    if (!email) return;
    setSending(true);
    setSendError("");
    try {
      const newInv = await api.post<ApiInvitation>("/v1/invitations/", {
        email,
      });
      setInvitations((prev) => [newInv, ...prev]);
      setInviteEmail("");
      setShowInvite(false);
    } catch (err) {
      setSendError(extractErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const handleRevoke = async (invitationId: number) => {
    setRevokingId(invitationId);
    setRevokeError((prev) => ({ ...prev, [invitationId]: "" }));
    try {
      const updated = await api.post<ApiInvitation>(
        `/v1/invitations/${invitationId}/revoke/`,
        {}
      );
      setInvitations((prev) =>
        prev.map((i) => (i.id === invitationId ? updated : i))
      );
      setConfirmRevokeId(null);
    } catch (err) {
      setRevokeError((prev) => ({
        ...prev,
        [invitationId]: extractErrorMessage(err),
      }));
    } finally {
      setRevokingId(null);
    }
  };

  const handleRemoveHost = async (membershipId: number) => {
    setRemovingId(membershipId);
    setRemoveError((prev) => ({ ...prev, [membershipId]: "" }));
    try {
      await api.post(`/v1/hosts/${membershipId}/remove/`, {});
      setMemberships((prev) => prev.filter((m) => m.id !== membershipId));
      setConfirmRemoveId(null);
    } catch (err) {
      setRemoveError((prev) => ({
        ...prev,
        [membershipId]: extractErrorMessage(err),
      }));
    } finally {
      setRemovingId(null);
    }
  };

  const handleCopyLink = (token: string) => {
    const link = `${window.location.origin}/invitations/${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const activeMemberships = memberships.filter((m) => m.is_active);
  const pendingInvites = invitations.filter((i) => i.status === "PENDING");

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hosts</h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading
              ? "Loading…"
              : `${activeMemberships.length} active · ${pendingInvites.length} pending`}
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

      {fetchError && (
        <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 mb-6">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{fetchError}</span>
          <button
            onClick={fetchAll}
            className="ml-auto text-sm font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Invite form */}
      <AnimatePresence>
        {showInvite && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8 overflow-hidden"
          >
            <div className="border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Invite a host
                </h2>
                <button
                  onClick={() => {
                    setShowInvite(false);
                    setSendError("");
                    setInviteEmail("");
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Enter their email — we&apos;ll send them a link to join. You can
                assign properties and commission after they accept, from each
                property&apos;s detail page.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="host@example.com"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 transition-colors"
                />
                <button
                  onClick={handleSendInvite}
                  disabled={!inviteEmail.trim() || sending}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4" />
                  )}
                  {sending ? "Sending…" : "Send invitation"}
                </button>
              </div>

              {sendError && (
                <div className="flex items-start gap-2 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>{sendError}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <SectionSkeleton />
      ) : (
        <>
          {/* Active hosts */}
          {activeMemberships.length > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                Active Hosts
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {activeMemberships.map((m, i) => {
                  const isRemoving = removingId === m.id;
                  const isConfirming = confirmRemoveId === m.id;
                  const error = removeError[m.id];
                  return (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <Avatar
                          initials={initialsOf(m.host_name || m.host_email)}
                          name={m.host_name || m.host_email}
                          size="md"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2.5">
                            <h3 className="text-sm font-semibold text-gray-900 truncate">
                              {m.host_name || m.host_email}
                            </h3>
                            <Badge variant="success" size="sm">
                              Active
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500 mt-0.5 truncate">
                            {m.host_email}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            Joined {formatJoined(m.created_at)}
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            setConfirmRemoveId(isConfirming ? null : m.id)
                          }
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          title="Remove host"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {isConfirming && (
                        <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-red-900">
                              Remove {m.host_name || m.host_email}?
                            </p>
                            <p className="text-sm text-red-700 mt-0.5">
                              They&apos;ll lose access to all properties
                              you&apos;ve assigned them to.
                            </p>
                            {error && (
                              <p className="text-xs text-red-700 mt-2 font-medium">
                                {error}
                              </p>
                            )}
                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={() => handleRemoveHost(m.id)}
                                disabled={isRemoving}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                              >
                                {isRemoving && (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                )}
                                Remove
                              </button>
                              <button
                                onClick={() => setConfirmRemoveId(null)}
                                disabled={isRemoving}
                                className="px-4 py-2 border border-red-300 text-red-700 text-sm font-medium rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pending invitations */}
          {pendingInvites.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                Pending Invitations
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {pendingInvites.map((inv, i) => {
                  const isRevoking = revokingId === inv.id;
                  const isConfirming = confirmRevokeId === inv.id;
                  const isCopied = copiedToken === inv.token;
                  const error = revokeError[inv.id];
                  const days = daysUntil(inv.expires_at);
                  return (
                    <motion.div
                      key={inv.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="border border-dashed border-gray-300 rounded-xl p-5 bg-gray-50/50"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-500 shrink-0">
                          {initialsOf(inv.email)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2.5">
                            <h3 className="text-sm font-semibold text-gray-900 truncate">
                              {inv.email}
                            </h3>
                            <Badge variant="warning" size="sm">
                              Pending
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-400 mt-2">
                            Expires in {days} day{days !== 1 ? "s" : ""}
                          </p>

                          <div className="flex flex-wrap gap-2 mt-3">
                            <button
                              onClick={() => handleCopyLink(inv.token)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-white transition-colors"
                            >
                              {isCopied ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  Copied
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  Copy invite link
                                </>
                              )}
                            </button>
                            <button
                              onClick={() =>
                                setConfirmRevokeId(isConfirming ? null : inv.id)
                              }
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                              Revoke
                            </button>
                          </div>
                        </div>
                      </div>

                      {isConfirming && (
                        <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-red-900">
                              Revoke invitation?
                            </p>
                            <p className="text-sm text-red-700 mt-0.5">
                              The invite link will stop working immediately.
                            </p>
                            {error && (
                              <p className="text-xs text-red-700 mt-2 font-medium">
                                {error}
                              </p>
                            )}
                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={() => handleRevoke(inv.id)}
                                disabled={isRevoking}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                              >
                                {isRevoking && (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                )}
                                Revoke
                              </button>
                              <button
                                onClick={() => setConfirmRevokeId(null)}
                                disabled={isRevoking}
                                className="px-4 py-2 border border-red-300 text-red-700 text-sm font-medium rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {activeMemberships.length === 0 && pendingInvites.length === 0 && (
            <div className="text-center py-16">
              <UserPlus className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No hosts yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Invite a host by email to help manage your properties.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
