import React, { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "@/components/ui/use-toast";

const paymentMethods = ["Mobile Money", "Bank Transfer", "Card", "USSD"];

export default function PaymentProofForm({ purpose, context, amount, instructions, onSubmitted }) {
  const [paymentMethod, setPaymentMethod] = useState("Mobile Money");
  const [proofMessage, setProofMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (proofMessage.trim().length < 5) {
      toast({ title: "Payment message required", description: "Paste the payment confirmation message or transaction reference.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await base44.payments.submit({
        purpose,
        payment_method: paymentMethod,
        proof_message: proofMessage.trim(),
        ...context,
      });
      onSubmitted?.();
    } catch (error) {
      toast({ title: "Payment submission failed", description: error.message || "Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-zinc-700">
        <p className="font-medium">Pay KSH {Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        {instructions && <p className="mt-1 text-xs text-zinc-600">{instructions}</p>}
      </div>
      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-zinc-600">Payment method</span>
        <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-800">
          {paymentMethods.map((method) => <option key={method}>{method}</option>)}
        </select>
      </label>
      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-zinc-600">Payment confirmation / transaction message</span>
        <textarea
          value={proofMessage}
          onChange={(event) => setProofMessage(event.target.value)}
          maxLength={3000}
          rows={4}
          placeholder="Paste the confirmation message or transaction reference here"
          className="w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-[#2E5BFF] focus:outline-none"
        />
      </label>
      <button onClick={submit} disabled={submitting || proofMessage.trim().length < 5} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2E5BFF] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
        {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        {submitting ? "Submitting..." : "Confirm Payment"}
      </button>
    </div>
  );
}