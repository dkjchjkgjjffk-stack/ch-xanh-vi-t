import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { CATEGORIES, PRODUCTS, type Product, vnd } from "@/data/sample";
import { supabase } from "@/integrations/supabase/client";
import { Page, SampleNotice } from "@/components/Layout";
import { VerifyBadge } from "@/components/Cards";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/cua-hang/$id")({
  loader: async ({ params }) => {
    const sample = PRODUCTS.find((x) => x.id === params.id);
    if (sample) return { product: sample, isSample: true };

    const { data, error } = await supabase.from("products")
      .select("id,name,category,price,unit,description,icon,image_url,manufacturer,registration,seller_name,seller_phone,seller_address,verify_status,status,is_sample")
      .eq("id", params.id).eq("status", "approved").eq("is_sample", false).maybeSingle();
    if (error || !data) throw notFound();

    let imageUrl: string | null = null;
    if (data.image_url) {
      const { data: signed } = await supabase.storage.from("images").createSignedUrl(data.image_url, 3600);
      imageUrl = signed?.signedUrl ?? null;
    }

    const product: Product & { imageUrl?: string | null } = {
      id: data.id, name: data.name, category: data.category as Product["category"],
      price: Number(data.price), unit: data.unit, icon: data.icon || "📦",
      description: data.description || "", manufacturer: data.manufacturer || "Người bán chưa cung cấp",
      registration: data.registration || "Chưa cung cấp",
      verify: data.verify_status as Product["verify"],
      seller: { name: data.seller_name, phone: data.seller_phone, address: data.seller_address || "" },
      imageUrl,
    };
    return { product, isSample: false };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.product.name ?? "Sản phẩm"} — Chợ Xanh Việt` },
      { name: "description", content: loaderData?.product.description ?? "Chi tiết sản phẩm" },
      { property: "og:title", content: loaderData?.product.name ?? "Sản phẩm" },
      { property: "og:description", content: loaderData?.product.description ?? "Chi tiết sản phẩm" },
    ],
  }),
  component: Detail,
});

function Detail() {
  const { product: p, isSample } = Route.useLoaderData();
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  return (
    <Page>
      <Link to="/cua-hang" className="font-semibold text-primary">← Cửa hàng</Link>
      {isSample ? <SampleNotice>Sản phẩm này chỉ là dữ liệu mẫu để xem giao diện, không phải hàng bán thật.</SampleNotice> : <p className="rounded-lg bg-success/10 p-3 text-sm text-success">Sản phẩm đã được duyệt đăng. Thông tin do người bán khai chưa được xác minh độc lập.</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {"imageUrl" in p && p.imageUrl
          ? <img src={p.imageUrl} alt={`Ảnh sản phẩm: ${p.name}`} className="card aspect-square w-full object-cover" loading="lazy" />
          : <div className="card flex aspect-square items-center justify-center bg-secondary text-9xl">{p.icon}</div>}
        <div className="space-y-3">
          <div className="text-muted-foreground">{CATEGORIES.find((c) => c.id === p.category)?.name}</div>
          <h1 className="text-2xl font-bold">{p.name}</h1>
          <div className="text-3xl font-extrabold text-primary">{vnd(p.price)} <span className="text-base font-normal text-muted-foreground">/ {p.unit}</span></div>
          <p>{p.description}</p>
          <div className="flex items-center gap-3">
            <button className="btn-outline w-12 px-0" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Giảm">−</button>
            <span className="w-8 text-center text-xl font-bold">{qty}</span>
            <button className="btn-outline w-12 px-0" onClick={() => setQty(qty + 1)} aria-label="Tăng">+</button>
          </div>
          <button className="btn-primary w-full" onClick={() => { add(p.id, qty); setAdded(true); }}>🧺 Thêm vào giỏ hàng</button>
          {added && <Link to="/gio-hang" className="btn-outline w-full">Đã thêm — Xem giỏ hàng</Link>}
        </div>
      </div>

      <section className="card space-y-2 p-4">
        <div className="flex items-center justify-between gap-2"><h2 className="text-lg font-bold">Thông tin tra cứu</h2><VerifyBadge v={p.verify} /></div>
        <p><b>Nhà sản xuất:</b> {p.manufacturer}</p>
        <p><b>Thông tin đăng ký:</b> {p.registration}</p>
        <p className="text-sm text-muted-foreground">Nền tảng chưa xác minh thông tin này. Chúng tôi không khẳng định sản phẩm thật hay giả. Vui lòng kiểm tra nhãn mác và tra cứu tại cơ quan chức năng.</p>
      </section>

      <section className="card space-y-2 p-4">
        <h2 className="text-lg font-bold">Người bán</h2>
        <p className="font-semibold">{p.seller.name}</p>
        <p>📍 {p.seller.address}</p>
        <a href={`tel:${p.seller.phone.replace(/\s/g, "")}`} className="btn-primary w-full">📞 Gọi {p.seller.phone}</a>
      </section>
    </Page>
  );
}
