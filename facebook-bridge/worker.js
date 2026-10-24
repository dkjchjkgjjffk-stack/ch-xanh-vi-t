const GRAPH_VERSION = "v26.0";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });
}

function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/health") {
      return json({ ok: true, service: "facebook-page-bridge", mode: "ready-check-only" });
    }
    if (request.method !== "POST" || url.pathname !== "/publish") {
      return json({ error: "Not found" }, 404);
    }

    const auth = request.headers.get("authorization") || "";
    const supplied = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!env.BRIDGE_SECRET || !safeEqual(supplied, env.BRIDGE_SECRET)) {
      return json({ error: "Unauthorized" }, 401);
    }
    if (!env.FACEBOOK_PAGE_ID || !env.FACEBOOK_PAGE_ACCESS_TOKEN) {
      return json({ error: "Missing FACEBOOK_PAGE_ID or FACEBOOK_PAGE_ACCESS_TOKEN secret" }, 503);
    }

    let body;
    try { body = await request.json(); } catch { return json({ error: "Body must be valid JSON" }, 400); }
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const link = typeof body.link === "string" ? body.link.trim() : "";
    if (!message) return json({ error: "message is required" }, 400);
    if (message.length > 60000) return json({ error: "message is too long" }, 400);
    if (link && !/^https:\/\//i.test(link)) return json({ error: "link must use HTTPS" }, 400);

    const form = new URLSearchParams({
      message,
      access_token: env.FACEBOOK_PAGE_ACCESS_TOKEN
    });
    if (link) form.set("link", link);

    const response = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${encodeURIComponent(env.FACEBOOK_PAGE_ID)}/feed`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: form.toString()
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.error) {
      // Do not log or return access tokens.
      return json({ ok: false, error: result.error?.message || "Meta Graph API request failed", code: result.error?.code || null }, 502);
    }
    return json({ ok: true, post_id: result.id || null, published: true });
  }
};