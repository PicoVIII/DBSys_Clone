"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "../components/navbar";
import Link from "next/link";

type Conversation = {
  conv_id: number;
  listg_id: number | null;
  buyer_id: number;
  seller_id: number;
  buyer_fname: string;
  buyer_lname: string;
  seller_fname: string;
  seller_lname: string;
  listg_title: string | null;
  last_message: string | null;
  last_date: string | null;
  unread: number;
};

type MessageItem = {
  msg_id: number;
  conv_id: number;
  sender_id: number;
  msg_content: string;
  msg_created: string;
  msg_read: string | null;
  fname: string;
  lname: string;
};

export default function MessagesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const convParam = searchParams?.get("conv");
  const userId = (session?.user as { id?: string } | null)?.id;
  const userName = session?.user?.name;

  const [convs, setConvs] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<number | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [msgText, setMsgText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (!userId) return;
    fetch("/api/messages")
      .then((r) => r.json())
      .then((d) => {
        setConvs(d.data ?? []);
        const targetId = convParam ? Number(convParam) : null;
        const targetConv = targetId && d.data?.find((c: Conversation) => c.conv_id === targetId) ? targetId : null;
        setActiveConv(targetConv ?? d.data?.[0]?.conv_id ?? null);
        setLoading(false);
      });
  }, [userId]);

  useEffect(() => {
    if (!activeConv) return;
    fetch(`/api/messages/${activeConv}`)
      .then((r) => r.json())
      .then((d) => {
        setMessages(d.data?.messages ?? []);
        setConvs((prev) =>
          prev.map((c) =>
            c.conv_id === activeConv ? { ...c, unread: 0 } : c
          )
        );
      });
  }, [activeConv]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!msgText.trim() || !activeConv || sending) return;
    setSending(true);
    const res = await fetch(`/api/messages/${activeConv}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: msgText }),
    });
    setSending(false);
    if (res.ok) {
      setMsgText("");
      const d = await fetch(`/api/messages/${activeConv}`).then((r) => r.json());
      setMessages(d.data?.messages ?? []);
      fetch("/api/messages").then((r) => r.json()).then((d) => setConvs(d.data ?? []));
    }
  }

  function otherName(c: Conversation) {
    return Number(c.buyer_id) === Number(userId)
      ? `${c.seller_fname} ${c.seller_lname}`
      : `${c.buyer_fname} ${c.buyer_lname}`;
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="max-w-5xl mx-auto px-6 py-10 text-center text-gray-500">Loading messages…</div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 py-8">
        <nav className="text-xs text-gray-500 mb-4 flex items-center gap-1">
          <Link href="/" className="hover:underline text-blue-600">Home</Link>
          <span>/</span>
          <span className="text-gray-700">Messages</span>
        </nav>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Messages</h1>

        {convs.length === 0 ? (
          <div className="border border-gray-200 rounded-lg bg-white px-5 py-16 text-center text-gray-500">
            <p className="text-5xl mb-4">💬</p>
            <p className="text-lg font-medium">No conversations yet</p>
            <p className="text-sm mt-1">Message a seller from any listing to start a conversation.</p>
          </div>
        ) : (
          <div className="flex gap-6 h-[600px]">
            {/* Conversation list */}
            <div className="w-80 flex-shrink-0 border border-gray-200 rounded-lg bg-white overflow-y-auto">
              {convs.map((c) => (
                <button
                  key={c.conv_id}
                  onClick={() => setActiveConv(c.conv_id)}
                  className={`w-full text-left p-3 border-b border-gray-100 hover:bg-gray-50 transition ${
                    activeConv === c.conv_id ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold flex-shrink-0">
                      {otherName(c)[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{otherName(c)}</p>
                      {c.listg_title && (
                        <p className="text-xs text-gray-400 truncate">{c.listg_title}</p>
                      )}
                      {c.last_message && (
                        <p className="text-xs text-gray-500 truncate mt-0.5">{c.last_message}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      {c.unread > 0 && (
                        <span className="inline-block bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                          {c.unread}
                        </span>
                      )}
                      {c.last_date && (
                        <p className="text-[10px] text-gray-400 mt-1">
                          {new Date(c.last_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Messages area */}
            <div className="flex-1 border border-gray-200 rounded-lg bg-white flex flex-col">
              {activeConv ? (
                <>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.map((m) => {
                      const isMe = Number(m.sender_id) === Number(userId);
                      return (
                        <div key={m.msg_id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${
                              isMe
                                ? "bg-blue-600 text-white rounded-br-md"
                                : "bg-gray-100 text-gray-800 rounded-bl-md"
                            }`}
                          >
                            <p>{m.msg_content}</p>
                            <p className={`text-[10px] mt-1 ${isMe ? "text-blue-200" : "text-gray-400"}`}>
                              {new Date(m.msg_created).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              {m.msg_read && isMe && " ✓"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={bottomRef} />
                  </div>
                  <div className="border-t border-gray-200 p-3 flex gap-2">
                    <input
                      value={msgText}
                      onChange={(e) => setMsgText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                      placeholder="Type a message…"
                      className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!msgText.trim() || sending}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full text-sm font-medium disabled:opacity-50"
                    >
                      Send
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400">
                  Select a conversation
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
