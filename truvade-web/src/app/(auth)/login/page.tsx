"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Phone, Chrome } from "lucide-react";
import { Button, Input, Card } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    setError("");

    // Mock OTP send — simulate brief delay then navigate
    setTimeout(() => {
      setLoading(false);
      router.push(`/verify?email=${encodeURIComponent(email)}`);
    }, 800);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Card variant="elevated" padding="lg">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-gray-500 mt-1">Sign in to your Truvade account</p>
        </div>

        <form onSubmit={handleSendOTP} className="space-y-4">
          <Input
            label="Email address"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail size={18} />}
            error={error}
            fullWidth
          />

          <Button type="submit" fullWidth loading={loading} size="lg">
            Send OTP
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-primary font-medium hover:underline">
            Sign up
          </Link>
        </p>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-3 text-gray-400">or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            fullWidth
            leftIcon={<Chrome size={18} />}
            onClick={() => {}}
          >
            Google
          </Button>
          <Button
            variant="outline"
            fullWidth
            leftIcon={<Phone size={18} />}
            onClick={() => {}}
          >
            Phone
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
