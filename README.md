# Chợ Xanh Việt

Hãy xây dựng một nền tảng thương mại điện tử chuyên ngành
nông nghiệp Việt Nam, thương hiệu Chợ Xanh Việt.

YÊU CẦU CHUNG:
- Giao diện hoàn toàn bằng tiếng Việt.
- Thiết kế ưu tiên điện thoại iPhone và Android.
- Giao diện đơn giản, dễ sử dụng với bà con nông dân.
- Màu sắc chủ đạo xanh lá cây và trắng.
- Có thanh tìm kiếm, menu dễ hiểu, chữ rõ ràng.
- Hiển thị tốt trên điện thoại, máy tính bảng và máy tính.
- Có dữ liệu mẫu để tôi xem thử các chức năng.

PHẦN 1: CỬA HÀNG VẬT TƯ NÔNG NGHIỆP
- Danh mục phân bón, thuốc bảo vệ thực vật,
  dụng cụ và vật tư nông nghiệp.
- Trang chi tiết sản phẩm, hình ảnh, giá và mô tả.
- Giỏ hàng và chức năng đặt hàng.
- Thông tin liên hệ người bán.
- Không tự tạo thông tin chứng nhận hoặc nguồn gốc giả.

PHẦN 2: CHỢ NÔNG SẢN
- Nông dân có thể đăng tin bán nông sản.
- Người thu mua có thể đăng nhu cầu thu mua.
- Mỗi tin có hình ảnh, tên hàng, số lượng,
  giá dự kiến, địa phương và thông tin liên hệ.
- Tìm kiếm theo loại nông sản và tỉnh thành.
- Có chức năng lọc và xem chi tiết tin đăng.

PHẦN 3: SÀN GIAO DỊCH NÔNG NGHIỆP
- Cho phép nhiều người bán và người mua tham gia.
- Có tài khoản người dùng và trang quản lý cá nhân.
- Người bán quản lý sản phẩm và tin đăng.
- Người mua lưu tin yêu thích và liên hệ người bán.
- Có khu vực quản trị để duyệt tin và quản lý nội dung.
- Phân quyền quản trị viên, người bán và người mua.

PHẦN 4: BẢNG GIÁ NÔNG SẢN
- Hiển thị bảng giá theo ngày và địa phương.
- Có tên nông sản, đơn vị tính, giá và ngày cập nhật.
- Có chức năng quản trị viên cập nhật giá.
- Không tự bịa giá thị trường hoặc tuyên bố dữ liệu
  là giá thực tế khi chưa có nguồn xác minh.

PHẦN 5: TRA CỨU THÔNG TIN SẢN PHẨM
- Có trang tra cứu tên sản phẩm, nhà sản xuất,
  thông tin đăng ký và tài liệu nguồn gốc.
- Phân biệt rõ dữ liệu đã xác minh và dữ liệu do
  người bán tự cung cấp.
- Không khẳng định sản phẩm thật hoặc giả nếu chưa
  có bằng chứng đáng tin cậy.

PHẦN 6: KỸ THUẬT
- Xây dựng giao diện có thể thao tác thực tế.
- Thiết lập cơ sở dữ liệu để lưu sản phẩm, tài khoản,
  tin đăng, giá nông sản và đơn hàng.
- Có đăng ký, đăng nhập và phân quyền an toàn.
- Các nút và biểu mẫu phải hoạt động đúng chức năng.
- Không dùng dữ liệu mẫu thay cho dữ liệu thật mà
  không thông báo rõ.
- Chuẩn bị cấu trúc để bổ sung thanh toán trực tuyến
  và tích hợp Facebook trong giai đoạn sau.

Hãy bắt đầu bằng phiên bản đầu tiên có giao diện
hoàn chỉnh, dữ liệu mẫu và các chức năng cốt lõi.
Ưu tiên làm tốt trên điện thoại trước.

Trước tiên, hãy xây dựng trang chủ, cửa hàng,
chợ nông sản, bảng giá và trang chi tiết tin đăng.
Sau đó kiểm tra lỗi và hướng dẫn tôi từng bước
để thiết lập cơ sở dữ liệu, đăng nhập và xuất bản.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/88e3fde9-a3d2-4a48-99e9-a581a91d0bfd).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

Sao chép `.env.example` thành `.env` rồi điền URL dự án Supabase và publishable key. Không đưa khóa bí mật phía máy chủ vào biến `VITE_*` hoặc commit chúng vào Git.

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```


---

## Trạng thái hiện tại

Đây là bản giao diện thử nghiệm. Các sản phẩm và tin đăng trong `src/data/sample.ts` là dữ liệu minh họa, không phải hàng hóa hoặc giá thị trường thật.

- **Đã có giao diện:** trang chủ, cửa hàng vật tư, chi tiết sản phẩm, giỏ hàng trên trình duyệt, chợ mua/bán, chi tiết tin đăng và bảng giá.
- **Đã có thao tác phía trình duyệt:** tìm kiếm/lọc tin chợ và lưu giỏ hàng cục bộ trên thiết bị.
- **Tài khoản:** có giao diện đăng ký/đăng nhập qua Supabase Auth, liên kết tới trang đăng tin và quản lý tin cá nhân.
- **Chợ nông sản:** có biểu mẫu gửi tin vào Supabase, danh sách và chi tiết đọc tin đã duyệt, trang xem trạng thái tin cá nhân và trang kiểm duyệt dành cho vai trò admin. Các migration `20261018000000_auth_profiles.sql`, `20261018001000_listing_submission_policies.sql` và `20261018002000_admin_listing_moderation.sql` cần được áp dụng vào đúng dự án Supabase trước khi các chức năng này hoạt động thật.
- **Bảng giá nông sản:** trang công khai đọc dữ liệu có ngày, địa phương và nguồn từ bảng `prices`; trang `/quan-tri-gia` cho admin thêm/cập nhật/xóa giá. Migration `20261018003000_verified_crop_prices.sql` cần được áp dụng. Giá do quản trị viên nhập không đồng nghĩa nguồn đã được xác minh độc lập; cần kiểm tra nguồn trước khi đăng.
- **Chưa vận hành thật:** quản lý sản phẩm của người bán, quy trình đặt hàng và theo dõi đơn hàng, thanh toán, hồ sơ người dùng đầy đủ, và kiểm chứng độc lập nguồn giá/sản phẩm.
- **Không được xem nhãn “đã xác minh” là có thật** nếu chưa tích hợp nguồn kiểm chứng độc lập và quy trình duyệt.
- **Kiểm tra tự động:** GitHub Actions chạy lint, test và build khi có commit lên `main` hoặc mở pull request.

### Điều kiện để đưa vào sử dụng thật

Cần kết nối một dự án Supabase do chủ dự án kiểm soát, thiết lập biến môi trường chỉ chứa khóa công khai ở phía trình duyệt, áp dụng các migration trong thư mục `supabase/migrations` theo thứ tự bằng Supabase CLI hoặc SQL Editor, xác nhận các bảng hiện hữu khớp với kiểu dữ liệu trong mã nguồn, hoàn thiện chính sách Row Level Security (RLS) cho các nghiệp vụ còn lại, rồi triển khai ứng dụng trên một nền tảng hỗ trợ TanStack Start/SSR. Vai trò admin phải được cấp thủ công bởi chủ dự án ở backend; không tự cấp quyền admin cho người đăng ký. Không đưa `service_role`, mật khẩu cơ sở dữ liệu hoặc bí mật máy chủ vào mã nguồn hay biến `VITE_*`.

Không nhận đơn hàng, thanh toán hoặc thu thập dữ liệu liên hệ thật cho đến khi backend, phân quyền và quy trình bảo vệ dữ liệu được kiểm thử.
