import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { X, Send, MessageCircle, Store } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SellerChat({ productId, sellerId, sellerName, isOpen, onClose }) {
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
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const loadMessages = async () => {
    try {
      const msgs = await base44.entities.ChatMessage.filter(
        { product_id: productId, conversation_type: "Seller" },
        "created_date",
        50
      );
      setMessages(msgs);
    } catch (e) {}
  };

  const sendMessage = async () => {
    if (!input.trim() || !user) return;
    setLoading(true);
    try {
      await base44.entities.ChatMessage.create({
        product_id: productId,
        seller_id: sellerId,
        buyer_id: user.id,
        sender_name: user.full_name || user.email,
        message: input.trim(),
        is_admin: false,
        conversation_type: "Seller",
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
            className="fixed inset-0 bg-black/50 z-50"
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
                <div className="w-8 h-8 bg-[#00E676]/10 rounded-full flex items-center justify-center">
                  <Store size={14} className="text-[#00E676]" />
                </div>
                <div>
                  <h3 className="text-zinc-900 font-semibold text-sm">{sellerName || "Seller"}</h3>
                  <p className="text-zinc-400 text-[10px]">Direct chat with seller</p>
                </div>
              </div>
              <button onClick={onClose} className="text-zinc-500 hover:text-zinc-900">
                <X size={18} />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <p className="text-zinc-400 text-xs text-center mt-8">
                  Start chatting with the seller about this product.
                </p>
              )}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.created_by_id === user?.id ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                      msg.created_by_id === user?.id
                        ? "bg-[#2E5BFF] text-white"
                        : "bg-[#00E676]/10 border border-[#00E676]/20 text-zinc-700"
                    }`}
                  >
                    {msg.created_by_id !== user?.id && (
                      <p className="text-[10px] font-medium mb-0.5 opacity-70">
                        {msg.sender_name}
                      </p>
                    )}
                    <p className="text-sm">{msg.message}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-zinc-200">
              <div className="flex items-center gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 bg-zinc-100 border border-zinc-300 rounded-xl px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#00E676]/50"
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  className="bg-[#00E676] hover:bg-[#00E676]/80 text-black p-2.5 rounded-xl disabled:opacity-40 transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}