import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, ChartNoAxesCombined, Headset, PackageCheck, ShieldCheck, Sprout } from "lucide-react";
import { type Product, vnd } from "@/data/sample";
import { FERTILIZER_CATALOG, type ReferenceProduct } from "@/data/fertilizer-catalog";
import { supabase } from "@/integrations/supabase/client";
import { Page } from "@/components/Layout";
import { ProductCard } from "@/components/Cards";

const categoryVisuals = [
  { id: "ca-phe", title: "Cà phê", desc: "Giá thu mua và thị trường", image: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=900&q=85", search: "Cà phê", route: "nongsan" },
  { id: "sau-rieng", title: "Sầu riêng", desc: "Thông tin mùa vụ và giá", image: "https://images.unsplash.com/photo-1655179532149-9123346e5c0d?auto=format&fit=crop&w=900&q=85", search: "Sầu riêng", route: "nongsan" },
  { id: "ho-tieu", title: "Hồ tiêu", desc: "Giá tiêu và vùng trồng", image: "https://sc02.alicdn.com/kf/H13ac0f2ec13649568cbc5400ffab896e2.png", search: "Hồ tiêu", route: "nongsan" },
  { id: "cao-su", title: "Cao su", desc: "Giá mủ và thị trường", image: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=900&q=85", search: "Cao su", route: "nongsan" },
  { id: "phan-bon", title: "Phân bón", desc: "NPK, hữu cơ, vi sinh", image: "https://bcp.cdnchinhphu.vn/334894974524682240/2022/12/31/phan-bon-2-16563241995661012848475-16724794670331355401155.jpg", search: "phan-bon", route: "shop" },
  { id: "vat-tu", title: "Dụng cụ nông nghiệp", desc: "Thiết bị và vật tư vườn", image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=900&q=85", search: "vat-tu", route: "shop" },
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

function Index() {
  const [liveProducts, setLiveProducts] = useState<Product[]>([]);
  const [referenceProducts, setReferenceProducts] = useState<ReferenceProduct[]>(FERTILIZER_CATALOG);
  const [livePrices, setLivePrices] = useState<
    Array<{ id: string; crop: string; unit: string; province: string; price: number; price_date: string; source: string; currency: string }>
  >([]);
  const [heroSlide, setHeroSlide] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    void supabase
      .from("prices")
      .select("id,crop,unit,province,price,price_date,source,currency")
      .order("price_date", { ascending: false })
      .limit(300)
      .then(({ data }) => {
        if (active && data?.length) setLivePrices(data as typeof livePrices);
      });
    void supabase
      .from("reference_products")
      .select("id,name,category,catalog_group,description,manufacturer,source_url,icon,image_url,price_on_request,unit,verify_status")
      .order("catalog_group")
      .order("name")
      .then(({ data }) => {
        if (!active || !data?.length) return;
        setReferenceProducts(data.map((row): ReferenceProduct => ({
          id: row.id,
          name: row.name,
          category: row.category as Product["category"],
          price: 0,
          priceOnRequest: true,
          unit: row.unit,
          icon: row.icon || "🌱",
          imageUrl: row.image_url,
          description: row.description || "",
          manufacturer: row.manufacturer || "Chưa cung cấp",
          registration: "Đối chiếu nhãn của đúng lô hàng",
          verify: row.verify_status as Product["verify"],
          seller: { name: "Danh mục tham khảo — chưa phải tin bán hàng", phone: "", address: "" },
          sourceUrl: row.source_url || "",
          catalogGroup: row.catalog_group as ReferenceProduct["catalogGroup"],
          isReference: true,
        })));
      });
    void supabase
      .from("products")
      .select(
        "id,name,category,price,price_on_request,unit,description,icon,image_url,manufacturer,registration,seller_name,seller_phone,seller_address,verify_status",
      )
      .eq("status", "approved")
      .eq("is_sample", false)
      .order("created_at", { ascending: false })
      .limit(4)
      .then(async ({ data }) => {
        if (!active) return;
        const mapped = await Promise.all(
          (data ?? []).map(async (row) => {
            let imageUrl: string | null = null;
            if (row.image_url) {
              const { data: signed } = await supabase.storage.from("images").createSignedUrl(row.image_url, 3600);
              imageUrl = signed?.signedUrl ?? null;
            }
            return {
              id: row.id,
              name: row.name,
              category: row.category as Product["category"],
              price: Number(row.price),
              priceOnRequest: row.price_on_request,
              unit: row.unit,
              icon: row.icon || "",
              imageUrl,
              description: row.description || "",
              manufacturer: row.manufacturer || "Người bán chưa cung cấp",
              registration: row.registration || "Chưa cung cấp",
              verify: row.verify_status as Product["verify"],
              seller: { name: row.seller_name, phone: row.seller_phone, address: row.seller_address || "" },
            };
          }),
        );
        if (active) setLiveProducts(mapped);
      });
    return () => {
      active = false;
    };
  }, []);

  const featuredProducts = liveProducts;
  const displayPrices = (() => {
    type PriceRow = (typeof livePrices)[number];
    const grouped = new Map<string, PriceRow[]>();
    for (const row of [...livePrices].sort((a, b) => b.price_date.localeCompare(a.price_date))) {
      const key = [row.crop, row.province, row.unit, row.currency].join("|");
      const history = grouped.get(key) ?? [];
      history.push(row);
      grouped.set(key, history);
    }
    const latestRows = [...grouped.values()].map((history) => ({
      current: history[0],
      previous: history.find((row) => row.price_date < history[0].price_date) ?? null,
    }));
    return latestRows
      .sort((a, b) => b.current.price_date.localeCompare(a.current.price_date) || a.current.crop.localeCompare(b.current.crop, "vi"))
      .slice(0, 15);
  })();

  const heroImages = [
    "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1800&q=88",
    "https://bcp.cdnchinhphu.vn/334894974524682240/2022/12/31/phan-bon-2-16563241995661012848475-16724794670331355401155.jpg",
    "https://www.syngenta.com.vn/sites/g/files/kgtney1261/files/pinned-image/2023-10/2023.06.09_NHAN%20DIEN%20CHINH%20HIEU-01%20%281%29.jpg",
  ];

  return (
    <div className="bg-[#f5f8f6]">
      {/* Banner carousel: 3 slides, swipe-friendly on mobile */}
      <section
        className="relative w-full overflow-hidden bg-[#073d28]"
        onTouchStart={(event) => setTouchStartX(event.touches[0]?.clientX ?? null)}
        onTouchEnd={(event) => {
          if (touchStartX === null) return;
          const delta = (event.changedTouches[0]?.clientX ?? touchStartX) - touchStartX;
          if (Math.abs(delta) > 45) {
            setHeroSlide((current) => delta < 0 ? (current + 1) % 3 : (current + 2) % 3);
          }
          setTouchStartX(null);
        }}
      >
        <div className="flex transition-transform duration-500 ease-out motion-reduce:transition-none" style={{ transform: `translateX(-${heroSlide * 100}%)` }} aria-live="polite">
          <div className="relative h-[250px] w-full shrink-0 overflow-hidden bg-[#073d28] sm:h-[320px] lg:h-[380px]">
            <img src={heroImages[0]} alt="Hạt cà phê và nông sản Việt Nam" className="absolute inset-0 h-full w-full object-cover object-center" fetchPriority="high" decoding="async" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#042c1c]/95 via-[#063d27]/75 to-[#063d27]/10" />
            <div className="relative flex h-full max-w-3xl flex-col justify-center px-5 pr-16 text-white sm:px-10 sm:pr-24 lg:px-16">
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-amber-300 sm:text-sm">Chợ Xanh Việt · Hải Tây Phát</p>
              <h2 className="mt-2 max-w-2xl text-2xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">CÀ PHÊ VIỆT NAM</h2>
              <p className="mt-1 max-w-xl text-lg font-bold leading-tight text-amber-50 sm:text-2xl lg:text-3xl">Chất lượng tạo nên giá trị</p>
              <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-semibold sm:mt-6 sm:gap-3 sm:text-sm">
                <span className="rounded-full border border-white/25 bg-white/10 px-3 py-2 backdrop-blur">Giá cả minh bạch</span>
                <span className="rounded-full border border-white/25 bg-white/10 px-3 py-2 backdrop-blur">Cập nhật theo nguồn</span>
                <span className="rounded-full border border-white/25 bg-white/10 px-3 py-2 backdrop-blur">Kết nối nhà nông</span>
              </div>
              <Link to="/bang-gia" className="mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-emerald-500 px-4 py-2.5 text-xs font-extrabold text-white shadow-lg transition hover:bg-emerald-400 sm:mt-5 sm:text-sm">Xem bảng giá cà phê <ArrowRight size={16} /></Link>
            </div>
          </div>
          <div className="relative h-[250px] w-full shrink-0 overflow-hidden bg-[#073d28] sm:h-[320px] lg:h-[380px]">
            <img src={heroImages[1]} alt="Các bao phân bón xếp trong kho hàng" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#052f20]/90 via-[#075b38]/55 to-transparent" />
            <div className="relative flex h-full max-w-3xl flex-col justify-center px-5 pr-28 text-white sm:px-10 sm:pr-48 lg:px-16">
              <p className="text-xs font-bold uppercase tracking-[.18em] text-amber-300 sm:text-sm">Phân bón thương hiệu</p>
              <h2 className="mt-2 max-w-2xl text-2xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">NPK Phú Mỹ cho mùa vụ bội thu</h2>
              <p className="mt-3 max-w-xl text-sm text-white/90 sm:text-lg">Tra cứu thông tin phân bón, hàm lượng và nhà cung cấp trước khi lựa chọn.</p>
            </div>
            <div className="absolute bottom-4 right-4 sm:right-10 sm:bottom-7">
              <Link to="/cua-hang" search={{ dm: "phan-bon" as never }} className="inline-flex items-center gap-2 rounded-full bg-[#ffc629] px-4 py-2.5 text-xs font-extrabold text-[#173a2a] shadow-lg transition hover:bg-[#ffda63] sm:text-sm">
                Xem danh mục phân bón <ArrowRight size={16} />
              </Link>
            </div>
          </div>
          <div className="relative h-[250px] w-full shrink-0 overflow-hidden bg-[#073d28] sm:h-[320px] lg:h-[380px]">
            <img src={heroImages[2]} alt="Chùm quả hồ tiêu trên cây" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#052f20]/90 via-[#075b38]/55 to-transparent" />
            <div className="relative flex h-full max-w-3xl flex-col justify-center px-5 pr-28 text-white sm:px-10 sm:pr-48 lg:px-16">
              <p className="text-xs font-bold uppercase tracking-[.18em] text-amber-300 sm:text-sm">Thuốc bảo vệ thực vật</p>
              <h2 className="mt-2 max-w-2xl text-2xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">Giải pháp mùa vụ từ Syngenta</h2>
              <p className="mt-3 max-w-xl text-sm text-white/90 sm:text-lg">Tìm thông tin sản phẩm, đọc nhãn và xác minh nguồn gốc trước khi mua.</p>
            </div>
            <div className="absolute bottom-4 right-4 sm:right-10 sm:bottom-7">
              <Link to="/cua-hang" search={{ dm: "thuoc-bvtv" as never }} className="inline-flex items-center gap-2 rounded-full bg-[#ffc629] px-4 py-2.5 text-xs font-extrabold text-[#173a2a] shadow-lg transition hover:bg-[#ffda63] sm:text-sm">
                Xem danh mục thuốc BVTV <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
        <button type="button" aria-label="Banner trước" onClick={() => setHeroSlide((current) => (current + 2) % 3)} className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-black/30 text-white backdrop-blur transition hover:bg-black/55 sm:left-5 sm:h-11 sm:w-11"><ArrowLeft size={20} /></button>
        <button type="button" aria-label="Banner tiếp theo" onClick={() => setHeroSlide((current) => (current + 1) % 3)} className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-black/30 text-white backdrop-blur transition hover:bg-black/55 sm:right-5 sm:h-11 sm:w-11"><ArrowRight size={20} /></button>
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/25 px-3 py-2 backdrop-blur-sm">
          {heroImages.map((_, index) => <button key={index} type="button" aria-label={`Chuyển đến banner ${index + 1}`} aria-current={heroSlide === index ? "true" : undefined} onClick={() => setHeroSlide(index)} className={`h-2 rounded-full transition-all ${heroSlide === index ? "w-6 bg-white" : "w-2 bg-white/60 hover:bg-white"}`} />)}
        </div>
      </section>

      <Page>
        {/* Bảng giá nằm ngay dưới banner */}
        <section className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-[0_8px_30px_rgba(15,45,30,0.06)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-100 bg-gradient-to-r from-[#f1fbf5] to-white px-4 py-4 sm:px-6">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-extrabold text-[#075b38] sm:text-xl">
                <ChartNoAxesCombined size={21} /> Bảng giá nông sản hôm nay
              </h2>
              <p className="mt-1 text-xs text-slate-500 sm:text-sm">Giá mới nhất và mức thay đổi so với phiên ghi nhận trước đó</p>
            </div>
            <Link to="/bang-gia" className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-white px-3 py-2 text-sm font-bold text-[#087343] hover:bg-emerald-50">
              Xem bảng giá <ArrowRight size={15} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left text-[11px]">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-2.5 py-2 font-semibold sm:px-3">Mặt hàng</th>
                  <th className="px-2.5 py-2 font-semibold">Khu vực</th>
                  <th className="px-2.5 py-2 text-right font-semibold">Giá hiện tại</th>
                  <th className="px-2.5 py-2 text-right font-semibold">Phiên trước</th>
                  <th className="px-2.5 py-2 text-right font-semibold">Chênh lệch</th>
                  <th className="px-2.5 py-2 text-right font-semibold">Tăng / giảm %</th>
                  <th className="px-2.5 py-2 text-right font-semibold">Ngày giá</th>
                  <th className="px-2.5 py-2 font-semibold">Nguồn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayPrices.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">Chưa có dữ liệu giá thực tế để hiển thị.</td></tr>
                )}
                {displayPrices.map(({ current: row, previous }) => {
                  const price = Number(row.price);
                  const previousPrice = previous ? Number(previous.price) : null;
                  const change = previousPrice !== null ? price - previousPrice : null;
                  const percent = previousPrice && change !== null ? (change / previousPrice) * 100 : null;
                  const isUp = change !== null && change > 0;
                  const isDown = change !== null && change < 0;
                  const changeColor = isUp ? "text-emerald-700" : isDown ? "text-rose-600" : "text-slate-500";
                  const changeIcon = isUp ? "↑" : isDown ? "↓" : "—";
                  const formatPrice = (value: number) => row.currency === "VND"
                    ? vnd(value)
                    : value.toLocaleString("en-US", { maximumFractionDigits: 2 }) + " " + row.currency;
                  return (
                    <tr key={row.id} className="transition hover:bg-emerald-50/50">
                      <td className="px-2.5 py-2 sm:px-3">
                        <div className="font-bold text-slate-800">{row.crop}</div>
                        <div className="mt-0.5 text-xs text-slate-500">Đơn vị: {row.unit}</div>
                      </td>
                      <td className="px-2.5 py-2 text-slate-600">{row.province}</td>
                      <td className="whitespace-nowrap px-2.5 py-2 text-right font-extrabold text-[#075b38]">{formatPrice(price)}</td>
                      <td className="whitespace-nowrap px-2.5 py-2 text-right text-slate-600">{previousPrice !== null ? formatPrice(previousPrice) : "—"}</td>
                      <td className={`whitespace-nowrap px-2.5 py-2 text-right font-bold ${changeColor}`}>
                        {change === null ? <span className="font-medium text-slate-400">Chưa có dữ liệu</span> : <span>{changeIcon} {change > 0 ? "+" : ""}{formatPrice(change)}</span>}
                      </td>
                      <td className={`whitespace-nowrap px-2.5 py-2 text-right font-bold ${changeColor}`}>{percent !== null ? (percent > 0 ? "+" : "") + percent.toFixed(2) + "%" : "—"}</td>
                      <td className="whitespace-nowrap px-2.5 py-2 text-right text-[10px] text-slate-500">{row.price_date}</td>
                      <td className="max-w-[140px] truncate px-2.5 py-2 text-[10px] text-slate-500" title={row.source}>{row.source || "Chưa ghi nguồn"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-100 bg-slate-50/70 px-4 py-3 text-[11px] text-slate-500 sm:px-6">
            <span><span className="font-bold text-emerald-700">↑ Tăng</span> · <span className="font-bold text-rose-600">↓ Giảm</span> · <span className="font-bold">— Đi ngang</span></span>
            <span>Chỉ so sánh cùng mặt hàng, khu vực, đơn vị và loại tiền ở ngày ghi nhận trước đó.</span>
          </div>
        </section>

        {/* Danh mục nông sản và vật tư */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-6">
          {categoryVisuals.map((c) => (
            <Link
              key={c.id}
              to={c.route === "nongsan" ? "/cho" : "/cua-hang"}
              search={c.route === "nongsan" ? { q: c.search } : { dm: c.search as never }}
              className="group overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_2px_10px_rgba(15,45,30,0.06)] transition duration-200 hover:-translate-y-1 hover:border-[#075b38]/20 hover:shadow-[0_8px_24px_rgba(7,91,56,0.12)]"
            >
              <div className="h-[110px] overflow-hidden sm:h-36">
                <img src={c.image} alt={c.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              </div>
              <div className="flex min-h-[58px] items-center justify-between gap-2 px-3 py-3 sm:p-4">
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-bold leading-tight text-slate-900 sm:text-base">{c.title}</h2>
                  <p className="mt-0.5 hidden line-clamp-1 text-xs text-slate-500 sm:block">{c.desc}</p>
                </div>
                <ArrowRight size={14} className="shrink-0 text-[#087343] opacity-70 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
              </div>
            </Link>
          ))}
        </section>

        {/* Sản phẩm nổi bật */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-[#087343] sm:text-xl">Sản phẩm nổi bật</h2>
            <Link to="/cua-hang" className="text-sm font-semibold text-[#087343] hover:underline">Xem tất cả <ArrowRight size={14} className="inline" /></Link>
          </div>
          <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible xl:grid-cols-4">
            {featuredProducts.length ? featuredProducts.map((p) => (
              <div key={p.id} className="min-w-[150px] snap-start space-y-1 sm:min-w-0"><p className="px-1 text-[10px] font-bold text-emerald-700">NGƯỜI BÁN ĐÃ ĐĂNG</p><ProductCard p={p} /></div>
            )) : referenceProducts.slice(0, 4).map((p) => (
              <div key={p.id} className="min-w-[150px] snap-start space-y-1 sm:min-w-0"><p className="px-1 text-[10px] font-bold text-slate-500">THAM KHẢO · LIÊN HỆ</p><ProductCard p={p} /></div>
            ))}
          </div>
        </section>

        {/* Banner CTA */}
        <Link
          to="/cua-hang"
          search={{ dm: "vat-tu" as never }}
          className="group relative block overflow-hidden rounded-2xl bg-[#075b38] shadow-sm ring-1 ring-emerald-900/10"
        >
          <img
            src="https://bcp.cdnchinhphu.vn/334894974524682240/2022/12/31/phan-bon-2-16563241995661012848475-16724794670331355401155.jpg"
            alt="Kho bao phân bón nông nghiệp"
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#06452e]/95 via-[#075b38]/78 to-transparent" />
          <div className="relative max-w-lg px-5 py-7 text-white sm:px-8 sm:py-10">
            <p className="text-xs font-bold uppercase tracking-widest text-[#ffd35c]">Dành cho nhà vườn</p>
            <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">Dụng cụ & vật tư nông nghiệp</h2>
            <p className="mt-1 text-sm text-white/90">Chất lượng · Bền bỉ · Dễ tìm trên điện thoại</p>
            <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#ffc629] px-4 py-2.5 text-sm font-bold text-[#173a2a] transition group-hover:bg-[#ffd24a]">
              Khám phá vật tư <ArrowRight size={16} />
            </span>
          </div>
        </Link>

        {/* Why us */}
        <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-[#075b38] via-[#0b7045] to-[#eaf4ec] p-5 text-white shadow-sm sm:p-7">
          <div className="grid gap-5 md:grid-cols-[1.1fr_2fr] md:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.18em] text-[#f6d36b]">Đồng hành cùng nhà nông</p>
              <h2 className="mt-2 text-2xl font-extrabold">Vì sao chọn Hải Tây Phát?</h2>
              <p className="mt-2 text-sm leading-6 text-white/85">
                Thông tin minh bạch, kết nối thuận tiện, ưu tiên trải nghiệm trên điện thoại.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              {[
                { icon: PackageCheck, title: "Nguồn hàng rõ", desc: "Thông tin người bán" },
                { icon: ShieldCheck, title: "Minh bạch", desc: "Không tự gắn xác minh" },
                { icon: Sprout, title: "Gần nhà nông", desc: "Danh mục chuyên ngành" },
                { icon: Headset, title: "Hỗ trợ tận tâm", desc: "Kết nối khi cần" },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="rounded-xl border border-white/15 bg-white/10 p-3.5 backdrop-blur-sm">
                  <Icon size={22} className="mb-2 text-[#f6d36b]" />
                  <div className="font-bold">{title}</div>
                  <div className="mt-1 text-xs text-white/70">{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Page>
    </div>
  );
}
