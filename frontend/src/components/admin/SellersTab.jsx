import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Store, MapPin, RefreshCw, CheckCircle2, AlertTriangle, TrendingUp, Gift } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import moment from "moment";
import {
  PLAN_FEES, REBATE_MULTIPLIER, isSubscriptionExpired,
  computeTotalSales, checkRebateEligibility,
} from "@/lib/subscriptionUtils";

export default function SellersTab({ payments }) {
  const { toast } = useToast();
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadSellers();
  }, []);

  const loadSellers = async () => {
    try {
      const data = await base44.entities.Seller.list("-created_date", 200);
      setSellers(data);
    } catch (e) {}
    setLoading(false);
  };

  const processExpiries = async () => {
    setProcessing(true);
    let expiredCount = 0;
    let rebateCount = 0;
    try {
      for (const seller of sellers) {
        if (isSubscriptionExpired(seller) && seller.status !== "Expired") {
          const totalSales = computeTotalSales(seller.id, payments);
          const rebate = checkRebateEligibility(seller, totalSales);
          await base44.entities.Seller.update(seller.id, {
            status: "Expired",
            total_sales: totalSales,
            rebate_status: rebate.status,
            rebate_amount: rebate.rebate_amount,
          });
          expiredCount++;
          if (rebate.eligible) rebateCount++;
        }
      }
      await loadSellers();
      toast({
        title: "Subscription check complete",
        description: `${expiredCount} subscription(s) expired. ${rebateCount} eligible for rebate.`,
      });
    } catch (e) {
      toast({ title: "Processing failed", variant: "destructive" });
    }
    setProcessing(false);
  };

  const processRebate = async (seller) => {
    try {
      await base44.entities.Seller.update(seller.id, { rebate_status: "Paid" });
      await loadSellers();
      toast({ title: "Rebate processed", description: `KSH ${seller.rebate_amount} rebated to ${seller.business_name}.` });
    } catch (e) {
      toast({ title: "Rebate failed", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[#2E5BFF]" />
      </div>
    );
  }

  const expiredCount = sellers.filter((s) => isSubscriptionExpired(s) && s.status !== "Expired").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#2E5BFF]/10 rounded-xl flex items-center justify-center">
            <Store size={20} className="text-[#2E5BFF]" />
          </div>
          <div>
            <h2 className="text-zinc-900 font-bold text-lg">Sellers</h2>
            <p className="text-zinc-500 text-xs">{sellers.length} registered · {expiredCount} pending expiry</p>
          </div>
        </div>
        <button
          onClick={processExpiries}
          disabled={processing}
          className="px-4 py-2 bg-[#2E5BFF] text-white text-xs font-medium rounded-lg flex items-center gap-2 hover:bg-[#2E5BFF]/80 disabled:opacity-50 transition-colors"
        >
          {processing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Run Subscription Check
        </button>
      </div>

      {expiredCount > 0 && (
        <div className="bg-[#FF9800]/5 border border-[#FF9800]/20 rounded-xl p-4 mb-6 flex items-center gap-3">
          <AlertTriangle size={18} className="text-[#FF9800] shrink-0" />
          <p className="text-xs text-zinc-600">
            {expiredCount} seller subscription(s) have lapsed. Click "Run Subscription Check" to auto-expire and evaluate rebates.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {sellers.length === 0 ? (
          <div className="text-center py-16">
            <Store size={32} className="text-zinc-300 mx-auto mb-3" />
            <p className="text-zinc-400 text-sm">No sellers registered yet.</p>
          </div>
        ) : sellers.map((s) => {
          const fee = s.subscription_fee || PLAN_FEES[s.subscription_plan] || 0;
          const totalSales = computeTotalSales(s.id, payments);
          const threshold = fee * REBATE_MULTIPLIER;
          const expired = isSubscriptionExpired(s);
          const progressPct = threshold > 0 ? Math.min(100, (totalSales / threshold) * 100) : 0;

          return (
            <div key={s.id} className="bg-white border border-zinc-200 rounded-xl p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#2E5BFF]/10 rounded-xl flex items-center justify-center shrink-0">
                  <Store size={20} className="text-[#2E5BFF]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-zinc-900 font-medium text-sm">{s.business_name}</p>
                    <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded ${
                      s.status === "Active" ? "text-[#00E676] bg-[#00E676]/10" : s.status === "Expired" ? "text-red-400 bg-red-400/10" : "text-yellow-400 bg-yellow-400/10"
                    }`}>{s.status}</span>
                    {s.rebate_status === "Eligible" && (
                      <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded text-[#FF9800] bg-[#FF9800]/10 flex items-center gap-1">
                        <Gift size={10} /> Rebate Due
                      </span>
                    )}
                    {s.rebate_status === "Paid" && (
                      <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded text-[#00E676] bg-[#00E676]/10 flex items-center gap-1">
                        <CheckCircle2 size={10} /> Rebate Paid
                      </span>
                    )}
                  </div>
                  <p className="text-zinc-400 text-xs mt-1 flex items-center gap-2 flex-wrap">
                    {s.subscription_plan.replace("_", " ")} · KSH {fee}
                    {s.location_name && <span className="flex items-center gap-1"><MapPin size={10} />{s.location_name}</span>}
                    {s.phone && <span>· {s.phone}</span>}
                  </p>
                  <p className="text-zinc-300 text-[10px] mt-0.5">
                    {moment(s.subscription_start).format("DD MMM")} → {moment(s.subscription_end).format("DD MMM YYYY")}
                  </p>
                </div>
              </div>

              {/* Sales Progress */}
              <div className="mt-4 pt-4 border-t border-zinc-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-zinc-500 flex items-center gap-1">
                    <TrendingUp size={12} /> Sales: KSH {totalSales.toLocaleString()} / KSH {threshold.toLocaleString()}
                  </span>
                  <span className="text-xs text-zinc-400">{progressPct.toFixed(0)}%</span>
                </div>
                <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${progressPct >= 100 ? "bg-[#00E676]" : "bg-[#2E5BFF]"}`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <p className="text-zinc-300 text-[10px] mt-1">
                  {progressPct >= 100
                    ? "Sales target reached — no rebate due."
                    : `KSH ${(threshold - totalSales).toLocaleString()} more needed to avoid rebate.`}
                </p>
              </div>

              {s.rebate_status === "Eligible" && (
                <button
                  onClick={() => processRebate(s)}
                  className="mt-3 px-4 py-2 bg-[#FF9800] text-black text-xs font-bold rounded-lg hover:bg-[#FF9800]/80 flex items-center gap-1.5 transition-colors"
                >
                  <Gift size={12} /> Process Rebate (KSH {s.rebate_amount})
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
