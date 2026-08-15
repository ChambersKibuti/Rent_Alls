import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PageLayout from "@/components/PageLayout";
import ProductCard from "@/components/ProductCard";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, Phone, MessageCircle, Hash, Shield, Clock, Wrench, Store, MapPin } from "lucide-react";
import { CONTACT, PLAN_FEES } from "@/lib/constants";

const { WHATSAPP_NUMBER, CALL_NUMBER, USSD_CODE } = CONTACT;

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    base44.entities.Product.list("-created_date", 6).
    then(setProducts).
    catch(() => {}).
    finally(() => setLoading(false));
  }, []);

  return (
    <PageLayout>

      {/* Back navigation */}
      <button
        onClick={() => navigate(-1)}
        className="fixed top-20 left-4 z-40 flex items-center gap-1.5 px-3 py-2 bg-white/90 backdrop-blur border border-zinc-300 rounded-lg text-zinc-700 hover:text-zinc-900 hover:bg-zinc-200 transition-all text-sm"
      >
        <ArrowLeft size={16} /> Back
      </button>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-[#F7F8FA] via-[#F7F8FA]/90 to-transparent z-10" />
          <img
            src="/hero-cabin.png"
            alt="Property available for rent at dusk"
            className="w-full h-full object-cover opacity-40" />
          
        </div>

        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}>
              
              <p className="text-[#2E5BFF] text-xs uppercase tracking-[0.3em] font-semibold mb-4">
                Your Instant Rentals Connection
              </p>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-zinc-900 leading-[1.1] mb-6">
                Rentals<br />
                Made.<br />
                <span className="text-[#2E5BFF]">Simple.</span>
              </h1>
              <p className="text-zinc-600 text-base sm:text-lg max-w-md mb-8 leading-relaxed">
                Houses, Professional tools & heavy equipment, Vehicles and Other assets available for hire. Book instantly via WhatsApp, phone call, SMS, or USSD.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/products"
                  className="px-6 py-3.5 bg-[#2E5BFF] hover:bg-[#2E5BFF]/80 text-white font-semibold rounded-xl transition-colors flex items-center gap-2">
                  
                  Browse Assets <ArrowRight size={16} />
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-3.5 bg-zinc-100 border border-zinc-300 hover:bg-zinc-200 text-zinc-900 font-medium rounded-xl transition-colors">
                  
                  Create Account
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-3">
              
              <p className="text-xs text-zinc-500 uppercase tracking-widest mb-4">Instant Contact</p>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-5 bg-white/90 backdrop-blur border border-zinc-200 rounded-xl hover:border-[#25D366]/30 transition-all group">
                
                <div className="w-12 h-12 bg-[#25D366]/10 rounded-xl flex items-center justify-center shrink-0">
                  <MessageCircle size={22} className="text-[#25D366]" />
                </div>
                <div>
                  <p className="text-zinc-900 font-semibold group-hover:text-[#25D366] transition-colors">WhatsApp</p>
                  <p className="text-zinc-500 text-sm">Chat with us instantly</p>
                </div>
                <ArrowRight size={18} className="text-zinc-400 ml-auto group-hover:text-[#25D366] transition-colors" />
              </a>

              <a
                href={`tel:${CALL_NUMBER}`}
                className="flex items-center gap-4 p-5 bg-white/90 backdrop-blur border border-zinc-200 rounded-xl hover:border-[#2E5BFF]/30 transition-all group">
                
                <div className="w-12 h-12 bg-[#2E5BFF]/10 rounded-xl flex items-center justify-center shrink-0">
                  <Phone size={22} className="text-[#2E5BFF]" />
                </div>
                <div>
                  <p className="text-zinc-900 font-semibold group-hover:text-[#2E5BFF] transition-colors">Call Us</p>
                  <p className="text-zinc-500 text-sm">+254 725 217 874</p>
                </div>
                <ArrowRight size={18} className="text-zinc-400 ml-auto group-hover:text-[#2E5BFF] transition-colors" />
              </a>

              <a
                href={`tel:${encodeURIComponent(USSD_CODE)}`}
                className="flex items-center gap-4 p-5 bg-white/90 backdrop-blur border border-zinc-200 rounded-xl hover:border-[#FF9800]/30 transition-all group">
                
                <div className="w-12 h-12 bg-[#FF9800]/10 rounded-xl flex items-center justify-center shrink-0">
                  <Hash size={22} className="text-[#FF9800]" />
                </div>
                <div>
                  <p className="text-zinc-900 font-semibold group-hover:text-[#FF9800] transition-colors">USSD</p>
                  <p className="font-mono text-[#00E676] text-lg font-bold tracking-wider">{USSD_CODE}</p>
                </div>
                <ArrowRight size={18} className="text-zinc-400 ml-auto group-hover:text-[#FF9800] transition-colors" />
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 border-t border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
            { icon: Clock, title: "Instant Booking", desc: "Reserve equipment in seconds through any channel — WhatsApp, call, SMS, or USSD." },
            { icon: Shield, title: "Secure Payments", desc: "Pay with card, mobile money, USSD, or bank transfer. Every transaction is tracked." },
            { icon: Wrench, title: "Quality Assets", desc: "All equipment is professionally maintained, inspected, and ready for heavy-duty use." }].
            map((f, i) =>
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-6 bg-white border border-zinc-200 rounded-2xl">
              
                <div className="w-12 h-12 bg-[#2E5BFF]/10 rounded-xl flex items-center justify-center mb-4">
                  <f.icon size={22} className="text-[#2E5BFF]" />
                </div>
                <h3 className="text-zinc-900 font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Latest Products */}
      <section className="py-24 border-t border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-12">
            <div>
              
              <h2 className="text-3xl sm:text-4xl font-black text-zinc-900">Latest Assets</h2>
            </div>
            <Link to="/products" className="text-[#2E5BFF] text-sm font-medium flex items-center gap-1 hover:underline">
              View All <ArrowRight size={14} />
            </Link>
          </div>

          {loading ?
          <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-[#2E5BFF] border-t-transparent rounded-full animate-spin" />
            </div> :
          products.length === 0 ?
          <div className="text-center py-20">
              <p className="text-zinc-400">No assets available yet. Check back soon.</p>
            </div> :

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) =>
            <ProductCard key={product.id} product={product} />
            )}
            </div>
          }
        </div>
      </section>

      {/* Seller CTA */}
      <section className="py-24 border-t border-zinc-200 bg-gradient-to-b from-transparent to-[#2E5BFF]/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="w-12 h-12 bg-[#00E676]/10 rounded-xl flex items-center justify-center mb-4">
                <Store size={22} className="text-[#00E676]" />
              </div>
              <p className="text-[#00E676] text-xs uppercase tracking-[0.3em] font-semibold mb-2">For Sellers</p>
              <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 mb-4">List Your Assets.<br />Earn Recurring Revenue.</h2>
              <p className="text-zinc-600 text-sm leading-relaxed mb-6 max-w-md">Subscribe as a seller, list your Houses, Professional tools & heavy equipment, Vehicles and Other assets with photos and location. Manage your clients, track payments, and receive serious enquiries

              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/seller-register" className="px-6 py-3.5 bg-[#00E676] hover:bg-[#00E676]/80 text-black font-semibold rounded-xl transition-colors flex items-center gap-2">
                  <Store size={18} /> Become a Seller
                </Link>
                <Link to="/products" className="px-6 py-3.5 bg-zinc-100 border border-zinc-300 hover:bg-zinc-200 text-zinc-900 font-medium rounded-xl transition-colors">
                  Browse Assets
                </Link>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="grid grid-cols-3 gap-3">
              {[
              { plan: "2 Months", price: `KSH ${PLAN_FEES["2_months"]}`, color: "border-[#2E5BFF]/30" },
              { plan: "6 Months", price: `KSH ${PLAN_FEES["6_months"].toLocaleString()}`, color: "border-[#00E676]/30", popular: true },
              { plan: "1 Year", price: `KSH ${PLAN_FEES["1_year"].toLocaleString()}`, color: "border-[#FF9800]/30" }].
              map((p) =>
              <div key={p.plan} className={`p-4 bg-white border ${p.color} rounded-xl text-center`}>
                  {p.popular && <span className="text-[9px] uppercase tracking-widest font-bold text-black bg-[#00E676] px-2 py-0.5 rounded-full mb-2 inline-block">Popular</span>}
                  <p className="text-zinc-500 text-[10px] uppercase tracking-widest mb-1">{p.plan}</p>
                  <p className="text-zinc-900 font-black text-lg">{p.price}</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-zinc-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 mb-4">Ready to Rent?</h2>
          <p className="text-zinc-600 text-lg mb-8 max-w-lg mx-auto">
            Create your free account, browse our catalogue, and book equipment in minutes. Support is just a tap away.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/register"
              className="px-8 py-3.5 bg-[#2E5BFF] hover:bg-[#2E5BFF]/80 text-white font-semibold rounded-xl transition-colors">
              
              Get Started Free
            </Link>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3.5 bg-[#25D366]/10 border border-[#25D366]/20 hover:bg-[#25D366]/20 text-[#25D366] font-medium rounded-xl transition-colors flex items-center gap-2">
              
              <MessageCircle size={16} /> WhatsApp Us
            </a>
          </div>
        </div>
      </section>

    </PageLayout>);

}