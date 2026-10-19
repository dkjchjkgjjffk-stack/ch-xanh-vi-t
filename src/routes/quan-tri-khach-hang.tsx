import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Page } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { vnd } from "@/data/sample";

type Customer = {
  id: string; full_name: string; phone: string; phone_normalized: string;
  customer_type: "retail" | "wholesale"; source: string; address: string; notes: string;
  marketing_consent: boolean; consent_recorded_at: string | null; created_at: string;
};
type Order = { id: string; full_name: string; phone: string; total: number; status: string; created_at: string };
type Interaction = { id: string; customer_id: string; channel: string; interaction_type: string; note: string; created_at: string };
const sourceLabels: Record<string, string> = { website: "Website", store: "Cửa hàng", facebook: "Facebook", zalo: "Zalo", phone: "Điện thoại", import: "Nhập file", other: "Khác" };
const channelOptions = [{ value: "store", label: "Cửa hàng" }, { value: "phone", label: "Điện thoại" }, { value: "facebook", label: "Facebook" }, { value: "zalo", label: "Zalo" }, { value: "website", label: "Website" }, { value: "other", label: "Khác" }];
const typeLabels: Record<string, string> = { retail: "Khách lẻ", wholesale: "Khách sỉ" };
const digits = (value: string) => {
  const n = value.replace(/[^0-9]/g, "");
  return n.startsWith("84") ? "0" + n.slice(2) : n;
};
const csvCell = (value: unknown) => '"' + String(value ?? "").replace(/"/g, '""') + '"';

export const Route = createFileRoute("/quan-tri-khach-hang")({
  head: () => ({ meta: [{ title: "CRM khách hàng — Hải Tây Phát" }] }),
  component: CustomerAdmin,
});

function CustomerAdmin() {
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [source, setSource] = useState("store");
  const [customerType, setCustomerType] = useState<"retail" | "wholesale">("retail");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selected, setSelected] = useState("");
  const [interactionNote, setInteractionNote] = useState("");
  const [interactionChannel, setInteractionChannel] = useState("phone");

  const load = useCallback(async () => {
    const [customerResult, orderResult, interactionResult] = await Promise.all([
      supabase.from("customers").select("*").order("created_at", { ascending: false }).limit(2000),
      supabase.from("orders").select("id,full_name,phone,total,status,created_at").order("created_at", { ascending: false }).limit(5000),
      supabase.from("customer_interactions").select("id,customer_id,channel,interaction_type,note,created_at").order("created_at", { ascending: false }).limit(2000),
    ]);
    if (customerResult.error) throw customerResult.error;
    if (orderResult.error) throw orderResult.error;
    if (interactionResult.error) throw interactionResult.error;
    setCustomers((customerResult.data ?? []) as Customer[]);
    setOrders((orderResult.data ?? []) as Order[]);
    setInteractions((interactionResult.data ?? []) as Interaction[]);
  }, []);

  useEffect(() => {
    let active = true;
    const check = async () => {
      try {
        const { data, error: authError } = await supabase.auth.getUser();
        if (authError || !data.user) return;
        const { data: admin, error: roleError } = await supabase.rpc("has_role", { _user_id: data.user.id, _role: "admin" });
        if (roleError) throw roleError;
        if (!active) return;
        setAuthorized(Boolean(admin));
        if (admin) await load();
      } catch (caught) {
        if (active) setError(caught instanceof Error ? caught.message : "Không tải được dữ liệu khách hàng.");
      } finally { if (active) setChecking(false); }
    };
    void check();
    return () => { active = false; };
  }, [load]);

  const orderStats = useMemo(() => {
    const stats = new Map<string, { count: number; total: number; last: string | null }>();
    for (const order of orders) {
      const key = digits(order.phone);
      if (!key) continue;
      const current = stats.get(key) ?? { count: 0, total: 0, last: null };
      if (order.status !== "cancelled") {
        current.count += 1;
        current.total += Number(order.total || 0);
        if (!current.last || order.created_at > current.last) current.last = order.created_at;
      }
      stats.set(key, current);
    }
    return stats;
  }, [orders]);

  const visibleCustomers = useMemo(() => customers.filter(c => {
    const q = query.trim().toLocaleLowerCase("vi");
    const matchesQuery = !q || c.full_name.toLocaleLowerCase("vi").includes(q) || c.phone.includes(query.trim()) || c.address.toLocaleLowerCase("vi").includes(q);
    return matchesQuery && (typeFilter === "all" || c.customer_type === typeFilter);
  }), [customers, query, typeFilter]);

  const saveCustomer = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      const cleanPhone = phone.trim();
      const payload = {
        full_name: fullName.trim(), phone: cleanPhone, customer_type: customerType, source,
        address: address.trim(), notes: notes.trim(), marketing_consent: marketingConsent,
        consent_recorded_at: marketingConsent ? new Date().toISOString() : null,
      };
      const { data, error: saveError } = await supabase.from("customers").insert(payload).select("*").single();
      if (saveError) {
        if (saveError.code === "23505") throw new Error("Số điện thoại này đã có trong hệ thống. Hãy tìm số đó để dùng hồ sơ cũ.");
        throw saveError;
      }
      setCustomers(current => [data as Customer, ...current]);
      setFullName(""); setPhone(""); setAddress(""); setNotes(""); setMarketingConsent(false);
      setNotice("Đã lưu khách hàng. Số điện thoại được chuẩn hóa để hạn chế hồ sơ trùng.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không lưu được khách hàng.");
    } finally { setBusy(false); }
  };

  const addInteraction = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const { data, error: saveError } = await supabase.from("customer_interactions")
        .insert({ customer_id: selected, channel: interactionChannel, interaction_type: "note", note: interactionNote.trim() })
        .select("id,customer_id,channel,interaction_type,note,created_at").single();
      if (saveError) throw saveError;
      setInteractions(current => [data as Interaction, ...current]);
      setInteractionNote("");
      setNotice("Đã lưu lịch sử chăm sóc khách hàng.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không lưu được ghi chú.");
    } finally { setBusy(false); }
  };

  const exportCsv = () => {
    const header = ["Tên khách hàng","Điện thoại","Loại khách","Nguồn","Địa chỉ","Số đơn","Tổng giá trị đơn","Lần mua gần nhất","Cho phép nhận tin"];
    const rows = visibleCustomers.map(c => {
      const stat = orderStats.get(c.phone_normalized) ?? { count: 0, total: 0, last: null };
      return [c.full_name,c.phone,typeLabels[c.customer_type],sourceLabels[c.source],c.address,stat.count,stat.total,stat.last ? new Date(stat.last).toLocaleDateString("vi-VN") : "",c.marketing_consent ? "Có" : "Không"];
    });
    const blob = new Blob(["\\uFEFF" + [header, ...rows].map(row => row.map(csvCell).join(",")).join("\\r\\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "hai-tay-phat-khach-hang.csv"; a.click(); URL.revokeObjectURL(url);
  };

  const chosen = customers.find(c => c.id === selected);
  const chosenInteractions = interactions.filter(i => i.customer_id === selected);
  const retailCount = customers.filter(c => c.customer_type === "retail").length;
  const wholesaleCount = customers.filter(c => c.customer_type === "wholesale").length;

  return <Page title="CRM · Khách hàng">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <p className="max-w-2xl text-sm text-muted-foreground">Quản lý khách từ website, cửa hàng, Facebook, Zalo và điện thoại trong một nơi. Chỉ tài khoản admin được xem dữ liệu.</p>
      <div className="flex flex-wrap gap-2"><Link to="/quan-tri-don-hang" className="btn-secondary">Quản trị đơn hàng</Link><button type="button" onClick={exportCsv} className="btn-secondary" disabled={!customers.length}>Xuất CSV</button></div>
    </div>
    {error && <p role="alert" className="mb-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
    {notice && <p role="status" className="mb-3 rounded-lg bg-success/10 p-3 text-sm text-success">{notice}</p>}
    {checking ? <div className="card p-6 text-center">Đang kiểm tra quyền quản trị…</div> : !authorized ? (
      <section className="card space-y-3 p-5"><h2 className="font-bold">Không có quyền truy cập</h2><p className="text-sm text-muted-foreground">Đăng nhập bằng tài khoản được cấp quyền admin.</p><Link to="/tai-khoan" className="btn-primary">Đăng nhập</Link></section>
    ) : <>
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="card p-4"><p className="text-sm text-muted-foreground">Tổng khách hàng</p><p className="mt-1 text-2xl font-bold">{customers.length}</p></div>
        <div className="card p-4"><p className="text-sm text-muted-foreground">Khách lẻ</p><p className="mt-1 text-2xl font-bold">{retailCount}</p></div>
        <div className="card p-4"><p className="text-sm text-muted-foreground">Khách sỉ</p><p className="mt-1 text-2xl font-bold">{wholesaleCount}</p></div>
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(300px,0.85fr)_minmax(0,1.4fr)]">
        <form onSubmit={saveCustomer} className="card space-y-3 p-4">
          <h2 className="text-lg font-bold">Thêm khách hàng</h2>
          <p className="text-xs text-muted-foreground">Chỉ nhập số điện thoại khách đã cung cấp cho ông. Mỗi số điện thoại chỉ có một hồ sơ.</p>
          <label className="block space-y-1"><span className="text-sm font-medium">Tên khách hàng *</span><input className="field" value={fullName} onChange={e => setFullName(e.target.value)} minLength={2} maxLength={150} required placeholder="Nguyễn Văn A" /></label>
          <label className="block space-y-1"><span className="text-sm font-medium">Số điện thoại *</span><input className="field" value={phone} onChange={e => setPhone(e.target.value)} required inputMode="tel" minLength={9} maxLength={30} placeholder="09xx xxx xxx" /></label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1"><span className="text-sm font-medium">Nhóm khách</span><select className="field" value={customerType} onChange={e => setCustomerType(e.target.value as "retail" | "wholesale")}><option value="retail">Khách lẻ</option><option value="wholesale">Khách sỉ</option></select></label>
            <label className="block space-y-1"><span className="text-sm font-medium">Nguồn khách</span><select className="field" value={source} onChange={e => setSource(e.target.value)}>{Object.entries(sourceLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          </div>
          <label className="block space-y-1"><span className="text-sm font-medium">Địa chỉ giao hàng</span><input className="field" value={address} onChange={e => setAddress(e.target.value)} maxLength={500} placeholder="Thôn/xã, huyện, tỉnh" /></label>
          <label className="block space-y-1"><span className="text-sm font-medium">Ghi chú</span><textarea className="field min-h-20" value={notes} onChange={e => setNotes(e.target.value)} maxLength={3000} placeholder="Mặt hàng hay mua, lịch giao, điều cần nhớ…" /></label>
          <label className="flex items-start gap-2 text-sm"><input className="mt-1" type="checkbox" checked={marketingConsent} onChange={e => setMarketingConsent(e.target.checked)} /><span>Khách đồng ý nhận thông tin khuyến mãi qua điện thoại/tin nhắn.</span></label>
          <button type="submit" className="btn-primary w-full" disabled={busy}>{busy ? "Đang lưu…" : "Lưu khách hàng"}</button>
        </form>

        <section className="space-y-3">
          <div className="card space-y-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-bold">Danh sách khách</h2><span className="text-xs text-muted-foreground">{visibleCustomers.length} khách</span></div>
            <input className="field" value={query} onChange={e => setQuery(e.target.value)} placeholder="Tìm tên, số điện thoại hoặc địa chỉ…" />
            <select className="field" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}><option value="all">Tất cả khách</option><option value="retail">Khách lẻ</option><option value="wholesale">Khách sỉ</option></select>
          </div>
          {visibleCustomers.length === 0 ? <div className="card p-6 text-center text-sm text-muted-foreground">Chưa có khách phù hợp. Thêm khách mới ở khung bên trái.</div> : visibleCustomers.map(c => {
            const stat = orderStats.get(c.phone_normalized) ?? { count: 0, total: 0, last: null };
            return <article key={c.id} className={"card space-y-3 p-4 " + (selected === c.id ? "ring-2 ring-primary" : "")}>
              <div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-bold">{c.full_name}</h3><a className="text-sm text-primary underline" href={"tel:" + c.phone}>{c.phone}</a><p className="text-xs text-muted-foreground">{typeLabels[c.customer_type]} · {sourceLabels[c.source]} · Thêm {new Date(c.created_at).toLocaleDateString("vi-VN")}</p></div><button type="button" className="btn-secondary" onClick={() => setSelected(selected === c.id ? "" : c.id)}>{selected === c.id ? "Đóng" : "Lịch sử chăm sóc"}</button></div>
              {c.address && <p className="text-sm">{c.address}</p>}
              <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/40 p-3 text-sm sm:grid-cols-3"><div><p className="text-xs text-muted-foreground">Đơn hàng</p><strong>{stat.count}</strong></div><div><p className="text-xs text-muted-foreground">Tổng giá trị đơn</p><strong>{vnd(stat.total)}</strong></div><div><p className="text-xs text-muted-foreground">Mua gần nhất</p><strong>{stat.last ? new Date(stat.last).toLocaleDateString("vi-VN") : "Chưa có đơn"}</strong></div></div>
              {c.notes && <p className="whitespace-pre-wrap text-sm text-muted-foreground">{c.notes}</p>}
              <p className="text-xs text-muted-foreground">{c.marketing_consent ? "Đã đồng ý nhận khuyến mãi" : "Chưa ghi nhận đồng ý nhận khuyến mãi"}</p>
              {selected === c.id && <div className="space-y-3 border-t pt-3">
                <form onSubmit={addInteraction} className="space-y-2">
                  <label className="block space-y-1"><span className="text-sm font-medium">Kênh liên hệ</span><select className="field" value={interactionChannel} onChange={e => setInteractionChannel(e.target.value)}>{channelOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></label>
                  <textarea className="field min-h-20" value={interactionNote} onChange={e => setInteractionNote(e.target.value)} required maxLength={2000} placeholder="Ví dụ: đã gọi báo giá, khách hẹn lấy hàng thứ Sáu…" />
                  <button type="submit" className="btn-primary" disabled={busy || !interactionNote.trim()}>{busy ? "Đang lưu…" : "Lưu ghi chú chăm sóc"}</button>
                </form>
                <div className="space-y-2">{chosen?.id === c.id && chosenInteractions.map(i => <div key={i.id} className="rounded-lg border p-3 text-sm"><p>{i.note}</p><p className="mt-1 text-xs text-muted-foreground">{sourceLabels[i.channel] ?? i.channel} · {new Date(i.created_at).toLocaleString("vi-VN")}</p></div>)}</div>
              </div>}
            </article>;
          })}
        </section>
      </div>
    </>}
  </Page>;
}
