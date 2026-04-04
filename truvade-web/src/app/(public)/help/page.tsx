"use client";

import { useState } from "react";
import { Search, ChevronDown, ChevronRight, Home, CalendarDays, CreditCard, Shield, MessageSquare, Users } from "lucide-react";

const categories = [
  {
    icon: Home,
    title: "Booking & stays",
    questions: [
      { q: "How do I book a shortlet?", a: "Search for a property, select your dates and guests, then click Reserve. You'll be asked to provide your details and payment to confirm the booking." },
      { q: "Can I book in advance?", a: "Yes, you can book properties well in advance. Check the property calendar to see available dates." },
      { q: "What is the cancellation policy?", a: "Cancellation policies vary by property. Most properties offer free cancellation up to 48 hours before check-in. Check the listing for specific details." },
      { q: "How do I check in?", a: "After your booking is confirmed, your host will send you check-in instructions including the address and any access codes needed." },
    ],
  },
  {
    icon: CreditCard,
    title: "Payments & pricing",
    questions: [
      { q: "How do I pay for a booking?", a: "All payments are processed securely through the Truvade platform. We accept bank transfers and card payments." },
      { q: "When am I charged?", a: "You are charged when your booking is confirmed. The full amount including service and cleaning fees is collected upfront." },
      { q: "How do refunds work?", a: "If you cancel within the free cancellation window, you'll receive a full refund within 5-7 business days. After the window, the refund amount depends on the cancellation policy." },
      { q: "What fees does Truvade charge?", a: "Truvade charges a service fee (typically 8%) added to the nightly rate. Cleaning fees are set by the property owner." },
    ],
  },
  {
    icon: CalendarDays,
    title: "Hosting",
    questions: [
      { q: "How do I list my property?", a: "Go to your Owner Dashboard and click 'Add Property'. Follow the step-by-step wizard to add your property details, photos, amenities, and pricing." },
      { q: "How do I invite a host to manage my property?", a: "From your Owner Dashboard, go to Hosts and click 'Invite Host'. You can set their permissions, commission rate, and assign specific properties." },
      { q: "When do I receive payouts?", a: "Payouts are processed according to your payout schedule (daily, weekly, or monthly). Funds are released after guest check-in confirmation." },
      { q: "How does the commission system work?", a: "As an owner, you set the commission percentage for each host during invitation. The host's commission is automatically calculated and distributed from each booking." },
    ],
  },
  {
    icon: Shield,
    title: "Trust & safety",
    questions: [
      { q: "How does Truvade verify hosts?", a: "Verified hosts have completed identity verification, maintained high ratings, and demonstrated consistent hosting quality. Look for the verified badge on listings." },
      { q: "Is my payment secure?", a: "All payments are processed through secure, encrypted channels. Truvade holds payments in escrow until check-in is confirmed, protecting both guests and hosts." },
      { q: "What if something goes wrong during my stay?", a: "Contact your host through the Truvade messaging system. If the issue isn't resolved, reach out to our support team for assistance." },
    ],
  },
  {
    icon: MessageSquare,
    title: "Messaging",
    questions: [
      { q: "How do I message my host?", a: "You can message your host from the property listing page or from your bookings. All communication is kept within the Truvade platform for your safety." },
      { q: "Why can't I share my phone number?", a: "To protect both guests and hosts, contact details are only shared after a booking is confirmed. This prevents off-platform transactions and ensures everyone is protected." },
    ],
  },
  {
    icon: Users,
    title: "Account",
    questions: [
      { q: "Can I be both a guest and a host?", a: "Yes! Your Truvade account supports multiple roles. You can book stays as a guest and manage properties as an owner or host simultaneously." },
      { q: "How do I change my account settings?", a: "Go to Account Settings from the menu. You can update your personal information, payment methods, notification preferences, and more." },
      { q: "How do I verify my identity?", a: "Go to Account Settings > Personal Information and click 'Start' next to Identity Verification. You'll be asked to provide a government-issued ID." },
    ],
  },
];

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openCategory, setOpenCategory] = useState<number | null>(null);
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);

  const filteredCategories = searchQuery.trim()
    ? categories.map((cat) => ({
        ...cat,
        questions: cat.questions.filter(
          (faq) =>
            faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.a.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter((cat) => cat.questions.length > 0)
    : categories;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900">How can we help?</h1>
        <p className="text-gray-500 mt-2">Search our help center or browse by topic below.</p>

        <div className="relative mt-6 max-w-lg mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for answers..."
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D2C]/20 focus:border-[#0B3D2C] transition-colors"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-3">
        {filteredCategories.map((category, catIdx) => (
          <div key={category.title} className="border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setOpenCategory(openCategory === catIdx ? null : catIdx)}
              className="flex items-center gap-3 w-full px-5 py-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-[#0B3D2C]/10 flex items-center justify-center flex-shrink-0">
                <category.icon className="w-5 h-5 text-[#0B3D2C]" />
              </div>
              <span className="text-sm font-semibold text-gray-900 flex-1">{category.title}</span>
              <span className="text-xs text-gray-400">{category.questions.length} articles</span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${openCategory === catIdx ? "rotate-180" : ""}`} />
            </button>

            {openCategory === catIdx && (
              <div className="border-t border-gray-100">
                {category.questions.map((faq) => (
                  <div key={faq.q} className="border-b border-gray-50 last:border-b-0">
                    <button
                      onClick={() => setOpenQuestion(openQuestion === faq.q ? null : faq.q)}
                      className="flex items-center gap-2 w-full px-5 py-3.5 text-left hover:bg-gray-50 transition-colors"
                    >
                      <ChevronRight className={`w-3.5 h-3.5 text-gray-400 flex-shrink-0 transition-transform ${openQuestion === faq.q ? "rotate-90" : ""}`} />
                      <span className="text-sm text-gray-700">{faq.q}</span>
                    </button>
                    {openQuestion === faq.q && (
                      <div className="px-5 pb-4 pl-10">
                        <p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Contact */}
      <div className="mt-10 text-center border border-gray-200 rounded-xl p-8">
        <h2 className="text-lg font-semibold text-gray-900">Still need help?</h2>
        <p className="text-sm text-gray-500 mt-1">
          Our support team is available to assist you.
        </p>
        <a href="mailto:support@truvade.com" className="inline-block mt-4 px-6 py-2.5 bg-[#0B3D2C] text-white text-sm font-medium rounded-xl hover:bg-[#0a3526] transition-colors">
          Contact support
        </a>
      </div>
    </div>
  );
}
