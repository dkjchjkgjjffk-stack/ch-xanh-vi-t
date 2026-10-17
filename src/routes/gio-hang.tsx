import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PRODUCTS, vnd } from "@/data/sample";
import { Page, SampleNotice } from "@/components/Layout";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/gio-hang")({
  head: () => ({
    meta: [
      { title: "Giỏ hàng và đặt hàng — Chợ Nông Sản Việt" },
      { name: "description", content: "Xem giỏ hàng và gửi đơn đặt vật tư nông nghiệp." },
      { property: "og:title", content: "Giỏ hàng" },
      { property: "og:description", content: "Giỏ hàng và đặt hàng." },
    ],
  }),
  component: Cart,
});

function Cart() {
  const { cart, setQty, clear } = useCart();
  const [done, setDone] = useState(false);
  const lines = Object.entries(cart).map(([id, q]) => ({ p: PRODUCTS.find((x) => x.id === id)!, q })).filter((l) => l.p);
  const total = lines.reduce((a, l) => a + l.p.price * l.q, 0);

  if (done) return (
    <Page title="Đã ghi nhận đơn (thử nghiệm)">
      <SampleNotice>Đây là đơn THỬ NGHIỆM, chưa gửi tới người bán. Đơn thật sẽ hoạt động sau khi thiết lập cơ sở dữ liệu.</SampleNotice>
      <Link to="/cua-hang" className="btn-primary w-full">Tiếp tục mua sắm</Link>
    </Page>
  );

  return (
    <Page title="Giỏ hàng">
      {lines.length === 0 ? (
        <div className="py-10 text-center"><div className="text-6xl">🧺</div><p className="my-4 text-muted-foreground">Giỏ hàng trống.</p><Link to="/cua-hang" className="btn-primary">Vào cửa hàng</Link></div>
      ) : (
        <>
          <div className="card divide-y">
            {lines.map(({ p, q }) => (
              <div key={p.id} className="flex items-center gap-3 p-3">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-secondary text-3xl">{p.icon}</div>
                <div className="min-w-0 flex-1"><div className="font-semibold leading-snug">{p.name}</div><div className="text-primary font-bold">{vnd(p.price * q)}</div></div>
                <div className="flex items-center gap-1">
                  <button className="btn-outline min-h-10 w-10 px-0" onClick={() => setQty(p.id, q - 1)} aria-label="Giảm">−</button>
                  <span className="w-6 text-center font-bold">{q}</span>
                  <button className="btn-outline min-h-10 w-10 px-0" onClick={() => setQty(p.id, q + 1)} aria-label="Tăng">+</button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xl font-bold"><span>Tổng cộng</span><span className="text-primary">{vnd(total)}</span></div>
          <form className="card space-y-3 p-4" onSubmit={(e) => { e.preventDefault(); clear(); setDone(true); }}>
            <h2 className="text-lg font-bold">Thông tin nhận hàng</h2>
            <input required className="field" placeholder="Họ và tên" />
            <input required type="tel" pattern="[0-9 ]{9,12}" className="field" placeholder="Số điện thoại" />
            <textarea required className="field min-h-24 py-3" placeholder="Địa chỉ nhận hàng" />
            <p className="text-sm text-muted-foreground">Thanh toán khi nhận hàng (COD). Thanh toán trực tuyến sẽ bổ sung sau.</p>
            <button className="btn-primary w-full">Đặt hàng</button>
          </form>
        </>
      )}
    </Page>
  );
}
