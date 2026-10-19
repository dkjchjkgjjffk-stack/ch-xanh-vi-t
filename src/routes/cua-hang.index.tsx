import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CATEGORIES, PRODUCTS, type Product } from "@/data/sample";
import { supabase } from "@/integrations/supabase/client";
import { Page, SampleNotice } from "@/components/Layout";
import { ProductCard } from "@/components/Cards";

export const Route = createFileRoute("/cua-hang/")({
  validateSearch: (s: Record<string, unknown>): { q?: string; dm?: string } => {
    const r: { q?: string; dm?: string } = {};
    if (typeof s["q"] === "string" && s["q"]) r.q = s["q"];
    if (typeof s["dm"] === "string" && s["dm"]) r.dm = s["dm"];
    return r;
  },
  head: () => ({
    meta: [
      { title: "Cửa hàng vật tư nông nghiệp — Chợ Xanh Việt" },
      { name: "description", content: "Phân bón, thuốc bảo vệ thực vật, dụng cụ và vật tư nông nghiệp." },
      { property: "og:title", content: "Cửa hàng vật tư nông nghiệp" },
      { property: "og:description", content: "Phân bón, thuốc BVTV, dụng cụ và vật tư." },
    ],
  }),
  component: Shop,
});

function Shop() {
  const { q, dm } = Route.useSearch();
  const [liveProducts, setLiveProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let active = true;
    void supabase.from("products")
      .select("id,name,category,price,unit,description,icon,image_url,manufacturer,registration,seller_name,seller_phone,seller_address,verify_status")
      .eq("status", "approved").eq("is_sample", false)
      .order("created_at", { ascending: false }).limit(200)
      .then(async ({ data, error }) => {
        if (!active) return;
        if (error) {
          setUnavailable(true);
          setLiveProducts([]);
        } else {
          const mapped = await Promise.all((data ?? []).map(async row => {
            let imageUrl: string | null = null;
            if (row.image_url) {
              const { data: signed } = await supabase.storage.from("images").createSignedUrl(row.image_url, 3600);
              imageUrl = signed?.signedUrl ?? null;
            }
            return {
              id: row.id, name: row.name, category: row.category as Product["category"],
              price: Number(row.price), unit: row.unit, icon: row.icon || "📦", imageUrl,
              description: row.description || "", manufacturer: row.manufacturer || "Người bán chưa cung cấp",
              registration: row.registration || "Chưa cung cấp", verify: row.verify_status as Product["verify"],
              seller: { name: row.seller_name, phone: row.seller_phone, address: row.seller_address || "" },
            };
          }));
          if (active) setLiveProducts(mapped);
          setUnavailable(false);
        }
        setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const normalizedQuery = q?.trim().toLocaleLowerCase("vi");
  const filter = (p: Product) => {
    const categoryName = CATEGORIES.find((c) => c.id === p.category)?.name ?? "";
    const searchable = [p.name, p.description, p.manufacturer, p.registration, p.seller.name, p.seller.address, categoryName]
      .join(" ").toLocaleLowerCase("vi");
    return (!dm || p.category === dm) && (!normalizedQuery || searchable.includes(normalizedQuery));
  };
  const liveItems = liveProducts.filter(filter);
  const sampleItems = PRODUCTS.filter(filter);

  return (
    <Page title="Cửa hàng vật tư">
      <SampleNotice>Sản phẩm do người bán đăng chỉ hiển thị công khai sau khi được duyệt. Thông tin nhà sản xuất và số đăng ký do người bán khai chưa được xem là xác minh độc lập.</SampleNotice>
      <div className="flex gap-2 overflow-x-auto pb-1">
        <Link to="/cua-hang" search={q ? { q } : {}} className={`chip shrink-0 py-2 text-base ${!dm ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>Tất cả</Link>
        {CATEGORIES.map((c) => (
          <Link key={c.id} to="/cua-hang" search={{ ...(q ? { q } : {}), dm: c.id }} className={`chip shrink-0 py-2 text-base ${dm === c.id ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>{c.icon} {c.name}</Link>
        ))}
      </div>
      {unavailable && <p className="rounded-lg bg-warning p-3 text-sm text-warning-foreground">Chưa tải được sản phẩm thật từ cơ sở dữ liệu. Sản phẩm mẫu bên dưới chỉ để xem giao diện.</p>}
      <p className="text-sm text-muted-foreground">{loading ? "Đang tải sản phẩm thật…" : `Sản phẩm đã duyệt: ${liveItems.length}`}{q ? ` · Từ khóa “${q}”` : ""}</p>
      {liveItems.length > 0 && <>
        <h2 className="font-bold">Sản phẩm người bán đã được duyệt</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{liveItems.map((p) => <div key={p.id} className="space-y-1"><p className="px-1 text-xs font-semibold text-success">ĐÃ DUYỆT · NGƯỜI BÁN KHAI</p><ProductCard p={p} /></div>)}</div>
      </>}
      <h2 className="font-bold">Sản phẩm mẫu để xem giao diện</h2>
      {sampleItems.length === 0 ? <div className="card p-5 text-center text-sm text-muted-foreground">Không có sản phẩm mẫu phù hợp bộ lọc.</div> :
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{sampleItems.map((p) => <div key={p.id} className="space-y-1"><p className="px-1 text-xs font-semibold text-muted-foreground">TIN MẪU · KHÔNG PHẢI HÀNG BÁN THẬT</p><ProductCard p={p} /></div>)}</div>}
    </Page>
  );
}
