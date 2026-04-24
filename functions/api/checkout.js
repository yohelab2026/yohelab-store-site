import { getProductConfig } from "../lib/entitlements.js";

const PRODUCT_PRICE_ENV = {
  "research-writer": "STRIPE_RESEARCH_WRITER_PRICE_ID",
  "wordpress-theme": "STRIPE_WORDPRESS_THEME_PRICE_ID",
};

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const product = url.searchParams.get("product") || "research-writer";
  const config = getProductConfig(product);

  if (!config) {
    return redirect("/contact/");
  }

  const priceId = context.env[PRODUCT_PRICE_ENV[product]];
  const stripeKey = context.env.STRIPE_SECRET_KEY;
  if (!priceId || !stripeKey) {
    return redirect(`/contact/#${product}`);
  }

  const siteUrl = (context.env.SITE_URL || `${url.protocol}//${url.host}`).replace(/\/$/, "");
  const body = new URLSearchParams({
    mode: "subscription",
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
