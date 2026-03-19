"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Send, ArrowLeft, Building2 } from "lucide-react";
import { Button, Input } from "@/components/ui";

interface Conversation {
  id: string;
  guestName: string;
  propertyName: string;
  propertyImage: string;
  orgName: string;
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
}

interface ChatMessage {
  id: string;
  content: string;
  timestamp: string;
  isMe: boolean;
}

const mockConversations: Conversation[] = [
  {
    id: "hc-1",
    guestName: "Adaeze Nwosu",
    propertyName: "Luxury 3-Bedroom Apartment",
    propertyImage: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=100",
    orgName: "TruVade Properties Ltd",
    lastMessage: "Is early check-in possible? We arrive around 10 AM.",
    lastMessageTime: "30m ago",
    unread: 2,
  },
  {
    id: "hc-2",
    guestName: "Emeka Obi",
    propertyName: "Cozy Studio in Lekki",
    propertyImage: "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=100",
    orgName: "TruVade Properties Ltd",
    lastMessage: "Thank you for the directions!",
    lastMessageTime: "2h ago",
    unread: 0,
  },
  {
    id: "hc-3",
    guestName: "Fatima Bello",
    propertyName: "Penthouse with Rooftop Pool",
    propertyImage: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=100",
    orgName: "Ikoyi Luxury Stays",
    lastMessage: "The WiFi password isn't working. Can you help?",
    lastMessageTime: "1h ago",
    unread: 1,
  },
  {
    id: "hc-4",
    guestName: "Kola Adeyemi",
    propertyName: "Family Home in Maitama",
    propertyImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=100",
    orgName: "TruVade Properties Ltd",
    lastMessage: "We had a wonderful stay. Thank you!",
    lastMessageTime: "1d ago",
    unread: 0,
  },
];

const mockMessages: Record<string, ChatMessage[]> = {
  "hc-1": [
    { id: "m1", content: "Hello! I just booked the apartment for April 1-5. Very excited!", timestamp: "Mar 16, 9:30 AM", isMe: false },
    { id: "m2", content: "Welcome! We're happy to have you. Let me know if you need anything before your stay.", timestamp: "Mar 16, 9:45 AM", isMe: true },
    { id: "m3", content: "Is early check-in possible? We arrive around 10 AM.", timestamp: "Mar 16, 10:00 AM", isMe: false },
  ],
  "hc-2": [
    { id: "m1", content: "Hi, can you send directions from the airport?", timestamp: "Mar 15, 3:00 PM", isMe: false },
    { id: "m2", content: "Sure! Take the Lekki-Epe expressway and turn right at Admiralty Way. The building is on the left. I'll send a pin.", timestamp: "Mar 15, 3:15 PM", isMe: true },
    { id: "m3", content: "Thank you for the directions!", timestamp: "Mar 15, 3:20 PM", isMe: false },
  ],
  "hc-3": [
    { id: "m1", content: "Hi, we've checked in. Beautiful place!", timestamp: "Mar 17, 2:00 PM", isMe: false },
    { id: "m2", content: "Thank you! Glad you like it. The pool is open until 9 PM.", timestamp: "Mar 17, 2:10 PM", isMe: true },
    { id: "m3", content: "The WiFi password isn't working. Can you help?", timestamp: "Mar 17, 4:00 PM", isMe: false },
  ],
  "hc-4": [
    { id: "m1", content: "We had a wonderful stay. Thank you!", timestamp: "Mar 14, 11:00 AM", isMe: false },
    { id: "m2", content: "It was our pleasure! We'd love to host you again. Safe travels!", timestamp: "Mar 14, 11:30 AM", isMe: true },
  ],
};

export default function HostMessagesPage() {
  const [selectedConv, setSelectedConv] = useState<string | null>("hc-1");
  const [messageInput, setMessageInput] = useState("");

  const activeConversation = mockConversations.find((c) => c.id === selectedConv);
  const messages = selectedConv ? mockMessages[selectedConv] || [] : [];

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 border-l-4 border-[#0B3D2C] pl-4 mb-6">Messages</h1>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden" style={{ height: "calc(100vh - 200px)", minHeight: "500px" }}>
        <div className="flex h-full">
          {/* Conversation List */}
          <div className={`w-full md:w-80 border-r border-gray-200 flex flex-col ${selectedConv ? "hidden md:flex" : "flex"}`}>
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-700 text-sm">Guest Conversations</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {mockConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConv(conv.id)}
                  className={`w-full flex items-start gap-3 p-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 ${
                    selectedConv === conv.id ? "bg-[#0B3D2C]/5" : ""
                  }`}
                >
                  <img
                    src={conv.propertyImage}
                    alt={conv.propertyName}
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm font-semibold text-gray-900 truncate">
                        {conv.guestName}
                      </span>
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                        {conv.lastMessageTime}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400 mb-0.5">
                      <Building2 className="w-3 h-3" />
                      <span className="truncate">{conv.orgName}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{conv.propertyName}</p>
                    <p className="text-sm text-gray-600 truncate mt-0.5">{conv.lastMessage}</p>
                  </div>
                  {conv.unread > 0 && (
                    <span className="w-5 h-5 bg-[#B87333] text-white text-xs rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      {conv.unread}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Message Thread */}
          <div className={`flex-1 flex flex-col ${!selectedConv ? "hidden md:flex" : "flex"}`}>
            {activeConversation ? (
              <>
                <div className="flex items-center gap-3 p-4 border-b border-gray-200">
                  <button
                    onClick={() => setSelectedConv(null)}
                    className="md:hidden text-gray-500 hover:text-gray-700"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <img
                    src={activeConversation.propertyImage}
                    alt=""
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{activeConversation.guestName}</p>
                    <p className="text-xs text-gray-500">
                      {activeConversation.propertyName} &middot; {activeConversation.orgName}
                    </p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                          msg.isMe
                            ? "bg-[#0B3D2C] text-white rounded-br-md"
                            : "bg-gray-100 text-gray-900 rounded-bl-md"
                        }`}
                      >
                        <p>{msg.content}</p>
                        <p className={`text-xs mt-1 ${msg.isMe ? "text-white/60" : "text-gray-400"}`}>
                          {msg.timestamp}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="p-4 border-t border-gray-200">
                  {/\d{10,11}|\+234|https?:\/\/|www\.|\.com/i.test(messageInput) && (
                    <div className="mb-2 px-3 py-2 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-sm">
                      For your safety, sharing contact details or links is not allowed before check-in.
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      fullWidth
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && messageInput.trim()) setMessageInput("");
                      }}
                    />
                    <Button
                      size="md"
                      leftIcon={<Send className="w-4 h-4" />}
                      onClick={() => {
                        if (messageInput.trim()) setMessageInput("");
                      }}
                    >
                      Send
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <MessageSquareIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Select a conversation to view messages</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageSquareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
    </svg>
  );
}
