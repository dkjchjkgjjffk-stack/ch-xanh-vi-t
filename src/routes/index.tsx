import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import hero from "@/assets/hero.jpg";
import { CATEGORIES, LISTINGS, PRODUCTS, type Product } from "@/data/sample";
import { supabase } from "@/integrations/supabase/client";
import { Page } from "@/components/Layout";
import { ProductCard, ListingCard } from "@/components/Cards";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hải Tây Phát — Bảng giá nông sản" },
      { name: "description", content: "Theo dõi bảng giá nông sản và thông tin thị trường trên Hải Tây Phát." },
      { property: "og:title", content: "Hải Tây Phát" },
      { property: "og:description", content: "Bảng giá nông sản và thông tin thị trường." },
    ],
  }),
  component: Index,
});

function Index() {
  const [liveProducts, setLiveProducts] = useState<Product[]>([]);
  useEffect(() => {
    let active = true;
    void supabase.from("products")
      .select("id,name,category,price,price_on_request,unit,description,icon,image_url,manufacturer,registration,seller_name,seller_phone,seller_address,verify_status")
      .eq("status", "approved").eq("is_sample", false)
      .order("created_at", { ascending: false }).limit(4)
      .then(async ({ data }) => {
        if (!active) return;
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
      });
    return () => { active = false; };
  }, []);

  const featuredProducts = liveProducts.length ? liveProducts : PRODUCTS.slice(0, 4);

  return (
    <>
      <section className="relative">
        <img src={hero} alt="Ruộng bậc thang và nông dân" width={1280} height={768} className="h-64 w-full object-cover md:h-96" />
        <div className="absolute inset-0 bg-hero" />
      </section>
      <Page>
        <section className="overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-card to-card p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary text-2xl text-primary-foreground">📈</div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-bold">Bảng giá nông sản đang vận hành</h2>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Tự động cập nhật mỗi ngày</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">Theo dõi giá cà phê, hồ tiêu mới nhất cùng ngày cập nhật và nguồn tham khảo.</p>
              </div>
            </div>
            <Link to="/bang-gia" className="btn-primary shrink-0 text-center">Xem bảng giá →</Link>
          </div>
          <p className="mt-3 border-t border-border/70 pt-3 text-xs text-muted-foreground">Lưu ý: tin mua bán bên dưới hiện là dữ liệu minh họa. Bảng giá hiển thị theo dữ liệu và nguồn đã ghi nhận, không phải giá giao dịch trực tiếp theo từng giây.</p>
        </section>

        <h2 className="pt-2 text-xl font-bold">Danh mục vật tư</h2>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((c) => (
            <Link key={c.id} to="/cua-hang" search={{ dm: c.id }} className="chip shrink-0 bg-secondary py-2 text-base text-secondary-foreground">{c.icon} {c.name}</Link>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2"><h2 className="text-xl font-bold">{liveProducts.length ? "Sản phẩm mới đăng" : "Sản phẩm mẫu xem giao diện"}</h2><Link to="/cua-hang" className="font-semibold text-primary">Xem tất cả →</Link></div>
        {liveProducts.length === 0 && <p className="text-sm text-muted-foreground">Chưa có sản phẩm thật được xuất bản. Các mặt hàng bên dưới chỉ để xem giao diện.</p>}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{featuredProducts.map((p) => <ProductCard key={p.id} p={p} />)}</div>

        <div className="flex items-center justify-between pt-2"><h2 className="text-xl font-bold">Tin mới ở chợ (mẫu)</h2><Link to="/cho" className="font-semibold text-primary">Xem tất cả →</Link></div>
        <div className="grid gap-3 md:grid-cols-2">{LISTINGS.slice(0, 4).map((l) => <ListingCard key={l.id} l={l} />)}</div>
      </Page>
    </>
  );
}
