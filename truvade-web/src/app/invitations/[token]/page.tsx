"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Mail,
  UserCheck,
  Check,
  X,
  Clock,
  AlertTriangle,
  ArrowRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import Logo from "@/components/ui/Logo";
import { useAuth } from "@/context/AuthContext";
import { api, extractErrorMessage } from "@/lib/api";
import type { ApiInvitation } from "@/lib/api-types";

type ViewState =
  | "loading"
  | "invalid"
  | "expired"
  | "already_accepted"
  | "already_declined"
  | "wrong_account"
  | "auth_required"
  | "pending_action"
  | "accepting"
  | "accepted"
  | "declining"
  | "declined"
  | "signup_form"
  | "signing_up"
  | "signup_sent";

function GradientShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0B3D2C] via-[#0F5240] to-[#0B3D2C] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo variant="light" size="xl" />
        </div>
        <div className="bg-white rounded-2xl overflow-hidden">{children}</div>
      </div>
    </div>
  );
}

function CenterMessage({
  icon,
  title,
  body,
  cta,
}: {
  icon: React.ReactNode;
  title: string;
  body: React.ReactNode;
  cta?: React.ReactNode;
}) {
  return (
    <div className="p-8 text-center">
      <div className="flex justify-center mb-4">{icon}</div>
      <h1 className="text-xl font-semibold text-gray-900 mb-2">{title}</h1>
      <div className="text-sm text-gray-500 mb-6">{body}</div>
      {cta}
    </div>
  );
}

export default function InvitationPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const token = params.token;
  const { user, isLoading: authLoading, logout } = useAuth();

  const [invitation, setInvitation] = useState<ApiInvitation | null>(null);
  const [state, setState] = useState<ViewState>("loading");
  const [error, setError] = useState("");

  // Signup form state (for new users)
  const [signupName, setSignupName] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupError, setSignupError] = useState("");

  const computeBaseState = useCallback(
    (inv: ApiInvitation): ViewState => {
      if (inv.status === "ACCEPTED") return "already_accepted";
      if (inv.status === "DECLINED") return "already_declined";
      if (inv.status === "EXPIRED") return "expired";
      if (new Date(inv.expires_at) < new Date()) return "expired";
      // PENDING from here
      if (!user) return "auth_required";
      if ((user.email ?? "").toLowerCase() !== inv.email.toLowerCase()) {
        return "wrong_account";
      }
      return "pending_action";
    },
    [user]
  );

  useEffect(() => {
    if (!token || authLoading) return;
    let cancelled = false;
    api
      .get<ApiInvitation>(`/v1/invitations/${token}/`)
      .then((inv) => {
        if (cancelled) return;
        setInvitation(inv);
        setState(computeBaseState(inv));
      })
      .catch((err) => {
        if (cancelled) return;
        setError(extractErrorMessage(err));
        setState("invalid");
      });
    return () => {
      cancelled = true;
    };
  }, [token, authLoading, computeBaseState]);

  const handleAccept = async () => {
    setState("accepting");
    setError("");
    try {
      await api.post(`/v1/invitations/${token}/accept/`, {});
      setState("accepted");
    } catch (err) {
      setError(extractErrorMessage(err));
      setState("pending_action");
    }
  };

  const handleDecline = async () => {
    setState("declining");
    setError("");
    try {
      await api.post(`/v1/invitations/${token}/decline/`, {});
      setState("declined");
    } catch (err) {
      setError(extractErrorMessage(err));
      setState("pending_action");
    }
  };

  const handleInvitedSignup = async () => {
    if (!signupName.trim() || !signupPhone.trim() || !invitation) return;
    setState("signing_up");
    setSignupError("");
    try {
      await api.post("/v1/auth/signup/invited/", {
        name: signupName.trim(),
        email: invitation.email,
        phone: signupPhone.trim(),
        invitation_token: invitation.token,
      });
      setState("signup_sent");
    } catch (err) {
      setSignupError(extractErrorMessage(err));
      setState("signup_form");
    }
  };

  // ─── Render by state ───────────────────────────────────────────────────────

  if (state === "loading" || authLoading) {
    return (
      <GradientShell>
        <CenterMessage
          icon={
            <Loader2 className="w-10 h-10 text-[#0B3D2C] animate-spin" />
          }
          title="Loading invitation…"
          body="Just a moment."
        />
      </GradientShell>
    );
  }

  if (state === "invalid") {
    return (
      <GradientShell>
        <CenterMessage
          icon={<AlertTriangle className="w-12 h-12 text-amber-500" />}
          title="Invalid invitation"
          body={
            error ||
            "This invitation link is invalid or has been removed."
          }
          cta={
            <Button variant="outline" onClick={() => router.push("/")}>
              Go to homepage
            </Button>
          }
        />
      </GradientShell>
    );
  }

  if (state === "expired") {
    return (
      <GradientShell>
        <CenterMessage
          icon={<Clock className="w-12 h-12 text-gray-400" />}
          title="Invitation expired"
          body="This invitation has expired. Please ask the property owner to send a new one."
          cta={
            <Button variant="outline" onClick={() => router.push("/")}>
              Go to homepage
            </Button>
          }
        />
      </GradientShell>
    );
  }

  if (state === "already_declined" || state === "declined") {
    return (
      <GradientShell>
        <CenterMessage
          icon={<X className="w-12 h-12 text-gray-400" />}
          title="Invitation declined"
          body="You've declined this invitation. If this was a mistake, contact the property owner."
          cta={
            <Button variant="outline" onClick={() => router.push("/")}>
              Go to homepage
            </Button>
          }
        />
      </GradientShell>
    );
  }

  if (state === "already_accepted" || state === "accepted") {
    return (
      <GradientShell>
        <div className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <UserCheck className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            {state === "accepted"
              ? "Invitation accepted!"
              : "You're already a host"}
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            {invitation?.owner_name || invitation?.owner_email} has added you as
            a host on Truvade.
          </p>
          <Button fullWidth onClick={() => router.push("/host")}>
            Go to your dashboard
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </GradientShell>
    );
  }

  if (state === "wrong_account" && invitation) {
    return (
      <GradientShell>
        <CenterMessage
          icon={<AlertCircle className="w-12 h-12 text-amber-500" />}
          title="Wrong account"
          body={
            <>
              This invitation was sent to{" "}
              <span className="font-medium text-gray-900">
                {invitation.email}
              </span>
              , but you&apos;re signed in as{" "}
              <span className="font-medium text-gray-900">{user?.email}</span>.
              Log out and try the link again.
            </>
          }
          cta={
            <Button
              variant="outline"
              onClick={() => {
                logout();
                setState(computeBaseState(invitation));
              }}
            >
              Sign out
            </Button>
          }
        />
      </GradientShell>
    );
  }

  if (state === "auth_required" && invitation) {
    return (
      <GradientShell>
        <div className="bg-gray-50 px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#0B3D2C]/10 flex items-center justify-center">
              <Mail className="w-5 h-5 text-[#0B3D2C]" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                You&apos;re invited!
              </h1>
              <p className="text-sm text-gray-500">Host invitation</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <p className="text-sm text-gray-500">
              <span className="font-medium text-gray-900">
                {invitation.owner_name || invitation.owner_email}
              </span>{" "}
              has invited you to be a host on Truvade.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Invitation sent to{" "}
              <span className="font-medium text-gray-900">
                {invitation.email}
              </span>
              .
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Clock className="w-3.5 h-3.5" />
            <span>
              Expires in {Math.max(
                0,
                Math.ceil(
                  (new Date(invitation.expires_at).getTime() - Date.now()) /
                    (1000 * 60 * 60 * 24)
                )
              )}{" "}
              days
            </span>
          </div>

          <div className="space-y-3 pt-2">
            <Button fullWidth onClick={() => setState("signup_form")}>
              Create an account
            </Button>
            <Link
              href={`/login?redirect=${encodeURIComponent(`/invitations/${token}`)}`}
              className="block"
            >
              <Button variant="outline" fullWidth>
                I already have an account
              </Button>
            </Link>
          </div>
        </div>
      </GradientShell>
    );
  }

  if (state === "signup_form" || state === "signing_up") {
    const busy = state === "signing_up";
    return (
      <GradientShell>
        <div className="bg-gray-50 px-6 py-5 border-b border-gray-100">
          <h1 className="text-lg font-semibold text-gray-900">
            Create your account
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Joining as <span className="font-medium">{invitation?.email}</span>
          </p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full name
            </label>
            <input
              type="text"
              value={signupName}
              onChange={(e) => setSignupName(e.target.value)}
              placeholder="Ada Eze"
              disabled={busy}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 transition-colors disabled:opacity-60"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone number
            </label>
            <input
              type="tel"
              value={signupPhone}
              onChange={(e) => setSignupPhone(e.target.value)}
              placeholder="+234…"
              disabled={busy}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 transition-colors disabled:opacity-60"
            />
          </div>

          {signupError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>{signupError}</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => setState("auth_required")}
              disabled={busy}
            >
              Back
            </Button>
            <Button
              fullWidth
              loading={busy}
              onClick={handleInvitedSignup}
              disabled={!signupName.trim() || !signupPhone.trim() || busy}
            >
              Create account
            </Button>
          </div>
        </div>
      </GradientShell>
    );
  }

  if (state === "signup_sent" && invitation) {
    return (
      <GradientShell>
        <CenterMessage
          icon={
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
              <Check className="w-8 h-8 text-emerald-600" />
            </div>
          }
          title="Check your email"
          body={
            <>
              We&apos;ve sent a verification code to{" "}
              <span className="font-medium text-gray-900">
                {invitation.email}
              </span>
              . Enter it on the next screen to finish setting up your account.
            </>
          }
          cta={
            <Link
              href={`/verify?email=${encodeURIComponent(
                invitation.email
              )}&mode=signup`}
            >
              <Button fullWidth>
                Enter verification code
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          }
        />
      </GradientShell>
    );
  }

  // pending_action / accepting / declining
  if (
    invitation &&
    (state === "pending_action" ||
      state === "accepting" ||
      state === "declining")
  ) {
    const days = Math.max(
      0,
      Math.ceil(
        (new Date(invitation.expires_at).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      )
    );
    const accepting = state === "accepting";
    const declining = state === "declining";
    return (
      <GradientShell>
        <div className="bg-gray-50 px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#0B3D2C]/10 flex items-center justify-center">
              <Mail className="w-5 h-5 text-[#0B3D2C]" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                You&apos;re invited!
              </h1>
              <p className="text-sm text-gray-500">Host invitation</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <p className="text-sm text-gray-500">
              <span className="font-medium text-gray-900">
                {invitation.owner_name || invitation.owner_email}
              </span>{" "}
              has invited you to be a host on Truvade.
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">From</span>
              <span className="text-gray-900 font-medium">
                {invitation.owner_email}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Invited as</span>
              <span className="text-gray-900 font-medium">
                {invitation.email}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Status</span>
              <Badge variant="warning" size="sm">
                Pending
              </Badge>
            </div>
          </div>

          <div className="bg-[#0B3D2C]/5 border border-[#0B3D2C]/10 rounded-xl p-4">
            <p className="text-xs text-gray-600 leading-relaxed">
              As a host, you&apos;ll be able to manage bookings, communicate
              with guests, and earn commission on each stay. Property and
              commission details are set per-property by the owner after you
              accept.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Clock className="w-3.5 h-3.5" />
            <span>
              Expires in {days} day{days !== 1 ? "s" : ""}
            </span>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="ghost"
              fullWidth
              onClick={handleDecline}
              loading={declining}
              disabled={accepting || declining}
            >
              Decline
            </Button>
            <Button
              fullWidth
              loading={accepting}
              onClick={handleAccept}
              disabled={accepting || declining}
            >
              Accept invitation
            </Button>
          </div>
        </div>
      </GradientShell>
    );
  }

  return null;
}
