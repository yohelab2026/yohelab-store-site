import { makeSerial } from "../lib/entitlements.js";

export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const serial = (url.searchParams.get("serial") || "").trim().toUpperCase();
    const email = (url.searchParams.get("email") || "").trim().toLowerCase();
    const purchaseId = (url.searchParams.get("purchase") || "").trim();
    const product = "wordpress-theme";

    if (!serial || !email || !purchaseId) {
      return text("missing license fields", 400);
    }

    const expected = await makeSerial({ product, email, subscriptionId: purchaseId }, context.env);
    if (serial !== expected) {
      return text("invalid serial", 403);
    }

    const status = await fetchStripePurchaseStatus(purchaseId, context.env);
    if (!status.active) {
      return text("inactive purchase", 403);
    }

    // R2 binding が設定されていればバケットから直接配信（推奨）
    if (context.env.THEME_BUCKET) {
      const obj = await context.env.THEME_BUCKET.get("aio-starter.zip");
      if (obj) {
        return new Response(obj.body, {
          headers: {
            "Content-Type": "application/zip",
            "Content-Disposition": 'attachment; filename="aio-starter.zip"',
            "Cache-Control": "no-store",
          },
        });
      }
      // R2 にファイルがない場合は THEME_DOWNLOAD_URL へフォールバック
    }

    // フォールバック: THEME_DOWNLOAD_URL へリダイレクト
    const downloadUrl = context.env.THEME_DOWNLOAD_URL;
    if (!downloadUrl) {
      return text("THEME_DOWNLOAD_URL is not configured", 503);
    }

    return new Response(null, {
      status: 302,
      headers: {
        Location: downloadUrl,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return text(error.message, 500);
  }
}

async function fetchStripePurchaseStatus(purchaseId, env) {
  const key = (env.STRIPE_SECRET_KEY || "").trim();
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  const endpoint = purchaseId.startsWith("pi_")
    ? `https://api.stripe.com/v1/payment_intents/${purchaseId}`
    : `https://api.stripe.com/v1/checkout/sessions/${purchaseId}`;
  const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${key}` } });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Stripe purchase lookup failed: ${response.status} ${text}`);
  }
  const data = await response.json();
  const status = data.payment_status || data.status;
  return { active: status === "paid" || status === "succeeded", status };
}

function text(body, status = 200) {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
