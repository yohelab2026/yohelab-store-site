import { getBlogPin, isValidPin, timingSafeEqual } from "../lib/blog-auth.js";

const TRASH_TTL_SECONDS = 60 * 60 * 24 * 30;

export async function onRequestGet(context) {
  try {
    if (!isAllowedOrigin(context.request)) return json({ error: "forbidden_origin" }, 403, context.request);
    const kv = context.env.BLOG_KV;
    if (!kv) return json({ error: "BLOG_KV is not configured" }, 500, context.request);
    const authError = authorize(context);
    if (authError) return authError;

    const url = new URL(context.request.url);
    const trashId = sanitizeTrashId(url.searchParams.get("id"));
    if (trashId) {
      const entry = await kv.get(`trash:${trashId}`, { type: "json" });
      if (!entry) return json({ error: "not_found" }, 404, context.request);
      return json({ entry }, 200, context.request);
    }

    const items = [];
    let cursor;
    do {
      const list = await kv.list({ prefix: "trash:", cursor, limit: 100 });
      items.push(...(list.keys || []).map((key) => ({
        trashId: key.name.replace(/^trash:/, ""),
        type: key.metadata?.type || "",
        originalId: key.metadata?.originalId || "",
        originalSlug: key.metadata?.originalSlug || "",
        title: key.metadata?.title || "",
        slug: key.metadata?.slug || "",
        date: key.metadata?.date || "",
        deletedAt: key.metadata?.deletedAt || "",
        excerpt: key.metadata?.excerpt || "",
        eyecatch: key.metadata?.eyecatch || "",
        tags: parseTags(key.metadata?.tags),
      })));
      cursor = list.list_complete ? undefined : list.cursor;
    } while (cursor);

    items.sort((a, b) => String(b.deletedAt || b.date).localeCompare(String(a.deletedAt || a.date)));
    return json({ items }, 200, context.request);
  } catch (error) {
    return json({ error: error?.message || "unexpected_error" }, 500, context.request);
  }
}

export async function onRequestPost(context) {
  try {
    if (!isAllowedOrigin(context.request)) return json({ error: "forbidden_origin" }, 403, context.request);
    const kv = context.env.BLOG_KV;
    if (!kv) return json({ error: "BLOG_KV is not configured" }, 500, context.request);
    const authError = authorize(context);
    if (authError) return authError;

    const body = await readJsonBody(context.request);
    const type = body?.type === "post" ? "post" : body?.type === "draft" ? "draft" : "";
    const item = typeof body?.item === "object" && body.item ? body.item : null;
    if (!type || !item) return json({ error: "invalid_trash_item" }, 400, context.request);

    const now = new Date().toISOString();
    const originalId = sanitizeText(body?.originalId || item.draftId || "");
    const originalSlug = sanitizeText(body?.originalSlug || item.slug || "");
    const safeBase = sanitizeKeyPart(originalId || originalSlug || item.title || crypto.randomUUID());
    const trashId = `${type}-${safeBase}-${Date.now()}`;
    const title = sanitizeText(item.title) || "無題";
    const slug = sanitizeText(item.slug || originalSlug);
    const date = sanitizeText(item.date || item.updatedAt || now);
    const excerpt = sanitizeText(item.excerpt);
    const eyecatch = sanitizeText(item.eyecatch);
    const tags = normalizeTags(item.tags);
    const entry = { trashId, type, originalId, originalSlug, item, deletedAt: now };

    await kv.put(`trash:${trashId}`, JSON.stringify(entry), {
      expirationTtl: TRASH_TTL_SECONDS,
      metadata: {
        type,
        originalId,
        originalSlug,
        title,
        slug,
        date,
        deletedAt: now,
        excerpt,
        eyecatch,
        tags: tags.join(","),
      },
    });

    return json({ ok: true, trashId, entry }, 200, context.request);
  } catch (error) {
    return json({ error: error?.message || "unexpected_error" }, 500, context.request);
  }
}

export async function onRequestDelete(context) {
  try {
    if (!isAllowedOrigin(context.request)) return json({ error: "forbidden_origin" }, 403, context.request);
    const kv = context.env.BLOG_KV;
    if (!kv) return json({ error: "BLOG_KV is not configured" }, 500, context.request);
    const authError = authorize(context);
    if (authError) return authError;

    const body = await readJsonBody(context.request);
    const trashId = sanitizeTrashId(body?.trashId || new URL(context.request.url).searchParams.get("id"));
    if (!trashId) return json({ error: "trash_id_required" }, 400, context.request);
    if (body?.purgeImages === true && context.env.BLOG_IMAGES) {
      const entry = await kv.get(`trash:${trashId}`, { type: "json" });
      if (entry?.item) await deleteStoredImages(context.env.BLOG_IMAGES, entry.item);
    }
    await kv.delete(`trash:${trashId}`);
    return json({ ok: true, trashId }, 200, context.request);
  } catch (error) {
    return json({ error: error?.message || "unexpected_error" }, 500, context.request);
  }
}

export async function onRequestOptions(context) {
  return new Response(null, { status: 204, headers: corsHeaders(context.request) });
}

function authorize(context) {
  const requestPin = String(context.request.headers.get("x-yohelab-pin") || "").trim();
  const storedPin = getBlogPin(context.env);
  if (!isValidPin(storedPin) || !isValidPin(requestPin) || !timingSafeEqual(requestPin, storedPin)) {
    return json({ error: "unauthorized" }, 401, context.request);
  }
  return null;
}

function sanitizeTrashId(value) {
  const text = String(value || "").trim();
  return /^[a-z0-9._-]{6,140}$/i.test(text) ? text : "";
}

function sanitizeKeyPart(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || crypto.randomUUID().slice(0, 8);
}

function sanitizeText(value) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, 500);
}

function normalizeTags(value) {
  return Array.isArray(value)
    ? value.map((tag) => sanitizeText(tag)).filter(Boolean).slice(0, 12)
    : parseTags(value);
}

function parseTags(value) {
  return String(value || "")
    .split(/[\n,、]/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 12);
}

async function deleteStoredImages(bucket, item) {
  const urls = imageUrlsForItem(item);
  await Promise.allSettled(urls.map(async (url) => {
    const r2Key = extractR2Key(url);
    if (r2Key) await bucket.delete(r2Key);
  }));
}

function imageUrlsForItem(item) {
  const urls = new Set();
  if (item?.eyecatch) urls.add(item.eyecatch);
  if (Array.isArray(item?.imageUrls)) item.imageUrls.forEach((url) => urls.add(url));
  for (const match of String(item?.bodyHtml || "").matchAll(/<img\b[^>]*\bsrc=(["'])(.*?)\1/gi)) {
    urls.add(match[2]);
  }
  return [...urls].filter(Boolean).slice(0, 40);
}

function extractR2Key(value) {
  try {
    const url = new URL(String(value || ""), "https://yohelab.com");
    if (url.pathname === "/api/blog-image") return url.searchParams.get("key") || "";
    if (url.hostname === "images.yohelab.com" || url.hostname.endsWith(".r2.dev")) {
      return url.pathname.replace(/^\//, "");
    }
  } catch {
    return "";
  }
  return "";
}

async function readJsonBody(request) {
  const text = await request.text();
  try { return text ? JSON.parse(text) : {}; } catch { return {}; }
}

function json(body, status = 200, request = null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
      ...corsHeaders(request),
    },
  });
}

function corsHeaders(request) {
  const origin = request?.headers?.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": allowedOrigin(origin),
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-yohelab-pin",
    Vary: "Origin",
  };
}

function isAllowedOrigin(request) {
  return Boolean(allowedOrigin(request.headers.get("Origin") || ""));
}

function allowedOrigin(origin) {
  if (!origin) return "https://yohelab.com";
  try {
    const { hostname, protocol } = new URL(origin);
    if (protocol !== "https:" && hostname !== "localhost" && hostname !== "127.0.0.1") return "";
    if (hostname === "yohelab.com" || hostname.endsWith(".yohelab.pages.dev") || hostname === "localhost" || hostname === "127.0.0.1") {
      return origin;
    }
  } catch {
    return "";
  }
  return "";
}
