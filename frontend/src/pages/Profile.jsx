import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import PageLayout from "@/components/PageLayout";
import { motion, AnimatePresence } from "framer-motion";
import { User, CreditCard, AlertCircle, CheckCircle2, Clock, XCircle, ChevronDown, Send, Loader2, Star } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import moment from "moment";
import RatingStars from "@/components/RatingStars";
import RatingModal from "@/components/RatingModal";

export default function Profile() {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [payments, setPayments] = useState([]);
  const [concerns, setConcerns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPayment, setExpandedPayment] = useState(null);
  const [showConcernForm, setShowConcernForm] = useState(null);
  const [concernSubject, setConcernSubject] = useState("");
  const [concernMessage, setConcernMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState("payments");
  const [sellerRatings, setSellerRatings] = useState({});
  const [showRateModal, setShowRateModal] = useState(null);
  const [buyerRating, setBuyerRating] = useState({ avg: 0, total: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const me = await base44.auth.me();
      setUser(me);
      const [paymentsData, concernsData] = await Promise.all([
        base44.entities.Payment.filter({ created_by_id: me.id }, "-created_date", 100),
        base44.entities.Concern.filter({ created_by_id: me.id }, "-created_date", 50),
      ]);
      setPayments(paymentsData);
      setConcerns(concernsData);

      // Fetch ratings the buyer has given (to know which sellers they already rated)
      try {
        const myRatings = await base44.entities.Rating.filter({ rater_id: me.id }, "-created_date", 200);
        const ratingMap = {};
        myRatings.forEach(r => {
          if (r.payment_id) ratingMap[r.payment_id] = r;
        });
        setSellerRatings(ratingMap);
      } catch (e) {}

      // Fetch ratings the buyer has received (computed on-the-fly since User entity is read-only for others)
      try {
        const received = await base44.entities.Rating.filter({ rated_id: me.id, rated_role: "buyer" }, "-created_date", 200);
        const total = received.length;
        const avg = total > 0 ? received.reduce((s, r) => s + (r.rating || 0), 0) / total : 0;
        setBuyerRating({ avg: Math.round(avg * 10) / 10, total });
      } catch (e) {}
    } catch (e) {}
    setLoading(false);
  };

  const submitConcern = async (payment) => {
    if (!concernSubject.trim() || !concernMessage.trim()) return;
    setSubmitting(true);
    try {
      await base44.entities.Concern.create({
        payment_id: payment.id,
        product_title: payment.product_title,
        subject: concernSubject,
        message: concernMessage,
      });
      toast({ title: "Concern Submitted", description: "We'll respond as soon as possible." });
      setConcernSubject("");
      setConcernMessage("");
      setShowConcernForm(null);
      await loadData();
    } catch (e) {
      toast({ title: "Error", description: "Failed to submit concern.", variant: "destructive" });
    }
    setSubmitting(false);
  };

  const statusIcon = (s) => {
    if (s === "Completed") return <CheckCircle2 size={16} className="text-[#00E676]" />;
    if (s === "Pending") return <Clock size={16} className="text-yellow-400" />;
    if (s === "Failed") return <XCircle size={16} className="text-red-400" />;
    return <CreditCard size={16} className="text-zinc-500" />;
  };

  const concernStatusColor = (s) => {
    if (s === "Resolved" || s === "Closed") return "text-[#00E676] bg-[#00E676]/10";
    if (s === "In Progress") return "text-yellow-400 bg-yellow-400/10";
    return "text-[#2E5BFF] bg-[#2E5BFF]/10";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#2E5BFF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-500 mb-4">Please sign in to view your profile.</p>
          <Link to="/login" className="text-[#2E5BFF] hover:underline text-sm">Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <PageLayout>
      <div className="pt-28 pb-32 max-w-4xl mx-auto px-4 sm:px-6">
        {/* Profile Header */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#2E5BFF]/10 rounded-xl flex items-center justify-center">
              <User size={24} className="text-[#2E5BFF]" />
            </div>
            <div className="flex-1">
              <h1 className="text-zinc-900 font-bold text-xl">{user.full_name || "User"}</h1>
              <p className="text-zinc-500 text-sm">{user.email}</p>
            </div>
            {user.user_type !== "seller" && !user.seller_id && (
              <Link to="/seller-register" className="px-4 py-2 bg-[#2E5BFF]/10 border border-[#2E5BFF]/20 text-[#2E5BFF] text-sm font-medium rounded-lg hover:bg-[#2E5BFF]/20 transition-colors flex items-center gap-2">
                <Star size={14} /> Become a Seller
              </Link>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-zinc-200">
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-widest">Total Payments</p>
              <p className="text-zinc-900 font-bold text-2xl mt-1">{payments.length}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-widest">Total Spent</p>
              <p className="text-[#2E5BFF] font-bold text-2xl mt-1">
                KSH {payments.filter(p => p.status === "Completed").reduce((s, p) => s + (p.amount || 0), 0).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-widest">Open Concerns</p>
              <p className="text-zinc-900 font-bold text-2xl mt-1">{concerns.filter(c => c.status === "Open" || c.status === "In Progress").length}</p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="text-xs text-zinc-400 uppercase tracking-widest">Buyer Rating</p>
              <div className="flex items-center gap-2 mt-1">
                {buyerRating.avg > 0 ? (
                  <>
                    <RatingStars value={buyerRating.avg} readOnly size={16} />
                    <span className="text-[#FFD700] font-bold text-lg">{buyerRating.avg.toFixed(1)}</span>
                    <span className="text-zinc-400 text-xs">({buyerRating.total})</span>
                  </>
                ) : (
                  <p className="text-zinc-400 text-sm">No ratings yet</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white border border-zinc-200 rounded-xl p-1">
          {[{ id: "payments", label: "Payment History", icon: CreditCard }, { id: "concerns", label: "My Concerns", icon: AlertCircle }].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                tab === t.id ? "bg-[#2E5BFF] text-white" : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>

        {/* Payments Timeline */}
        {tab === "payments" && (
          <div className="space-y-3">
            {payments.length === 0 ? (
              <div className="text-center py-16">
                <CreditCard size={32} className="text-zinc-300 mx-auto mb-3" />
                <p className="text-zinc-400 text-sm">No payment history yet.</p>
                <Link to="/products" className="text-[#2E5BFF] text-sm hover:underline mt-2 inline-block">Browse Products</Link>
              </div>
            ) : (
              payments.map((payment, idx) => (
                <motion.div
                  key={payment.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white border border-zinc-200 rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedPayment(expandedPayment === payment.id ? null : payment.id)}
                    className="w-full flex items-center gap-4 p-4 text-left hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {statusIcon(payment.status)}
                      <div className="min-w-0">
                        <p className="text-zinc-900 font-medium text-sm truncate">{payment.product_title}</p>
                        <p className="text-zinc-400 text-xs">{moment(payment.created_date).format("DD MMM YYYY, HH:mm")}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-zinc-900 font-bold">KSH {payment.amount?.toFixed(2)}</p>
                      <p className="text-zinc-400 text-[10px] uppercase tracking-wider">{payment.payment_method}</p>
                    </div>
                    <ChevronDown size={16} className={`text-zinc-400 transition-transform ${expandedPayment === payment.id ? "rotate-180" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {expandedPayment === payment.id && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 space-y-3 border-t border-zinc-200 pt-3">
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-zinc-400 text-xs">Reference</p>
                              <p className="text-zinc-700 font-mono text-xs">{payment.reference_number}</p>
                            </div>
                            <div>
                              <p className="text-zinc-400 text-xs">Duration</p>
                              <p className="text-zinc-700">{payment.rental_days} day{payment.rental_days > 1 ? "s" : ""}</p>
                            </div>
                            <div>
                              <p className="text-zinc-400 text-xs">Status</p>
                              <p className={payment.status === "Completed" ? "text-[#00E676]" : payment.status === "Pending" ? "text-yellow-400" : "text-red-400"}>
                                {payment.status}
                              </p>
                            </div>
                            <div>
                              <p className="text-zinc-400 text-xs">Method</p>
                              <p className="text-zinc-700">{payment.payment_method}</p>
                            </div>
                          </div>

                          {payment.payment_type === "Rent" && payment.status === "Completed" && (
                            <div className="pt-2 border-t border-zinc-200">
                              {sellerRatings[payment.id] ? (
                                <div className="flex items-center gap-2 py-1">
                                  <span className="text-xs text-zinc-500">Your rating:</span>
                                  <RatingStars value={sellerRatings[payment.id].rating} readOnly size={14} />
                                  <span className="text-xs text-zinc-400">{sellerRatings[payment.id].review}</span>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setShowRateModal(payment)}
                                  className="text-[#FFD700] text-xs font-medium hover:underline flex items-center gap-1"
                                >
                                  <Star size={12} /> Rate Seller
                                </button>
                              )}
                            </div>
                          )}

                          {showConcernForm === payment.id ? (
                            <div className="space-y-2 pt-2 border-t border-zinc-200">
                              <input
                                value={concernSubject}
                                onChange={e => setConcernSubject(e.target.value)}
                                placeholder="Subject"
                                className="w-full bg-zinc-100 border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#2E5BFF]/30"
                              />
                              <textarea
                                value={concernMessage}
                                onChange={e => setConcernMessage(e.target.value)}
                                placeholder="Describe your concern..."
                                rows={3}
                                className="w-full bg-zinc-100 border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#2E5BFF]/30 resize-none"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => submitConcern(payment)}
                                  disabled={submitting}
                                  className="px-4 py-2 bg-[#2E5BFF] text-white text-xs font-medium rounded-lg hover:bg-[#2E5BFF]/80 flex items-center gap-1 disabled:opacity-50"
                                >
                                  {submitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                                  Submit
                                </button>
                                <button
                                  onClick={() => { setShowConcernForm(null); setConcernSubject(""); setConcernMessage(""); }}
                                  className="px-4 py-2 text-zinc-500 text-xs hover:text-zinc-700"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setShowConcernForm(payment.id)}
                              className="text-[#2E5BFF] text-xs font-medium hover:underline flex items-center gap-1 pt-1"
                            >
                              <AlertCircle size={12} /> Raise Concern
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* Concerns */}
        {tab === "concerns" && (
          <div className="space-y-3">
            {concerns.length === 0 ? (
              <div className="text-center py-16">
                <AlertCircle size={32} className="text-zinc-300 mx-auto mb-3" />
                <p className="text-zinc-400 text-sm">No concerns raised yet.</p>
              </div>
            ) : (
              concerns.map((concern, idx) => (
                <motion.div
                  key={concern.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white border border-zinc-200 rounded-xl p-4"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="text-zinc-900 font-medium text-sm">{concern.subject}</p>
                      <p className="text-zinc-400 text-xs mt-0.5">
                        {concern.product_title && `Re: ${concern.product_title} · `}
                        {moment(concern.created_date).format("DD MMM YYYY")}
                      </p>
                    </div>
                    <span className={`${concernStatusColor(concern.status)} text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full shrink-0`}>
                      {concern.status}
                    </span>
                  </div>
                  <p className="text-zinc-600 text-sm">{concern.message}</p>
                  {concern.admin_reply && (
                    <div className="mt-3 pt-3 border-t border-zinc-200 bg-[#00E676]/5 rounded-lg p-3">
                      <p className="text-[10px] text-[#00E676] uppercase tracking-widest font-bold mb-1">Admin Reply</p>
                      <p className="text-zinc-700 text-sm">{concern.admin_reply}</p>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>

      {showRateModal && (
        <RatingModal
          raterId={user.id}
          raterName={user.full_name || user.email}
          ratedId={showRateModal.seller_id}
          ratedName={showRateModal.product_title}
          ratedRole="seller"
          productId={showRateModal.product_id}
          productTitle={showRateModal.product_title}
          paymentId={showRateModal.id}
          onClose={() => setShowRateModal(null)}
          onSubmitted={async () => {
            setShowRateModal(null);
            await loadData();
          }}
        />
      )}
    </PageLayout>
  );
}