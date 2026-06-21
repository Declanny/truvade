"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Container } from "@/components/layout";
import { Button } from "@/components/ui";
import type { ApiPayment } from "@/lib/api-types";
import { api, extractErrorMessage } from "@/lib/api";

export default function PaymentCallbackPage() {
  return (
    <Suspense
      fallback={
        <Container>
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="w-8 h-8 animate-spin text-[#0B3D2C]" />
          </div>
        </Container>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = searchParams.get("reference") || searchParams.get("trxref") || "";

  const [status, setStatus] = useState<"verifying" | "success" | "failed">("verifying");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!reference) {
      setStatus("failed");
      setError("No payment reference found. Please check your bookings.");
      return;
    }

    api
      .get<ApiPayment>(`/v1/payments/verify/${reference}/`)
      .then((payment) => {
        if (payment.status === "SUCCESS") {
          setStatus("success");
        } else {
          setStatus("failed");
          setError(
            payment.status === "FAILED"
              ? "Your payment was not successful. No charge was made."
              : "Payment is still processing. Check your bookings for the latest status."
          );
        }
      })
      .catch((err) => {
        setStatus("failed");
        setError(extractErrorMessage(err));
      });
  }, [reference]);

  return (
    <Container>
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="max-w-md w-full text-center px-4">
          {status === "verifying" && (
            <>
              <Loader2 className="w-16 h-16 animate-spin text-[#0B3D2C] mx-auto mb-6" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Verifying your payment…
              </h1>
              <p className="text-gray-500">Please wait while we confirm your booking.</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Booking Confirmed!
              </h1>
              <p className="text-gray-500 mb-8">
                Your payment was successful and your booking is confirmed. You&apos;ll
                receive a confirmation email shortly.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/account/guest/bookings">
                  <Button variant="primary" size="lg">
                    View My Bookings
                  </Button>
                </Link>
                <Link href="/shortlets">
                  <Button variant="ghost" size="lg">
                    Browse More
                  </Button>
                </Link>
              </div>
            </>
          )}

          {status === "failed" && (
            <>
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-10 h-10 text-red-500" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
              <p className="text-gray-500 mb-8">
                {error || "Something went wrong with your payment."}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => router.back()}
                >
                  Try Again
                </Button>
                <Link href="/account/guest/bookings">
                  <Button variant="ghost" size="lg">
                    My Bookings
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </Container>
  );
}
