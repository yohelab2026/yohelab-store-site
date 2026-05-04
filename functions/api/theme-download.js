import { makeSerial, verifyPayload } from "../lib/entitlements.js";
import { fetchStripePurchaseStatus } from "../lib/stripe-purchase.js";

const THEME_FILES = {
  parent: {
    key: "bunsirube-0.3.1.zip",
    filename: "bunsirube-0.3.1.zip",
  },
  child: {
    key: "bunsirube-child-0.1.1.zip",
    filename: "bunsirube-child-0.1.1.zip",
  },
};

export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const token = (url.searchParams.get("token") || "").trim();
    const serial = (url.searchParams.get("serial") || "").trim().toUpperCase();
    const email = (url.searchParams.get("email") || "").trim().toLowerCase();
    const purchaseId = (url.searchParams.get("purchase") || "").trim();
    const variant = url.searchParams.get("variant") === "child" ? "child" : "parent";
    const themeFile = THEME_FILES[variant];
    const product = "wordpress-theme";

    let license = { serial, email, purchaseId };
    if (token) {
      const payload = await verifyPayload(token, context.env.ACCESS_SECRET);
      if (!payload || payload.kind !== "theme_download" || payload.product !== product || payload.exp < Math.floor(Date.now() / 1000)) {
        return text("invalid download token", 403);
      }
      license = {
        serial: String(payload.serial || "").trim().toUpperCase(),
        email: String(payload.email || "").trim().toLowerCase(),
        purchaseId: String(payload.purchaseId || "").trim(),
      };
    }

    if (!license.serial || !license.email || !license.purchaseId) {
      return text("missing license fields", 400);
    }

    const expected = await makeSerial({ product, email: license.email, subscriptionId: license.purchaseId }, context.env);
    if (license.serial !== expected) {
      return text("invalid serial", 403);
    }

    const status = await fetchStripePurchaseStatus(license.purchaseId, context.env);
    if (!status.active) {
      return text("inactive purchase", 403);
    }

    const bucket = context.env.THEME_BUCKET;
    if (!bucket || typeof bucket.get !== "function") {
      return text("THEME_BUCKET binding is not configured", 503);
    }

    const obj = await bucket.get(themeFile.key);
    if (!obj) {
      return text("theme zip not found", 404);
    }

    return new Response(obj.body, {
      headers: {
        "Content-Type": obj.httpMetadata?.contentType || "application/zip",
        "Content-Disposition": `attachment; filename="${themeFile.filename}"`,
        "Cache-Control": "no-store",
        "X-Theme-License": "active",
        "X-Theme-Package": variant,
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
