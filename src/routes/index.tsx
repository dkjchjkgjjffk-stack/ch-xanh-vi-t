import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, BadgeCheck, ChartNoAxesCombined, Headset, PackageCheck, ShieldCheck, Sprout, Truck } from "lucide-react";
import { type Product, vnd } from "@/data/sample";
import { supabase } from "@/integrations/supabase/client";
import { Page } from "@/components/Layout";
import { ProductCard } from "@/components/Cards";

const categoryVisuals = [
  { id: "nongsan", title: "Nông sản", desc: "Cà phê, hồ tiêu, sầu riêng…", image: "https://images.unsplash.com/photo-1559525839-b184a4d698c7?auto=format&fit=crop&w=900&q=85", search: "Cà phê" },
  { id: "phan-bon", title: "Phân bón", desc: "NPK, hữu cơ, vi sinh…", image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=900&q=85", search: "phan-bon" },
  { id: "thuoc-bvtv", title: "Thuốc BVTV", desc: "Thông tin sản phẩm rõ ràng", image: "https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=900&q=85", search: "thuoc-bvtv" },
  { id: "vat-tu", title: "Vật tư nông nghiệp", desc: "Ống tưới, dụng cụ, phụ kiện…", image: "https://images.unsplash.com/photo-1558904541-efa843a96f01?auto=format&fit=crop&w=900&q=85", search: "vat-tu" },
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
  const [livePrices, setLivePrices] = useState<Array<{ id: string; crop: string; unit: string; province: string; price: number; price_date: string; source: string; currency: string }>>([]);
  const [heroSlide, setHeroSlide] = useState(0);
  useEffect(() => {
    let active = true;
    void supabase.from("prices").select("id,crop,unit,province,price,price_date,source,currency").order("price_date", { ascending: false }).limit(100)
      .then(({ data }) => { if (active && data?.length) setLivePrices(data as typeof livePrices); });
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

  const featuredProducts = liveProducts;
  const displayPrices = (() => {
    const sourceRows = livePrices;
    const patterns = [/cà phê nhân xô/i, /^hồ tiêu$/i, /sầu riêng ri6 loại a/i, /lúa om5451/i, /cao su mủ đông/i];
    const chosen = patterns.map((pattern) => sourceRows.find((row) => pattern.test(row.crop))).filter(Boolean);
    const unique = new Map<string, (typeof sourceRows)[number]>();
    for (const row of chosen) if (row) unique.set(row.crop, row);
    return [...unique.values()].slice(0, 5);
  })();

  return (
    <div className="bg-[#f7faf7]">
      <section className="relative isolate overflow-hidden bg-[#e9f5eb]">
        <div className="absolute inset-0 -z-20 bg-cover bg-center" style={{ backgroundImage: `url('${["https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1800&q=90","https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1800&q=90","https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1800&q=90"][heroSlide]}')` }} />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#f7fff5]/95 via-[#f7fff5]/85 to-[#f7fff5]/35"/>
        <div className="mx-auto grid min-h-[300px] max-w-[1400px] items-center gap-3 px-4 py-7 sm:min-h-[380px] sm:gap-4 sm:px-8 sm:py-8 md:grid-cols-[1fr_.9fr]">
          <div className="max-w-xl pb-12 md:pb-0">
            <span className="inline-flex rounded-full bg-[#075b38] px-2 py-1 text-[8px] font-bold tracking-wide text-white sm:px-4 sm:py-2 sm:text-xs">NÔNG NGHIỆP BỀN VỮNG · GIÁ TRỊ DÀI LÂU</span>
            <h1 className="mt-2 text-[1.8rem] font-extrabold leading-[1.08] tracking-tight text-[#102b23] sm:mt-3 sm:text-5xl">Kết nối nhà nông<br/><span className="text-[#087343]">Giá trị bền vững</span></h1>
            <p className="mt-3 max-w-lg text-xs leading-relaxed text-slate-700 sm:mt-4 sm:text-base sm:leading-6">Hải Tây Phát cung cấp nông sản, phân bón, thuốc BVTV, vật tư nông nghiệp chính hãng, chất lượng, giá tốt.</p>
            <Link to="/cua-hang" className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-full bg-[#ffc629] px-3 text-[10px] font-bold text-[#19352a] shadow-sm sm:mt-5 sm:min-h-10 sm:gap-2 sm:px-5 sm:text-sm">Khám phá ngay <ArrowRight size={16}/></Link>
          </div>
          <div className="absolute bottom-8 right-3 flex items-end gap-1.5 md:hidden"><img className="h-[64px] w-[52px] rounded-lg border-2 border-white object-cover shadow-lg" src="https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=160&q=85" alt="Hạt cà phê" /><img className="h-[76px] w-[58px] rounded-lg border-2 border-white object-cover shadow-lg" src="https://image.made-in-china.com/2f0j00frdqbQuPIpzg/Hebei-Hontai-Agricultural-Chemicals-and-Pesticides.jpg" alt="Sản phẩm bảo vệ cây trồng" /></div>
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
        <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-4">
          {categoryVisuals.map((c) => (
            <Link key={c.id} to={c.id === "nongsan" ? "/cho" : "/cua-hang"} search={c.id === "nongsan" ? undefined : { dm: c.search as never }} className="group overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_3px_10px_rgba(15,45,30,0.08)] transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="h-[116px] overflow-hidden sm:h-40"><img src={c.image} alt={c.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105"/></div>
              <div className="flex min-h-[62px] items-center justify-between gap-2 px-3 py-3 sm:p-4"><div className="min-w-0"><h2 className="truncate text-sm font-bold leading-tight text-slate-900 sm:text-base">{c.title}</h2><p className="mt-1 hidden line-clamp-2 text-xs text-slate-500 sm:block">{c.desc}</p></div><ArrowRight size={12} className="shrink-0 text-[#087343] sm:h-[17px] sm:w-[17px]"/></div>
            </Link>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.05fr_1.4fr]">
          <div className="rounded-2xl border border-[#cfe9dc] bg-gradient-to-br from-[#f8fffb] to-[#eaf7f0] p-3.5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-lg font-extrabold text-[#075b38]"><ChartNoAxesCombined size={21}/> Giá nông sản mới nhất</h2><Link to="/bang-gia" className="text-sm font-semibold text-[#087343]">Xem tất cả <ArrowRight size={14} className="inline"/></Link></div>
            <p className="mt-1 text-xs text-slate-500">Giá tham khảo theo vùng, có ngày ghi nhận và liên kết nguồn.</p>
            <div className="mt-4 divide-y divide-slate-100">
              {displayPrices.length === 0 && <p className="rounded-lg bg-white/70 px-3 py-5 text-sm text-slate-600">Chưa có dữ liệu giá thực tế để hiển thị. Bảng giá sẽ hiện khi nguồn đồng bộ có dữ liệu.</p>}
              {displayPrices.map((row) => <div key={row.id} className="grid grid-cols-[30px_1fr_auto] items-center gap-2 py-2.5 text-xs sm:grid-cols-[40px_1fr_auto] sm:gap-3 sm:py-3 sm:text-sm"><img className="size-8 rounded-full border border-emerald-100 object-cover sm:size-10" src={row.crop.toLowerCase().includes("cà phê") ? "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=120&q=80" : row.crop.toLowerCase().includes("tiêu") ? "https://images.unsplash.com/photo-1599909533730-f9d4c9c1f7f5?auto=format&fit=crop&w=120&q=80" : row.crop.toLowerCase().includes("lúa") ? "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=120&q=80" : row.crop.toLowerCase().includes("cao su") ? "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=120&q=80" : "https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&w=120&q=80"} alt={row.crop} loading="lazy"/><div className="min-w-0"><div className="font-semibold text-slate-800">{row.crop}</div><div className="truncate text-[10px] text-slate-500 sm:text-xs">{row.province} · /{row.unit}</div></div><div className="text-right font-bold text-emerald-700">{row.currency === "VND" ? vnd(Number(row.price)) : Number(row.price).toLocaleString("en-US") + " " + row.currency}<div className="text-[9px] font-normal text-slate-500 sm:text-[10px]">{row.price_date}</div>{row.source && <a className="block text-[10px] font-medium text-[#087343] underline underline-offset-2" href={row.source.split(" — ").slice(1).join(" — ")} target="_blank" rel="noreferrer">Nguồn</a>}</div></div>)}
            </div>
            <p className="mt-3 border-t border-slate-100 pt-3 text-[11px] leading-5 text-slate-500">Giá hiển thị theo ngày ghi nhận từ cơ sở dữ liệu đồng bộ; mặt hàng chưa có nguồn cập nhật trực tiếp sẽ không được gắn nhãn giá hôm nay. Giá thực tế có thể khác theo phẩm cấp và điểm thu mua.</p>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between"><h2 className="flex items-center gap-2 text-lg font-extrabold text-[#087343] sm:text-xl">☆ Sản phẩm nổi bật</h2><Link to="/cua-hang" className="text-sm font-semibold text-[#087343]">Xem tất cả <ArrowRight size={14} className="inline"/></Link></div>
            
            <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible xl:grid-cols-4">{featuredProducts.length ? featuredProducts.map((p) => <div key={p.id} className="min-w-[148px] snap-start sm:min-w-0"><ProductCard p={p}/></div>) : <div className="w-full rounded-xl border border-dashed border-emerald-200 bg-white/80 p-5 text-sm text-slate-600 sm:col-span-2 xl:col-span-4">Chưa có sản phẩm thật được người bán đăng và duyệt. Hải Tây Phát sẽ hiển thị sản phẩm tại đây khi có dữ liệu hợp lệ.</div>}</div>
          </div>
        </section>

        <Link to="/cua-hang" search={{ dm: "vat-tu" as never }} className="group relative mb-5 block overflow-hidden rounded-2xl bg-[#075b38] shadow-sm ring-1 ring-emerald-900/10">
          <img src="https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=1600&q=85" alt="Vật tư nông nghiệp và chăm sóc cây trồng" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"/>
          <div className="absolute inset-0 bg-gradient-to-r from-[#06452e]/95 via-[#075b38]/75 to-transparent"/>
          <div className="relative max-w-lg px-5 py-6 text-white sm:px-8 sm:py-9"><p className="text-xs font-bold uppercase tracking-widest text-[#ffd35c]">Dành cho nhà vườn</p><h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">Dụng cụ nông nghiệp</h2><p className="mt-1 text-sm text-white/90">Chất lượng · Bền bỉ · Hiệu quả</p><span className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#ffc629] px-4 py-2 text-sm font-bold text-[#173a2a]">Khám phá vật tư <ArrowRight size={16}/></span></div>
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
