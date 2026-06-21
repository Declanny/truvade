"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  X,
  Star,
  StarOff,
  Trash2,
  Loader2,
  AlertCircle,
  Check,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui";
import { api, extractErrorMessage } from "@/lib/api";
import type { ApiBank, ApiBankAccount } from "@/lib/api-types";

interface ResolvedAccount {
  account_number: string;
  account_name: string;
  bank_id?: number;
}

export default function PaymentsPage() {
  const [accounts, setAccounts] = useState<ApiBankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const data = await api.get<ApiBankAccount[]>("/v1/bank-accounts/mine/");
      setAccounts(data);
    } catch (err) {
      setLoadError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const showSavedMessage = (msg: string) => {
    setSavedMessage(msg);
    setTimeout(() => setSavedMessage(""), 2500);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Payouts</h2>
      <p className="text-sm text-gray-500 mt-0.5 mb-6">
        Bank accounts where you receive earnings from bookings.
      </p>

      {savedMessage && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700">
          <Check className="w-3.5 h-3.5 shrink-0" />
          <span>{savedMessage}</span>
        </div>
      )}

      {loadError && (
        <div className="flex items-start gap-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{loadError}</span>
          <button
            onClick={fetchAccounts}
            className="ml-auto text-sm font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Accounts list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="border border-gray-200 rounded-xl p-4 animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="border border-dashed border-gray-300 rounded-xl py-10 text-center">
          <CreditCard className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No bank accounts yet.</p>
          <p className="text-xs text-gray-400 mt-1">
            Add one to receive payouts.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map((acc) => (
            <BankAccountRow
              key={acc.id}
              account={acc}
              onChanged={(updated) => {
                setAccounts((prev) =>
                  prev.map((a) =>
                    a.id === updated.id
                      ? updated
                      : updated.is_default
                      ? { ...a, is_default: false }
                      : a
                  )
                );
              }}
              onDeactivated={(id) => {
                setAccounts((prev) => prev.filter((a) => a.id !== id));
                showSavedMessage("Bank account removed.");
              }}
              onMessage={showSavedMessage}
            />
          ))}
        </div>
      )}

      {/* Add account toggle */}
      {!showAddForm ? (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-[#0B3D2C] text-white text-sm font-semibold rounded-xl hover:bg-[#0F5240] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add bank account
        </button>
      ) : (
        <AddBankAccountForm
          onCancel={() => setShowAddForm(false)}
          onAdded={(account) => {
            setAccounts((prev) => {
              if (account.is_default) {
                return [account, ...prev.map((a) => ({ ...a, is_default: false }))];
              }
              return [account, ...prev];
            });
            setShowAddForm(false);
            showSavedMessage("Bank account added.");
          }}
        />
      )}
    </motion.div>
  );
}

// ─── Bank account row ─────────────────────────────────────────────────────────

function BankAccountRow({
  account,
  onChanged,
  onDeactivated,
  onMessage,
}: {
  account: ApiBankAccount;
  onChanged: (acc: ApiBankAccount) => void;
  onDeactivated: (id: number) => void;
  onMessage: (msg: string) => void;
}) {
  const [busy, setBusy] = useState<"default" | "deactivate" | null>(null);
  const [error, setError] = useState("");
  const [confirmRemove, setConfirmRemove] = useState(false);

  const handleSetDefault = async () => {
    if (account.is_default) return;
    setBusy("default");
    setError("");
    try {
      const updated = await api.post<ApiBankAccount>(
        `/v1/bank-accounts/${account.id}/set-default/`,
        {}
      );
      onChanged(updated);
      onMessage("Default payout account updated.");
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const handleDeactivate = async () => {
    setBusy("deactivate");
    setError("");
    try {
      await api.post(`/v1/bank-accounts/${account.id}/deactivate/`, {});
      onDeactivated(account.id);
    } catch (err) {
      setError(extractErrorMessage(err));
      setConfirmRemove(false);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="border border-gray-200 rounded-xl p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-gray-900">
              {account.bank_name}
            </p>
            {account.is_default && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#0B3D2C]/10 text-[#0B3D2C]">
                <Star className="w-2.5 h-2.5 fill-current" />
                Default
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {account.account_name}
          </p>
          <p className="text-xs text-gray-400 mt-0.5 font-mono">
            •••• {account.account_number.slice(-4)}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleSetDefault}
            disabled={account.is_default || busy !== null}
            title={account.is_default ? "Default account" : "Set as default"}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {busy === "default" ? (
              <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
            ) : account.is_default ? (
              <Star className="w-4 h-4 fill-[#0B3D2C] text-[#0B3D2C]" />
            ) : (
              <StarOff className="w-4 h-4 text-gray-400" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setConfirmRemove(true)}
            disabled={busy !== null}
            title="Remove account"
            className="p-2 rounded-lg hover:bg-red-50 disabled:opacity-30 transition-colors"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
        </div>
      </div>

      {confirmRemove && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm font-medium text-red-900">
            Remove this bank account?
          </p>
          <p className="text-xs text-red-700 mt-0.5">
            Future payouts won&apos;t go to this account.
          </p>
          {error && (
            <p className="text-xs text-red-700 mt-2 font-medium">{error}</p>
          )}
          <div className="flex gap-2 mt-3">
            <Button
              variant="primary"
              size="sm"
              onClick={handleDeactivate}
              loading={busy === "deactivate"}
              disabled={busy !== null}
              className="!bg-red-600 hover:!bg-red-700"
            >
              Remove
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmRemove(false)}
              disabled={busy !== null}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {error && !confirmRemove && (
        <div className="flex items-start gap-2 mt-3 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

// ─── Add bank account form ────────────────────────────────────────────────────

function AddBankAccountForm({
  onCancel,
  onAdded,
}: {
  onCancel: () => void;
  onAdded: (account: ApiBankAccount) => void;
}) {
  const [banks, setBanks] = useState<ApiBank[]>([]);
  const [banksLoading, setBanksLoading] = useState(true);
  const [banksError, setBanksError] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [resolved, setResolved] = useState<ResolvedAccount | null>(null);
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    api
      .get<ApiBank[]>("/v1/banks/")
      .then((data) => {
        setBanks(data);
        setBanksError("");
      })
      .catch((err) => {
        setBanksError(extractErrorMessage(err));
      })
      .finally(() => {
        setBanksLoading(false);
      });
  }, []);

  // Reset resolved if user changes bank or account number
  useEffect(() => {
    setResolved(null);
    setResolveError("");
  }, [bankCode, accountNumber]);

  const canResolve =
    bankCode && /^\d{10}$/.test(accountNumber) && !resolving && !resolved;

  const handleResolve = async () => {
    if (!canResolve) return;
    setResolving(true);
    setResolveError("");
    try {
      const data = await api.post<ResolvedAccount>("/v1/banks/resolve/", {
        bank_code: bankCode,
        account_number: accountNumber,
      });
      setResolved(data);
    } catch (err) {
      setResolveError(extractErrorMessage(err));
    } finally {
      setResolving(false);
    }
  };

  const handleSave = async () => {
    if (!resolved) return;
    const bank = banks.find((b) => b.code === bankCode);
    if (!bank) return;
    setSaving(true);
    setSaveError("");
    try {
      const account = await api.post<ApiBankAccount>("/v1/bank-accounts/", {
        bank_name: bank.name,
        bank_code: bank.code,
        account_number: resolved.account_number,
        account_name: resolved.account_name,
      });
      onAdded(account);
    } catch (err) {
      setSaveError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-6 border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900">
          Add bank account
        </h3>
        <button
          onClick={onCancel}
          className="p-1 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {banksError && (
        <div className="flex items-start gap-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>{banksError}</span>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bank
          </label>
          <select
            value={bankCode}
            onChange={(e) => setBankCode(e.target.value)}
            disabled={banksLoading || saving}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:border-[#0B3D2C] transition-colors bg-white disabled:opacity-60"
          >
            <option value="">
              {banksLoading ? "Loading banks…" : "Select your bank"}
            </option>
            {banks.map((b) => (
              <option key={b.code} value={b.code}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Account number
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={accountNumber}
            onChange={(e) =>
              setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))
            }
            placeholder="10-digit NUBAN"
            disabled={saving}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#0B3D2C] transition-colors tracking-wider disabled:opacity-60"
          />
          <p className="text-xs text-gray-400 mt-1.5">
            {accountNumber.length}/10 digits
          </p>
        </div>

        {/* Resolved account name */}
        {resolved && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-start gap-2">
            <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-emerald-900">
                {resolved.account_name}
              </p>
              <p className="text-xs text-emerald-700 mt-0.5">
                Verified with{" "}
                {banks.find((b) => b.code === bankCode)?.name || "your bank"}.
              </p>
            </div>
          </div>
        )}

        {resolveError && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>{resolveError}</span>
          </div>
        )}

        {saveError && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {!resolved ? (
            <Button
              variant="primary"
              onClick={handleResolve}
              loading={resolving}
              disabled={!canResolve}
            >
              Verify account
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleSave}
              loading={saving}
              disabled={saving}
            >
              Save account
            </Button>
          )}
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={resolving || saving}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
