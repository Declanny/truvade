"use client";

import { motion } from "framer-motion";
import { Search, Heart, MessageCircle, User, CalendarDays } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { icon: Search, label: "Explore", href: "/" },
  { icon: Heart, label: "Wishlist", href: "/account/guest/wishlist" },
  { icon: CalendarDays, label: "Bookings", href: "/account/guest/bookings" },
  { icon: MessageCircle, label: "Inbox", href: "/account/guest/messages" },
  { icon: User, label: "Profile", href: "/account/profile" },
];

export const MobileBottomNav = () => {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/" || pathname.startsWith("/shortlets") || pathname.startsWith("/properties");
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="flex-1">
              <motion.div className="flex flex-col items-center justify-center py-2" whileTap={{ scale: 0.9 }} transition={{ duration: 0.1 }}>
                <Icon className={`w-6 h-6 mb-1 ${active ? "text-[#0B3D2C]" : "text-gray-500"}`} strokeWidth={active ? 2.5 : 2} />
                <span className={`text-[10px] font-medium ${active ? "text-[#0B3D2C]" : "text-gray-500"}`}>{item.label}</span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
