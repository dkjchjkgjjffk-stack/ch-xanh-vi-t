import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PRICES, PROVINCES, vnd } from "@/data/sample";
import { Page, SampleNotice } from "@/components/Layout";

export const Route = createFileRoute("/bang-gia")({
  head: () => ({
    meta: [
      { title: "Bảng giá nông sản theo địa phương — Chợ Xanh Việt" },
      { name: "description", content: "Bảng giá nông sản theo ngày và địa phương, cập nhật bởi quản trị viên kèm nguồn." },
      { property: "og:title", content: "Bảng giá nông sản" },
      { property: "og:description", content: "Giá nông sản theo ngày và địa phương." },
    ],
  }),
  component: Prices,
});

function Prices() {
  const [tinh, setTinh] = useState("");
  const rows = PRICES.filter((r) => !tinh || r.province === tinh);
  return (
    <Page title="Bảng giá nông sản">
      <SampleNotice>Chưa có giá: bảng giá chỉ hiển thị khi quản trị viên cập nhật kèm nguồn xác minh. Chúng tôi không tự đưa ra giá thị trường.</SampleNotice>
      <select className="field" value={tinh} onChange={(e) => setTinh(e.target.value)} aria-label="Địa phương">
        <option value="">Mọi địa phương</option>{PROVINCES.map((p) => <option key={p}>{p}</option>)}
      </select>
      <div className="card divide-y">
        {rows.map((r) => (
          <div key={r.crop + r.province} className="flex items-center justify-between gap-3 p-3">
            <div>
              <div className="font-semibold">{r.crop}</div>
              <div className="text-sm text-muted-foreground">📍 {r.province} · đơn vị: {r.unit}</div>
            </div>
            <div className="text-right">
              <div className="font-bold text-primary">{r.price != null ? vnd(r.price) : "Chưa cập nhật"}</div>
              <div className="text-xs text-muted-foreground">{r.updatedAt ? `Cập nhật ${r.updatedAt}` : "—"}{r.source ? ` · Nguồn: ${r.source}` : ""}</div>
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="p-6 text-center text-muted-foreground">Chưa có dữ liệu cho địa phương này.</p>}
      </div>
    </Page>
  );
}
