import { makeSerial } from "../lib/entitlements.js";

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
  return {
    active: status === "paid" || status === "succeeded",
    status,
    currentPeriodEnd: null,
  };
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
