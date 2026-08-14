import React from "react";
import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, MessageCircle } from "lucide-react";
import { CONTACT } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="bg-[#F7F8FA] border-t border-zinc-200 pb-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <img src="/favicon.svg" alt="" width="24" height="24" className="rounded-md" />
              <span className="text-zinc-900 font-bold text-lg">RentAlls</span>
            </div>
            <p className="text-zinc-500 text-sm leading-relaxed max-w-md">
              Your on-demand asset rental marketplace. We provide top-quality tools, equipment, and vehicles for hire.
              Fast booking, secure payments, and real-time support through WhatsApp, call, SMS, or USSD.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-zinc-600 mb-4">Quick Links</h4>
            <div className="flex flex-col gap-2">
              <Link to="/" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">Home</Link>
              <Link to="/products" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">Products</Link>
              <Link to="/profile" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">My Profile</Link>
              <Link to="/register" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">Sign Up</Link>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-zinc-600 mb-4">Contact</h4>
            <div className="flex flex-col gap-3">
              <a href="tel:+254725217874" className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
                <Phone size={14} /> +254 725 217 874
              </a>
              <a href={`https://wa.me/${CONTACT.WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-zinc-500 hover:text-[#25D366] transition-colors">
                <MessageCircle size={14} /> WhatsApp
              </a>
              <a href="mailto:info@rentalls.com" className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
                <Mail size={14} /> info@rentalls.com
              </a>
              <span className="flex items-center gap-2 text-sm text-zinc-500">
                <MapPin size={14} /> Westlands, Nairobi
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-200 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-400">&copy; {new Date().getFullYear()} RentAlls. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/privacy" className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>);

}