import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
  (() => {
    try {
      const keys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}");
      return keys.service_role ?? keys.secret_key ?? "";
    } catch {
      return "";
    }
  })();

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const LIST_URL =
  "https://asemconnectvietnam.gov.vn/default.aspx?ID1=2&ZID1=8&pagenumber=1";
const MAX_AGE_DAYS = 3;

type PriceRow = {
  crop: string;
  province: string;
  unit: string;
  price: number;
  price_date: string;
  source: string;
};

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripHtml(value: string) {
  return decodeHtml(value.replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ").trim());
}

function parseDate(text: string): string | null {
  const monthNames: Record<string, string> = {
    january: "01", february: "02", march: "03", april: "04",
    may: "05", june: "06", july: "07", august: "08",
    september: "09", october: "10", november: "11", december: "12",
  };
  const english = text.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(20\d{2})\b/i);
  if (english) {
    return `${english[3]}-${monthNames[english[1].toLowerCase()]}-${english[2].padStart(2, "0")}`;
  }
  const numeric = text.match(/\b(\d{1,2})[/-](\d{1,2})[/-](20\d{2})\b/);
  if (numeric) {
    return `${numeric[3]}-${numeric[2].padStart(2, "0")}-${numeric[1].padStart(2, "0")}`;
  }
  return null;
}

function isFresh(date: string) {
  const localToday = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
  const ageDays = (Date.parse(localToday + "T00:00:00Z") - Date.parse(date + "T00:00:00Z")) / 86400000;
  return ageDays >= 0 && ageDays <= MAX_AGE_DAYS;
}

const locations = [
  { label: "Gia Lai", province: "Gia Lai", aliases: ["gia lai"] },
  { label: "Dak Lak", province: "Đắk Lắk", aliases: ["dak lak", "đắk lắk"] },
  { label: "Lam Dong", province: "Lâm Đồng", aliases: ["lam dong", "lâm đồng"] },
  { label: "Dak Nong", province: "Đắk Nông", aliases: ["dak nong", "đắk nông"] },
  { label: "Binh Phuoc", province: "Bình Phước", aliases: ["binh phuoc", "bình phước"] },
  { label: "Dong Nai", province: "Đồng Nai", aliases: ["dong nai", "đồng nai"] },
];

function parseNumber(value: string): number | null {
  const n = Number(value.replace(/[^\d]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function parseRows(html: string, crop: "coffee" | "pepper", articleUrl: string, date: string): PriceRow[] {
  const rows: PriceRow[] = [];
  const seen = new Set<string>();
  const priceRange = crop === "coffee" ? [20000, 250000] : [20000, 350000];

  const add = (locationText: string, priceText: string) => {
    const price = parseNumber(priceText);
    if (!price || price < priceRange[0] || price > priceRange[1]) return;
    const lower = locationText.toLowerCase();
    const location = locations.find((entry) => entry.aliases.some((alias) => lower.includes(alias)));
    if (!location || seen.has(location.province)) return;
    seen.add(location.province);
    rows.push({
      crop: crop === "coffee" ? "Cà phê nhân xô" : "Hồ tiêu",
      province: location.province,
      unit: "kg",
      price,
      price_date: date,
      source: `Asemconnect / VITIC — ${articleUrl}`,
    });
  };

  // Prefer actual market-table rows; the first cell must name a location.
  for (const match of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...match[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)]
      .map((cell) => stripHtml(cell[1]));
    if (cells.length < 2) continue;
    const first = cells[0].toLowerCase();
    if (!locations.some((entry) => entry.aliases.some((alias) => first.includes(alias)))) continue;
    for (const cell of cells.slice(1)) {
      const candidate = cell.match(/\b\d{2,3}(?:,\d{3})+\b|\b\d{5,6}\b/);
      if (candidate) {
        add(cells[0], candidate[0]);
        break;
      }
    }
  }

  // Fallback for prose reports such as "prices in Gia Lai stood at VND98,500 per kg".
  const text = stripHtml(html);
  for (const location of locations) {
    if (seen.has(location.province)) continue;
    for (const alias of location.aliases) {
      const escaped = alias.replace(/[.*+?^\${}()|[\]\\]/g, "\\$&");
      const pattern = new RegExp(
        `(?:${escaped})[^.\\n]{0,180}?(?:VND\\s*)?(\\d{2,3}(?:,\\d{3})+|\\d{5,6})\\s*(?:VND|dong)?\\s*(?:per\\s*kg|/\\s*kg|\\/kg)`,
        "i",
      );
      const match = text.match(pattern);
      if (match) {
        add(alias, match[1]);
        break;
      }
    }
  }
  return rows;
}

function articleCandidates(html: string) {
  const results: { title: string; url: string }[] = [];
  const seen = new Set<string>();
  for (const match of html.matchAll(/<a\b[^>]*href=["']([^"']*ID8=\d+[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const url = new URL(decodeHtml(match[1]), "https://asemconnectvietnam.gov.vn").toString();
    const title = stripHtml(match[2]);
    const lower = title.toLowerCase();
    const isMarketPrice = /(price|prices|market|commodity)/i.test(title);
    const supportedCrop = /(coffee|pepper|rice|durian|agricultural)/i.test(title);
    if (!isMarketPrice || !supportedCrop || seen.has(url)) continue;
    seen.add(url);
    results.push({ title, url });
  }
  return results.slice(0, 24);
}

Deno.serve(async (req: Request) => {
  if (req.method === "GET") {
    return Response.json({ ok: true, service: "automatic-agricultural-prices", schedule: "daily 08:00 Asia/Ho_Chi_Minh", supported: ["Cà phê nhân xô", "Hồ tiêu"] });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const token = req.headers.get("x-sync-token");
  const { data: allowed, error: authError } = await supabase.rpc("is_valid_price_sync_token", { p_token: token });
  if (authError || allowed !== true) {
    return new Response("Unauthorized", { status: 401 });
  }

  const startedAt = new Date().toISOString();
  let sourceCount = 0;
  let writtenCount = 0;
  const failures: string[] = [];
  try {
    const listingResponse = await fetch(LIST_URL, {
      headers: { "user-agent": "HaiTayPhat-PriceBot/1.0 (public agricultural price references)" },
      signal: AbortSignal.timeout(15000),
    });
    if (!listingResponse.ok) throw new Error(`Nguồn danh sách trả HTTP ${listingResponse.status}`);
    const listing = await listingResponse.text();
    const candidates = articleCandidates(listing);
    const selected = candidates.filter(({ title }) => /(coffee|pepper|agricultural commodity prices)/i.test(title));
    const allRows: PriceRow[] = [];

    for (const article of selected.slice(0, 12)) {
      try {
        const response = await fetch(article.url, {
          headers: { "user-agent": "HaiTayPhat-PriceBot/1.0 (public agricultural price references)" },
          signal: AbortSignal.timeout(12000),
        });
        if (!response.ok) continue;
        const html = await response.text();
        sourceCount++;
        const plain = stripHtml(html);
        const date = parseDate(article.title) ?? parseDate(plain.slice(0, 4000));
        if (!date || !isFresh(date)) continue;
        const lower = (article.title + " " + plain.slice(0, 5000)).toLowerCase();
        if (/(coffee|robusta|arabica|cà phê)/i.test(lower)) {
          allRows.push(...parseRows(html, "coffee", article.url, date));
        }
        if (/(pepper|hồ tiêu|black pepper)/i.test(lower)) {
          allRows.push(...parseRows(html, "pepper", article.url, date));
        }
      } catch (error) {
        failures.push(`${article.url}: ${error instanceof Error ? error.message : "fetch failed"}`);
      }
    }

    // Newest source wins if multiple reports quote the same commodity/locality/date.
    const unique = new Map<string, PriceRow>();
    for (const row of allRows.sort((a, b) => b.price_date.localeCompare(a.price_date))) {
      const key = `${row.crop}| ${row.province}| ${row.price_date}`;
      if (!unique.has(key)) unique.set(key, row);
    }
    const data = [...unique.values()];
    if (data.length) {
      const { error } = await supabase.from("prices").upsert(data, { onConflict: "crop,province,price_date" });
      if (error) throw error;
      writtenCount = data.length;
    }

    const { error: logError } = await supabase.from("price_sync_runs").insert({
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      status: failures.length ? (writtenCount ? "partial" : "failed") : "success",
      sources_checked: sourceCount,
      rows_written: writtenCount,
      details: { fresh_articles_found: selected.length, rows_found: allRows.length, failures: failures.slice(0, 10) },
    });
    if (logError) console.error("Unable to write sync log", logError);

    return Response.json({
      ok: true,
      sourcesChecked: sourceCount,
      rowsFound: allRows.length,
      rowsWritten: writtenCount,
      skippedStaleArticles: true,
      failures: failures.slice(0, 5),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown sync error";
    await supabase.from("price_sync_runs").insert({
      started_at: startedAt, finished_at: new Date().toISOString(), status: "failed",
      sources_checked: sourceCount, rows_written: writtenCount, details: { error: message, failures: failures.slice(0, 10) },
    });
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
});
