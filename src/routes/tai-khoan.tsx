import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Page } from "@/components/Layout";

export const Route = createFileRoute("/tai-khoan")({
  head: () => ({
    meta: [
      { title: "Tài khoản — Chợ Xanh Việt" },
      { name: "description", content: "Đăng nhập hoặc tạo tài khoản Chợ Xanh Việt." },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [configured, setConfigured] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initialize = async () => {
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        setSession(data.session);
        const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
          setSession(nextSession);
        });
        unsubscribe = () => listener.subscription.unsubscribe();
      } catch {
        setConfigured(false);
      } finally {
        setLoading(false);
      }
    };

    void initialize();
    return () => unsubscribe?.();
  }, []);

  useEffect(() => {
    let active = true;
    if (!session) {
      setIsAdmin(false);
      return () => { active = false; };
    }
    const checkRole = async () => {
      try {
        const { data } = await supabase.rpc("has_role", { _user_id: session.user.id, _role: "admin" });
        if (active) setIsAdmin(Boolean(data));
      } catch {
        if (active) setIsAdmin(false);
      }
    };
    void checkRole();
    return () => { active = false; };
  }, [session]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setSubmitting(true);

    try {
      if (!configured) {
        throw new Error("Website chưa được cấu hình kết nối Supabase. Chủ website cần thiết lập biến môi trường trước khi đăng nhập.");
      }

      if (mode === "login") {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (authError) throw authError;
        setNotice("Đăng nhập thành công.");
      } else {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (authError) throw authError;
        if (data.session) {
          setNotice("Tạo tài khoản thành công.");
        } else {
          setNotice("Đã gửi yêu cầu đăng ký. Nếu hệ thống yêu cầu xác nhận email, hãy mở thư xác nhận trước khi đăng nhập.");
        }
      }
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Không thể thực hiện yêu cầu. Vui lòng thử lại.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const sendReset = async () => {
    setError("");
    setNotice("");
    if (!email.trim()) {
      setError("Nhập email của bạn vào ô Email rồi bấm lại nút Quên mật khẩu.");
      return;
    }
    setSubmitting(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) throw resetError;
      setNotice("Đã gửi email đặt lại mật khẩu. Hãy mở thư và bấm liên kết trong thư.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không gửi được email đặt lại mật khẩu. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const signOut = async () => {
    setError("");
    setNotice("");
    try {
      const { error: authError } = await supabase.auth.signOut();
      if (authError) throw authError;
      setSession(null);
      setNotice("Bạn đã đăng xuất.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể đăng xuất. Vui lòng thử lại.");
    }
  };

  return (
    <Page title="Tài khoản Chợ Xanh Việt">
      <div className="mx-auto w-full max-w-lg space-y-4">
        {loading ? (
          <div className="card p-6 text-center text-muted-foreground" role="status">Đang kiểm tra phiên đăng nhập…</div>
        ) : session ? (
          <section className="card space-y-4 p-5">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-2xl" aria-hidden="true">👤</div>
            <h2 className="text-xl font-bold">Bạn đã đăng nhập</h2>
            <p className="text-sm text-muted-foreground">Tài khoản: <strong className="break-all text-foreground">{session.user.email}</strong></p>
            <p className="text-sm text-muted-foreground">Bạn có thể quản lý trạng thái tin nông sản đã gửi. Tin mới cần chờ quản trị viên duyệt trước khi công khai.</p>
            <Link to="/tin-cua-toi" className="btn-primary w-full">Tin đăng của tôi</Link>
            <Link to="/dang-tin" className="btn-outline w-full">＋ Đăng tin nông sản</Link>
            <Link to="/dang-san-pham" className="btn-outline w-full">＋ Đăng sản phẩm vật tư</Link>
            {isAdmin && <Link to="/quan-tri-san-pham" className="btn-outline w-full">Duyệt sản phẩm vật tư</Link>}
            {isAdmin && <Link to="/quan-tri" className="btn-outline w-full">Khu vực quản trị · Duyệt tin</Link>}
            {isAdmin && <Link to="/quan-tri-gia" className="btn-outline w-full">Quản lý bảng giá nông sản</Link>}
            <button type="button" onClick={() => void signOut()} className="btn-outline w-full" disabled={submitting}>Đăng xuất</button>
          </section>
        ) : (
          <section className="card space-y-4 p-4 sm:p-6">
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-secondary p-1">
              <button type="button" onClick={() => { setMode("login"); setError(""); setNotice(""); }} className={mode === "login" ? "btn-primary" : "rounded-lg px-3 py-2 font-semibold"} aria-pressed={mode === "login"}>Đăng nhập</button>
              <button type="button" onClick={() => { setMode("signup"); setError(""); setNotice(""); }} className={mode === "signup" ? "btn-primary" : "rounded-lg px-3 py-2 font-semibold"} aria-pressed={mode === "signup"}>Tạo tài khoản</button>
            </div>

            <div>
              <h2 className="text-xl font-bold">{mode === "login" ? "Chào mừng bạn trở lại" : "Tham gia Chợ Xanh Việt"}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{mode === "login" ? "Đăng nhập để tiếp tục sử dụng tài khoản." : "Dùng email của bạn để tạo tài khoản."}</p>
            </div>

            {!configured && (
              <div className="rounded-xl border border-warning-foreground/30 bg-warning p-3 text-sm text-warning-foreground" role="status">
                Chưa kết nối được Supabase. Biểu mẫu đã sẵn sàng, nhưng đăng nhập chỉ hoạt động sau khi chủ dự án cấu hình URL và publishable key của Supabase.
              </div>
            )}

            <form className="space-y-4" onSubmit={(event) => void submit(event)}>
              <div className="space-y-1.5">
                <label htmlFor="account-email" className="text-sm font-semibold">Email</label>
                <input id="account-email" type="email" autoComplete="email" required maxLength={254} className="field" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="ban@example.com" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="account-password" className="text-sm font-semibold">Mật khẩu</label>
                <input id="account-password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={8} maxLength={128} className="field" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Ít nhất 8 ký tự" />
              </div>

              {error && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">{error}</p>}
              {notice && <p className="rounded-lg bg-primary/10 p-3 text-sm text-foreground" role="status">{notice}</p>}

              <button type="submit" className="btn-primary w-full" disabled={submitting || loading}>
                {submitting ? "Đang xử lý…" : mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}
              </button>
              {mode === "login" && (
                <button type="button" onClick={() => void sendReset()} disabled={submitting} className="w-full text-center text-sm font-semibold text-primary underline underline-offset-4">
                  Quên mật khẩu? Gửi email đặt lại
                </button>
              )}
            </form>

            <p className="text-xs leading-relaxed text-muted-foreground">Không chia sẻ mật khẩu với người khác. Chợ Xanh Việt không yêu cầu bạn gửi mật khẩu qua điện thoại hoặc tin nhắn.</p>
          </section>
        )}
      </div>
    </Page>
  );
}
