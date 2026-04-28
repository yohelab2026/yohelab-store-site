/**
 * GET  /api/blog-image?key=xxx  → 画像を返す
 * POST /api/blog-image           → 画像をアップロードして URL を返す（PIN認証必須）
 */

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 4 * 1024 * 1024; // 4MB

export async function onRequestGet(context) {
  const kv = context.env.BLOG_KV;
  if (!kv) return new Response("Not configured", { status: 500 });

  const key = new URL(context.request.url).searchParams.get("key") || "";
  if (!key) return new Response("Not found", { status: 404 });

  const entry = await kv.getWithMetadata(`img:${key}`, { type: "arrayBuffer" });
  if (!entry.value) return new Response("Not found", { status: 404 });

  const contentType = entry.metadata?.contentType || "image/jpeg";
  return new Response(entry.value, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

export async function onRequestPost(context) {
  const kv = context.env.BLOG_KV;
  if (!kv) return json({ error: "BLOG_KV is not configured" }, 500);

  // PIN 認証
  const requestPin = String(
    context.request.headers.get("x-yohelab-pin") || "",
  ).trim();
  const storedPin = await kv.get("config:pin");
  if (!storedPin || requestPin !== storedPin) {
    return json({ error: "unauthorized" }, 401);
  }

  const contentType = context.request.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return json({ error: "multipart required" }, 400);
  }

  const formData = await context.request.formData();
  const file = formData.get("file");

  if (!file || typeof file === "string") return json({ error: "no file" }, 400);
  if (!ALLOWED_TYPES.includes(file.type)) return json({ error: "unsupported type" }, 400);

  const buffer = await file.arrayBuffer();
  if (buffer.byteLength > MAX_BYTES) return json({ error: "too large (max 4MB)" }, 400);

  const key = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await kv.put(`img:${key}`, buffer, {
    metadata: { contentType: file.type, name: file.name || key },
    expirationTtl: 60 * 60 * 24 * 365 * 5, // 5年
  });

  const url = `/api/blog-image?key=${key}`;
  return json({ ok: true, url, key });
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
