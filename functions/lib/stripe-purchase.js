export async function fetchStripePurchaseStatus(purchaseId, env) {
  const key = (env.STRIPE_SECRET_KEY || "").trim();
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");

  const endpoint = purchaseId.startsWith("pi_")
    ? `https://api.stripe.com/v1/payment_intents/${purchaseId}`
    : `https://api.stripe.com/v1/checkout/sessions/${purchaseId}`;

  const response = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${key}` },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Stripe purchase lookup failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  const status = data.payment_status || data.status;
  return {
    active: status === "paid" || status === "succeeded",
    status,
  };
}
