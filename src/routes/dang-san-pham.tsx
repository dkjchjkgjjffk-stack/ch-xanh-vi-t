import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES } from "@/data/sample";
import { Page, SampleNotice } from "@/components/Layout";

export const Route = createFileRoute("/dang-san-pham")({
  head: () => ({ meta: [{ title: "Đăng sản phẩm vật tư — Chợ Xanh Việt" }, { name: "description", content: "Gửi sản phẩm vật tư nông nghiệp để kiểm duyệt." }] }),
  component: SubmitProduct,
});

function SubmitProduct() {
  const [email, setEmail] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]?.id ?? "phan-bon");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState("bao");
  const [maker, setMaker] = useState("");
  const [registration, setRegistration] = useState("");
  const [seller, setSeller] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (active) { setEmail(data.user?.email ?? null); setChecking(false); }
    }).catch(() => { if (active) { setError("Không kiểm tra được tài khoản."); setChecking(false); } });
    return () => { active = false; };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setSuccess(""); setBusy(true);
    try {
      const { data, error: authError } = await supabase.auth.getUser();
      if (authError || !data.user) throw new Error("Vui lòng đăng nhập lại.");
      const amount = Number(price.replace(/[^0-9]/g, ""));
      if (!amount) throw new Error("Vui lòng nhập giá bán hợp lệ.");
      if (!/^[+0-9().\s-]{9,20}$/.test(phone.trim())) throw new Error("Số điện thoại chưa hợp lệ.");
      let imagePath: string | null = null;
      if (image) {
        if (image.size > 5 * 1024 * 1024) throw new Error("Ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 5MB.");
        const ext = (image.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
        imagePath = `${data.user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("images").upload(imagePath, image, { contentType: image.type || undefined });
        if (uploadError) throw uploadError;
      }
      const { error: insertError } = await supabase.from("products").insert({
        image_url: imagePath,
        seller_id: data.user.id, name: name.trim(), category, price: amount, unit: unit.trim(),
        manufacturer: maker.trim() || "Người bán chưa cung cấp",
        registration: registration.trim() || "Chưa cung cấp",
        seller_name: seller.trim(), seller_phone: phone.trim(), seller_address: address.trim(),
        description: description.trim(), icon: CATEGORIES.find(c => c.id === category)?.icon ?? "📦",
        status: "pending", is_sample: false, verify_status: maker.trim() || registration.trim() ? "seller" : "none"
      });
      if (insertError) throw insertError;
      setSuccess("Đã gửi sản phẩm. Sản phẩm sẽ chỉ hiển thị sau khi được quản trị viên duyệt.");
      setName(""); setPrice(""); setMaker(""); setRegistration(""); setDescription("");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Không gửi được sản phẩm.";
      setError(message.includes("schema cache") || message.includes("relation") ? "Cơ sở dữ liệu chưa áp dụng migration danh mục sản phẩm." : message);
    } finally { setBusy(false); }
  }

  return <Page title="Đăng sản phẩm vật tư">
    <SampleNotice>Thông tin do người bán cung cấp chưa được xem là đã xác minh. Sản phẩm phải được duyệt trước khi công khai.</SampleNotice>
    {checking ? <div className="card p-5 text-center">Đang kiểm tra tài khoản…</div> : !email ?
      <section className="card space-y-3 p-5"><h2 className="text-lg font-bold">Cần đăng nhập</h2><Link to="/tai-khoan" className="btn-primary">Đăng nhập / Tạo tài khoản</Link></section> :
      <form className="card space-y-4 p-4 sm:p-6" onSubmit={submit}>
        <p className="text-sm text-muted-foreground">Tài khoản: <strong>{email}</strong></p>
        <label className="block space-y-1"><span className="text-sm font-semibold">Tên sản phẩm *</span><input className="field" required minLength={2} maxLength={180} value={name} onChange={e=>setName(e.target.value)} /></label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1"><span className="text-sm font-semibold">Danh mục</span><select className="field" value={category} onChange={e=>setCategory(e.target.value)}>{CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <label className="block space-y-1"><span className="text-sm font-semibold">Giá bán (VNĐ) *</span><input className="field" required inputMode="numeric" value={price} onChange={e=>setPrice(e.target.value)} placeholder="450000" /></label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1"><span className="text-sm font-semibold">Đơn vị *</span><input className="field" required value={unit} onChange={e=>setUnit(e.target.value)} /></label>
          <label className="block space-y-1"><span className="text-sm font-semibold">Nhà sản xuất theo nhãn</span><input className="field" value={maker} onChange={e=>setMaker(e.target.value)} /></label>
        </div>
        <label className="block space-y-1"><span className="text-sm font-semibold">Số đăng ký / lưu hành (nếu có)</span><input className="field" value={registration} onChange={e=>setRegistration(e.target.value)} /></label>
        <label className="block space-y-1"><span className="text-sm font-semibold">Mô tả</span><textarea className="field min-h-24" maxLength={2000} value={description} onChange={e=>setDescription(e.target.value)} /></label>
        <label className="block space-y-1"><span className="text-sm font-semibold">Tên cửa hàng / người bán *</span><input className="field" required value={seller} onChange={e=>setSeller(e.target.value)} /></label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1"><span className="text-sm font-semibold">Điện thoại *</span><input className="field" type="tel" required value={phone} onChange={e=>setPhone(e.target.value)} /></label>
          <label className="block space-y-1"><span className="text-sm font-semibold">Địa chỉ</span><input className="field" value={address} onChange={e=>setAddress(e.target.value)} /></label>
        </div>
        <label className="block space-y-1"><span className="text-sm font-semibold">Ảnh sản phẩm (không bắt buộc)</span><input type="file" accept="image/*" className="field" onChange={e=>setImage(e.target.files?.[0] ?? null)} /><span className="block text-xs text-muted-foreground">Chỉ tải ảnh bạn có quyền sử dụng, tối đa 5MB.</span></label>
        {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm">{error}</p>}
        {success && <p role="status" className="rounded-lg bg-primary/10 p-3 text-sm">{success}</p>}
        <button className="btn-primary w-full" type="submit" disabled={busy}>{busy ? "Đang gửi…" : "Gửi sản phẩm chờ duyệt"}</button>
      </form>}
  </Page>;
}
