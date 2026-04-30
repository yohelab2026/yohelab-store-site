const COOKIE_NAME = "yohelab_access";

const PRODUCT_CONFIG = {
  "research-writer": {
    label: "3キーワードの記事メーカー",
    nextPath: "/apps/research-writer/",
    activatePath: "/apps/research-writer/",
  },
  "wordpress-theme": {
    label: "文標（ぶんしるべ）",
    nextPath: "/apps/bunsirube/",      // 決済キャンセル時に戻る先
    activatePath: "/products/bunsirube/", // 購入完了後の遷移先
  },
};

function getAccessSecret(env) {
  const secret = env.ACCESS_SECRET;
  if (!secret) throw new Error("ACCESS_SECRET is not configured");
  return secret;
}

function textToBase64Url(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToText(input) {
  let base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) base64 += "=";
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function hmacBase64Url(secret, message) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  const bytes = new Uint8Array(signature);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function signPayload(payload, secret) {
  const body = textToBase64Url(JSON.stringify(payload));
  const sig = await hmacBase64Url(secret, body);
  return `${body}.${sig}`;
}

export async function verifyPayload(token, secret) {
  if (!token || typeof token !== "string") return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = await hmacBase64Url(secret, body);
  if (!(await timingSafeEqual(sig, expected))) return null;
  try {
    return JSON.parse(base64UrlToText(body));
  } catch {
    return null;
  }
}

export function readCookie(cookieHeader, name = COOKIE_NAME) {
  if (!cookieHeader) return null;
  const target = `${name}=`;
  const parts = cookieHeader.split(";").map((part) => part.trim());
  const hit = parts.find((part) => part.startsWith(target));
  return hit ? hit.slice(target.length) : null;
}

export function serializeCookie(token, maxAgeSeconds = 60 * 60 * 24 * 365, secure = true) {
  return `${COOKIE_NAME}=${token}; Path=/; Max-Age=${maxAgeSeconds}; HttpOnly;${secure ? " Secure;" : ""} SameSite=Lax`;
}

export function getProductConfig(product) {
  return PRODUCT_CONFIG[product] || null;
}

export function getAllProducts() {
  return PRODUCT_CONFIG;
}

export async function makeGrantToken({ product, subscriptionId, email }, env, now = Date.now()) {
  const secret = getAccessSecret(env);
  const issuedAt = Math.floor(now / 1000);
  return signPayload(
    {
      v: 1,
      kind: "grant",
      product,
      subscriptionId,
      email,
      issuedAt,
    },
    secret,
  );
}

export async function mergeAccessCookie(existingToken, grantToken, env) {
  const secret = getAccessSecret(env);
  const existing = existingToken ? await verifyPayload(existingToken, secret) : null;
  const grant = await verifyPayload(grantToken, secret);
  if (!grant || grant.kind !== "grant") return null;

  const merged = {
    v: 1,
    kind: "access",
    products: {},
  };

  if (existing && existing.kind === "access" && existing.products) {
    merged.products = { ...existing.products };
  }

  merged.products[grant.product] = {
    subscriptionId: grant.subscriptionId,
    email: grant.email,
    issuedAt: grant.issuedAt,
  };

  const token = await signPayload(merged, secret);
  return { token, payload: merged };
}

export async function verifyAccessCookie(cookieToken, env) {
  const secret = getAccessSecret(env);
  const payload = await verifyPayload(cookieToken, secret);
  if (!payload || payload.kind !== "access") return null;
  return payload;
}

export function isActiveStripeStatus(status) {
  return status === "active" || status === "trialing";
}

export async function fetchStripeSubscription(subscriptionId, env) {
  const key = (env.STRIPE_SECRET_KEY || "").trim();
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  const response = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
    headers: {
      Authorization: `Bearer ${key}`,
    },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Stripe subscription lookup failed: ${response.status} ${text}`);
  }
  return response.json();
}

export function getGrantNextPath(product) {
  return getProductConfig(product)?.nextPath || "/";
}

export function getGrantLabel(product) {
  return getProductConfig(product)?.label || product;
}

export async function makeSerial({ product, email, subscriptionId }, env) {
  const secret = getAccessSecret(env);
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const source = `${product}|${normalizedEmail}|${subscriptionId || ""}`;
  const digest = await hmacBase64Url(secret, source);
  const body = digest.replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, 16);
  return `AIO-${body.slice(0, 4)}-${body.slice(4, 8)}-${body.slice(8, 12)}-${body.slice(12, 16)}`;
}

export async function verifySerial({ serial, product, email, subscriptionId }, env) {
  if (!serial || !product || !email || !subscriptionId) return false;
  const expected = await makeSerial({ product, email, subscriptionId }, env);
  return serial.trim().toUpperCase() === expected;
}
