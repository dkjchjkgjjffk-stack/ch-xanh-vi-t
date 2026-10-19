import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CROPS, PROVINCES } from "@/data/sample";
import { Page, SampleNotice } from "@/components/Layout";

export const Route = createFileRoute("/dang-tin")({
  head: () => ({
    meta: [
      { title: "Đăng tin nông sản — Chợ Xanh Việt" },
      { name: "description", content: "Đăng nhu cầu bán nông sản hoặc thu mua nông sản trên Chợ Xanh Việt." },
    ],
  }),
  component: CreateListing,
});

function CreateListing() {
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [type, setType] = useState<"ban" | "mua">("ban");
  const [title, setTitle] = useState("");
  const [crop, setCrop] = useState<string>(CROPS[0] ?? "Lúa gạo");
  const [quantity, setQuantity] = useState("");
  const [priceText, setPriceText] = useState("Thương lượng");
  const [province, setProvince] = useState("Gia Lai");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(({ data, error: authError }) => {
      if (!active) return;
      if (authError) setError("Chưa kiểm tra được tài khoản. Vui lòng tải lại trang.");
      setEmail(data.user?.email ?? null);
      setChecking(false);
    }).catch(() => {
      if (active) {
        setError("Không kết nối được dịch vụ tài khoản. Vui lòng thử lại sau.");
        setChecking(false);
      }
    });
    return () => { active = false; };
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        setError("Bạn cần đăng nhập trước khi đăng tin.");
        return;
      }

      const cleanPhone = phone.trim();
      if (!/^[+0-9().\s-]{9,20}$/.test(cleanPhone)) {
        setError("Vui lòng nhập số điện thoại liên hệ hợp lệ.");
        return;
      }

      let imagePath: string | null = null;
      if (image) {
        if (image.size > 5 * 1024 * 1024) {
          setError("Ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 5MB.");
          return;
        }
        const ext = (image.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
        imagePath = `${authData.user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("images").upload(imagePath, image, image.type ? { contentType: image.type } : undefined);
        if (uploadError) throw uploadError;
      }

      const { error: insertError } = await supabase.from("listings").insert({
        image_url: imagePath,
        user_id: authData.user.id,
        type,
        title: title.trim(),
        crop,
        quantity: quantity.trim(),
        price_text: priceText.trim() || "Thương lượng",
        province,
        contact_name: contactName.trim(),
        phone: cleanPhone,
        description: description.trim(),
        icon: type === "ban" ? "🌾" : "🤝",
        is_sample: false,
        status: "pending",
      });
      if (insertError) throw insertError;
      setSuccess("Đã gửi tin thành công. Tin đang chờ kiểm duyệt và chưa hiển thị công khai.");
      setTitle("");
      setQuantity("");
      setPriceText("Thương lượng");
      setContactName("");
      setPhone("");
      setDescription("");
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Không gửi được tin. Vui lòng thử lại.";
      setError(message.includes("relation") || message.includes("schema cache")
        ? "Cơ sở dữ liệu chưa được thiết lập đầy đủ. Quản trị viên cần áp dụng các migration trong thư mục supabase/migrations của dự án."
        : message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Page title="Đăng tin nông sản">
      <SampleNotice>Chỉ gửi thông tin thật mà bạn có quyền đăng. Tin mới sẽ chờ kiểm duyệt trước khi hiển thị công khai.</SampleNotice>
      {checking ? (
        <div className="card p-5 text-center text-muted-foreground" role="status">Đang kiểm tra tài khoản…</div>
      ) : !email ? (
        <section className="card space-y-3 p-5">
          <h2 className="text-lg font-bold">Bạn cần đăng nhập trước</h2>
          <p className="text-sm text-muted-foreground">Đăng nhập để gắn tin đăng với tài khoản của bạn và có thể quản lý tin sau này.</p>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Link to="/tai-khoan" className="btn-primary w-full">Đăng nhập / Tạo tài khoản</Link>
        </section>
      ) : (
        <form className="card space-y-4 p-4 sm:p-6" onSubmit={(event) => void submit(event)}>
          <p className="text-sm text-muted-foreground">Đang đăng bằng tài khoản <strong className="break-all text-foreground">{email}</strong></p>
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-secondary p-1">
            <button type="button" className={type === "ban" ? "btn-primary" : "rounded-lg px-3 py-2 font-semibold"} aria-pressed={type === "ban"} onClick={() => setType("ban")}>Tôi cần bán</button>
            <button type="button" className={type === "mua" ? "btn-primary" : "rounded-lg px-3 py-2 font-semibold"} aria-pressed={type === "mua"} onClick={() => setType("mua")}>Tôi cần mua</button>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="listing-title" className="text-sm font-semibold">Tiêu đề tin *</label>
            <input id="listing-title" className="field" required minLength={5} maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={type === "ban" ? "Ví dụ: Bán cà phê nhân tại vườn" : "Ví dụ: Cần thu mua cà phê nhân"} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="listing-crop" className="text-sm font-semibold">Nông sản *</label>
              <select id="listing-crop" className="field" value={crop} onChange={(e) => setCrop(e.target.value)}>{CROPS.map((item) => <option key={item}>{item}</option>)}</select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="listing-province" className="text-sm font-semibold">Tỉnh / thành *</label>
              <select id="listing-province" className="field" value={province} onChange={(e) => setProvince(e.target.value)}>{PROVINCES.map((item) => <option key={item}>{item}</option>)}</select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="listing-quantity" className="text-sm font-semibold">Số lượng *</label>
              <input id="listing-quantity" className="field" required maxLength={80} value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Ví dụ: 5 tấn" />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="listing-price" className="text-sm font-semibold">Giá dự kiến</label>
              <input id="listing-price" className="field" maxLength={100} value={priceText} onChange={(e) => setPriceText(e.target.value)} placeholder="Giá/kg hoặc thương lượng" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="listing-contact" className="text-sm font-semibold">Tên liên hệ *</label>
              <input id="listing-contact" className="field" required minLength={2} maxLength={80} value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Tên của bạn hoặc cơ sở" />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="listing-phone" className="text-sm font-semibold">Số điện thoại *</label>
              <input id="listing-phone" className="field" type="tel" autoComplete="tel" required maxLength={20} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Số để người mua liên hệ" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="listing-description" className="text-sm font-semibold">Mô tả thêm</label>
            <textarea id="listing-description" className="field min-h-28" maxLength={2000} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Mùa vụ, chất lượng, hình thức giao nhận, khu vực cụ thể…" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="listing-image" className="text-sm font-semibold">Ảnh minh họa (không bắt buộc)</label>
            <input id="listing-image" type="file" accept="image/*" className="field" onChange={(e) => setImage(e.target.files?.[0] ?? null)} />
            <p className="text-xs text-muted-foreground">Chỉ tải ảnh bạn có quyền sử dụng, tối đa 5MB.</p>
          </div>
          {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          {success && <p role="status" className="rounded-lg bg-primary/10 p-3 text-sm">{success}</p>}
          <button type="submit" className="btn-primary w-full" disabled={submitting}>{submitting ? "Đang gửi tin…" : "Gửi tin chờ duyệt"}</button>
          <p className="text-xs leading-relaxed text-muted-foreground">Chỉ đăng thông tin có thật. Không đăng số điện thoại của người khác khi chưa được đồng ý. Tin chưa được duyệt sẽ không hiển thị cho khách khác.</p>
        </form>
      )}
    </Page>
  );
}
