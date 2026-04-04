"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { KYCIdentityStep } from "@/components/kyc/KYCIdentityStep";
import { KYCAddressStep } from "@/components/kyc/KYCAddressStep";
import { KYCReviewScreen } from "@/components/kyc/KYCReviewScreen";
import { KYC_STEPS_OWNER, KYC_STEPS_HOST } from "@/lib/types";

export default function KYCPage() {
  const router = useRouter();
  const { user, activeRole, updateKYCStatus, completeKYCStep } = useAuth();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const steps = useMemo(() => {
    if (!user) return [];
    const templateSteps = activeRole === "OWNER" ? KYC_STEPS_OWNER : KYC_STEPS_HOST;
    if (user.kycVerification?.steps) {
      return user.kycVerification.steps;
    }
    return templateSteps.map((s) => ({ ...s }));
  }, [user, activeRole]);

  if (!user) return null;

  // Status screens
  if (user.kycStatus === "PENDING_REVIEW" || user.kycStatus === "APPROVED" || user.kycStatus === "REJECTED") {
    return (
      <div className="max-w-xl mx-auto py-12">
        <KYCReviewScreen
          status={user.kycStatus}
          rejectionReason={user.kycVerification?.rejectionReason}
          onRetry={() => {
            updateKYCStatus("NOT_STARTED");
            setCurrentStepIndex(0);
          }}
          onContinue={() => {
            router.push(activeRole === "OWNER" ? "/owner" : "/host");
          }}
        />
      </div>
    );
  }

  const currentStep = steps[currentStepIndex];
  const totalSteps = steps.length;

  const handleStepComplete = () => {
    completeKYCStep(currentStep.key);
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      updateKYCStatus("PENDING_REVIEW");
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    } else {
      router.back();
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={handleBack}
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Verify your identity</h1>
          <p className="text-sm text-gray-500">Step {currentStepIndex + 1} of {totalSteps}</p>
        </div>
      </div>

      {/* Step indicator — pill bars */}
      <div className="flex items-center gap-1.5 mb-8">
        {steps.map((step, i) => (
          <div
            key={step.key}
            className={`h-1 rounded-full transition-all duration-300 ${
              i <= currentStepIndex ? "bg-gray-900 flex-[2]" : "bg-gray-200 flex-1"
            }`}
          />
        ))}
      </div>

      {/* Step content with animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep.key}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
        >
          {currentStep.key === "identity" && (
            <KYCIdentityStep onComplete={handleStepComplete} />
          )}
          {currentStep.key === "address" && (
            <KYCAddressStep onComplete={handleStepComplete} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
