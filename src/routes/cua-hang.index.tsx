import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CATEGORIES, type Product } from "@/data/sample";
import { CATALOG_GROUPS, FERTILIZER_CATALOG, type CatalogGroup, type ReferenceProduct } from "@/data/fertilizer-catalog";
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
      { name: "description", content: "Tra cứu phân bón NPK, phân đơn, hữu cơ, vi sinh, lân và kali; mô tả dinh dưỡng, công dụng và nguồn tham khảo." },
      { property: "og:title", content: "Cửa hàng vật tư nông nghiệp" },
      { property: "og:description", content: "Tra cứu phân bón và vật tư nông nghiệp." },
    ],
  }),
  component: Shop,
});

function Shop() {
  const { q, dm } = Route.useSearch();
  const [liveProducts, setLiveProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [catalogGroup, setCatalogGroup] = useState<CatalogGroup | "Tất cả">("Tất cả");
  const [liveCatalog, setLiveCatalog] = useState<ReferenceProduct[] | null>(null);

  useEffect(() => {
    let active = true;
    void supabase.from("products")
      .select("id,name,category,price,price_on_request,unit,description,icon,image_url,manufacturer,registration,seller_name,seller_phone,seller_address,verify_status")
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
              price: Number(row.price), priceOnRequest: row.price_on_request, unit: row.unit, icon: row.icon || "📦", imageUrl,
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

  useEffect(() => {
    let active = true;
    void supabase.from("reference_products")
      .select("id,name,category,catalog_group,description,manufacturer,source_url,icon,image_url,price_on_request,unit,verify_status")
      .order("catalog_group").order("name")
      .then(({ data, error }) => {
        if (!active) return;
        if (!error && data) {
          setLiveCatalog(data.map((row): ReferenceProduct => ({
            id: row.id, name: row.name, category: row.category as Product["category"],
            price: 0, priceOnRequest: true, unit: row.unit, icon: row.icon || "🌱",
            imageUrl: row.image_url, description: row.description || "", manufacturer: row.manufacturer || "Chưa cung cấp",
            registration: "Đối chiếu nhãn của đúng lô hàng", verify: row.verify_status as Product["verify"],
            seller: { name: "Danh mục tham khảo — chưa phải tin bán hàng", phone: "", address: "" },
            sourceUrl: row.source_url, catalogGroup: row.catalog_group as CatalogGroup, isReference: true,
          })));
        }
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
  const catalogData = liveCatalog ?? FERTILIZER_CATALOG;
  const catalogItems = catalogData.filter((p) =>
    (!dm || dm === "phan-bon") &&
    (catalogGroup === "Tất cả" || p.catalogGroup === catalogGroup) &&
    (!normalizedQuery || [p.name, p.description, p.manufacturer, p.catalogGroup].join(" ").toLocaleLowerCase("vi").includes(normalizedQuery))
  );
  const catalogCountByGroup = (group: CatalogGroup) => catalogData.filter((p) => p.catalogGroup === group).length;

  return (
    <Page title="Cửa hàng vật tư">
      <SampleNotice>Sản phẩm bán hàng chỉ hiển thị sau khi được duyệt. Danh mục phân bón tham khảo là thông tin tra cứu, không xác nhận tồn kho, người bán hoặc tính xác thực của từng lô hàng.</SampleNotice>
      <div className="flex gap-2 overflow-x-auto pb-1">
        <Link to="/cua-hang" search={q ? { q } : {}} className={`chip shrink-0 py-2 text-base ${!dm ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>Tất cả</Link>
        {CATEGORIES.map((c) => (
          <Link key={c.id} to="/cua-hang" search={{ ...(q ? { q } : {}), dm: c.id }} className={`chip shrink-0 py-2 text-base ${dm === c.id ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>{c.icon} {c.name}</Link>
        ))}
      </div>
      {unavailable && <p className="rounded-lg bg-warning p-3 text-sm text-warning-foreground">Chưa tải được sản phẩm từ Supabase. Danh mục tham khảo không phải hàng tồn kho hoặc tin bán.</p>}
      <p className="text-sm text-muted-foreground">{loading ? "Đang tải sản phẩm thật…" : `Sản phẩm người bán đã duyệt: ${liveItems.length}`}{q ? ` · Từ khóa “${q}”` : ""}</p>

      {liveItems.length > 0 && <>
        <h2 className="font-bold">Sản phẩm người bán đã được duyệt</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{liveItems.map((p) => <div key={p.id} className="space-y-1"><p className="px-1 text-xs font-semibold text-success">ĐÃ DUYỆT · NGƯỜI BÁN KHAI</p><ProductCard p={p} /></div>)}</div>
      </>}

      {(!dm || dm === "phan-bon") && <>
        <section className="space-y-3">
          <div>
            <h2 className="text-xl font-bold">Danh mục phân bón tham khảo</h2>
            <p className="text-sm text-muted-foreground">{catalogData.length} mục tra cứu · giá để “Liên hệ” · mở từng mục để xem hàm lượng, công dụng và nguồn hãng. Chưa phải danh sách hàng đang có trong kho.</p>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button type="button" onClick={() => setCatalogGroup("Tất cả")} className={`chip shrink-0 ${catalogGroup === "Tất cả" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>Tất cả ({catalogData.length})</button>
            {CATALOG_GROUPS.map((g) => <button type="button" key={g} onClick={() => setCatalogGroup(g)} className={`chip shrink-0 ${catalogGroup === g ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>{g} ({catalogCountByGroup(g)})</button>)}
          </div>
          {catalogItems.length === 0
            ? <div className="card p-5 text-center text-sm text-muted-foreground">Không có mục tham khảo phù hợp từ khóa/bộ lọc này.</div>
            : <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{catalogItems.map((p) => <div key={p.id} className="space-y-1"><p className="px-1 text-xs font-semibold text-muted-foreground">THAM KHẢO · CHƯA XÁC MINH HÀNG</p><ProductCard p={p} /></div>)}</div>}
        </section>
      </>}

    </Page>
  );
}
