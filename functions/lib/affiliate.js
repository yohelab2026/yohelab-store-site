import { hmacBase64Url } from "./entitlements.js";

export const AFFILIATE_COMMISSION_RATE = 0.5;
export const AFFILIATE_COMMISSION_AMOUNT = 2750; // 50% of 5500
export const AFFILIATE_PRODUCT_AMOUNT = 5500;
export const AFFILIATE_ATTRIBUTION_DAYS = 30;
export const AFFILIATE_MIN_PAYOUT = 3000;
export const AFFILIATE_REFUND_WINDOW_DAYS = 30;

const AFFILIATE_KV_PREFIX = "aff";

function getSecret(env) {
  const secret = env.ACCESS_SECRET || env.AFFILIATE_SECRET;
  if (!secret) throw new Error("ACCESS_SECRET is not configured");
  return secret;
}

export async function makeAffiliateCode(email, env) {
  const normalized = String(email || "").trim().toLowerCase();
  if (!normalized) throw new Error("email required");
  const digest = await hmacBase64Url(getSecret(env), `affiliate|${normalized}`);
  const body = digest.replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, 8);
  return `AFF-${body.slice(0, 4)}-${body.slice(4, 8)}`;
}

export function getKv(env) {
  const kv = env.BLOG_KV;
  if (!kv || typeof kv.get !== "function") return null;
  return kv;
}

function metaKey(code) {
  return `${AFFILIATE_KV_PREFIX}:meta:${code}`;
}

function saleKey(code, purchaseId) {
  return `${AFFILIATE_KV_PREFIX}:sale:${code}:${purchaseId}`;
}

function clickKey(code) {
  return `${AFFILIATE_KV_PREFIX}:clicks:${code}`;
}

export async function getAffiliateMeta(code, env) {
  const kv = getKv(env);
  if (!kv) return null;
  const raw = await kv.get(metaKey(code));
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function setAffiliateMeta(code, meta, env) {
  const kv = getKv(env);
  if (!kv) throw new Error("BLOG_KV is not configured");
  await kv.put(metaKey(code), JSON.stringify(meta));
}

export async function recordClick(code, env) {
  const kv = getKv(env);
  if (!kv) return;
  const current = parseInt((await kv.get(clickKey(code))) || "0", 10);
  await kv.put(clickKey(code), String(current + 1));
}

export async function getClickCount(code, env) {
  const kv = getKv(env);
  if (!kv) return 0;
  return parseInt((await kv.get(clickKey(code))) || "0", 10);
}

export async function recordSale({ code, purchaseId, amount, email, createdAt }, env) {
  const kv = getKv(env);
  if (!kv) throw new Error("BLOG_KV is not configured");
  const commission = Math.floor((amount || AFFILIATE_PRODUCT_AMOUNT) * AFFILIATE_COMMISSION_RATE);
  const sale = {
    purchaseId,
    amount: amount || AFFILIATE_PRODUCT_AMOUNT,
    commission,
    email: String(email || "").toLowerCase(),
    createdAt: createdAt || Date.now(),
    status: "pending", // pending → confirmed (after refund window) → refunded
  };
  await kv.put(saleKey(code, purchaseId), JSON.stringify(sale));
  return sale;
}

export async function listSales(code, env) {
  const kv = getKv(env);
  if (!kv) return [];
  const prefix = `${AFFILIATE_KV_PREFIX}:sale:${code}:`;
  const list = await kv.list({ prefix });
  const sales = [];
  for (const k of list.keys || []) {
    const raw = await kv.get(k.name);
    if (raw) {
      try {
        sales.push(JSON.parse(raw));
      } catch {}
    }
  }
  // newest first
  sales.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  return sales;
}

export function computeAffiliateStats(sales, now = Date.now()) {
  const refundWindowMs = AFFILIATE_REFUND_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  let confirmed = 0;
  let pending = 0;
  let refunded = 0;
  let payoutDue = 0;

  for (const s of sales) {
    if (s.status === "refunded") {
      refunded += 1;
      continue;
    }
    const isOlderThanRefundWindow = (now - (s.createdAt || 0)) >= refundWindowMs;
    if (s.status === "confirmed" || isOlderThanRefundWindow) {
      confirmed += 1;
      payoutDue += s.commission || 0;
    } else {
      pending += 1;
    }
  }

  return { confirmed, pending, refunded, payoutDue, total: sales.length };
}
