import { getBlogPin, isValidPin, timingSafeEqual } from "../lib/blog-auth.js";
import {
  collectVerifiedImageUrls,
  normalizeBlogImageFormats,
  normalizePermittedImageUrl,
  sanitizeVerifiedImageUrl,
} from "../lib/image-url-guard.js";

const DRAFT_TTL_SECONDS = 60 * 60 * 24 * 30;
const HIDDEN_STATIC_DRAFT_PREFIX = "draft-hidden:";
const FALLBACK_IMAGE = "/yohelab-mascot-v2-20260518.png";

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

    const drafts = [];
    let cursor;
    do {
      const list = await kv.list({ prefix: "draft:", cursor, limit: 100 });
      drafts.push(...(list.keys || []).map(draftListItem));
      cursor = list.list_complete ? undefined : list.cursor;
    } while (cursor);

    drafts.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));

    return json({ drafts, hiddenStaticDrafts: await listHiddenStaticDrafts(kv) }, 200, context.request);
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
    const bodyHtml = normalizeBlogImageFormats(String(body?.bodyHtml || ""));
    const excerpt = sanitizeText(body?.excerpt);
    const requestedEyecatchRaw = String(body?.eyecatch || "").trim();
    const requestedEyecatchCandidate = normalizePermittedImageUrl(requestedEyecatchRaw);
    const requestedEyecatch = await sanitizeVerifiedImageUrl(context, requestedEyecatchRaw);
    const bodyImageUrls = await collectVerifiedImageUrls(context, bodyHtml);
    const firstBodyImage = bodyImageUrls[0] || "";
    const eyecatch = requestedEyecatch || requestedEyecatchCandidate || firstBodyImage || FALLBACK_IMAGE;
    const socialImage = eyecatch;
    const cover = normalizeCoverSettings(body?.cover);
    const slug = sanitizeSlug(body?.slug);
    const sourceSlug = sanitizeSlug(body?.sourceSlug || body?.staticSlug || body?.importedFrom);
    const staticSlug = sanitizeSlug(body?.staticSlug);
    const importedFrom = sanitizeSlug(body?.importedFrom || sourceSlug);
    const tags = normalizeTags(body?.tags);
    const locale = normalizeLocale(body?.locale);
    const translationSlug = sanitizeStoredSlug(body?.translationSlug);
    const draft = {
      draftId,
      title,
      slug,
      excerpt,
      bodyHtml,
      body: sanitizeText(body?.body),
      tags,
      eyecatch,
      socialImage,
      cover,
      sourceSlug,
      staticSlug,
      importedFrom,
      locale,
      translationSlug,
      imageUrls: [...new Set([...bodyImageUrls, ...[eyecatch, socialImage].filter(Boolean)])].slice(0, 30),
      updatedAt: now,
    };

    await kv.put(`draft:${draftId}`, JSON.stringify(draft), {
      expirationTtl: DRAFT_TTL_SECONDS,
      metadata: {
        title,
        slug,
        excerpt,
        eyecatch: eyecatch || "",
        socialImage: socialImage || "",
        tags: tags.join(","),
        sourceSlug: sourceSlug || "",
        staticSlug: staticSlug || "",
        importedFrom: importedFrom || "",
        locale,
        translationSlug: translationSlug || "",
        updatedAt: now,
      },
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

    const url = new URL(context.request.url);
    const body = await readJsonBody(context.request);
    const draftId = sanitizeDraftId(body?.draftId || url.searchParams.get("id"));
    const staticSlug = comparableSlug(body?.staticSlug || body?.sourceSlug || url.searchParams.get("staticSlug"));
    if (!draftId && !staticSlug) return json({ error: "draft_id_required" }, 400, context.request);

    if (draftId) await kv.delete(`draft:${draftId}`);
    if (staticSlug) await hideStaticDraft(kv, staticSlug);
    return json({ ok: true, draftId, staticSlug }, 200, context.request);
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
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function sanitizeStoredSlug(value) {
  const text = String(value || "").trim();
  return /^[a-z0-9ぁ-んァ-ヶ一-龠ー._-]{1,140}$/i.test(text) ? text : "";
}

function normalizeLocale(value) {
  return String(value || "").trim().toLowerCase().startsWith("en") ? "en" : "ja";
}

function comparableSlug(value) {
  return sanitizeSlug(
    String(value || "")
      .replace(/^draft:/, "")
      .replace(/^static-/, "")
      .replace(/^\/?blog\//, "")
      .replace(/\/$/, "")
      .replace(/^\d{4}-\d{2}-\d{2}-/, ""),
  );
}

async function hideStaticDraft(kv, slug) {
  const staticSlug = comparableSlug(slug);
  if (!staticSlug) return;
  const hiddenAt = new Date().toISOString();
  await kv.put(`${HIDDEN_STATIC_DRAFT_PREFIX}${staticSlug}`, JSON.stringify({ slug: staticSlug, hiddenAt }), {
    metadata: { slug: staticSlug, hiddenAt },
  });
}

async function listHiddenStaticDrafts(kv) {
  const hidden = [];
  let cursor;
  do {
    const list = await kv.list({ prefix: HIDDEN_STATIC_DRAFT_PREFIX, cursor, limit: 100 });
    hidden.push(...(list.keys || []).map((key) => comparableSlug(key.metadata?.slug || key.name.replace(HIDDEN_STATIC_DRAFT_PREFIX, ""))).filter(Boolean));
    cursor = list.list_complete ? undefined : list.cursor;
  } while (cursor);
  return [...new Set(hidden)];
}

function normalizeCoverSettings(value) {
  const input = typeof value === "object" && value ? value : {};
  return {
    fit: input.fit === "contain" ? "contain" : "cover",
    x: clampNumber(input.x, 0, 100, 50),
    y: clampNumber(input.y, 0, 100, 50),
    zoom: clampNumber(input.zoom, 100, 160, 100),
  };
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.round(number)));
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

function parseTags(value) {
  return String(value || "")
    .split(/[\n,、]/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function draftListItem(key) {
  const meta = key.metadata || {};
  return {
    draftId: key.name.replace(/^draft:/, ""),
    title: meta.title || "",
    slug: meta.slug || "",
    updatedAt: metadataDraftUpdatedAt(meta),
    excerpt: meta.excerpt || "",
    eyecatch: meta.eyecatch || "",
    socialImage: meta.socialImage || "",
    tags: parseTags(meta.tags),
    sourceSlug: meta.sourceSlug || "",
    staticSlug: meta.staticSlug || "",
    importedFrom: meta.importedFrom || "",
    locale: normalizeLocale(meta.locale),
    translationSlug: meta.translationSlug || "",
  };
}

function metadataDraftUpdatedAt(meta = {}) {
  const updatedAt = String(meta.updatedAt || "").trim();
  if (!updatedAt) return "";
  if (String(meta.importedFrom || "").trim() === "static-posts") return "";
  return updatedAt;
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
