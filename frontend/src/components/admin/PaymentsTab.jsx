import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, CreditCard, ArrowRight, CheckCircle2 } from "lucide-react";
import moment from "moment";

export default function PaymentsTab() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      const data = await base44.entities.Payment.list("-created_date", 200);
      setPayments(data);
    } catch (e) {}
    setLoading(false);
  };

  const filtered = payments.filter((p) => {
    if (filter === "All") return true;
    if (filter === "Commission") return p.payment_type === "Commission";
    if (filter === "Rent") return p.payment_type === "Rent";
    return p.status === filter;
  });

  const totalCommission = payments
    .filter((p) => p.payment_type === "Commission" && p.status === "Completed")
    .reduce((s, p) => s + (p.commission_amount || p.amount || 0), 0);
  const totalRent = payments
    .filter((p) => p.payment_type === "Rent" && p.status === "Completed")
    .reduce((s, p) => s + (p.rental_amount || p.amount || 0), 0);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[#2E5BFF]" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-[#2E5BFF]/10 rounded-xl flex items-center justify-center">
          <CreditCard size={20} className="text-[#2E5BFF]" />
        </div>
        <div>
          <h2 className="text-zinc-900 font-bold text-lg">Payments</h2>
          <p className="text-zinc-500 text-xs">{payments.length} total transactions</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-[#FF9800]/5 border border-[#FF9800]/20 rounded-xl p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Commission → RentAlls Admin</p>
          <p className="text-[#FF9800] font-black text-2xl">KSH {totalCommission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-zinc-300 text-[10px] mt-1">Directed to RentAlls admin payment method</p>
        </div>
        <div className="bg-[#00E676]/5 border border-[#00E676]/20 rounded-xl p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Rent → Sellers</p>
          <p className="text-[#00E676] font-black text-2xl">KSH {totalRent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-zinc-300 text-[10px] mt-1">Directed to each seller's payment method</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {["All", "Commission", "Rent", "Completed", "Pending"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              filter === f ? "bg-[#2E5BFF] text-white" : "bg-white text-zinc-500 border border-zinc-200 hover:text-zinc-700"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Payment List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <CreditCard size={32} className="text-zinc-300 mx-auto mb-3" />
            <p className="text-zinc-400 text-sm">No payments found.</p>
          </div>
        ) : filtered.map((p) => (
          <div key={p.id} className="bg-white border border-zinc-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                p.payment_type === "Commission" ? "bg-[#FF9800]/10" : "bg-[#00E676]/10"
              }`}>
                <CreditCard size={16} className={p.payment_type === "Commission" ? "text-[#FF9800]" : "text-[#00E676]"} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-zinc-900 font-medium text-sm truncate">{p.product_title}</p>
                <p className="text-zinc-400 text-xs">
                  {p.payment_type === "Commission" ? "Commission payment" : "Rent payment"}
                  {p.reference_number && ` · ${p.reference_number}`}
                </p>
                <p className="text-zinc-300 text-[10px] mt-0.5">{moment(p.created_date).format("DD MMM YYYY, HH:mm")}</p>

                {/* Payment routing */}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-xs text-zinc-600">
                    KSH {(p.payment_type === "Rent" ? p.rental_amount || p.amount : p.commission_amount || p.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <ArrowRight size={12} className="text-zinc-300" />
                  {p.payment_type === "Commission" ? (
                    <span className="text-[10px] text-[#FF9800] bg-[#FF9800]/10 px-2 py-0.5 rounded">
                      RentAlls Admin
                    </span>
                  ) : (
                    <span className="text-[10px] text-[#00E676] bg-[#00E676]/10 px-2 py-0.5 rounded">
                      Seller · {p.seller_payment_method || "N/A"} · {p.seller_account_number || "N/A"}
                    </span>
                  )}
                </div>
              </div>
              <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded shrink-0 ${
                p.status === "Completed" ? "text-[#00E676] bg-[#00E676]/10" : p.status === "Pending" ? "text-yellow-400 bg-yellow-400/10" : "text-red-400 bg-red-400/10"
              }`}>{p.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}