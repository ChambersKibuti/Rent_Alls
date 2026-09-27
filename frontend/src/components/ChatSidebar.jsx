import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { X, Send, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ChatSidebar({ productId, isOpen, onClose, prefillMessage }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isOpen || !productId) return;
    loadMessages();
    // Polling-based live updates (see base44Client.js) — reload on every tick.
    const unsubscribe = base44.entities.ChatMessage.subscribe(() => {
      loadMessages();
    });
    return () => unsubscribe();
  }, [isOpen, productId]);

  useEffect(() => {
    if (prefillMessage) setInput(prefillMessage);
  }, [prefillMessage]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const loadMessages = async () => {
    try {
      const msgs = await base44.entities.ChatMessage.filter({ product_id: productId }, "created_date", 50);
      setMessages(msgs);
    } catch (e) {}
  };

  const sendMessage = async () => {
    if (!input.trim() || !user) return;
    setLoading(true);
    try {
      await base44.entities.ChatMessage.create({
        product_id: productId,
        sender_name: user.full_name || user.email,
        message: input.trim(),
        is_admin: user.role === "admin"
      });
      setInput("");
      await loadMessages();
    } catch (e) {}
    setLoading(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 md:hidden"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-white border-l border-zinc-300 z-50 flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-zinc-200">
              <div className="flex items-center gap-2">
                <MessageCircle size={18} className="text-[#2E5BFF]" />
                <h3 className="text-zinc-900 font-semibold text-sm">Chat</h3>
              </div>
              <button onClick={onClose} className="text-zinc-500 hover:text-zinc-900">
                <X size={18} />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <p className="text-zinc-400 text-xs text-center mt-8">No messages yet. Start a conversation.</p>
              )}
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.created_by_id === user?.id ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                    msg.created_by_id === user?.id
                      ? "bg-[#2E5BFF] text-white"
                      : msg.is_admin
                        ? "bg-[#00E676]/10 border border-[#00E676]/20 text-[#00E676]"
                        : "bg-zinc-100 text-zinc-700"
                  }`}>
                    {msg.created_by_id !== user?.id && (
                      <p className="text-[10px] font-medium mb-0.5 opacity-70">
                        {msg.is_admin ? "Admin" : msg.sender_name}
                      </p>
                    )}
                    <p className="text-sm">{msg.message}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-zinc-200">
              {user ? (
                <div className="flex items-center gap-2">
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 bg-zinc-100 border border-zinc-300 rounded-xl px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#2E5BFF]/50"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={loading || !input.trim()}
                    className="bg-[#2E5BFF] hover:bg-[#2E5BFF]/80 text-white p-2.5 rounded-xl disabled:opacity-40 transition-colors"
                  >
                    <Send size={16} />
                  </button>
                </div>
              ) : (
                <p className="text-zinc-500 text-xs text-center">
                  <a href="/login" className="text-[#2E5BFF] underline">Sign in</a> to chat
                </p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}