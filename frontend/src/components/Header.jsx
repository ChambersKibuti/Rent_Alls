import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isAdmin = user?.role === "admin";
  const navLinks = [
    { label: "Home", path: "/" },
    { label: "Products", path: "/products" },
    ...(user ? [{ label: "My Profile", path: "/profile" }] : []),
    { label: "Sell", path: "/seller-register" },
    { label: "Showroom", path: "/showroom" },
    ...(user ? [{ label: "Seller Dashboard", path: "/seller-dashboard" }] : []),
    ...(isAdmin ? [{ label: "Admin", path: "/admin-backend" }] : []),
  ];

  const authButton = user ? (
    <button onClick={() => base44.auth.logout("/")} className="ml-2 px-4 py-2 text-sm text-zinc-600 hover:text-red-400 transition-colors flex items-center gap-1.5">
      <LogOut size={14} /> Logout
    </button>
  ) : (
    <Link to="/login" className="ml-2 px-5 py-2 bg-[#2E5BFF] text-white text-sm font-medium rounded-lg hover:bg-[#2E5BFF]/80 transition-colors">
      Sign In
    </Link>
  );

  const mobileAuthButton = user ? (
    <button onClick={() => { base44.auth.logout("/"); setMenuOpen(false); }} className="px-4 py-3 text-sm text-red-400 hover:bg-zinc-100 rounded-lg text-left flex items-center gap-2">
      <LogOut size={14} /> Logout
    </button>
  ) : (
    <Link to="/login" onClick={() => setMenuOpen(false)} className="px-4 py-3 text-sm text-[#2E5BFF] font-medium hover:bg-zinc-100 rounded-lg">
      Sign In
    </Link>
  );

  return (
    <motion.header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "bg-[#F7F8FA]/90 backdrop-blur-2xl border-b border-zinc-200 py-2" : "bg-transparent py-4"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-zinc-900 font-bold text-lg tracking-tight">
          <img src="/favicon.svg" alt="" width="28" height="28" className="rounded-md" />
          RentAlls
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link key={link.path} to={link.path} className="px-3 py-2 text-sm text-zinc-600 hover:text-zinc-900 transition-colors">
              {link.label}
            </Link>
          ))}
          {authButton}
        </nav>

        <button onClick={() => setMenuOpen((v) => !v)} className="md:hidden text-zinc-900 p-2">
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#F7F8FA]/95 backdrop-blur-xl border-t border-zinc-200 overflow-hidden"
          >
            <div className="px-4 py-4 flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link key={link.path} to={link.path} onClick={() => setMenuOpen(false)} className="px-4 py-3 text-sm text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors">
                  {link.label}
                </Link>
              ))}
              {mobileAuthButton}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
