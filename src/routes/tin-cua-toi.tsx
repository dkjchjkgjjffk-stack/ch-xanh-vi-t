import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Page } from "@/components/Layout";

type OwnListing = {
  id: string;
  title: string;
  crop: string;
  type: string;
  quantity: string;
  price_text: string;
  province: string;
  status: string;
  created_at: string;
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Đang chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Chưa được duyệt",
};

export const Route = createFileRoute("/tin-cua-toi")({
  head: () => ({
    meta: [
      { title: "Tin đăng của tôi — Chợ Xanh Việt" },
      { name: "description", content: "Xem trạng thái các tin nông sản đã gửi." },
    ],
  }),
  component: MyListings,
});

function MyListings() {
  const [checking, setChecking] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [rows, setRows] = useState<OwnListing[]>([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!userData.user) {
      setSignedIn(false);
      setRows([]);
      return;
    }
    setSignedIn(true);
    const { data, error: queryError } = await supabase
      .from("listings")
      .select("id,title,crop,type,quantity,price_text,province,status,created_at")
      .eq("user_id", userData.user.id)
      .eq("is_sample", false)
      .order("created_at", { ascending: false });
    if (queryError) throw queryError;
    setRows(data ?? []);
  }, []);

  useEffect(() => {
    let active = true;
    void load()
      .catch((caught) => { if (active) setError(caught instanceof Error ? caught.message : "Không tải được tin đăng."); })
      .finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, [load]);

  const removePending = async (id: string) => {
    setBusyId(id);
    setError("");
    try {
      const { error: deleteError } = await supabase.from("listings").delete().eq("id", id).eq("status", "pending");
      if (deleteError) throw deleteError;
      setRows((current) => current.filter((row) => row.id !== id));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không xóa được tin.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Page title="Tin đăng của tôi">
      {checking ? <div className="card p-5 text-center" role="status">Đang tải tin đăng…</div> : !signedIn ? (
        <section className="card space-y-3 p-5">
          <h2 className="text-lg font-bold">Đăng nhập để xem tin của bạn</h2>
          <p className="text-sm text-muted-foreground">Các tin đăng được gắn với tài khoản đã gửi.</p>
          <Link to="/tai-khoan" className="btn-primary">Đăng nhập / Tạo tài khoản</Link>
        </section>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">Tin chờ duyệt chưa hiển thị công khai. Sau khi quản trị viên duyệt, tin sẽ xuất hiện trong chợ nông sản.</p>
          {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          {rows.length === 0 ? <div className="card space-y-3 p-6 text-center"><p className="font-semibold">Bạn chưa có tin đăng nào</p><Link to="/dang-tin" className="btn-primary">Đăng tin đầu tiên</Link></div> : (
            <div className="space-y-3">
              {rows.map((row) => (
                <article key={row.id} className="card space-y-3 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className={row.status === "approved" ? "chip bg-success text-success-foreground" : row.status === "pending" ? "chip bg-warning text-warning-foreground" : "chip bg-secondary"}>{STATUS_LABEL[row.status] ?? "Đang xử lý"}</span>
                    <span className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleDateString("vi-VN")}</span>
                  </div>
                  <h2 className="font-bold">{row.title}</h2>
                  <p className="text-sm text-muted-foreground">{row.type === "mua" ? "Cần mua" : "Cần bán"} · {row.crop} · {row.quantity} · {row.province}</p>
                  <p className="text-sm font-semibold">{row.price_text}</p>
                  {row.status === "approved" && <Link to="/cho/$id" params={{ id: row.id }} className="inline-block text-sm font-semibold text-primary underline">Xem tin công khai</Link>}
                  {row.status === "pending" && <button type="button" className="btn-outline w-full" disabled={busyId === row.id} onClick={() => void removePending(row.id)}>{busyId === row.id ? "Đang xóa…" : "Hủy tin đang chờ duyệt"}</button>}
                </article>
              ))}
            </div>
          )}
          <Link to="/dang-tin" className="btn-primary w-full">＋ Đăng tin mới</Link>
        </>
      )}
    </Page>
  );
}
