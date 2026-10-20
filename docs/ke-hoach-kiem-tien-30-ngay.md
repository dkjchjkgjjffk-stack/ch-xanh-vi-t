# Kế hoạch 30 ngày: biến Chợ Xanh Việt thành kênh tạo khách hàng (ngân sách 0 đồng)

> Mục tiêu là kiểm chứng nhu cầu và tìm cơ hội giao dịch thật, không cam kết doanh thu. Không đăng giá, nguồn hàng, chứng nhận hay khách hàng giả.

## Mô hình khởi đầu

- Website: nơi tập trung thông tin, tin mua/bán và biểu mẫu liên hệ.
- Facebook: kênh miễn phí để tiếp cận người mua/người bán.
- Giai đoạn đầu: làm môi giới/kết nối theo thỏa thuận hoặc bán hàng sẵn có; chưa xây thanh toán trực tuyến, chưa thu phí tự động.
- Chỉ nhận phí/hoa hồng khi các bên hiểu và đồng ý rõ ràng bằng văn bản/tin nhắn.

## Lịch triển khai

### Ngày 1–3 — Kiểm tra và chuẩn hóa website
- Kiểm tra trên iPhone: trang chủ, chợ nông sản, cửa hàng, bảng giá, chi tiết tin, đăng nhập và gửi tin.
- Xác nhận Supabase URL/key công khai đã cấu hình đúng; không đưa khóa bí mật vào frontend.
- Kiểm tra migration/RLS trên đúng dự án Supabase trước khi nhận dữ liệu người dùng.
- Không đưa dữ liệu minh họa lên như giá hoặc hàng thật. Gắn nhãn “dữ liệu minh họa” ở mọi chỗ còn dùng mẫu.
- Bản tối thiểu phải có: nút gọi/nhắn tin hoặc biểu mẫu gửi nhu cầu; cách báo lỗi rõ ràng; thông tin đơn vị vận hành.

### Ngày 4–7 — Đưa nội dung thật lên
- Chọn tối đa 2 mặt hàng ban đầu, ví dụ cà phê và hồ tiêu, chỉ khi có nguồn hàng/người mua thật để xác minh.
- Thu thập: loại hàng, quy cách/chất lượng, số lượng, địa phương, thời gian giao, giá mong muốn hoặc “thương lượng”, cách liên hệ, ngày xác minh.
- Đăng 1 bài giới thiệu website và 1 bài hỏi nhu cầu mỗi ngày; không spam nhóm, tuân thủ quy định từng nhóm.
- Lập bảng theo dõi khách hàng bằng Google Sheets hoặc bảng tính miễn phí.

### Ngày 8–14 — Kiểm chứng nhu cầu
- Mục tiêu hoạt động: chủ động tiếp cận 5–10 liên hệ phù hợp/ngày (không phải mục tiêu doanh thu).
- Hỏi rõ nhu cầu mua/bán, số lượng, khu vực, tiêu chuẩn và thời gian.
- Chỉ ghép cặp khi thông tin hai bên phù hợp; không tự đứng ra bảo đảm chất lượng hoặc thanh toán nếu chưa có quy trình.
- Ghi lại số người phản hồi, yêu cầu báo giá, cuộc gọi, giao dịch thử và lý do thất bại.

### Ngày 15–21 — Thử giao dịch đầu tiên
- Xác minh danh tính/liên hệ ở mức hợp lý, thông tin hàng và điều kiện giao nhận.
- Gửi hai bên bản tóm tắt: mặt hàng, số lượng, chất lượng, giá/đơn vị, địa điểm, lịch giao, phương thức thanh toán và trách nhiệm.
- Nếu làm môi giới, thống nhất bằng tin nhắn/văn bản: ai trả phí, mức phí/cách tính, thời điểm trả, trường hợp hủy.
- Không thu hộ tiền trong giai đoạn đầu; không tuyên bố đã kiểm định hàng khi chưa có chứng cứ.

### Ngày 22–30 — Chọn hướng có tín hiệu tốt
- Tính: số liên hệ hợp lệ, nhu cầu báo giá, cuộc trao đổi hai bên, giao dịch hoàn tất, doanh thu thực nhận, chi phí và thời gian bỏ ra.
- Nếu chưa có giao dịch: phỏng vấn 5 người đã phản hồi để tìm điểm nghẽn; chưa mua quảng cáo hoặc xây tính năng phức tạp.
- Chỉ sau khi có nhu cầu lặp lại mới ưu tiên thêm quản lý đơn hàng, người bán, xác minh hồ sơ và thông báo.

## Bảng theo dõi khách hàng tối thiểu

Tạo một dòng cho mỗi khách/nhu cầu, gồm:
- Ngày tiếp nhận
- Mã liên hệ (không công khai số điện thoại)
- Vai trò: người mua / người bán
- Mặt hàng
- Số lượng và đơn vị
- Quy cách/chất lượng
- Địa phương
- Giá kỳ vọng hoặc thương lượng
- Thời gian giao/nhận
- Trạng thái: mới / đã liên hệ / đã xác minh / đang ghép cặp / giao dịch hoàn tất / không phù hợp
- Bước tiếp theo và ngày nhắc lại
- Doanh thu/chi phí thực tế

Không lưu dữ liệu cá nhân nhạy cảm không cần thiết; chỉ chia sẻ số liên hệ khi có sự đồng ý.

## Mẫu bài Facebook — giới thiệu dịch vụ

**CHỢ XANH VIỆT — KẾT NỐI NGƯỜI TRỒNG VỚI NGƯỜI THU MUA**

Bạn đang có nông sản cần bán hoặc đang tìm nguồn hàng?

Chợ Xanh Việt hướng tới kết nối nhu cầu mua/bán nông sản và thông tin vật tư nông nghiệp tại Việt Nam.

Để chúng tôi tổng hợp nhu cầu, vui lòng gửi:
- Mặt hàng và địa phương
- Số lượng dự kiến
- Quy cách/chất lượng
- Giá mong muốn hoặc ghi “thương lượng”
- Thời gian có hàng/cần hàng
- Cách liên hệ thuận tiện

Thông tin sẽ được kiểm tra trước khi đăng. Việc gửi nhu cầu không đồng nghĩa đã có người mua hoặc bảo đảm giao dịch thành công.

**Gửi thông tin qua:** [điền đường dẫn website/biểu mẫu thật sau khi kiểm tra hoạt động]

## Mẫu bài đăng tin bán hàng

**CẦN BÁN [TÊN NÔNG SẢN] — [ĐỊA PHƯƠNG]**

- Mặt hàng: [tên chính xác]
- Sản lượng: [số lượng + đơn vị]
- Quy cách/chất lượng: [mô tả có thể kiểm chứng]
- Thời gian có hàng: [ngày/khoảng thời gian]
- Địa điểm giao: [xã/huyện/tỉnh hoặc khu vực]
- Giá: [giá đã xác nhận + đơn vị] / [thương lượng]
- Ảnh: [ảnh thật của lô hàng, có sự cho phép]
- Liên hệ: [thông tin người đăng đồng ý công khai]
- Ngày xác minh: [ngày]

Chỉ đăng khi người bán đã xác nhận các thông tin trên. Không dùng mẫu này để đăng hàng giả định như hàng đang có sẵn.

## Mẫu bài tìm nguồn hàng

**TÌM NGUỒN [TÊN NÔNG SẢN] TẠI [KHU VỰC]**

- Mặt hàng/quy cách cần mua: [mô tả]
- Số lượng cần: [số lượng + đơn vị]
- Khu vực nhận hàng: [địa điểm]
- Thời gian cần hàng: [thời gian]
- Yêu cầu chất lượng/giấy tờ: [nêu rõ]
- Giá: [mức đã được người mua xác nhận] / đề nghị báo giá
- Liên hệ: [thông tin được phép công khai]

Nhu cầu này chỉ được đăng sau khi người mua xác nhận. Không đăng thay mặt người mua khi chưa được đồng ý.

## Mẫu tin nhắn hỏi khách

Chào anh/chị, em đang xây dựng kênh Chợ Xanh Việt để kết nối nhu cầu mua bán nông sản. Hiện anh/chị đang cần mua hay có nguồn hàng muốn bán? Nếu tiện, anh/chị cho em biết mặt hàng, khu vực, số lượng và quy cách để em ghi nhận đúng nhu cầu. Em chỉ chia sẻ thông tin liên hệ với sự đồng ý của anh/chị; chưa có nguồn phù hợp thì em sẽ nói rõ, không hứa chắc có giao dịch.

## Cách tính doanh thu, không phỏng đoán

- Phí môi giới thực nhận = mức phí đã thỏa thuận và thực tế đã thu.
- Lãi ròng = doanh thu thực nhận − chi phí phát sinh.
- Ví dụ minh họa phép tính, không phải giá thị trường: nếu hợp đồng ghi hoa hồng 300 đồng/kg và giao dịch hoàn tất 2.000 kg, hoa hồng theo thỏa thuận là 600.000 đồng trước chi phí. Chỉ sử dụng mức phí này nếu các bên thật sự đồng ý.

## Điều kiện trước khi mở rộng

1. Biểu mẫu hoạt động và thông tin gửi được lưu an toàn.
2. Không hiển thị dữ liệu mẫu như hàng thật.
3. Có cách xử lý tin giả, khiếu nại và yêu cầu gỡ tin.
4. Chính sách quyền riêng tư và điều khoản sử dụng được công bố.
5. Chỉ thu phí khi cách tính, bên trả phí và thời điểm thanh toán đã rõ ràng.
