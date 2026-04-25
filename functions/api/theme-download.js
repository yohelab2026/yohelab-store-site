import { makeSerial } from "../lib/entitlements.js";
import { fetchStripePurchaseStatus } from "../lib/stripe-purchase.js";

const THEME_ZIP_KEY = "aio-starter.zip";

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

    const bucket = context.env.THEME_BUCKET;
    if (!bucket || typeof bucket.get !== "function") {
      return text("THEME_BUCKET binding is not configured", 503);
    }

    const obj = await bucket.get(THEME_ZIP_KEY);
    if (!obj) {
      return text("theme zip not found", 404);
    }

    return new Response(obj.body, {
      headers: {
        "Content-Type": obj.httpMetadata?.contentType || "application/zip",
        "Content-Disposition": 'attachment; filename="aio-starter.zip"',
        "Cache-Control": "no-store",
        "X-Theme-License": "active",
        "X-Theme-Version": obj.customMetadata?.version || "unknown",
      },
    });
  } catch (error) {
    return text(error.message, 500);
  }
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
