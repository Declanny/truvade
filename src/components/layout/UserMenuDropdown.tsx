"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  CalendarDays,
  MessageSquare,
  User,
  Settings,
  Globe,
  HelpCircle,
  Home,
  Users,
  LogOut,
} from "lucide-react";

interface UserMenuDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn?: boolean;
}

const menuItemClass =
  "flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors w-full text-left";

export const UserMenuDropdown: React.FC<UserMenuDropdownProps> = ({
  isOpen,
  onClose,
  isLoggedIn = true,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.15 }}
          className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50"
        >
          {isLoggedIn ? (
            <>
              {/* Section 1: Guest navigation */}
              <Link href="/account/guest/wishlist" onClick={onClose} className={menuItemClass}>
                <Heart className="w-4 h-4" />
                Wishlists
              </Link>
              <Link href="/account/guest/bookings" onClick={onClose} className={menuItemClass}>
                <CalendarDays className="w-4 h-4" />
                Bookings
              </Link>
              <Link href="/account/guest/messages" onClick={onClose} className={menuItemClass}>
                <MessageSquare className="w-4 h-4" />
                Messages
              </Link>
              <Link href="/account/profile" onClick={onClose} className={menuItemClass}>
                <User className="w-4 h-4" />
                Profile
              </Link>

              <div className="my-1.5 border-t border-gray-100" />

              {/* Section 2: Settings */}
              <Link href="/account/settings" onClick={onClose} className={menuItemClass}>
                <Settings className="w-4 h-4" />
                Account settings
              </Link>
              <Link href="/account/settings/preferences" onClick={onClose} className={menuItemClass}>
                <Globe className="w-4 h-4" />
                Languages & currency
              </Link>
              <Link href="/help" onClick={onClose} className={menuItemClass}>
                <HelpCircle className="w-4 h-4" />
                Help Center
              </Link>

              <div className="my-1.5 border-t border-gray-100" />

              {/* Section 3: Hosting */}
              <Link href="/owner" onClick={onClose} className={menuItemClass}>
                <Home className="w-4 h-4" />
                <div>
                  <span className="font-semibold text-gray-900">List your property</span>
                  <p className="text-xs text-gray-500 mt-0.5">Start hosting and earn income</p>
                </div>
              </Link>
              <Link href="/owner/hosts" onClick={onClose} className={menuItemClass}>
                <Users className="w-4 h-4" />
                Find a co-host
              </Link>

              <div className="my-1.5 border-t border-gray-100" />

              {/* Section 4: Logout */}
              <button onClick={onClose} className={menuItemClass}>
                <LogOut className="w-4 h-4" />
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/signup"
                onClick={onClose}
                className="block px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
              >
                Sign up
              </Link>
              <Link
                href="/login"
                onClick={onClose}
                className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Log in
              </Link>

              <div className="my-1.5 border-t border-gray-100" />

              <Link href="/owner" onClick={onClose} className={menuItemClass}>
                <Home className="w-4 h-4" />
                List your property
              </Link>
              <Link href="/help" onClick={onClose} className={menuItemClass}>
                <HelpCircle className="w-4 h-4" />
                Help Center
              </Link>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
