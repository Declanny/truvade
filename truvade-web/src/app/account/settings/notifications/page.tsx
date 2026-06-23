"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Toggle } from "@/components/ui";
import { Skeleton } from "@/components/ui";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from "@/lib/api-notifications";
import type {
  ApiNotificationPreference,
  ApiNotificationPreferencePatch,
} from "@/lib/api-types";
import { extractErrorMessage } from "@/lib/api";

type PrefKey = keyof Omit<ApiNotificationPreference, "updated_at">;

interface PrefRow {
  key: PrefKey;
  label: string;
  description: string;
}

interface PrefGroup {
  title: string;
  subtitle?: string;
  rows: PrefRow[];
}

const GROUPS: PrefGroup[] = [
  {
    title: "Account activity",
    rows: [
      {
        key: "email_bookings",
        label: "Booking emails",
        description: "Confirmations, reminders, and cancellations for your stays.",
      },
      {
        key: "email_messages",
        label: "Message emails",
        description: "Get an email when a host or guest sends you a message.",
      },
      {
        key: "sms_booking_confirmations",
        label: "SMS booking confirmations",
        description: "Text alerts when a booking is confirmed.",
      },
      {
        key: "sms_security",
        label: "SMS security alerts",
        description: "Notify me by text about unusual sign-ins.",
      },
      {
        key: "push_enabled",
        label: "Push notifications",
        description: "Show notifications on this device.",
      },
    ],
  },
  {
    title: "Hosting",
    subtitle: "Notifications for your properties and guests.",
    rows: [
      {
        key: "push_bookings",
        label: "New booking activity",
        description: "Push alerts for new requests, cancellations, and check-ins.",
      },
      {
        key: "push_messages",
        label: "Guest messages",
        description: "Push alerts when guests message you.",
      },
      {
        key: "email_payouts",
        label: "Payout updates",
        description: "Email when a payout is processed to your bank account.",
      },
      {
        key: "email_reviews",
        label: "Review reminders",
        description: "Email after a guest checks out so you can leave a review.",
      },
    ],
  },
  {
    title: "Marketing",
    rows: [
      {
        key: "email_marketing",
        label: "Deals and recommendations",
        description: "Occasional emails about new features and offers.",
      },
    ],
  },
];

export default function NotificationsPage() {
  const [prefs, setPrefs] = useState<ApiNotificationPreference | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState<PrefKey | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getNotificationPreferences();
        if (!cancelled) setPrefs(data);
      } catch (err) {
        if (!cancelled) setLoadError(extractErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function toggle(key: PrefKey, next: boolean) {
    if (!prefs) return;
    const previous = prefs[key];
    // Optimistic update
    setPrefs({ ...prefs, [key]: next });
    setSaving(key);
    setSaveError(null);
    try {
      const patch: ApiNotificationPreferencePatch = { [key]: next };
      const updated = await updateNotificationPreferences(patch);
      setPrefs(updated);
    } catch (err) {
      // Rollback
      setPrefs((curr) => (curr ? { ...curr, [key]: previous } : curr));
      setSaveError(extractErrorMessage(err));
    } finally {
      setSaving(null);
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Notifications</h2>
      <p className="text-sm text-gray-500 mb-8">
        Choose how and when you want to be notified.
      </p>

      {saveError && (
        <div
          role="alert"
          className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {saveError}
        </div>
      )}

      {loading && <PrefsSkeleton />}

      {!loading && loadError && (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700"
        >
          Couldn’t load your preferences. {loadError}
        </div>
      )}

      {!loading && !loadError && prefs && (
        <div className="space-y-10">
          {GROUPS.map((group) => (
            <section key={group.title}>
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                {group.title}
              </h3>
              {group.subtitle && (
                <p className="text-sm text-gray-500 mb-4">{group.subtitle}</p>
              )}
              <div className="divide-y divide-gray-100">
                {group.rows.map((row) => (
                  <PreferenceRow
                    key={row.key}
                    label={row.label}
                    description={row.description}
                    checked={prefs[row.key]}
                    busy={saving === row.key}
                    onChange={(v) => toggle(row.key, v)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function PreferenceRow({
  label,
  description,
  checked,
  busy,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  busy: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-6 py-5">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        <p className="mt-0.5 text-sm text-gray-500">{description}</p>
      </div>
      <Toggle
        checked={checked}
        onChange={onChange}
        disabled={busy}
        aria-label={label}
      />
    </div>
  );
}

function PrefsSkeleton() {
  return (
    <div className="space-y-10">
      {[1, 2, 3].map((g) => (
        <div key={g}>
          <Skeleton className="mb-4 h-5 w-32" />
          <div className="divide-y divide-gray-100">
            {[1, 2, 3].map((r) => (
              <div key={r} className="flex items-center justify-between py-5">
                <div className="flex-1">
                  <Skeleton className="mb-2 h-4 w-48" />
                  <Skeleton className="h-3 w-72" />
                </div>
                <Skeleton className="h-6 w-11 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
