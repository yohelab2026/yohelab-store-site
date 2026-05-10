import { getBlogPin, isValidPin, timingSafeEqual } from "../lib/blog-auth.js";

const DRAFT_TTL_SECONDS = 60 * 60 * 24 * 90;

export async function onRequestGet(context) {
  try {
    if (!isAllowedOrigin(context.request)) {
      return json({ error: "forbidden_origin" }, 403, context.request);
    }

    const kv = context.env.BLOG_KV;
    if (!kv) return json({ error: "BLOG_KV is not configured" }, 500, context.request);

    const authError = authorize(context);
    if (authError) return authError;

    const url = new URL(context.request.url);
    const draftId = sanitizeDraftId(url.searchParams.get("id"));
    if (draftId) {
      const draft = await kv.get(`draft:${draftId}`, { type: "json" });
      if (!draft) return json({ error: "not_found" }, 404, context.request);
      return json({ draft }, 200, context.request);
    }

    const list = await kv.list({ prefix: "draft:", limit: 50 });
    const drafts = list.keys
      .map((key) => ({
        draftId: key.name.replace(/^draft:/, ""),
        title: key.metadata?.title || "",
        updatedAt: key.metadata?.updatedAt || "",
        excerpt: key.metadata?.excerpt || "",
        eyecatch: key.metadata?.eyecatch || "",
      }))
      .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));

    return json({ drafts }, 200, context.request);
  } catch (error) {
    return json({ error: error?.message || "unexpected_error" }, 500, context.request);
  }
}

export async function onRequestPost(context) {
  try {
    if (!isAllowedOrigin(context.request)) {
      return json({ error: "forbidden_origin" }, 403, context.request);
    }

    const kv = context.env.BLOG_KV;
    if (!kv) return json({ error: "BLOG_KV is not configured" }, 500, context.request);

    const authError = authorize(context);
    if (authError) return authError;

    const body = await readJsonBody(context.request);
    const now = new Date().toISOString();
    const draftId = sanitizeDraftId(body?.draftId) || makeDraftId();
    const title = sanitizeText(body?.title) || "無題の下書き";
    const bodyHtml = String(body?.bodyHtml || "");
    const excerpt = sanitizeText(body?.excerpt);
    const eyecatch = sanitizeUrl(body?.eyecatch);
    const draft = {
      draftId,
      title,
      slug: sanitizeSlug(body?.slug),
      excerpt,
      bodyHtml,
      body: sanitizeText(body?.body),
      tags: normalizeTags(body?.tags),
      eyecatch,
      imageUrls: collectImageUrls(bodyHtml, eyecatch),
      updatedAt: now,
    };

    await kv.put(`draft:${draftId}`, JSON.stringify(draft), {
      metadata: {
        title,
        excerpt,
        eyecatch: eyecatch || "",
        updatedAt: now,
      },
      expirationTtl: DRAFT_TTL_SECONDS,
    });

    return json({ ok: true, draftId, draft }, 200, context.request);
  } catch (error) {
    return json({ error: error?.message || "unexpected_error" }, 500, context.request);
  }
}

export async function onRequestDelete(context) {
  try {
    if (!isAllowedOrigin(context.request)) {
      return json({ error: "forbidden_origin" }, 403, context.request);
    }

    const kv = context.env.BLOG_KV;
    if (!kv) return json({ error: "BLOG_KV is not configured" }, 500, context.request);

    const authError = authorize(context);
    if (authError) return authError;

    const body = await readJsonBody(context.request);
    const draftId = sanitizeDraftId(body?.draftId || new URL(context.request.url).searchParams.get("id"));
    if (!draftId) return json({ error: "draft_id_required" }, 400, context.request);

    await kv.delete(`draft:${draftId}`);
    return json({ ok: true, draftId }, 200, context.request);
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
  if (!isValidPin(requestPin) || !timingSafeEqual(requestPin, storedPin)) {
    return json({ error: "unauthorized" }, 401, context.request);
  }
  return null;
}

function makeDraftId() {
  return `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
}

function sanitizeDraftId(value) {
  const text = String(value || "").trim();
  return /^[a-z0-9._-]{6,80}$/i.test(text) ? text : "";
}

function sanitizeText(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function sanitizeSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9ぁ-んァ-ヶ一-龠ー._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function sanitizeUrl(value) {
  const url = String(value || "").trim();
  if (!url) return "";
  if (/^\/api\/blog-image\?key=[\w.-]+$/.test(url)) return url;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" ? parsed.href : "";
  } catch {
    return "";
  }
}

function normalizeTags(value) {
  return Array.isArray(value)
    ? value.map((t) => sanitizeText(t)).filter(Boolean).slice(0, 10)
    : String(value || "")
        .split(/[\n,、]/)
        .map((t) => sanitizeText(t))
        .filter(Boolean)
        .slice(0, 10);
}

function collectImageUrls(html, eyecatch) {
  const urls = new Set();
  if (eyecatch) urls.add(eyecatch);
  for (const match of String(html || "").matchAll(/<img\b[^>]*\bsrc=(["'])(.*?)\1/gi)) {
    const safe = sanitizeUrl(match[2]);
    if (safe) urls.add(safe);
  }
  return [...urls].slice(0, 30);
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
