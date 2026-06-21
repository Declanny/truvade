"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Shield,
  Lock,
  Eye,
  Camera,
  Loader2,
  AlertCircle,
  Check,
  X,
} from "lucide-react";
import { Avatar, Input, Button } from "@/components/ui";
import { AddressAutocomplete } from "@/components/ui/AddressAutocomplete";
import { api, extractErrorMessage } from "@/lib/api";
import type { ApiProfile } from "@/lib/api-types";
import { useAuth } from "@/context/AuthContext";

type EditField =
  | "name"
  | "preferred_name"
  | "phone"
  | "address"
  | "emergency_contact"
  | "bio"
  | "work"
  | "location"
  | null;

function FieldRow({
  label,
  value,
  placeholder = "Not provided",
  editing,
  editLabel,
  onEditToggle,
  onSave,
  saving,
  saveDisabled = false,
  saveDisabledReason,
  error,
  children,
}: {
  label: string;
  value?: string | null;
  placeholder?: string;
  editing: boolean;
  editLabel?: string;
  onEditToggle: () => void;
  onSave?: () => void;
  saving?: boolean;
  saveDisabled?: boolean;
  saveDisabledReason?: string;
  error?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="border-b border-gray-100 py-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">{label}</p>
          {!editing && (
            <p className="text-sm text-gray-500 mt-0.5 whitespace-pre-wrap break-words">
              {value || placeholder}
            </p>
          )}
        </div>
        <button
          onClick={onEditToggle}
          className="text-sm font-semibold text-gray-900 underline hover:text-gray-600 transition-colors ml-4 shrink-0"
        >
          {editing ? "Cancel" : editLabel || (value ? "Edit" : "Add")}
        </button>
      </div>
      {editing && (
        <div className="mt-4 space-y-3">
          {children}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="sm"
              onClick={onSave}
              loading={saving}
              disabled={saving || saveDisabled}
            >
              Save
            </Button>
            {saveDisabled && saveDisabledReason && !saving && (
              <span className="text-xs text-gray-500">{saveDisabledReason}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PersonalInfoPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ApiProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [editingField, setEditingField] = useState<EditField>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [savingField, setSavingField] = useState<EditField>(null);
  const [saveError, setSaveError] = useState<Record<string, string>>({});
  const [savedMessage, setSavedMessage] = useState("");
  /** Whether the user's current `draft.address` came from an autocomplete selection. */
  const [addressSelected, setAddressSelected] = useState(false);
  /** Same flag for the Location field, which also uses AddressAutocomplete. */
  const [locationSelected, setLocationSelected] = useState(false);

  // Avatar upload
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState("");

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const data = await api.get<ApiProfile>("/v1/profile/me/");
      setProfile(data);
    } catch (err) {
      setLoadError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleStartEdit = (field: NonNullable<EditField>) => {
    if (!profile) return;
    setDraft({ [field]: (profile[field] as string) || "" });
    setSaveError({});
    setSavedMessage("");
    setEditingField(field);
    if (field === "address") {
      // Treat the saved address as already-verified so the user doesn't have to
      // re-pick it just to look at the field. Editing one character will flip
      // the flag back via AddressAutocomplete's onChange.
      setAddressSelected(!!profile.address);
    }
    if (field === "location") {
      setLocationSelected(!!profile.location);
    }
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setSaveError({});
    setAddressSelected(false);
    setLocationSelected(false);
  };

  const handleSave = async (field: NonNullable<EditField>) => {
    setSavingField(field);
    setSaveError({});
    try {
      const updated = await api.patch<ApiProfile>("/v1/profile/me/", {
        [field]: draft[field],
      });
      setProfile(updated);
      setEditingField(null);
      setSavedMessage(`${humanField(field)} updated.`);
      setTimeout(() => setSavedMessage(""), 2500);
    } catch (err) {
      setSaveError({ [field]: extractErrorMessage(err) });
    } finally {
      setSavingField(null);
    }
  };

  const handleAvatarPick = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    setAvatarError("");
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const updated = await api.post<ApiProfile>(
        "/v1/profile/me/avatar/",
        formData
      );
      setProfile(updated);
    } catch (err) {
      setAvatarError(extractErrorMessage(err));
    } finally {
      setUploadingAvatar(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#0B3D2C] animate-spin" />
      </div>
    );
  }

  if (loadError || !profile) {
    return (
      <div className="py-12">
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p>{loadError || "Couldn't load your profile."}</p>
            <button
              onClick={fetchProfile}
              className="mt-2 underline font-semibold"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Personal information
      </h2>
      {savedMessage && (
        <div className="flex items-center gap-2 mb-6 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700">
          <Check className="w-3.5 h-3.5 shrink-0" />
          <span>{savedMessage}</span>
        </div>
      )}

      {/* Avatar */}
      <div className="mt-6 mb-4">
        <p className="text-sm font-semibold text-gray-900 mb-3">Profile photo</p>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar
              src={profile.avatar ?? undefined}
              name={profile.name}
              size="xl"
              verified={profile.is_verified}
            />
            {uploadingAvatar && (
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
          </div>
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarPick}
            />
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Camera className="w-3.5 h-3.5" />}
              onClick={() => fileRef.current?.click()}
              disabled={uploadingAvatar}
            >
              {profile.avatar ? "Change photo" : "Upload photo"}
            </Button>
            {avatarError && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-red-600">
                <X className="w-3 h-3" />
                {avatarError}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <FieldRow
          label="Full name"
          value={profile.name}
          editing={editingField === "name"}
          onEditToggle={() =>
            editingField === "name" ? handleCancelEdit() : handleStartEdit("name")
          }
          onSave={() => handleSave("name")}
          saving={savingField === "name"}
          error={saveError.name}
        >
          <Input
            label="Full name"
            value={draft.name ?? ""}
            onChange={(e) => setDraft({ name: e.target.value })}
            fullWidth
          />
        </FieldRow>

        <FieldRow
          label="Preferred first name"
          value={profile.preferred_name}
          editing={editingField === "preferred_name"}
          onEditToggle={() =>
            editingField === "preferred_name"
              ? handleCancelEdit()
              : handleStartEdit("preferred_name")
          }
          onSave={() => handleSave("preferred_name")}
          saving={savingField === "preferred_name"}
          error={saveError.preferred_name}
        >
          <Input
            label="Preferred name"
            value={draft.preferred_name ?? ""}
            onChange={(e) => setDraft({ preferred_name: e.target.value })}
            fullWidth
          />
        </FieldRow>

        {/* Email — read-only */}
        <div className="border-b border-gray-100 py-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">Email address</p>
              <p className="text-sm text-gray-500 mt-0.5">{profile.email}</p>
              <p className="text-xs text-gray-400 mt-1">
                Email cannot be changed.
              </p>
            </div>
          </div>
        </div>

        <FieldRow
          label="Phone number"
          value={profile.phone}
          placeholder="Add a number so confirmed guests and Truvade can get in touch."
          editing={editingField === "phone"}
          onEditToggle={() =>
            editingField === "phone"
              ? handleCancelEdit()
              : handleStartEdit("phone")
          }
          onSave={() => handleSave("phone")}
          saving={savingField === "phone"}
          error={saveError.phone}
        >
          <Input
            label="Phone number"
            value={draft.phone ?? ""}
            onChange={(e) => setDraft({ phone: e.target.value })}
            placeholder="+234 XXX XXX XXXX"
            fullWidth
          />
        </FieldRow>

        {/* Identity verification — HOST/OWNER only (backend gates KYC behind those roles) */}
        {(profile.role === "HOST" || profile.role === "OWNER") && (
          <div className="border-b border-gray-100 py-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  Identity verification
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {profile.is_verified
                    ? "Verified"
                    : user?.kycStatus === "PENDING_REVIEW"
                    ? "Under review"
                    : "Not started"}
                </p>
              </div>
              {!profile.is_verified && user?.kycStatus !== "PENDING_REVIEW" && (
                <Link
                  href="/kyc"
                  className="text-sm font-semibold text-gray-900 underline hover:text-gray-600 transition-colors ml-4"
                >
                  Start
                </Link>
              )}
            </div>
          </div>
        )}

        <FieldRow
          label="Address"
          value={profile.address}
          editing={editingField === "address"}
          onEditToggle={() =>
            editingField === "address"
              ? handleCancelEdit()
              : handleStartEdit("address")
          }
          onSave={() => handleSave("address")}
          saving={savingField === "address"}
          saveDisabled={!addressSelected}
          saveDisabledReason="Pick an address from the list to verify it."
          error={saveError.address}
        >
          <AddressAutocomplete
            label="Address"
            value={draft.address ?? ""}
            initiallySelected={
              (draft.address ?? "") === (profile.address ?? "") &&
              !!profile.address
            }
            onChange={(next, place) => {
              setDraft({ address: next });
              setAddressSelected(!!place);
            }}
          />
        </FieldRow>

        <FieldRow
          label="Emergency contact"
          value={profile.emergency_contact}
          editing={editingField === "emergency_contact"}
          onEditToggle={() =>
            editingField === "emergency_contact"
              ? handleCancelEdit()
              : handleStartEdit("emergency_contact")
          }
          onSave={() => handleSave("emergency_contact")}
          saving={savingField === "emergency_contact"}
          error={saveError.emergency_contact}
        >
          <Input
            label="Name and phone number"
            value={draft.emergency_contact ?? ""}
            onChange={(e) => setDraft({ emergency_contact: e.target.value })}
            placeholder="e.g. Kemi Nwosu — +234 802 345 6789"
            fullWidth
          />
        </FieldRow>

        <FieldRow
          label="Bio"
          value={profile.bio}
          editing={editingField === "bio"}
          onEditToggle={() =>
            editingField === "bio" ? handleCancelEdit() : handleStartEdit("bio")
          }
          onSave={() => handleSave("bio")}
          saving={savingField === "bio"}
          error={saveError.bio}
        >
          <textarea
            value={draft.bio ?? ""}
            onChange={(e) => setDraft({ bio: e.target.value })}
            rows={4}
            placeholder="Tell hosts a bit about yourself…"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#0B3D2C] transition-colors resize-none"
          />
        </FieldRow>

        <FieldRow
          label="Work"
          value={profile.work}
          editing={editingField === "work"}
          onEditToggle={() =>
            editingField === "work" ? handleCancelEdit() : handleStartEdit("work")
          }
          onSave={() => handleSave("work")}
          saving={savingField === "work"}
          error={saveError.work}
        >
          <Input
            label="Work"
            value={draft.work ?? ""}
            onChange={(e) => setDraft({ work: e.target.value })}
            placeholder="e.g. Product Designer at TechCo"
            fullWidth
          />
        </FieldRow>

        <FieldRow
          label="Location"
          value={profile.location}
          editing={editingField === "location"}
          onEditToggle={() =>
            editingField === "location"
              ? handleCancelEdit()
              : handleStartEdit("location")
          }
          onSave={() => handleSave("location")}
          saving={savingField === "location"}
          saveDisabled={!locationSelected}
          saveDisabledReason="Pick a place from the list to verify it."
          error={saveError.location}
        >
          <AddressAutocomplete
            label="Location"
            value={draft.location ?? ""}
            placeholder="e.g. Lagos, Nigeria"
            initiallySelected={
              (draft.location ?? "") === (profile.location ?? "") &&
              !!profile.location
            }
            onChange={(next, place) => {
              setDraft({ location: next });
              setLocationSelected(!!place);
            }}
          />
        </FieldRow>
      </div>

      {/* Info cards */}
      <div className="mt-8 border border-gray-200 rounded-xl p-6 space-y-6">
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
            <Lock className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Why isn&apos;t my info shown here?
            </h3>
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
            <h3 className="text-sm font-semibold text-gray-900">
              Which details can be edited?
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Contact info and personal details can be edited. If this info was
              used to verify your identity, you&apos;ll need to get verified
              again.
            </p>
          </div>
        </div>
        <div className="border-t border-gray-100" />
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
            <Eye className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              What info is shared with others?
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Truvade only releases contact information for hosts and guests
              after a reservation is confirmed.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function humanField(field: NonNullable<EditField>): string {
  return {
    name: "Full name",
    preferred_name: "Preferred name",
    phone: "Phone number",
    address: "Address",
    emergency_contact: "Emergency contact",
    bio: "Bio",
    work: "Work",
    location: "Location",
  }[field];
}
