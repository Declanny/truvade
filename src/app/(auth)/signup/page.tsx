"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { User, Mail, Phone } from "lucide-react";
import { Button, Input, Card } from "@/components/ui";

type Role = "GUEST" | "OWNER";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<Role>("GUEST");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Name is required";
    if (!email.trim()) newErrors.email = "Email is required";
    if (!phone.trim()) newErrors.phone = "Phone number is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    // Mock signup — simulate brief delay then navigate to verify
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
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="text-gray-500 mt-1">Start your journey with Truvade</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full name"
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            leftIcon={<User size={18} />}
            error={errors.name}
            fullWidth
          />

          <Input
            label="Email address"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail size={18} />}
            error={errors.email}
            fullWidth
          />

          <Input
            label="Phone number"
            type="tel"
            placeholder="+234 800 000 0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            leftIcon={<Phone size={18} />}
            error={errors.phone}
            fullWidth
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              I want to
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("GUEST")}
                className={`px-4 py-3 rounded-[var(--radius-button)] border-2 text-sm font-medium transition-all duration-200 ${
                  role === "GUEST"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                Book stays
              </button>
              <button
                type="button"
                onClick={() => setRole("OWNER")}
                className={`px-4 py-3 rounded-[var(--radius-button)] border-2 text-sm font-medium transition-all duration-200 ${
                  role === "OWNER"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                List property
              </button>
            </div>
          </div>

          {errors.form && (
            <p className="text-sm text-error text-center">{errors.form}</p>
          )}

          <Button type="submit" fullWidth loading={loading} size="lg">
            Create Account
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </motion.div>
  );
}
