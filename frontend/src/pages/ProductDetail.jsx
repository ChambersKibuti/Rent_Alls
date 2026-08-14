import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PageLayout from "@/components/PageLayout";
import ChatSidebar from "@/components/ChatSidebar";
import SellerChat from "@/components/SellerChat";
import LocationMap from "@/components/LocationMap";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, MessageCircle, Tag, Clock, Info, Shield, Lock, CheckCircle2, Loader2, ChevronLeft, ChevronRight, MapPin, User, CreditCard, Store, ArrowRight, Star } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import RatingStars from "@/components/RatingStars";
import RatingModal from "@/components/RatingModal";

export default function ProductDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const [product, setProduct] = useState(null);
  const [seller, setSeller] = useState(null);
  const [user, setUser] = useState(null);
  const [platformConfig, setPlatformConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [sellerChatOpen, setSellerChatOpen] = useState(false);
  const [commissionModal, setCommissionModal] = useState(false);
  const [rentModal, setRentModal] = useState(false);
  const [paying, setPaying] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [rentPaid, setRentPaid] = useState(false);
  const [rentalDays, setRentalDays] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [sellerRatings, setSellerRatings] = useState([]);
  const [showRateModal, setShowRateModal] = useState(false);
  const [hasRatedSeller, setHasRatedSeller] = useState(false);
  const [rentPaymentId, setRentPaymentId] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    base44.entities.PlatformConfig.list("-created_date", 1)
      .then((configs) => { if (configs.length) setPlatformConfig(configs[0]); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    base44.entities.Product.get(id)
      .then(async (p) => {
        setProduct(p);
        if (p.seller_id) {
          try {
            const sellers = await base44.entities.Seller.filter({ id: p.seller_id }, "-created_date", 1);
            if (sellers.length) {
              setSeller(sellers[0]);
              const ratings = await base44.entities.Rating.filter({ rated_id: p.seller_id, rated_role: "seller" }, "-created_date", 100);
              setSellerRatings(ratings);
            }
          } catch (e) {}
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const commissionRate = platformConfig?.commission_rate ?? 0.2;
  const commissionAmount = product ? product.price_per_day * commissionRate : 0;
  const rentAmount = product ? product.price_per_day * rentalDays : 0;

  const handlePayCommission = async () => {
    if (!user) {
      toast({ title: "Please sign in", description: "You need an account to continue.", variant: "destructive" });
      return;
    }
    setPaying(true);
    try {
      const ref = "RA-COM-" + Date.now().toString(36).toUpperCase();
      const sellerContact = seller
        ? `${seller.business_name} | Phone: ${seller.phone || "N/A"} | Email: ${seller.email || "N/A"}`
        : "Seller contact pending";

      await base44.entities.Payment.create({
        product_id: product.id,
        product_title: product.title,
        amount: commissionAmount,
        commission_amount: commissionAmount,
        commission_paid: true,
        rent_paid: false,
        seller_revealed: true,
        seller_contact: sellerContact,
        payment_type: "Commission",
        payment_method: platformConfig?.commission_payment_method || "Bank Transfer",
        status: "Completed",
        reference_number: ref,
        seller_id: product.seller_id || "",
        commission_destination: platformConfig
          ? `RentAlls Admin · ${platformConfig.commission_payment_method} · ${platformConfig.commission_account_name || ""} · ${platformConfig.commission_account_number || ""}`
          : "RentAlls Admin",
      });

      await base44.entities.Client.create({
        product_id: product.id,
        product_title: product.title,
        seller_id: product.seller_id || "",
        client_name: user.full_name || user.email,
        client_phone: "",
        client_email: user.email,
        status: "Active",
      });

      setRevealed(true);
      toast({ title: "Commission Paid!", description: "Seller contact revealed. You can now chat with the seller." });
    } catch (e) {
      toast({ title: "Payment Failed", description: "Please try again.", variant: "destructive" });
    }
    setPaying(false);
  };

  const handlePayRent = async () => {
    if (!user || !seller) return;
    setPaying(true);
    try {
      const ref = "RA-RENT-" + Date.now().toString(36).toUpperCase();
      const rentPayment = await base44.entities.Payment.create({
        product_id: product.id,
        product_title: product.title,
        amount: rentAmount,
        rental_amount: rentAmount,
        rental_days: rentalDays,
        commission_paid: true,
        rent_paid: true,
        seller_revealed: true,
        payment_type: "Rent",
        payment_method: seller.payment_method || "Bank Transfer",
        status: "Completed",
        reference_number: ref,
        seller_id: seller.id,
        seller_payment_method: seller.payment_method,
        seller_account_number: seller.account_number,
        client_id: user.id,
      });
      setRentPaymentId(rentPayment ? rentPayment.id : null);

      const newQty = Math.max(0, (product.quantity_available || 1) - 1);
      await base44.entities.Product.update(product.id, {
        quantity_available: newQty,
        status: newQty === 0 ? "Leased" : product.status,
      });

      setRentPaid(true);
      setProduct({ ...product, quantity_available: newQty });
      toast({ title: "Rent Paid!", description: `KSH ${rentAmount.toFixed(2)} directed to ${seller.business_name}.` });
    } catch (e) {
      toast({ title: "Payment Failed", description: "Please try again.", variant: "destructive" });
    }
    setPaying(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#2E5BFF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-500 mb-4">Product not found.</p>
          <Link to="/products" className="text-[#2E5BFF] text-sm hover:underline">Back to Products</Link>
        </div>
      </div>
    );
  }

  const images = product.images?.length ? product.images : product.image_url ? [product.image_url] : [];
  const statusColor = product.status === "Available" ? "text-[#00E676] bg-[#00E676]/10 border-[#00E676]/20" : product.status === "Leased" ? "text-red-400 bg-red-400/10 border-red-400/20" : "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";

  return (
    <PageLayout>
      <div className="pt-24 pb-32 max-w-7xl mx-auto px-4 sm:px-6">
        <Link to="/products" className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-900 text-sm mb-8 transition-colors">
          <ArrowLeft size={16} /> Back to Assets
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Image Gallery */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="aspect-square bg-white rounded-2xl overflow-hidden border border-zinc-200 relative">
              {images.length > 0 ? (
                <img src={images[activeImage]} alt={product.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><Tag size={64} className="text-zinc-300" /></div>
              )}
              {images.length > 1 && (
                <>
                  <button onClick={() => setActiveImage((i) => (i - 1 + images.length) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors">
                    <ChevronLeft size={20} />
                  </button>
                  <button onClick={() => setActiveImage((i) => (i + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors">
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button key={idx} onClick={() => setActiveImage(idx)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition-colors ${activeImage === idx ? "border-[#2E5BFF]" : "border-zinc-200 hover:border-white/20"}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Details */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <span className="text-xs text-zinc-500 uppercase tracking-widest">{product.category}</span>
              <span className={`${statusColor} text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full border`}>{product.status}</span>
              {product.quantity_available != null && (
                <span className="text-[10px] text-[#00E676] bg-[#00E676]/10 px-2 py-1 rounded font-bold uppercase tracking-widest">{product.quantity_available} in stock</span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 mb-4">{product.title}</h1>

            {product.description && <p className="text-zinc-600 leading-relaxed mb-6">{product.description}</p>}

            {product.location_name && (
              <div className="flex items-center gap-2 text-sm text-zinc-600 mb-4">
                <MapPin size={16} className="text-[#2E5BFF]" />
                {product.location_name}
              </div>
            )}

            {/* Price Breakdown */}
            <div className="bg-white border border-zinc-200 rounded-xl p-5 mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-zinc-500 text-sm flex items-center gap-2"><Clock size={14} /> Daily Rate</span>
                <span className="text-[#2E5BFF] font-black text-2xl">KSH {product.price_per_day}</span>
              </div>
              {product.deposit_amount > 0 && (
                <div className="flex items-center justify-between pt-3 border-t border-zinc-200">
                  <span className="text-zinc-500 text-sm flex items-center gap-2"><Shield size={14} /> Deposit</span>
                  <span className="text-zinc-900 font-bold">KSH {product.deposit_amount}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-3 border-t border-zinc-200">
                <span className="text-zinc-500 text-sm flex items-center gap-2"><Lock size={14} /> Commission ({(commissionRate * 100).toFixed(0)}%) → RentAlls Admin</span>
                <span className="text-[#FF9800] font-bold">KSH {commissionAmount.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-zinc-200">
                <span className="text-zinc-500 text-sm flex items-center gap-2"><Store size={14} /> Rent → Seller</span>
                <span className="text-[#00E676] font-bold">KSH {product.price_per_day}/day</span>
              </div>
            </div>

            {product.specifications && (
              <div className="bg-white border border-zinc-200 rounded-xl p-5 mb-6">
                <h3 className="text-xs text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Info size={14} /> Specifications</h3>
                <p className="text-zinc-700 text-sm leading-relaxed whitespace-pre-wrap">{product.specifications}</p>
              </div>
            )}

            {product.latitude && product.longitude && (
              <div className="mb-6">
                <h3 className="text-xs text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2"><MapPin size={14} /> Location</h3>
                <LocationMap latitude={product.latitude} longitude={product.longitude} height="220px" onPick={() => {}} />
              </div>
            )}

            {/* Payment Routing Info */}
            <div className="bg-white border border-zinc-200 rounded-xl p-5 mb-6">
              <h3 className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Payment Flow</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#FF9800]/10 rounded-lg flex items-center justify-center shrink-0">
                    <Lock size={14} className="text-[#FF9800]" />
                  </div>
                  <div className="flex-1 text-xs">
                    <p className="text-zinc-900 font-medium">Step 1: Commission</p>
                    <p className="text-zinc-500">KSH {commissionAmount.toFixed(2)} → RentAlls Admin ({platformConfig?.commission_payment_method || "Bank Transfer"})</p>
                  </div>
                  {revealed && <CheckCircle2 size={16} className="text-[#00E676]" />}
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#00E676]/10 rounded-lg flex items-center justify-center shrink-0">
                    <Store size={14} className="text-[#00E676]" />
                  </div>
                  <div className="flex-1 text-xs">
                    <p className="text-zinc-900 font-medium">Step 2: Rent Payment</p>
                    <p className="text-zinc-500">KSH {product.price_per_day}/day → Seller ({seller?.payment_method || "N/A"})</p>
                  </div>
                  {rentPaid && <CheckCircle2 size={16} className="text-[#00E676]" />}
                </div>
              </div>
            </div>

            {/* Seller Info (revealed after commission) */}
            {revealed && seller ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-[#00E676]/5 border border-[#00E676]/20 rounded-xl p-5 mb-6">
                <h3 className="text-xs text-[#00E676] uppercase tracking-widest font-bold mb-3 flex items-center gap-2">
                  <CheckCircle2 size={14} /> Seller Revealed
                </h3>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-[#00E676]/10 rounded-full flex items-center justify-center">
                    <User size={18} className="text-[#00E676]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-zinc-900 font-medium">{seller.business_name}</p>
                      {seller.average_rating > 0 && (
                        <div className="flex items-center gap-1">
                          <RatingStars value={seller.average_rating} readOnly size={12} />
                          <span className="text-[#FFD700] text-xs font-bold">{seller.average_rating.toFixed(1)}</span>
                          <span className="text-zinc-400 text-[10px]">({seller.total_ratings || sellerRatings.length})</span>
                        </div>
                      )}
                      {seller.fee_waiver && (
                        <span className="text-[9px] uppercase tracking-widest font-bold text-black bg-[#FFD700] px-2 py-0.5 rounded-full">Fee Waiver</span>
                      )}
                    </div>
                    {seller.phone && <p className="text-zinc-600 text-sm">{seller.phone}</p>}
                    {seller.email && <p className="text-zinc-500 text-xs">{seller.email}</p>}
                  </div>
                </div>
                {seller.description && <p className="text-zinc-500 text-xs mb-3">{seller.description}</p>}
                <div className="bg-zinc-100 rounded-lg p-3 space-y-1">
                  <p className="text-[10px] text-zinc-400 uppercase tracking-widest">Seller Payment Details (for rent)</p>
                  <p className="text-xs text-zinc-600">Method: <span className="text-zinc-900">{seller.payment_method || "N/A"}</span></p>
                  <p className="text-xs text-zinc-600">Account: <span className="text-zinc-900">{seller.account_number || "N/A"}</span></p>
                </div>
              </motion.div>
            ) : (
              <div className="bg-[#FF9800]/5 border border-[#FF9800]/20 rounded-xl p-5 mb-6">
                <div className="flex items-start gap-3">
                  <Lock size={18} className="text-[#FF9800] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-zinc-900 font-medium text-sm mb-1">Seller contact locked</p>
                    <p className="text-zinc-500 text-xs leading-relaxed">
                      Pay a {(commissionRate * 100).toFixed(0)}% commission (KSH {commissionAmount.toFixed(2)}) to RentAlls Admin to reveal the seller's contact details and start chatting.
                      The rent payment goes directly to the seller's own account.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3">
              {!revealed ? (
                <button
                  onClick={() => {
                    if (!user) { toast({ title: "Please sign in", variant: "destructive" }); return; }
                    setCommissionModal(true);
                  }}
                  disabled={product.status !== "Available" || (product.quantity_available ?? 1) <= 0}
                  className="w-full py-3.5 bg-[#2E5BFF] hover:bg-[#2E5BFF]/80 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-40">
                  <Lock size={18} />
                  Pay {(commissionRate * 100).toFixed(0)}% Commission (KSH {commissionAmount.toFixed(2)})
                </button>
              ) : (
                <>
                  {!rentPaid && (
                    <button
                      onClick={() => setRentModal(true)}
                      disabled={product.status !== "Available" || (product.quantity_available ?? 1) <= 0}
                      className="w-full py-3.5 bg-[#00E676] hover:bg-[#00E676]/80 text-black font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-40">
                      <CreditCard size={18} />
                      Pay Rent to Seller (KSH {product.price_per_day}/day)
                    </button>
                  )}
                  {rentPaid && (
                    <>
                      <div className="w-full py-3.5 bg-[#00E676]/10 border border-[#00E676]/20 text-[#00E676] font-semibold rounded-xl flex items-center justify-center gap-2">
                        <CheckCircle2 size={18} /> Rent Paid — Booking Complete
                      </div>
                      {!hasRatedSeller ? (
                        <button
                          onClick={() => setShowRateModal(true)}
                          className="w-full py-3.5 bg-[#FFD700] hover:bg-[#FFD700]/80 text-black font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                          <Star size={18} /> Rate Seller
                        </button>
                      ) : (
                        <div className="w-full py-3.5 bg-[#FFD700]/10 border border-[#FFD700]/20 text-[#FFD700] font-medium rounded-xl flex items-center justify-center gap-2">
                          <Star size={18} /> Rating Submitted
                        </div>
                      )}
                    </>
                  )}
                  <button
                    onClick={() => setSellerChatOpen(true)}
                    className="w-full py-3.5 bg-[#2E5BFF]/10 border border-[#2E5BFF]/20 hover:bg-[#2E5BFF]/20 text-[#2E5BFF] font-medium rounded-xl transition-colors flex items-center justify-center gap-2">
                    <MessageCircle size={18} /> Chat with Seller
                  </button>
                </>
              )}
              <button onClick={() => setChatOpen(true)}
                className="w-full py-3.5 bg-zinc-100 border border-zinc-300 hover:bg-zinc-200 text-zinc-900 font-medium rounded-xl transition-colors flex items-center justify-center gap-2">
                <MessageCircle size={18} /> Ask Admin About This
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Commission Payment Modal */}
      <AnimatePresence>
        {commissionModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => !paying && setCommissionModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white border border-zinc-300 rounded-2xl w-full max-w-md overflow-hidden">
              <div className="p-5 border-b border-zinc-200">
                <h3 className="text-zinc-900 font-bold">Commission Payment</h3>
                <p className="text-zinc-500 text-xs mt-1">Paid to RentAlls Admin to unlock seller contact</p>
              </div>
              <div className="p-5">
                <div className="bg-zinc-100 rounded-xl p-4 mb-4 space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-zinc-500">Product</span><span className="text-zinc-900">{product.title}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-zinc-500">Daily Rate</span><span className="text-zinc-900">KSH {product.price_per_day}</span></div>
                  <div className="flex justify-between text-sm pt-2 border-t border-zinc-200"><span className="text-zinc-500">Commission ({(commissionRate * 100).toFixed(0)}%)</span><span className="text-[#FF9800] font-bold">KSH {commissionAmount.toFixed(2)}</span></div>
                </div>
                <div className="bg-[#FF9800]/5 border border-[#FF9800]/20 rounded-lg p-3 mb-4 space-y-1">
                  <p className="text-[#FF9800] text-xs flex items-center gap-1"><ArrowRight size={12} /> Directed to: RentAlls Admin</p>
                  <p className="text-[#FF9800] text-xs">Method: {platformConfig?.commission_payment_method || "Bank Transfer"}</p>
                  {platformConfig?.commission_account_name && <p className="text-[#FF9800] text-xs">Account: {platformConfig.commission_account_name}</p>}
                  {platformConfig?.commission_account_number && <p className="text-[#FF9800] text-xs">No: {platformConfig.commission_account_number}</p>}
                </div>
                <div className="bg-[#00E676]/5 border border-[#00E676]/20 rounded-lg p-3 mb-4">
                  <p className="text-[#00E676] text-xs">✓ Seller contact will be revealed instantly</p>
                  <p className="text-[#00E676] text-xs">✓ You'll be able to chat directly with the seller</p>
                  <p className="text-[#00E676] text-xs">✓ Registered as a client</p>
                </div>
                <button onClick={handlePayCommission} disabled={paying}
                  className="w-full py-3.5 bg-[#2E5BFF] text-white font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
                  {paying ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
                  {paying ? "Processing..." : `Pay KSH ${commissionAmount.toFixed(2)}`}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rent Payment Modal */}
      <AnimatePresence>
        {rentModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => !paying && setRentModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white border border-zinc-300 rounded-2xl w-full max-w-md overflow-hidden">
              <div className="p-5 border-b border-zinc-200">
                <h3 className="text-zinc-900 font-bold">Rent Payment</h3>
                <p className="text-zinc-500 text-xs mt-1">Paid directly to the seller's account</p>
              </div>
              <div className="p-5">
                <div className="bg-zinc-100 rounded-xl p-4 mb-4 space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-zinc-500">Product</span><span className="text-zinc-900">{product.title}</span></div>
                  <div className="flex justify-between items-center text-sm"><span className="text-zinc-500">Rental Days</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setRentalDays((d) => Math.max(1, d - 1))} className="w-7 h-7 bg-zinc-200 rounded-lg text-zinc-900">−</button>
                      <span className="text-zinc-900 font-bold w-8 text-center">{rentalDays}</span>
                      <button onClick={() => setRentalDays((d) => d + 1)} className="w-7 h-7 bg-zinc-200 rounded-lg text-zinc-900">+</button>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-zinc-200"><span className="text-zinc-500">Rate × {rentalDays} day{rentalDays !== 1 ? "s" : ""}</span><span className="text-zinc-900">KSH {(product.price_per_day * rentalDays).toFixed(2)}</span></div>
                  <div className="flex justify-between text-sm pt-2 border-t border-zinc-200"><span className="text-zinc-500">Total Rent</span><span className="text-[#00E676] font-bold text-lg">KSH {rentAmount.toFixed(2)}</span></div>
                </div>
                <div className="bg-[#00E676]/5 border border-[#00E676]/20 rounded-lg p-3 mb-4 space-y-1">
                  <p className="text-[#00E676] text-xs flex items-center gap-1"><ArrowRight size={12} /> Directed to: {seller?.business_name}</p>
                  <p className="text-[#00E676] text-xs">Method: {seller?.payment_method || "N/A"}</p>
                  <p className="text-[#00E676] text-xs">Account: {seller?.account_number || "N/A"}</p>
                </div>
                <button onClick={handlePayRent} disabled={paying}
                  className="w-full py-3.5 bg-[#00E676] text-black font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
                  {paying ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
                  {paying ? "Processing..." : `Pay KSH ${rentAmount.toFixed(2)}`}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showRateModal && seller && (
        <RatingModal
          raterId={user.id}
          raterName={user.full_name || user.email}
          ratedId={seller.id}
          ratedName={seller.business_name}
          ratedRole="seller"
          productId={product.id}
          productTitle={product.title}
          paymentId={rentPaymentId}
          onClose={() => setShowRateModal(false)}
          onSubmitted={() => { setShowRateModal(false); setHasRatedSeller(true); setSeller({ ...seller, average_rating: 5, total_ratings: (seller.total_ratings || 0) + 1 }); }}
        />
      )}
      <ChatSidebar productId={id} isOpen={chatOpen} onClose={() => setChatOpen(false)} />
      {seller && (
        <SellerChat
          productId={id}
          sellerId={seller.id}
          sellerName={seller.business_name}
          isOpen={sellerChatOpen}
          onClose={() => setSellerChatOpen(false)}
        />
      )}
    </PageLayout>
  );
}