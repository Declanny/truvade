"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Send, ArrowLeft, MessageSquare } from "lucide-react";
import { Button, Input, Avatar, Skeleton } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { extractErrorMessage } from "@/lib/api";
import {
  getThread,
  listThreads,
  markThreadRead,
  sendMessage,
} from "@/lib/api-messages";
import type {
  ApiMessage,
  ApiThreadParticipant,
  ApiThreadSummary,
} from "@/lib/api-types";

interface MessagesViewProps {
  /** Optional header title; defaults to "Messages". */
  title?: string;
  /** Poll interval in ms for the thread list (default 15s). */
  pollIntervalMs?: number;
}

const UNSAFE_PATTERN = /\d{10,11}|\+234|https?:\/\/|www\.|\.com/i;

export function MessagesView({
  title = "Messages",
  pollIntervalMs = 15000,
}: MessagesViewProps) {
  const { user } = useAuth();
  const currentUserId = user ? Number(user.id) : null;

  const [threads, setThreads] = useState<ApiThreadSummary[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(true);
  const [threadsError, setThreadsError] = useState<string | null>(null);

  const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);

  const [messageInput, setMessageInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const refreshThreads = useCallback(async () => {
    try {
      const data = await listThreads();
      setThreads(data);
      setThreadsError(null);
    } catch (err) {
      setThreadsError(extractErrorMessage(err));
    }
  }, []);

  // Initial load
  useEffect(() => {
    (async () => {
      setThreadsLoading(true);
      await refreshThreads();
      setThreadsLoading(false);
    })();
  }, [refreshThreads]);

  // Background polling for thread list
  useEffect(() => {
    if (pollIntervalMs <= 0) return;
    const id = setInterval(refreshThreads, pollIntervalMs);
    return () => clearInterval(id);
  }, [pollIntervalMs, refreshThreads]);

  // Auto-select first thread on first load
  useEffect(() => {
    if (selectedThreadId !== null) return;
    if (threads.length === 0) return;
    setSelectedThreadId(threads[0].id);
  }, [threads, selectedThreadId]);

  // Load messages whenever the selected thread changes
  useEffect(() => {
    if (selectedThreadId == null) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    setMessagesLoading(true);
    setMessagesError(null);
    getThread(selectedThreadId)
      .then((detail) => {
        if (cancelled) return;
        setMessages(detail.messages);
      })
      .catch((err) => {
        if (!cancelled) setMessagesError(extractErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setMessagesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedThreadId]);

  // Mark thread read on open (best-effort, silent failure)
  useEffect(() => {
    if (selectedThreadId == null) return;
    markThreadRead(selectedThreadId)
      .then(() => {
        // Locally zero the unread badge without a refetch
        setThreads((prev) =>
          prev.map((t) =>
            t.id === selectedThreadId ? { ...t, unread_count: 0 } : t
          )
        );
      })
      .catch(() => {});
  }, [selectedThreadId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSend() {
    if (selectedThreadId == null) return;
    const body = messageInput.trim();
    if (!body) return;
    setSending(true);
    setSendError(null);

    // Optimistic append
    const tempId = -Date.now();
    const optimistic: ApiMessage = {
      id: tempId,
      thread: selectedThreadId,
      sender: currentUserId ?? 0,
      sender_name: user?.name ?? "",
      sender_avatar: null,
      body,
      attachment: null,
      edited_at: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setMessageInput("");

    try {
      const real = await sendMessage(selectedThreadId, body);
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? real : m))
      );
      // Trigger thread list refresh so the snippet + ordering update
      refreshThreads();
    } catch (err) {
      // Rollback
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setMessageInput(body);
      setSendError(extractErrorMessage(err));
    } finally {
      setSending(false);
    }
  }

  const activeThread = threads.find((t) => t.id === selectedThreadId) ?? null;
  const counterpart = getCounterpart(activeThread, currentUserId);

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{title}</h1>

      <div
        className="bg-white rounded-xl border border-gray-200 overflow-hidden"
        style={{ height: "calc(100vh - 200px)", minHeight: "500px" }}
      >
        <div className="flex h-full">
          {/* Thread list */}
          <div
            className={`w-full md:w-80 border-r border-gray-200 flex flex-col ${
              selectedThreadId !== null ? "hidden md:flex" : "flex"
            }`}
          >
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-700 text-sm">
                Conversations
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {threadsLoading ? (
                <ThreadListSkeleton />
              ) : threadsError ? (
                <div className="p-4 text-sm text-red-700">{threadsError}</div>
              ) : threads.length === 0 ? (
                <EmptyState />
              ) : (
                threads.map((thread) => {
                  const other = getCounterpart(thread, currentUserId);
                  return (
                    <button
                      key={thread.id}
                      onClick={() => setSelectedThreadId(thread.id)}
                      className={`w-full flex items-start gap-3 p-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 ${
                        selectedThreadId === thread.id
                          ? "bg-[#0B3D2C]/5"
                          : ""
                      }`}
                    >
                      <Avatar
                        src={other?.user_avatar ?? undefined}
                        initials={initialsFromName(other?.user_name)}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-sm font-semibold text-gray-900 truncate">
                            {other?.user_name || "Unknown"}
                          </span>
                          <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                            {formatRelative(
                              thread.last_message?.created_at ??
                                thread.last_message_at
                            )}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 truncate mt-0.5">
                          {thread.last_message?.body || "No messages yet"}
                        </p>
                      </div>
                      {thread.unread_count > 0 && (
                        <span className="w-5 h-5 bg-[#B87333] text-white text-xs rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                          {thread.unread_count}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Message pane */}
          <div
            className={`flex-1 flex flex-col ${
              selectedThreadId === null ? "hidden md:flex" : "flex"
            }`}
          >
            {selectedThreadId === null ? (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Select a conversation to view messages</p>
                </div>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center gap-3 p-4 border-b border-gray-200">
                  <button
                    onClick={() => setSelectedThreadId(null)}
                    className="md:hidden text-gray-500 hover:text-gray-700"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <Avatar
                    src={counterpart?.user_avatar ?? undefined}
                    initials={initialsFromName(counterpart?.user_name)}
                    size="md"
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">
                      {counterpart?.user_name || "Unknown"}
                    </p>
                    {activeThread?.subject && (
                      <p className="text-xs text-gray-500 truncate">
                        {activeThread.subject}
                      </p>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messagesLoading ? (
                    <MessagesSkeleton />
                  ) : messagesError ? (
                    <div className="text-sm text-red-700">{messagesError}</div>
                  ) : messages.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">
                      Say hi — start the conversation.
                    </p>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.sender === currentUserId;
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${
                            isMe ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                              isMe
                                ? "bg-[#0B3D2C] text-white rounded-br-md"
                                : "bg-gray-100 text-gray-900 rounded-bl-md"
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">
                              {msg.body}
                            </p>
                            <p
                              className={`text-xs mt-1 ${
                                isMe ? "text-white/60" : "text-gray-400"
                              }`}
                            >
                              {formatTime(msg.created_at)}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Composer */}
                <div className="p-4 border-t border-gray-200">
                  {UNSAFE_PATTERN.test(messageInput) && (
                    <div className="mb-2 px-3 py-2 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-sm">
                      For your safety, sharing contact details or links is
                      discouraged before check-in.
                    </div>
                  )}
                  {sendError && (
                    <div className="mb-2 text-sm text-red-700">{sendError}</div>
                  )}
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      fullWidth
                      disabled={sending}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                    />
                    <Button
                      size="md"
                      leftIcon={<Send className="w-4 h-4" />}
                      onClick={handleSend}
                      loading={sending}
                      disabled={!messageInput.trim()}
                    >
                      Send
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getCounterpart(
  thread: ApiThreadSummary | null,
  currentUserId: number | null
): ApiThreadParticipant | null {
  if (!thread || currentUserId == null) return null;
  return (
    thread.participants.find((p) => p.user !== currentUserId) ??
    thread.participants[0] ??
    null
  );
}

function initialsFromName(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-NG", {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function formatRelative(iso: string | null): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const diffMs = Date.now() - d.getTime();
    const min = Math.floor(diffMs / 60000);
    if (min < 1) return "now";
    if (min < 60) return `${min}m`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h`;
    const day = Math.floor(hr / 24);
    if (day < 7) return `${day}d`;
    return d.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function ThreadListSkeleton() {
  return (
    <div className="p-3 space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

function MessagesSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className={i % 2 === 0 ? "flex justify-end" : "flex"}>
          <Skeleton className="h-10 w-2/3 rounded-2xl" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="p-6 text-center text-sm text-gray-500">
      No conversations yet. Message a host from a property listing to start
      one.
    </div>
  );
}
