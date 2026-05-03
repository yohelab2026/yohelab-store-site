import { onRequestGet } from "../functions/api/theme-download.js";
import { onRequestPost as onThemeLicensePost } from "../functions/api/theme-license.js";
import { makeSerial } from "../functions/lib/entitlements.js";

const originalFetch = globalThis.fetch;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function makeEnv({ paid = true, bucket = true } = {}) {
  const env = {
    ACCESS_SECRET: "test-secret",
    STRIPE_SECRET_KEY: "sk_test_dummy",
  };

  if (bucket) {
    env.THEME_BUCKET = {
      async get(key) {
        if (!["bunsirube-0.3.0.zip", "bunsirube-child-0.1.1.zip"].includes(key)) return null;
        return {
          body: new Uint8Array([80, 75, 3, 4]),
          httpMetadata: { contentType: "application/zip" },
          customMetadata: { version: key === "bunsirube-child-0.1.1.zip" ? "0.1.1" : "0.3.0" },
        };
      },
    };
  }

  globalThis.fetch = async (url) => {
    assert(String(url).includes("payment_intents/pi_test_paid"), "Stripe lookup must use payment intent");
    return new Response(JSON.stringify({ status: paid ? "succeeded" : "requires_payment_method" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  return env;
}

async function requestFor({ serial, email = "buyer@example.com", purchase = "pi_test_paid", variant = "" }) {
  const extra = variant ? `&variant=${encodeURIComponent(variant)}` : "";
  return new Request(`https://yohelab.com/api/theme-download?serial=${encodeURIComponent(serial)}&email=${encodeURIComponent(email)}&purchase=${encodeURIComponent(purchase)}${extra}`);
}

try {
  const serial = await makeSerial({
    product: "wordpress-theme",
    email: "buyer@example.com",
    subscriptionId: "pi_test_paid",
  }, { ACCESS_SECRET: "test-secret" });

  const ok = await onRequestGet({ request: await requestFor({ serial }), env: makeEnv() });
  assert(ok.status === 200, `expected 200, got ${ok.status}`);
  assert(ok.headers.get("Content-Type") === "application/zip", "expected zip content type");
  assert(ok.headers.get("Content-Disposition")?.includes("bunsirube-0.3.0.zip"), "expected attachment filename");
  assert(ok.headers.get("X-Theme-License") === "active", "expected active license header");
  assert(ok.headers.get("X-Theme-Package") === "parent", "expected parent package header");

  const child = await onRequestGet({ request: await requestFor({ serial, variant: "child" }), env: makeEnv() });
  assert(child.status === 200, `expected child 200, got ${child.status}`);
  assert(child.headers.get("Content-Disposition")?.includes("bunsirube-child-0.1.1.zip"), "expected child attachment filename");
  assert(child.headers.get("X-Theme-Package") === "child", "expected child package header");

  const form = new FormData();
  form.set("serial", serial);
  form.set("email", "buyer@example.com");
  form.set("purchase", "pi_test_paid");
  const license = await onThemeLicensePost({
    request: new Request("https://yohelab.com/api/theme-license", { method: "POST", body: form }),
    env: makeEnv(),
  });
  const licenseJson = await license.json();
  assert(licenseJson.active === true, "expected active license");
  assert(typeof licenseJson.downloadToken === "string" && licenseJson.downloadToken.length > 20, "expected download token");

  const tokenDownload = await onRequestGet({
    request: new Request(`https://yohelab.com/api/theme-download?token=${encodeURIComponent(licenseJson.downloadToken)}`),
    env: makeEnv(),
  });
  assert(tokenDownload.status === 200, `expected token download 200, got ${tokenDownload.status}`);

  const invalid = await onRequestGet({ request: await requestFor({ serial: "BUN-BAD0-BAD0-BAD0-BAD0" }), env: makeEnv() });
  assert(invalid.status === 403, `expected invalid serial 403, got ${invalid.status}`);

  const missingBucket = await onRequestGet({ request: await requestFor({ serial }), env: makeEnv({ bucket: false }) });
  assert(missingBucket.status === 503, `expected missing bucket 503, got ${missingBucket.status}`);

  const unpaid = await onRequestGet({ request: await requestFor({ serial }), env: makeEnv({ paid: false }) });
  assert(unpaid.status === 403, `expected unpaid 403, got ${unpaid.status}`);

  console.log("theme-download tests passed");
} finally {
  globalThis.fetch = originalFetch;
}
