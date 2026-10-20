import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, BadgeCheck, ChartNoAxesCombined, Headset, Leaf, PackageCheck, ShieldCheck, ShoppingCart, Sprout, Truck, Wheat } from "lucide-react";
import { PRICES, PRODUCTS, type Product, vnd } from "@/data/sample";
import { supabase } from "@/integrations/supabase/client";
import { Page } from "@/components/Layout";
import { ProductCard } from "@/components/Cards";

const categoryVisuals = [
  { id: "nongsan", title: "Nông sản", desc: "Cà phê, hồ tiêu, sầu riêng…", image: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=900&q=85", search: "Cà phê" },
  { id: "phan-bon", title: "Phân bón", desc: "NPK, hữu cơ, vi sinh…", image: "https://boca.com.br/_next/image?q=75&url=https%3A%2F%2Fimages.boca.com.br%2Fupload%2Fimagens-resizes%2Fad628ac807f394049008189000317aaa_858x483.png&w=3840", search: "phan-bon" },
  { id: "thuoc-bvtv", title: "Thuốc BVTV", desc: "Thông tin sản phẩm rõ ràng", image: "https://image.made-in-china.com/2f0j00frdqbQuPIpzg/Hebei-Hontai-Agricultural-Chemicals-and-Pesticides.jpg", search: "thuoc-bvtv" },
  { id: "vat-tu", title: "Vật tư nông nghiệp", desc: "Ống tưới, dụng cụ, phụ kiện…", image: "https://vedantpolyagro.com/images/drip.png", search: "vat-tu" },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hải Tây Phát — Nông sản và vật tư nông nghiệp" },
      { name: "description", content: "Kết nối nhà nông với nông sản, vật tư nông nghiệp và thông tin giá cả minh bạch." },
      { property: "og:title", content: "Hải Tây Phát" },
      { property: "og:description", content: "Kết nối nhà nông — Giá trị bền vững." },
    ],
  }),
  component: Index,
});

function BrandMark() {
  return (
    <div className="flex items-center gap-3" aria-label="Hải Tây Phát">
      <svg viewBox="0 0 120 44" role="img" aria-label="HTP" className="h-10 w-[104px] shrink-0">
        <defs><linearGradient id="htpGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f6d66f"/><stop offset=".55" stopColor="#c9972d"/><stop offset="1" stopColor="#e9bd4b"/></linearGradient></defs>
        <g fill="url(#htpGold)">
          <path d="M2 2H22V16H34V2H54V42H34V25H22V42H2Z"/>
          <path d="M56 2H94L108 14L94 26H78V42H58V18H76V11H56Z"/>
          <path d="M82 2H118V12H102V42H82Z"/>
        </g>
        <path d="M22 41V27L29 19L36 27V41H31V31L29 28L27 31V41Z" fill="#fff"/>
      </svg>
      <div className="min-w-0 leading-tight">
        <div className="whitespace-nowrap text-lg font-extrabold tracking-tight text-[#075b38] sm:text-xl">HẢI TÂY PHÁT</div>
        <div className="hidden text-[11px] text-slate-600 sm:block">Đồng hành cùng nhà nông Việt</div>
      </div>
    </div>
  );
}

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
            price: Number(row.price), priceOnRequest: row.price_on_request, unit: row.unit, icon: row.icon || "",
            imageUrl, description: row.description || "", manufacturer: row.manufacturer || "Người bán chưa cung cấp",
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
    <div className="bg-[#f7faf7]">
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-20 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=2200&q=90')" }} />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-white via-white/90 to-white/10" />
        <div className="mx-auto grid min-h-[410px] max-w-[1400px] items-center gap-6 px-5 py-10 sm:px-8 md:grid-cols-[.95fr_1.05fr] md:py-14">
          <div className="max-w-xl">
            <span className="inline-flex rounded-full bg-[#075b38] px-4 py-2 text-xs font-bold tracking-wide text-white">NÔNG SẢN · PHÂN BÓN · VẬT TƯ</span>
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.12] tracking-tight text-[#102b23] sm:text-5xl">Kết nối nhà nông<br/><span className="text-[#087343]">Giá trị bền vững</span></h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-slate-700">Hải Tây Phát đồng hành cùng nhà nông với thông tin sản phẩm rõ ràng, kết nối thu mua và dữ liệu giá cả minh bạch.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/cua-hang" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#ffc629] px-6 font-bold text-[#19352a] shadow-sm transition hover:bg-[#f3b914]">Khám phá sản phẩm <ArrowRight size={18}/></Link>
              <Link to="/bang-gia" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-[#0b6942] bg-white/80 px-6 font-semibold text-[#075b38] hover:bg-white">Xem bảng giá</Link>
            </div>
            <div className="mt-7 grid max-w-lg grid-cols-2 gap-3 sm:grid-cols-4">
              {[{ icon: ShieldCheck, title: "Thông tin rõ ràng" }, { icon: Truck, title: "Kết nối giao hàng" }, { icon: Headset, title: "Hỗ trợ tận tâm" }, { icon: BadgeCheck, title: "Minh bạch nguồn tin" }].map(({ icon: Icon, title }) => <div key={title} className="flex items-center gap-2 rounded-xl border border-white/70 bg-white/75 p-2 text-xs font-semibold text-slate-700 shadow-sm"><Icon size={21} className="shrink-0 text-[#087343]"/><span>{title}</span></div>)}
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-auto grid max-w-[570px] grid-cols-2 gap-3">
              <img className="mt-12 h-48 w-full rounded-2xl object-cover shadow-xl" src="https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=900&q=85" alt="Hạt cà phê" />
              <img className="h-60 w-full rounded-2xl object-cover shadow-xl" src="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=900&q=85" alt="Cây trồng xanh tốt" />
            </div>
          </div>
        </div>
      </section>

      <Page>
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {categoryVisuals.map((c) => (
            <Link key={c.id} to={c.id === "nongsan" ? "/cho" : "/cua-hang"} search={c.id === "nongsan" ? undefined : { dm: c.search as never }} className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="h-24 overflow-hidden sm:h-28"><img src={c.image} alt={c.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105"/></div>
              <div className="flex items-center justify-between gap-2 p-3"><div><h2 className="font-bold text-slate-900">{c.title}</h2><p className="mt-1 text-xs text-slate-500">{c.desc}</p></div><ArrowRight size={17} className="shrink-0 text-[#087343]"/></div>
            </Link>
          ))}
        </section>

        <section className="grid gap-5 lg:grid-cols-[.85fr_1.65fr]">
          <div className="rounded-xl border border-[#dce9df] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-lg font-extrabold text-[#075b38]"><ChartNoAxesCombined size={21}/> Giá nông sản</h2><Link to="/bang-gia" className="text-sm font-semibold text-[#087343]">Xem tất cả <ArrowRight size={14} className="inline"/></Link></div>
            <p className="mt-1 text-xs text-slate-500">Giá tham khảo theo vùng, có ngày ghi nhận và liên kết nguồn.</p>
            <div className="mt-4 divide-y divide-slate-100">
              {PRICES.slice(0, 8).map((row) => <div key={row.crop} className="grid grid-cols-[1fr_auto] items-center gap-2 py-3 text-sm"><div><div className="font-semibold text-slate-800">{row.crop}</div><div className="text-xs text-slate-500">{row.province} · /{row.unit}</div></div><div className="text-right text-sm font-semibold text-slate-600">{row.price == null ? "Chưa cập nhật" : vnd(row.price)}{row.updatedAt && <div className="text-[11px] font-normal">{row.updatedAt}</div>}{row.source && <a className="block text-[10px] font-medium text-[#087343] underline underline-offset-2" href={row.source.split(" — ").slice(1).join(" — ")} target="_blank" rel="noreferrer">Nguồn</a>}</div></div>)}
            </div>
            <p className="mt-3 border-t border-slate-100 pt-3 text-[11px] leading-5 text-slate-500">Giá tham khảo ngày 20/10/2026 từ nguồn công khai; có thể khác theo phẩm cấp, thời điểm và điểm thu mua. Hãy mở nguồn để kiểm tra trước khi giao dịch.</p>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between"><h2 className="text-xl font-extrabold text-[#075b38]">Sản phẩm nổi bật</h2><Link to="/cua-hang" className="text-sm font-semibold text-[#087343]">Xem tất cả <ArrowRight size={14} className="inline"/></Link></div>
            {liveProducts.length === 0 && <p className="mb-3 text-xs text-slate-500">Sản phẩm bên dưới là dữ liệu mẫu để xem giao diện.</p>}
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{featuredProducts.map((p) => <ProductCard key={p.id} p={p}/>)}</div>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl bg-gradient-to-r from-[#075b38] via-[#0b7045] to-[#eaf4ec] p-5 text-white shadow-sm sm:p-6">
          <div className="grid gap-5 md:grid-cols-[1.1fr_2fr] md:items-center">
            <div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#f6d36b]">Đồng hành cùng nhà nông</p><h2 className="mt-2 text-2xl font-extrabold">Vì sao chọn Hải Tây Phát?</h2><p className="mt-2 text-sm leading-6 text-white/80">Tập trung vào thông tin minh bạch, kết nối thuận tiện và trải nghiệm dễ dùng trên điện thoại.</p></div>
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">{[{icon: PackageCheck,title:"Nguồn hàng rõ ràng",desc:"Thông tin người bán"},{icon: ShieldCheck,title:"Minh bạch",desc:"Không tự gắn xác minh"},{icon: Sprout,title:"Gần nhà nông",desc:"Danh mục chuyên ngành"},{icon: Headset,title:"Hỗ trợ tận tâm",desc:"Kết nối khi cần"}].map(({icon: Icon,title,desc})=><div key={title} className="rounded-lg border border-white/15 bg-white/10 p-3"><Icon size={22} className="mb-2 text-[#f6d36b]"/><div className="font-bold">{title}</div><div className="mt-1 text-xs text-white/70">{desc}</div></div>)}</div>
          </div>
        </section>
      </Page>
    </div>
  );
}
