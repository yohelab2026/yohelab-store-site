import { getProductConfig } from "../lib/entitlements.js";
import { isBunsirubeFormalPriceActive } from "../lib/bunsirube-pricing.js";

const PRODUCT_PAYMENT_LINKS = {
  "research-writer": "https://buy.stripe.com/aFa4gr6jd6Pu4KC7eV73G0d?client_reference_id=research-writer",
  "page-review": "https://buy.stripe.com/bJedR10YTddS4KC42J73G0f?client_reference_id=page-review",
};

const WORDPRESS_THEME_EARLY_PAYMENT_LINK = "https://buy.stripe.com/bJeaEPfTN2ze2Cubvb73G0e?client_reference_id=wordpress-theme";
const WORDPRESS_THEME_FORMAL_PAYMENT_LINK = "https://buy.stripe.com/5kQ9ALePJddS2Cu9n373G0g";
const AFFILIATE_REF_RE = /^AFF-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const product = url.searchParams.get("product") || "research-writer";
  const config = getProductConfig(product);

  if (!config) {
    return redirect("/contact/");
  }

  const affiliateRef = getAffiliateRef(context.request, url);
  const formalPriceActive = product === "wordpress-theme" && isBunsirubeFormalPriceActive();
  const paymentLink = getPaymentLink(product, context.env, formalPriceActive);
  if (paymentLink) {
    return redirect(withClientReference(paymentLink, product, affiliateRef));
  }

  const priceId = getPriceId(product, context.env, formalPriceActive);
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
    client_reference_id: affiliateRef ? `${product}:${affiliateRef}` : product,
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

function getPaymentLink(product, env, formalPriceActive) {
  if (product !== "wordpress-theme") {
    return PRODUCT_PAYMENT_LINKS[product];
  }

  if (formalPriceActive) {
    // Avoid sending customers to the old ¥5,500 Payment Link after the formal release date.
    return (
      env.BUNSIRUBE_PAYMENT_LINK_8800 ||
      env.WORDPRESS_THEME_PAYMENT_LINK_8800 ||
      env.STRIPE_WORDPRESS_THEME_PAYMENT_LINK_8800 ||
      WORDPRESS_THEME_FORMAL_PAYMENT_LINK
    );
  }

  return (
    env.BUNSIRUBE_PAYMENT_LINK_5500 ||
    env.WORDPRESS_THEME_PAYMENT_LINK_5500 ||
    WORDPRESS_THEME_EARLY_PAYMENT_LINK
  );
}

function getPriceId(product, env, formalPriceActive) {
  if (product === "wordpress-theme" && formalPriceActive) {
    return (
      env.STRIPE_WORDPRESS_THEME_PRICE_ID_8800 ||
      env.STRIPE_BUNSIRUBE_PRICE_ID_8800 ||
      ""
    );
  }

  const priceEnv = `STRIPE_${product.toUpperCase().replace(/-/g, "_")}_PRICE_ID`;
  return env[priceEnv] || "";
}

function getAffiliateRef(request, url) {
  const fromUrl = String(url.searchParams.get("ref") || "").trim().toUpperCase();
  if (AFFILIATE_REF_RE.test(fromUrl)) return fromUrl;

  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/(?:^|;\s*)yohelab_aff=([^;]+)/);
  const fromCookie = match ? decodeURIComponent(match[1]).trim().toUpperCase() : "";
  return AFFILIATE_REF_RE.test(fromCookie) ? fromCookie : "";
}

function withClientReference(paymentLink, product, affiliateRef) {
  try {
    const target = new URL(paymentLink);
    const current = target.searchParams.get("client_reference_id") || product;
    const base = current.replace(/:AFF-[A-Z0-9-]+$/i, "") || product;
    target.searchParams.set("client_reference_id", affiliateRef ? `${base}:${affiliateRef}` : base);
    return target.toString();
  } catch {
    return paymentLink;
  }
}

function redirect(location) {
  return new Response(null, {
    status: 302,
    headers: { Location: location },
  });
}

