const GRAPH_VERSION = "v26.0";
const STATE_TTL = 600;
const SESSION_TTL = 600;
const PAGE_TOKEN_KEY = "facebook-page-connection";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });
}
function html(body, status = 200) {
  return new Response(`<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Chợ Xanh Việt · Facebook</title><body style="font:16px system-ui;max-width:680px;margin:40px auto;padding:0 18px;color:#17351f">${body}</body></html>`, {
    status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" }
  });
}
function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0; for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
function randomHex(bytes = 24) {
  const a = crypto.getRandomValues(new Uint8Array(bytes));
  return [...a].map(x => x.toString(16).padStart(2, "0")).join("");
}
async function sign(value, secret) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)));
  return [...sig].map(x => x.toString(16).padStart(2, "0")).join("");
}
function cookieValue(request, name) {
  const cookie = request.headers.get("cookie") || "";
  const found = cookie.split(";").map(v => v.trim()).find(v => v.startsWith(name + "="));
  return found ? found.slice(name.length + 1) : "";
}
function pageShell(message) {
  return html(`<h1>Chợ Xanh Việt — Kết nối Facebook</h1><p>${message}</p><p>Đóng trang này sau khi hoàn tất.</p>`);
}
async function graph(path, params = {}) {
  const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) throw new Error(data.error?.message || "Meta Graph API request failed");
  return data;
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/health") {
      return json({ ok: true, service: "facebook-page-bridge", oauthConfigured: !!(env.META_APP_ID && env.META_APP_SECRET), storageConfigured: !!env.FB_BRIDGE_KV });
    }
    if (request.method === "GET" && url.pathname === "/oauth/start") {
      if (!env.META_APP_ID || !env.META_APP_SECRET || !env.BRIDGE_SECRET || !env.FB_BRIDGE_KV) {
        return json({ error: "Missing META_APP_ID, META_APP_SECRET, BRIDGE_SECRET, or FB_BRIDGE_KV configuration" }, 503);
      }
      const state = randomHex();
      const signed = state + "." + await sign(state, env.BRIDGE_SECRET);
      await env.FB_BRIDGE_KV.put("oauth-state:" + state, "pending", { expirationTtl: STATE_TTL });
      const redirectUri = new URL("/oauth/callback", url.origin).toString();
      const auth = new URL("https://www.facebook.com/" + GRAPH_VERSION + "/dialog/oauth");
      auth.searchParams.set("client_id", env.META_APP_ID);
      auth.searchParams.set("redirect_uri", redirectUri);
      auth.searchParams.set("state", state);
      auth.searchParams.set("response_type", "code");
      auth.searchParams.set("scope", "pages_show_list,pages_manage_posts,pages_read_engagement");
      return new Response(null, { status: 302, headers: { location: auth.toString(), "set-cookie": "fb_oauth_state=" + encodeURIComponent(signed) + "; Max-Age=600; Path=/oauth/callback; Secure; HttpOnly; SameSite=Lax", "cache-control": "no-store" } });
    }
    if (request.method === "GET" && url.pathname === "/oauth/callback") {
      if (url.searchParams.get("error")) return pageShell("Facebook đã hủy hoặc từ chối quyền truy cập. Quay lại và thử lại nếu muốn.");
      const state = url.searchParams.get("state") || "";
      const cookie = decodeURIComponent(cookieValue(request, "fb_oauth_state"));
      const parts = cookie.split(".");
      if (!state || parts.length !== 2 || !safeEqual(parts[0], state) || !safeEqual(parts[1], await sign(state, env.BRIDGE_SECRET || ""))) return json({ error: "OAuth state không hợp lệ hoặc đã hết hạn. Hãy chạy /oauth/start lại." }, 400);
      const used = await env.FB_BRIDGE_KV?.get("oauth-state:" + state);
      if (used !== "pending") return json({ error: "OAuth state đã hết hạn hoặc đã dùng." }, 400);
      await env.FB_BRIDGE_KV.delete("oauth-state:" + state);
      const code = url.searchParams.get("code");
      if (!code || !env.META_APP_ID || !env.META_APP_SECRET || !env.FB_BRIDGE_KV) return json({ error: "Thiếu code hoặc cấu hình OAuth." }, 400);
      const redirectUri = new URL("/oauth/callback", url.origin).toString();
      try {
        const short = await graph("oauth/access_token", { client_id: env.META_APP_ID, client_secret: env.META_APP_SECRET, redirect_uri: redirectUri, code });
        const long = await graph("oauth/access_token", { grant_type: "fb_exchange_token", client_id: env.META_APP_ID, client_secret: env.META_APP_SECRET, fb_exchange_token: short.access_token });
        const pages = await graph("me/accounts", { fields: "id,name,access_token,tasks", access_token: long.access_token });
        const usable = (pages.data || []).filter(p => p.id && p.access_token && (p.tasks || []).some(t => ["CREATE_CONTENT", "MANAGE"].includes(t)));
        if (!usable.length) return pageShell("Không tìm thấy Trang mà tài khoản của mày có quyền đăng bài. Hãy kiểm tra vai trò và quyền pages_manage_posts trong Meta.");
        const session = randomHex(24);
        await env.FB_BRIDGE_KV.put("oauth-session:" + session, JSON.stringify(usable.map(p => ({ id: p.id, name: p.name, token: p.access_token }))), { expirationTtl: SESSION_TTL });
        const options = usable.map(p => `<label style="display:block;padding:12px;border:1px solid #ddd;border-radius:8px;margin:10px 0"><input type="radio" name="pageId" value="${p.id}" required> <strong>${p.name || "Facebook Page"}</strong></label>`).join("");
        return html(`<h1>Chọn Trang Facebook</h1><p>Chọn đúng Trang mà mày muốn Chợ Xanh Việt đăng bài.</p><form method="post" action="/oauth/select"><input type="hidden" name="session" value="${session}">${options}<button style="padding:12px 18px;background:#1877f2;color:white;border:0;border-radius:8px">Kết nối Trang này</button></form>`);
      } catch (e) { return pageShell("Kết nối chưa thành công: " + String(e.message || "Lỗi Meta API").slice(0, 300)); }
    }
    if (request.method === "POST" && url.pathname === "/oauth/select") {
      if (!env.FB_BRIDGE_KV || !env.BRIDGE_SECRET) return json({ error: "Thiếu cấu hình lưu trữ." }, 503);
      const form = await request.formData();
      const session = String(form.get("session") || "");
      const pageId = String(form.get("pageId") || "");
      if (!/^[a-f0-9]{48}$/.test(session) || !/^\d+$/.test(pageId)) return json({ error: "Lựa chọn không hợp lệ." }, 400);
      const raw = await env.FB_BRIDGE_KV.get("oauth-session:" + session);
      if (!raw) return json({ error: "Phiên chọn Trang đã hết hạn. Chạy /oauth/start lại." }, 400);
      const pages = JSON.parse(raw);
      const page = pages.find(p => p.id === pageId);
      if (!page) return json({ error: "Trang không nằm trong danh sách được cấp quyền." }, 400);
      await env.FB_BRIDGE_KV.put(PAGE_TOKEN_KEY, JSON.stringify({ id: page.id, name: page.name, token: page.token, connectedAt: new Date().toISOString() }));
      await env.FB_BRIDGE_KV.delete("oauth-session:" + session);
      return pageShell("Đã kết nối Trang “" + String(page.name).replace(/[<>&"]/g, "") + "”. Cầu nối đã lưu token ở Cloudflare KV. Chưa tự đăng bài nào.");
    }
    if (request.method === "POST" && url.pathname === "/publish") {
      const auth = request.headers.get("authorization") || "";
      const supplied = auth.startsWith("Bearer ") ? auth.slice(7) : "";
      if (!env.BRIDGE_SECRET || !safeEqual(supplied, env.BRIDGE_SECRET)) return json({ error: "Unauthorized" }, 401);
      let body;
      try { body = await request.json(); } catch { return json({ error: "Body must be valid JSON" }, 400); }
      const message = typeof body.message === "string" ? body.message.trim() : "";
      const link = typeof body.link === "string" ? body.link.trim() : "";
      if (!message) return json({ error: "message is required" }, 400);
      if (message.length > 60000) return json({ error: "message is too long" }, 400);
      if (link && !/^https:\/\//i.test(link)) return json({ error: "link must use HTTPS" }, 400);
      const saved = await env.FB_BRIDGE_KV?.get(PAGE_TOKEN_KEY);
      if (!saved) return json({ error: "Chưa kết nối Trang Facebook. Mở /oauth/start trước." }, 503);
      const page = JSON.parse(saved);
      const form = new URLSearchParams({ message, access_token: page.token });
      if (link) form.set("link", link);
      const response = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${encodeURIComponent(page.id)}/feed`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: form.toString() });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.error) return json({ ok: false, error: result.error?.message || "Meta Graph API request failed", code: result.error?.code || null }, 502);
      return json({ ok: true, post_id: result.id || null, published: true });
    }
    return json({ error: "Not found" }, 404);
  }
};
