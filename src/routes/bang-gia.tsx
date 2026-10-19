import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PROVINCES, vnd } from "@/data/sample";
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
};

export const Route = createFileRoute("/bang-gia")({
  head: () => ({
    meta: [
      { title: "Bảng giá nông sản theo địa phương — Chợ Xanh Việt" },
      { name: "description", content: "Bảng giá nông sản có ngày cập nhật và nguồn tham khảo, theo địa phương." },
      { property: "og:title", content: "Bảng giá nông sản" },
      { property: "og:description", content: "Giá nông sản theo ngày và địa phương, có nguồn tham khảo." },
    ],
  }),
  component: Prices,
});

function Prices() {
  const [tinh, setTinh] = useState("");
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
        .select("id,crop,unit,province,price,price_date,source")
        .order("price_date", { ascending: false })
        .order("province", { ascending: true })
        .order("crop", { ascending: true })
        .limit(300);
      if (!active) return;
      if (queryError) {
        setError("Chưa đọc được bảng giá từ cơ sở dữ liệu. Quản trị viên cần áp dụng migration bảng giá trong thư mục supabase/migrations.");
        setRows([]);
      } else {
        setRows((data ?? []) as CropPrice[]);
      }
      setLoading(false);
    };
    void load();
    return () => { active = false; };
  }, []);

  const filtered = rows.filter((row) => !tinh || row.province === tinh);
  return (
    <Page title="Bảng giá nông sản">
      <div className="card space-y-2 p-4">
        <p className="font-semibold">Giá tham khảo có ngày và nguồn</p>
        <p className="text-sm text-muted-foreground">Giá cà phê và hồ tiêu được tự động đồng bộ mỗi ngày từ các website chuyên ngành, kèm ngày giá và liên kết nguồn. Giá giao dịch thực tế có thể khác theo chất lượng, sản lượng và thời điểm; hãy xác nhận với bên mua/bán trước khi giao dịch.</p>
      </div>
      <label className="block space-y-1">
        <span className="text-sm font-semibold">Lọc theo địa phương</span>
        <select className="field" value={tinh} onChange={(e) => setTinh(e.target.value)} aria-label="Địa phương">
          <option value="">Mọi địa phương</option>
          {Array.from(new Set([...PROVINCES, ...rows.map((row) => row.province)])).sort((a, b) => a.localeCompare(b, "vi")).map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </label>
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
          {filtered.map((r) => (
            <article key={r.id} className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-bold">{r.crop}</h2>
                  <p className="text-sm text-muted-foreground">📍 {r.province} · đơn vị: {r.unit}</p>
                </div>
                <p className="shrink-0 text-right font-bold text-primary">{vnd(Number(r.price))}<span className="block text-xs font-normal text-muted-foreground">/{r.unit}</span></p>
              </div>
              <div className="text-xs text-muted-foreground">Ngày giá: {r.price_date} · Nguồn: {(() => { const match = r.source.match(/https?:\/\/[^\s]+/); const sourceName = r.source.split(" — ")[0]; return match ? <a className="break-words underline underline-offset-2" href={match[0]} target="_blank" rel="noreferrer">{sourceName}</a> : <span className="break-words">{r.source}</span>; })()}</div>
            </article>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground">Không sử dụng bảng giá này làm cam kết mua bán. Vui lòng kiểm tra nguồn được ghi và gọi xác nhận trước khi vận chuyển hàng.</p>
      <div><Link to="/cho" className="btn-outline">Xem tin mua bán nông sản</Link></div>
    </Page>
  );
}
