"use client";

import React, { Suspense, useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { extractErrorMessage } from "@/lib/api";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

function redirectForRole(role: string): string {
  if (role === "OWNER") return "/owner";
  if (role === "HOST") return "/host";
  return "/";
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const { verifyOTP, resendOTP } = useAuth();

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const [canResend, setCanResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];

    if (value.length > 1) {
      // Handle paste
      const digits = value.slice(0, OTP_LENGTH).split("");
      digits.forEach((digit, i) => {
        if (index + i < OTP_LENGTH) newOtp[index + i] = digit;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + digits.length, OTP_LENGTH - 1);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = useCallback(async () => {
    const code = otp.join("");
    if (code.length !== OTP_LENGTH) {
      setError("Please enter the full verification code");
      return;
    }
    if (!email) {
      setError("Email address is missing. Please go back and try again.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const user = await verifyOTP(email, code);
      router.push(redirectForRole(user.roles[0]));
    } catch (err) {
      setError(extractErrorMessage(err));
      // Clear OTP on failure so user can re-enter
      setOtp(Array(OTP_LENGTH).fill(""));
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } finally {
      setLoading(false);
    }
  }, [otp, email, verifyOTP, router]);

  // Auto-submit when all digits are filled
  useEffect(() => {
    const code = otp.join("");
    if (code.length === OTP_LENGTH && !loading) {
      handleVerify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  const handleResend = async () => {
    if (!canResend || !email) return;
    setResendLoading(true);
    try {
      await resendOTP(email);
      setCountdown(RESEND_COOLDOWN);
      setCanResend(false);
      setOtp(Array(OTP_LENGTH).fill(""));
      setError("");
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Card variant="elevated" padding="lg">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Enter verification code
          </h1>
          <p className="text-gray-500 mt-1">
            We sent a 6-digit code to{" "}
            <span className="font-medium text-gray-700">{email}</span>
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleVerify();
          }}
          className="space-y-6"
        >
          <div className="flex justify-center gap-3">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={OTP_LENGTH}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`w-12 h-14 text-center text-xl font-semibold border-2 rounded-[var(--radius-button)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                  error
                    ? "border-error focus:border-error focus:ring-error"
                    : "border-gray-300 focus:border-primary focus:ring-primary"
                }`}
                aria-label={`Digit ${index + 1}`}
              />
            ))}
          </div>

          {error && <p className="text-sm text-error text-center">{error}</p>}

          <Button type="submit" fullWidth loading={loading} size="lg">
            Verify
          </Button>
        </form>

        <div className="text-center mt-4 space-y-3">
          <p className="text-sm text-gray-500">
            {canResend ? (
              <button
                onClick={handleResend}
                disabled={resendLoading}
                className="text-primary font-medium hover:underline disabled:opacity-50"
              >
                {resendLoading ? "Sending…" : "Resend code"}
              </button>
            ) : (
              <>
                Resend code in{" "}
                <span className="font-medium text-gray-700">{countdown}s</span>
              </>
            )}
          </p>

          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary transition-colors"
          >
            <ArrowLeft size={14} />
            Back to login
          </Link>
        </div>
      </Card>
    </motion.div>
  );
}
