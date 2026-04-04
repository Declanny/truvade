"use client";

import { motion } from "framer-motion";
import { Clock, CheckCircle, XCircle } from "lucide-react";
import type { KYCStatus } from "@/lib/types";

interface KYCReviewScreenProps {
  status: KYCStatus;
  rejectionReason?: string;
  onRetry?: () => void;
  onContinue?: () => void;
}

export function KYCReviewScreen({ status, rejectionReason, onRetry, onContinue }: KYCReviewScreenProps) {
  if (status === "PENDING_REVIEW") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="border border-gray-200 rounded-xl p-8 text-center"
      >
        <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
          <Clock className="w-6 h-6 text-amber-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Under review</h2>
        <p className="text-sm text-gray-500 max-w-xs mx-auto">
          Your documents are being reviewed. This usually takes 24–48 hours.
        </p>
      </motion.div>
    );
  }

  if (status === "APPROVED") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="border border-gray-200 rounded-xl p-8 text-center"
      >
        <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-6 h-6 text-emerald-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Verified</h2>
        <p className="text-sm text-gray-500 max-w-xs mx-auto mb-6">
          Your identity is verified. You can now manage properties and bookings.
        </p>
        {onContinue && (
          <button
            onClick={onContinue}
            className="px-6 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors"
          >
            Go to dashboard
          </button>
        )}
      </motion.div>
    );
  }

  if (status === "REJECTED") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="border border-gray-200 rounded-xl p-8 text-center"
      >
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-6 h-6 text-red-500" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Verification failed</h2>
        <p className="text-sm text-gray-500 max-w-xs mx-auto mb-6">
          {rejectionReason || "Your documents could not be verified. Please try again with clearer documents."}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-6 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors"
          >
            Try again
          </button>
        )}
      </motion.div>
    );
  }

  return null;
}
