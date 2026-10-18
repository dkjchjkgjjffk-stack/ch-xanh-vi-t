import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PRODUCTS, type Product, vnd } from "@/data/sample";
import { Page, SampleNotice } from "@/components/Layout";
import { useCart } from "@/lib/cart";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/gio-hang")({
  head: () => ({
    meta: [
      { title: "Giỏ hàng — Chợ Xanh Việt" },
      { name: "description", content: "Kiểm tra các vật tư nông nghiệp đã chọn trước khi liên hệ người bán." },
      { property: "og:title", content: "Giỏ hàng" },
      { property: "og:description", content: "Giỏ hàng Chợ Xanh Việt." },
    ],
  }),
  component: Cart,
});

function Cart() {
  const { cart, setQty, clear } = useCart();
  const [liveProducts, setLiveProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const liveIds = useMemo(
    () => Object.keys(cart).filter((id) => !PRODUCTS.some((product) => product.id === id)),
    [cart],
  );

  useEffect(() => {
    let active = true;
    if (liveIds.length === 0) {
      setLiveProducts([]);
      setLoading(false);
      return () => { active = false; };
    }
    setLoading(true);
    setError("");
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
            id: row.id,
            name: row.name,
            category: row.category as Product["category"],
            price: Number(row.price),
            unit: row.unit,
            icon: row.icon || "📦",
            description: row.description || "",
            manufacturer: row.manufacturer || "Người bán chưa cung cấp",
            registration: row.registration || "Chưa cung cấp",
            verify: row.verify_status as Product["verify"],
            seller: { name: row.seller_name, phone: row.seller_phone, address: row.seller_address || "" },
          })));
        }
        setLoading(false);
      });
    return () => { active = false; };
  }, [liveIds]);

  const productById = new Map<string, Product>([
    ...PRODUCTS.map((product) => [product.id, product] as const),
    ...liveProducts.map((product) => [product.id, product] as const),
  ]);
  const lines = Object.entries(cart)
    .map(([id, q]) => ({ p: productById.get(id), q }))
    .filter((line): line is { p: Product; q: number } => Boolean(line.p));
  const total = lines.reduce((sum, line) => sum + line.p.price * line.q, 0);

  return (
    <Page title="Giỏ hàng">
      <SampleNotice>Giỏ hàng hiện chỉ lưu lựa chọn trên thiết bị. Chức năng đặt hàng và thanh toán chưa được kết nối; chưa có đơn hàng nào gửi cho người bán.</SampleNotice>
      {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      {loading && <p role="status" className="text-sm text-muted-foreground">Đang tải sản phẩm trong giỏ…</p>}
      {lines.length === 0 ? (
        <div className="py-10 text-center">
          <div className="text-6xl" aria-hidden="true">🧺</div>
          <p className="my-4 text-muted-foreground">{loading ? "Đang tải giỏ hàng…" : "Giỏ hàng đang trống hoặc sản phẩm không còn được đăng bán."}</p>
          <Link to="/cua-hang" className="btn-primary">Khám phá cửa hàng</Link>
        </div>
      ) : (
        <>
          <div className="card divide-y">
            {lines.map(({ p, q }) => (
              <div key={p.id} className="flex items-center gap-3 p-3">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-secondary text-3xl" aria-hidden="true">{p.icon}</div>
                <div className="min-w-0 flex-1">
                  <Link to="/cua-hang/$id" params={{ id: p.id }} className="font-semibold leading-snug hover:underline">{p.name}</Link>
                  <div className="text-sm text-muted-foreground">{vnd(p.price)} / {p.unit}</div>
                  <div className="text-primary font-bold">{vnd(p.price * q)}</div>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" className="btn-outline min-h-10 w-10 px-0" onClick={() => setQty(p.id, q - 1)} aria-label={`Giảm số lượng ${p.name}`}>−</button>
                  <span className="w-6 text-center font-bold" aria-label="Số lượng">{q}</span>
                  <button type="button" className="btn-outline min-h-10 w-10 px-0" onClick={() => setQty(p.id, q + 1)} aria-label={`Tăng số lượng ${p.name}`}>+</button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xl font-bold"><span>Tạm tính</span><span className="text-primary">{vnd(total)}</span></div>
          <p className="text-sm text-muted-foreground">Tổng tiền chỉ mang tính tham khảo; chưa bao gồm vận chuyển và chưa phải đơn hàng xác nhận.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link to="/cua-hang" className="btn-primary">Tiếp tục chọn hàng</Link>
            <button type="button" onClick={clear} className="btn-outline">Xóa toàn bộ giỏ hàng</button>
          </div>
          <div className="card space-y-2 p-4">
            <h2 className="text-lg font-bold">Đặt hàng</h2>
            <p className="text-sm text-muted-foreground">Đặt hàng trực tuyến chưa được bật. Mở từng sản phẩm để liên hệ trực tiếp người bán; chỉ giao dịch sau khi tự xác minh hàng hóa, giá và thông tin bên bán.</p>
          </div>
        </>
      )}
    </Page>
  );
}
