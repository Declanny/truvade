"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import type { User, UserRole, KYCStatus, KYCStepKey, KYCVerification, KYCStep } from "@/lib/types";
import { KYC_STEPS_OWNER, KYC_STEPS_HOST } from "@/lib/types";
import { api, setTokens, clearTokens, getAccessToken } from "@/lib/api";
import type { ApiProfile, ApiAuthResult, ApiRole, ApiVerification } from "@/lib/api-types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function mapProfileToUser(profile: ApiProfile): User {
  const kycStatus: KYCStatus = profile.is_verified ? "APPROVED" : "NOT_STARTED";
  return {
    id: String(profile.id),
    email: profile.email,
    phone: profile.phone,
    name: profile.name,
    avatar: profile.avatar ?? undefined,
    roles: [profile.role as UserRole],
    verified: profile.is_verified,
    kycStatus,
    createdAt: new Date(profile.date_joined),
  };
}

function roleFromUser(user: User): UserRole {
  return user.roles[0] ?? "GUEST";
}

function kycStatusFromVerification(v: ApiVerification | undefined): KYCStatus | null {
  if (!v) return null;
  if (v.status === "APPROVED") return "APPROVED";
  if (v.status === "PENDING") return "PENDING_REVIEW";
  if (v.status === "REJECTED") return "REJECTED";
  return null;
}

async function fetchLatestKYCStatus(role: UserRole): Promise<KYCStatus | null> {
  if (role !== "HOST" && role !== "OWNER") return null;
  try {
    const verifications = await api.get<ApiVerification[]>("/v1/verifications/me/");
    // Backend returns newest first
    return kycStatusFromVerification(verifications[0]);
  } catch {
    return null;
  }
}

// ── Context types ─────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  /** Step 1 of login: sends OTP to email. */
  login: (email: string) => Promise<void>;
  /** Step 1 of signup: registers user and sends OTP. */
  signup: (name: string, email: string, phone: string, role: ApiRole) => Promise<void>;
  /** Step 2 of both flows: verifies OTP and sets the logged-in user. */
  verifyOTP: (email: string, otp: string) => Promise<User>;
  /** Resends the OTP to the given email. */
  resendOTP: (email: string) => Promise<void>;
  logout: () => void;
  updateKYCStatus: (status: KYCStatus) => void;
  completeKYCStep: (stepKey: KYCStepKey) => void;
  switchRole: (role: UserRole) => void;
  activeRole: UserRole;
  isKYCComplete: boolean;
  isKYCRequired: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole>("GUEST");
  const [isLoading, setIsLoading] = useState(true);

  // On mount: restore session from stored access token
  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    (async () => {
      try {
        const profile = await api.get<ApiProfile>("/v1/profile/me/");
        const u = mapProfileToUser(profile);
        const role = roleFromUser(u);
        const refinedKyc = await fetchLatestKYCStatus(role);
        if (refinedKyc && refinedKyc !== u.kycStatus) {
          u.kycStatus = refinedKyc;
        }
        setUser(u);
        setActiveRole(role);
      } catch {
        // Token invalid or expired and refresh failed — clear state
        clearTokens();
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const isKYCComplete = user?.kycStatus === "APPROVED";
  const isKYCRequired = !!(
    user &&
    (activeRole === "OWNER" || activeRole === "HOST") &&
    user.kycStatus !== "APPROVED"
  );

  const login = useCallback(async (email: string) => {
    await api.post("/v1/auth/login/", { email });
  }, []);

  const signup = useCallback(
    async (name: string, email: string, phone: string, role: ApiRole) => {
      await api.post("/v1/auth/signup/", { name, email, phone, role });
    },
    []
  );

  const verifyOTP = useCallback(async (email: string, otp: string): Promise<User> => {
    const result = await api.post<ApiAuthResult>("/v1/auth/verify-otp/", {
      email,
      otp,
    });
    setTokens(result.tokens.access, result.tokens.refresh);

    // Fetch the full profile so we have is_verified, bio, etc.
    const profile = await api.get<ApiProfile>("/v1/profile/me/");
    const u = mapProfileToUser(profile);
    const role = roleFromUser(u);
    const refinedKyc = await fetchLatestKYCStatus(role);
    if (refinedKyc && refinedKyc !== u.kycStatus) {
      u.kycStatus = refinedKyc;
    }
    setUser(u);
    setActiveRole(role);
    return u;
  }, []);

  const resendOTP = useCallback(async (email: string) => {
    await api.post("/v1/auth/resend-otp/", { email });
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
    setActiveRole("GUEST");
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
          submittedAt:
            status === "PENDING_REVIEW" ? new Date() : kyc.submittedAt,
          reviewedAt:
            status === "APPROVED" || status === "REJECTED"
              ? new Date()
              : kyc.reviewedAt,
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
      const existingSteps =
        prev.kycVerification?.steps ?? templateSteps.map((s) => ({ ...s }));
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
        kycVerification: {
          ...kyc,
          status: "IN_PROGRESS" as KYCStatus,
          steps: updatedSteps,
        },
      };
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        signup,
        verifyOTP,
        resendOTP,
        logout,
        updateKYCStatus,
        completeKYCStep,
        switchRole,
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
