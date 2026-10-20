import { Link } from "@tanstack/react-router";
import { BadgeCheck, FileText, MapPin, Package } from "lucide-react";
import { type Listing, type Product, type VerifyStatus, vnd } from "@/data/sample";

export function VerifyBadge({ v }: { v: VerifyStatus }) {
  if (v === "verified") return <span className="chip gap-1 bg-success text-success-foreground"><BadgeCheck size={14}/> Đã xác minh</span>;
  if (v === "seller") return <span className="chip gap-1 bg-warning text-warning-foreground"><FileText size={14}/> Người bán tự khai</span>;
  return <span className="chip bg-muted text-muted-foreground">Chưa có thông tin</span>;
}

export function ProductCard({ p }: { p: Product }) {
  return (
    <Link to="/cua-hang/$id" params={{ id: p.id }} className="card flex flex-col overflow-hidden">
      <div className="flex aspect-square items-center justify-center overflow-hidden bg-secondary">{p.imageUrl ? <img src={p.imageUrl} alt={p.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 hover:scale-105" /> : <div className="flex flex-col items-center gap-2 text-muted-foreground"><Package size={34} strokeWidth={1.5}/><span className="text-xs">Chưa có hình ảnh</span></div>}</div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <div className="line-clamp-2 font-semibold leading-snug">{p.name}</div>
        <div className="mt-auto text-lg font-bold text-primary">{p.priceOnRequest ? "Liên hệ báo giá" : vnd(p.price)}</div>
        <div className="text-sm text-muted-foreground">/ {p.unit}</div>
      </div>
    </Link>
  );
}

export function ListingCard({ l }: { l: Listing }) {
  return (
    <Link to="/cho/$id" params={{ id: l.id }} className="card flex gap-3 p-3">
      <div className="flex size-20 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground"><Package size={30} strokeWidth={1.5}/></div>
      <div className="min-w-0 flex-1">
        <span className={`chip ${l.type === "ban" ? "bg-success text-success-foreground" : "bg-warning text-warning-foreground"}`}>{l.type === "ban" ? "Cần bán" : "Cần mua"}</span>
        <div className="mt-1 font-semibold leading-snug">{l.title}</div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin size={14} className="shrink-0"/> {l.province} · {l.quantity} · {l.price}</div>
      </div>
    </Link>
  );
}
