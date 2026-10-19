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
const MAX_AGE_DAYS = 3;
const SOURCES = {
  coffee: "https://giacaphe.com/gia-ca-phe-noi-dia/",
  pepper: "https://giatieu.com/gia-tieu-hom-nay/",
};

type PriceRow = {
  crop: string;
  province: string;
  unit: string;
  price: number;
  price_date: string;
  source: string;
  currency: "VND" | "USD" | "USC";
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
  return decodeHtml(value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ").trim());
}

function heading(html: string) {
  const match = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  return match ? stripHtml(match[1]) : stripHtml(html).slice(0, 300);
}

function parseDate(text: string): string | null {
  const monthNames: Record<string, string> = {
    january: "01", february: "02", march: "03", april: "04", may: "05", june: "06",
    july: "07", august: "08", september: "09", october: "10", november: "11", december: "12",
  };
  const english = text.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(20\d{2})\b/i);
  if (english) return `${english[3]}-${monthNames[english[1].toLowerCase()]}-${english[2].padStart(2, "0")}`;
  const numeric = text.match(/\b(\d{1,2})[/-](\d{1,2})[/-](20\d{2})\b/);
  if (numeric) return `${numeric[3]}-${numeric[2].padStart(2, "0")}-${numeric[1].padStart(2, "0")}`;
  return null;
}

function isFresh(date: string) {
  const localToday = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
  const ageDays = (Date.parse(localToday + "T00:00:00Z") - Date.parse(date + "T00:00:00Z")) / 86400000;
  return ageDays >= 0 && ageDays <= MAX_AGE_DAYS;
}

function numberFrom(value: string): number | null {
  const match = value.match(/\b\d{2,3}(?:,\d{3})+\b|\b\d{5,6}\b/);
  if (!match) return null;
  const number = Number(match[0].replace(/,/g, ""));
  return Number.isFinite(number) && number > 0 ? number : null;
}

const pepperLocations = [
  { aliases: ["gia lai"], province: "Gia Lai" },
  { aliases: ["đắk lắk", "dak lak"], province: "Đắk Lắk" },
  { aliases: ["đắk nông", "dak nong"], province: "Đắk Nông" },
  { aliases: ["lâm đồng", "lam dong"], province: "Lâm Đồng" },
  { aliases: ["bình phước", "binh phuoc"], province: "Bình Phước" },
  { aliases: ["đồng nai", "dong nai"], province: "Đồng Nai" },
  { aliases: ["bà rịa - vũng tàu", "bà rịa-vũng tàu", "ba ria"], province: "Bà Rịa - Vũng Tàu" },
];

function parsePepper(html: string, date: string): PriceRow[] {
  const rows: PriceRow[] = [];
  const seen = new Set<string>();
  for (const row of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...row[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)]
      .map((cell) => stripHtml(cell[1]));
    if (cells.length < 2) continue;
    const first = cells[0].toLowerCase();
    const location = pepperLocations.find((entry) => entry.aliases.some((alias) => first.includes(alias)));
    if (!location || seen.has(location.province)) continue;
    const price = numberFrom(cells.slice(1).join(" "));
    if (!price || price < 20000 || price > 350000) continue;
    seen.add(location.province);
    rows.push({
      crop: "Hồ tiêu",
      province: location.province,
      unit: "kg",
      price,
      price_date: date,
      source: `Giatieu.com — ${SOURCES.pepper}`,
      currency: "VND",
    });
  }
  return rows;
}

function parseFuturesSection(html: string, market: "Robusta London" | "Arabica New York", date: string): PriceRow[] {
  const headingPattern = new RegExp(`<h[1-6]\\b[^>]*>[^<]*${market}[^<]*</h[1-6]>`, "i");
  const headingMatch = headingPattern.exec(html);
  if (!headingMatch || headingMatch.index === undefined) return [];
  const sectionStart = headingMatch.index;
  const rest = html.slice(sectionStart + headingMatch[0].length);
  const nextHeading = rest.search(/<h[1-6]\b/i);
  const section = html.slice(sectionStart, nextHeading >= 0 ? sectionStart + headingMatch[0].length + nextHeading : undefined);
  const rows: PriceRow[] = [];
  for (const row of section.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...row[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((cell) => stripHtml(cell[1]));
    if (cells.length < 2 || !/^\d{2}\/\d{2}$/.test(cells[0])) continue;
    const price = Number(cells[1].replace(/,/g, "").replace(/[^\d.]/g, ""));
    const isRobusta = market === "Robusta London";
    if (!Number.isFinite(price) || (isRobusta ? price < 1000 || price > 10000 : price < 100 || price > 1000)) continue;
    const contract = cells[0];
    rows.push({
      crop: isRobusta ? `Cà phê Robusta London ${contract}` : `Cà phê Arabica New York ${contract}`,
      province: isRobusta ? "Sàn London" : "Sàn New York",
      unit: isRobusta ? "tấn" : "lb",
      price,
      price_date: date,
      source: `Giacaphe.com — ${SOURCES.coffee}`,
      currency: isRobusta ? "USD" : "USC",
    });
  }
  return rows;
}
async function fetchSource(url: string) {")}[\\s\\S]*?<\\/h[1-6]>`, "i");
  const headingMatch = headingPattern.exec(html);
  if (!headingMatch || headingMatch.index === undefined) return [];
  const sectionStart = headingMatch.index;
  const rest = html.slice(sectionStart + headingMatch[0].length);
  const nextHeading = rest.search(/<h[1-6]\\b/i);
  const section = html.slice(sectionStart, nextHeading >= 0 ? sectionStart + headingMatch[0].length + nextHeading : undefined);
  const rows: PriceRow[] = [];
  for (const row of section.matchAll(/<tr\\b[^>]*>([\\s\\S]*?)<\\/tr>/gi)) {
    const cells = [...row[1].matchAll(/<t[dh]\\b[^>]*>([\\s\\S]*?)<\\/t[dh]>/gi)]
      .map((cell) => stripHtml(cell[1]));
    if (cells.length < 2 || !/^\\d{2}\\/\\d{2}$/.test(cells[0])) continue;
    const price = Number(cells[1].replace(/,/g, "").replace(/[^\\d.]/g, ""));
    const isRobusta = market === "Robusta London";
    if (!Number.isFinite(price) || (isRobusta ? price < 1000 || price > 10000 : price < 100 || price > 1000)) continue;
    const contract = cells[0];
    rows.push({
      crop: isRobusta ? `Cà phê Robusta London ${contract}` : `Cà phê Arabica New York ${contract}`,
      province: isRobusta ? "Sàn London" : "Sàn New York",
      unit: isRobusta ? "tấn" : "lb",
      price,
      price_date: date,
      source: `Giacaphe.com — ${SOURCES.coffee}`,
      currency: isRobusta ? "USD" : "USC",
    });
  }
  return rows;
}

async function fetchSource(url: string) {
  const response = await fetch(url, {
    headers: { "user-agent": "HaiTayPhat-PriceBot/1.0 (+public agricultural price references)" },
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return await response.text();
}

Deno.serve(async (req: Request) => {
  if (req.method === "GET") {
    return Response.json({
      ok: true,
      service: "automatic-agricultural-prices",
      schedule: "daily 08:00 Asia/Ho_Chi_Minh",
      sources: SOURCES,
      supported: ["Cà phê nhân xô (trung bình Tây Nguyên)", "Hồ tiêu theo địa phương"],
    });
  }
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const token = req.headers.get("x-sync-token");
  const { data: allowed, error: authError } = await supabase.rpc("is_valid_price_sync_token", { p_token: token });
  if (authError || allowed !== true) return new Response("Unauthorized", { status: 401 });

  const startedAt = new Date().toISOString();
  const rows: PriceRow[] = [];
  const failures: string[] = [];
  let sourcesChecked = 0;
  let staleSources = 0;

  try {
    try {
      const html = await fetchSource(SOURCES.coffee);
      sourcesChecked++;
      const title = heading(html);
      const date = parseDate(title);
      const plain = stripHtml(html);
      if (!date || !isFresh(date)) {
        staleSources++;
      } else {
        const averageMatch = plain.match(/(?:Trung bình|trung bình ở mức)\s*([\d,]+)\s*(?:đ|vnđ|vnd)\s*\/\s*kg/i);
        const price = averageMatch ? Number(averageMatch[1].replace(/,/g, "")) : null;
        if (price && price >= 20000 && price <= 250000) {
          rows.push({
            crop: "Cà phê nhân xô",
            province: "Trung bình Tây Nguyên",
            unit: "kg",
            price,
            price_date: date,
            source: `Giacaphe.com — ${SOURCES.coffee}`,
            currency: "VND",
          });
        } else {
          failures.push("Giacaphe.com: không tìm thấy giá trung bình trong định dạng dự kiến");
        }
        rows.push(...parseFuturesSection(html, "Robusta London", date));
        rows.push(...parseFuturesSection(html, "Arabica New York", date));
      }
    } catch (error) {
      failures.push(`Giacaphe.com: ${error instanceof Error ? error.message : "fetch failed"}`);
    }

    try {
      const html = await fetchSource(SOURCES.pepper);
      sourcesChecked++;
      const date = parseDate(heading(html));
      if (!date || !isFresh(date)) {
        staleSources++;
      } else {
        const parsed = parsePepper(html, date);
        if (parsed.length) rows.push(...parsed);
        else failures.push("Giatieu.com: không tìm thấy bảng giá địa phương trong định dạng dự kiến");
      }
    } catch (error) {
      failures.push(`Giatieu.com: ${error instanceof Error ? error.message : "fetch failed"}`);
    }

    // Only fresh, source-backed values are published. Never replace a newer row with older data.
    const unique = new Map<string, PriceRow>();
    for (const row of rows.sort((a, b) => b.price_date.localeCompare(a.price_date))) {
      const key = `${row.crop}|${row.province}|${row.price_date}`;
      if (!unique.has(key)) unique.set(key, row);
    }
    const data = [...unique.values()];
    if (data.length) {
      const { error } = await supabase.from("prices").upsert(data, { onConflict: "crop,province,price_date" });
      if (error) throw error;
    }

    const status = failures.length ? (data.length ? "partial" : "failed") : "success";
    const { error: logError } = await supabase.from("price_sync_runs").insert({
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      status,
      sources_checked: sourcesChecked,
      rows_written: data.length,
      details: { stale_sources_skipped: staleSources, failures: failures.slice(0, 10) },
    });
    if (logError) console.error("Unable to write sync log", logError);

    return Response.json({
      ok: data.length > 0,
      sourcesChecked,
      rowsWritten: data.length,
      staleSourcesSkipped: staleSources,
      failures,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown sync error";
    await supabase.from("price_sync_runs").insert({
      started_at: startedAt, finished_at: new Date().toISOString(), status: "failed",
      sources_checked: sourcesChecked, rows_written: 0, details: { error: message, failures },
    });
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
});
