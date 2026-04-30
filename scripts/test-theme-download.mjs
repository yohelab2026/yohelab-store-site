import { onRequestGet } from "../functions/api/theme-download.js";
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
        if (key !== "bunsirube.zip") return null;
        return {
          body: new Uint8Array([80, 75, 3, 4]),
          httpMetadata: { contentType: "application/zip" },
          customMetadata: { version: "0.1.3" },
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

async function requestFor({ serial, email = "buyer@example.com", purchase = "pi_test_paid" }) {
  return new Request(`https://yohelab.com/api/theme-download?serial=${encodeURIComponent(serial)}&email=${encodeURIComponent(email)}&purchase=${encodeURIComponent(purchase)}`);
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
  assert(ok.headers.get("Content-Disposition")?.includes("yohe-blog-starter.zip"), "expected attachment filename");
  assert(ok.headers.get("X-Theme-License") === "active", "expected active license header");

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
