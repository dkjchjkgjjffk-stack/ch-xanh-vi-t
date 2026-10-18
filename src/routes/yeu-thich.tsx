import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Page } from "@/components/Layout";
import { ListingCard } from "@/components/Cards";
import type { Listing } from "@/data/sample";

type FavRow = {
  listing_id: string;
  listings: {
    id: string; type: string; title: string; crop: string; icon: string;
    quantity: string; price_text: string; province: string; contact_name: string;
    phone: string; description: string; status: string; created_at: string;
  } | null;
};

export const Route = createFileRoute("/yeu-thich")({
  head: () => ({
    meta: [
      { title: "Tin yêu thích — Chợ Xanh Việt" },
      { name: "description", content: "Các tin nông sản bạn đã lưu để xem lại." },
    ],
  }),
  component: Favorites,
});

function Favorites() {
  const [checking, setChecking] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [items, setItems] = useState<Listing[]>([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!userData.user) {
      setSignedIn(false);
      setItems([]);
      return;
    }
    setSignedIn(true);
    const { data, error: queryError } = await supabase
      .from("favorites")
      .select("listing_id, listings(id,type,title,crop,icon,quantity,price_text,province,contact_name,phone,description,status,created_at)")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false });
    if (queryError) throw queryError;
    const rows = (data ?? []) as unknown as FavRow[];
    setItems(rows
      .filter((row) => row.listings && row.listings.status === "approved")
      .map((row) => ({
        id: row.listings!.id,
        type: row.listings!.type === "mua" ? "mua" : "ban",
        title: row.listings!.title,
        crop: row.listings!.crop,
        icon: row.listings!.icon || "🌾",
        quantity: row.listings!.quantity,
        price: row.listings!.price_text,
        province: row.listings!.province,
        contactName: row.listings!.contact_name,
        phone: row.listings!.phone,
        description: row.listings!.description,
        postedAt: row.listings!.created_at,
      })));
  }, []);

  useEffect(() => {
    let active = true;
    void load()
      .catch((caught) => { if (active) setError(caught instanceof Error ? caught.message : "Không tải được tin yêu thích."); })
      .finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, [load]);

  const remove = async (listingId: string) => {
    setBusyId(listingId);
    setError("");
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Bạn cần đăng nhập lại.");
      const { error: deleteError } = await supabase.from("favorites").delete().eq("user_id", userData.user.id).eq("listing_id", listingId);
      if (deleteError) throw deleteError;
      setItems((current) => current.filter((item) => item.id !== listingId));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không bỏ lưu được tin.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Page title="Tin yêu thích">
      {checking ? <div className="card p-5 text-center" role="status">Đang tải tin yêu thích…</div> : !signedIn ? (
        <section className="card space-y-3 p-5">
          <h2 className="text-lg font-bold">Đăng nhập để xem tin đã lưu</h2>
          <p className="text-sm text-muted-foreground">Tin yêu thích được gắn với tài khoản của bạn.</p>
          <Link to="/tai-khoan" className="btn-primary">Đăng nhập / Tạo tài khoản</Link>
        </section>
      ) : (
        <>
          {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          {items.length === 0 ? (
            <div className="card space-y-3 p-6 text-center">
              <div className="text-5xl" aria-hidden="true">♡</div>
              <p className="font-semibold">Bạn chưa lưu tin nào</p>
              <p className="text-sm text-muted-foreground">Mở một tin trong chợ nông sản và bấm "Lưu tin yêu thích".</p>
              <Link to="/cho" className="btn-primary">Đi đến chợ nông sản</Link>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {items.map((listing) => (
                <div key={listing.id} className="space-y-1">
                  <ListingCard l={listing} />
                  <button type="button" className="btn-outline w-full" disabled={busyId === listing.id} onClick={() => void remove(listing.id)}>
                    {busyId === listing.id ? "Đang bỏ lưu…" : "Bỏ lưu tin này"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </Page>
  );
}
