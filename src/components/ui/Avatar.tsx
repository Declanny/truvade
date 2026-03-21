"use client";

import { ShieldCheck } from "lucide-react";

type AvatarSize = "sm" | "md" | "lg" | "xl";

export interface AvatarProps {
  src?: string;
  initials?: string;
  name?: string;
  size?: AvatarSize;
  verified?: boolean;
  className?: string;
}

const sizeMap: Record<AvatarSize, { container: string; text: string; badge: string }> = {
  sm: { container: "w-8 h-8", text: "text-xs", badge: "w-4 h-4 -bottom-0.5 -right-0.5" },
  md: { container: "w-10 h-10", text: "text-sm", badge: "w-5 h-5 -bottom-0.5 -right-0.5" },
  lg: { container: "w-14 h-14", text: "text-xl", badge: "w-6 h-6 -bottom-0.5 -right-0.5" },
  xl: { container: "w-24 h-24", text: "text-3xl", badge: "w-7 h-7 -bottom-1 -right-1" },
};

function getInitials(name?: string, initials?: string): string {
  if (initials) return initials;
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  initials,
  name,
  size = "md",
  verified = false,
  className = "",
}) => {
  const s = sizeMap[size];
  const displayInitials = getInitials(name, initials);

  return (
    <div className={`relative inline-flex flex-shrink-0 ${className}`}>
      {src ? (
        <img
          src={src}
          alt={name || "Avatar"}
          className={`${s.container} rounded-full object-cover`}
        />
      ) : (
        <div
          className={`${s.container} rounded-full bg-[#0B3D2C] flex items-center justify-center text-white font-semibold ${s.text}`}
        >
          {displayInitials}
        </div>
      )}
      {verified && (
        <div
          className={`absolute ${s.badge} bg-white rounded-full flex items-center justify-center shadow-sm`}
        >
          <ShieldCheck className="w-full h-full text-[#0B3D2C]" />
        </div>
      )}
    </div>
  );
};
