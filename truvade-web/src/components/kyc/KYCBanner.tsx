"use client";

import Link from "next/link";
import { Shield, ArrowRight, Clock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function KYCBanner() {
  const { user, isKYCRequired, activeRole } = useAuth();

  if (!user || !isKYCRequired) return null;

  const isPending = user.kycStatus === "PENDING_REVIEW";
  const isRejected = user.kycStatus === "REJECTED";

  if (isPending) {
    return (
      <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 flex items-center gap-3">
        <Clock className="w-5 h-5 text-warning-dark shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-warning-dark">Verification under review</p>
          <p className="text-xs text-warning-dark/70">We&apos;re reviewing your documents. This usually takes 24-48 hours.</p>
        </div>
      </div>
    );
  }

  return (
    <Link
      href="/kyc"
      className="block bg-primary/5 border border-primary/10 rounded-xl p-4 hover:bg-primary/10 transition-colors group"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">
            {isRejected ? "Verification failed — try again" : "Complete identity verification"}
          </p>
          <p className="text-xs text-gray-500">
            {isRejected
              ? "Your previous submission was not approved. Please resubmit your documents."
              : `Required to ${activeRole === "OWNER" ? "list properties and manage hosts" : "manage bookings and properties"}`}
          </p>
        </div>
        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
      </div>
    </Link>
  );
}
