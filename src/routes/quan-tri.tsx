import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Page, SampleNotice } from "@/components/Layout";

type PendingListing = {
  id: string;
  title: string;
  crop: string;
  type: string;
  quantity: string;
  price_text: string;
  province: string;
  contact_name: string;
  phone: string;
  description: string;
  created_at: string;
};

export const Route = createFileRoute("/quan-tri")({
  head: () => ({
    meta: [
      { title: "Kiểm duyệt tin đăng — Chợ Xanh Việt" },
      { name: "description", content: "Khu vực quản trị để duyệt tin đăng nông sản." },
    ],
  }),
  component: ListingModeration,
});

function ListingModeration() {
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [rows, setRows] = useState<PendingListing[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadPending = useCallback(async () => {
    const { data, error: queryError } = await supabase
      .from("listings")
      .select("id,title,crop,type,quantity,price_text,province,contact_name,phone,description,created_at")
      .eq("status", "pending")
      .eq("is_sample", false)
      .order("created_at", { ascending: true });
    if (queryError) throw queryError;
    setRows(data ?? []);
  }, []);

  useEffect(() => {
    let active = true;
    const check = async () => {
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
          if (active) setAuthorized(false);
          return;
        }
        const { data: isAdmin, error: roleError } = await supabase.rpc("has_role", {
          _user_id: userData.user.id,
          _role: "admin",
        });
        if (roleError) throw roleError;
        if (!active) return;
        setAuthorized(Boolean(isAdmin));
        if (isAdmin) await loadPending();
      } catch (caught) {
        if (active) setError(caught instanceof Error ? caught.message : "Không thể kiểm tra quyền quản trị.");
      } finally {
        if (active) setChecking(false);
      }
    };
    void check();
    return () => { active = false; };
  }, [loadPending]);

  const moderate = async (id: string, status: "approved" | "rejected") => {
    setBusyId(id);
    setError("");
    setNotice("");
    try {
      const { error: updateError } = await supabase
        .from("listings")
        .update({ status })
        .eq("id", id)
        .eq("status", "pending");
      if (updateError) throw updateError;
      setRows((current) => current.filter((row) => row.id !== id));
      setNotice(status === "approved" ? "Đã duyệt tin. Tin có thể hiển thị công khai." : "Đã từ chối tin đăng.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không cập nhật được tin.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Page title="Quản trị · Kiểm duyệt tin">
      <SampleNotice>Chỉ tài khoản được cấp vai trò quản trị mới có thể duyệt tin. Hãy kiểm tra nội dung và thông tin liên hệ trước khi xuất bản.</SampleNotice>
      {checking ? <div className="card p-5 text-center" role="status">Đang kiểm tra quyền truy cập…</div> : !authorized ? (
        <section className="card space-y-3 p-5">
          <h2 className="text-lg font-bold">Không có quyền truy cập</h2>
          <p className="text-sm text-muted-foreground">Bạn cần đăng nhập bằng tài khoản đã được cấp vai trò quản trị. Tạo tài khoản mới không tự động cấp quyền quản trị.</p>
          <Link to="/tai-khoan" className="btn-primary">Đến trang tài khoản</Link>
        </section>
      ) : (
        <>
          <div className="grid gap-2 sm:grid-cols-2">
            <Link to="/quan-tri-gia" className="btn-outline">Quản lý bảng giá nông sản</Link>
            <Link to="/bang-gia" className="btn-outline">Xem bảng giá công khai</Link>
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-muted-foreground">Tin chờ duyệt: <strong>{rows.length}</strong></p>
            <button type="button" className="btn-outline" onClick={() => void loadPending().catch((caught) => setError(caught instanceof Error ? caught.message : "Không tải được danh sách."))}>Làm mới</button>
          </div>
          {error && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">{error}</p>}
          {notice && <p className="rounded-lg bg-primary/10 p-3 text-sm" role="status">{notice}</p>}
          {rows.length === 0 ? <div className="card p-8 text-center"><p className="font-semibold">Không có tin chờ duyệt</p><p className="mt-1 text-sm text-muted-foreground">Các tin gửi mới sẽ xuất hiện tại đây sau khi cơ sở dữ liệu được cấu hình.</p></div> : (
            <div className="space-y-3">
              {rows.map((row) => (
                <article key={row.id} className="card space-y-3 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <span className="chip bg-warning text-warning-foreground">{row.type === "mua" ? "Cần mua" : "Cần bán"}</span>
                    <span className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString("vi-VN")}</span>
                  </div>
                  <h2 className="text-lg font-bold">{row.title}</h2>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <div><dt className="text-muted-foreground">Nông sản</dt><dd className="font-semibold">{row.crop}</dd></div>
                    <div><dt className="text-muted-foreground">Số lượng</dt><dd className="font-semibold">{row.quantity}</dd></div>
                    <div><dt className="text-muted-foreground">Giá dự kiến</dt><dd className="font-semibold">{row.price_text}</dd></div>
                    <div><dt className="text-muted-foreground">Địa phương</dt><dd className="font-semibold">{row.province}</dd></div>
                    <div><dt className="text-muted-foreground">Người liên hệ</dt><dd className="font-semibold">{row.contact_name}</dd></div>
                    <div><dt className="text-muted-foreground">Điện thoại</dt><dd className="font-semibold">{row.phone}</dd></div>
                  </dl>
                  {row.description && <p className="whitespace-pre-wrap text-sm">{row.description}</p>}
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" className="btn-primary" disabled={busyId === row.id} onClick={() => void moderate(row.id, "approved")}>{busyId === row.id ? "Đang xử lý…" : "Duyệt tin"}</button>
                    <button type="button" className="btn-outline" disabled={busyId === row.id} onClick={() => void moderate(row.id, "rejected")}>Từ chối</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </Page>
  );
}
