import React, { useState, useEffect } from "react";
import { Phone, MessageCircle, Hash, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CONTACT } from "@/lib/constants";

const { WHATSAPP_NUMBER, CALL_NUMBER, USSD_CODE, SMS_NUMBER } = CONTACT;

export default function CommandBar() {
  const [pulse, setPulse] = useState(false);
  const [showUssd, setShowUssd] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(true);
      setTimeout(() => setPulse(false), 1500);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <AnimatePresence>
        {showUssd && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-white/95 backdrop-blur-xl border border-[#2E5BFF]/30 rounded-2xl p-6 shadow-2xl"
          >
            <button onClick={() => setShowUssd(false)} className="absolute top-3 right-3 text-zinc-500 hover:text-zinc-900">
              <X size={16} />
            </button>
            <p className="text-zinc-600 text-xs uppercase tracking-widest mb-2">USSD Quick Code</p>
            <a
              href={`tel:${encodeURIComponent(USSD_CODE)}`}
              className="font-mono text-3xl font-bold text-[#00E676] tracking-wider animate-pulse block text-center"
            >
              {USSD_CODE}
            </a>
            <p className="text-zinc-500 text-xs mt-3 text-center">Tap to dial or enter manually</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pointer-events-none">
        <div className="max-w-lg mx-auto pointer-events-auto">
          <div className="bg-white/90 backdrop-blur-2xl border border-zinc-300 rounded-2xl p-3 flex items-center justify-around gap-2 shadow-2xl shadow-black/50">
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all hover:bg-[#25D366]/10 group ${pulse ? "scale-105" : ""}`}
            >
              <div className={`relative ${pulse ? "animate-ping-once" : ""}`}>
                <MessageCircle size={22} className="text-[#25D366] group-hover:scale-110 transition-transform" />
                {pulse && <span className="absolute inset-0 rounded-full bg-[#25D366]/20 animate-ping" />}
              </div>
              <span className="text-[10px] text-zinc-600 font-medium uppercase tracking-wider">WhatsApp</span>
            </a>

            <a
              href={`tel:${CALL_NUMBER.replace(/\s/g, "")}`}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all hover:bg-[#2E5BFF]/10 group ${pulse ? "scale-105" : ""}`}
            >
              <div className="relative">
                <Phone size={22} className="text-[#2E5BFF] group-hover:scale-110 transition-transform" />
                {pulse && <span className="absolute inset-0 rounded-full bg-[#2E5BFF]/20 animate-ping" />}
              </div>
              <span className="text-[10px] text-zinc-600 font-medium uppercase tracking-wider">Call</span>
            </a>

            <a
              href={`sms:${SMS_NUMBER}`}
              className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all hover:bg-[#00E676]/10 group"
            >
              <MessageCircle size={22} className="text-[#00E676] group-hover:scale-110 transition-transform" />
              <span className="text-[10px] text-zinc-600 font-medium uppercase tracking-wider">SMS</span>
            </a>

            <button
              onClick={() => setShowUssd(v => !v)}
              className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all hover:bg-[#FF9800]/10 group"
            >
              <Hash size={22} className="text-[#FF9800] group-hover:scale-110 transition-transform" />
              <span className="text-[10px] text-zinc-600 font-medium uppercase tracking-wider">USSD</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}