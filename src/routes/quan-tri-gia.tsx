import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { PROVINCES } from "@/data/sample";
import { Page, SampleNotice } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";

type CropPrice = {
  id: string;
  crop: string;
  unit: string;
  province: string;
  price: number;
  price_date: string;
  source: string;
};

export const Route = createFileRoute("/quan-tri-gia")({
  head: () => ({
    meta: [
      { title: "Quản lý bảng giá nông sản — Chợ Xanh Việt" },
      { name: "description", content: "Quản trị giá nông sản kèm ngày cập nhật và nguồn tham khảo." },
    ],
  }),
  component: PriceAdmin,
});

function today() {
  return new Date().toISOString().slice(0, 10);
}

function PriceAdmin() {
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [userId, setUserId] = useState("");
  const [rows, setRows] = useState<CropPrice[]>([]);
  const [crop, setCrop] = useState("");
  const [province, setProvince] = useState("Gia Lai");
  const [unit, setUnit] = useState("kg");
  const [price, setPrice] = useState("");
  const [priceDate, setPriceDate] = useState(today());
  const [source, setSource] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadPrices = useCallback(async () => {
    const { data, error: queryError } = await supabase
      .from("prices")
      .select("id,crop,unit,province,price,price_date,source")
      .order("price_date", { ascending: false })
      .order("province", { ascending: true })
      .limit(200);
    if (queryError) throw queryError;
    setRows((data ?? []) as CropPrice[]);
  }, []);

  useEffect(() => {
    let active = true;
    const check = async () => {
      try {
        const { data, error: authError } = await supabase.auth.getUser();
        if (authError || !data.user) return;
        const { data: isAdmin, error: roleError } = await supabase.rpc("has_role", {
          _user_id: data.user.id,
          _role: "admin",
        });
        if (roleError) throw roleError;
        if (!active) return;
        setUserId(data.user.id);
        setAuthorized(Boolean(isAdmin));
        if (isAdmin) await loadPrices();
      } catch (caught) {
        if (active) setError(caught instanceof Error ? caught.message : "Không thể tải dữ liệu quản trị.");
      } finally {
        if (active) setChecking(false);
      }
    };
    void check();
    return () => { active = false; };
  }, [loadPrices]);

  const savePrice = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");
    const amount = Number(price);
    if (!crop.trim() || crop.trim().length > 100) {
      setError("Tên nông sản phải có từ 1 đến 100 ký tự.");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Giá phải là số lớn hơn 0.");
      return;
    }
    if (source.trim().length < 3 || source.trim().length > 500) {
      setError("Hãy ghi rõ nguồn tham khảo (3–500 ký tự).");
      return;
    }
    if (!priceDate || priceDate > today()) {
      setError("Ngày giá không được để trống hoặc nằm trong tương lai.");
      return;
    }

    setBusy(true);
    try {
      const { error: saveError } = await supabase.from("prices").upsert({
        crop: crop.trim(),
        province,
        unit: unit.trim(),
        price: amount,
        price_date: priceDate,
        source: source.trim(),
        updated_by: userId,
      }, { onConflict: "crop,province,price_date" });
      if (saveError) throw saveError;
      setNotice("Đã lưu giá. Bảng giá công khai sẽ hiển thị giá này cùng ngày và nguồn tham khảo.");
      setPrice("");
      setSource("");
      await loadPrices();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không lưu được giá. Hãy kiểm tra migration và quyền quản trị.");
    } finally {
      setBusy(false);
    }
  };

  const deletePrice = async (id: string) => {
    if (!window.confirm("Xóa dòng giá này khỏi bảng giá công khai?")) return;
    setError("");
    setNotice("");
    try {
      const { error: deleteError } = await supabase.from("prices").delete().eq("id", id);
      if (deleteError) throw deleteError;
      setRows((current) => current.filter((row) => row.id !== id));
      setNotice("Đã xóa dòng giá.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không xóa được dòng giá.");
    }
  };

  return (
    <Page title="Quản trị · Bảng giá">
      <SampleNotice>Hệ thống tự đồng bộ giá cà phê và hồ tiêu mỗi ngày lúc 08:00 (giờ Việt Nam) từ Giacaphe.com và Giatieu.com. Quản trị viên vẫn có thể bổ sung mặt hàng khác bằng nguồn và ngày giá đã xác minh; không nhập giá ước đoán.</SampleNotice>
      {checking ? <div className="card p-5 text-center" role="status">Đang kiểm tra quyền truy cập…</div> : !authorized ? (
        <section className="card space-y-3 p-5">
          <h2 className="text-lg font-bold">Không có quyền quản trị</h2>
          <p className="text-sm text-muted-foreground">Hãy đăng nhập bằng tài khoản đã được cấp vai trò admin ở Supabase.</p>
          <Link to="/tai-khoan" className="btn-primary">Đến trang tài khoản</Link>
        </section>
      ) : (
        <>
          {error && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">{error}</p>}
          {notice && <p className="rounded-lg bg-primary/10 p-3 text-sm" role="status">{notice}</p>}
          <form className="card space-y-4 p-4" onSubmit={savePrice}>
            <h2 className="text-lg font-bold">Thêm hoặc cập nhật giá</h2>
            <label className="block space-y-1"><span className="text-sm font-semibold">Tên nông sản *</span><input className="field" required maxLength={100} value={crop} onChange={(e) => setCrop(e.target.value)} placeholder="Ví dụ: Cà phê nhân xô" /></label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block space-y-1"><span className="text-sm font-semibold">Địa phương *</span><select className="field" value={province} onChange={(e) => setProvince(e.target.value)}>{Array.from(new Set([...PROVINCES, province])).sort((a, b) => a.localeCompare(b, "vi")).map((p) => <option key={p} value={p}>{p}</option>)}</select></label>
              <label className="block space-y-1"><span className="text-sm font-semibold">Đơn vị *</span><input className="field" required maxLength={30} value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="kg, tấn, trái…" /></label>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block space-y-1"><span className="text-sm font-semibold">Giá (VNĐ) *</span><input className="field" required type="number" min="1" step="any" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Ví dụ: 125000" /></label>
              <label className="block space-y-1"><span className="text-sm font-semibold">Ngày giá *</span><input className="field" required type="date" max={today()} value={priceDate} onChange={(e) => setPriceDate(e.target.value)} /></label>
            </div>
            <label className="block space-y-1"><span className="text-sm font-semibold">Nguồn tham khảo *</span><textarea className="field min-h-24" required minLength={3} maxLength={500} value={source} onChange={(e) => setSource(e.target.value)} placeholder="Tên đơn vị, website, bản tin hoặc liên hệ xác nhận và thời điểm lấy giá…" /></label>
            <p className="text-xs text-muted-foreground">Nếu cùng nông sản, địa phương và ngày đã có giá, hệ thống sẽ cập nhật dòng đó thay vì tạo bản ghi trùng.</p>
            <button className="btn-primary w-full" type="submit" disabled={busy}>{busy ? "Đang lưu…" : "Lưu giá và nguồn"}</button>
          </form>
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-bold">Giá đã đăng</h2><button type="button" className="btn-outline" onClick={() => void loadPrices().catch((caught) => setError(caught instanceof Error ? caught.message : "Không tải được giá."))}>Làm mới</button></div>
            {rows.length === 0 ? <div className="card p-5 text-center text-sm text-muted-foreground">Chưa có dòng giá nào.</div> : rows.map((row) => (
              <article key={row.id} className="card flex items-start justify-between gap-3 p-3">
                <div className="min-w-0 space-y-1"><h3 className="font-semibold">{row.crop} · {row.province}</h3><p className="font-bold text-primary">{Number(row.price).toLocaleString("vi-VN")} đ/{row.unit}</p><p className="text-xs text-muted-foreground">Ngày: {row.price_date} · Nguồn: {(() => { const match = row.source.match(/https?:\/\/[^\s]+/); const sourceName = row.source.split(" — ")[0]; return match ? <a className="underline underline-offset-2" href={match[0]} target="_blank" rel="noreferrer">{sourceName}</a> : row.source; })()}</p></div>
                <button type="button" className="btn-outline shrink-0" onClick={() => void deletePrice(row.id)}>Xóa</button>
              </article>
            ))}
          </section>
          <Link to="/bang-gia" className="btn-outline">Xem bảng giá công khai</Link>
        </>
      )}
    </Page>
  );
}
