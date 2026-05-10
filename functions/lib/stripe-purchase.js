export async function fetchStripePurchaseStatus(purchaseId, env) {
  const key = (env.STRIPE_SECRET_KEY || "").trim();
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");

  const endpoint = purchaseId.startsWith("pi_")
    ? `https://api.stripe.com/v1/payment_intents/${purchaseId}?expand[]=latest_charge`
    : `https://api.stripe.com/v1/checkout/sessions/${purchaseId}?expand[]=payment_intent.latest_charge`;

  const response = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${key}` },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Stripe purchase lookup failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  const status = data.payment_status || data.status;
  const charge = getLatestCharge(data);
  const amount = Number(
    data.amount_received ||
    data.amount ||
    data.amount_total ||
    data.payment_intent?.amount_received ||
    data.payment_intent?.amount ||
    0,
  );
  const amountRefunded = Number(charge?.amount_refunded || 0);
  const fullyRefunded = charge?.refunded === true || (amount > 0 && amountRefunded >= amount);

  return {
    active: (status === "paid" || status === "succeeded") && !fullyRefunded,
    status: fullyRefunded ? `${status || "unknown"}:refunded` : status,
    amount,
    amountRefunded,
  };
}

function getLatestCharge(data) {
  if (data?.latest_charge && typeof data.latest_charge === "object") return data.latest_charge;
  if (data?.payment_intent?.latest_charge && typeof data.payment_intent.latest_charge === "object") {
    return data.payment_intent.latest_charge;
  }
  if (Array.isArray(data?.charges?.data) && data.charges.data[0]) return data.charges.data[0];
  if (Array.isArray(data?.payment_intent?.charges?.data) && data.payment_intent.charges.data[0]) {
    return data.payment_intent.charges.data[0];
  }
  return null;
}
