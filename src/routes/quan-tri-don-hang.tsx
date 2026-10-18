import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Page, SampleNotice } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { vnd } from "@/data/sample";

type OrderRow = { id: string; buyer_id: string; full_name: string; phone: string; address: string; status: string; payment_method: string; payment_status: string; total: number; buyer_note: string; created_at: string };
type ItemRow = { id: string; order_id: string; name: string; price: number; qty: number; seller_id: string | null };
const statuses = [
  { value: "pending", label: "Chờ xác nhận" }, { value: "confirmed", label: "Đã xác nhận" },
  { value: "shipping", label: "Đang giao" }, { value: "completed", label: "Hoàn thành" },
  { value: "cancelled", label: "Đã hủy" },
];

export const Route = createFileRoute("/quan-tri-don-hang")({
  head: () => ({ meta: [{ title: "Quản trị đơn hàng — Chợ Xanh Việt" }] }),
  component: OrderAdmin,
});

function OrderAdmin() {
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    const { data, error: queryError } = await supabase.from("orders")
      .select("id,buyer_id,full_name,phone,address,status,payment_method,payment_status,total,buyer_note,created_at")
      .order("created_at", { ascending: false }).limit(300);
    if (queryError) throw queryError;
    const rows = (data ?? []) as OrderRow[];
    setOrders(rows);
    if (rows.length) {
      const { data: itemData, error: itemError } = await supabase.from("order_items")
        .select("id,order_id,name,price,qty,seller_id").in("order_id", rows.map(o => o.id));
      if (itemError) throw itemError;
      setItems((itemData ?? []) as ItemRow[]);
    } else setItems([]);
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
        if (active) setError(caught instanceof Error ? caught.message : "Không tải được đơn hàng.");
      } finally { if (active) setChecking(false); }
    };
    void check();
    return () => { active = false; };
  }, [load]);

  const updateOrder = async (id: string, status: string) => {
    setBusyId(id); setError(""); setNotice("");
    try {
      const { error: updateError } = await supabase.from("orders").update({ status }).eq("id", id);
      if (updateError) throw updateError;
      setOrders(current => current.map(o => o.id === id ? { ...o, status } : o));
      setNotice("Đã cập nhật trạng thái đơn hàng.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không cập nhật được đơn hàng.");
    } finally { setBusyId(""); }
  };

  const updatePayment = async (id: string, payment_status: string) => {
    setBusyId(id); setError(""); setNotice("");
    try {
      const { error: updateError } = await supabase.from("orders").update({ payment_status }).eq("id", id);
      if (updateError) throw updateError;
      setOrders(current => current.map(o => o.id === id ? { ...o, payment_status } : o));
      setNotice(payment_status === "paid" ? "Đã cập nhật trạng thái thanh toán. Chỉ xác nhận sau khi kiểm tra giao dịch thực tế." : "Đã cập nhật trạng thái thanh toán.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không cập nhật được thanh toán.");
    } finally { setBusyId(""); }
  };

  return <Page title="Quản trị · Đơn hàng">
    <SampleNotice>Trang này dành cho quản trị viên. Không đánh dấu đã thanh toán nếu chưa xác minh giao dịch. Hiện chưa kết nối cổng thanh toán tự động.</SampleNotice>
    {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
    {notice && <p role="status" className="rounded-lg bg-success/10 p-3 text-sm text-success">{notice}</p>}
    {checking ? <div className="card p-5 text-center">Đang kiểm tra quyền quản trị…</div> : !authorized ? (
      <section className="card space-y-3 p-5"><h2 className="font-bold">Không có quyền truy cập</h2><p className="text-sm text-muted-foreground">Đăng nhập bằng tài khoản đã được chủ website cấp vai trò admin.</p><Link to="/tai-khoan" className="btn-primary">Đăng nhập</Link></section>
    ) : orders.length === 0 ? <div className="card p-8 text-center"><p className="font-semibold">Chưa có đơn hàng nào</p><p className="mt-1 text-sm text-muted-foreground">Đơn hàng sẽ hiển thị ở đây sau khi khách đặt hàng bằng sản phẩm thật.</p></div> :
      <div className="space-y-4">{orders.map(order => <article key={order.id} className="card space-y-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-xs text-muted-foreground">Mã đơn hàng</p><p className="break-all font-semibold">{order.id}</p></div><p className="font-bold text-primary">{vnd(Number(order.total))}</p></div>
        <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleString("vi-VN")}</p>
        <div className="divide-y rounded-lg border">{items.filter(i => i.order_id === order.id).map(i => <div key={i.id} className="flex justify-between gap-3 p-3 text-sm"><span>{i.name} × {i.qty}</span><strong>{vnd(Number(i.price) * i.qty)}</strong></div>)}</div>
        <div className="space-y-1 text-sm"><p><strong>Khách hàng:</strong> {order.full_name} · {order.phone}</p><p><strong>Địa chỉ:</strong> {order.address}</p>{order.buyer_note && <p><strong>Ghi chú:</strong> {order.buyer_note}</p>}</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1"><span className="text-sm font-semibold">Trạng thái đơn</span><select className="field" value={order.status} disabled={busyId === order.id} onChange={e => void updateOrder(order.id, e.target.value)}>{statuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select></label>
          <label className="block space-y-1"><span className="text-sm font-semibold">Trạng thái thanh toán</span><select className="field" value={order.payment_status} disabled={busyId === order.id} onChange={e => void updatePayment(order.id, e.target.value)}><option value="unpaid">Chưa thanh toán</option><option value="pending">Đang chờ xác minh</option><option value="paid">Đã thanh toán (đã xác minh)</option><option value="failed">Thanh toán thất bại</option><option value="refunded">Đã hoàn tiền</option></select></label>
        </div>
      </article>)}</div>}
  </Page>;
}
