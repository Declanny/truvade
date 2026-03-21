"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User,
  Shield,
  Eye,
  Bell,
  CreditCard,
  Globe,
} from "lucide-react";

const settingsNav = [
  { label: "Personal information", href: "/account/settings", icon: User },
  { label: "Login & security", href: "/account/settings/security", icon: Shield },
  { label: "Privacy", href: "/account/settings/privacy", icon: Eye },
  { label: "Notifications", href: "/account/settings/notifications", icon: Bell },
  { label: "Payments", href: "/account/settings/payments", icon: CreditCard },
  { label: "Languages & currency", href: "/account/settings/preferences", icon: Globe },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Account settings</h1>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
        {/* Left nav */}
        <nav className="lg:w-[280px] flex-shrink-0">
          {/* Mobile: horizontal scroll */}
          <div className="flex lg:hidden gap-2 overflow-x-auto pb-4 scrollbar-hide">
            {settingsNav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-[#0B3D2C] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Desktop: vertical list */}
          <div className="hidden lg:block space-y-1">
            {settingsNav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Right content */}
        <div className="flex-1 min-w-0 lg:border-l lg:border-gray-100 lg:pl-16">
          {children}
        </div>
      </div>
    </div>
  );
}
