import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function FloatingReactions({ reactions }) {
  const [floating, setFloating] = useState([]);
  const lastCountRef = useState(0);

  useEffect(() => {
    if (reactions.length === 0) return;
    const latest = reactions[reactions.length - 1];
    if (!latest) return;
    const id = `${latest.id || Date.now()}-${Math.random()}`;
    const x = Math.random() * 70 + 15;
    setFloating(prev => [...prev.slice(-8), { id, emoji: latest.content, x }]);
    const timer = setTimeout(() => {
      setFloating(prev => prev.filter(f => f.id !== id));
    }, 3000);
    return () => clearTimeout(timer);
  }, [reactions]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <AnimatePresence>
        {floating.map(f => (
          <motion.div
            key={f.id}
            initial={{ opacity: 1, y: 0, scale: 0.5 }}
            animate={{ opacity: 0, y: -280, scale: 1.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3, ease: "easeOut" }}
            className="absolute text-4xl"
            style={{ left: `${f.x}%`, bottom: 20 }}
          >
            {f.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
