import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Search, X } from "lucide-react";
import { CROPS, LISTINGS, PROVINCES } from "@/data/sample";
import { Page, SampleNotice } from "@/components/Layout";
import { ListingCard } from "@/components/Cards";

type S = { loai?: string; nongsan?: string; tinh?: string };
export const Route = createFileRoute("/cho/")({
  validateSearch: (s: Record<string, unknown>): S => {
    const r: S = {};
    for (const k of ["loai", "nongsan", "tinh"] as const) {
      const v = s[k];
      if (typeof v === "string" && v) r[k] = v;
    }
    return r;
  },
  head: () => ({
    meta: [
      { title: "Chợ nông sản — Tin bán và thu mua | Chợ Xanh Việt" },
      { name: "description", content: "Tin bán nông sản của nông dân và nhu cầu thu mua, lọc theo loại hàng và tỉnh thành." },
      { property: "og:title", content: "Chợ nông sản" },
      { property: "og:description", content: "Tin bán và thu mua nông sản theo tỉnh thành." },
    ],
  }),
  component: Market,
});

function Market() {
  const s = Route.useSearch();
  const nav = useNavigate({ from: "/cho/" });
  const [query, setQuery] = useState("");
  const set = (k: keyof S, v: string) => {
    const n: S = { ...s };
    if (v) n[k] = v;
    else delete n[k];
    nav({ search: n });
  };
  const normalizedQuery = query.trim().toLocaleLowerCase("vi");
  const items = LISTINGS.filter((l) =>
    (!s.loai || l.type === s.loai) &&
    (!s.nongsan || l.crop === s.nongsan) &&
    (!s.tinh || l.province === s.tinh) &&
    (!normalizedQuery || [l.title, l.crop, l.province, l.description, l.quantity].some((v) => v.toLocaleLowerCase("vi").includes(normalizedQuery)))
  );
  const hasFilters = Boolean(s.loai || s.nongsan || s.tinh || query);
  const clearFilters = () => {
    setQuery("");
    nav({ search: {} });
  };

  return (
    <Page title="Chợ nông sản">
      <SampleNotice>Các tin đang hiển thị là TIN MẪU để xem thử giao diện, chưa phải tin mua bán thật. Tin đăng mới cần tài khoản và sẽ chờ kiểm duyệt trước khi công khai.</SampleNotice>
      <a href="/dang-tin" className="btn-primary w-full text-center">＋ Đăng tin bán / thu mua nông sản</a>
      <label htmlFor="market-search" className="font-semibold">Tìm tin bán hoặc thu mua</label>
      <div className="relative">
        <Search aria-hidden="true" className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <input id="market-search" className="field pl-10 pr-12" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ví dụ: cà phê, sầu riêng, Gia Lai..." />
        {query && <button type="button" onClick={() => setQuery("")} aria-label="Xóa từ khóa" className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg hover:bg-secondary"><X size={18} /></button>}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[[ "", "Tất cả" ], [ "ban", "Cần bán" ], [ "mua", "Cần mua" ]].map(([v, t]) => (
          <button key={v} onClick={() => set("loai", v ?? "")} className={(s.loai ?? "") === v ? "btn-primary px-2" : "btn-outline px-2"}>{t}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <select className="field" value={s.nongsan ?? ""} onChange={(e) => set("nongsan", e.target.value)} aria-label="Loại nông sản">
          <option value="">Mọi nông sản</option>{CROPS.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select className="field" value={s.tinh ?? ""} onChange={(e) => set("tinh", e.target.value)} aria-label="Tỉnh thành">
          <option value="">Mọi tỉnh</option>{PROVINCES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground">Tìm thấy <strong>{items.length}</strong> tin mẫu</p>
        {hasFilters && <button type="button" onClick={clearFilters} className="text-sm font-semibold text-primary underline underline-offset-4">Xóa bộ lọc</button>}
      </div>
      {items.length === 0 ? (
        <div className="card px-4 py-10 text-center">
          <div className="text-4xl">🔎</div>
          <p className="mt-3 font-semibold">Chưa tìm thấy tin phù hợp</p>
          <p className="mt-1 text-sm text-muted-foreground">Thử từ khóa hoặc địa phương khác nhé.</p>
          <button type="button" onClick={clearFilters} className="btn-outline mt-4">Xem tất cả tin</button>
        </div>
      ) : <div className="grid gap-3 md:grid-cols-2">{items.map((l) => <ListingCard key={l.id} l={l} />)}</div>}
    </Page>
  );
}
