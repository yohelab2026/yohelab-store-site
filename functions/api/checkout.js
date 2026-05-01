import { getProductConfig } from "../lib/entitlements.js";

const PRODUCT_PAYMENT_LINKS = {
  "research-writer": "https://buy.stripe.com/aFa4gr6jd6Pu4KC7eV73G0d?client_reference_id=research-writer",
  "wordpress-theme": "https://buy.stripe.com/bJeaEPfTN2ze2Cubvb73G0e?client_reference_id=wordpress-theme",
  "page-review": "https://buy.stripe.com/bJedR10YTddS4KC42J73G0f?client_reference_id=page-review",
};

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const product = url.searchParams.get("product") || "research-writer";
  const config = getProductConfig(product);

  if (!config) {
    return redirect("/contact/");
  }

  const paymentLink = PRODUCT_PAYMENT_LINKS[product];
  if (paymentLink) {
    return redirect(paymentLink);
  }

  const priceEnv = `STRIPE_${product.toUpperCase().replace(/-/g, "_")}_PRICE_ID`;
  const priceId = context.env[priceEnv];
  const stripeKey = context.env.STRIPE_SECRET_KEY;
  if (!priceId || !stripeKey) {
    return redirect(`/contact/#${product}`);
  }

  const siteUrl = (context.env.SITE_URL || `${url.protocol}//${url.host}`).replace(/\/$/, "");
  const isTheme = product === "wordpress-theme";
  const body = new URLSearchParams({
    mode: isTheme ? "payment" : "subscription",
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    client_reference_id: product,
    success_url: `${siteUrl}/pro/activate-pending/?product=${encodeURIComponent(product)}`,
    cancel_url: `${siteUrl}${config.nextPath}`,
    allow_promotion_codes: "true",
  });

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    return redirect(`/contact/#${product}`);
  }

  const session = await response.json();
  return redirect(session.url || `/contact/#${product}`);
}

function redirect(location) {
  return new Response(null, {
    status: 302,
    headers: { Location: location },
  });
}

