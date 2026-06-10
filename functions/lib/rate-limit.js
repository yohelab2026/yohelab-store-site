const RATE_LIMIT_KV_PREFIX = "rl";

export function getClientIp(request) {
  return (
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For") ||
    "unknown"
  );
}

function getKv(env) {
  const kv = env.BLOG_KV;
  if (!kv || typeof kv.get !== "function") return null;
  return kv;
}

export async function rateLimitOk(env, bucket, ip, { limit = 30, windowSec = 3600 } = {}) {
  const kv = getKv(env);
  if (!kv) return true;

  const safeIp = String(ip || "unknown").slice(0, 64).replace(/[^0-9a-f.:%-]/gi, "_");
  const safeBucket = String(bucket || "default").replace(/[^a-z0-9_-]/gi, "_");
  const slot = Math.floor(Date.now() / 1000 / windowSec);
  const key = `${RATE_LIMIT_KV_PREFIX}:${safeBucket}:${safeIp}:${slot}`;

  try {
    const current = parseInt((await kv.get(key)) || "0", 10);
    if (current >= limit) return false;
    await kv.put(key, String(current + 1), { expirationTtl: windowSec + 60 });
    return true;
  } catch {
    return true;
  }
}
