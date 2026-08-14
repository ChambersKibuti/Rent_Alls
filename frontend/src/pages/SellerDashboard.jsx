import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import Header from "@/components/Header";
import CommandBar from "@/components/CommandBar";
import LocationMap from "@/components/LocationMap";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, Users, Plus, X, Upload, Loader2, Trash2, Edit2, CheckCircle2,
  Image as ImageIcon, MapPin, Store, UserX, UserCheck, Calendar, TrendingUp, Gift, AlertTriangle, Star, MessageSquare
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import moment from "moment";
import { PLAN_FEES, REBATE_MULTIPLIER, isSubscriptionExpired, computeTotalSales, checkRebateEligibility } from "@/lib/subscriptionUtils";
import RatingStars from "@/components/RatingStars";
import RatingModal from "@/components/RatingModal";

const categories = ["Tools", "Equipment", "Vehicles", "Electronics", "Furniture", "Houses", "Transport Services", "Hairdressing", "Other"];
const emptyProduct = {
  title: "", description: "", price_per_day: "", category: "Tools", status: "Available",
  images: [], specifications: "", deposit_amount: "", location_name: "",
  latitude: null, longitude: null, quantity_available: "1"
};

export default function SellerDashboard() {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("products");

  // Products
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState(emptyProduct);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Clients & Payments
  const [clients, setClients] = useState([]);
  const [payments, setPayments] = useState([]);
  const [showClientForm, setShowClientForm] = useState(false);
  const [clientForm, setClientForm] = useState({ product_id: "", client_name: "", client_phone: "", client_email: "", notes: "" });
  const [clientProduct, setClientProduct] = useState("");
  const [buyerRatings, setBuyerRatings] = useState({});
  const [showRateBuyerModal, setShowRateBuyerModal] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const me = await base44.auth.me();
      setUser(me);
      const sellers = await base44.entities.Seller.filter({ created_by_id: me.id }, "-created_date", 1);
      if (sellers.length > 0) {
        const mySeller = sellers[0];
        setSeller(mySeller);
        const [prods, cls, pays] = await Promise.all([
          base44.entities.Product.filter({ seller_id: mySeller.id }, "-created_date", 100),
          base44.entities.Client.filter({ seller_id: mySeller.id }, "-created_date", 100),
          base44.entities.Payment.filter({ seller_id: mySeller.id }, "-created_date", 200),
        ]);
        setProducts(prods);
        setClients(cls);
        setPayments(pays);

        // Fetch ratings the seller has given (to know which buyers they already rated)
        try {
          const myRatings = await base44.entities.Rating.filter({ rater_id: me.id }, "-created_date", 200);
          const ratingMap = {};
          myRatings.forEach(r => { if (r.payment_id) ratingMap[r.payment_id] = r; });
          setBuyerRatings(ratingMap);
        } catch (e) {}

        // Auto-expire subscription if lapsed
        if (isSubscriptionExpired(mySeller) && mySeller.status !== "Expired") {
          const totalSales = computeTotalSales(mySeller.id, pays);
          const rebate = checkRebateEligibility(mySeller, totalSales);
          await base44.entities.Seller.update(mySeller.id, {
            status: "Expired",
            total_sales: totalSales,
            rebate_status: rebate.status,
            rebate_amount: rebate.rebate_amount,
          });
          setSeller({ ...mySeller, status: "Expired", total_sales: totalSales, rebate_status: rebate.status, rebate_amount: rebate.rebate_amount });
        }
      }
    } catch (e) {}
    setLoading(false);
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const urls = [];
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        urls.push(file_url);
      }
      setForm(f => ({ ...f, images: [...(f.images || []), ...urls] }));
    } catch (e) {
      toast({ title: "Upload failed", variant: "destructive" });
    }
    setUploading(false);
  };

  const removeImage = (idx) => {
    setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
  };

  const saveProduct = async () => {
    if (!form.title || !form.price_per_day || !form.category) {
      toast({ title: "Missing fields", description: "Title, price, and category are required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const data = {
        ...form,
        price_per_day: Number(form.price_per_day),
        deposit_amount: form.deposit_amount ? Number(form.deposit_amount) : 0,
        quantity_available: Number(form.quantity_available) || 1,
        images: form.images || [],
        image_url: form.images?.[0] || "",
        seller_id: seller.id,
      };
      if (editProduct) {
        await base44.entities.Product.update(editProduct.id, data);
        toast({ title: "Product updated" });
      } else {
        await base44.entities.Product.create(data);
        toast({ title: "Product created" });
      }
      setShowForm(false);
      setEditProduct(null);
      setForm(emptyProduct);
      await loadData();
    } catch (e) {
      toast({ title: "Error saving product", variant: "destructive" });
    }
    setSaving(false);
  };

  const deleteProduct = async (id) => {
    if (!confirm("Delete this product?")) return;
    try {
      await base44.entities.Product.delete(id);
      toast({ title: "Product deleted" });
      await loadData();
    } catch (e) {}
  };

  const addClient = async () => {
    if (!clientForm.product_id || !clientForm.client_name) {
      toast({ title: "Product and client name required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const product = products.find(p => p.id === clientForm.product_id);
      await base44.entities.Client.create({
        ...clientForm,
        product_title: product?.title || "",
        seller_id: seller.id,
        status: "Active",
      });
      toast({ title: "Client added" });
      setClientForm({ product_id: "", client_name: "", client_phone: "", client_email: "", notes: "" });
      setShowClientForm(false);
      await loadData();
    } catch (e) {
      toast({ title: "Error adding client", variant: "destructive" });
    }
    setSaving(false);
  };

  const dismissClient = async (client) => {
    if (!confirm(`Dismiss ${client.client_name}? This will free up one unit of inventory.`)) return;
    try {
      await base44.entities.Client.update(client.id, { status: "Dismissed" });
      // Restore quantity
      const product = products.find(p => p.id === client.product_id);
      if (product) {
        await base44.entities.Product.update(product.id, {
          quantity_available: (product.quantity_available || 0) + 1,
          status: product.quantity_available + 1 > 0 ? "Available" : product.status,
        });
      }
      toast({ title: "Client dismissed", description: "Inventory restored." });
      await loadData();
    } catch (e) {}
  };

  const reactivateClient = async (client) => {
    try {
      await base44.entities.Client.update(client.id, { status: "Active" });
      toast({ title: "Client reactivated" });
      await loadData();
    } catch (e) {}
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
          <p className="text-zinc-500 mb-4">Please sign in to access your dashboard.</p>
          <Link to="/login" className="text-[#2E5BFF] hover:underline text-sm">Sign In</Link>
        </div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 bg-[#2E5BFF]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Store size={26} className="text-[#2E5BFF]" />
          </div>
          <h2 className="text-zinc-900 font-bold text-xl mb-2">No Seller Account</h2>
          <p className="text-zinc-500 text-sm mb-6">You need a seller subscription to access this dashboard.</p>
          <Link to="/seller-register" className="inline-block px-6 py-3 bg-[#2E5BFF] text-white font-medium rounded-xl hover:bg-[#2E5BFF]/80 transition-colors">
            Become a Seller
          </Link>
        </div>
      </div>
    );
  }

  const activeClients = clients.filter(c => c.status === "Active").length;
  const totalInventory = products.reduce((s, p) => s + (p.quantity_available || 0), 0);
  const totalSales = computeTotalSales(seller.id, payments);
  const subscriptionFee = seller.subscription_fee || PLAN_FEES[seller.subscription_plan] || 0;
  const salesThreshold = subscriptionFee * REBATE_MULTIPLIER;
  const salesProgress = salesThreshold > 0 ? Math.min(100, (totalSales / salesThreshold) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <Header />

      <div className="pt-24 pb-32 max-w-6xl mx-auto px-4 sm:px-6">
        {/* Seller Header */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-[#2E5BFF]/10 rounded-xl flex items-center justify-center">
                <Store size={24} className="text-[#2E5BFF]" />
              </div>
              <div>
                <h1 className="text-zinc-900 font-bold text-xl">{seller.business_name}</h1>
                <p className="text-zinc-500 text-sm flex items-center gap-2">
                  <Calendar size={12} />
                  {seller.subscription_plan.replace("_", " ")} plan ·
                  <span className={moment(seller.subscription_end).isAfter(moment()) ? "text-[#00E676]" : "text-red-400"}>
                    {moment(seller.subscription_end).isAfter(moment()) ? "Active" : "Expired"}
                  </span>
                </p>
                {seller.average_rating > 0 && (
                  <div className="flex items-center gap-2 mt-1">
                    <RatingStars value={seller.average_rating} readOnly size={14} />
                    <span className="text-[#FFD700] text-xs font-bold">{seller.average_rating.toFixed(1)}</span>
                    <span className="text-zinc-400 text-[10px]">({seller.total_ratings} reviews)</span>
                    {seller.fee_waiver && (
                      <span className="text-[9px] uppercase tracking-widest font-bold text-black bg-[#FFD700] px-2 py-0.5 rounded-full">Fee Waiver Active</span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="text-right">
                <p className="text-xs text-zinc-400 uppercase tracking-widest">Expires</p>
                <p className="text-zinc-900 font-medium text-sm">{moment(seller.subscription_end).format("DD MMM YYYY")}</p>
              </div>
              <Link to="/register/buyer" className="text-[#2E5BFF] text-xs font-medium hover:underline flex items-center gap-1">
                <Star size={12} /> Become a Buyer
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-zinc-200">
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-widest">Products</p>
              <p className="text-zinc-900 font-bold text-2xl mt-1">{products.length}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-widest">Inventory</p>
              <p className="text-[#2E5BFF] font-bold text-2xl mt-1">{totalInventory}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-widest">Active Clients</p>
              <p className="text-[#00E676] font-bold text-2xl mt-1">{activeClients}</p>
            </div>
          </div>

          {/* Sales Progress & Rebate */}
          <div className="mt-6 pt-6 border-t border-zinc-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-500 flex items-center gap-1">
                <TrendingUp size={12} /> Total Sales: KSH {totalSales.toLocaleString()} / KSH {salesThreshold.toLocaleString()}
              </span>
              <span className="text-xs text-zinc-400">{salesProgress.toFixed(0)}%</span>
            </div>
            <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${salesProgress >= 100 ? "bg-[#00E676]" : "bg-[#2E5BFF]"}`} style={{ width: `${salesProgress}%` }} />
            </div>
            <p className="text-zinc-300 text-[10px] mt-1">
              {salesProgress >= 100
                ? "Sales target reached — no rebate will be deducted."
                : `KSH ${(salesThreshold - totalSales).toLocaleString()} more in sales needed to avoid subscription rebate.`}
            </p>
            {seller.rebate_status === "Eligible" && (
              <div className="mt-3 bg-[#FF9800]/5 border border-[#FF9800]/20 rounded-lg p-3 flex items-center gap-2">
                <Gift size={14} className="text-[#FF9800]" />
                <p className="text-xs text-zinc-600">Subscription rebate of <span className="text-[#FF9800] font-bold">KSH {seller.rebate_amount}</span> is due to you. Contact admin to process.</p>
              </div>
            )}
            {seller.rebate_status === "Paid" && (
              <div className="mt-3 bg-[#00E676]/5 border border-[#00E676]/20 rounded-lg p-3 flex items-center gap-2">
                <CheckCircle2 size={14} className="text-[#00E676]" />
                <p className="text-xs text-zinc-600">Subscription rebate of <span className="text-[#00E676] font-bold">KSH {seller.rebate_amount}</span> has been paid.</p>
              </div>
            )}
            {seller.status === "Expired" && seller.rebate_status === "None" && (
              <div className="mt-3 bg-red-400/5 border border-red-400/20 rounded-lg p-3 flex items-center gap-2">
                <AlertTriangle size={14} className="text-red-400" />
                <p className="text-xs text-zinc-600">Your subscription has expired. Renew to continue listing products.</p>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white border border-zinc-200 rounded-xl p-1">
          {[{ id: "products", label: "Products", icon: Package }, { id: "clients", label: "Clients", icon: Users }, { id: "transactions", label: "Transactions", icon: MessageSquare }].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-colors ${tab === t.id ? "bg-[#2E5BFF] text-white" : "text-zinc-500 hover:text-zinc-700"}`}
            >
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>

        {/* PRODUCTS TAB */}
        {tab === "products" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <p className="text-zinc-600 text-sm">{products.length} product{products.length !== 1 ? "s" : ""}</p>
              <button
                onClick={() => { setShowForm(true); setEditProduct(null); setForm(emptyProduct); }}
                className="px-4 py-2 bg-[#2E5BFF] text-white text-xs font-medium rounded-lg flex items-center gap-1 hover:bg-[#2E5BFF]/80"
              >
                <Plus size={14} /> Add Product
              </button>
            </div>

            <AnimatePresence>
              {showForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white border border-zinc-200 rounded-xl p-5 mb-6 overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-zinc-900 font-bold text-sm">{editProduct ? "Edit Product" : "New Product"}</h3>
                    <button onClick={() => setShowForm(false)} className="text-zinc-500 hover:text-zinc-900"><X size={16} /></button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1 block">Title *</label>
                      <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                        className="w-full bg-zinc-100 border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-[#2E5BFF]/30" />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1 block">Category *</label>
                      <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                        className="w-full bg-zinc-100 border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-[#2E5BFF]/30">
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1 block">Price/Day (KSH) *</label>
                      <input type="number" value={form.price_per_day} onChange={e => setForm(f => ({ ...f, price_per_day: e.target.value }))}
                        className="w-full bg-zinc-100 border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-[#2E5BFF]/30" />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1 block">Quantity Available</label>
                      <input type="number" value={form.quantity_available} onChange={e => setForm(f => ({ ...f, quantity_available: e.target.value }))}
                        className="w-full bg-zinc-100 border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-[#2E5BFF]/30" />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1 block">Deposit (KSH)</label>
                      <input type="number" value={form.deposit_amount} onChange={e => setForm(f => ({ ...f, deposit_amount: e.target.value }))}
                        className="w-full bg-zinc-100 border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-[#2E5BFF]/30" />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1 block">Status</label>
                      <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                        className="w-full bg-zinc-100 border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-[#2E5BFF]/30">
                        {["Available", "Leased", "Maintenance"].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1 block">Description</label>
                      <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                        className="w-full bg-zinc-100 border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-[#2E5BFF]/30 resize-none" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1 block">Specifications</label>
                      <textarea value={form.specifications} onChange={e => setForm(f => ({ ...f, specifications: e.target.value }))} rows={2}
                        className="w-full bg-zinc-100 border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-[#2E5BFF]/30 resize-none" />
                    </div>

                    {/* Images */}
                    <div className="md:col-span-2">
                      <label className="text-xs text-zinc-500 uppercase tracking-widest mb-2 block">Product Images</label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {(form.images || []).map((img, idx) => (
                          <div key={idx} className="relative w-20 h-20 group">
                            <img src={img} alt="" className="w-full h-full object-cover rounded-lg border border-zinc-300" />
                            <button onClick={() => removeImage(idx)} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <X size={12} />
                            </button>
                            {idx === 0 && <span className="absolute bottom-0 left-0 right-0 text-[8px] text-white bg-black/70 text-center py-0.5 rounded-b-lg">Cover</span>}
                          </div>
                        ))}
                        <label className="w-20 h-20 border-2 border-dashed border-zinc-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-[#2E5BFF]/30 transition-colors">
                          {uploading ? <Loader2 size={18} className="animate-spin text-zinc-400" /> : <ImageIcon size={18} className="text-zinc-400" />}
                          <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                        </label>
                      </div>
                      <p className="text-zinc-300 text-xs">Upload multiple images. First image is the cover.</p>
                    </div>

                    {/* Location */}
                    <div className="md:col-span-2">
                      <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1 block">Location</label>
                      <div className="relative mb-2">
                        <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input value={form.location_name} onChange={e => setForm(f => ({ ...f, location_name: e.target.value }))}
                          placeholder="e.g. Westlands, Nairobi"
                          className="w-full bg-zinc-100 border border-zinc-300 rounded-lg pl-10 pr-4 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#2E5BFF]/30" />
                      </div>
                      <p className="text-zinc-300 text-xs mb-2">Click on the map to set exact location:</p>
                      <LocationMap
                        latitude={form.latitude}
                        longitude={form.longitude}
                        onPick={(lat, lng) => setForm(f => ({ ...f, latitude: lat, longitude: lng }))}
                      />
                    </div>
                  </div>

                  <button onClick={saveProduct} disabled={saving}
                    className="mt-4 px-6 py-2.5 bg-[#2E5BFF] text-white text-xs font-medium rounded-lg hover:bg-[#2E5BFF]/80 flex items-center gap-1 disabled:opacity-50">
                    {saving ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                    {editProduct ? "Update" : "Create"} Product
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              {products.map(p => (
                <div key={p.id} className="bg-white border border-zinc-200 rounded-xl p-4">
                  <div className="flex items-center gap-4">
                    {p.images?.[0] || p.image_url ? (
                      <img src={p.images?.[0] || p.image_url} alt={p.title} className="w-14 h-14 rounded-lg object-cover border border-zinc-300 shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                        <Package size={20} className="text-zinc-300" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-zinc-900 font-medium text-sm truncate">{p.title}</p>
                      <p className="text-zinc-400 text-xs flex items-center gap-2">
                        {p.category} · KSH {p.price_per_day}/day
                        {p.location_name && <span className="flex items-center gap-1"><MapPin size={10} />{p.location_name}</span>}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[#00E676] font-bold text-sm">{p.quantity_available || 0}</p>
                      <p className="text-zinc-300 text-[10px] uppercase tracking-widest">in stock</p>
                    </div>
                    <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded shrink-0 ${
                      p.status === "Available" ? "text-[#00E676] bg-[#00E676]/10" : p.status === "Leased" ? "text-red-400 bg-red-400/10" : "text-yellow-400 bg-yellow-400/10"
                    }`}>{p.status}</span>
                    <button onClick={() => {
                      setEditProduct(p);
                      setForm({
                        title: p.title, description: p.description || "", price_per_day: p.price_per_day,
                        category: p.category, status: p.status, images: p.images || (p.image_url ? [p.image_url] : []),
                        specifications: p.specifications || "", deposit_amount: p.deposit_amount || "",
                        location_name: p.location_name || "", latitude: p.latitude, longitude: p.longitude,
                        quantity_available: String(p.quantity_available || 1)
                      });
                      setShowForm(true);
                    }} className="text-zinc-400 hover:text-zinc-900 p-1"><Edit2 size={14} /></button>
                    <button onClick={() => deleteProduct(p.id)} className="text-zinc-400 hover:text-red-400 p-1"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CLIENTS TAB */}
        {tab === "clients" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <p className="text-zinc-600 text-sm">{clients.length} client{clients.length !== 1 ? "s" : ""}</p>
              <button
                onClick={() => setShowClientForm(true)}
                className="px-4 py-2 bg-[#2E5BFF] text-white text-xs font-medium rounded-lg flex items-center gap-1 hover:bg-[#2E5BFF]/80"
              >
                <Plus size={14} /> Add Client
              </button>
            </div>

            <AnimatePresence>
              {showClientForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white border border-zinc-200 rounded-xl p-5 mb-6 overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-zinc-900 font-bold text-sm">Register Client</h3>
                    <button onClick={() => setShowClientForm(false)} className="text-zinc-500 hover:text-zinc-900"><X size={16} /></button>
                  </div>
                  <div className="space-y-3">
                    <select value={clientForm.product_id} onChange={e => setClientForm(f => ({ ...f, product_id: e.target.value }))}
                      className="w-full bg-zinc-100 border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-[#2E5BFF]/30">
                      <option value="">Select Product *</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.title} ({p.quantity_available} available)</option>)}
                    </select>
                    <input value={clientForm.client_name} onChange={e => setClientForm(f => ({ ...f, client_name: e.target.value }))}
                      placeholder="Client Name *" className="w-full bg-zinc-100 border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#2E5BFF]/30" />
                    <input value={clientForm.client_phone} onChange={e => setClientForm(f => ({ ...f, client_phone: e.target.value }))}
                      placeholder="Client Phone" className="w-full bg-zinc-100 border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#2E5BFF]/30" />
                    <input value={clientForm.client_email} onChange={e => setClientForm(f => ({ ...f, client_email: e.target.value }))}
                      placeholder="Client Email" className="w-full bg-zinc-100 border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#2E5BFF]/30" />
                    <textarea value={clientForm.notes} onChange={e => setClientForm(f => ({ ...f, notes: e.target.value }))}
                      placeholder="Notes..." rows={2} className="w-full bg-zinc-100 border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#2E5BFF]/30 resize-none" />
                    <button onClick={addClient} disabled={saving}
                      className="px-6 py-2.5 bg-[#2E5BFF] text-white text-xs font-medium rounded-lg hover:bg-[#2E5BFF]/80 flex items-center gap-1 disabled:opacity-50">
                      {saving ? <Loader2 size={12} className="animate-spin" /> : <UserCheck size={12} />} Register Client
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              {clients.length === 0 ? (
                <div className="text-center py-16">
                  <Users size={32} className="text-zinc-300 mx-auto mb-3" />
                  <p className="text-zinc-400 text-sm">No clients registered yet.</p>
                </div>
              ) : clients.map(c => (
                <div key={c.id} className={`bg-white border rounded-xl p-4 ${c.status === "Dismissed" ? "border-red-500/10 opacity-60" : "border-zinc-200"}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${c.status === "Active" ? "bg-[#00E676]/10" : "bg-red-400/10"}`}>
                      {c.status === "Active" ? <UserCheck size={16} className="text-[#00E676]" /> : <UserX size={16} className="text-red-400" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-zinc-900 font-medium text-sm">{c.client_name}</p>
                      <p className="text-zinc-400 text-xs">{c.product_title}</p>
                      {c.client_phone && <p className="text-zinc-300 text-xs">{c.client_phone}</p>}
                    </div>
                    <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded shrink-0 ${
                      c.status === "Active" ? "text-[#00E676] bg-[#00E676]/10" : "text-red-400 bg-red-400/10"
                    }`}>{c.status}</span>
                    {c.status === "Active" ? (
                      <button onClick={() => dismissClient(c)} className="text-zinc-400 hover:text-red-400 text-xs px-2 py-1">Dismiss</button>
                    ) : (
                      <button onClick={() => reactivateClient(c)} className="text-zinc-400 hover:text-[#00E676] text-xs px-2 py-1">Reactivate</button>
                    )}
                  </div>
                  {c.notes && <p className="text-zinc-400 text-xs mt-2 pl-13">{c.notes}</p>}
                  </div>
                  ))}
                  </div>
                  </div>
                  )}

                  {/* TRANSACTIONS TAB */}
                  {tab === "transactions" && (
                  <div>
                  <p className="text-zinc-600 text-sm mb-6">Completed rent transactions — rate your buyers here</p>
                  <div className="space-y-2">
                  {payments.filter(p => p.payment_type === "Rent" && p.status === "Completed").length === 0 ? (
                  <div className="text-center py-16">
                  <MessageSquare size={32} className="text-zinc-300 mx-auto mb-3" />
                  <p className="text-zinc-400 text-sm">No completed transactions yet.</p>
                  </div>
                  ) : (
                  payments.filter(p => p.payment_type === "Rent" && p.status === "Completed").map(p => (
                  <div key={p.id} className="bg-white border border-zinc-200 rounded-xl p-4">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-[#00E676]/10 rounded-full flex items-center justify-center shrink-0">
                       <Star size={16} className="text-[#00E676]" />
                     </div>
                     <div className="min-w-0 flex-1">
                       <p className="text-zinc-900 font-medium text-sm">{p.product_title}</p>
                       <p className="text-zinc-400 text-xs">{moment(p.created_date).format("DD MMM YYYY")} · KSH {p.amount?.toFixed(2)}</p>
                     </div>
                     {buyerRatings[p.id] ? (
                       <div className="flex items-center gap-2 shrink-0">
                         <RatingStars value={buyerRatings[p.id].rating} readOnly size={14} />
                         <span className="text-zinc-400 text-xs">{buyerRatings[p.id].review}</span>
                       </div>
                     ) : (
                       <button
                         onClick={() => setShowRateBuyerModal(p)}
                         className="text-[#FFD700] text-xs font-medium hover:underline flex items-center gap-1 shrink-0"
                       >
                         <Star size={12} /> Rate Buyer
                       </button>
                     )}
                   </div>
                  </div>
                  ))
                  )}
                  </div>
                  </div>
                  )}
                  </div>
                  <CommandBar />

                  {showRateBuyerModal && (
                  <RatingModal
                  raterId={user.id}
                  raterName={seller.business_name}
                  ratedId={showRateBuyerModal.client_id}
                  ratedName="Buyer"
                  ratedRole="buyer"
                  productId={showRateBuyerModal.product_id}
                  productTitle={showRateBuyerModal.product_title}
                  paymentId={showRateBuyerModal.id}
                  onClose={() => setShowRateBuyerModal(null)}
                  onSubmitted={async () => {
                  setShowRateBuyerModal(null);
                  await loadData();
                  }}
                  />
                  )}
                  </div>
                  );
                  }
