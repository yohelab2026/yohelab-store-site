import { makeSerial } from "../lib/entitlements.js";
import { fetchStripePurchaseStatus } from "../lib/stripe-purchase.js";

export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const serial = (url.searchParams.get("serial") || "").trim().toUpperCase();
    const email = (url.searchParams.get("email") || "").trim().toLowerCase();
    const purchaseId = (url.searchParams.get("purchase") || "").trim();
    const product = "wordpress-theme";

    if (!serial || !email || !purchaseId) {
      return json({ active: false, reason: "missing_fields" });
    }

    const expected = await makeSerial({ product, email, subscriptionId: purchaseId }, context.env);
    if (serial !== expected) {
      return json({ active: false, reason: "invalid_serial" });
    }

    const status = await fetchStripePurchaseStatus(purchaseId, context.env);
    const active = status.active;

    return json({
      active,
      product,
      serial,
      customerEmail: email,
      purchaseStatus: status.status,
      currentPeriodEnd: status.currentPeriodEnd,
    });
  } catch (error) {
    return json({ active: false, error: error.message }, 200);
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
