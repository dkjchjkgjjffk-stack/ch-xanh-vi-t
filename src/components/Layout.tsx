import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { useCart } from "@/lib/cart";

const NAV = [
  { to: "/", label: "Trang chủ", icon: "🏠" },
  { to: "/cua-hang", label: "Cửa hàng", icon: "🛒" },
  { to: "/cho", label: "Chợ nông sản", icon: "🌾" },
  { to: "/bang-gia", label: "Bảng giá", icon: "📊" },
  { to: "/gio-hang", label: "Giỏ hàng", icon: "🧺" },
] as const;

export function Header() {
  const { count } = useCart();
  const [q, setQ] = useState("");
  const nav = useNavigate();
  return (
    <header className="sticky top-0 z-30 bg-primary text-primary-foreground shadow-card">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link to="/" className="text-lg font-extrabold leading-tight">🌿 Chợ Nông Sản Việt</Link>
        <nav className="ml-auto hidden gap-1 md:flex">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className="rounded-lg px-3 py-2 font-medium hover:bg-primary-foreground/15" activeProps={{ className: "bg-primary-foreground/20" }} activeOptions={{ exact: n.to === "/" }}>
              {n.label}{n.to === "/gio-hang" && count > 0 ? ` (${count})` : ""}
            </Link>
          ))}
        </nav>
      </div>
      <form className="mx-auto max-w-6xl px-4 pb-3" onSubmit={(e) => { e.preventDefault(); nav({ to: "/cua-hang", search: { q } }); }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 Tìm phân bón, thuốc, dụng cụ..." className="field border-transparent text-foreground" aria-label="Tìm kiếm" />
      </form>
    </header>
  );
}

export function BottomNav() {
  const { count } = useCart();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-card pb-[env(safe-area-inset-bottom)] md:hidden">
      {NAV.map((n) => (
        <Link key={n.to} to={n.to} className="relative flex flex-col items-center py-2 text-xs font-medium text-muted-foreground" activeProps={{ className: "text-primary" }} activeOptions={{ exact: n.to === "/" }}>
          <span className="text-2xl">{n.icon}</span>
          {n.label}
          {n.to === "/gio-hang" && count > 0 && <span className="absolute right-3 top-1 chip bg-destructive px-1.5 py-0 text-xs text-destructive-foreground">{count}</span>}
        </Link>
      ))}
    </nav>
  );
}

export function SampleNotice({ children }: { children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-warning-foreground/30 bg-warning p-3 text-sm text-warning-foreground">
      ⚠️ {children ?? "Đây là DỮ LIỆU MẪU để xem thử giao diện, không phải sản phẩm hay thông tin thật."}
    </div>
  );
}

export function Page({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <main className="mx-auto max-w-6xl space-y-4 px-4 py-4">
      {title && <h1 className="text-2xl font-bold">{title}</h1>}
      {children}
    </main>
  );
}
