import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CROPS, LISTINGS, PROVINCES } from "@/data/sample";
import { Page, SampleNotice } from "@/components/Layout";
import { ListingCard } from "@/components/Cards";

type S = { loai?: string; nongsan?: string; tinh?: string };
export const Route = createFileRoute("/cho/")({
  validateSearch: (s: Record<string, unknown>): S => ({ loai: (s.loai as string) || undefined, nongsan: (s.nongsan as string) || undefined, tinh: (s.tinh as string) || undefined }),
  head: () => ({
    meta: [
      { title: "Chợ nông sản — Tin bán và thu mua | Chợ Nông Sản Việt" },
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
  const set = (k: keyof S, v: string) => nav({ search: { ...s, [k]: v || undefined } });
  const items = LISTINGS.filter((l) => (!s.loai || l.type === s.loai) && (!s.nongsan || l.crop === s.nongsan) && (!s.tinh || l.province === s.tinh));
  return (
    <Page title="Chợ nông sản">
      <SampleNotice>Các tin dưới đây là TIN MẪU. Chức năng đăng tin sẽ mở sau khi có tài khoản.</SampleNotice>
      <div className="grid grid-cols-3 gap-2">
        {[["", "Tất cả"], ["ban", "Cần bán"], ["mua", "Cần mua"]].map(([v, t]) => (
          <button key={v} onClick={() => set("loai", v)} className={(s.loai ?? "") === v ? "btn-primary px-2" : "btn-outline px-2"}>{t}</button>
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
      <p className="text-muted-foreground">{items.length} tin đăng</p>
      {items.length === 0 ? <p className="py-10 text-center text-muted-foreground">Không có tin phù hợp.</p> :
        <div className="grid gap-3 md:grid-cols-2">{items.map((l) => <ListingCard key={l.id} l={l} />)}</div>}
    </Page>
  );
}
