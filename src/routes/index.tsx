import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, ChartNoAxesCombined, Headset, PackageCheck, ShieldCheck, Sprout } from "lucide-react";
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

function Index() {
  const [liveProducts, setLiveProducts] = useState<Product[]>([]);
  const [livePrices, setLivePrices] = useState<
    Array<{ id: string; crop: string; unit: string; province: string; price: number; price_date: string; source: string; currency: string }>
  >([]);
  const [heroSlide, setHeroSlide] = useState(0);

  useEffect(() => {
    let active = true;
    void supabase
      .from("prices")
      .select("id,crop,unit,province,price,price_date,source,currency")
      .order("price_date", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        if (active && data?.length) setLivePrices(data as typeof livePrices);
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
    const sourceRows = livePrices;
    const patterns = [/cà phê nhân xô/i, /^hồ tiêu$/i, /sầu riêng ri6 loại a/i, /lúa om5451/i, /cao su mủ đông/i];
    const chosen = patterns.map((pattern) => sourceRows.find((row) => pattern.test(row.crop))).filter(Boolean);
    const unique = new Map<string, (typeof sourceRows)[number]>();
    for (const row of chosen) if (row) unique.set(row.crop, row);
    return [...unique.values()].slice(0, 5);
  })();

  const heroImages = [
    "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1800&q=90",
    "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1800&q=90",
    "https://images.unsplash.com/photo-1559525839-b184a4d698c7?auto=format&fit=crop&w=1800&q=90",
  ];

  return (
    <div className="bg-[#f5f8f6]">
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-[#073d28]">
        <div
          className="absolute inset-0 -z-20 bg-cover bg-center transition-opacity duration-500"
          style={{ backgroundImage: `url('${heroImages[heroSlide]}')` }}
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#052f20]/95 via-[#075b38]/82 to-[#075b38]/20" />
        <div className="mx-auto grid min-h-[350px] max-w-[1400px] items-center gap-3 px-4 py-9 sm:min-h-[430px] sm:px-8 sm:py-12 md:grid-cols-[1fr_.85fr]">
          <div className="max-w-xl pb-10 md:pb-0">
            <span className="inline-flex rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[10px] font-bold tracking-wide text-[#ffe08a] backdrop-blur-sm sm:text-xs">
              NÔNG NGHIỆP BỀN VỮNG · GIÁ TRỊ DÀI LÂU
            </span>
            <h1 className="mt-3 text-[2rem] font-extrabold leading-[1.08] tracking-tight text-white drop-shadow-sm sm:mt-4 sm:text-5xl lg:text-6xl">
              Kết nối nhà nông
              <br />
              <span className="text-[#ffd04a]">Giá trị bền vững</span>
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/90 sm:mt-5 sm:text-base sm:leading-7">
              Hải Tây Phát cung cấp nông sản, phân bón, thuốc BVTV, vật tư nông nghiệp — thông tin rõ ràng, dễ dùng trên điện thoại.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to="/cua-hang"
                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#ffc629] px-6 text-sm font-extrabold text-[#19352a] shadow-[0_8px_24px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5 hover:bg-[#ffd24a]"
              >
                Mua sắm ngay <ArrowRight size={16} />
              </Link>
              <Link
                to="/cho"
                className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/60 bg-white/10 px-5 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                Chợ nông sản
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-white/90 sm:text-sm">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck size={15} className="text-[#ffd04a]" /> Thông tin rõ ràng</span>
              <span className="inline-flex items-center gap-1.5"><Sprout size={15} className="text-[#ffd04a]" /> Dành riêng cho nhà nông</span>
              <span className="inline-flex items-center gap-1.5"><Headset size={15} className="text-[#ffd04a]" /> Kết nối trực tiếp</span>
            </div>
          </div>
          <div className="relative mx-auto grid w-full max-w-[430px] grid-cols-2 gap-3 pb-8 md:mx-0 md:pb-0">
            <div className="group relative mt-5 overflow-hidden rounded-2xl border-2 border-white/80 shadow-2xl">
              <img
                className="h-32 w-full object-cover transition duration-500 group-hover:scale-105 sm:h-40"
                src="https://images.unsplash.com/photo-1559525839-b184a4d698c7?auto=format&fit=crop&w=700&q=85"
                alt="Vườn cà phê xanh tốt và quả cà phê"
                loading="lazy"
              />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2 pt-7 text-xs font-extrabold text-white sm:text-sm">CÀ PHÊ</span>
            </div>
            <div className="group relative overflow-hidden rounded-2xl border-2 border-white/80 shadow-2xl">
              <img
                className="h-32 w-full object-cover transition duration-500 group-hover:scale-105 sm:h-40"
                src="https://media.thuonghieucongluan.vn/uploads/2021/09/25/a6-1632530904.jpg"
                alt="Công nhân khai thác mủ tại vườn cao su"
                loading="lazy"
              />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2 pt-7 text-xs font-extrabold text-white sm:text-sm">CAO SU</span>
            </div>
            <div className="group relative mt-[-4px] overflow-hidden rounded-2xl border-2 border-white/80 shadow-2xl">
              <img
                className="h-32 w-full object-cover transition duration-500 group-hover:scale-105 sm:h-40"
                src="https://mediafr.vietnamplus.vn/images/6918feb0a7fd892f37a68eead54384ba364dd32b3bede8218dd679fd11a7b0f71686a6223e5afcb3fd7c30b61dba0d3fbc641214598d56ebf6ac7b349144c1fa/poivre.jpg"
                alt="Chùm hồ tiêu trên cây tiêu"
                loading="lazy"
              />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2 pt-7 text-xs font-extrabold text-white sm:text-sm">HỒ TIÊU</span>
            </div>
            <div className="group relative mt-[-4px] overflow-hidden rounded-2xl border-2 border-white/80 bg-white shadow-2xl">
              <img
                className="h-32 w-full object-contain bg-white p-2 transition duration-500 group-hover:scale-[1.03] sm:h-40"
                src="https://www.sikumis.com/media/frontend/products/Kebomas-15-15-15-3D.jpg"
                alt="Bao phân NPK 15-15-15 minh họa"
                loading="lazy"
              />
              <span className="absolute inset-x-0 bottom-0 bg-[#075b38]/95 px-3 py-2 text-xs font-extrabold text-white sm:text-sm">PHÂN BÓN NPK</span>
            </div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full border border-white/40 bg-[#ffc629] px-4 py-2 text-[10px] font-extrabold tracking-wide text-[#19352a] shadow-lg sm:text-xs">
              TỪ VƯỜN CÂY ĐẾN SẢN PHẨM
            </div>
          </div>
          <button
            type="button"
            aria-label="Banner trước"
            onClick={() => setHeroSlide((heroSlide + 2) % 3)}
            className="absolute left-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/95 p-2.5 text-[#075b38] shadow-md transition hover:bg-white md:block"
          >
            <ArrowLeft size={18} />
          </button>
          <button
            type="button"
            aria-label="Banner tiếp theo"
            onClick={() => setHeroSlide((heroSlide + 1) % 3)}
            className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/95 p-2.5 text-[#075b38] shadow-md transition hover:bg-white md:block"
          >
            <ArrowRight size={18} />
          </button>
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
            {[0, 1, 2].map((i) => (
              <button
                key={i}
                aria-label={`Chọn banner ${i + 1}`}
                onClick={() => setHeroSlide(i)}
                className={`h-2 rounded-full transition-all ${heroSlide === i ? "w-6 bg-[#075b38]" : "w-2 bg-white/90"}`}
              />
            ))}
          </div>
        </div>
      </section>

      <Page>
        {/* Danh mục — kiểu icon/grid e-commerce */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {categoryVisuals.map((c) => (
            <Link
              key={c.id}
              to={c.id === "nongsan" ? "/cho" : "/cua-hang"}
              search={c.id === "nongsan" ? undefined : { dm: c.search as never }}
              className="group overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_2px_10px_rgba(15,45,30,0.06)] transition duration-200 hover:-translate-y-1 hover:border-[#075b38]/20 hover:shadow-[0_8px_24px_rgba(7,91,56,0.12)]"
            >
              <div className="h-[110px] overflow-hidden sm:h-36">
                <img
                  src={c.image}
                  alt={c.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
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

        {/* Giá + Sản phẩm */}
        <section className="grid gap-6 lg:grid-cols-[1.05fr_1.4fr]">
          <div className="rounded-2xl border border-[#cfe9dc] bg-gradient-to-br from-[#f8fffb] to-[#eaf7f0] p-4 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-lg font-extrabold text-[#075b38]">
                <ChartNoAxesCombined size={20} /> Giá nông sản mới nhất
              </h2>
              <Link to="/bang-gia" className="text-sm font-semibold text-[#087343] hover:underline">
                Xem tất cả <ArrowRight size={14} className="inline" />
              </Link>
            </div>
            <p className="mt-1 text-xs text-slate-500">Giá tham khảo theo vùng, có ngày ghi nhận và nguồn.</p>
            <div className="mt-4 divide-y divide-slate-100/80">
              {displayPrices.length === 0 && (
                <p className="rounded-xl bg-white/70 px-3 py-5 text-sm text-slate-600">
                  Chưa có dữ liệu giá thực tế để hiển thị.
                </p>
              )}
              {displayPrices.map((row) => (
                <div
                  key={row.id}
                  className="grid grid-cols-[36px_1fr_auto] items-center gap-2.5 py-2.5 text-xs sm:grid-cols-[40px_1fr_auto] sm:gap-3 sm:py-3 sm:text-sm"
                >
                  <img
                    className="size-9 rounded-full border border-emerald-100 object-cover sm:size-10"
                    src={
                      row.crop.toLowerCase().includes("cà phê")
                        ? "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=120&q=80"
                        : row.crop.toLowerCase().includes("tiêu")
                          ? "https://images.unsplash.com/photo-1599909533730-f9d4c9c1f7f5?auto=format&fit=crop&w=120&q=80"
                          : row.crop.toLowerCase().includes("lúa")
                            ? "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=120&q=80"
                            : row.crop.toLowerCase().includes("cao su")
                              ? "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=120&q=80"
                              : "https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&w=120&q=80"
                    }
                    alt={row.crop}
                    loading="lazy"
                  />
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-800">{row.crop}</div>
                    <div className="truncate text-[10px] text-slate-500 sm:text-xs">
                      {row.province} · /{row.unit}
                    </div>
                  </div>
                  <div className="text-right font-bold text-emerald-700">
                    {row.currency === "VND" ? vnd(Number(row.price)) : Number(row.price).toLocaleString("en-US") + " " + row.currency}
                    <div className="text-[9px] font-normal text-slate-500 sm:text-[10px]">{row.price_date}</div>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 border-t border-slate-100 pt-3 text-[11px] leading-5 text-slate-500">
              Giá theo ngày ghi nhận từ CSDL; có thể khác theo phẩm cấp và điểm thu mua.
            </p>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-[#087343] sm:text-xl">Sản phẩm nổi bật</h2>
              <Link to="/cua-hang" className="text-sm font-semibold text-[#087343] hover:underline">
                Xem tất cả <ArrowRight size={14} className="inline" />
              </Link>
            </div>
            <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible xl:grid-cols-4">
              {featuredProducts.length ? (
                featuredProducts.map((p) => (
                  <div key={p.id} className="min-w-[150px] snap-start sm:min-w-0">
                    <ProductCard p={p} />
                  </div>
                ))
              ) : (
                <div className="w-full rounded-2xl border border-dashed border-emerald-200 bg-white/90 p-6 text-sm text-slate-600 sm:col-span-2 xl:col-span-4">
                  Chưa có sản phẩm thật được duyệt. Sản phẩm sẽ hiện tại đây khi có dữ liệu hợp lệ.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Banner CTA */}
        <Link
          to="/cua-hang"
          search={{ dm: "vat-tu" as never }}
          className="group relative block overflow-hidden rounded-2xl bg-[#075b38] shadow-sm ring-1 ring-emerald-900/10"
        >
          <img
            src="https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=1600&q=85"
            alt="Vật tư nông nghiệp"
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
