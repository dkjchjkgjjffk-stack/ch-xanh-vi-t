import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

const GEO_ENDPOINT = "https://hai-tay-phat-geo.dkjchjkgjjffk.workers.dev/";
type GeoInfo = { country_code?: string | null; country_name?: string | null; region?: string | null; city?: string | null };
async function getGeoInfo(): Promise<GeoInfo> {
  try {
    const cached = window.sessionStorage.getItem("htp_geo_info");
    if (cached) return JSON.parse(cached) as GeoInfo;
    const response = await fetch(GEO_ENDPOINT, { method: "GET", headers: { Accept: "application/json" }, credentials: "omit" });
    if (!response.ok) return {};
    const data = await response.json() as GeoInfo;
    const safe: GeoInfo = {
      country_code: typeof data.country_code === "string" ? data.country_code.slice(0, 2) : null,
      country_name: typeof data.country_name === "string" ? data.country_name.slice(0, 80) : null,
      region: typeof data.region === "string" ? data.region.slice(0, 100) : null,
      city: typeof data.city === "string" ? data.city.slice(0, 100) : null,
    };
    window.sessionStorage.setItem("htp_geo_info", JSON.stringify(safe));
    return safe;
  } catch { return {}; }
}

function getId(storage: Storage, key: string) {
  try {
    let value = storage.getItem(key);
    if (!value) {
      value = typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
      storage.setItem(key, value);
    }
    return value;
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }
}

function getDevice(ua: string) {
  if (/ipad|tablet/i.test(ua)) return "tablet";
  if (/mobi|iphone|ipod|android/i.test(ua)) return "mobile";
  return "desktop";
}
function getBrowser(ua: string) {
  if (/edg\//i.test(ua)) return "Edge";
  if (/opr\//i.test(ua)) return "Opera";
  if (/firefox\//i.test(ua)) return "Firefox";
  if (/crios\//i.test(ua)) return "Chrome iOS";
  if (/chrome\//i.test(ua)) return "Chrome";
  if (/safari\//i.test(ua)) return "Safari";
  return "Other";
}
function getOS(ua: string) {
  if (/iphone|ipad|ipod/i.test(ua)) return "iOS/iPadOS";
  if (/android/i.test(ua)) return "Android";
  if (/windows/i.test(ua)) return "Windows";
  if (/mac os|macintosh/i.test(ua)) return "macOS";
  if (/linux/i.test(ua)) return "Linux";
  return "Other";
}
function isAdminPath(path: string) {
  return path.startsWith("/quan-tri") || path.startsWith("/tai-khoan");
}
export function WebsiteAnalyticsTracker() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  useEffect(() => {
    if (typeof window === "undefined" || isAdminPath(pathname)) return;
    const ua = navigator.userAgent || "";
    void (async () => {
    const geo = await getGeoInfo();
    const payload = {
      visitor_id: getId(window.localStorage, "htp_visitor_id"),
      session_id: getId(window.sessionStorage, "htp_session_id"),
      event_type: "page_view",
      page_path: window.location.pathname.slice(0, 500),
      page_title: document.title.slice(0, 300),
      referrer_host: (() => { try { return document.referrer ? new URL(document.referrer).hostname.slice(0, 255) : ""; } catch { return ""; } })(),
      device_type: getDevice(ua),
      browser: getBrowser(ua),
      operating_system: getOS(ua),
      screen_width: Math.min(window.screen.width || 0, 10000),
      screen_height: Math.min(window.screen.height || 0, 10000),
      language: (navigator.language || "").slice(0, 35),
      timezone: (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone.slice(0, 80); } catch { return ""; } })(),
      country_code: geo.country_code ?? null,
      country_name: geo.country_name ?? null,
      region: geo.region ?? null,
      city: geo.city ?? null,
      event_label: null,
      event_data: { viewport_width: Math.min(window.innerWidth || 0, 10000), viewport_height: Math.min(window.innerHeight || 0, 10000) },
    };
    const { error } = await supabase.from("website_analytics_events").insert(payload);
    if (error && import.meta.env.DEV) console.warn("Analytics event was not saved", error.message);
    })();
  }, [pathname]);
  useEffect(() => {
    if (typeof document === "undefined") return;
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const clickable = target.closest("a,button,[role='button']");
      if (!clickable) return;
      const path = window.location.pathname;
      if (isAdminPath(path)) return;
      const label = (clickable.getAttribute("aria-label") || clickable.getAttribute("data-track-label") || clickable.textContent || "").trim().replace(/\s+/g, " ").slice(0, 120);
      if (!label) return;
      const ua = navigator.userAgent || "";
      void getGeoInfo().then((geo) => supabase.from("website_analytics_events").insert({
        visitor_id: getId(window.localStorage, "htp_visitor_id"),
        session_id: getId(window.sessionStorage, "htp_session_id"),
        event_type: "click",
        page_path: path.slice(0, 500),
        page_title: document.title.slice(0, 300),
        referrer_host: "",
        device_type: getDevice(ua),
        browser: getBrowser(ua),
        operating_system: getOS(ua),
        screen_width: Math.min(window.screen.width || 0, 10000),
        screen_height: Math.min(window.screen.height || 0, 10000),
        language: (navigator.language || "").slice(0, 35),
        timezone: "",
        country_code: geo.country_code ?? null,
        country_name: geo.country_name ?? null,
        region: geo.region ?? null,
        city: geo.city ?? null,
        event_label: label,
        event_data: { element: clickable.tagName.toLowerCase() },
      }));
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);
  return null;
}
