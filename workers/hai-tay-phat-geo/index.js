export default {
  async fetch(request) {
    const origin = request.headers.get("Origin") || "";
    const headers = {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": origin || "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin",
    };
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (request.method !== "GET") return new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405, headers });
    const cf = request.cf || {};
    return Response.json({
      country_code: typeof cf.country === "string" ? cf.country.slice(0, 2) : null,
      country_name: typeof cf.country === "string" ? cf.country.slice(0, 80) : null,
      region: typeof cf.region === "string" ? cf.region.slice(0, 100) : null,
      city: typeof cf.city === "string" ? cf.city.slice(0, 100) : null,
      source: "cloudflare_ip_geolocation",
    }, { headers });
  },
};
