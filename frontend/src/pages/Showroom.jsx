import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PageLayout from "@/components/PageLayout";
import { motion, AnimatePresence } from "framer-motion";
import { Video, Plus, X, Loader2, Radio, Users, ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function Showroom() {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", product_title: "", category: "" });
  const [creating, setCreating] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");

  const CATEGORIES = ["All", "Houses",
"Tools & Equipment",
"Vehicles",
"Air BnB",
"Other"];

  const filteredRooms = activeCategory === "All" ? rooms : rooms.filter(r => r.category === activeCategory);

  useEffect(() => {
    loadData();
    const unsub = base44.entities.Showroom.subscribe(() => loadData());
    return unsub;
  }, []);

  const loadData = async () => {
    try {
      const me = await base44.auth.me().catch(() => null);
      setUser(me);
      const data = await base44.entities.Showroom.filter({ status: "live" }, "-created_date", 50);
      setRooms(data);
    } catch (e) {}
    setLoading(false);
  };

  const createRoom = async () => {
    if (!form.title.trim()) {
      toast({ title: "Please enter a title", variant: "destructive" });
      return;
    }
    if (!user) {
      toast({ title: "Please sign in to start a showroom", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      const room = await base44.entities.Showroom.create({
        title: form.title.trim(),
        description: form.description.trim(),
        host_id: user.id,
        host_name: user.full_name || "User",
        product_title: form.product_title.trim() || undefined,
        category: form.category || undefined,
        status: "live",
      });
      window.location.href = `/showroom/${room.id}`;
    } catch (e) {
      toast({ title: "Failed to create showroom", variant: "destructive" });
    }
    setCreating(false);
  };

  return (
    <PageLayout showNotice={false}>
      <div className="pt-28 pb-32 max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Radio size={20} className="text-red-500" />
              <h1 className="text-zinc-900 font-bold text-2xl">Live Showrooms</h1>
            </div>
            <p className="text-zinc-500 text-sm">Join live product showcases or start your own</p>
          </div>
          {user && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#2E5BFF] hover:bg-[#2E5BFF]/80 text-white text-sm font-medium rounded-xl transition-colors"
            >
              <Plus size={18} /> Start Showroom
            </button>
          )}
        </div>

        {/* Rooms grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={32} className="text-[#2E5BFF] animate-spin" />
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-4">
              <Video size={32} className="text-zinc-300" />
            </div>
            <p className="text-zinc-500 mb-2">No live showrooms right now</p>
            <p className="text-zinc-300 text-sm">Be the first to start one!</p>
          </div>
        ) : (
          <>
          {/* Category filters */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-1 px-1">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  activeCategory === cat
                    ? "bg-[#2E5BFF] text-white"
                    : "bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {filteredRooms.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-zinc-500 mb-1">No live showrooms in {activeCategory}</p>
              <p className="text-zinc-300 text-sm">Try another category or start one!</p>
            </div>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRooms.map(room => (
              <Link
                key={room.id}
                to={`/showroom/${room.id}`}
                className="group bg-white border border-zinc-200 rounded-2xl overflow-hidden hover:border-[#2E5BFF]/30 transition-colors"
              >
                <div className="relative aspect-video bg-gradient-to-br from-[#F7F8FA] to-[#EEF0F3] flex items-center justify-center">
                  <Radio size={32} className="text-[#2E5BFF] group-hover:scale-110 transition-transform" />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-500/90 px-2 py-1 rounded-md">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    <span className="text-zinc-900 text-xs font-bold uppercase">Live</span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-zinc-900 font-semibold text-sm mb-1 line-clamp-1">{room.title}</h3>
                  {room.product_title && (
                    <p className="text-[#2E5BFF] text-xs mb-2 line-clamp-1">{room.product_title}</p>
                  )}
                  {room.description && (
                    <p className="text-zinc-400 text-xs line-clamp-2 mb-3">{room.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-zinc-500 text-xs">
                    <div className="w-5 h-5 rounded-full bg-[#2E5BFF]/20 flex items-center justify-center">
                      <Users size={10} className="text-[#2E5BFF]" />
                    </div>
                    <span className="flex-1">{room.host_name || "Host"}</span>
                    {room.category && (
                      <span className="bg-[#2E5BFF]/10 text-[#2E5BFF] px-2 py-0.5 rounded-full">{room.category}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
          )}
          </>
        )}

        {!user && !loading && (
          <div className="text-center mt-8">
            <Link to="/login" className="text-[#2E5BFF] text-sm hover:underline">Sign in to start your own showroom</Link>
          </div>
        )}
      </div>

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !creating && setShowCreate(false)}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white border border-zinc-300 rounded-2xl w-full max-w-md overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-zinc-200">
                <h3 className="text-zinc-900 font-bold">Start a Showroom</h3>
                <button onClick={() => setShowCreate(false)} className="text-zinc-500 hover:text-zinc-900">
                  <X size={18} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1 block">Title *</label>
                  <input
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Live Demo: Power Tools"
                    className="w-full bg-zinc-100 border border-zinc-300 rounded-lg px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#2E5BFF]/30"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1 block">Product (optional)</label>
                  <input
                    value={form.product_title}
                    onChange={e => setForm(f => ({ ...f, product_title: e.target.value }))}
                    placeholder="What are you showcasing?"
                    className="w-full bg-zinc-100 border border-zinc-300 rounded-lg px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#2E5BFF]/30"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1 block">Category</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full bg-zinc-100 border border-zinc-300 rounded-lg px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-[#2E5BFF]/30"
                  >
                    <option value="">Select category...</option>
                    {CATEGORIES.filter(c => c !== "All").map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1 block">Description</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Tell viewers what to expect..."
                    rows={3}
                    className="w-full bg-zinc-100 border border-zinc-300 rounded-lg px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#2E5BFF]/30 resize-none"
                  />
                </div>
                <button
                  onClick={createRoom}
                  disabled={creating}
                  className="w-full py-3 bg-[#2E5BFF] hover:bg-[#2E5BFF]/80 text-white font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {creating ? <Loader2 size={18} className="animate-spin" /> : <Radio size={18} />}
                  {creating ? "Starting..." : "Go Live"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </PageLayout>
  );
}
