import React from "react";
import Logo from "@/components/ui/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0B3D2C] via-[#0F5240] to-[#0B3D2C] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo variant="light" size="xl" showTagline />
        </div>
        {children}
      </div>
    </div>
  );
}
