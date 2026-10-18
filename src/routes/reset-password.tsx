import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Page } from "@/components/Layout";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Đặt lại mật khẩu — Chợ Xanh Việt" },
      { name: "description", content: "Đặt mật khẩu mới cho tài khoản Chợ Xanh Việt." },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let active = true;
    // Liên kết trong email mở trang này kèm phiên khôi phục (type=recovery).
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
        setChecking(false);
      }
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      const hash = window.location.hash;
      if (data.session || hash.includes("type=recovery")) {
        setReady(true);
      }
      setChecking(false);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Hai mật khẩu nhập lại không giống nhau.");
      return;
    }
    setBusy(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setDone(true);
      setTimeout(() => void navigate({ to: "/tai-khoan" }), 2500);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không đổi được mật khẩu. Vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page title="Đặt lại mật khẩu">
      <div className="mx-auto w-full max-w-lg">
        {checking ? (
          <div className="card p-6 text-center text-muted-foreground" role="status">Đang kiểm tra liên kết…</div>
        ) : done ? (
          <section className="card space-y-3 p-6 text-center">
            <div className="text-5xl" aria-hidden="true">✅</div>
            <h2 className="text-xl font-bold">Đã đổi mật khẩu</h2>
            <p className="text-sm text-muted-foreground">Đang chuyển về trang tài khoản…</p>
            <Link to="/tai-khoan" className="btn-primary w-full">Về trang tài khoản</Link>
          </section>
        ) : !ready ? (
          <section className="card space-y-3 p-6">
            <h2 className="text-xl font-bold">Liên kết không hợp lệ hoặc đã hết hạn</h2>
            <p className="text-sm text-muted-foreground">Hãy quay lại trang tài khoản, nhập email và bấm "Quên mật khẩu" để nhận liên kết mới.</p>
            <Link to="/tai-khoan" className="btn-primary w-full">Về trang tài khoản</Link>
          </section>
        ) : (
          <section className="card space-y-4 p-5 sm:p-6">
            <h2 className="text-xl font-bold">Chọn mật khẩu mới</h2>
            <form className="space-y-4" onSubmit={(event) => void submit(event)}>
              <div className="space-y-1.5">
                <label htmlFor="new-password" className="text-sm font-semibold">Mật khẩu mới</label>
                <input id="new-password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} className="field" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Ít nhất 8 ký tự" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="confirm-password" className="text-sm font-semibold">Nhập lại mật khẩu mới</label>
                <input id="confirm-password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} className="field" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              </div>
              {error && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">{error}</p>}
              <button type="submit" className="btn-primary w-full" disabled={busy}>{busy ? "Đang lưu…" : "Lưu mật khẩu mới"}</button>
            </form>
          </section>
        )}
      </div>
    </Page>
  );
}
