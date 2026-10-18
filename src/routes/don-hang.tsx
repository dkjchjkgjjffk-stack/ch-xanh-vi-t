import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Page, SampleNotice } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { vnd } from "@/data/sample";

type OrderRow = {
  id: string; full_name: string; phone: string; address: string; status: string;
  payment_method: string; payment_status: string; total: number; buyer_note: string; created_at: string;
};
type ItemRow = { id: string; order_id: string; name: string; price: number; qty: number };

const statusLabel: Record<string, string> = {
  pending: "Chờ người bán xác nhận", confirmed: "Đã xác nhận", shipping: "Đang giao hàng",
  completed: "Hoàn thành", cancelled: "Đã hủy",
};

export const Route = createFileRoute("/don-hang")({
  head: () => ({ meta: [
    { title: "Đơn hàng của tôi — Chợ Xanh Việt" },
    { name: "description", content: "Theo dõi đơn đặt hàng trên Chợ Xanh Việt." },
  ] }),
  component: MyOrders,
});

function MyOrders() {
  const [email, setEmail] = useState<string | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const { data: auth, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!auth.user) { if (active) { setEmail(null); setLoading(false); } return; }
        if (active) setEmail(auth.user.email ?? null);
        const { data, error: orderError } = await supabase.from("orders")
          .select("id,full_name,phone,address,status,payment_method,payment_status,total,buyer_note,created_at")
          .eq("buyer_id", auth.user.id).order("created_at", { ascending: false }).limit(100);
        if (orderError) throw orderError;
        const rows = (data ?? []) as OrderRow[];
        if (!active) return;
        setOrders(rows);
        if (rows.length) {
          const { data: itemData, error: itemError } = await supabase.from("order_items")
            .select("id,order_id,name,price,qty").in("order_id", rows.map(o => o.id));
          if (itemError) throw itemError;
          if (active) setItems((itemData ?? []) as ItemRow[]);
        } else setItems([]);
      } catch (caught) {
        if (active) setError(caught instanceof Error ? caught.message : "Không tải được đơn hàng.");
      } finally { if (active) setLoading(false); }
    };
    void load();
    return () => { active = false; };
  }, []);

  return <Page title="Đơn hàng của tôi">
    <SampleNotice>Đơn hàng mới mặc định chưa thanh toán. Chỉ đánh dấu đã thanh toán sau khi xác minh giao dịch thực tế.</SampleNotice>
    {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
    {loading ? <div className="card p-5 text-center" role="status">Đang tải đơn hàng…</div> : !email ? (
      <section className="card space-y-3 p-5"><h2 className="font-bold">Đăng nhập để xem đơn hàng</h2><Link to="/tai-khoan" className="btn-primary">Đăng nhập / Tạo tài khoản</Link></section>
    ) : orders.length === 0 ? (
      <section className="card space-y-3 p-6 text-center"><div className="text-5xl">📦</div><h2 className="font-bold">Bạn chưa có đơn hàng</h2><p className="text-sm text-muted-foreground">Các đơn bạn đặt sẽ xuất hiện tại đây.</p><Link to="/cua-hang" className="btn-primary">Đi đến cửa hàng</Link></section>
    ) : <div className="space-y-4">{orders.map(order => <article key={order.id} className="card space-y-3 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-xs text-muted-foreground">Mã đơn</p><p className="break-all font-semibold">{order.id}</p></div><span className="rounded-full bg-secondary px-3 py-1 text-sm font-semibold">{statusLabel[order.status] ?? order.status}</span></div>
      <p className="text-sm text-muted-foreground">Ngày đặt: {new Date(order.created_at).toLocaleString("vi-VN")}</p>
      <div className="divide-y rounded-lg border">{items.filter(item => item.order_id === order.id).map(item => <div key={item.id} className="flex justify-between gap-3 p-3 text-sm"><span>{item.name} × {item.qty}</span><strong className="shrink-0">{vnd(Number(item.price) * item.qty)}</strong></div>)}</div>
      <div className="flex justify-between gap-3 font-bold"><span>Tổng tiền hàng</span><span className="text-primary">{vnd(Number(order.total))}</span></div>
      <p className="text-sm">Thanh toán: {order.payment_status === "paid" ? "Đã thanh toán" : "Chưa thanh toán"} · Phương thức: {order.payment_method === "cod" ? "Xác nhận với người bán / khi nhận hàng" : order.payment_method}</p>
      <div className="text-sm text-muted-foreground"><p>Người nhận: {order.full_name} · {order.phone}</p><p>Địa chỉ: {order.address}</p>{order.buyer_note && <p>Ghi chú: {order.buyer_note}</p>}</div>
    </article>)}</div>}
  </Page>;
}
