import { createFileRoute, Link } from "@tanstack/react-router";
import { PRODUCTS, vnd } from "@/data/sample";
import { Page, SampleNotice } from "@/components/Layout";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/gio-hang")({
  head: () => ({
    meta: [
      { title: "Giỏ hàng — Chợ Nông Sản Việt" },
      { name: "description", content: "Kiểm tra các vật tư nông nghiệp đã chọn trước khi liên hệ người bán." },
      { property: "og:title", content: "Giỏ hàng" },
      { property: "og:description", content: "Giỏ hàng mẫu của Chợ Nông Sản Việt." },
    ],
  }),
  component: Cart,
});

function Cart() {
  const { cart, setQty, clear } = useCart();
  const lines = Object.entries(cart)
    .map(([id, q]) => ({ p: PRODUCTS.find((x) => x.id === id), q }))
    .filter((l): l is { p: (typeof PRODUCTS)[number]; q: number } => Boolean(l.p));
  const total = lines.reduce((sum, line) => sum + line.p.price * line.q, 0);

  return (
    <Page title="Giỏ hàng">
      <SampleNotice>Đây là bản xem thử dùng dữ liệu mẫu. Đơn hàng chưa thể gửi tới người bán vì hệ thống chưa có cơ sở dữ liệu đặt hàng. Vì vậy, trang này không yêu cầu bạn nhập tên, số điện thoại hay địa chỉ.</SampleNotice>
      {lines.length === 0 ? (
        <div className="py-10 text-center">
          <div className="text-6xl" aria-hidden="true">🧺</div>
          <p className="my-4 text-muted-foreground">Giỏ hàng đang trống.</p>
          <Link to="/cua-hang" className="btn-primary">Khám phá cửa hàng</Link>
        </div>
      ) : (
        <>
          <div className="card divide-y">
            {lines.map(({ p, q }) => (
              <div key={p.id} className="flex items-center gap-3 p-3">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-secondary text-3xl" aria-hidden="true">{p.icon}</div>
                <div className="min-w-0 flex-1">
                  <Link to="/cua-hang/$id" params={{ id: p.id }} className="font-semibold leading-snug hover:underline">{p.name}</Link>
                  <div className="text-sm text-muted-foreground">{vnd(p.price)} / {p.unit}</div>
                  <div className="text-primary font-bold">{vnd(p.price * q)}</div>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" className="btn-outline min-h-10 w-10 px-0" onClick={() => setQty(p.id, q - 1)} aria-label={`Giảm số lượng ${p.name}`}>−</button>
                  <span className="w-6 text-center font-bold" aria-label="Số lượng">{q}</span>
                  <button type="button" className="btn-outline min-h-10 w-10 px-0" onClick={() => setQty(p.id, q + 1)} aria-label={`Tăng số lượng ${p.name}`}>+</button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xl font-bold"><span>Tạm tính</span><span className="text-primary">{vnd(total)}</span></div>
          <p className="text-sm text-muted-foreground">Giá và sản phẩm ở trên chỉ là dữ liệu minh họa, chưa phải báo giá hay đơn hàng thực tế.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link to="/cua-hang" className="btn-primary">Tiếp tục chọn hàng</Link>
            <button type="button" onClick={clear} className="btn-outline">Xóa toàn bộ giỏ hàng</button>
          </div>
          <div className="card space-y-2 p-4">
            <h2 className="text-lg font-bold">Đặt hàng sẽ hoạt động khi nào?</h2>
            <p className="text-muted-foreground">Sau khi kết nối cơ sở dữ liệu và thiết lập quy trình nhận đơn, trang này mới có thể lưu đơn và chuyển thông tin tới người bán. Hiện tại, bạn có thể mở từng sản phẩm để xem thông tin liên hệ mẫu; không nên dùng dữ liệu mẫu để giao dịch thật.</p>
          </div>
        </>
      )}
    </Page>
  );
}
