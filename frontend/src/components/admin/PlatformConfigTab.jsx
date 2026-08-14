import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, CheckCircle2, Save, Settings } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const paymentMethods = ["Bank Transfer", "Mobile Money", "Card"];

export default function PlatformConfigTab() {
  const { toast } = useToast();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const configs = await base44.entities.PlatformConfig.list("-created_date", 1);
      if (configs.length > 0) {
        setConfig(configs[0]);
      } else {
        setConfig({
          commission_payment_method: "Bank Transfer",
          commission_account_name: "",
          commission_account_number: "",
          commission_bank_name: "",
          commission_rate: 0.2,
          rebate_multiplier: 100,
          platform_name: "RentAlls",
        });
      }
    } catch (e) {
      toast({ title: "Failed to load config", variant: "destructive" });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!config.commission_payment_method || !config.commission_account_number) {
      toast({ title: "Missing fields", description: "Payment method and account number are required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (config.id) {
        await base44.entities.PlatformConfig.update(config.id, config);
      } else {
        const created = await base44.entities.PlatformConfig.create(config);
        setConfig(created);
      }
      toast({ title: "Platform config saved", description: "Commission payment details updated." });
    } catch (e) {
      toast({ title: "Save failed", variant: "destructive" });
    }
    setSaving(false);
  };

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
          <Settings size={20} className="text-[#2E5BFF]" />
        </div>
        <div>
          <h2 className="text-zinc-900 font-bold text-lg">Platform Configuration</h2>
          <p className="text-zinc-500 text-xs">Configure where commission payments are directed</p>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-5">
        <div className="bg-[#FF9800]/5 border border-[#FF9800]/20 rounded-xl p-4">
          <p className="text-xs text-zinc-600">
            <span className="text-[#FF9800] font-bold">Important:</span> Commission payments from buyers are directed to the RentAlls admin payment method configured here. Rental payments go directly to each seller's own payment method.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1 block">Commission Payment Method *</label>
            <select
              value={config.commission_payment_method}
              onChange={(e) => setConfig((c) => ({ ...c, commission_payment_method: e.target.value }))}
              className="w-full bg-zinc-100 border border-zinc-300 rounded-lg px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-[#2E5BFF]/30"
            >
              {paymentMethods.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1 block">Account Name *</label>
            <input
              value={config.commission_account_name || ""}
              onChange={(e) => setConfig((c) => ({ ...c, commission_account_name: e.target.value }))}
              placeholder="e.g. RentAlls Pty Ltd"
              className="w-full bg-zinc-100 border border-zinc-300 rounded-lg px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#2E5BFF]/30"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1 block">Account Number *</label>
            <input
              value={config.commission_account_number || ""}
              onChange={(e) => setConfig((c) => ({ ...c, commission_account_number: e.target.value }))}
              placeholder="e.g. 62200012345"
              className="w-full bg-zinc-100 border border-zinc-300 rounded-lg px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#2E5BFF]/30"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1 block">Bank Name</label>
            <input
              value={config.commission_bank_name || ""}
              onChange={(e) => setConfig((c) => ({ ...c, commission_bank_name: e.target.value }))}
              placeholder="e.g. FNB Business"
              className="w-full bg-zinc-100 border border-zinc-300 rounded-lg px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#2E5BFF]/30"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1 block">Commission Rate</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={config.commission_rate}
              onChange={(e) => setConfig((c) => ({ ...c, commission_rate: parseFloat(e.target.value) || 0 }))}
              className="w-full bg-zinc-100 border border-zinc-300 rounded-lg px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-[#2E5BFF]/30"
            />
            <p className="text-zinc-300 text-[10px] mt-1">0.2 = 20% commission</p>
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1 block">Rebate Multiplier</label>
            <input
              type="number"
              min="1"
              value={config.rebate_multiplier}
              onChange={(e) => setConfig((c) => ({ ...c, rebate_multiplier: parseInt(e.target.value) || 100 }))}
              className="w-full bg-zinc-100 border border-zinc-300 rounded-lg px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-[#2E5BFF]/30"
            />
            <p className="text-zinc-300 text-[10px] mt-1">Sellers rebated if sales &lt; multiplier × subscription fee</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-[#2E5BFF] text-white text-sm font-medium rounded-lg hover:bg-[#2E5BFF]/80 flex items-center gap-2 disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : config.id ? <Save size={14} /> : <CheckCircle2 size={14} />}
          {config.id ? "Update" : "Save"} Configuration
        </button>
      </div>
    </div>
  );
}
