"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Globe, User, Search, MapPinHouse, Hotel, TreePalm } from "lucide-react";
import Logo from "../ui/Logo";

const categories = [
  { key: "shortlets", label: "Shortlets", icon: MapPinHouse },
  { key: "hotels", label: "Hotels", icon: Hotel },
  { key: "experiences", label: "Experiences", icon: TreePalm },
] as const;

export const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("shortlets");
  const searchRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const scrollYOnOpen = useRef(0);
  const justOpened = useRef(false);

  const showExpanded = !isScrolled || searchOpen;

  // Scroll handler
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
      if (searchOpen && !justOpened.current && Math.abs(window.scrollY - scrollYOnOpen.current) > 30) {
        setSearchOpen(false);
      }
      setMenuOpen(false);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [searchOpen]);

  // Click outside handler
  useEffect(() => {
    if (!searchOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [searchOpen]);

  // Click outside handler for menu
  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  // Escape key handler for menu
  useEffect(() => {
    if (!menuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  const handlePillClick = useCallback(() => {
    justOpened.current = true;
    setSearchOpen(true);
    setMenuOpen(false);
    requestAnimationFrame(() => {
      scrollYOnOpen.current = window.scrollY;
      justOpened.current = false;
    });
  }, []);

  return (
    <motion.header
      ref={searchRef}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
      className={`sticky top-0 z-50 transition-shadow duration-300 bg-white ${
        isScrolled && !searchOpen ? "shadow-sm" : ""
      }`}
    >
      <div className="max-w-[1760px] mx-auto px-3 sm:px-5 lg:px-10">
        {/* Top row */}
        <div className="relative flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="shrink-0">
            <motion.div whileHover={{ scale: 1.02 }} className="cursor-pointer">
              <Logo variant="dark" size="lg" />
            </motion.div>
          </Link>

          {/* Center — Category tabs (desktop, expanded) */}
          {showExpanded && (
            <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center gap-1">
              {categories.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveCategory(key)}
                  className={`relative flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-full transition-colors cursor-pointer ${
                    activeCategory === key
                      ? "text-gray-900"
                      : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                  {activeCategory === key && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-3 right-3 h-0.5 bg-gray-900 rounded-full"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Center — Collapsed pill (desktop, when scrolled & search not open) */}
          {!showExpanded && (
            <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2">
              <AnimatePresence mode="wait">
                <motion.div
                  key="collapsed"
                  initial={{ opacity: 0, scale: 0.9, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -10 }}
                  transition={{ duration: 0.25 }}
                >
                  <button
                    onClick={handlePillClick}
                    className="flex items-center gap-4 px-6 py-2.5 border border-gray-300 rounded-full hover:shadow-md transition-all cursor-pointer"
                  >
                    <span className="text-sm font-medium text-gray-800">Anywhere in Africa</span>
                    <span className="w-px h-5 bg-gray-300" />
                    <span className="text-sm font-medium text-gray-800">Anytime</span>
                    <span className="w-px h-5 bg-gray-300" />
                    <span className="text-sm text-gray-500">Add guests</span>
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                      <Search className="w-4 h-4 text-white" />
                    </div>
                  </button>
                </motion.div>
              </AnimatePresence>
            </div>
          )}

          {/* Center — Mobile pill (always visible on mobile) */}
          <div className="flex lg:hidden">
            <Link href="/properties">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-3 px-4 py-2 border border-gray-300 rounded-full hover:shadow-md transition-all cursor-pointer"
              >
                <Search className="w-4 h-4 text-gray-600" />
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-gray-800 leading-tight">Anywhere in Africa</span>
                  <span className="text-[11px] text-gray-500 leading-tight">Anytime · Add guests</span>
                </div>
              </motion.div>
            </Link>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/owner" className="hidden md:block">
              <motion.button
                whileHover={{ scale: 1.02 }}
                className="text-sm font-semibold text-gray-800 px-4 py-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                List your property
              </motion.button>
            </Link>

            <motion.button
              whileHover={{ scale: 1.05 }}
              title="Language & currency"
              className="p-3 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Globe className="w-5 h-5 text-gray-700" />
            </motion.button>

            <div ref={menuRef} className="relative">
              <button
                onClick={() => {
                  setMenuOpen((prev) => !prev);
                  setSearchOpen(false);
                }}
                aria-expanded={menuOpen}
                aria-haspopup="true"
                className={`flex items-center gap-3 px-3 py-2 border border-gray-300 rounded-full transition-all cursor-pointer ${
                  menuOpen ? "shadow-md" : "hover:shadow-md"
                }`}
              >
                <Menu className="w-4 h-4 text-gray-700" />
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "#0B3D2C" }}>
                  <User className="w-5 h-5 text-white" />
                </div>
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.15 }}
                    role="menu"
                    className="absolute right-0 top-full mt-2 w-60 rounded-xl bg-white shadow-lg border border-gray-200 py-2 z-50"
                  >
                    <Link
                      href="/signup"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-100 transition-colors"
                    >
                      Sign up
                    </Link>
                    <Link
                      href="/login"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-3 text-sm text-gray-800 hover:bg-gray-100 transition-colors"
                    >
                      Log in
                    </Link>
                    <div className="my-1 border-t border-gray-200" />
                    <Link
                      href="/owner"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-3 text-sm text-gray-800 hover:bg-gray-100 transition-colors"
                    >
                      List your property
                    </Link>
                    <Link
                      href="#"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-3 text-sm text-gray-800 hover:bg-gray-100 transition-colors"
                    >
                      Help Center
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Expanded search bar (desktop only) */}
        <div className="hidden lg:block">
          <AnimatePresence>
            {showExpanded && (
              <motion.div
                key="expanded"
                initial={{ opacity: 0, scale: 0.92, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: -20 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="flex justify-center pb-5"
              >
                <Link href="/properties" className="w-full max-w-[720px]">
                  <div className="flex items-center w-full border border-gray-300 rounded-full shadow-sm hover:shadow-md transition-shadow bg-white">
                    {/* Where */}
                    <div className="flex-1 px-6 py-3 rounded-l-full hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="text-xs font-semibold text-gray-800">Where</div>
                      <div className="text-sm text-gray-500">Search destinations</div>
                    </div>

                    <div className="w-px h-10 bg-gray-200" />

                    {/* When */}
                    <div className="flex-1 px-6 py-3 hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="text-xs font-semibold text-gray-800">When</div>
                      <div className="text-sm text-gray-500">Add dates</div>
                    </div>

                    <div className="w-px h-10 bg-gray-200" />

                    {/* Who */}
                    <div className="flex-[0.8] px-6 py-3 hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="text-xs font-semibold text-gray-800">Who</div>
                      <div className="text-sm text-gray-500">Add guests</div>
                    </div>

                    {/* Search button */}
                    <div className="pr-2">
                      <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center hover:brightness-110 transition-all">
                        <Search className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom border when expanded with searchOpen (overlay mode) */}
      {searchOpen && <div className="border-b border-gray-200" />}
    </motion.header>
  );
};
