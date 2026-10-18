import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { CATEGORIES, PRODUCTS, vnd } from "@/data/sample";
import { Page, SampleNotice } from "@/components/Layout";
import { VerifyBadge } from "@/components/Cards";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/cua-hang/$id")({
  loader: ({ params }) => {
    const p = PRODUCTS.find((x) => x.id === params.id);
    if (!p) throw notFound();
    return p;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.name ?? "Sản phẩm"} — Chợ Xanh Việt` },
      { name: "description", content: loaderData?.description ?? "Chi tiết sản phẩm" },
      { property: "og:title", content: loaderData?.name ?? "Sản phẩm" },
      { property: "og:description", content: loaderData?.description ?? "Chi tiết sản phẩm" },
    ],
  }),
  component: Detail,
});

function Detail() {
  const p = Route.useLoaderData();
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  return (
    <Page>
      <Link to="/cua-hang" className="font-semibold text-primary">← Cửa hàng</Link>
      <SampleNotice />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card flex aspect-square items-center justify-center bg-secondary text-9xl">{p.icon}</div>
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
