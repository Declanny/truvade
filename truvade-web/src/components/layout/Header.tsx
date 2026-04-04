"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ChevronDown, MapPinHouse, Home, Menu } from "lucide-react";
import Logo from "../ui/Logo";
import { UserMenuDropdown } from "./UserMenuDropdown";

const navLinks = [
  { href: "/shortlets", label: "Shortlets", icon: MapPinHouse, soon: false },
] as const;

export const Header: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [pastBanner, setPastBanner] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [desktopQuery, setDesktopQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const isHome = pathname === "/";
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 10);
      setPastBanner(window.scrollY > 300);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const inDesktop = menuRef.current?.contains(target);
      const inMobile = mobileMenuRef.current?.contains(target);
      if (!inDesktop && !inMobile) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  // Focus search input when opened (mobile only now)
  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  // Escape closes overlays
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchOpen(false);
        setMenuOpen(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Transparent mode: on homepage, above banner, desktop only
  const transparent = isHome && !pastBanner;

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          transparent
            ? "bg-white lg:bg-transparent"
            : `bg-white ${isScrolled ? "shadow-[0_1px_3px_rgba(0,0,0,0.08)]" : ""}`
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[68px]">
            {/* Logo */}
            <Link href="/" className="shrink-0 block">
              {transparent ? (
                <>
                  <Logo variant="dark" size="md" className="lg:hidden" />
                  <Logo variant="light" size="md" className="hidden lg:block" />
                </>
              ) : (
                <Logo variant="dark" size="md" />
              )}
            </Link>

            {/* Desktop search bar — appears when scrolled past hero banner on homepage */}
            {isHome && (
              <div
                className={`hidden lg:block flex-1 max-w-xl mx-8 transition-all duration-300 ${
                  pastBanner ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
                }`}
              >
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (desktopQuery.trim()) {
                      router.push(`/shortlets?q=${encodeURIComponent(desktopQuery.trim())}`);
                      setDesktopQuery("");
                    }
                  }}
                  className="flex items-center bg-gray-50 rounded-full px-4 py-2 border border-gray-200 focus-within:border-[#0B3D2C]/40 transition-colors"
                >
                  <Search className="w-4 h-4 text-gray-400 shrink-0" />
                  <input
                    type="text"
                    value={desktopQuery}
                    onChange={(e) => setDesktopQuery(e.target.value)}
                    placeholder="Search city or property..."
                    className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none ml-2.5"
                  />
                  {desktopQuery.trim() && (
                    <button
                      type="submit"
                      className="px-3 py-1 bg-[#0B3D2C] text-white text-xs font-medium rounded-full hover:bg-[#0B3D2C]/90 transition-colors"
                    >
                      Search
                    </button>
                  )}
                </form>
              </div>
            )}

            {/* Desktop right group */}
            <div className="hidden lg:flex items-center gap-6">
              {/* Switch to Host */}
              <Link
                href="/owner"
                className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                  transparent ? "text-white hover:text-white/80" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Home className="w-4 h-4" />
                Switch to Host
              </Link>

              {/* Divider */}
              <div className={`h-5 w-px ${transparent ? "bg-white/60" : "bg-gray-200"}`} />

              {/* Nav links */}
              <nav className="flex items-center gap-1">
                {navLinks.map((link) => {
                  const active = pathname === link.href || (link.href === "/shortlets" && pathname.startsWith("/shortlets"));
                  return (
                    <Link
                      key={link.label}
                      href={link.href}
                      className={`relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        transparent
                          ? active
                            ? "text-white bg-white/15"
                            : "text-white hover:text-white/80 hover:bg-white/10"
                          : active
                            ? "text-[#0B3D2C] bg-[#0B3D2C]/5"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      <link.icon className="w-5 h-5" />
                      {link.label}
                      {link.soon && (
                        <span className="ml-1.5 text-[10px] font-semibold text-[#0B3D2C]/60 bg-[#0B3D2C]/8 px-1.5 py-0.5 rounded">
                          Soon
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* Divider */}
              <div className={`h-5 w-px ${transparent ? "bg-white/60" : "bg-gray-200"}`} />

              {/* Auth menu */}
              <div ref={menuRef} className="relative">
                <button
                  onClick={() => { setMenuOpen((v) => !v); }}
                  className={`flex items-center gap-2.5 pl-3 pr-2 py-2 rounded-full border transition-all ${
                    menuOpen
                      ? transparent
                        ? "border-white/80 bg-white/15 shadow-md"
                        : "border-gray-300 shadow-md"
                      : transparent
                        ? "border-white/70 hover:border-white/90 hover:shadow-md"
                        : "border-gray-200 hover:shadow-md"
                  }`}
                >
                  <Menu className={`w-4 h-4 ${transparent ? "text-white" : "text-gray-700"}`} />
                  <div className="w-7 h-7 rounded-full bg-[#0B3D2C] flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">G</span>
                  </div>
                </button>

                <UserMenuDropdown isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
              </div>
            </div>

            {/* Mobile right actions */}
            <div className="flex lg:hidden items-center gap-2">
              {/* Search toggle — mobile only */}
              <button
                onClick={() => { setSearchOpen((v) => !v); setMenuOpen(false); }}
                className={`p-2.5 rounded-lg transition-colors ${
                  searchOpen ? "bg-[#0B3D2C]/5 text-[#0B3D2C]" : "text-gray-600 hover:bg-gray-50"
                }`}
                aria-label="Search"
              >
                {searchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
              </button>

              {/* Auth menu — mobile */}
              <div ref={mobileMenuRef} className="relative lg:hidden">
                <button
                  onClick={() => { setMenuOpen((v) => !v); setSearchOpen(false); }}
                  className={`flex items-center gap-2 p-2 rounded-full border transition-all ${
                    menuOpen
                      ? "border-gray-300 shadow-md"
                      : "border-gray-200 hover:shadow-md"
                  }`}
                >
                  <Menu className="w-4 h-4 text-gray-700" />
                  <div className="w-7 h-7 rounded-full bg-[#0B3D2C] flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">G</span>
                  </div>
                </button>

                <UserMenuDropdown isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
              </div>
            </div>
          </div>
        </div>

        {/* Search bar — mobile only, slides down */}
        <div className="lg:hidden">
          <AnimatePresence>
            {searchOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="overflow-hidden border-t border-gray-100"
              >
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (searchQuery.trim()) {
                        router.push(`/shortlets?q=${encodeURIComponent(searchQuery.trim())}`);
                        setSearchOpen(false);
                        setSearchQuery("");
                      }
                    }}
                    className="flex items-center gap-3 max-w-2xl mx-auto bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 focus-within:border-[#0B3D2C]/30 transition-colors"
                  >
                    <Search className="w-5 h-5 text-gray-400 shrink-0" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by city, neighborhood, or property name"
                      className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none"
                    />
                    {searchQuery.trim() && (
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-[#0B3D2C] text-white text-sm font-medium rounded-lg hover:bg-[#0B3D2C]/90 transition-colors"
                      >
                        Search
                      </button>
                    )}
                    {!searchQuery.trim() && (
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <button type="button" onClick={() => { router.push("/shortlets?city=Lagos"); setSearchOpen(false); }} className="px-2 py-1 bg-white rounded border border-gray-200 hover:border-gray-300 transition-colors">Lagos</button>
                        <button type="button" onClick={() => { router.push("/shortlets?city=Abuja"); setSearchOpen(false); }} className="px-2 py-1 bg-white rounded border border-gray-200 hover:border-gray-300 transition-colors">Abuja</button>
                        <button type="button" onClick={() => { router.push("/shortlets?city=Port Harcourt"); setSearchOpen(false); }} className="px-2 py-1 bg-white rounded border border-gray-200 hover:border-gray-300 transition-colors">PH</button>
                      </div>
                    )}
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom border */}
        <div className={`border-b ${transparent ? "border-transparent" : "border-gray-100"}`} />
      </header>

      {/* Mobile nav links — horizontal scroll below header on mobile */}
      <div className="lg:hidden sticky top-[68px] z-40 bg-white border-b border-gray-100">
        <div className="flex items-center gap-1 px-4 py-2 overflow-x-auto scrollbar-hide">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href || (link.href === "/shortlets" && pathname.startsWith("/shortlets"));
            return (
              <Link
                key={link.label}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  active
                    ? "bg-[#0B3D2C] text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {link.label}
                {link.soon && <span className="text-[9px] opacity-60">Soon</span>}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
};
