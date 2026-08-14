import React from "react";
import { motion } from "framer-motion";

const REACTIONS = [
  { emoji: "👍", label: "Like" },
  { emoji: "❤️", label: "Love" },
  { emoji: "🔥", label: "Fire" },
  { emoji: "😮", label: "Wow" },
  { emoji: "👏", label: "Clap" },
  { emoji: "😂", label: "Haha" },
];

export default function ReactionBar({ onReact, disabled }) {
  return (
    <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-2xl p-2">
      {REACTIONS.map((r) => (
        <motion.button
          key={r.emoji}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onReact(r.emoji)}
          disabled={disabled}
          title={r.label}
          className="flex-1 flex items-center justify-center py-2 rounded-xl hover:bg-zinc-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-2xl"
        >
          {r.emoji}
        </motion.button>
      ))}
    </div>
  );
}
