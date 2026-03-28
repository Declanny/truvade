"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Shield,
  Building2,
  Mail,
  UserCheck,
  Check,
  X,
  Clock,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { mockInvitations, mockProperties } from "@/lib/mock-data";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/components/ui/Logo";

type Step = "details" | "accepting" | "accepted" | "declined" | "expired" | "kyc-prompt";

const permissionLabels: Record<string, { label: string; desc: string }> = {
  manage_bookings: { label: "Manage Bookings", desc: "View, confirm, and manage guest bookings" },
  manage_messages: { label: "Manage Messages", desc: "Read and respond to guest messages" },
  manage_properties: { label: "Manage Properties", desc: "Edit property details and photos" },
  manage_calendar: { label: "Manage Calendar", desc: "Block/unblock dates and manage availability" },
};

export default function InvitationAcceptPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isKYCComplete } = useAuth();
  const token = params.token as string;

  const invitation = useMemo(
    () => mockInvitations.find((inv) => inv.token === token),
    [token]
  );

  const [step, setStep] = useState<Step>(() => {
    if (!invitation) return "details";
    if (invitation.status === "ACCEPTED") return "accepted";
    if (invitation.status === "DECLINED") return "declined";
    if (new Date() > invitation.expiresAt) return "expired";
    return "details";
  });

  const assignedProperties = useMemo(() => {
    if (!invitation?.propertyIds?.length) return [];
    return mockProperties.filter((p) => invitation.propertyIds!.includes(p.id));
  }, [invitation]);

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0B3D2C] via-[#0F5240] to-[#0B3D2C] px-4">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <Logo variant="light" size="xl" />
          </div>
          <div className="bg-white rounded-2xl p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-warning-dark mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Invalid Invitation</h1>
            <p className="text-sm text-gray-500 mb-6">
              This invitation link is invalid or has been removed.
            </p>
            <Button variant="outline" onClick={() => router.push("/")}>
              Go to homepage
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "expired") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0B3D2C] via-[#0F5240] to-[#0B3D2C] px-4">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <Logo variant="light" size="xl" />
          </div>
          <div className="bg-white rounded-2xl p-8 text-center">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Invitation Expired</h1>
            <p className="text-sm text-gray-500 mb-6">
              This invitation has expired. Please ask the property owner to send a new one.
            </p>
            <Button variant="outline" onClick={() => router.push("/")}>
              Go to homepage
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "declined") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0B3D2C] via-[#0F5240] to-[#0B3D2C] px-4">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <Logo variant="light" size="xl" />
          </div>
          <div className="bg-white rounded-2xl p-8 text-center">
            <X className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Invitation Declined</h1>
            <p className="text-sm text-gray-500">
              You&apos;ve declined this invitation. If this was a mistake, contact the property owner.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (step === "accepted" || step === "kyc-prompt") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0B3D2C] via-[#0F5240] to-[#0B3D2C] px-4">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <Logo variant="light" size="xl" />
          </div>
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <UserCheck className="w-8 h-8 text-success" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Invitation Accepted!
            </h1>
            <p className="text-sm text-gray-500 mb-2">
              You&apos;ve joined as a <span className="font-medium text-gray-900">{invitation.role === "CO_HOST" ? "Co-Host" : "Host"}</span> with {invitation.commission}% commission.
            </p>

            {/* KYC prompt if not verified */}
            {!isKYCComplete ? (
              <div className="mt-6 space-y-4">
                <div className="bg-primary/5 border border-primary/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-primary" />
                    <p className="text-sm font-medium text-gray-900">Identity verification required</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    You need to complete identity verification before you can start managing properties and bookings.
                  </p>
                </div>
                <Button fullWidth onClick={() => router.push("/kyc")}>
                  <Shield className="w-4 h-4 mr-2" />
                  Verify Identity
                </Button>
                <button
                  onClick={() => router.push("/host")}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  I&apos;ll do this later
                </button>
              </div>
            ) : (
              <div className="mt-6">
                <Button fullWidth onClick={() => router.push("/host")}>
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Step: "details" — show invitation info & accept/decline
  const handleAccept = () => {
    setStep("accepting");
    // Simulate acceptance delay
    setTimeout(() => {
      // Mutate mock data (in real app this would be an API call)
      invitation.status = "ACCEPTED";
      invitation.acceptedAt = new Date();
      invitation.acceptedByUserId = user?.id;
      setStep(isKYCComplete ? "accepted" : "kyc-prompt");
    }, 1500);
  };

  const handleDecline = () => {
    invitation.status = "DECLINED";
    setStep("declined");
  };

  const daysLeft = Math.max(
    0,
    Math.ceil((invitation.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0B3D2C] via-[#0F5240] to-[#0B3D2C] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo variant="light" size="xl" />
        </div>

        <div className="bg-white rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gray-50 px-6 py-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">You&apos;re invited!</h1>
                <p className="text-sm text-gray-500">
                  {invitation.role === "CO_HOST" ? "Co-Host" : "Host"} invitation
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Invitation info */}
            <div>
              <p className="text-sm text-gray-500">
                You&apos;ve been invited to join as a{" "}
                <span className="font-medium text-gray-900">
                  {invitation.role === "CO_HOST" ? "Co-Host" : "Host"}
                </span>
              </p>
              {invitation.name && (
                <p className="text-sm text-gray-500 mt-1">
                  Invited as: <span className="font-medium text-gray-900">{invitation.name}</span>
                </p>
              )}
            </div>

            {/* Commission */}
            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
              <span className="text-sm text-gray-600">Commission rate</span>
              <span className="text-lg font-semibold text-gray-900">{invitation.commission}%</span>
            </div>

            {/* Permissions */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Permissions you&apos;ll have</p>
              <div className="space-y-2">
                {invitation.permissions.map((perm) => {
                  const info = permissionLabels[perm];
                  if (!info) return null;
                  return (
                    <div key={perm} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm text-gray-900">{info.label}</p>
                        <p className="text-xs text-gray-400">{info.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Properties pre-assigned */}
            {assignedProperties.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Properties you&apos;ll manage</p>
                <div className="space-y-2">
                  {assignedProperties.map((prop) => (
                    <div key={prop.id} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg">
                      <img
                        src={prop.images[0]}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{prop.title}</p>
                        <p className="text-xs text-gray-500">{prop.city}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Expiry notice */}
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Clock className="w-3.5 h-3.5" />
              <span>Expires in {daysLeft} day{daysLeft !== 1 ? "s" : ""}</span>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="ghost"
                fullWidth
                onClick={handleDecline}
                disabled={step === "accepting"}
              >
                Decline
              </Button>
              <Button
                fullWidth
                loading={step === "accepting"}
                onClick={handleAccept}
              >
                Accept Invitation
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
