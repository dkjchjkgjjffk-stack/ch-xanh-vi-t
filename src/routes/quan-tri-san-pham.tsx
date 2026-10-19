import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Page, SampleNotice } from "@/components/Layout";
import { CATEGORIES, type Category } from "@/data/sample";

type ProductRow = {
  id: string; name: string; category: string; price: number; price_on_request: boolean; unit: string;
  description: string | null; icon: string | null; image_url: string | null;
  manufacturer: string | null; registration: string | null; seller_name: string;
  seller_phone: string; seller_address: string | null; status: string;
  verify_status: string; created_at: string;
};
type ProductForm = {
  name: string; category: Category; price: string; price_on_request: boolean; unit: string; description: string;
  icon: string; manufacturer: string; registration: string; seller_name: string;
  seller_phone: string; seller_address: string; status: "approved" | "pending" | "rejected";
  verify_status: "none" | "seller" | "verified"; image_url: string | null;
};
const emptyForm = (): ProductForm => ({
  name: "", category: "phan-bon", price: "", price_on_request: false, unit: "bao", description: "", icon: "🌱",
  manufacturer: "", registration: "", seller_name: "Hải Tây Phát", seller_phone: "",
  seller_address: "", status: "approved", verify_status: "none", image_url: null,
});

export const Route = createFileRoute("/quan-tri-san-pham")({
  head: () => ({ meta: [
    { title: "Quản lý sản phẩm — Hải Tây Phát" },
    { name: "description", content: "Thêm, sửa, ẩn và quản lý sản phẩm vật tư nông nghiệp." },
  ] }),
  component: ProductManagement,
});

function ProductManagement() {
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadProducts = useCallback(async () => {
    const { data, error: queryError } = await supabase.from("products")
      .select("id,name,category,price,price_on_request,unit,description,icon,image_url,manufacturer,registration,seller_name,seller_phone,seller_address,status,verify_status,created_at")
      .eq("is_sample", false).order("created_at", { ascending: false }).limit(500);
    if (queryError) throw queryError;
    setRows((data ?? []) as ProductRow[]);
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
        if (admin) await loadProducts();
      } catch (caught) {
        if (active) setError(caught instanceof Error ? caught.message : "Không tải được sản phẩm.");
      } finally {
        if (active) setChecking(false);
      }
    };
    void check();
    return () => { active = false; };
  }, [loadProducts]);

  const updateForm = <K extends keyof ProductForm>(key: K, value: ProductForm[K]) =>
    setForm(current => ({ ...current, [key]: value }));

  const resetForm = () => {
    setForm(emptyForm());
    setEditingId(null);
    setImage(null);
  };

  const editProduct = (p: ProductRow) => {
    setEditingId(p.id);
    setImage(null);
    setForm({
      name: p.name, category: p.category as Category, price: p.price_on_request ? "" : String(p.price), price_on_request: p.price_on_request, unit: p.unit,
      description: p.description ?? "", icon: p.icon ?? "📦", manufacturer: p.manufacturer ?? "",
      registration: p.registration ?? "", seller_name: p.seller_name, seller_phone: p.seller_phone,
      seller_address: p.seller_address ?? "", status: p.status as ProductForm["status"],
      verify_status: p.verify_status as ProductForm["verify_status"], image_url: p.image_url,
    });
    setError("");
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true); setError(""); setNotice("");
    try {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError || !auth.user) throw new Error("Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.");
      const amount = form.price_on_request ? 0 : Number(form.price.replace(/[^0-9.]/g, ""));
      if (!form.price_on_request && (!Number.isFinite(amount) || amount <= 0)) throw new Error("Nhập giá bán hoặc chọn “Giá bán: Liên hệ”.");
      let imagePath = form.image_url;
      if (image) {
        if (image.size > 5 * 1024 * 1024) throw new Error("Ảnh tối đa 5MB.");
        const ext = (image.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
        const path = `${auth.user.id}/products/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("images").upload(path, image, {
          contentType: image.type || "image/jpeg", upsert: false,
        });
        if (uploadError) throw uploadError;
        imagePath = path;
      }
      const payload = {
        name: form.name.trim(), category: form.category, price: amount, price_on_request: form.price_on_request, unit: form.unit.trim(),
        description: form.description.trim(), icon: form.icon.trim() || "📦", image_url: imagePath,
        manufacturer: form.manufacturer.trim() || "Người bán chưa cung cấp",
        registration: form.registration.trim() || "Chưa cung cấp",
        seller_name: form.seller_name.trim(), seller_phone: form.seller_phone.trim(),
        seller_address: form.seller_address.trim(), status: form.status, verify_status: form.verify_status,
        is_sample: false,
      };
      const result = editingId
        ? await supabase.from("products").update(payload).eq("id", editingId).eq("is_sample", false)
        : await supabase.from("products").insert({ ...payload, seller_id: auth.user.id });
      if (result.error) throw result.error;
      await loadProducts();
      setNotice(editingId ? "Đã cập nhật sản phẩm." : "Đã thêm sản phẩm vào cơ sở dữ liệu.");
      resetForm();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không lưu được sản phẩm.");
    } finally { setBusy(false); }
  };

  const changeStatus = async (p: ProductRow, status: ProductForm["status"]) => {
    setBusyId(p.id); setError(""); setNotice("");
    try {
      const { error: updateError } = await supabase.from("products").update({ status }).eq("id", p.id).eq("is_sample", false);
      if (updateError) throw updateError;
      await loadProducts();
      setNotice(status === "approved" ? "Đã xuất bản sản phẩm." : status === "pending" ? "Đã chuyển sản phẩm về chờ duyệt." : "Đã ẩn/từ chối sản phẩm.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không đổi được trạng thái.");
    } finally { setBusyId(null); }
  };

  const deleteProduct = async (p: ProductRow) => {
    if (!window.confirm(`Xóa sản phẩm “${p.name}”? Thao tác này không thể hoàn tác.`)) return;
    setBusyId(p.id); setError(""); setNotice("");
    try {
      const { error: deleteError } = await supabase.from("products").delete().eq("id", p.id).eq("is_sample", false);
      if (deleteError) throw deleteError;
      setRows(current => current.filter(row => row.id !== p.id));
      if (editingId === p.id) resetForm();
      setNotice("Đã xóa sản phẩm.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không xóa được sản phẩm.");
    } finally { setBusyId(null); }
  };

  return <Page title="Quản trị · Quản lý sản phẩm">
    <SampleNotice>Thêm và sửa sản phẩm thật tại đây. Sản phẩm ở trạng thái “Đã xuất bản” sẽ xuất hiện ở cửa hàng công khai; dữ liệu mẫu không bị sửa/xóa tại trang này.</SampleNotice>
    {checking ? <div className="card p-5 text-center" role="status">Đang kiểm tra quyền quản trị…</div> : !authorized ? (
      <section className="card space-y-3 p-5">
        <h2 className="text-lg font-bold">Không có quyền truy cập</h2>
        <p className="text-sm text-muted-foreground">Đăng nhập bằng tài khoản đã được cấp vai trò quản trị.</p>
        <Link to="/tai-khoan" className="btn-primary">Đến trang tài khoản</Link>
      </section>
    ) : <>
      <div className="grid gap-2 sm:grid-cols-3">
        <div className="card p-3"><p className="text-sm text-muted-foreground">Tổng sản phẩm thật</p><p className="text-2xl font-bold">{rows.length}</p></div>
        <div className="card p-3"><p className="text-sm text-muted-foreground">Đang xuất bản</p><p className="text-2xl font-bold">{rows.filter(p => p.status === "approved").length}</p></div>
        <div className="card p-3"><p className="text-sm text-muted-foreground">Chờ duyệt</p><p className="text-2xl font-bold">{rows.filter(p => p.status === "pending").length}</p></div>
      </div>
      <section className="card space-y-4 p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">{editingId ? "Sửa sản phẩm" : "＋ Thêm sản phẩm mới"}</h2>
          {editingId && <button type="button" className="btn-outline" onClick={resetForm}>Hủy sửa</button>}
        </div>
        <form className="space-y-4" onSubmit={saveProduct}>
          <label className="block space-y-1"><span className="text-sm font-semibold">Tên sản phẩm *</span><input className="field" required minLength={2} maxLength={180} value={form.name} onChange={e=>updateForm("name",e.target.value)} /></label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1"><span className="text-sm font-semibold">Danh mục *</span><select className="field" value={form.category} onChange={e=>updateForm("category",e.target.value as Category)}>{CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
            <div className="space-y-2"><label className="block space-y-1"><span className="text-sm font-semibold">Giá bán (VNĐ)</span><input className="field" required={!form.price_on_request} disabled={form.price_on_request} inputMode="decimal" value={form.price} onChange={e=>updateForm("price",e.target.value)} placeholder="450000" /></label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.price_on_request} onChange={e=>updateForm("price_on_request",e.target.checked)} /> Giá bán: Liên hệ báo giá</label></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1"><span className="text-sm font-semibold">Đơn vị *</span><input className="field" required maxLength={60} value={form.unit} onChange={e=>updateForm("unit",e.target.value)} placeholder="bao 25kg, chai 500ml..." /></label>
            <label className="block space-y-1"><span className="text-sm font-semibold">Biểu tượng</span><input className="field" maxLength={12} value={form.icon} onChange={e=>updateForm("icon",e.target.value)} /></label>
          </div>
          <label className="block space-y-1"><span className="text-sm font-semibold">Ảnh sản phẩm</span><input className="field" type="file" accept="image/*" onChange={e=>setImage(e.target.files?.[0] ?? null)} /><span className="text-xs text-muted-foreground">Không bắt buộc, tối đa 5MB.</span>{form.image_url && !image && <p className="text-xs text-muted-foreground">Sản phẩm hiện đã có ảnh; chọn ảnh mới nếu muốn thay.</p>}</label>
          <label className="block space-y-1"><span className="text-sm font-semibold">Mô tả</span><textarea className="field min-h-24" maxLength={5000} value={form.description} onChange={e=>updateForm("description",e.target.value)} /></label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1"><span className="text-sm font-semibold">Nhà sản xuất</span><input className="field" maxLength={180} value={form.manufacturer} onChange={e=>updateForm("manufacturer",e.target.value)} /></label>
            <label className="block space-y-1"><span className="text-sm font-semibold">Số đăng ký / lưu hành</span><input className="field" maxLength={120} value={form.registration} onChange={e=>updateForm("registration",e.target.value)} /></label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1"><span className="text-sm font-semibold">Tên cửa hàng / người bán *</span><input className="field" required maxLength={150} value={form.seller_name} onChange={e=>updateForm("seller_name",e.target.value)} /></label>
            <label className="block space-y-1"><span className="text-sm font-semibold">Số điện thoại *</span><input className="field" required type="tel" maxLength={30} value={form.seller_phone} onChange={e=>updateForm("seller_phone",e.target.value)} /></label>
          </div>
          <label className="block space-y-1"><span className="text-sm font-semibold">Địa chỉ người bán</span><input className="field" maxLength={500} value={form.seller_address} onChange={e=>updateForm("seller_address",e.target.value)} /></label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1"><span className="text-sm font-semibold">Trạng thái hiển thị</span><select className="field" value={form.status} onChange={e=>updateForm("status",e.target.value as ProductForm["status"])}><option value="approved">Đã xuất bản</option><option value="pending">Chờ duyệt</option><option value="rejected">Ẩn / từ chối</option></select></label>
            <label className="block space-y-1"><span className="text-sm font-semibold">Trạng thái thông tin</span><select className="field" value={form.verify_status} onChange={e=>updateForm("verify_status",e.target.value as ProductForm["verify_status"])}><option value="none">Chưa xác minh</option><option value="seller">Người bán tự khai</option><option value="verified">Đã xác minh</option></select></label>
          </div>
          {error && <p className="rounded-lg bg-destructive/10 p-3 text-sm" role="alert">{error}</p>}
          {notice && <p className="rounded-lg bg-primary/10 p-3 text-sm" role="status">{notice}</p>}
          <button className="btn-primary w-full" type="submit" disabled={busy}>{busy ? "Đang lưu…" : editingId ? "Lưu thay đổi" : "Thêm sản phẩm"}</button>
        </form>
      </section>
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-bold">Danh sách sản phẩm</h2><button type="button" className="btn-outline" onClick={() => void loadProducts().catch(e=>setError(e instanceof Error ? e.message : "Không tải được danh sách."))}>Làm mới</button></div>
        {rows.length === 0 ? <div className="card p-6 text-center text-muted-foreground">Chưa có sản phẩm thật. Dùng biểu mẫu phía trên để thêm sản phẩm đầu tiên.</div> :
          <div className="space-y-3">{rows.map(p=><article key={p.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-secondary text-3xl">{p.icon || "📦"}</div>
            <div className="min-w-0 flex-1 space-y-1">
              <h3 className="font-bold">{p.name}</h3>
              <p className="text-sm text-primary">{p.price_on_request ? "Liên hệ báo giá" : `${Number(p.price).toLocaleString("vi-VN")} đ / ${p.unit}`}</p>
              <p className="text-xs text-muted-foreground">{CATEGORIES.find(c=>c.id===p.category)?.name ?? p.category} · {p.seller_name} · {new Date(p.created_at).toLocaleDateString("vi-VN")}</p>
              <span className={`chip ${p.status === "approved" ? "bg-success text-success-foreground" : p.status === "pending" ? "bg-warning text-warning-foreground" : "bg-muted text-muted-foreground"}`}>{p.status === "approved" ? "Đang xuất bản" : p.status === "pending" ? "Chờ duyệt" : "Đang ẩn"}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:w-44">
              <button type="button" className="btn-outline" onClick={()=>editProduct(p)}>Sửa</button>
              {p.status === "approved"
                ? <button type="button" className="btn-outline" disabled={busyId===p.id} onClick={()=>void changeStatus(p,"rejected")}>Ẩn</button>
                : <button type="button" className="btn-primary" disabled={busyId===p.id} onClick={()=>void changeStatus(p,"approved")}>Xuất bản</button>}
              <button type="button" className="btn-outline col-span-2 text-destructive" disabled={busyId===p.id} onClick={()=>void deleteProduct(p)}>Xóa sản phẩm</button>
            </div>
          </article>)}</div>}
      </section>
      <div className="grid gap-2 sm:grid-cols-3">
        <Link to="/quan-tri" className="btn-outline">Duyệt tin nông sản</Link>
        <Link to="/cua-hang" className="btn-outline">Xem cửa hàng công khai</Link>
        <Link to="/tai-khoan" className="btn-outline">Tài khoản</Link>
      </div>
    </>}
  </Page>;
}
