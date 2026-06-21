"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { KYCSubmissionForm } from "@/components/kyc/KYCSubmissionForm";
import { KYCReviewScreen } from "@/components/kyc/KYCReviewScreen";
import { api, extractErrorMessage } from "@/lib/api";
import type { ApiVerification } from "@/lib/api-types";

type ViewState = "loading" | "form" | "pending" | "approved" | "rejected" | "error";

export default function KYCPage() {
  const router = useRouter();
  const { user, activeRole, updateKYCStatus } = useAuth();
  const [state, setState] = useState<ViewState>("loading");
  const [latest, setLatest] = useState<ApiVerification | null>(null);
  const [loadError, setLoadError] = useState("");

  const refresh = useCallback(async () => {
    setState("loading");
    setLoadError("");
    try {
      const verifications = await api.get<ApiVerification[]>(
        "/v1/verifications/me/"
      );
      // Backend returns newest first
      const newest = verifications[0] ?? null;
      setLatest(newest);

      if (!newest) {
        setState("form");
        return;
      }
      if (newest.status === "APPROVED") {
        setState("approved");
        updateKYCStatus("APPROVED");
        return;
      }
      if (newest.status === "PENDING") {
        setState("pending");
        updateKYCStatus("PENDING_REVIEW");
        return;
      }
      if (newest.status === "REJECTED") {
        setState("rejected");
        updateKYCStatus("REJECTED");
        return;
      }
      setState("form");
    } catch (err) {
      setLoadError(extractErrorMessage(err));
      setState("error");
    }
  }, [updateKYCStatus]);

  useEffect(() => {
    if (!user) return;
    // Backend only allows HOST/OWNER to access /v1/verifications/. Bounce
    // guests back to their dashboard before firing a request that would 403.
    if (activeRole !== "HOST" && activeRole !== "OWNER") {
      router.replace("/");
      return;
    }
    refresh();
  }, [user, activeRole, refresh, router]);

  if (!user) return null;
  if (activeRole !== "HOST" && activeRole !== "OWNER") return null;

  const dashboardHref = activeRole === "OWNER" ? "/owner" : "/host";

  // ─── Loading ─────────────────────────────────────────────────────────────
  if (state === "loading") {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <div className="border border-gray-200 rounded-xl p-12 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-8 h-8 text-[#0B3D2C] animate-spin mb-3" />
          <p className="text-sm text-gray-500">Checking your verification…</p>
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <div className="border border-red-200 bg-red-50 rounded-xl p-8 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900">
              Couldn&apos;t load verification status
            </p>
            <p className="text-sm text-red-700 mt-1">{loadError}</p>
            <button
              onClick={refresh}
              className="mt-3 text-sm font-semibold underline text-red-700"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Status screens ──────────────────────────────────────────────────────
  if (state === "pending") {
    return (
      <div className="max-w-xl mx-auto py-12">
        <KYCReviewScreen status="PENDING_REVIEW" />
      </div>
    );
  }

  if (state === "approved") {
    return (
      <div className="max-w-xl mx-auto py-12">
        <KYCReviewScreen
          status="APPROVED"
          onContinue={() => router.push(dashboardHref)}
        />
      </div>
    );
  }

  if (state === "rejected") {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <KYCSubmissionForm
          previousRejection={
            latest?.admin_notes ||
            "Your previous submission was not approved. Please resubmit with clearer documents."
          }
          onSubmitted={(verification) => {
            setLatest(verification);
            setState("pending");
            updateKYCStatus("PENDING_REVIEW");
          }}
        />
      </div>
    );
  }

  // ─── Submission form ─────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            Verify your identity
          </h1>
          <p className="text-sm text-gray-500">
            Required to {activeRole === "OWNER" ? "list properties" : "manage bookings"}
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key="form"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          <KYCSubmissionForm
            onSubmitted={(verification) => {
              setLatest(verification);
              setState("pending");
              updateKYCStatus("PENDING_REVIEW");
            }}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
