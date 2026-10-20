import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, BadgeCheck, ChartNoAxesCombined, Headset, PackageCheck, ShieldCheck, Sprout, Truck } from "lucide-react";
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
  const [liveProducts, setLiveProducts] = useState<Product[]>([]);\n  const [heroSlide, setHeroSlide] = useState(0);
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
      <section className="relative isolate overflow-hidden bg-[#e9f5eb]">
        <div className="absolute inset-0 -z-20 bg-cover bg-center" style={{ backgroundImage: `url('${["https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1800&q=90","https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1800&q=90","https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=1800&q=90"][heroSlide]}')` }} />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-white/95 via-white/80 to-white/20"/>
        <div className="mx-auto grid min-h-[330px] max-w-[1400px] items-center gap-4 px-5 py-7 sm:min-h-[410px] sm:px-8 sm:py-10 md:grid-cols-[1fr_.9fr]">
          <div className="max-w-xl">
            <span className="inline-flex rounded-full bg-[#075b38] px-3 py-1.5 text-[10px] font-bold tracking-wide text-white sm:px-4 sm:py-2 sm:text-xs">NÔNG NGHIỆP BỀN VỮNG · GIÁ TRỊ DÀI LÂU</span>
            <h1 className="mt-3 text-[2rem] font-extrabold leading-[1.08] tracking-tight text-[#102b23] sm:text-5xl">Kết nối nhà nông<br/><span className="text-[#087343]">Giá trị bền vững</span></h1>
            <p className="mt-3 max-w-lg text-sm leading-5 text-slate-700 sm:mt-4 sm:text-base sm:leading-6">Hải Tây Phát cung cấp nông sản, phân bón, thuốc BVTV, vật tư nông nghiệp chính hãng, chất lượng, giá tốt.</p>
            <Link to="/cua-hang" className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-full bg-[#ffc629] px-4 text-sm font-bold text-[#19352a] shadow-sm sm:mt-5 sm:px-5">Khám phá ngay <ArrowRight size={16}/></Link>
          </div>
          <div className="hidden items-center justify-end gap-3 md:flex">
            <img className="mt-10 h-44 w-40 rounded-xl object-cover shadow-lg" src="https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=500&q=85" alt="Hạt cà phê" />
            <img className="h-52 w-44 rounded-xl object-cover shadow-lg" src="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=500&q=85" alt="Cây trồng xanh tốt" />
          </div>
          <button type="button" aria-label="Banner trước" onClick={() => setHeroSlide((heroSlide + 2) % 3)} className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/90 p-2 text-[#075b38] shadow md:block"><ArrowLeft size={18}/></button>
          <button type="button" aria-label="Banner tiếp theo" onClick={() => setHeroSlide((heroSlide + 1) % 3)} className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/90 p-2 text-[#075b38] shadow md:block"><ArrowRight size={18}/></button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">{[0,1,2].map(i=><button key={i} aria-label={`Chọn banner ${i+1}`} onClick={()=>setHeroSlide(i)} className={`h-2 rounded-full transition-all ${heroSlide===i?"w-6 bg-[#075b38]":"w-2 bg-white/90"}`}/>)}</div>
        </div>
      </section>

      <Page>
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {categoryVisuals.map((c) => (
            <Link key={c.id} to={c.id === "nongsan" ? "/cho" : "/cua-hang"} search={c.id === "nongsan" ? undefined : { dm: c.search as never }} className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="h-28 overflow-hidden sm:h-32"><img src={c.image} alt={c.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105"/></div>
              <div className="flex items-center justify-between gap-2 p-3"><div><h2 className="font-bold text-slate-900">{c.title}</h2><p className="mt-1 line-clamp-2 text-xs text-slate-500">{c.desc}</p></div><ArrowRight size={17} className="shrink-0 text-[#087343]"/></div>
            </Link>
          ))}
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.05fr_1.4fr]">
          <div className="rounded-xl border border-[#dce9df] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-lg font-extrabold text-[#075b38]"><ChartNoAxesCombined size={21}/> Giá nông sản hôm nay</h2><Link to="/bang-gia" className="text-sm font-semibold text-[#087343]">Xem tất cả <ArrowRight size={14} className="inline"/></Link></div>
            <p className="mt-1 text-xs text-slate-500">Giá tham khảo theo vùng, có ngày ghi nhận và liên kết nguồn.</p>
            <div className="mt-4 divide-y divide-slate-100">
              {PRICES.filter((row, index, all) => all.findIndex((item) => item.crop === row.crop) === index).slice(0, 5).map((row) => <div key={row.crop} className="grid grid-cols-[40px_1fr_auto] items-center gap-3 py-3 text-sm"><img className="size-10 rounded-full border border-emerald-100 object-cover" src={row.crop.toLowerCase().includes("cà phê") ? "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=120&q=80" : row.crop.toLowerCase().includes("tiêu") ? "https://images.unsplash.com/photo-1599909533730-f9d4c9c1f7f5?auto=format&fit=crop&w=120&q=80" : "https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&w=120&q=80"} alt={row.crop} loading="lazy"/><div><div className="font-semibold text-slate-800">{row.crop}</div><div className="text-xs text-slate-500">{row.province} · /{row.unit}</div></div><div className="text-right text-sm font-bold text-emerald-700">{row.price == null ? "Chưa cập nhật" : vnd(row.price)}{row.updatedAt && <div className="text-[10px] font-normal text-slate-500">{row.updatedAt}</div>}{row.source && <a className="block text-[10px] font-medium text-[#087343] underline underline-offset-2" href={row.source.split(" — ").slice(1).join(" — ")} target="_blank" rel="noreferrer">Nguồn</a>}</div></div>)}
            </div>
            <p className="mt-3 border-t border-slate-100 pt-3 text-[11px] leading-5 text-slate-500">Giá tham khảo ngày 20/10/2026 từ nguồn công khai; có thể khác theo phẩm cấp, thời điểm và điểm thu mua. Hãy mở nguồn để kiểm tra trước khi giao dịch.</p>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between"><h2 className="text-xl font-extrabold text-[#075b38]">Sản phẩm nổi bật</h2><Link to="/cua-hang" className="text-sm font-semibold text-[#087343]">Xem tất cả <ArrowRight size={14} className="inline"/></Link></div>
            {liveProducts.length === 0 && <p className="mb-3 text-xs text-slate-500">Sản phẩm bên dưới là dữ liệu mẫu để xem giao diện.</p>}
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{featuredProducts.map((p) => <ProductCard key={p.id} p={p}/>)}</div>
          </div>
        </section>

        <Link to="/cua-hang" search={{ dm: "vat-tu" as never }} className="group relative mb-5 block overflow-hidden rounded-2xl bg-[#075b38] shadow-sm">
          <img src="https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=1600&q=85" alt="Vật tư nông nghiệp và chăm sóc cây trồng" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"/>
          <div className="absolute inset-0 bg-gradient-to-r from-[#06452e]/95 via-[#075b38]/75 to-transparent"/>
          <div className="relative max-w-lg px-5 py-7 text-white sm:px-8 sm:py-9"><p className="text-xs font-bold uppercase tracking-widest text-[#ffd35c]">Dành cho nhà vườn</p><h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">Dụng cụ nông nghiệp</h2><p className="mt-1 text-sm text-white/90">Chất lượng · Bền bỉ · Hiệu quả</p><span className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#ffc629] px-4 py-2 text-sm font-bold text-[#173a2a]">Khám phá vật tư <ArrowRight size={16}/></span></div>
        </Link>

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
