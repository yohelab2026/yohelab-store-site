import { getAffiliateMeta, recordClick, rateLimitOk, getClientIp } from "../lib/affiliate.js";

// Lightweight click tracking. Called from LP via fetch(beacon).
// Idempotent: callers can fire-and-forget.
export async function onRequestGet(context) {
  return handle(context);
}

export async function onRequestPost(context) {
  return handle(context);
}

async function handle(context) {
  try {
    const url = new URL(context.request.url);
    const code = (url.searchParams.get("code") || "").trim().toUpperCase();
    if (!code || !/^AFF-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) {
      return json({ ok: false }, 200);
    }
    // Per-IP click cap (prevents bots from inflating dashboards / KV writes).
    const ip = getClientIp(context.request);
    const within = await rateLimitOk(context.env, "click", ip, { limit: 60, windowSec: 3600 });
    if (!within) return json({ ok: false }, 200);

    const meta = await getAffiliateMeta(code, context.env);
    if (!meta || meta.status === "suspended") {
      return json({ ok: false }, 200);
    }
    await recordClick(code, context.env);
    return json({ ok: true });
  } catch {
    return json({ ok: false }, 200);
  }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
