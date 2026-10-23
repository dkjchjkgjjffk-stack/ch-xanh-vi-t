import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { BadgeCheck, FileText, MapPin, Package } from "lucide-react";
import { type Listing, type Product, type VerifyStatus, vnd } from "@/data/sample";

export function VerifyBadge({ v }: { v: VerifyStatus }) {
  if (v === "verified")
    return (
      <span className="chip gap-1 bg-success text-success-foreground">
        <BadgeCheck size={14} /> Đã xác minh
      </span>
    );
  if (v === "seller")
    return (
      <span className="chip gap-1 bg-warning text-warning-foreground">
        <FileText size={14} /> Người bán tự khai
      </span>
    );
  return <span className="chip bg-muted text-muted-foreground">Chưa có thông tin</span>;
}

export function ProductCard({ p }: { p: Product }) {
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <Link
      to="/cua-hang/$id"
      params={{ id: p.id }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_8px_rgba(15,45,30,0.06)] transition duration-200 hover:-translate-y-0.5 hover:border-[#075b38]/25 hover:shadow-[0_8px_24px_rgba(7,91,56,0.12)]"
    >
      <div className="relative aspect-square overflow-hidden bg-[#f4faf6]">
        {p.imageUrl && !imageFailed ? (
          <img
            src={p.imageUrl}
            alt={p.name}
            loading="lazy"
            decoding="async"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-400">
            <Package size={36} strokeWidth={1.4} />
            <span className="px-3 text-center text-xs">Ảnh sản phẩm chưa có hoặc không tải được</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:p-3.5">
        <div className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-slate-800 sm:text-[15px]">
          {p.name}
        </div>
        <div className="mt-auto">
          <div className="text-base font-extrabold text-[#e85d04] sm:text-lg">
            {p.priceOnRequest ? "Liên hệ báo giá" : vnd(p.price)}
          </div>
          <div className="text-xs text-slate-500">/ {p.unit}</div>
        </div>
      </div>
    </Link>
  );
}

export function ListingCard({ l }: { l: Listing }) {
  return (
    <Link
      to="/cho/$id"
      params={{ id: l.id }}
      className="group flex gap-3 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_2px_8px_rgba(15,45,30,0.05)] transition duration-200 hover:-translate-y-0.5 hover:border-[#075b38]/25 hover:shadow-[0_8px_20px_rgba(7,91,56,0.1)]"
    >
      <div className="flex size-20 shrink-0 items-center justify-center rounded-xl bg-[#f4faf6] text-slate-400">
        <Package size={28} strokeWidth={1.4} />
      </div>
      <div className="min-w-0 flex-1">
        <span
          className={`chip ${l.type === "ban" ? "bg-success text-success-foreground" : "bg-warning text-warning-foreground"}`}
        >
          {l.type === "ban" ? "Cần bán" : "Cần mua"}
        </span>
        <div className="mt-1.5 line-clamp-2 font-semibold leading-snug text-slate-800">{l.title}</div>
        <div className="mt-1 flex items-center gap-1 text-sm text-slate-500">
          <MapPin size={14} className="shrink-0" /> {l.province} · {l.quantity} · {l.price}
        </div>
      </div>
    </Link>
  );
}
