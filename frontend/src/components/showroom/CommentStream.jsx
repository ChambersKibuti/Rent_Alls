import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageCircle, Loader2 } from "lucide-react";

export default function CommentStream({ comments, onSend, disabled, currentUserId }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments]);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    await onSend(text.trim());
    setText("");
    setSending(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-200">
        <MessageCircle size={16} className="text-[#2E5BFF]" />
        <h3 className="text-zinc-900 font-semibold text-sm">Live Chat</h3>
        <span className="ml-auto text-xs text-zinc-400">{comments.length}</span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2 min-h-[200px] max-h-[400px]">
        <AnimatePresence initial={false}>
          {comments.length === 0 ? (
            <p className="text-zinc-300 text-xs text-center py-8">No messages yet. Be the first to comment!</p>
          ) : (
            comments.map((c) => {
              const isMe = c.sender_id === currentUserId;
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                >
                  <span className="text-xs text-zinc-400 mb-0.5 px-1">{c.sender_name || "User"}</span>
                  <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                    isMe ? "bg-[#2E5BFF] text-white rounded-br-sm" : "bg-zinc-100 text-zinc-800 rounded-bl-sm"
                  }`}>
                    {c.content}
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      <div className="p-3 border-t border-zinc-200">
        <div className="flex items-center gap-2 bg-zinc-100 border border-zinc-300 rounded-xl px-3 py-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={disabled ? "Sign in to chat" : "Type a message..."}
            disabled={disabled || sending}
            className="flex-1 bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending || disabled}
            className="text-[#2E5BFF] hover:text-[#2E5BFF]/70 disabled:opacity-30 transition-colors"
          >
            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
