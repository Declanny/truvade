"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  CalendarDays,
  MessageSquare,
  Building2,
  Users,
  CreditCard,
  Settings,
  Menu,
  Globe,
} from "lucide-react";
import Logo from "@/components/ui/Logo";
import { UserMenuDropdown } from "@/components/layout/UserMenuDropdown";
import { useState, useRef, useEffect } from "react";

type NavItem = {
  label: string;
  href: string;
};

const ownerNav: NavItem[] = [
  { label: "Dashboard", href: "/owner" },
  { label: "Listings", href: "/owner/properties" },
  { label: "Hosts", href: "/owner/hosts" },
  { label: "Payouts", href: "/owner/payouts" },
  { label: "Organization", href: "/owner/organization" },
];

const hostNav: NavItem[] = [
  { label: "Today", href: "/host" },
  { label: "Calendar", href: "/host/calendar" },
  { label: "Listings", href: "/host/bookings" },
  { label: "Messages", href: "/host/messages" },
];

function getNavForPath(pathname: string): { nav: NavItem[]; switchLabel: string; switchHref: string } {
  if (pathname.startsWith("/owner")) {
    return { nav: ownerNav, switchLabel: "Switch to traveling", switchHref: "/" };
  }
  return { nav: hostNav, switchLabel: "Switch to traveling", switchHref: "/" };
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { nav, switchLabel, switchHref } = getNavForPath(pathname);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  return (
    <div className="min-h-screen bg-white">
      {/* Top header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[68px]">
            {/* Logo */}
            <Link href="/" className="shrink-0">
              <Logo variant="dark" size="lg" />
            </Link>

            {/* Center nav — desktop */}
            <nav className="hidden md:flex items-center gap-1">
              {nav.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== "/owner" && item.href !== "/host" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative px-4 py-2 text-sm font-medium transition-colors rounded-full ${
                      isActive
                        ? "text-gray-900"
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    {item.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-gray-900 rounded-full" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-4">
              <Link
                href={switchHref}
                className="hidden md:block text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                {switchLabel}
              </Link>

              {/* User menu */}
              <div ref={menuRef} className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className={`flex items-center gap-2.5 pl-3 pr-2 py-2 rounded-full border transition-all ${
                    menuOpen
                      ? "border-gray-300 shadow-md"
                      : "border-gray-200 hover:shadow-md"
                  }`}
                >
                  <Menu className="w-4 h-4 text-gray-700" />
                  <div className="w-7 h-7 rounded-full bg-[#0B3D2C] flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">U</span>
                  </div>
                </button>
                <UserMenuDropdown isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile nav — horizontal scroll below header */}
        <div className="md:hidden border-t border-gray-100">
          <div className="flex items-center gap-1 px-4 py-2 overflow-x-auto scrollbar-hide">
            {nav.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== "/owner" && item.href !== "/host" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
