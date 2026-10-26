import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  Search,
  ShoppingCart,
  UserRound,
  Menu,
  Sprout,
  Wheat,
  ChartNoAxesCombined,
  Package,
  Phone,
  MapPin,
  ChevronDown,
} from "lucide-react";
import { useCart } from "@/lib/cart";

const NAV = [
  { to: "/", label: "Trang chủ" },
  { to: "/cho", label: "Nông sản" },
  { to: "/cua-hang", label: "Cửa hàng" },
  { to: "/bang-gia", label: "Giá nông sản" },
  { to: "/don-hang", label: "Đơn hàng" },
] as const;

const CATEGORY_LINKS = [
  { to: "/cua-hang", search: { dm: "phan-bon" }, label: "Phân bón" },
  { to: "/cua-hang", search: { dm: "thuoc-bvtv" }, label: "Thuốc BVTV" },
  { to: "/cua-hang", search: { dm: "vat-tu" }, label: "Vật tư" },
  { to: "/cho", label: "Nông sản" },
  { to: "/bang-gia", label: "Bảng giá" },
] as const;

export function Header() {
  const { count } = useCart();
  const [q, setQ] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const nav = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      {/* Top promo bar — kiểu Điện Máy Xanh */}
      <div className="bg-[#075b38] text-white">
        <div className="mx-auto flex max-w-[1600px] w-full items-center justify-between gap-3 px-4 py-1.5 text-[11px] sm:px-6 sm:text-xs">
          <p className="truncate font-medium">
            🌱 Hải Tây Phát — Đồng hành cùng nhà nông Việt · Giao hàng toàn quốc
          </p>
          <div className="hidden items-center gap-4 sm:flex">
            <a href="tel:+84962334444" className="flex items-center gap-1.5 hover:text-[#f6d36b]">
              <Phone size={13} /> Hotline tư vấn
            </a>
            <span className="text-white/40">|</span>
            <Link to="/tai-khoan" className="hover:text-[#f6d36b]">
              Đăng ký / Đăng nhập
            </Link>
          </div>
        </div>
      </div>

      {/* Main header row */}
      <div className="mx-auto flex w-full max-w-[1600px] items-center gap-2 px-2 py-3 sm:gap-3 sm:px-4 lg:gap-4 lg:px-6">
        <Link
          to="/"
          className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2.5"
          aria-label="Hải Tây Phát - Trang chủ"
        >
          <img
            src="https://raw.githubusercontent.com/dkjchjkgjjffk-stack/ch-xanh-vi-t/main/Glossy%20Gold%20HTP%20Arrow%20Logo.png"
            alt="Logo HTP — Hải Tây Phát"
            className="h-12 w-[112px] shrink-0 object-contain sm:h-14 sm:w-[148px]"
            width={148}
            height={56}
          />
          <span className="min-w-0 leading-tight">
            <span className="block whitespace-nowrap text-xs font-extrabold tracking-tight text-[#075b38] sm:text-xl">
              HẢI TÂY PHÁT
            </span>
            <span className="hidden text-[10px] text-slate-500 sm:block">
              Đồng hành cùng nhà nông Việt
            </span>
          </span>
        </Link>

        {/* Search — nổi bật giữa header */}
        <form
          className="mx-auto hidden max-w-2xl flex-1 sm:flex"
          onSubmit={(e) => {
            e.preventDefault();
            nav({ to: "/cua-hang", search: { q } });
          }}
        >
          <div className="flex w-full overflow-hidden rounded-full border-2 border-[#075b38]/30 bg-[#f4faf6] transition focus-within:border-[#075b38] focus-within:bg-white focus-within:shadow-sm">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm phân bón, thuốc BVTV, nông sản, vật tư..."
              className="min-w-0 flex-1 bg-transparent px-5 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400"
              aria-label="Tìm kiếm"
            />
            <button
              aria-label="Tìm kiếm"
              className="m-1 grid w-11 place-items-center rounded-full bg-[#075b38] text-white transition hover:bg-[#087343]"
            >
              <Search size={18} />
            </button>
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1 sm:ml-0 sm:gap-2">
          <Link
            to="/tai-khoan"
            className="hidden items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-[#f0f7f2] hover:text-[#075b38] sm:flex"
          >
            <UserRound size={22} className="text-[#075b38]" />
            <span className="leading-tight">
              Đăng nhập
              <br />
              <span className="font-semibold">Tài khoản</span>
            </span>
          </Link>
          <Link
            to="/gio-hang"
            className="relative flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-sm font-semibold text-slate-800 transition hover:bg-[#f0f7f2]"
          >
            <ShoppingCart size={22} className="text-[#075b38]" />
            <span className="hidden sm:inline">Giỏ hàng</span>
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-[#e85d04] px-1 text-[10px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>
          <button
            className="grid size-10 place-items-center rounded-xl border border-slate-200 text-[#075b38] transition hover:bg-[#f0f7f2] sm:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Mở danh mục"
          >
            <Menu size={22} />
          </button>
        </div>
      </div>

      {/* Mobile search */}
      <form
        className="px-4 pb-3 sm:hidden"
        onSubmit={(e) => {
          e.preventDefault();
          nav({ to: "/cua-hang", search: { q } });
        }}
      >
        <div className="flex overflow-hidden rounded-full border-2 border-[#075b38]/25 bg-[#f4faf6]">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm sản phẩm, nông sản, vật tư..."
            className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-sm outline-none"
            aria-label="Tìm kiếm"
          />
          <button
            aria-label="Tìm kiếm"
            className="m-1 grid w-10 place-items-center rounded-full bg-[#075b38] text-white"
          >
            <Search size={16} />
          </button>
        </div>
      </form>

      {/* Category nav bar */}
      <nav className="border-t border-[#e8f0eb] bg-[#075b38] text-white" aria-label="Điều hướng chính">
        <div className="mx-auto hidden w-full max-w-[1600px] items-center gap-0 px-2 lg:gap-0.5 lg:px-4 xl:px-6 sm:flex">
          <Link
            to="/cua-hang"
            className="mr-1 flex shrink-0 items-center gap-1.5 rounded-b-md bg-[#064b2f] px-2 py-2.5 text-xs font-semibold transition hover:bg-[#053d26] lg:gap-2 lg:px-3 lg:text-sm"
          >
            <Menu size={17} /> Danh mục sản phẩm
            <ChevronDown size={14} className="opacity-70" />
          </Link>
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="whitespace-nowrap rounded-md px-2 py-2.5 text-xs font-semibold transition hover:bg-white/10 lg:px-2.5 lg:text-sm"
              activeProps={{ className: "bg-white/15 text-[#f6d36b]" }}
              activeOptions={{ exact: n.to === "/" }}
            >
              {n.label}
            </Link>
          ))}
          <div className="ml-auto hidden items-center gap-1 xl:flex">
            {CATEGORY_LINKS.slice(0, 3).map((c) => (
              <Link
                key={c.label}
                to={c.to}
                search={"search" in c ? (c.search as never) : undefined}
                className="rounded-md px-2.5 py-2.5 text-xs font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
              >
                {c.label}
              </Link>
            ))}
          </div>
        </div>

        {menuOpen && (
          <div className="grid grid-cols-2 gap-1 px-3 py-2 sm:hidden">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-semibold hover:bg-white/10"
              >
                {n.label}
              </Link>
            ))}
            <Link
              to="/tai-khoan"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-semibold hover:bg-white/10"
            >
              Tài khoản
            </Link>
          </div>
        )}
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

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(0,0,0,0.06)] md:hidden"
      aria-label="Điều hướng trên điện thoại"
    >
      {items.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          className="relative flex min-w-0 flex-col items-center gap-0.5 py-2 text-[10px] font-medium text-slate-500"
          activeProps={{ className: "text-[#087343] font-semibold" }}
          activeOptions={{ exact: to === "/" }}
        >
          <Icon size={21} strokeWidth={1.75} />
          <span className="truncate">{label}</span>
          {to === "/gio-hang" && count > 0 && (
            <span className="absolute right-3 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-[#e85d04] px-1 text-[9px] font-bold text-white">
              {count}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="mt-10 border-t border-[#e0ebe4] bg-[#f4faf6]">
      <div className="mx-auto grid max-w-[1600px] w-full gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div>
          <div className="mb-3 text-base font-extrabold text-[#075b38]">HẢI TÂY PHÁT</div>
          <p className="text-sm leading-relaxed text-slate-600">
            Sàn nông nghiệp Việt — kết nối nhà nông, vật tư và nông sản minh bạch.
          </p>
        </div>
        <div>
          <div className="mb-3 text-sm font-bold text-slate-800">Mua sắm</div>
          <ul className="space-y-2 text-sm text-slate-600">
            <li>
              <Link to="/cua-hang" className="hover:text-[#075b38]">
                Cửa hàng vật tư
              </Link>
            </li>
            <li>
              <Link to="/cho" className="hover:text-[#075b38]">
                Chợ nông sản
              </Link>
            </li>
            <li>
              <Link to="/bang-gia" className="hover:text-[#075b38]">
                Bảng giá nông sản
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="mb-3 text-sm font-bold text-slate-800">Hỗ trợ</div>
          <ul className="space-y-2 text-sm text-slate-600">
            <li>
              <Link to="/tai-khoan" className="hover:text-[#075b38]">
                Tài khoản
              </Link>
            </li>
            <li>
              <Link to="/don-hang" className="hover:text-[#075b38]">
                Theo dõi đơn hàng
              </Link>
            </li>
            <li>
              <Link to="/gio-hang" className="hover:text-[#075b38]">
                Giỏ hàng
              </Link>
            </li>
            <li>
              <Link to="/privacy-policy" className="hover:text-[#075b38]">
                Chính sách quyền riêng tư
              </Link>
            </li>
            <li>
              <Link to="/data-deletion/" className="hover:text-[#075b38]">
                Xóa dữ liệu người dùng
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="mb-3 text-sm font-bold text-slate-800">Liên hệ</div>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <Phone size={15} className="mt-0.5 shrink-0 text-[#075b38]" />
              <a href="tel:+84962334444" className="font-semibold text-[#075b38] hover:underline">096 233 4444</a>
            </li>
            <li className="flex items-start gap-2">
              <MapPin size={15} className="mt-0.5 shrink-0 text-[#075b38]" />
              <span>Phục vụ nhà nông trên toàn quốc</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[#e0ebe4] py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Hải Tây Phát · Chợ Xanh Việt. Giao diện tham khảo phong cách thương mại điện tử chuyên nghiệp.
      </div>
    </footer>
  );
}

export function SampleNotice({ children }: { children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm leading-relaxed text-amber-900">
      {children ??
        "Đây là dữ liệu mẫu để xem thử giao diện, không phải sản phẩm hay thông tin thật."}
    </div>
  );
}

export function Page({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-[1600px] space-y-5 px-3 py-4 sm:px-5 sm:py-5 lg:px-8">
      {title && <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{title}</h1>}
      {children}
    </main>
  );
}
