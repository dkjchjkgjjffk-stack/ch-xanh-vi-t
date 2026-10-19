-- Khóa quyền gọi trực tiếp các hàm trigger nội bộ (chỉ hệ thống dùng).
revoke all on function public.guard_moderation() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.touch_order_updated_at() from public, anon, authenticated;
revoke all on function public.is_order_seller(uuid, uuid) from public, anon;
revoke all on function public.has_role(uuid, app_role) from public, anon;