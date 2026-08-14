import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PageLayout from "@/components/PageLayout";
import OtpStep from "@/components/OtpStep";
import { motion } from "framer-motion";
import { Check, Loader2, Store, Calendar, Phone, Mail, MapPin, ArrowLeft, Home, CreditCard, Package, Lock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import moment from "moment";
import { PLAN_FEES } from "@/lib/constants";

const plans = [
{ id: "2_months", label: "2 Months", price: PLAN_FEES["2_months"], duration: 2, color: "border-[#2E5BFF]/30", glow: "bg-[#2E5BFF]/5", badge: "text-[#2E5BFF] bg-[#2E5BFF]/10", popular: false },
{ id: "6_months", label: "6 Months", price: PLAN_FEES["6_months"], duration: 6, color: "border-[#00E676]/30", glow: "bg-[#00E676]/5", badge: "text-[#00E676] bg-[#00E676]/10", popular: true },
{ id: "1_year", label: "1 Year", price: PLAN_FEES["1_year"], duration: 12, color: "border-[#FF9800]/30", glow: "bg-[#FF9800]/5", badge: "text-[#FF9800] bg-[#FF9800]/10", popular: false }];

const paymentMethods = ["Bank Transfer", "Mobile Money", "Card"];

export default function SellerRegister() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [step, setStep] = useState("plan");
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [form, setForm] = useState({
    business_name: "", description: "", phone: "", email: "", password: "", confirmPassword: "",
    location_name: "", address: "", payment_method: "", account_number: "",
    initial_product_name: "", initial_product_quantity: ""
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showOtp, setShowOtp] = useState(false);

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      if (me) {
        // Pre-fill from existing user profile
        setForm(f => ({
          ...f,
          email: me.email || "",
          business_name: me.full_name || "",
        }));
        // Check if they already have a seller account
        try {
          const existing = await base44.entities.Seller.filter({ created_by_id: me.id }, "-created_date", 1);
          if (existing.length > 0) {
            toast({ title: "Seller account found", description: "Redirecting to your dashboard..." });
            setTimeout(() => navigate("/seller-dashboard"), 1500);
          }
        } catch (e) {}
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const createSellerRecord = async () => {
    const plan = plans.find((p) => p.id === selectedPlan);
    const startDate = moment().format("YYYY-MM-DD");
    const endDate = moment().add(plan.duration, "months").format("YYYY-MM-DD");
    const seller = await base44.entities.Seller.create({
      business_name: form.business_name,
      description: form.description,
      phone: form.phone,
      email: form.email || user?.email,
      location_name: form.location_name,
      address: form.address,
      payment_method: form.payment_method,
      account_number: form.account_number,
      initial_product_name: form.initial_product_name || null,
      initial_product_quantity: form.initial_product_quantity ? parseInt(form.initial_product_quantity) : null,
      subscription_plan: selectedPlan,
      subscription_start: startDate,
      subscription_end: endDate,
      subscription_fee: plan.price,
      status: "Active"
    });
    return seller;
  };

  const handleDetailsSubmit = async () => {
    if (!form.business_name || !selectedPlan) {
      toast({ title: "Missing fields", description: "Please enter your business name and select a plan.", variant: "destructive" });
      return;
    }
    if (!form.phone || !form.location_name || !form.address || !form.payment_method || !form.account_number) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    if (!user) {
      if (!form.email || !form.password) {
        toast({ title: "Missing fields", description: "Email and password are required.", variant: "destructive" });
        return;
      }
      if (form.password !== form.confirmPassword) {
        toast({ title: "Password mismatch", description: "Passwords do not match.", variant: "destructive" });
        return;
      }
      if (form.password.length < 6) {
        toast({ title: "Weak password", description: "Password must be at least 6 characters.", variant: "destructive" });
        return;
      }
      setSubmitting(true);
      try {
        await base44.auth.register({ email: form.email, password: form.password });
        setShowOtp(true);
      } catch (e) {
        toast({ title: "Registration failed", description: e.message || "Could not create account.", variant: "destructive" });
      } finally {
        setSubmitting(false);
      }
    } else {
      setSubmitting(true);
      try {
        const seller = await createSellerRecord();
        await base44.auth.updateMe({ full_name: form.business_name, phone: form.phone, user_type: "seller", seller_id: seller.id });
        setSuccess(true);
        toast({ title: "Seller Account Created!", description: "Your subscription is now active." });
        setTimeout(() => navigate("/seller-dashboard"), 2000);
      } catch (e) {
        toast({ title: "Registration failed", variant: "destructive" });
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleOtpVerified = async () => {
    await base44.auth.updateMe({
      full_name: form.business_name,
      phone: form.phone,
      user_type: "seller"
    });
    const seller = await createSellerRecord();
    await base44.auth.updateMe({ seller_id: seller.id });
    try {
      await base44.integrations.Core.SendEmail({
        to: form.email || user?.email,
        subject: "Welcome to RentAlls Sellers!",
        body: `Hi ${form.business_name},\n\nYour seller account is now active! Your subscription plan is ${plans.find((p) => p.id === selectedPlan)?.label}.\n\nYou can now list your products, manage clients, and grow your rental business from your dashboard.\n\nThe RentAlls Team`
      });
    } catch (e) {

      /* non-critical */}
    setSuccess(true);
    toast({ title: "Seller Account Created!", description: "Your subscription is now active." });
    setTimeout(() => {window.location.href = "/seller-dashboard";}, 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#2E5BFF] border-t-transparent rounded-full animate-spin" />
      </div>);

  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center">
          <div className="w-20 h-20 bg-[#00E676]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check size={40} className="text-[#00E676]" />
          </div>
          <h2 className="text-zinc-900 font-bold text-xl mb-2">Welcome aboard!</h2>
          <p className="text-zinc-500 text-sm">Redirecting to your dashboard...</p>
        </motion.div>
      </div>);

  }

  if (showOtp) {
    return (
      <PageLayout showFooter={false}>
        <div className="pt-28 pb-32 max-w-md mx-auto px-4 sm:px-6">
          <div className="bg-white border border-zinc-300 rounded-2xl p-8">
            <div className="w-12 h-12 bg-[#2E5BFF]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Mail size={22} className="text-[#2E5BFF]" />
            </div>
            <h2 className="text-zinc-900 font-bold text-xl text-center mb-2">Verify your email</h2>
            <p className="text-zinc-500 text-sm text-center mb-6">Enter the 6-digit code sent to your email</p>
            <OtpStep email={form.email} onVerified={handleOtpVerified} onBack={() => setShowOtp(false)} />
          </div>
        </div>
      </PageLayout>);

  }

  return (
    <PageLayout>
      <div className="pt-28 pb-32 max-w-3xl mx-auto px-4 sm:px-6">
        <Link to="/register" className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-900 text-sm mb-8 transition-colors">
          <ArrowLeft size={16} /> Back to role selection
        </Link>

        <div className="text-center mb-10">
          <div className="w-14 h-14 bg-[#2E5BFF]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Store size={26} className="text-[#2E5BFF]" />
          </div>
          <h1 className="text-3xl font-black text-zinc-900 mb-2">Become a Seller</h1>
          <p className="text-zinc-500 text-sm">List your products, manage clients, and grow your rental business.</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-10">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step === "plan" ? "bg-[#2E5BFF] text-white" : "bg-[#00E676] text-black"}`}>
            {step === "plan" ? "1" : <Check size={14} />}
          </div>
          <div className={`w-16 h-0.5 ${step === "details" ? "bg-[#2E5BFF]" : "bg-zinc-200"}`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step === "details" ? "bg-[#2E5BFF] text-white" : "bg-zinc-100 text-zinc-400"}`}>2</div>
        </div>

        {step === "plan" &&
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {plans.map((plan) =>
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`relative p-5 bg-white border-2 rounded-2xl text-left transition-all ${selectedPlan === plan.id ? plan.color : "border-zinc-200 hover:border-zinc-300"} ${plan.glow}`}>
              
                  {plan.popular &&
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] uppercase tracking-widest font-bold text-black bg-[#00E676] px-2 py-0.5 rounded-full">Popular</span>
              }
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar size={16} className={plan.badge.split(" ")[0]} />
                    <span className={`text-xs uppercase tracking-widest font-bold ${plan.badge}`}>{plan.label}</span>
                  </div>
                  <p className="text-zinc-900 font-black text-2xl">KSH {plan.price}</p>
                  <p className="text-zinc-400 text-xs mt-1">One-time payment</p>
                  {selectedPlan === plan.id &&
              <div className="absolute top-3 right-3 w-5 h-5 bg-[#2E5BFF] rounded-full flex items-center justify-center">
                      <Check size={12} className="text-zinc-900" />
                    </div>
              }
                </button>
            )}
            </div>
            <button
            onClick={() => setStep("details")}
            disabled={!selectedPlan}
            className="w-full py-3.5 bg-[#2E5BFF] hover:bg-[#2E5BFF]/80 text-white font-semibold rounded-xl disabled:opacity-40 transition-colors">
            
              Continue
            </button>
          </motion.div>
        }

        {step === "details" &&
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {!user &&
          <>
                <div className="bg-[#2E5BFF]/5 border border-[#2E5BFF]/20 rounded-xl p-4">
                  <p className="text-xs text-zinc-600">
                    <span className="text-[#2E5BFF] font-bold">Account Setup:</span> Create your login credentials. A verification code will be sent to your email after submission.
                  </p>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1 block">Email Address *</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="you@example.com" className="w-full bg-white border border-zinc-300 rounded-xl pl-10 pr-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#2E5BFF]/30" required />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1 block">Password *</label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="••••••••" className="w-full bg-white border border-zinc-300 rounded-xl pl-10 pr-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#2E5BFF]/30" required />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1 block">Confirm Password *</label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input type="password" value={form.confirmPassword} onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))} placeholder="••••••••" className="w-full bg-white border border-zinc-300 rounded-xl pl-10 pr-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#2E5BFF]/30" required />
                    </div>
                  </div>
                </div>
              </>
          }

            <div className="border-t border-zinc-200 pt-4 mt-2">
              <p className="text-xs text-zinc-400 uppercase tracking-widest mb-3">Business Details</p>
            </div>

            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1 block">Business Name *</label>
              <input value={form.business_name} onChange={(e) => setForm((f) => ({ ...f, business_name: e.target.value }))} placeholder="e.g. Pro Rentals SA" className="w-full bg-white border border-zinc-300 rounded-xl px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#2E5BFF]/30" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1 block">Description</label>
              <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Tell buyers about your business..." rows={3} className="w-full bg-white border border-zinc-300 rounded-xl px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#2E5BFF]/30 resize-none" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1 block">Phone Number *</label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+254 725 217 874" className="w-full bg-white border border-zinc-300 rounded-xl pl-10 pr-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#2E5BFF]/30" />
              </div>
            </div>
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1 block">Location (City/Area) *</label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input value={form.location_name} onChange={(e) => setForm((f) => ({ ...f, location_name: e.target.value }))} placeholder="e.g. Westlands, Nairobi" className="w-full bg-white border border-zinc-300 rounded-xl pl-10 pr-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#2E5BFF]/30" />
              </div>
            </div>
            <div>
              <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1 block">Full Address *</label>
              <div className="relative">
                <Home size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="e.g. 123 Main Road, Sandton, 2196" className="w-full bg-white border border-zinc-300 rounded-xl pl-10 pr-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#2E5BFF]/30" />
              </div>
            </div>

            <div className="border-t border-zinc-200 pt-4 mt-2">
              <p className="text-xs text-zinc-400 uppercase tracking-widest mb-3">Payment Details (for verification & payouts)</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1 block">Payment Method *</label>
                <select value={form.payment_method} onChange={(e) => setForm((f) => ({ ...f, payment_method: e.target.value }))} className="w-full bg-white border border-zinc-300 rounded-xl px-4 py-3 text-sm text-zinc-900 focus:outline-none focus:border-[#2E5BFF]/30">
                  <option value="">Select method</option>
                  {paymentMethods.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1 block">Account Number *</label>
                <div className="relative">
                  <CreditCard size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input value={form.account_number} onChange={(e) => setForm((f) => ({ ...f, account_number: e.target.value }))} placeholder="e.g. 62201234567" className="w-full bg-white border border-zinc-300 rounded-xl pl-10 pr-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#2E5BFF]/30" />
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-200 pt-4 mt-2">
              <p className="text-xs text-zinc-400 uppercase tracking-widest mb-1">Initial Product (Optional)</p>
              <p className="text-xs text-zinc-400 mb-3">Add a product now or do it later from your dashboard.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1 block">Product Name</label>
                <div className="relative">
                  <Package size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input value={form.initial_product_name} onChange={(e) => setForm((f) => ({ ...f, initial_product_name: e.target.value }))} placeholder="e.g. Industrial Drill" className="w-full bg-white border border-zinc-300 rounded-xl pl-10 pr-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#2E5BFF]/30" />
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1 block">Quantity</label>
                <input type="number" min="1" value={form.initial_product_quantity} onChange={(e) => setForm((f) => ({ ...f, initial_product_quantity: e.target.value }))} placeholder="e.g. 5" className="w-full bg-white border border-zinc-300 rounded-xl px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#2E5BFF]/30" />
              </div>
            </div>

            


          

            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep("plan")} className="px-6 py-3.5 bg-zinc-100 border border-zinc-300 text-zinc-900 font-medium rounded-xl hover:bg-zinc-200 transition-colors">
                Back
              </button>
              <button onClick={handleDetailsSubmit} disabled={submitting} className="flex-1 py-3.5 bg-[#2E5BFF] hover:bg-[#2E5BFF]/80 text-white font-semibold rounded-xl disabled:opacity-40 flex items-center justify-center gap-2 transition-colors">
                {submitting ? <Loader2 size={18} className="animate-spin" /> : <Store size={18} />}
                {submitting ? "Creating Account..." : user ? "Activate Seller Account" : "Register & Verify"}
              </button>
            </div>
          </motion.div>
        }
      </div>
    </PageLayout>);

}