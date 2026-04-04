"use client";

import { Star, ShieldCheck, MessageSquare } from "lucide-react";
import { Avatar, Button } from "@/components/ui";
import type { Property } from "@/lib/types";
import Link from "next/link";

interface HostSectionProps {
  property: Property;
}

function hostSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

export const HostSection: React.FC<HostSectionProps> = ({ property }) => {
  const hostAvatarIsUrl = property.hostAvatar?.startsWith("http");
  const hostInitials = hostAvatarIsUrl ? undefined : (property.hostAvatar || property.hostName?.split(" ").map(n => n[0]).join("").toUpperCase() || "T");
  const hostAvatarSrc = hostAvatarIsUrl ? property.hostAvatar : undefined;
  const hostName = property.hostName || "Truvade Managed";
  const hostProfileHref = `/hosts/${hostSlug(hostName)}`;

  return (
    <div className="py-8 border-b border-gray-200">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Meet your host</h2>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left: Host profile card — clickable */}
        <Link href={hostProfileHref} className="block lg:w-[280px] flex-shrink-0">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm text-center hover:shadow-md transition-shadow">
            <Avatar
              src={hostAvatarSrc}
              initials={hostInitials}
              name={hostName}
              size="xl"
              verified={property.verified}
              className="mx-auto"
            />
            <h3 className="text-2xl font-bold text-gray-900 mt-3">{hostName}</h3>
            {property.verified && (
              <div className="flex items-center justify-center gap-1 mt-1">
                <ShieldCheck className="w-4 h-4 text-[#0B3D2C]" />
                <span className="text-sm text-gray-500">Verified host</span>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-gray-100">
              {property.hostReviewCount !== undefined && (
                <div>
                  <p className="text-lg font-bold text-gray-900">{property.hostReviewCount}</p>
                  <p className="text-xs text-gray-500">Reviews</p>
                </div>
              )}
              {property.hostRating !== undefined && (
                <div>
                  <p className="text-lg font-bold text-gray-900 flex items-center justify-center gap-0.5">
                    {property.hostRating.toFixed(1)}
                    <Star className="w-3.5 h-3.5 fill-current" />
                  </p>
                  <p className="text-xs text-gray-500">Rating</p>
                </div>
              )}
              {property.hostYearsHosting !== undefined && (
                <div>
                  <p className="text-lg font-bold text-gray-900">{property.hostYearsHosting}</p>
                  <p className="text-xs text-gray-500">Years hosting</p>
                </div>
              )}
            </div>
          </div>
        </Link>

        {/* Right: Details */}
        <div className="flex-1">
          <Link href={hostProfileHref} className="hover:underline">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {hostName} is a Verified Host
            </h3>
          </Link>
          <p className="text-sm text-gray-600 mb-6">
            Verified hosts are experienced, highly rated hosts who are committed to providing great stays for guests.
          </p>

          {/* Co-hosts */}
          {property.coHosts && property.coHosts.length > 0 && (
            <div className="mb-6">
              <h4 className="text-base font-semibold text-gray-900 mb-3">Co-hosts</h4>
              <div className="flex items-center gap-4">
                {property.coHosts.map((coHost) => (
                  <Link key={coHost.id} href={`/hosts/${hostSlug(coHost.name)}`} className="flex items-center gap-2 hover:underline">
                    <Avatar
                      initials={coHost.avatar || coHost.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                      name={coHost.name}
                      size="sm"
                    />
                    <span className="text-sm text-gray-700">{coHost.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Host details */}
          <div className="mb-6">
            <h4 className="text-base font-semibold text-gray-900 mb-3">Host details</h4>
            <div className="space-y-1 text-sm text-gray-600">
              {property.hostResponseRate && (
                <p>Response rate: {property.hostResponseRate}</p>
              )}
              {property.hostResponseTime && (
                <p>Responds {property.hostResponseTime}</p>
              )}
            </div>
          </div>

          {/* Message host button */}
          <Link href="/account/guest/messages">
            <Button
              variant="outline"
              size="lg"
              leftIcon={<MessageSquare className="w-4 h-4" />}
            >
              Message Host
            </Button>
          </Link>

          {/* Safety note */}
          <div className="flex items-start gap-2 mt-6 pt-6 border-t border-gray-200">
            <ShieldCheck className="w-5 h-5 text-[#0B3D2C] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-500">
              To help protect your payment, always use Truvade to send money and communicate with hosts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
