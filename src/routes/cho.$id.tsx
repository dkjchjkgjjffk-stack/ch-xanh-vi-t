import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LISTINGS, type Listing } from "@/data/sample";
import { supabase } from "@/integrations/supabase/client";
import { Page, SampleNotice } from "@/components/Layout";

function FavoriteButton({ listingId }: { listingId: string }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(async ({ data }) => {
      if (!active || !data.user) return;
      setUserId(data.user.id);
      const { data: fav } = await supabase
        .from("favorites")
        .select("listing_id")
        .eq("user_id", data.user.id)
        .eq("listing_id", listingId)
        .maybeSingle();
      if (active) setSaved(Boolean(fav));
    });
    return () => { active = false; };
  }, [listingId]);

  if (!userId) {
    return <Link to="/tai-khoan" className="btn-outline w-full">♡ Đăng nhập để lưu tin yêu thích</Link>;
  }

  const toggle = async () => {
    setBusy(true);
    try {
      if (saved) {
        const { error } = await supabase.from("favorites").delete().eq("user_id", userId).eq("listing_id", listingId);
        if (error) throw error;
        setSaved(false);
      } else {
        const { error } = await supabase.from("favorites").insert({ user_id: userId, listing_id: listingId });
        if (error) throw error;
        setSaved(true);
      }
    } catch {
      // giữ nguyên trạng thái nếu lỗi
    } finally {
      setBusy(false);
    }
  };

  return (
    <button type="button" onClick={() => void toggle()} disabled={busy} className={saved ? "btn-primary w-full" : "btn-outline w-full"} aria-pressed={saved}>
      {busy ? "Đang lưu…" : saved ? "♥ Đã lưu vào tin yêu thích" : "♡ Lưu tin yêu thích"}
    </button>
  );
}

export const Route = createFileRoute("/cho/$id")({
  loader: async ({ params }) => {
    const sample = LISTINGS.find((x) => x.id === params.id);
    if (sample) return { listing: sample, isSample: true };

    const { data, error } = await supabase
      .from("listings")
      .select("id,type,title,crop,icon,quantity,price_text,province,contact_name,phone,description,image_url,created_at")
      .eq("id", params.id)
      .eq("status", "approved")
      .eq("is_sample", false)
      .maybeSingle();

    if (error || !data) throw notFound();

    let imageUrl: string | null = null;
    if (data.image_url) {
      const { data: signed } = await supabase.storage.from("images").createSignedUrl(data.image_url, 3600);
      imageUrl = signed?.signedUrl ?? null;
    }

    const listing: Listing & { imageUrl?: string | null } = {
      id: data.id,
      type: data.type === "mua" ? "mua" : "ban",
      title: data.title,
      crop: data.crop,
      icon: data.icon || "🌾",
      quantity: data.quantity,
      price: data.price_text,
      province: data.province,
      contactName: data.contact_name,
      phone: data.phone,
      description: data.description,
      postedAt: data.created_at,
      imageUrl,
    };
    return { listing, isSample: false };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.listing.title ?? "Tin đăng"} — Chợ Xanh Việt` },
      { name: "description", content: loaderData ? `${loaderData.listing.crop} · ${loaderData.listing.quantity} · ${loaderData.listing.province}` : "Chi tiết tin đăng" },
      { property: "og:title", content: loaderData?.listing.title ?? "Tin đăng" },
      { property: "og:description", content: loaderData ? `${loaderData.listing.crop} tại ${loaderData.listing.province}` : "Chi tiết tin đăng" },
    ],
  }),
  component: Detail,
});

function Detail() {
  const { listing: l, isSample } = Route.useLoaderData();
  const rows: [string, string][] = [["Loại nông sản", l.crop], ["Số lượng", l.quantity], ["Giá dự kiến", l.price], ["Địa phương", l.province], ["Ngày đăng", new Date(l.postedAt).toLocaleDateString("vi-VN")]];
  return (
    <Page>
      <Link to="/cho" className="font-semibold text-primary">← Chợ nông sản</Link>
      {isSample ? <SampleNotice>Đây là TIN MẪU, số điện thoại không có thật.</SampleNotice> : <p className="rounded-lg bg-success/10 p-3 text-sm text-success">Tin đã được duyệt. Vẫn nên xác minh thông tin và thỏa thuận giao dịch trực tiếp.</p>}
      {"imageUrl" in l && l.imageUrl
        ? <img src={l.imageUrl} alt={`Ảnh minh họa: ${l.title}`} className="card aspect-video w-full object-cover" loading="lazy" />
        : <div className="card flex aspect-video items-center justify-center bg-secondary text-8xl">{l.icon}</div>}
      <span className={`chip ${l.type === "ban" ? "bg-success text-success-foreground" : "bg-warning text-warning-foreground"}`}>{l.type === "ban" ? "Cần bán" : "Cần mua"}</span>
      <h1 className="text-2xl font-bold">{l.title}</h1>
      <dl className="card divide-y">
        {rows.map(([k, v]) => <div key={k} className="flex justify-between gap-3 p-3"><dt className="text-muted-foreground">{k}</dt><dd className="text-right font-semibold">{v}</dd></div>)}
      </dl>
      <p>{l.description}</p>
      <section className="card space-y-2 p-4">
        <h2 className="text-lg font-bold">Liên hệ</h2>
        <p className="font-semibold">{l.contactName}</p>
        <a href={`tel:${l.phone.replace(/\s/g, "")}`} className="btn-primary w-full">📞 Gọi {l.phone}</a>
        <a href={`https://zalo.me/${l.phone.replace(/\s/g, "")}`} target="_blank" rel="noreferrer" className="btn-outline w-full">💬 Nhắn Zalo</a>
      </section>
      {!isSample && <FavoriteButton listingId={l.id} />}
    </Page>
  );
}
