import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowRight, Check, CreditCard, Loader2, XCircle } from "lucide-react";
import moment from "moment";
import { useToast } from "@/components/ui/use-toast";

export default function PaymentsTab() {
  const { toast } = useToast();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [reviewingId, setReviewingId] = useState(null);

  useEffect(() => {
    loadPayments();
    const interval = setInterval(loadPayments, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadPayments = async () => {
    try {
      setPayments(await base44.entities.Payment.list("-created_date", 200));
    } catch (error) {
      toast({ title: "Could not load payments", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const reviewPayment = async (payment, approve) => {
    setReviewingId(payment.id);
    try {
      if (approve) await base44.payments.approve(payment.id);
      else await base44.payments.reject(payment.id);
      toast({ title: approve ? "Payment approved" : "Payment rejected" });
      await loadPayments();
    } catch (error) {
      toast({ title: "Could not review payment", description: error.message, variant: "destructive" });
    } finally {
      setReviewingId(null);
    }
  };

  const filtered = payments.filter((payment) => {
    if (filter === "All") return true;
    if (filter === "Subscription") return payment.payment_purpose === "seller_subscription";
    if (filter === "Product Access") return payment.payment_purpose === "product_access";
    if (filter === "Commission" || filter === "Rent") return payment.payment_type === filter;
    return payment.status === filter;
  });

  const totalCommission = payments
    .filter((payment) => payment.payment_type === "Commission" && payment.status === "Completed")
    .reduce((total, payment) => total + (payment.commission_amount || payment.amount || 0), 0);
  const totalRent = payments
    .filter((payment) => payment.payment_type === "Rent" && payment.status === "Completed")
    .reduce((total, payment) => total + (payment.rental_amount || payment.amount || 0), 0);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-[#2E5BFF]" /></div>;

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2E5BFF]/10"><CreditCard size={20} className="text-[#2E5BFF]" /></div>
        <div><h2 className="text-lg font-bold text-zinc-900">Payments</h2><p className="text-xs text-zinc-500">{payments.length} total transactions</p></div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-[#FF9800]/20 bg-[#FF9800]/5 p-4">
          <p className="mb-1 text-xs uppercase tracking-widest text-zinc-500">Commission revenue</p>
          <p className="text-2xl font-black text-[#FF9800]">KSH {totalCommission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="mb-1 text-xs uppercase tracking-widest text-zinc-500">Rent routed to sellers</p>
          <p className="text-2xl font-black text-emerald-700">KSH {totalRent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {["All", "Pending", "Subscription", "Product Access", "Commission", "Rent", "Completed", "Failed"].map((item) => (
          <button key={item} onClick={() => setFilter(item)} className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium ${filter === item ? "bg-[#2E5BFF] text-white" : "border border-zinc-200 bg-white text-zinc-500"}`}>
            {item}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? <div className="py-16 text-center text-sm text-zinc-400">No payments found.</div> : filtered.map((payment) => (
          <article key={payment.id} className="rounded-xl border border-zinc-200 bg-white p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100"><CreditCard size={16} className="text-zinc-600" /></div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-900">{payment.product_title}</p>
                <p className="text-xs text-zinc-500">
                  {payment.payment_purpose === "seller_subscription" ? "Seller subscription" : payment.payment_purpose === "product_access" ? "Buyer product access" : `${payment.payment_type} payment`}
                  {payment.reference_number && ` · ${payment.reference_number}`}
                </p>
                {payment.payer_email && <p className="mt-1 text-xs text-zinc-500">Submitted by {payment.payer_email}</p>}
                <p className="mt-1 text-[10px] text-zinc-400">KSH {Number(payment.amount || 0).toLocaleString()} · {moment(payment.created_date).format("DD MMM YYYY, HH:mm")}</p>
              </div>
              <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold uppercase ${payment.status === "Completed" ? "bg-emerald-50 text-emerald-700" : payment.status === "Pending" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-600"}`}>{payment.status}</span>
            </div>

            {payment.payment_purpose && (
              <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Payment confirmation</p>
                <p className="whitespace-pre-wrap break-words text-xs text-zinc-700">{payment.proof_message || payment.reference_number || "No message provided"}</p>
                {payment.plan_id && <p className="mt-2 text-xs text-zinc-500">Plan: {payment.plan_id.replace("_", " ")}</p>}
                {payment.status === "Pending" && (
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => reviewPayment(payment, true)} disabled={reviewingId === payment.id} className="inline-flex items-center gap-1 rounded-md bg-emerald-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
                      {reviewingId === payment.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Approve
                    </button>
                    <button onClick={() => reviewPayment(payment, false)} disabled={reviewingId === payment.id} className="inline-flex items-center gap-1 rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 disabled:opacity-50">
                      <XCircle size={12} /> Reject
                    </button>
                  </div>
                )}
              </div>
            )}

            {!payment.payment_purpose && <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500"><ArrowRight size={12} /> {payment.payment_method || "Payment"}</div>}
          </article>
        ))}
      </div>
    </div>
  );
}