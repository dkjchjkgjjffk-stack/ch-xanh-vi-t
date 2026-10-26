import { createFileRoute } from "@tanstack/react-router";
import { Page } from "@/components/Layout";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: "Chính sách quyền riêng tư | Hải Tây Phát" },
      {
        name: "description",
        content: "Chính sách quyền riêng tư của website Hải Tây Phát — Chợ Xanh Việt.",
      },
    ],
  }),
  component: PrivacyPolicyPage,
});

function PrivacyPolicyPage() {
  return (
    <Page title="Chính sách quyền riêng tư">
      <article className="mx-auto max-w-4xl space-y-6 rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-7 text-slate-700 shadow-sm sm:p-8">
        <p className="text-slate-500">Cập nhật lần cuối: 26/10/2026</p>
        <p>
          Hải Tây Phát — Chợ Xanh Việt (“chúng tôi”) tôn trọng quyền riêng tư của
          người truy cập website và cố gắng chỉ thu thập thông tin cần thiết để
          vận hành dịch vụ nông sản, vật tư nông nghiệp, tài khoản và đơn hàng.
        </p>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900">1. Thông tin có thể được thu thập</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Thông tin bạn chủ động cung cấp khi tạo tài khoản, liên hệ, đăng sản phẩm hoặc đặt hàng, chẳng hạn tên, số điện thoại, email, địa chỉ giao nhận và nội dung trao đổi.</li>
            <li>Thông tin về sản phẩm, người bán, giỏ hàng và đơn hàng cần thiết để cung cấp chức năng website.</li>
            <li>Dữ liệu kỹ thuật phát sinh khi truy cập như địa chỉ IP, thời điểm truy cập, loại thiết bị, trình duyệt và nhật ký bảo mật do hệ thống lưu trữ hoặc nhà cung cấp hạ tầng xử lý.</li>
          </ul>
          <p>Không gửi thông tin nhạy cảm hoặc thông tin thanh toán đầy đủ qua phần liên hệ của website.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900">2. Mục đích sử dụng</h2>
          <p>
            Thông tin được sử dụng để tạo và quản lý tài khoản; xử lý yêu cầu,
            sản phẩm và đơn hàng; liên hệ hỗ trợ; bảo vệ an toàn hệ thống; phát
            hiện lỗi, lạm dụng hoặc gian lận; và cải thiện trải nghiệm website.
            Chúng tôi không bán dữ liệu cá nhân của người dùng.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900">3. Nhà cung cấp dịch vụ</h2>
          <p>
            Website được lưu trữ trên Cloudflare và có thể sử dụng Supabase để
            cung cấp cơ sở dữ liệu hoặc chức năng tài khoản. Các nhà cung cấp
            này xử lý dữ liệu cần thiết để cung cấp dịch vụ theo cấu hình hệ
            thống và điều khoản riêng của họ. Chúng tôi không khẳng định rằng
            mọi tính năng phân tích hoặc tích hợp bên thứ ba đều đang được bật.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900">4. Chia sẻ và bảo vệ thông tin</h2>
          <p>
            Chúng tôi chỉ chia sẻ thông tin khi cần để cung cấp dịch vụ, theo
            yêu cầu hợp pháp của cơ quan có thẩm quyền hoặc khi cần bảo vệ quyền
            và an toàn của người dùng, website. Chúng tôi áp dụng các biện pháp
            kỹ thuật và tổ chức phù hợp, nhưng không thể bảo đảm an toàn tuyệt
            đối cho dữ liệu truyền qua Internet.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900">5. Lưu trữ và quyền của bạn</h2>
          <p>
            Thông tin được lưu trong khoảng thời gian cần thiết để cung cấp
            dịch vụ, giải quyết tranh chấp và đáp ứng nghĩa vụ pháp luật áp
            dụng. Bạn có thể yêu cầu xem, sửa hoặc xóa thông tin cá nhân theo
            hướng dẫn tại trang{" "}
            <a className="font-semibold text-emerald-800 underline" href="/data-deletion">
              Xóa dữ liệu người dùng
            </a>
            .
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900">6. Trẻ em</h2>
          <p>
            Website hướng tới hoạt động thương mại nông nghiệp, không được thiết
            kế để chủ động thu thập dữ liệu cá nhân của trẻ em. Nếu bạn cho rằng
            trẻ em đã cung cấp dữ liệu cho chúng tôi, hãy liên hệ để yêu cầu
            kiểm tra và xử lý.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900">7. Liên hệ</h2>
          <p>
            Để hỏi về quyền riêng tư hoặc yêu cầu xử lý dữ liệu, vui lòng gọi
            Hải Tây Phát theo số{" "}
            <a className="font-semibold text-emerald-800 underline" href="tel:+84962334444">
              096 233 4444
            </a>
            . Vui lòng không gửi mật khẩu hoặc mã xác thực.
          </p>
        </section>
      </article>
    </Page>
  );
}
