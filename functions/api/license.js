import { fetchStripeSubscription, getProductConfig, isActiveStripeStatus, readCookie, verifyAccessCookie } from "../lib/entitlements.js";

export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const product = url.searchParams.get("product");
    if (!product || !getProductConfig(product)) {
      return json({ active: false, reason: "unknown_product" });
    }

    const cookieToken = readCookie(context.request.headers.get("Cookie"));
    if (!cookieToken) {
      return json({ active: false, product });
    }

    const access = await verifyAccessCookie(cookieToken, context.env);
    // all-tools バンドル購入者は個別ツールでも有効とみなす
    const grant = access?.products?.[product] || access?.products?.["all-tools"];
    if (!grant) {
      return json({ active: false, product });
    }
    const subscription = await fetchStripeSubscription(grant.subscriptionId, context.env);
    const active = isActiveStripeStatus(subscription.status);

    return json({
      active,
      product,
      subscriptionStatus: subscription.status,
      currentPeriodEnd: subscription.current_period_end ?? null,
      customerEmail: grant.email ?? null,
    });
  } catch (error) {
    return json({ active: false, error: error.message }, 200);
  }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
