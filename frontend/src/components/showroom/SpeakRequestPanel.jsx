import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Hand, Check, X, Mic } from "lucide-react";

export default function SpeakRequestPanel({ requests, onApprove, onReject }) {
  const pending = requests.filter(r => r.status === "pending");

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-200">
        <Hand size={16} className="text-[#FF9800]" />
        <h3 className="text-zinc-900 font-semibold text-sm">Speak Requests</h3>
        {pending.length > 0 && (
          <span className="ml-auto bg-[#FF9800]/20 text-[#FF9800] text-xs font-bold px-2 py-0.5 rounded-full">
            {pending.length}
          </span>
        )}
      </div>

      <div className="p-3 space-y-2 max-h-[250px] overflow-y-auto">
        {pending.length === 0 ? (
          <p className="text-zinc-300 text-xs text-center py-4">No pending requests</p>
        ) : (
          <AnimatePresence>
            {pending.map(r => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-3 bg-zinc-100 rounded-xl p-3"
              >
                <div className="w-8 h-8 rounded-full bg-[#FF9800]/10 flex items-center justify-center shrink-0">
                  <Mic size={14} className="text-[#FF9800]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-zinc-900 text-sm font-medium truncate">{r.sender_name || "User"}</p>
                  {r.content && <p className="text-zinc-400 text-xs truncate">{r.content}</p>}
                </div>
                <button
                  onClick={() => onApprove(r)}
                  className="w-8 h-8 rounded-lg bg-[#00E676]/10 hover:bg-[#00E676]/20 flex items-center justify-center transition-colors"
                  title="Approve"
                >
                  <Check size={14} className="text-[#00E676]" />
                </button>
                <button
                  onClick={() => onReject(r)}
                  className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center transition-colors"
                  title="Reject"
                >
                  <X size={14} className="text-red-400" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
