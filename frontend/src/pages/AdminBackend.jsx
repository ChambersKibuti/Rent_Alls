import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, X, Loader2, Trash2, Bell, AlertCircle, MessageSquare, Package, Store, CreditCard, TrendingUp } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import moment from "moment";
import AdminLayout from "@/components/admin/AdminLayout";
import ProductsTab from "@/components/admin/ProductsTab";
import SellersTab from "@/components/admin/SellersTab";
import PaymentsTab from "@/components/admin/PaymentsTab";
import PlatformConfigTab from "@/components/admin/PlatformConfigTab";
import { computeTotalSales } from "@/lib/subscriptionUtils";

const emptyNotice = { title: "", message: "", priority: "Normal", is_active: true, product_id: "" };

export default function AdminBackend() {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  const [products, setProducts] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [notices, setNotices] = useState([]);
  const [concerns, setConcerns] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);

  const [showNoticeForm, setShowNoticeForm] = useState(false);
  const [noticeForm, setNoticeForm] = useState(emptyNotice);
  const [replyingConcern, setReplyingConcern] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const me = await base44.auth.me();
      setUser(me);
      const [prods, sels, pays, nots, concs, msgs] = await Promise.all([
        base44.entities.Product.list("-created_date", 200),
        base44.entities.Seller.list("-created_date", 200),
        base44.entities.Payment.list("-created_date", 200),
        base44.entities.Notice.list("-created_date", 50),
        base44.entities.Concern.list("-created_date", 50),
        base44.entities.ChatMessage.list("-created_date", 100),
      ]);
      setProducts(prods);
      setSellers(sels);
      setPayments(pays);
      setNotices(nots);
      setConcerns(concs);
      setChatMessages(msgs);
    } catch (e) {}
    setLoading(false);
  };

  const saveNotice = async () => {
    if (!noticeForm.title || !noticeForm.message) return;
    setSaving(true);
    try {
      await base44.entities.Notice.create(noticeForm);
      toast({ title: "Notice published" });
      setShowNoticeForm(false);
      setNoticeForm(emptyNotice);
      await loadAll();
    } catch (e) {}
    setSaving(false);
  };

  const deleteNotice = async (id) => {
    try {
      await base44.entities.Notice.delete(id);
      await loadAll();
    } catch (e) {}
  };

  const replyConcern = async (concern) => {
    if (!replyText.trim()) return;
    setSaving(true);
    try {
      await base44.entities.Concern.update(concern.id, { admin_reply: replyText, status: "Resolved" });
      toast({ title: "Reply sent" });
      setReplyingConcern(null);
      setReplyText("");
      await loadAll();
    } catch (e) {}
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#2E5BFF]" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <p className="text-zinc-500">Admin access required.</p>
      </div>
    );
  }

  const totalCommission = payments
    .filter((p) => p.payment_type === "Commission" && p.status === "Completed")
    .reduce((s, p) => s + (p.commission_amount || p.amount || 0), 0);
  const totalRent = payments
    .filter((p) => p.payment_type === "Rent" && p.status === "Completed")
    .reduce((s, p) => s + (p.rental_amount || p.amount || 0), 0);
  const activeSellers = sellers.filter((s) => s.status === "Active").length;

  const stats = [
    { label: "Total Products", value: products.length, icon: Package, color: "text-[#2E5BFF]" },
    { label: "Active Sellers", value: activeSellers, icon: Store, color: "text-[#00E676]" },
    { label: "Commission Revenue", value: `KSH ${totalCommission.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: TrendingUp, color: "text-[#FF9800]" },
    { label: "Rent Routed", value: `KSH ${totalRent.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: CreditCard, color: "text-[#00E676]" },
  ];

  return (
    <AdminLayout activeTab={tab} onTabChange={setTab}>
      {tab === "overview" && (
        <div>
          <h2 className="text-zinc-900 font-bold text-xl mb-6">Dashboard Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {stats.map((s) => (
              <div key={s.label} className="bg-white border border-zinc-200 rounded-2xl p-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-zinc-100">
                  <s.icon size={18} className={s.color} />
                </div>
                <p className="text-zinc-500 text-xs uppercase tracking-widest">{s.label}</p>
                <p className="text-zinc-900 font-black text-xl mt-1">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-zinc-200 rounded-2xl p-5">
              <h3 className="text-zinc-900 font-bold text-sm mb-4">Recent Payments</h3>
              <div className="space-y-2">
                {payments.slice(0, 5).map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-xs">
                    <span className="text-zinc-600 truncate">{p.product_title}</span>
                    <span className={p.payment_type === "Commission" ? "text-[#FF9800]" : "text-[#00E676]"}>
                      KSH {(p.payment_type === "Rent" ? p.rental_amount || p.amount : p.commission_amount || p.amount).toFixed(2)}
                    </span>
                  </div>
                ))}
                {payments.length === 0 && <p className="text-zinc-400 text-xs">No payments yet.</p>}
              </div>
            </div>
            <div className="bg-white border border-zinc-200 rounded-2xl p-5">
              <h3 className="text-zinc-900 font-bold text-sm mb-4">Top Sellers by Sales</h3>
              <div className="space-y-2">
                {sellers
                  .map((s) => ({ ...s, sales: computeTotalSales(s.id, payments) }))
                  .sort((a, b) => b.sales - a.sales)
                  .slice(0, 5)
                  .map((s) => (
                    <div key={s.id} className="flex items-center justify-between text-xs">
                      <span className="text-zinc-600 truncate">{s.business_name}</span>
                      <span className="text-[#00E676]">KSH {s.sales.toLocaleString()}</span>
                    </div>
                  ))}
                {sellers.length === 0 && <p className="text-zinc-400 text-xs">No sellers yet.</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "products" && <ProductsTab products={products} onReload={loadAll} />}

      {tab === "sellers" && <SellersTab payments={payments} />}

      {tab === "payments" && <PaymentsTab />}

      {tab === "config" && <PlatformConfigTab />}

      {tab === "notices" && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#2E5BFF]/10 rounded-xl flex items-center justify-center">
                <Bell size={20} className="text-[#2E5BFF]" />
              </div>
              <h2 className="text-zinc-900 font-bold text-lg">Notices ({notices.length})</h2>
            </div>
            <button onClick={() => { setShowNoticeForm(true); setNoticeForm(emptyNotice); }}
              className="px-4 py-2 bg-[#2E5BFF] text-white text-xs font-medium rounded-lg flex items-center gap-1 hover:bg-[#2E5BFF]/80">
              <Plus size={14} /> Post Notice
            </button>
          </div>

          {showNoticeForm && (
            <div className="bg-white border border-zinc-200 rounded-xl p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-zinc-900 font-bold text-sm">New Notice</h3>
                <button onClick={() => setShowNoticeForm(false)} className="text-zinc-500 hover:text-zinc-900"><X size={16} /></button>
              </div>
              <div className="space-y-3">
                <input value={noticeForm.title} onChange={(e) => setNoticeForm((f) => ({ ...f, title: e.target.value }))} placeholder="Notice Title"
                  className="w-full bg-zinc-100 border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#2E5BFF]/30" />
                <textarea value={noticeForm.message} onChange={(e) => setNoticeForm((f) => ({ ...f, message: e.target.value }))} placeholder="Message..." rows={3}
                  className="w-full bg-zinc-100 border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#2E5BFF]/30 resize-none" />
                <select value={noticeForm.priority} onChange={(e) => setNoticeForm((f) => ({ ...f, priority: e.target.value }))}
                  className="bg-zinc-100 border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-[#2E5BFF]/30">
                  {["Normal", "Urgent", "Featured"].map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <button onClick={saveNotice} disabled={saving}
                  className="px-6 py-2.5 bg-[#2E5BFF] text-white text-xs font-medium rounded-lg hover:bg-[#2E5BFF]/80 flex items-center gap-1 disabled:opacity-50">
                  {saving ? <Loader2 size={12} className="animate-spin" /> : <Bell size={12} />} Publish
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {notices.map((n) => (
              <div key={n.id} className="bg-white border border-zinc-200 rounded-xl p-4 flex items-start gap-3">
                <Bell size={16} className={n.priority === "Urgent" ? "text-red-400 mt-0.5" : n.priority === "Featured" ? "text-[#2E5BFF] mt-0.5" : "text-[#00E676] mt-0.5"} />
                <div className="min-w-0 flex-1">
                  <p className="text-zinc-900 font-medium text-sm">{n.title}</p>
                  <p className="text-zinc-500 text-xs mt-0.5">{n.message}</p>
                  <p className="text-zinc-300 text-[10px] mt-1">{moment(n.created_date).format("DD MMM YYYY")}</p>
                </div>
                <button onClick={() => deleteNotice(n.id)} className="text-zinc-400 hover:text-red-400 p-1 shrink-0"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "concerns" && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#2E5BFF]/10 rounded-xl flex items-center justify-center">
              <AlertCircle size={20} className="text-[#2E5BFF]" />
            </div>
            <h2 className="text-zinc-900 font-bold text-lg">Concerns ({concerns.length})</h2>
          </div>
          <div className="space-y-3">
            {concerns.length === 0 ? (
              <div className="text-center py-16"><p className="text-zinc-400 text-sm">No concerns raised yet.</p></div>
            ) : concerns.map((c) => (
              <div key={c.id} className="bg-white border border-zinc-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="text-zinc-900 font-medium text-sm">{c.subject}</p>
                    <p className="text-zinc-400 text-xs">{c.product_title && `${c.product_title} · `}{moment(c.created_date).format("DD MMM YYYY")}</p>
                  </div>
                </div>
                <p className="text-zinc-600 text-sm mb-3">{c.message}</p>
                {c.admin_reply && (
                  <div className="bg-[#00E676]/5 rounded-lg p-3 mb-3">
                    <p className="text-[10px] text-[#00E676] uppercase tracking-widest font-bold mb-1">Your Reply</p>
                    <p className="text-zinc-700 text-sm">{c.admin_reply}</p>
                  </div>
                )}
                {!c.admin_reply && (
                  replyingConcern === c.id ? (
                    <div className="flex gap-2">
                      <input value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Type reply..."
                        className="flex-1 bg-zinc-100 border border-zinc-300 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#2E5BFF]/30" />
                      <button onClick={() => replyConcern(c)} disabled={saving}
                        className="px-4 py-2 bg-[#00E676] text-black text-xs font-bold rounded-lg hover:bg-[#00E676]/80 disabled:opacity-50">Reply</button>
                      <button onClick={() => { setReplyingConcern(null); setReplyText(""); }}
                        className="px-3 py-2 text-zinc-500 text-xs">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setReplyingConcern(c.id)} className="text-[#2E5BFF] text-xs font-medium hover:underline">Reply</button>
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "chat" && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#2E5BFF]/10 rounded-xl flex items-center justify-center">
              <MessageSquare size={20} className="text-[#2E5BFF]" />
            </div>
            <h2 className="text-zinc-900 font-bold text-lg">Chat Messages ({chatMessages.length})</h2>
          </div>
          <div className="space-y-2">
            {chatMessages.length === 0 ? (
              <div className="text-center py-16"><p className="text-zinc-400 text-sm">No chat messages yet.</p></div>
            ) : chatMessages.map((msg) => (
              <div key={msg.id} className="bg-white border border-zinc-200 rounded-xl p-4 flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.is_admin ? "bg-[#00E676]/10" : "bg-[#2E5BFF]/10"}`}>
                  <MessageSquare size={14} className={msg.is_admin ? "text-[#00E676]" : "text-[#2E5BFF]"} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-zinc-900 text-xs font-medium">{msg.sender_name || "User"}</p>
                    {msg.is_admin && <span className="text-[8px] text-[#00E676] uppercase tracking-widest font-bold bg-[#00E676]/10 px-1.5 py-0.5 rounded">Admin</span>}
                    <p className="text-zinc-300 text-[10px]">{moment(msg.created_date).format("DD MMM, HH:mm")}</p>
                  </div>
                  <p className="text-zinc-600 text-sm mt-1">{msg.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}