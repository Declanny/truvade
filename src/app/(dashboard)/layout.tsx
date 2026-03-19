"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  CalendarDays,
  MessageSquare,
  Building2,
  Users,
  CreditCard,
  Settings,
  Menu,
  X,
  ChevronRight,
  LogOut,
  Heart,
  User,
} from "lucide-react";
import Logo from "@/components/ui/Logo";

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

const guestNav: NavItem[] = [
  { label: "My Bookings", href: "/guest/bookings", icon: <CalendarDays className="w-5 h-5" /> },
  { label: "Messages", href: "/guest/messages", icon: <MessageSquare className="w-5 h-5" /> },
  { label: "Wishlist", href: "/guest/wishlist", icon: <Heart className="w-5 h-5" /> },
  { label: "Profile", href: "/guest/profile", icon: <User className="w-5 h-5" /> },
];

const ownerNav: NavItem[] = [
  { label: "Dashboard", href: "/owner", icon: <Home className="w-5 h-5" /> },
  { label: "Properties", href: "/owner/properties", icon: <Building2 className="w-5 h-5" /> },
  { label: "Hosts", href: "/owner/hosts", icon: <Users className="w-5 h-5" /> },
  { label: "Payouts", href: "/owner/payouts", icon: <CreditCard className="w-5 h-5" /> },
  { label: "Organization", href: "/owner/organization", icon: <Settings className="w-5 h-5" /> },
];

const hostNav: NavItem[] = [
  { label: "Dashboard", href: "/host", icon: <Home className="w-5 h-5" /> },
  { label: "Bookings", href: "/host/bookings", icon: <CalendarDays className="w-5 h-5" /> },
  { label: "Messages", href: "/host/messages", icon: <MessageSquare className="w-5 h-5" /> },
  { label: "Calendar", href: "/host/calendar", icon: <CalendarDays className="w-5 h-5" /> },
];

function getNavForPath(pathname: string): { nav: NavItem[]; roleLabel: string } {
  if (pathname.startsWith("/owner")) return { nav: ownerNav, roleLabel: "Owner" };
  if (pathname.startsWith("/host")) return { nav: hostNav, roleLabel: "Host" };
  return { nav: guestNav, roleLabel: "Guest" };
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { nav, roleLabel } = getNavForPath(pathname);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-white/10">
        <Logo variant="light" size="md" />
      </div>

      <div className="px-4 py-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-white/50">
          {roleLabel} Panel
        </span>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {nav.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? "bg-white/15 text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight className="w-4 h-4 text-white/50" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-accent/30 flex items-center justify-center text-white text-sm font-semibold">
            U
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">User Name</p>
            <p className="text-xs text-white/50 truncate">user@truvade.com</p>
          </div>
        </div>
        <button className="flex items-center gap-3 px-3 py-2 mt-1 w-full rounded-lg text-sm text-white/60 hover:bg-white/10 hover:text-white transition-colors">
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-1 bg-[#0B3D2C] overflow-y-auto">
          <SidebarContent />
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="fixed inset-y-0 left-0 z-50 w-64 bg-[#0B3D2C] lg:hidden"
            >
              <button
                onClick={() => setSidebarOpen(false)}
                className="absolute top-4 right-4 text-white/70 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar (mobile) */}
        <div className="sticky top-0 z-30 flex items-center gap-4 bg-white border-b border-gray-200 px-4 py-3 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-600 hover:text-gray-900 p-1"
          >
            <Menu className="w-6 h-6" />
          </button>
          <Logo variant="dark" size="sm" />
        </div>

        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
