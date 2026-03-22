"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Header, Footer, MobileBottomNav, WorkspaceSwitcher } from "@/components/layout";
import { WorkspaceProvider } from "@/context/WorkspaceContext";

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
  { label: "Settings", href: "/account/settings" },
];

const hostNav: NavItem[] = [
  { label: "Today", href: "/host" },
  { label: "Calendar", href: "/host/calendar" },
  { label: "Bookings", href: "/host/bookings" },
  { label: "Messages", href: "/host/messages" },
  { label: "Settings", href: "/account/settings" },
];

function getNavForPath(pathname: string): NavItem[] {
  if (pathname.startsWith("/owner")) return ownerNav;
  return hostNav;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const nav = getNavForPath(pathname);
  const isHost = pathname.startsWith("/host");

  const content = (
    <>
      <Header />

      {/* Role sub-navigation */}
      <div className="sticky top-[68px] z-40 bg-white border-b border-gray-100">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Desktop: nav links + workspace switcher */}
          <div className="hidden md:flex items-center justify-center gap-8 h-12 relative">
            {isHost && (
              <div className="absolute right-0">
                <WorkspaceSwitcher />
              </div>
            )}
            {nav.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== "/owner" && item.href !== "/host" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative text-sm font-medium transition-colors py-3 ${
                    isActive ? "text-gray-900" : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Mobile: horizontal scroll pills + workspace switcher */}
          <div className="flex md:hidden items-center gap-2 py-2 overflow-x-auto scrollbar-hide">
            {nav.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== "/owner" && item.href !== "/host" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            {isHost && <div className="ml-auto"><WorkspaceSwitcher /></div>}
          </div>
        </div>
      </div>

      <main className="min-h-screen bg-white pb-16 md:pb-0">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>

      <Footer />
      <MobileBottomNav />
    </>
  );

  return isHost ? <WorkspaceProvider>{content}</WorkspaceProvider> : content;
}
