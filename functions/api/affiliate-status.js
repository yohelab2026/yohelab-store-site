import { getAffiliateMeta, listSales, computeAffiliateStats, getClickCount } from "../lib/affiliate.js";

export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const code = (url.searchParams.get("code") || "").trim().toUpperCase();
    const email = (url.searchParams.get("email") || "").trim().toLowerCase();
    if (!code || !email) {
      return json({ ok: false, error: "コードとメールアドレスが必要です。" }, 400);
    }
    const meta = await getAffiliateMeta(code, context.env);
    if (!meta) {
      return json({ ok: false, error: "コードが見つかりません。" }, 404);
    }
    if (meta.email !== email) {
      // Avoid leaking which one is wrong
      return json({ ok: false, error: "コードまたはメールアドレスが一致しません。" }, 403);
    }
    if (meta.status === "suspended") {
      return json({ ok: false, error: "このコードは現在停止中です。" }, 403);
    }
    const sales = await listSales(code, context.env);
    const clicks = await getClickCount(code, context.env);
    const stats = computeAffiliateStats(sales);
    stats.clicks = clicks;

    const referrals = sales.map((s) => ({
      date: new Date(s.createdAt || 0).toISOString().slice(0, 10),
      commission: s.commission || 0,
      status: s.status || "pending",
    }));

    return json({
      ok: true,
      code,
      name: meta.name,
      siteUrl: meta.siteUrl,
      stats,
      referrals,
    });
  } catch (error) {
    return json({ ok: false, error: error.message }, 500);
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
