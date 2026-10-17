import { Link } from "@tanstack/react-router";
import { type Listing, type Product, type VerifyStatus, vnd } from "@/data/sample";

export function VerifyBadge({ v }: { v: VerifyStatus }) {
  if (v === "verified") return <span className="chip bg-success text-success-foreground">✅ Đã xác minh</span>;
  if (v === "seller") return <span className="chip bg-warning text-warning-foreground">📝 Người bán tự khai</span>;
  return <span className="chip bg-muted text-muted-foreground">Chưa có thông tin</span>;
}

export function ProductCard({ p }: { p: Product }) {
  return (
    <Link to="/cua-hang/$id" params={{ id: p.id }} className="card flex flex-col overflow-hidden">
      <div className="flex aspect-square items-center justify-center bg-secondary text-6xl">{p.icon}</div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <div className="line-clamp-2 font-semibold leading-snug">{p.name}</div>
        <div className="mt-auto text-lg font-bold text-primary">{vnd(p.price)}</div>
        <div className="text-sm text-muted-foreground">/ {p.unit}</div>
      </div>
    </Link>
  );
}

export function ListingCard({ l }: { l: Listing }) {
  return (
    <Link to="/cho/$id" params={{ id: l.id }} className="card flex gap-3 p-3">
      <div className="flex size-20 shrink-0 items-center justify-center rounded-xl bg-secondary text-4xl">{l.icon}</div>
      <div className="min-w-0 flex-1">
        <span className={`chip ${l.type === "ban" ? "bg-success text-success-foreground" : "bg-warning text-warning-foreground"}`}>{l.type === "ban" ? "Cần bán" : "Cần mua"}</span>
        <div className="mt-1 font-semibold leading-snug">{l.title}</div>
        <div className="text-sm text-muted-foreground">📍 {l.province} · {l.quantity} · {l.price}</div>
      </div>
    </Link>
  );
}
