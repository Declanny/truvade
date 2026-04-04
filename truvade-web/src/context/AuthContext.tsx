"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import type { User, UserRole, KYCStatus, KYCStepKey, KYCVerification, KYCStep } from "@/lib/types";
import { KYC_STEPS_OWNER, KYC_STEPS_HOST } from "@/lib/types";
import { mockUsers } from "@/lib/mock-data";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string) => void;
  logout: () => void;
  updateKYCStatus: (status: KYCStatus) => void;
  completeKYCStep: (stepKey: KYCStepKey) => void;
  switchRole: (role: UserRole) => void;
  switchUser: (userId: string) => void;
  activeRole: UserRole;
  isKYCComplete: boolean;
  isKYCRequired: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(mockUsers[0]); // default: unverified owner
  const [activeRole, setActiveRole] = useState<UserRole>(mockUsers[0].roles[0]);
  const [isLoading, setIsLoading] = useState(false);

  const isKYCComplete = user?.kycStatus === "APPROVED";
  const isKYCRequired = !!(user && (activeRole === "OWNER" || activeRole === "HOST") && user.kycStatus !== "APPROVED");

  const login = useCallback((email: string) => {
    setIsLoading(true);
    setTimeout(() => {
      const found = mockUsers.find((u) => u.email === email);
      if (found) {
        setUser(found);
        setActiveRole(found.roles[0]);
      }
      setIsLoading(false);
    }, 500);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setActiveRole("GUEST");
  }, []);

  const switchUser = useCallback((userId: string) => {
    const found = mockUsers.find((u) => u.id === userId);
    if (found) {
      setUser(found);
      setActiveRole(found.roles[0]);
    }
  }, []);

  const switchRole = useCallback((role: UserRole) => {
    setActiveRole(role);
  }, []);

  const updateKYCStatus = useCallback((status: KYCStatus) => {
    setUser((prev) => {
      if (!prev) return prev;
      const verified = status === "APPROVED";
      const kyc: KYCVerification = prev.kycVerification ?? {
        id: `kyc-${prev.id}`,
        userId: prev.id,
        status,
        steps: prev.roles.includes("OWNER")
          ? KYC_STEPS_OWNER.map((s) => ({ ...s }))
          : KYC_STEPS_HOST.map((s) => ({ ...s })),
        createdAt: new Date(),
      };
      return {
        ...prev,
        verified,
        kycStatus: status,
        kycVerification: {
          ...kyc,
          status,
          submittedAt: status === "PENDING_REVIEW" ? new Date() : kyc.submittedAt,
          reviewedAt: status === "APPROVED" || status === "REJECTED" ? new Date() : kyc.reviewedAt,
        },
      };
    });
  }, []);

  const completeKYCStep = useCallback((stepKey: KYCStepKey) => {
    setUser((prev) => {
      if (!prev) return prev;
      const templateSteps = prev.roles.includes("OWNER")
        ? KYC_STEPS_OWNER
        : KYC_STEPS_HOST;
      const existingSteps = prev.kycVerification?.steps ?? templateSteps.map((s) => ({ ...s }));
      const updatedSteps: KYCStep[] = existingSteps.map((s) =>
        s.key === stepKey ? { ...s, status: "completed" as const } : s
      );
      const kyc: KYCVerification = prev.kycVerification ?? {
        id: `kyc-${prev.id}`,
        userId: prev.id,
        status: "IN_PROGRESS",
        steps: updatedSteps,
        createdAt: new Date(),
      };
      return {
        ...prev,
        kycStatus: "IN_PROGRESS" as KYCStatus,
        kycVerification: { ...kyc, status: "IN_PROGRESS" as KYCStatus, steps: updatedSteps },
      };
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        updateKYCStatus,
        completeKYCStep,
        switchRole,
        switchUser,
        activeRole,
        isKYCComplete,
        isKYCRequired,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
