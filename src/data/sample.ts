// DỮ LIỆU MẪU — chỉ để xem thử giao diện. Không phải sản phẩm, giá hay tin đăng thật.

export type Category = "phan-bon" | "thuoc-bvtv" | "dung-cu" | "vat-tu";
export const CATEGORIES: { id: Category; name: string; icon: string }[] = [
  { id: "phan-bon", name: "Phân bón", icon: "🌱" },
  { id: "thuoc-bvtv", name: "Thuốc BVTV", icon: "🧴" },
  { id: "dung-cu", name: "Dụng cụ", icon: "🛠️" },
  { id: "vat-tu", name: "Vật tư", icon: "📦" },
];

export type VerifyStatus = "verified" | "seller" | "none";

export interface Product {
  id: string;
  name: string;
  category: Category;
  price: number;
  priceOnRequest?: boolean;
  unit: string;
  icon: string;
  description: string;
  manufacturer: string;
  registration: string; // số đăng ký do người bán khai
  verify: VerifyStatus;
  seller: { name: string; phone: string; address: string };
  imageUrl?: string | null;
}

const seller1 = { name: "Cửa hàng mẫu A", phone: "0900 000 001", address: "Địa chỉ mẫu, Cần Thơ" };
const seller2 = { name: "Cửa hàng mẫu B", phone: "0900 000 002", address: "Địa chỉ mẫu, Đắk Lắk" };

export const PRODUCTS: Product[] = [
  { id: "p1", name: "Phân NPK 16-16-8 (mẫu)", category: "phan-bon", price: 450000, unit: "bao 25kg", icon: "🌱", description: "Sản phẩm mẫu minh họa. Mô tả thật sẽ do người bán cung cấp.", manufacturer: "Người bán chưa cung cấp", registration: "Chưa cung cấp", verify: "none", seller: seller1 },
  { id: "p2", name: "Phân hữu cơ vi sinh (mẫu)", category: "phan-bon", price: 180000, unit: "bao 20kg", icon: "🍂", description: "Sản phẩm mẫu minh họa cho danh mục phân bón hữu cơ.", manufacturer: "Công ty mẫu (người bán khai)", registration: "SĐK-MAU-001 (người bán khai)", verify: "seller", seller: seller2 },
  { id: "p3", name: "Thuốc trừ sâu sinh học (mẫu)", category: "thuoc-bvtv", price: 95000, unit: "chai 500ml", icon: "🧴", description: "Sản phẩm mẫu. Luôn đọc kỹ nhãn và hướng dẫn trước khi dùng thuốc BVTV.", manufacturer: "Công ty mẫu (người bán khai)", registration: "SĐK-MAU-002 (người bán khai)", verify: "seller", seller: seller1 },
  { id: "p4", name: "Thuốc trừ bệnh nấm (mẫu)", category: "thuoc-bvtv", price: 120000, unit: "gói 100g", icon: "🧪", description: "Sản phẩm mẫu minh họa.", manufacturer: "Người bán chưa cung cấp", registration: "Chưa cung cấp", verify: "none", seller: seller2 },
  { id: "p5", name: "Bình xịt điện 16 lít (mẫu)", category: "dung-cu", price: 850000, unit: "cái", icon: "🚿", description: "Sản phẩm mẫu minh họa cho dụng cụ phun xịt.", manufacturer: "Người bán chưa cung cấp", registration: "Không áp dụng", verify: "none", seller: seller1 },
  { id: "p6", name: "Kéo cắt cành (mẫu)", category: "dung-cu", price: 150000, unit: "cái", icon: "✂️", description: "Sản phẩm mẫu minh họa.", manufacturer: "Người bán chưa cung cấp", registration: "Không áp dụng", verify: "none", seller: seller2 },
  { id: "p7", name: "Màng phủ nông nghiệp (mẫu)", category: "vat-tu", price: 320000, unit: "cuộn", icon: "🎞️", description: "Sản phẩm mẫu minh họa cho vật tư.", manufacturer: "Người bán chưa cung cấp", registration: "Không áp dụng", verify: "none", seller: seller1 },
  { id: "p8", name: "Ống tưới nhỏ giọt (mẫu)", category: "vat-tu", price: 210000, unit: "cuộn 100m", icon: "💧", description: "Sản phẩm mẫu minh họa.", manufacturer: "Người bán chưa cung cấp", registration: "Không áp dụng", verify: "none", seller: seller2 },
];

export type ListingType = "ban" | "mua";
export interface Listing {
  id: string;
  type: ListingType;
  title: string;
  crop: string;
  icon: string;
  quantity: string;
  price: string;
  province: string;
  contactName: string;
  phone: string;
  description: string;
  postedAt: string;
}

export const CROPS = ["Lúa gạo", "Cà phê", "Sầu riêng", "Thanh long", "Rau củ", "Tiêu", "Xoài"];
export const PROVINCES = ["An Giang", "Cần Thơ", "Đắk Lắk", "Lâm Đồng", "Tiền Giang", "Bình Thuận", "Đồng Tháp", "Gia Lai"];

export const LISTINGS: Listing[] = [
  { id: "l1", type: "ban", title: "Bán lúa tươi vụ mới (tin mẫu)", crop: "Lúa gạo", icon: "🌾", quantity: "20 tấn", price: "Thương lượng", province: "An Giang", contactName: "Nông dân mẫu 1", phone: "0900 000 101", description: "Tin đăng mẫu để xem thử giao diện.", postedAt: "2026-10-15" },
  { id: "l2", type: "mua", title: "Cần mua cà phê nhân (tin mẫu)", crop: "Cà phê", icon: "☕", quantity: "50 tấn", price: "Theo giá thị trường", province: "Đắk Lắk", contactName: "Thương lái mẫu 1", phone: "0900 000 102", description: "Nhu cầu thu mua mẫu.", postedAt: "2026-10-16" },
  { id: "l3", type: "ban", title: "Bán sầu riêng tại vườn (tin mẫu)", crop: "Sầu riêng", icon: "🍈", quantity: "5 tấn", price: "Thương lượng", province: "Tiền Giang", contactName: "Nông dân mẫu 2", phone: "0900 000 103", description: "Tin đăng mẫu.", postedAt: "2026-10-14" },
  { id: "l4", type: "ban", title: "Bán thanh long ruột đỏ (tin mẫu)", crop: "Thanh long", icon: "🐉", quantity: "3 tấn", price: "Liên hệ", province: "Bình Thuận", contactName: "Nông dân mẫu 3", phone: "0900 000 104", description: "Tin đăng mẫu.", postedAt: "2026-10-16" },
  { id: "l5", type: "mua", title: "Thu mua rau củ cho bếp ăn (tin mẫu)", crop: "Rau củ", icon: "🥬", quantity: "200 kg/ngày", price: "Thương lượng", province: "Lâm Đồng", contactName: "Đơn vị thu mua mẫu", phone: "0900 000 105", description: "Nhu cầu thu mua mẫu.", postedAt: "2026-10-13" },
  { id: "l6", type: "ban", title: "Bán tiêu đen phơi khô (tin mẫu)", crop: "Tiêu", icon: "⚫", quantity: "2 tấn", price: "Liên hệ", province: "Gia Lai", contactName: "Nông dân mẫu 4", phone: "0900 000 106", description: "Tin đăng mẫu.", postedAt: "2026-10-12" },
];

// Bảng giá tham khảo công khai được thu thập ngày 20/10/2026.
// Giá gắn ngày, vùng và nguồn; đây chưa phải luồng tự động đồng bộ liên tục.
export interface PriceRow { crop: string; unit: string; province: string; price: number | null; updatedAt: string | null; source: string | null }
export const PRICES: PriceRow[] = [
  { crop: "Cà phê Robusta", unit: "kg", province: "Đắk Lắk", price: 93000, updatedAt: "20/10/2026", source: "Báo Hà Tĩnh — https://baohatinh.vn/cong-cu/gia-ca-phe-hom-nay" },
  { crop: "Cà phê Robusta", unit: "kg", province: "Đắk Nông", price: 93200, updatedAt: "20/10/2026", source: "Báo Hà Tĩnh — https://baohatinh.vn/cong-cu/gia-ca-phe-hom-nay" },
  { crop: "Cà phê Robusta", unit: "kg", province: "Gia Lai", price: 93000, updatedAt: "20/10/2026", source: "Báo Hà Tĩnh — https://baohatinh.vn/cong-cu/gia-ca-phe-hom-nay" },
  { crop: "Cà phê Robusta", unit: "kg", province: "Lâm Đồng", price: 92300, updatedAt: "20/10/2026", source: "Báo Hà Tĩnh — https://baohatinh.vn/cong-cu/gia-ca-phe-hom-nay" },
  { crop: "Tiêu đen", unit: "kg", province: "Gia Lai", price: 137500, updatedAt: "20/10/2026", source: "Báo Hà Tĩnh — https://baohatinh.vn/cong-cu/gia-tieu-hom-nay" },
  { crop: "Tiêu đen", unit: "kg", province: "Đắk Lắk", price: 139000, updatedAt: "20/10/2026", source: "Báo Hà Tĩnh — https://baohatinh.vn/cong-cu/gia-tieu-hom-nay" },
  { crop: "Tiêu đen", unit: "kg", province: "Bình Phước", price: 137500, updatedAt: "20/10/2026", source: "Báo Hà Tĩnh — https://baohatinh.vn/cong-cu/gia-tieu-hom-nay" },
  { crop: "Tiêu đen", unit: "kg", province: "Bà Rịa – Vũng Tàu", price: 138000, updatedAt: "20/10/2026", source: "Báo Hà Tĩnh — https://baohatinh.vn/cong-cu/gia-tieu-hom-nay" },
  { crop: "Tiêu đen", unit: "kg", province: "Đắk Nông", price: 140000, updatedAt: "20/10/2026", source: "Báo Hà Tĩnh — https://baohatinh.vn/cong-cu/gia-tieu-hom-nay" },
  { crop: "Tiêu đen", unit: "kg", province: "Đồng Nai", price: 137500, updatedAt: "20/10/2026", source: "Báo Hà Tĩnh — https://baohatinh.vn/cong-cu/gia-tieu-hom-nay" },
  { crop: "Tiêu đen", unit: "kg", province: "Tây Nguyên", price: 139000, updatedAt: "20/10/2026", source: "Báo Hà Tĩnh — https://baohatinh.vn/cong-cu/gia-tieu-hom-nay" },
  { crop: "Sầu Thái hàng lỗi", unit: "kg", province: "Gia Lai", price: 81000, updatedAt: "20/10/2026", source: "Giá Nông Sản 24/7 — https://www.gianongsan247.com/" },
  { crop: "Sầu riêng Ri6 loại A", unit: "kg", province: "Gia Lai", price: 35000, updatedAt: "20/10/2026", source: "Giá Nông Sản 24/7 — https://www.gianongsan247.com/" },
  { crop: "Sầu riêng Ri6 loại B", unit: "kg", province: "Gia Lai", price: 20000, updatedAt: "20/10/2026", source: "Giá Nông Sản 24/7 — https://www.gianongsan247.com/" },
  { crop: "Sầu Thái loại A", unit: "kg", province: "Gia Lai", price: 88000, updatedAt: "20/10/2026", source: "Giá Nông Sản 24/7 — https://www.gianongsan247.com/" },
  { crop: "Sầu Thái loại B", unit: "kg", province: "Gia Lai", price: 75000, updatedAt: "20/10/2026", source: "Giá Nông Sản 24/7 — https://www.gianongsan247.com/" },
  { crop: "Sầu Thái hàng lỗi loại A", unit: "kg", province: "Lâm Đồng", price: 62500, updatedAt: "20/10/2026", source: "Giá Nông Sản 24/7 — https://www.gianongsan247.com/" },
  { crop: "Sầu Thái loại A", unit: "kg", province: "Lâm Đồng", price: 79000, updatedAt: "20/10/2026", source: "Giá Nông Sản 24/7 — https://www.gianongsan247.com/" },
  { crop: "Sầu Thái loại B", unit: "kg", province: "Lâm Đồng", price: 59000, updatedAt: "20/10/2026", source: "Giá Nông Sản 24/7 — https://www.gianongsan247.com/" },
  { crop: "Sầu Thái dạt", unit: "kg", province: "Miền Tây Nam Bộ", price: 32500, updatedAt: "20/10/2026", source: "Giá Nông Sản 24/7 — https://www.gianongsan247.com/" },
  { crop: "Sầu riêng Ri6 loại A", unit: "kg", province: "Miền Tây Nam Bộ", price: 75000, updatedAt: "20/10/2026", source: "Giá Nông Sản 24/7 — https://www.gianongsan247.com/" },
  { crop: "Sầu riêng Ri6 loại B", unit: "kg", province: "Miền Tây Nam Bộ", price: 61500, updatedAt: "20/10/2026", source: "Giá Nông Sản 24/7 — https://www.gianongsan247.com/" },
  { crop: "Sầu Thái loại A", unit: "kg", province: "Miền Tây Nam Bộ", price: 84500, updatedAt: "20/10/2026", source: "Giá Nông Sản 24/7 — https://www.gianongsan247.com/" },
  { crop: "Sầu Thái loại B", unit: "kg", province: "Miền Tây Nam Bộ", price: 63500, updatedAt: "20/10/2026", source: "Giá Nông Sản 24/7 — https://www.gianongsan247.com/" },
  { crop: "Sầu riêng Musang King loại B", unit: "kg", province: "Đắk Lắk", price: 56000, updatedAt: "20/10/2026", source: "Giá Nông Sản 24/7 — https://www.gianongsan247.com/" },
  { crop: "Cao su mủ đông tạp loại 1", unit: "kg", province: "Gia Lai", price: 459, updatedAt: "20/10/2026", source: "Giá Nông Sản 24/7 — https://www.gianongsan247.com/" },
  { crop: "Lúa OM5451", unit: "kg", province: "Miền Tây Nam Bộ", price: 6100, updatedAt: "20/10/2026", source: "Giá Nông Sản 24/7 — https://www.gianongsan247.com/" },
  { crop: "Lúa Đài Thơm 8", unit: "kg", province: "Miền Tây Nam Bộ", price: 6300, updatedAt: "20/10/2026", source: "Giá Nông Sản 24/7 — https://www.gianongsan247.com/" },
  { crop: "Lúa OM18", unit: "kg", province: "Miền Tây Nam Bộ", price: 6250, updatedAt: "20/10/2026", source: "Giá Nông Sản 24/7 — https://www.gianongsan247.com/" },
  { crop: "Lúa IR50404", unit: "kg", province: "Miền Tây Nam Bộ", price: 5950, updatedAt: "20/10/2026", source: "Giá Nông Sản 24/7 — https://www.gianongsan247.com/" },
];

export const vnd = (n: number) => n.toLocaleString("vi-VN") + " đ";

