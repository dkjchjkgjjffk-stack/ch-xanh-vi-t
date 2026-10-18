import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { PRODUCTS, type Product, vnd } from "@/data/sample";
import { Page, SampleNotice } from "@/components/Layout";
import { useCart } from "@/lib/cart";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/gio-hang")({
  head: () => ({ meta: [
    { title: "Giỏ hàng — Chợ Xanh Việt" },
    { name: "description", content: "Kiểm tra giỏ hàng và gửi đơn đặt vật tư nông nghiệp." },
    { property: "og:title", content: "Giỏ hàng" },
    { property: "og:description", content: "Giỏ hàng Chợ Xanh Việt." },
  ] }),
  component: Cart,
});

function Cart() {
  const { cart, setQty, clear } = useCart();
  const [liveProducts, setLiveProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [orderId, setOrderId] = useState("");

  const liveIds = useMemo(() => Object.keys(cart).filter((id) => !PRODUCTS.some((p) => p.id === id)), [cart]);
  const sampleInCart = Object.keys(cart).some((id) => PRODUCTS.some((p) => p.id === id));

  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (active) setEmail(data.user?.email ?? null);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    if (!liveIds.length) {
      setLiveProducts([]);
      setLoading(false);
      return () => { active = false; };
    }
    setLoading(true);
    void supabase.from("products")
      .select("id,name,category,price,unit,description,icon,manufacturer,registration,seller_name,seller_phone,seller_address,verify_status")
      .in("id", liveIds).eq("status", "approved").eq("is_sample", false)
      .then(({ data, error: queryError }) => {
        if (!active) return;
        if (queryError) {
          setError("Không tải được sản phẩm thật trong giỏ. Hãy thử tải lại trang.");
          setLiveProducts([]);
        } else {
          setLiveProducts((data ?? []).map((row) => ({
            id: row.id, name: row.name, category: row.category as Product["category"],
            price: Number(row.price), unit: row.unit, icon: row.icon || "📦",
            description: row.description || "", manufacturer: row.manufacturer || "Người bán chưa cung cấp",
            registration: row.registration || "Chưa cung cấp", verify: row.verify_status as Product["verify"],
            seller: { name: row.seller_name, phone: row.seller_phone, address: row.seller_address || "" },
          })));
        }
        setLoading(false);
      });
    return () => { active = false; };
  }, [liveIds]);

  const productById = new Map<string, Product>([
    ...PRODUCTS.map((p) => [p.id, p] as const),
    ...liveProducts.map((p) => [p.id, p] as const),
  ]);
  const lines = Object.entries(cart).map(([id, q]) => ({ p: productById.get(id), q }))
    .filter((line): line is { p: Product; q: number } => Boolean(line.p));
  const total = lines.reduce((sum, line) => sum + line.p.price * line.q, 0);

  const placeOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(""); setNotice(""); setBusy(true);
    try {
      if (!email) throw new Error("Bạn cần đăng nhập trước khi đặt hàng.");
      if (sampleInCart) throw new Error("Giỏ hàng còn sản phẩm mẫu. Hãy xóa sản phẩm mẫu rồi chỉ giữ sản phẩm thật đã được người bán đăng.");
      if (!lines.length || loading) throw new Error("Giỏ hàng chưa sẵn sàng. Vui lòng thử lại.");
      const { data, error: authError } = await supabase.auth.getUser();
      if (authError || !data.user) throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      const { data: newOrder, error: orderError } = await supabase.rpc("place_order", {
        _full_name: fullName.trim(),
        _phone: phone.trim(),
        _address: address.trim(),
        _items: lines.map(({ p, q }) => ({ id: p.id, qty: q })),
      });
      if (orderError) throw orderError;
      setOrderId(String(newOrder));
      setNotice("Đã tạo đơn hàng. Đơn đang chờ người bán xác nhận; hiện chưa thu tiền trực tuyến.");
      clear();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không tạo được đơn hàng. Vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page title="Giỏ hàng">
      <SampleNotice>Chỉ sản phẩm thật đã được người bán đăng và quản trị viên duyệt mới có thể đặt hàng. Giá cuối cùng được kiểm tra lại ở máy chủ.</SampleNotice>
      {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      {notice && <div role="status" className="card space-y-2 border border-success/40 p-4"><p className="font-semibold text-success">{notice}</p>{orderId && <p className="break-all text-sm">Mã đơn hàng: <strong>{orderId}</strong></p>}{orderId && <p className="text-sm text-muted-foreground">Thanh toán chưa tích hợp; vui lòng chờ người bán liên hệ để xác nhận phương thức thanh toán và giao hàng.</p>}</div>}
      {loading && <p role="status" className="text-sm text-muted-foreground">Đang tải sản phẩm trong giỏ…</p>}
      {lines.length === 0 ? (
        <div className="py-10 text-center"><div className="text-6xl" aria-hidden="true">🧺</div><p className="my-4 text-muted-foreground">{loading ? "Đang tải giỏ hàng…" : "Giỏ hàng đang trống hoặc sản phẩm không còn được đăng bán."}</p><Link to="/cua-hang" className="btn-primary">Khám phá cửa hàng</Link></div>
      ) : <>
        <div className="card divide-y">
          {lines.map(({ p, q }) => <div key={p.id} className="flex items-center gap-3 p-3">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-secondary text-3xl" aria-hidden="true">{p.icon}</div>
            <div className="min-w-0 flex-1"><Link to="/cua-hang/$id" params={{ id: p.id }} className="font-semibold leading-snug hover:underline">{p.name}</Link><div className="text-sm text-muted-foreground">{vnd(p.price)} / {p.unit}</div><div className="font-bold text-primary">{vnd(p.price * q)}</div></div>
            <div className="flex items-center gap-1"><button type="button" className="btn-outline min-h-10 w-10 px-0" onClick={() => setQty(p.id, q - 1)} aria-label={`Giảm số lượng ${p.name}`}>−</button><span className="w-6 text-center font-bold">{q}</span><button type="button" className="btn-outline min-h-10 w-10 px-0" onClick={() => setQty(p.id, q + 1)} aria-label={`Tăng số lượng ${p.name}`}>+</button></div>
          </div>)}
        </div>
        <div className="flex justify-between text-xl font-bold"><span>Tạm tính</span><span className="text-primary">{vnd(total)}</span></div>
        <p className="text-sm text-muted-foreground">Chưa bao gồm vận chuyển. Người bán cần xác nhận lại giá, hàng còn sẵn và phí giao hàng.</p>
        {sampleInCart && <p role="alert" className="rounded-lg bg-warning p-3 text-sm text-warning-foreground">Giỏ hàng đang có sản phẩm mẫu chỉ để xem giao diện. Hãy xóa các sản phẩm mẫu trước khi đặt hàng.</p>}
        <div className="grid gap-3 sm:grid-cols-2"><Link to="/cua-hang" className="btn-primary">Tiếp tục chọn hàng</Link><button type="button" onClick={clear} className="btn-outline">Xóa toàn bộ giỏ hàng</button></div>
        <section className="card space-y-4 p-4 sm:p-6">
          <h2 className="text-lg font-bold">Thông tin nhận hàng</h2>
          {!email ? <div className="space-y-2"><p className="text-sm text-muted-foreground">Đăng nhập hoặc tạo tài khoản để gửi đơn và xem thông tin đơn hàng của bạn.</p><Link to="/tai-khoan" className="btn-primary">Đăng nhập / Tạo tài khoản</Link></div> : <form className="space-y-4" onSubmit={placeOrder}>
            <p className="text-sm text-muted-foreground">Đang đăng nhập: {email}</p>
            <label className="block space-y-1"><span className="text-sm font-semibold">Họ và tên *</span><input className="field" required minLength={2} maxLength={150} autoComplete="name" value={fullName} onChange={e => setFullName(e.target.value)} /></label>
            <label className="block space-y-1"><span className="text-sm font-semibold">Số điện thoại *</span><input className="field" required inputMode="tel" autoComplete="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Số điện thoại liên hệ" /></label>
            <label className="block space-y-1"><span className="text-sm font-semibold">Địa chỉ giao hàng *</span><textarea className="field min-h-24" required minLength={5} maxLength={500} autoComplete="street-address" value={address} onChange={e => setAddress(e.target.value)} placeholder="Số nhà, thôn/xã, huyện, tỉnh" /></label>
            <label className="block space-y-1"><span className="text-sm font-semibold">Ghi chú (không bắt buộc)</span><textarea className="field min-h-20" maxLength={1000} value={note} onChange={e => setNote(e.target.value)} placeholder="Thời gian nhận hàng hoặc yêu cầu khác" /></label>
            <p className="rounded-lg bg-secondary p-3 text-sm">Phương thức mặc định: thanh toán khi nhận hàng hoặc xác nhận trực tiếp với người bán. Cổng thanh toán trực tuyến chưa được kết nối. {note.trim() ? "Ghi chú của bạn sẽ được giữ ở biểu mẫu này trong bản hiện tại." : ""}</p>
            <button type="submit" className="btn-primary w-full" disabled={busy || loading || sampleInCart}>{busy ? "Đang gửi đơn…" : "Gửi đơn đặt hàng"}</button>
          </form>}
        </section>
      </>}
    </Page>
  );
}
