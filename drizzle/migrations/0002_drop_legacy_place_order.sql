-- Xóa hàm đặt hàng phiên bản cũ (4 tham số), chỉ giữ phiên bản có ghi chú.
drop function if exists public.place_order(jsonb, text, text, text);