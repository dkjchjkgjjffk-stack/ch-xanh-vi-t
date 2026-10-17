import { createFileRoute, Link } from "@tanstack/react-router";
import { CATEGORIES, PRODUCTS } from "@/data/sample";
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
      { title: "Cửa hàng vật tư nông nghiệp — Chợ Nông Sản Việt" },
      { name: "description", content: "Phân bón, thuốc bảo vệ thực vật, dụng cụ và vật tư nông nghiệp." },
      { property: "og:title", content: "Cửa hàng vật tư nông nghiệp" },
      { property: "og:description", content: "Phân bón, thuốc BVTV, dụng cụ và vật tư." },
    ],
  }),
  component: Shop,
});

function Shop() {
  const { q, dm } = Route.useSearch();
  const items = PRODUCTS.filter((p) => (!dm || p.category === dm) && (!q || p.name.toLowerCase().includes(q.toLowerCase())));
  return (
    <Page title="Cửa hàng vật tư">
      <SampleNotice />
      <div className="flex gap-2 overflow-x-auto pb-1">
        <Link to="/cua-hang" search={q ? { q } : {}} className={`chip shrink-0 py-2 text-base ${!dm ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>Tất cả</Link>
        {CATEGORIES.map((c) => (
          <Link key={c.id} to="/cua-hang" search={{ ...(q ? { q } : {}), dm: c.id }} className={`chip shrink-0 py-2 text-base ${dm === c.id ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>{c.icon} {c.name}</Link>
        ))}
      </div>
      {q && <p className="text-muted-foreground">Kết quả cho “{q}”: {items.length} sản phẩm</p>}
      {items.length === 0 ? <p className="py-10 text-center text-muted-foreground">Không tìm thấy sản phẩm.</p> :
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{items.map((p) => <ProductCard key={p.id} p={p} />)}</div>}
    </Page>
  );
}
