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
      .limit(300)
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
    const patterns = [/cà phê nhân xô/i, /^hồ tiêu$/i, /sầu riêng ri6 loại a/i, /lúa om5451/i, /cao su mủ đông/i];
    return patterns.map((pattern) => latestRows.find(({ current }) => pattern.test(current.crop))).filter(Boolean) as Array<{ current: PriceRow; previous: PriceRow | null }>;
  })();

  const heroImages = [
    "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1800&q=90",
    "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1800&q=90",
    "https://images.unsplash.com/photo-1559525839-b184a4d698c7?auto=format&fit=crop&w=1800&q=90",
  ];

  return (
    <div className="bg-[#f5f8f6]">
      {/* Hero banner: one complete image uploaded to public/IMG_1201.png */}
      <section className="w-full overflow-hidden bg-[#073d28]">
        <img
          src="/IMG_1201.png"
          alt="Chợ Xanh Việt — kết nối nhà nông, giá trị bền vững; cà phê Robusta và phân bón"
          className="block h-auto w-full"
          fetchPriority="high"
          decoding="async"
        />
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
            <table className="w-full min-w-[620px] border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold sm:px-6">Mặt hàng</th>
                  <th className="px-4 py-3 font-semibold">Khu vực</th>
                  <th className="px-4 py-3 text-right font-semibold">Giá hiện tại</th>
                  <th className="px-4 py-3 text-right font-semibold">So với phiên trước</th>
                  <th className="px-4 py-3 text-right font-semibold">Ngày giá</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayPrices.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">Chưa có dữ liệu giá thực tế để hiển thị.</td></tr>
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
                      <td className="px-4 py-3.5 sm:px-6">
                        <div className="font-bold text-slate-800">{row.crop}</div>
                        <div className="mt-0.5 text-xs text-slate-500">Đơn vị: {row.unit}</div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">{row.province}</td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-right font-extrabold text-[#075b38]">{formatPrice(price)}</td>
                      <td className={`whitespace-nowrap px-4 py-3.5 text-right font-bold ${changeColor}`}>
                        {change === null ? <span className="text-xs font-medium text-slate-400">Chưa có dữ liệu so sánh</span> : (
                          <span>{changeIcon} {change > 0 ? "+" : ""}{formatPrice(change)}<span className="mt-0.5 block text-xs font-semibold">({percent !== null ? (percent > 0 ? "+" : "") + percent.toFixed(2) + "%" : "—"})</span></span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-right text-xs text-slate-500">{row.price_date}</td>
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
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {categoryVisuals.map((c) => (
            <Link
              key={c.id}
              to={c.id === "nongsan" ? "/cho" : "/cua-hang"}
              search={c.id === "nongsan" ? undefined : { dm: c.search as never }}
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
              <div key={p.id} className="min-w-[150px] snap-start sm:min-w-0"><ProductCard p={p} /></div>
            )) : (
              <div className="w-full rounded-2xl border border-dashed border-emerald-200 bg-white/90 p-6 text-sm text-slate-600">
                Chưa có sản phẩm thật được duyệt. Sản phẩm sẽ hiện tại đây khi có dữ liệu hợp lệ.
              </div>
            )}
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
