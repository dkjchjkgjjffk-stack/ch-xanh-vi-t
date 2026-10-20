import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Search, ShoppingCart, UserRound, Menu, Sprout, Wheat, ChartNoAxesCombined, Package } from "lucide-react";
import { useCart } from "@/lib/cart";

const NAV = [
  { to: "/", label: "Trang chủ" },
  { to: "/cho", label: "Nông sản" },
  { to: "/cua-hang", label: "Cửa hàng" },
  { to: "/bang-gia", label: "Giá nông sản" },
  { to: "/don-hang", label: "Đơn hàng" },
] as const;

export function Header() {
  const { count } = useCart();
  const [q, setQ] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const nav = useNavigate();
  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm">
      <div className="mx-auto flex max-w-[1400px] items-center gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="flex min-w-0 items-center gap-2.5" aria-label="Hải Tây Phát - Trang chủ">
          <svg viewBox="0 0 120 44" role="img" aria-label="HTP" className="h-9 w-[88px] shrink-0 sm:h-11 sm:w-[104px]">
            <defs><linearGradient id="htpGoldHeader" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f6d66f"/><stop offset=".55" stopColor="#c9972d"/><stop offset="1" stopColor="#e9bd4b"/></linearGradient></defs>
            <g fill="url(#htpGoldHeader)"><path d="M2 2H22V16H34V2H54V42H34V25H22V42H2Z"/><path d="M56 2H94L108 14L94 26H78V42H58V18H76V11H56Z"/><path d="M82 2H118V12H102V42H82Z"/></g>
            <path d="M22 41V27L29 19L36 27V41H31V31L29 28L27 31V41Z" fill="#fff"/>
          </svg>
          <span className="min-w-0 leading-tight"><span className="block whitespace-nowrap text-sm font-extrabold tracking-tight text-[#075b38] sm:text-xl">HẢI TÂY PHÁT</span><span className="hidden text-[10px] text-slate-500 sm:block">Đồng hành cùng nhà nông Việt</span></span>
        </Link>
        <form className="mx-auto hidden max-w-2xl flex-1 sm:flex" onSubmit={(e) => { e.preventDefault(); nav({ to: "/cua-hang", search: { q } }); }}>
          <div className="flex w-full overflow-hidden rounded-lg border border-slate-300 bg-white focus-within:border-[#087343]"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm kiếm sản phẩm, nông sản, phân bón, vật tư..." className="min-w-0 flex-1 px-4 py-2.5 text-sm text-slate-800 outline-none" aria-label="Tìm kiếm"/><button aria-label="Tìm kiếm" className="grid w-12 place-items-center bg-[#075b38] text-white transition hover:bg-[#087343]"><Search size={20}/></button></div>
        </form>
        <div className="ml-auto flex items-center gap-3 sm:ml-0">
          <Link to="/tai-khoan" className="hidden items-center gap-2 text-xs font-medium text-slate-700 hover:text-[#075b38] sm:flex"><UserRound size={23} className="text-[#075b38]"/><span>Đăng nhập<br/>Tài khoản</span></Link>
          <Link to="/gio-hang" className="relative flex items-center gap-1.5 text-sm font-semibold text-slate-800"><ShoppingCart size={23} className="text-[#075b38]"/><span className="hidden sm:inline">Giỏ hàng</span>{count > 0 && <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-[#087343] px-1 text-[10px] text-white">{count}</span>}</Link>
          <button className="grid size-10 place-items-center rounded-lg border border-slate-200 text-[#075b38] sm:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label="Mở danh mục"><Menu size={22}/></button>
        </div>
      </div>
      <form className="px-4 pb-3 sm:hidden" onSubmit={(e) => { e.preventDefault(); nav({ to: "/cua-hang", search: { q } }); }}>
        <div className="flex overflow-hidden rounded-lg border border-slate-300"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm sản phẩm, nông sản, vật tư..." className="min-w-0 flex-1 px-3 py-2 text-sm outline-none" aria-label="Tìm kiếm"/><button aria-label="Tìm kiếm" className="grid w-11 place-items-center bg-[#075b38] text-white"><Search size={18}/></button></div>
      </form>
      <nav className="bg-[#075b38] text-white" aria-label="Điều hướng chính">
        <div className="mx-auto hidden max-w-[1400px] items-center gap-1 px-4 sm:flex sm:px-6">
          <Link to="/cua-hang" className="mr-2 flex items-center gap-2 rounded-b-md bg-[#064b2f] px-4 py-3 text-sm font-semibold"><Menu size={18}/> Danh mục sản phẩm</Link>
          {NAV.map((n) => <Link key={n.to} to={n.to} className="rounded-md px-3 py-3 text-sm font-semibold transition hover:bg-white/10" activeProps={{ className: "bg-white/10 text-[#f6d36b]" }} activeOptions={{ exact: n.to === "/" }}>{n.label}</Link>)}
          <Link to="/tai-khoan" className="ml-auto flex items-center gap-2 px-3 py-3 text-sm font-semibold hover:bg-white/10"><UserRound size={17}/> Tài khoản</Link>
        </div>
        {menuOpen && <div className="grid grid-cols-2 gap-1 px-3 py-2 sm:hidden">{NAV.map((n) => <Link key={n.to} to={n.to} onClick={() => setMenuOpen(false)} className="rounded-md px-3 py-2.5 text-sm font-semibold hover:bg-white/10">{n.label}</Link>)}<Link to="/tai-khoan" onClick={() => setMenuOpen(false)} className="rounded-md px-3 py-2.5 text-sm font-semibold">Tài khoản</Link></div>}
      </nav>
    </header>
  );
}

export function BottomNav() {
  const { count } = useCart();
  const items = [
    { to: "/", label: "Trang chủ", icon: Sprout },
    { to: "/cua-hang", label: "Cửa hàng", icon: Package },
    { to: "/cho", label: "Nông sản", icon: Wheat },
    { to: "/bang-gia", label: "Bảng giá", icon: ChartNoAxesCombined },
    { to: "/gio-hang", label: "Giỏ hàng", icon: ShoppingCart },
  ] as const;
  return <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_10px_rgba(0,0,0,0.04)] md:hidden" aria-label="Điều hướng trên điện thoại">
    {items.map(({to,label,icon:Icon}) => <Link key={to} to={to} className="relative flex min-w-0 flex-col items-center gap-1 py-2 text-[10px] font-medium text-slate-500" activeProps={{className:"text-[#087343]"}} activeOptions={{exact:to==="/"} }><Icon size={20} strokeWidth={1.8}/><span className="truncate">{label}</span>{to==="/gio-hang"&&count>0&&<span className="absolute right-4 top-0 grid h-4 min-w-4 place-items-center rounded-full bg-amber-400 px-1 text-[9px] text-slate-900">{count}</span>}</Link>)}
  </nav>;
}

export function SampleNotice({ children }: { children?: ReactNode }) {
  return <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{children ?? "Đây là dữ liệu mẫu để xem thử giao diện, không phải sản phẩm hay thông tin thật."}</div>;
}

export function Page({ title, children }: { title?: string; children: ReactNode }) {
  return <main className="mx-auto max-w-[1400px] space-y-5 px-4 py-5 sm:px-6">{title && <h1 className="text-2xl font-bold">{title}</h1>}{children}</main>;
}
