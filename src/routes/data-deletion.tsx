import { createFileRoute } from "@tanstack/react-router";
import { Page } from "@/components/Layout";

export const Route = createFileRoute("/data-deletion")({
  head: () => ({
    meta: [
      { title: "Xóa dữ liệu người dùng | Hải Tây Phát" },
      {
        name: "description",
        content: "Hướng dẫn yêu cầu truy cập, chỉnh sửa hoặc xóa dữ liệu cá nhân trên website Hải Tây Phát — Chợ Xanh Việt.",
      },
    ],
  }),
  component: DataDeletionPage,
});

function DataDeletionPage() {
  return (
    <Page title="Hướng dẫn xóa dữ liệu người dùng">
      <article className="mx-auto max-w-4xl space-y-6 rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-7 text-slate-700 shadow-sm sm:p-8">
        <p className="text-slate-500">Cập nhật lần cuối: 26/10/2026</p>
        <p>
          Người dùng có thể yêu cầu Hải Tây Phát — Chợ Xanh Việt truy cập, chỉnh
          sửa hoặc xóa dữ liệu cá nhân gắn với tài khoản của mình.
        </p>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900">Cách gửi yêu cầu</h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>Gọi số hỗ trợ <a className="font-semibold text-emerald-800 underline" href="tel:+84962334444">096 233 4444</a> và nói rõ bạn muốn yêu cầu xóa dữ liệu cá nhân.</li>
            <li>Cung cấp thông tin tối thiểu cần thiết để chúng tôi xác định tài khoản, chẳng hạn số điện thoại hoặc email đã đăng ký. Không cung cấp mật khẩu, mã OTP hoặc thông tin đăng nhập.</li>
            <li>Chúng tôi có thể liên hệ lại để xác minh yêu cầu trước khi thực hiện nhằm tránh xóa nhầm dữ liệu của người khác.</li>
          </ol>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900">Dữ liệu được xử lý như thế nào?</h2>
          <p>
            Sau khi xác minh, chúng tôi sẽ xem xét xóa hoặc ẩn dữ liệu cá nhân
            gắn với tài khoản trong phạm vi có thể thực hiện. Một số thông tin
            liên quan đến giao dịch, kế toán, an toàn hệ thống hoặc nghĩa vụ
            pháp lý có thể phải được lưu giữ trong thời hạn cần thiết; trong
            trường hợp đó, chúng tôi sẽ hạn chế việc sử dụng dữ liệu theo quy
            định áp dụng.
          </p>
          <p>
            Chúng tôi sẽ phản hồi về kết quả hoặc yêu cầu bổ sung thông tin nếu
            cần. Thời gian xử lý có thể phụ thuộc vào việc xác minh và loại dữ
            liệu được yêu cầu.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900">Yêu cầu liên quan đến Facebook</h2>
          <p>
            Nếu bạn đã sử dụng một tính năng Facebook nào đó trên website và
            muốn yêu cầu xóa dữ liệu liên quan, hãy nêu rõ điều đó khi liên hệ.
            Trang này cung cấp hướng dẫn gửi yêu cầu; việc tiếp nhận hoặc xóa
            dữ liệu từ một dịch vụ bên thứ ba còn phụ thuộc vào việc tích hợp
            đó có được bật và dữ liệu nào thực sự được lưu.
          </p>
        </section>

        <p>
          Xem thêm{" "}
          <a className="font-semibold text-emerald-800 underline" href="/privacy-policy">
            Chính sách quyền riêng tư
          </a>
          .
        </p>
      </article>
    </Page>
  );
}
