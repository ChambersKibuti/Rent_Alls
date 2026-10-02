import React, { useEffect, useState } from "react";
import { Activity, Gift, Loader2, RefreshCw, Store, UserRound } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

/** @typedef {{ id: string, business_name: string, status: string, subscription_plan?: string, subscription_end?: string, fee_waiver: boolean, product_count: number, rebate_amount?: number, rebate_status?: string }} PortfolioSeller */
/** @typedef {{ id: string, email: string, full_name?: string, user_type: string, free_product_access: boolean, rebate_amount?: number, rebate_status?: string, seller: PortfolioSeller | null, activity: { completed_payments: number, pending_payments: number, rentals: number, product_accesses: number } }} PortfolioPerson */

export default function ActivityTab() {
  const { toast } = useToast();
  const [portfolio, setPortfolio] = useState(/** @type {PortfolioPerson[]} */ ([]));
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(/** @type {string | null} */ (null));
  const [rebates, setRebates] = useState(/** @type {Record<string, string | number>} */ ({}));

  const loadPortfolio = async () => {
    try {
      setPortfolio(await base44.admin.portfolio());
    } catch (error) {
      toast({ title: "Could not load activity portfolio", description: error instanceof Error ? error.message : String(error), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortfolio();
  }, []);

  /** @param {PortfolioPerson} person @param {{ free_subscription?: boolean, free_product_access?: boolean, rebate_amount?: number, mark_rebate_paid?: boolean }} changes */
  const updateBenefits = async (person, changes) => {
    const id = person.seller?.id || person.id;
    setSavingId(id);
    try {
      if (person.seller) await base44.admin.updateSellerBenefits(person.seller.id, changes);
      else await base44.admin.updateUserBenefits(person.id, changes);
      toast({ title: "Benefits updated" });
      await loadPortfolio();
    } catch (error) {
      toast({ title: "Could not update benefits", description: error instanceof Error ? error.message : String(error), variant: "destructive" });
    } finally {
      setSavingId(null);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-[#2E5BFF]" /></div>;

  const buyerCount = portfolio.filter((person) => !person.seller).length;
  const sellerCount = portfolio.filter((person) => person.seller).length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2E5BFF]/10"><Activity size={20} className="text-[#2E5BFF]" /></div>
          <div><h2 className="text-lg font-bold text-zinc-900">Buyer & Seller Portfolio</h2><p className="text-xs text-zinc-500">{buyerCount} buyers · {sellerCount} sellers</p></div>
        </div>
        <button onClick={loadPortfolio} className="rounded-lg border border-zinc-200 bg-white p-2 text-zinc-600" title="Refresh activity"><RefreshCw size={16} /></button>
      </div>

      <div className="space-y-3">
        {portfolio.map((person) => {
          const seller = person.seller;
          const benefitId = seller?.id || person.id;
          const rebate = rebates[benefitId] ?? (seller?.rebate_amount || person.rebate_amount || "");
          const busy = savingId === benefitId;
          return (
            <article key={person.id} className="rounded-lg border border-zinc-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${seller ? "bg-emerald-50" : "bg-sky-50"}`}>
                    {seller ? <Store size={17} className="text-emerald-700" /> : <UserRound size={17} className="text-sky-700" />}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-zinc-900">{seller?.business_name || person.full_name || person.email}</p>
                    <p className="truncate text-xs text-zinc-500">{person.email} · {seller ? `Seller · ${seller.status}` : "Buyer"}</p>
                    {seller && <p className="mt-1 text-xs text-zinc-500">Plan: {seller.subscription_plan?.replace("_", " ")} · {seller.product_count} products · Ends {seller.subscription_end || "not set"}</p>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-600">
                  <span>{person.activity.completed_payments} approved payments</span>
                  <span>{person.activity.pending_payments} pending</span>
                  {seller ? <span>{person.activity.rentals} completed rentals</span> : <span>{person.activity.product_accesses} product unlocks</span>}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-zinc-100 pt-3">
                {seller ? (
                  <label className="flex items-center gap-2 text-xs text-zinc-700">
                    <input type="checkbox" checked={seller.fee_waiver} disabled={busy} onChange={(event) => updateBenefits(person, { free_subscription: event.target.checked })} />
                    Free subscription
                  </label>
                ) : (
                  <label className="flex items-center gap-2 text-xs text-zinc-700">
                    <input type="checkbox" checked={person.free_product_access} disabled={busy} onChange={(event) => updateBenefits(person, { free_product_access: event.target.checked })} />
                    Free product access
                  </label>
                )}
                <label className="flex items-center gap-2 text-xs text-zinc-600">
                  Rebate (KSH)
                  <input type="number" min="0" value={rebate} onChange={(event) => setRebates((current) => ({ ...current, [benefitId]: event.target.value }))} className="w-28 rounded-md border border-zinc-300 px-2 py-1.5 text-sm text-zinc-900" />
                </label>
                <button onClick={() => updateBenefits(person, { rebate_amount: Number(rebate) || 0 })} disabled={busy} className="rounded-md bg-[#2E5BFF] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
                  {busy ? <Loader2 size={13} className="animate-spin" /> : <Gift size={13} />} Save rebate
                </button>
                {(seller?.rebate_status === "Eligible" || person.rebate_status === "Eligible") && (
                  <button onClick={() => updateBenefits(person, { mark_rebate_paid: true })} disabled={busy} className="rounded-md border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700 disabled:opacity-50">Mark rebate paid</button>
                )}
              </div>
            </article>
          );
        })}
        {portfolio.length === 0 && <div className="py-16 text-center text-sm text-zinc-400">No buyer or seller activity yet.</div>}
      </div>
    </div>
  );
}
