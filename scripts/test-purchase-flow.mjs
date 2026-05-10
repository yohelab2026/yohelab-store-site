import { onRequestPost as onStripeWebhookPost } from "../functions/api/stripe-webhook.js";
import { onRequestPost as onThemeLicensePost } from "../functions/api/theme-license.js";
import { onRequestGet as onThemeDownloadGet } from "../functions/api/theme-download.js";
import { listSales, recordSale } from "../functions/lib/affiliate.js";

const originalFetch = globalThis.fetch;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function env() {
  return {
    ACCESS_SECRET: "test-access-secret",
    STRIPE_WEBHOOK_SECRET: "whsec_test",
    STRIPE_SECRET_KEY: "sk_test_dummy",
    RESEND_API_KEY: "re_test_dummy",
    RESEND_FROM_EMAIL: "よへラボ <noreply@example.com>",
    SITE_URL: "https://yohelab.com",
    THEME_BUCKET: {
      async get(key) {
        if (!["bunsirube-0.3.3.zip", "bunsirube-child-0.1.1.zip"].includes(key)) return null;
        return {
          body: new Uint8Array([80, 75, 3, 4]),
          httpMetadata: { contentType: "application/zip" },
          customMetadata: { version: key === "bunsirube-child-0.1.1.zip" ? "0.1.1" : "0.3.3" },
        };
      },
    },
  };
}

function makeKv() {
  const store = new Map();
  return {
    async get(key) {
      return store.has(key) ? store.get(key) : null;
    },
    async put(key, value) {
      store.set(key, String(value));
    },
    async list({ prefix = "" } = {}) {
      return {
        keys: Array.from(store.keys())
          .filter((name) => name.startsWith(prefix))
          .map((name) => ({ name })),
      };
    },
  };
}

async function hmacHex(secret, message) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function signedStripeRequest(event, secret) {
  const body = JSON.stringify(event);
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = await hmacHex(secret, `${timestamp}.${body}`);
  return new Request("https://yohelab.com/api/stripe-webhook", {
    method: "POST",
    headers: { "Stripe-Signature": `t=${timestamp},v1=${signature}` },
    body,
  });
}

function extract(text, pattern, message) {
  const match = text.match(pattern);
  assert(match, message);
  return match[1];
}

try {
  let sentEmail = null;
  let stripeRefunded = false;
  globalThis.fetch = async (url, options = {}) => {
    const href = String(url);
    if (href === "https://api.resend.com/emails") {
      sentEmail = JSON.parse(options.body);
      return new Response(JSON.stringify({ id: "email_test_123" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (href.includes("https://api.stripe.com/v1/payment_intents/pi_test_paid")) {
      return new Response(JSON.stringify({
        status: "succeeded",
        amount_received: 5500,
        latest_charge: {
          refunded: stripeRefunded,
          amount_refunded: stripeRefunded ? 5500 : 0,
        },
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    throw new Error(`Unexpected fetch: ${href}`);
  };

  const event = {
    id: "evt_test_theme_purchase",
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_test_theme",
        client_reference_id: "wordpress-theme",
        payment_intent: "pi_test_paid",
        customer_details: { email: "buyer@example.com" },
      },
    },
  };

  const webhook = await onStripeWebhookPost({
    request: await signedStripeRequest(event, env().STRIPE_WEBHOOK_SECRET),
    env: env(),
  });
  const webhookJson = await webhook.json();
  assert(webhook.status === 200, `expected webhook 200, got ${webhook.status}`);
  assert(webhookJson.emailed === true && webhookJson.product === "wordpress-theme", "expected emailed wordpress-theme");
  assert(sentEmail?.to === "buyer@example.com", "expected buyer email recipient");
  assert(sentEmail.subject.includes("文標") && sentEmail.subject.includes("シリアル"), "expected subject with serial");

  const serial = extract(sentEmail.text, /(BUN-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4})/, "serial missing from email");
  const downloadUrl = extract(sentEmail.text, /(https:\/\/yohelab\.com\/api\/theme-download\?serial=[^\s]+)/, "download url missing from email");
  assert(downloadUrl.includes("purchase=pi_test_paid"), "download url must include purchase id");
  assert(downloadUrl.includes("email=buyer%40example.com"), "download url must include buyer email");
  assert(sentEmail.text.includes("改造用子テーマZIP"), "child theme url missing from email");

  const form = new FormData();
  form.set("serial", serial);
  form.set("email", "buyer@example.com");
  form.set("purchase", "pi_test_paid");
  const license = await onThemeLicensePost({
    request: new Request("https://yohelab.com/api/theme-license", { method: "POST", body: form }),
    env: env(),
  });
  const licenseJson = await license.json();
  assert(licenseJson.active === true, "expected generated serial to activate");
  assert(licenseJson.purchaseStatus === "succeeded", "expected succeeded purchase status");
  assert(licenseJson.downloadToken, "expected signed download token");

  const tokenDownload = await onThemeDownloadGet({
    request: new Request(`https://yohelab.com/api/theme-download?token=${encodeURIComponent(licenseJson.downloadToken)}`),
    env: env(),
  });
  assert(tokenDownload.status === 200, `expected token download 200, got ${tokenDownload.status}`);
  assert(tokenDownload.headers.get("Content-Disposition")?.includes("bunsirube-0.3.3.zip"), "expected latest parent zip");

  stripeRefunded = true;
  const refundedLicense = await onThemeLicensePost({
    request: new Request("https://yohelab.com/api/theme-license", { method: "POST", body: form }),
    env: env(),
  });
  const refundedLicenseJson = await refundedLicense.json();
  assert(refundedLicenseJson.active === false, "expected refunded purchase to deactivate license");

  const refundedTokenDownload = await onThemeDownloadGet({
    request: new Request(`https://yohelab.com/api/theme-download?token=${encodeURIComponent(licenseJson.downloadToken)}`),
    env: env(),
  });
  assert(refundedTokenDownload.status === 403, `expected refunded token download 403, got ${refundedTokenDownload.status}`);
  stripeRefunded = false;

  const badForm = new FormData();
  badForm.set("serial", "BUN-BAD0-BAD0-BAD0-BAD0");
  badForm.set("email", "buyer@example.com");
  badForm.set("purchase", "pi_test_paid");
  const badLicense = await onThemeLicensePost({
    request: new Request("https://yohelab.com/api/theme-license", { method: "POST", body: badForm }),
    env: env(),
  });
  const badLicenseJson = await badLicense.json();
  assert(badLicenseJson.active === false && badLicenseJson.reason === "invalid_serial", "expected invalid serial rejection");

  const badSignature = await onStripeWebhookPost({
    request: new Request("https://yohelab.com/api/stripe-webhook", {
      method: "POST",
      headers: { "Stripe-Signature": "t=1,v1=bad" },
      body: JSON.stringify(event),
    }),
    env: env(),
  });
  assert(badSignature.status === 400, `expected bad signature 400, got ${badSignature.status}`);

  const affiliateEnv = { ...env(), BLOG_KV: makeKv() };
  await recordSale({
    code: "AFF-TEST-0001",
    purchaseId: "pi_test_paid",
    amount: 5500,
    email: "buyer@example.com",
    createdAt: Date.now(),
  }, affiliateEnv);
  const refundEvent = {
    id: "evt_test_refund",
    type: "charge.refunded",
    data: {
      object: {
        id: "ch_test_paid",
        payment_intent: "pi_test_paid",
        amount: 5500,
        amount_refunded: 5500,
        refunded: true,
      },
    },
  };
  const refundWebhook = await onStripeWebhookPost({
    request: await signedStripeRequest(refundEvent, affiliateEnv.STRIPE_WEBHOOK_SECRET),
    env: affiliateEnv,
  });
  const refundJson = await refundWebhook.json();
  assert(refundJson.affiliateRefunded === true, "expected refund webhook to mark affiliate sale refunded");
  const sales = await listSales("AFF-TEST-0001", affiliateEnv);
  assert(sales[0]?.status === "refunded", "expected affiliate sale status refunded");

  console.log("purchase-flow tests passed");
} finally {
  globalThis.fetch = originalFetch;
}
