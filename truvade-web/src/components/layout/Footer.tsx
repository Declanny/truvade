"use client";

import React from "react";
import Link from "next/link";
import { Facebook, Twitter, Instagram } from "lucide-react";

const footerSections = {
  support: [
    { name: "Help Center", href: "/help" },
    { name: "Safety information", href: "/safety" },
    { name: "TruCover", href: "/trucover" },
    { name: "Cancellation options", href: "/cancellation" },
  ],
  hosting: [
    { name: "List your home", href: "/owner" },
    { name: "Hosting resources", href: "/hosting-guide" },
    { name: "Community forum", href: "/community" },
    { name: "Responsible hosting", href: "/responsible-hosting" },
  ],
  truvade: [
    { name: "About", href: "/about" },
    { name: "Newsroom", href: "/press" },
    { name: "Careers", href: "/careers" },
    { name: "Gift cards", href: "/gift-cards" },
  ],
};

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-100 border-t border-gray-200">
      <div className="max-w-[1760px] mx-auto px-3 sm:px-5 lg:px-10 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Support</h4>
            <ul className="space-y-3">
              {footerSections.support.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-gray-600 hover:text-gray-900 hover:underline transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Hosting</h4>
            <ul className="space-y-3">
              {footerSections.hosting.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-gray-600 hover:text-gray-900 hover:underline transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">TruVade</h4>
            <ul className="space-y-3">
              {footerSections.truvade.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-gray-600 hover:text-gray-900 hover:underline transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-200">
        <div className="max-w-[1760px] mx-auto px-3 sm:px-5 lg:px-10 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-1 text-sm text-gray-600">
              <span>&copy; 2026 TruVade, Inc.</span>
              <span className="mx-1">&middot;</span>
              <Link href="/privacy" className="hover:underline">Privacy</Link>
              <span className="mx-1">&middot;</span>
              <Link href="/terms" className="hover:underline">Terms</Link>
            </div>
            <div className="flex items-center gap-4">
              <a href="#" className="text-gray-700 hover:text-gray-900 transition-colors">
                <Facebook className="w-[18px] h-[18px]" />
              </a>
              <a href="#" className="text-gray-700 hover:text-gray-900 transition-colors">
                <Twitter className="w-[18px] h-[18px]" />
              </a>
              <a href="#" className="text-gray-700 hover:text-gray-900 transition-colors">
                <Instagram className="w-[18px] h-[18px]" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
