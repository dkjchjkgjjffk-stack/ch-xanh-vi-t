import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Page, SampleNotice } from "@/components/Layout";
import { CATEGORIES } from "@/data/sample";

type PendingProduct = {
  id: string; name: string; category: string; price: number; unit: string;
  manufacturer: string | null; registration: string | null; seller_name: string | null;
  seller_phone: string | null; seller_address: string | null; description: string | null;
  created_at: string;
};

export const Route = createFileRoute("/quan-tri-san-pham")({
  head: () => ({ meta: [
    { title: "Kiểm duyệt sản phẩm vật tư — Chợ Xanh Việt" },
    { name: "description", content: "Duyệt sản phẩm vật tư nông nghiệp do người bán gửi." },
  ] }),
  component: ProductModeration,
});

function ProductModeration() {
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [rows, setRows] = useState<PendingProduct[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadPending = useCallback(async () => {
    const { data, error: queryError } = await supabase.from("products")
      .select("id,name,category,price,unit,manufacturer,registration,seller_name,seller_phone,seller_address,description,created_at")
      .eq("status", "pending").eq("is_sample", false)
      .order("created_at", { ascending: true });
    if (queryError) throw queryError;
    setRows((data ?? []) as PendingProduct[]);
  }, []);

  useEffect(() => {
    let active = true;
    const check = async () => {
      try {
        const { data, error: authError } = await supabase.auth.getUser();
        if (authError || !data.user) return;
        const { data: admin, error: roleError } = await supabase.rpc("has_role", {
          _user_id: data.user.id, _role: "admin",
        });
        if (roleError) throw roleError;
        if (!active) return;
        setAuthorized(Boolean(admin));
        if (admin) await loadPending();
      } catch (caught) {
        if (active) setError(caught instanceof Error ? caught.message : "Không tải được danh sách sản phẩm.");
      } finally {
        if (active) setChecking(false);
      }
    };
    void check();
    return () => { active = false; };
  }, [loadPending]);

  const moderate = async (id: string, status: "approved" | "rejected") => {
    setBusyId(id); setError(""); setNotice("");
    try {
      const { error: updateError } = await supabase.from("products")
        .update({ status }).eq("id", id).eq("status", "pending");
      if (updateError) throw updateError;
      setRows(current => current.filter(row => row.id !== id));
      setNotice(status === "approved" ? "Đã duyệt sản phẩm." : "Đã từ chối sản phẩm.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không cập nhật được sản phẩm.");
    } finally { setBusyId(null); }
  };

  return <Page title="Quản trị · Duyệt sản phẩm">
    <SampleNotice>Kiểm tra tên hàng, thông tin nhà sản xuất, số đăng ký và thông tin người bán trước khi duyệt. Việc duyệt tin không thay thế kiểm định chất lượng hoặc xác minh hàng thật.</SampleNotice>
    {checking ? <div className="card p-5 text-center" role="status">Đang kiểm tra quyền truy cập…</div> : !authorized ? (
      <section className="card space-y-3 p-5">
        <h2 className="text-lg font-bold">Không có quyền truy cập</h2>
        <p className="text-sm text-muted-foreground">Cần đăng nhập bằng tài khoản đã được cấp vai trò quản trị.</p>
        <Link to="/tai-khoan" className="btn-primary">Đến trang tài khoản</Link>
      </section>
    ) : <>
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground">Sản phẩm chờ duyệt: <strong>{rows.length}</strong></p>
        <button type="button" className="btn-outline" onClick={() => void loadPending().catch(caught => setError(caught instanceof Error ? caught.message : "Không tải được danh sách."))}>Làm mới</button>
      </div>
      {error && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">{error}</p>}
      {notice && <p className="rounded-lg bg-primary/10 p-3 text-sm" role="status">{notice}</p>}
      {rows.length === 0 ? <div className="card p-8 text-center"><p className="font-semibold">Không có sản phẩm chờ duyệt</p><p className="mt-1 text-sm text-muted-foreground">Sản phẩm gửi mới sẽ xuất hiện tại đây sau khi migration được áp dụng.</p></div> :
        <div className="space-y-3">{rows.map(row => <article key={row.id} className="card space-y-3 p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <span className="chip">{CATEGORIES.find(c => c.id === row.category)?.name ?? row.category}</span>
            <span className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString("vi-VN")}</span>
          </div>
          <h2 className="text-lg font-bold">{row.name}</h2>
          <p className="font-semibold text-primary">{Number(row.price).toLocaleString("vi-VN")} đ/{row.unit}</p>
          <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <div><dt className="text-muted-foreground">Nhà sản xuất</dt><dd>{row.manufacturer || "Chưa cung cấp"}</dd></div>
            <div><dt className="text-muted-foreground">Số đăng ký</dt><dd>{row.registration || "Chưa cung cấp"}</dd></div>
            <div><dt className="text-muted-foreground">Người bán</dt><dd>{row.seller_name || "Chưa cung cấp"}</dd></div>
            <div><dt className="text-muted-foreground">Điện thoại</dt><dd>{row.seller_phone || "Chưa cung cấp"}</dd></div>
            <div className="sm:col-span-2"><dt className="text-muted-foreground">Địa chỉ</dt><dd>{row.seller_address || "Chưa cung cấp"}</dd></div>
          </dl>
          {row.description && <p className="whitespace-pre-wrap text-sm">{row.description}</p>}
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className="btn-primary" disabled={busyId === row.id} onClick={() => void moderate(row.id, "approved")}>{busyId === row.id ? "Đang xử lý…" : "Duyệt sản phẩm"}</button>
            <button type="button" className="btn-outline" disabled={busyId === row.id} onClick={() => void moderate(row.id, "rejected")}>Từ chối</button>
          </div>
        </article>)}</div>}
      <div className="grid gap-2 sm:grid-cols-2">
        <Link to="/quan-tri" className="btn-outline">Duyệt tin nông sản</Link>
        <Link to="/quan-tri-gia" className="btn-outline">Quản lý bảng giá</Link>
      </div>
    </>}
  </Page>;
}
