import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PRICES, PROVINCES, vnd } from "@/data/sample";
import { Page } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";

type CropPrice = {
  id: string;
  crop: string;
  unit: string;
  province: string;
  price: number;
  price_date: string;
  source: string;
  currency: "VND" | "USD" | "USC";
};
function sourceUrl(source: string): string | null {
  const separator = source.indexOf(" — ");
  const url = separator >= 0 ? source.slice(separator + 3).trim() : "";
  return url.startsWith("https://") || url.startsWith("http://") ? url : null;
}
function sourceLabel(source: string) {
  return source.split(" — ")[0];
}

function formatPrice(price: number, currency: string, unit: string) {
  const amount = Number(price).toLocaleString(currency === "VND" ? "vi-VN" : "en-US", { maximumFractionDigits: 2 });
  if (currency === "USD") return `${amount} USD/${unit}`;
  if (currency === "USC") return `${amount} US cent/${unit}`;
  return `${vnd(price)}/${unit}`;
}


export const Route = createFileRoute("/bang-gia")({
  head: () => ({
    meta: [
      { title: "Bảng giá nông sản theo địa phương — Hải Tây Phát" },
      { name: "description", content: "Bảng giá nông sản có ngày cập nhật và nguồn tham khảo, theo địa phương." },
      { property: "og:title", content: "Bảng giá nông sản" },
      { property: "og:description", content: "Giá nông sản theo ngày và địa phương, có nguồn tham khảo." },
    ],
  }),
  component: Prices,
});

function Prices() {
  const [tinh, setTinh] = useState("");
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("Tất cả");
  const [usingSnapshot, setUsingSnapshot] = useState(false);
  const [rows, setRows] = useState<CropPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      const { data, error: queryError } = await supabase
        .from("prices")
        .select("id,crop,unit,province,price,price_date,source,currency")
        .order("price_date", { ascending: false })
        .order("province", { ascending: true })
        .order("crop", { ascending: true })
        .limit(300);
      if (!active) return;
      if (queryError) {
        setError("Chưa đọc được bảng giá từ cơ sở dữ liệu. Quản trị viên cần áp dụng migration bảng giá trong thư mục supabase/migrations.");
        setRows([]);
      } else {
        const liveRows = (data ?? []) as CropPrice[];
        if (liveRows.length) {
          setRows(liveRows);
          setUsingSnapshot(false);
        } else {
          setRows(PRICES.filter((row) => row.price != null).map((row, index) => ({
            id: "snapshot-" + index, crop: row.crop, unit: row.unit, province: row.province,
            price: Number(row.price), price_date: "2026-10-20", source: row.source ?? "Nguồn chưa rõ", currency: "VND" as const,
          })));
          setUsingSnapshot(true);
        }
      }
      setLoading(false);
    };
    void load();
    return () => { active = false; };
  }, []);

  const groups = ["Tất cả", "Cà phê", "Hồ tiêu", "Sầu riêng", "Lúa gạo", "Cao su"];
  const filtered = rows.filter((row) => {
    const matchesProvince = !tinh || row.province === tinh;
    const matchesQuery = !query || (row.crop + " " + row.province).toLocaleLowerCase("vi").includes(query.toLocaleLowerCase("vi"));
    const matchesGroup = group === "Tất cả" || (group === "Hồ tiêu" ? /tiêu/i.test(row.crop) : group === "Lúa gạo" ? /lúa|gạo/i.test(row.crop) : row.crop.toLocaleLowerCase("vi").includes(group.toLocaleLowerCase("vi")));
    return matchesProvince && matchesQuery && matchesGroup;
  });
  return (
    <Page title="Bảng giá nông sản">
      <div className="card space-y-2 p-4">
        <p className="font-semibold">Giá tham khảo có ngày và nguồn</p>
        <p className="text-sm text-muted-foreground">Giá cà phê và hồ tiêu được tự động đồng bộ mỗi ngày từ các website chuyên ngành, kèm ngày giá và liên kết nguồn. Giá giao dịch thực tế có thể khác theo chất lượng, sản lượng và thời điểm; hãy xác nhận với bên mua/bán trước khi giao dịch.</p>
      </div>
      {usingSnapshot && <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Đang hiển thị dữ liệu tham khảo thu thập ngày 20/10/2026 từ các nguồn công khai, vì cơ sở dữ liệu chưa có bảng giá. Đây chưa phải đồng bộ tự động; mỗi dòng có liên kết nguồn để kiểm tra.</div>}
      <div className="grid gap-3 sm:grid-cols-2">
      <label className="block space-y-1">
        <span className="text-sm font-semibold">Tìm mặt hàng hoặc địa phương</span>
        <input className="field" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ví dụ: cà phê, Ri6, Gia Lai..." aria-label="Tìm mặt hàng hoặc địa phương" />
      </label>
      <label className="block space-y-1">
        <span className="text-sm font-semibold">Nhóm nông sản</span>
        <select className="field" value={group} onChange={(e) => setGroup(e.target.value)} aria-label="Nhóm nông sản">
          {groups.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </label>
      <label className="block space-y-1">
        <span className="text-sm font-semibold">Lọc theo địa phương</span>
        <select className="field" value={tinh} onChange={(e) => setTinh(e.target.value)} aria-label="Địa phương">
          <option value="">Mọi địa phương</option>
          {Array.from(new Set([...PROVINCES, ...rows.map((row) => row.province)])).sort((a, b) => a.localeCompare(b, "vi")).map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </label>
      </div>
      {loading ? <div className="card p-6 text-center text-muted-foreground" role="status">Đang tải bảng giá…</div> : error ? (
        <div className="card space-y-2 p-4" role="alert">
          <p className="font-semibold">Chưa kết nối được dữ liệu giá</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card px-4 py-10 text-center">
          <div className="text-4xl" aria-hidden="true">📊</div>
          <p className="mt-3 font-semibold">Chưa có giá được cập nhật</p>
          <p className="mt-1 text-sm text-muted-foreground">Bảng này không tự bịa giá. Khi quản trị viên nhập giá kèm nguồn và ngày, dữ liệu sẽ hiển thị tại đây.</p>
        </div>
      ) : (
        <div className="card divide-y">
          <div className="border-b bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">Tìm thấy {filtered.length} mức giá · {usingSnapshot ? "Dữ liệu tham khảo" : "Dữ liệu từ hệ thống"}</div>
          {filtered.map((r) => (
            <article key={r.id} className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-bold">{r.crop}</h2>
                  <p className="text-sm text-muted-foreground">📍 {r.province} · đơn vị: {r.unit}</p>
                </div>
                <p className="shrink-0 text-right font-bold text-primary">{formatPrice(Number(r.price), r.currency ?? "VND", r.unit)}</p>
              </div>
              <div className="text-xs text-muted-foreground">Ngày giá: {r.price_date} · Nguồn: {sourceUrl(r.source) ? <a className="break-words underline underline-offset-2" href={sourceUrl(r.source) ?? undefined} target="_blank" rel="noreferrer">{sourceLabel(r.source)}</a> : <span className="break-words">{r.source}</span>}</div>
            </article>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground">Không sử dụng bảng giá này làm cam kết mua bán. Vui lòng kiểm tra nguồn được ghi và gọi xác nhận trước khi vận chuyển hàng.</p>
      <div><Link to="/cho" className="btn-outline">Xem tin mua bán nông sản</Link></div>
    </Page>
  );
}
