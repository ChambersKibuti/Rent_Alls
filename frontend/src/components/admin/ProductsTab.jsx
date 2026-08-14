import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Upload, Loader2, Trash2, Edit2, CheckCircle2, Image as ImageIcon, MapPin, Package } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const categories = ["Tools", "Equipment", "Vehicles", "Electronics", "Furniture", "Houses", "Transport Services", "Hairdressing", "Other"];
const emptyProduct = { title: "", description: "", price_per_day: "", category: "Tools", status: "Available", images: [], specifications: "", deposit_amount: "", location_name: "", quantity_available: "1" };

export default function ProductsTab({ products, onReload }) {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState(emptyProduct);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

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
      setForm((f) => ({ ...f, images: [...(f.images || []), ...urls], image_url: f.images?.[0] || urls[0] || f.image_url }));
    } catch (e) {
      toast({ title: "Upload failed", variant: "destructive" });
    }
    setUploading(false);
  };

  const removeImage = (idx) => {
    setForm((f) => {
      const newImages = (f.images || []).filter((_, i) => i !== idx);
      return { ...f, images: newImages, image_url: newImages[0] || "" };
    });
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
      await onReload();
    } catch (e) {
      toast({ title: "Error saving product", variant: "destructive" });
    }
    setSaving(false);
  };

  const deleteProduct = async (id) => {
    try {
      await base44.entities.Product.delete(id);
      toast({ title: "Product deleted" });
      await onReload();
    } catch (e) {}
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#2E5BFF]/10 rounded-xl flex items-center justify-center">
            <Package size={20} className="text-[#2E5BFF]" />
          </div>
          <h2 className="text-zinc-900 font-bold text-lg">Products ({products.length})</h2>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditProduct(null); setForm(emptyProduct); }}
          className="px-4 py-2 bg-[#2E5BFF] text-white text-xs font-medium rounded-lg flex items-center gap-1 hover:bg-[#2E5BFF]/80"
        >
          <Plus size={14} /> Add Product
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="bg-white border border-zinc-200 rounded-xl p-5 mb-6 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-zinc-900 font-bold text-sm">{editProduct ? "Edit Product" : "New Product"}</h3>
              <button onClick={() => setShowForm(false)} className="text-zinc-500 hover:text-zinc-900"><X size={16} /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1 block">Title *</label>
                <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full bg-zinc-100 border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-[#2E5BFF]/30" />
              </div>
              <div>
                <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1 block">Category *</label>
                <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full bg-zinc-100 border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-[#2E5BFF]/30">
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1 block">Price/Day (KSH) *</label>
                <input type="number" value={form.price_per_day} onChange={(e) => setForm((f) => ({ ...f, price_per_day: e.target.value }))}
                  className="w-full bg-zinc-100 border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-[#2E5BFF]/30" />
              </div>
              <div>
                <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1 block">Quantity</label>
                <input type="number" value={form.quantity_available} onChange={(e) => setForm((f) => ({ ...f, quantity_available: e.target.value }))}
                  className="w-full bg-zinc-100 border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-[#2E5BFF]/30" />
              </div>
              <div>
                <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1 block">Deposit (KSH)</label>
                <input type="number" value={form.deposit_amount} onChange={(e) => setForm((f) => ({ ...f, deposit_amount: e.target.value }))}
                  className="w-full bg-zinc-100 border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-[#2E5BFF]/30" />
              </div>
              <div>
                <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1 block">Location</label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input value={form.location_name} onChange={(e) => setForm((f) => ({ ...f, location_name: e.target.value }))}
                    placeholder="e.g. Westlands, Nairobi"
                    className="w-full bg-zinc-100 border border-zinc-300 rounded-lg pl-10 pr-4 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#2E5BFF]/30" />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-zinc-500 uppercase tracking-widest mb-2 block">Product Images</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(form.images || []).map((img, idx) => (
                    <div key={idx} className="relative w-16 h-16 group">
                      <img src={img} alt="" className="w-full h-full object-cover rounded-lg border border-zinc-300" />
                      <button onClick={() => removeImage(idx)} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  <label className="w-16 h-16 border-2 border-dashed border-zinc-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-[#2E5BFF]/30 transition-colors">
                    {uploading ? <Loader2 size={16} className="animate-spin text-zinc-400" /> : <ImageIcon size={16} className="text-zinc-400" />}
                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1 block">Description</label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2}
                  className="w-full bg-zinc-100 border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-[#2E5BFF]/30 resize-none" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-zinc-500 uppercase tracking-widest mb-1 block">Specifications</label>
                <textarea value={form.specifications} onChange={(e) => setForm((f) => ({ ...f, specifications: e.target.value }))} rows={2}
                  className="w-full bg-zinc-100 border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-[#2E5BFF]/30 resize-none" />
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
        {products.map((p) => (
          <div key={p.id} className="bg-white border border-zinc-200 rounded-xl p-4 flex items-center gap-4">
            {p.images?.[0] || p.image_url ? (
              <img src={p.images?.[0] || p.image_url} alt={p.title} className="w-12 h-12 rounded-lg object-cover border border-zinc-300 shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                <Package size={18} className="text-zinc-300" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-zinc-900 font-medium text-sm truncate">{p.title}</p>
              <p className="text-zinc-400 text-xs">{p.category} · KSH {p.price_per_day}/day</p>
            </div>
            <span className="text-[10px] text-[#00E676] font-bold shrink-0">{p.quantity_available || 0} qty</span>
            <button onClick={() => {
              setEditProduct(p);
              setForm({
                title: p.title, description: p.description || "", price_per_day: p.price_per_day, category: p.category, status: p.status,
                images: p.images || (p.image_url ? [p.image_url] : []), specifications: p.specifications || "",
                deposit_amount: p.deposit_amount || "", location_name: p.location_name || "", quantity_available: String(p.quantity_available || 1),
              });
              setShowForm(true);
            }} className="text-zinc-400 hover:text-zinc-900 p-1"><Edit2 size={14} /></button>
            <button onClick={() => deleteProduct(p.id)} className="text-zinc-400 hover:text-red-400 p-1"><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
