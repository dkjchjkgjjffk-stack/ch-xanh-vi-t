const JSON_HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
const rateWindow = new Map();
const MAX_MESSAGE_LENGTH = 1500;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

function securityHeaders(headers = {}) {
  return {
    ...headers,
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "referrer-policy": "no-referrer",
    "permissions-policy": "camera=(), microphone=(), geolocation=()",
  };
}

function html(env) {
  const page = String.raw\`<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="color-scheme" content="light"><title>Trợ lý AI · Hải Tây Phát</title>
<style>
:root{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#17352a;background:#f5f8f5}*{box-sizing:border-box}body{margin:0}header{background:#17633d;color:#fff;padding:18px max(16px,env(safe-area-inset-left));}header h1{font-size:21px;margin:0}header p{font-size:13px;margin:5px 0 0;opacity:.9}.wrap{max-width:760px;margin:0 auto;padding:16px 14px calc(28px + env(safe-area-inset-bottom))}.card{background:#fff;border:1px solid #dce8df;border-radius:16px;padding:16px;margin-bottom:14px;box-shadow:0 3px 16px #17352a0a}h2{font-size:17px;margin:0 0 12px}label{display:block;font-size:13px;font-weight:650;margin:10px 0 5px}input,textarea{font:inherit;width:100%;padding:12px;border:1px solid #cbd9cf;border-radius:10px;background:#fff;color:#17352a}button{font:inherit;font-weight:650;border:0;border-radius:10px;padding:12px 14px;cursor:pointer;background:#17633d;color:white}button.secondary{background:#edf5ef;color:#17633d;border:1px solid #cbded0}button:disabled{opacity:.6;cursor:wait}.row{display:flex;gap:8px;flex-wrap:wrap}.row button{flex:1}.muted{color:#63756a;font-size:13px;line-height:1.5}.notice{font-size:13px;white-space:pre-wrap;overflow-wrap:anywhere;margin-top:10px}.hidden{display:none!important}.messages{display:flex;flex-direction:column;gap:10px;max-height:48vh;overflow:auto;margin-bottom:12px}.msg{padding:11px 13px;border-radius:12px;white-space:pre-wrap;overflow-wrap:anywhere;font-size:14px;line-height:1.5}.user{background:#e5f4e9;align-self:flex-end;max-width:92%}.assistant{background:#f0f3f0;align-self:flex-start;max-width:100%}.status{display:grid;grid-template-columns:1fr 1fr;gap:8px}.metric{padding:10px;border-radius:10px;background:#f1f6f2}.metric b{display:block;font-size:18px}.metric span{font-size:12px;color:#63756a}.foot{font-size:12px;color:#63756a;text-align:center;margin-top:16px}@media(min-width:600px){.wrap{padding-top:24px}.card{padding:20px}}
</style></head>
<body><header><h1>🌿 Trợ lý AI · Hải Tây Phát</h1><p>Điều phối quy trình · dữ liệu giá · các kết nối được cấp quyền</p></header>
<main class="wrap">
<section id="login" class="card"><h2>Đăng nhập quản trị</h2><p class="muted">Đăng nhập được gửi trực tiếp đến Supabase. Mật khẩu không gửi tới máy chủ trợ lý. Chỉ tài khoản có vai trò admin mới sử dụng được.</p>
<form id="loginForm"><label for="email">Email</label><input id="email" type="email" autocomplete="username" required maxlength="254"><label for="password">Mật khẩu</label><input id="password" type="password" autocomplete="current-password" required minlength="8" maxlength="128><div class="row" style="margin-top:14px"><button id="loginButton" type="submit">Đăng nhập</button></div></form><div id="loginNotice" class="notice" role="status"></div></section>
<section id="app" class="hidden">
<div class="card"><div class="row" style="align-items:center"><div style="flex:2"><h2 style="margin:0">Bảng điều khiển</h2><div id="identity" class="muted"></div></div><button id="logoutButton" class="secondary" style="flex:1">Đăng xuất</button></div>
<div class="status" style="margin-top:14px"><div class="metric"><b id="priceCount">—</b><span>Dòng giá gần nhất</span></div><div class="metric"><b id="syncStatus">—</b><span>Đồng bộ gần nhất</span></div></div><div id="statusNotice" class="notice"></div>
<div class="row" style="margin-top:12px"><button id="reloadButton" class="secondary">Làm mới trạng thái</button><button id="syncButton">Đồng bộ giá ngay</button></div><p class="muted">Nút đồng bộ gọi nguồn đã cấu hình (Giacaphe.com và Giatieu.com). Không đăng bài hoặc thay đổi dữ liệu khác.</p></div>
<div class="card"><h2>Trò chuyện với trợ lý</h2><p class="muted">Bản đầu có thể giải thích số liệu giá và nhật ký đồng bộ. Chat chỉ đọc dữ liệu; thao tác ghi phải qua nút hành động riêng.</p><div id="messages" class="messages" aria-live="polite"></div><form id="chatForm"><label for="message">Ông muốn tôi làm gì?</label><textarea id="message" rows="3" maxlength="1500" placeholder="Ví dụ: Tóm tắt giá cà phê và hồ tiêu mới nhất" required></textarea><div class="row" style="margin-top:10px"><button id="sendButton" type="submit">Gửi yêu cầu</button></div></form><div id="chatNotice" class="notice" role="status"></div></div>
</section>
<p class="foot">Không đưa mật khẩu, khóa API hay mã xác thực vào khung chat. Các thao tác mới cần cấp quyền riêng.</p>
</main>
<script>
(function(){
const SUPABASE_URL="__SUPABASE_URL__";
const SUPABASE_KEY="__SUPABASE_KEY__";
const tokenKey="htp_assistant_access_token";
const login=document.getElementById("login"), app=document.getElementById("app");
const loginNotice=document.getElementById("loginNotice"), statusNotice=document.getElementById("statusNotice"), chatNotice=document.getElementById("chatNotice");
const token=()=>sessionStorage.getItem(tokenKey)||"";
function setNotice(el,text){el.textContent=text||""}
function api(path,options){const headers=Object.assign({"content-type":"application/json"},options&&options.headers||{});if(token())headers.Authorization="Bearer "+token();return fetch(path,Object.assign({},options||{},{headers})).then(async r=>{const body=await r.json().catch(()=>({error:"Phản hồi không hợp lệ"}));if(!r.ok)throw new Error(body.error||body.message||("HTTP "+r.status));return body})}
function appendMessage(role,text){const node=document.createElement("div");node.className="msg "+role;node.textContent=text;document.getElementById("messages").appendChild(node);document.getElementById("messages").scrollTop=document.getElementById("messages").scrollHeight}
async function loadStatus(){setNotice(statusNotice,"Đang tải trạng thái…");try{const data=await api("/api/status");document.getElementById("identity").textContent=data.user.email||"Đã đăng nhập quản trị";document.getElementById("priceCount").textContent=String((data.prices||[]).length);document.getElementById("syncStatus").textContent=data.latestRun?data.latestRun.status:"Chưa có";setNotice(statusNotice,data.latestRun?"Lần chạy gần nhất: "+data.latestRun.started_at+" · ghi "+data.latestRun.rows_written+" dòng":"Chưa có nhật ký đồng bộ.");}catch(e){setNotice(statusNotice,e.message);if(/401|403|đăng nhập|quyền/i.test(e.message))showLogin()}}
function showApp(){login.classList.add("hidden");app.classList.remove("hidden");void loadStatus()}
function showLogin(){app.classList.add("hidden");login.classList.remove("hidden")}
document.getElementById("loginForm").addEventListener("submit",async e=>{e.preventDefault();const button=document.getElementById("loginButton");button.disabled=true;setNotice(loginNotice,"Đang xác thực với Supabase…");try{const r=await fetch(SUPABASE_URL+"/auth/v1/token?grant_type=password",{method:"POST",headers:{"apikey":SUPABASE_KEY,"content-type":"application/json"},body:JSON.stringify({email:document.getElementById("email").value.trim(),password:document.getElementById("password").value})});const data=await r.json();if(!r.ok||!data.access_token)throw new Error(data.msg||data.message||"Đăng nhập thất bại");sessionStorage.setItem(tokenKey,data.access_token);const check=await api("/api/status");setNotice(loginNotice,"");showApp();document.getElementById("identity").textContent=check.user.email||"";}catch(e){sessionStorage.removeItem(tokenKey);setNotice(loginNotice,e.message+" Nếu chưa có vai trò admin, hãy nhờ chủ dự án cấp quyền ở backend.");}finally{button.disabled=false}});
document.getElementById("reloadButton").addEventListener("click",()=>void loadStatus());
document.getElementById("logoutButton").addEventListener("click",async()=>{try{await fetch(SUPABASE_URL+"/auth/v1/logout",{method:"POST",headers:{"apikey":SUPABASE_KEY,"authorization":"Bearer "+token()}})}catch(e){}sessionStorage.removeItem(tokenKey);document.getElementById("messages").replaceChildren();showLogin();setNotice(loginNotice,"Đã đăng xuất.")});
document.getElementById("syncButton").addEventListener("click",async()=>{const b=document.getElementById("syncButton");if(!confirm("Chạy đồng bộ giá cà phê và hồ tiêu ngay bây giờ?"))return;b.disabled=true;setNotice(statusNotice,"Đang đồng bộ…");try{const data=await api("/api/workflows/refresh-prices",{method:"POST",body:"{}"});setNotice(statusNotice,"Hoàn tất: kiểm tra "+data.sourcesChecked+" nguồn, ghi "+data.rowsWritten+" dòng."+(data.failures&&data.failures.length?"\nLỗi: "+data.failures.join("; "):""));await loadStatus()}catch(e){setNotice(statusNotice,"Không đồng bộ được: "+e.message)}finally{b.disabled=false}});
document.getElementById("chatForm").addEventListener("submit",async e=>{e.preventDefault();const input=document.getElementById("message"),b=document.getElementById("sendButton"),message=input.value.trim();if(!message)return;appendMessage("user",message);input.value="";b.disabled=true;setNotice(chatNotice,"Đang suy nghĩ…");try{const data=await api("/api/chat",{method:"POST",body:JSON.stringify({message})});appendMessage("assistant",data.reply||"Chưa có câu trả lời.");setNotice(chatNotice,"")}catch(e){setNotice(chatNotice,e.message)}finally{b.disabled=false;input.focus()}});
if(token()){api("/api/status").then(showApp).catch(()=>{sessionStorage.removeItem(tokenKey);showLogin()})}else showLogin();
})();
</script></body></html>\`;
  return page.replace("__SUPABASE_URL__", env.SUPABASE_URL).replace("__SUPABASE_KEY__", env.SUPABASE_PUBLISHABLE_KEY);
}

function sameOrigin(request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

async function getAdmin(request, env) {
  const auth = request.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) return { error: json({ error: "Cần đăng nhập quản trị." }, 401) };
  const token = auth.slice(7);
  const headers = { apikey: env.SUPABASE_PUBLISHABLE_KEY, authorization: "Bearer " + token };
  const userResponse = await fetch(env.SUPABASE_URL + "/auth/v1/user", { headers });
  if (!userResponse.ok) return { error: json({ error: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn." }, 401) };
  const user = await userResponse.json();
  const roleUrl = env.SUPABASE_URL + "/rest/v1/user_roles?select=role&user_id=eq." + encodeURIComponent(user.id) + "&role=eq.admin";
  const roleResponse = await fetch(roleUrl, { headers });
  if (!roleResponse.ok) return { error: json({ error: "Không kiểm tra được quyền quản trị." }, 502) };
  const roles = await roleResponse.json();
  if (!Array.isArray(roles) || !roles.some((row) => row.role === "admin")) {
    return { error: json({ error: "Tài khoản này chưa được cấp quyền admin." }, 403) };
  }
  return { user, token, headers };
}

function rateLimited(userId) {
  const now = Date.now();
  const recent = (rateWindow.get(userId) || []).filter((t) => now - t < 60000);
  if (recent.length >= 12) return true;
  recent.push(now);
  rateWindow.set(userId, recent);
  return false;
}

async function readAdminData(env, auth) {
  const base = env.SUPABASE_URL + "/rest/v1/";
  const headers = auth.headers;
  const [pricesResponse, runsResponse] = await Promise.all([
    fetch(base + "prices?select=crop,province,unit,price,price_date,source,currency&order=price_date.desc&limit=30", { headers }),
    fetch(base + "price_sync_runs?select=id,started_at,finished_at,status,sources_checked,rows_written,details&order=id.desc&limit=5", { headers }),
  ]);
  if (!pricesResponse.ok) throw new Error("Không đọc được bảng giá. HTTP " + pricesResponse.status);
  if (!runsResponse.ok) throw new Error("Không đọc được nhật ký đồng bộ. Cần áp dụng migration quyền đọc nhật ký.");
  return { prices: await pricesResponse.json(), runs: await runsResponse.json() };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: securityHeaders({ "access-control-allow-methods": "GET, POST, OPTIONS", "access-control-allow-headers": "authorization, content-type" }) });
    if (url.pathname === "/health" && request.method === "GET") {
      return new Response(JSON.stringify({ ok: true, service: "hai-tay-phat-assistant", version: "0.1.0" }), { headers: securityHeaders(JSON_HEADERS) });
    }
    if (url.pathname === "/" && request.method === "GET") {
      return new Response(html(env), { headers: securityHeaders({ "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "content-security-policy": "default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self' " + env.SUPABASE_URL + "; frame-ancestors 'none'; base-uri 'none'; form-action 'self' " + env.SUPABASE_URL }) });
    }
    if (!["/api/status", "/api/chat", "/api/workflows/refresh-prices"].includes(url.pathname)) return json({ error: "Không tìm thấy endpoint." }, 404);
    if (!sameOrigin(request)) return json({ error: "Yêu cầu khác nguồn bị từ chối." }, 403);
    const auth = await getAdmin(request, env);
    if (auth.error) return auth.error;

    if (url.pathname === "/api/status" && request.method === "GET") {
      try {
        const data = await readAdminData(env, auth);
        const latestRun = data.runs[0] || null;
        return json({
          ok: true,
          user: { id: auth.user.id, email: auth.user.email },
          prices: data.prices,
          latestRun,
          recentRuns: data.runs,
          integrations: { supabase: "connected", agriculturalPrices: "connected", facebook: "not_connected", youtube: "not_connected" },
        });
      } catch (error) {
        return json({ error: error instanceof Error ? error.message : "Không đọc được trạng thái." }, 502);
      }
    }

    if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);
    if (url.pathname === "/api/workflows/refresh-prices") {
      const result = await fetch(env.SUPABASE_URL + "/functions/v1/sync-agricultural-prices", {
        method: "POST",
        headers: { "content-type": "application/json", "x-sync-token": env.PRICE_SYNC_TOKEN },
        body: "{}",
      });
      const body = await result.json().catch(() => ({}));
      if (!result.ok || body.ok !== true) return json({ error: body.error || "Đồng bộ giá thất bại.", details: body }, result.status >= 400 ? result.status : 502);
      return json(body);
    }

    if (url.pathname === "/api/chat") {
      if (rateLimited(auth.user.id)) return json({ error: "Đã đạt giới hạn 12 yêu cầu/phút. Hãy thử lại sau một phút." }, 429);
      let body;
      try { body = await request.json(); } catch { return json({ error: "Nội dung yêu cầu không hợp lệ." }, 400); }
      const message = typeof body.message === "string" ? body.message.trim() : "";
      if (!message || message.length > MAX_MESSAGE_LENGTH) return json({ error: "Tin nhắn phải có từ 1 đến 1500 ký tự." }, 400);
      try {
        const data = await readAdminData(env, auth);
        const context = {
          current_prices: data.prices,
          recent_sync_runs: data.runs,
          connected_integrations: ["Supabase Auth", "Supabase prices", "Supabase price_sync_runs", "Supabase Edge Function sync-agricultural-prices"],
          not_connected: ["Facebook Graph API", "YouTube Data API"],
        };
        const prompt = "Yêu cầu người quản trị: " + message + "\n\nDữ liệu hiện tại (JSON, chỉ dùng để trả lời dựa trên dữ liệu này):\n" + JSON.stringify(context);
        const result = await env.AI.run("@cf/zai-org/glm-4.7-flash", {
          messages: [
            { role: "system", content: "Bạn là trợ lý điều phối vận hành Hải Tây Phát, trả lời bằng tiếng Việt, ngắn gọn và cụ thể. Chỉ khẳng định những gì có trong dữ liệu JSON được cung cấp. Giá có nguồn và ngày; luôn phân biệt ngày giá với thời điểm đồng bộ. Không bịa giá, không tuyên bố đã kết nối Facebook/YouTube khi chúng chưa kết nối. Chat chỉ đọc dữ liệu và tư vấn; không thực hiện hành động ghi hoặc đăng nội dung từ câu chat. Khi người dùng muốn đồng bộ giá, hướng dẫn họ dùng nút 'Đồng bộ giá ngay' để xác nhận. Không yêu cầu mật khẩu, mã OTP, API secret hoặc access token." },
            { role: "user", content: prompt },
          ],
          max_tokens: 700,
        });
        const reply = result && (result.response || result.output_text || result.result);
        return json({ ok: true, reply: typeof reply === "string" ? reply : JSON.stringify(result) });
      } catch (error) {
        return json({ error: error instanceof Error ? error.message : "AI chưa thể xử lý yêu cầu." }, 502);
      }
    }
    return json({ error: "Method not allowed." }, 405);
  },
};