import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Bell, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function NoticeTicker() {
  const [notices, setNotices] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    base44.entities.Notice.filter({ is_active: true }, "-created_date", 5)
      .then(setNotices)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (notices.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(i => (i + 1) % notices.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [notices.length]);

  if (notices.length === 0 || dismissed) return null;

  const notice = notices[currentIndex];
  const bgColor = notice.priority === "Urgent" ? "bg-red-500/10 border-red-500/30" :
                  notice.priority === "Featured" ? "bg-[#2E5BFF]/10 border-[#2E5BFF]/30" :
                  "bg-[#00E676]/10 border-[#00E676]/30";
  const textColor = notice.priority === "Urgent" ? "text-red-400" :
                    notice.priority === "Featured" ? "text-[#2E5BFF]" :
                    "text-[#00E676]";

  return (
    <div className={`${bgColor} border-y px-4 py-2.5 overflow-hidden`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Bell size={14} className={`${textColor} shrink-0`} />
          <AnimatePresence mode="wait">
            <motion.p
              key={currentIndex}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              className={`text-xs font-medium ${textColor} truncate`}
            >
              <span className="font-bold">{notice.title}</span>
              <span className="text-zinc-600 ml-2">{notice.message}</span>
            </motion.p>
          </AnimatePresence>
        </div>
        <button onClick={() => setDismissed(true)} className="text-zinc-400 hover:text-zinc-600 shrink-0">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}