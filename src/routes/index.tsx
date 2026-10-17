import { createFileRoute, Link } from "@tanstack/react-router";
import hero from "@/assets/hero.jpg";
import { CATEGORIES, LISTINGS, PRODUCTS } from "@/data/sample";
import { Page, SampleNotice } from "@/components/Layout";
import { ProductCard, ListingCard } from "@/components/Cards";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Chợ Nông Sản Việt — Vật tư & nông sản" },
      { name: "description", content: "Mua vật tư nông nghiệp, đăng tin bán và thu mua nông sản trên Chợ Nông Sản Việt." },
      { property: "og:title", content: "Chợ Nông Sản Việt" },
      { property: "og:description", content: "Vật tư nông nghiệp, chợ nông sản và bảng giá." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <>
      <section className="relative">
        <img src={hero} alt="Ruộng bậc thang và nông dân" width={1280} height={768} className="h-64 w-full object-cover md:h-96" />
        <div className="absolute inset-0 bg-hero" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl p-4 text-primary-foreground">
          <h1 className="text-3xl font-extrabold md:text-5xl">Mua vật tư, bán nông sản</h1>
          <p className="mt-1 text-lg">Kết nối bà con nông dân và người thu mua.</p>
        </div>
      </section>
      <Page>
        <SampleNotice>Phiên bản thử nghiệm: toàn bộ sản phẩm và tin đăng hiện tại là DỮ LIỆU MẪU.</SampleNotice>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Link to="/cua-hang" className="card p-4 text-center"><div className="text-4xl">🛒</div><div className="mt-1 font-bold">Cửa hàng vật tư</div></Link>
          <Link to="/cho" className="card p-4 text-center"><div className="text-4xl">🌾</div><div className="mt-1 font-bold">Chợ nông sản</div></Link>
          <Link to="/bang-gia" className="card p-4 text-center"><div className="text-4xl">📊</div><div className="mt-1 font-bold">Bảng giá</div></Link>
          <Link to="/cho" search={{ loai: "mua" }} className="card p-4 text-center"><div className="text-4xl">🤝</div><div className="mt-1 font-bold">Cần thu mua</div></Link>
        </div>

        <h2 className="pt-2 text-xl font-bold">Danh mục vật tư</h2>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((c) => (
            <Link key={c.id} to="/cua-hang" search={{ dm: c.id }} className="chip shrink-0 bg-secondary py-2 text-base text-secondary-foreground">{c.icon} {c.name}</Link>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2"><h2 className="text-xl font-bold">Sản phẩm nổi bật</h2><Link to="/cua-hang" className="font-semibold text-primary">Xem tất cả →</Link></div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{PRODUCTS.slice(0, 4).map((p) => <ProductCard key={p.id} p={p} />)}</div>

        <div className="flex items-center justify-between pt-2"><h2 className="text-xl font-bold">Tin mới ở chợ</h2><Link to="/cho" className="font-semibold text-primary">Xem tất cả →</Link></div>
        <div className="grid gap-3 md:grid-cols-2">{LISTINGS.slice(0, 4).map((l) => <ListingCard key={l.id} l={l} />)}</div>
      </Page>
    </>
  );
}
