import { getBlogPin, isValidPin, timingSafeEqual } from "../lib/blog-auth.js";
import { notifyIndexNow } from "../lib/indexnow.js";
import { SITE } from "../lib/site-seo.js";
import {
  collectVerifiedImageUrls,
  normalizeBlogImageFormats,
  sanitizeVerifiedImageUrl,
} from "../lib/image-url-guard.js";

const SEARCH_DISCOVERY_URLS = SITE.discoveryUrls;
const FALLBACK_IMAGE = "/yohelab-mascot-v2-20260518.png";

export async function onRequestPost(context) {
  try {
    if (!isAllowedOrigin(context.request)) {
      return json({ error: "forbidden_origin" }, 403, context.request);
    }
    const kv = context.env.BLOG_KV;
    if (!kv) return json({ error: "BLOG_KV is not configured" }, 500, context.request);

    const requestPin = String(
      context.request.headers.get("x-yohelab-pin") || "",
    ).trim();

    const storedPin = getBlogPin(context.env);
    if (!isValidPin(storedPin) || !isValidPin(requestPin) || !timingSafeEqual(requestPin, storedPin)) {
      return json({ error: "unauthorized" }, 401, context.request);
    }

    const body = await readJsonBody(context.request);

    const title = sanitizeText(body?.title);
    const originalPostSlug = sanitizeStoredSlug(body?.originalPostSlug);
    const slugRaw = sanitizeSlug(body?.slug || body?.title);
    const excerptInput = sanitizeText(body?.excerpt);
    const bodyHtml = normalizeBlogImageFormats(String(body?.bodyHtml || "").trim());
    const bodyText = sanitizeText(body?.body);
    const excerpt = excerptInput || autoExcerpt(bodyHtml || bodyText, title);
    const now = new Date().toISOString();
    const existingPost = originalPostSlug ? await readExistingPost(kv, originalPostSlug) : null;
    const date = sanitizeDate(body?.date) || new Date().toISOString().slice(0, 10);
    const publishedAt = originalPostSlug
      ? sanitizeDateTime(existingPost?.publishedAt) || publishedAtFromDate(existingPost?.date || date) || now
      : now;
    const updatedAt = originalPostSlug ? now : "";
    const tags = normalizeTags(body?.tags);
    const requestedEyecatchRaw = String(body?.eyecatch || "").trim();
    const requestedEyecatch = await sanitizeVerifiedImageUrl(context, requestedEyecatchRaw);
    if (requestedEyecatchRaw && !requestedEyecatch) return json({ error: "invalid_eyecatch_image_url" }, 400, context.request);
    const bodyImageUrls = await collectVerifiedImageUrls(context, bodyHtml);
    const firstBodyImage = bodyImageUrls[0] || "";
    const eyecatch = requestedEyecatch || firstBodyImage || FALLBACK_IMAGE;
    const socialImage = eyecatch;
    const cover = normalizeCoverSettings(body?.cover);
    const sourceSlug = sanitizeOptionalSlug(body?.sourceSlug || body?.staticSlug);
    const staticSlug = sanitizeOptionalSlug(body?.staticSlug);

    // slug に日付プレフィックスを付けてユニークにする
    // タイトルなし（画像のみ）の場合はスラッグとタイトルをフォールバック
    const effectiveTitle = title || `post-${date}`;
    const effectiveSlugRaw = slugRaw || sanitizeSlug(effectiveTitle);
    const slug = `${date}-${effectiveSlugRaw}`;

    const post = { title: effectiveTitle, slug: effectiveSlugRaw, date, publishedAt, excerpt, bodyHtml, tags };
    if (updatedAt) post.updatedAt = updatedAt;
    if (eyecatch) post.eyecatch = eyecatch;
    if (socialImage) post.socialImage = socialImage;
    if (eyecatch) post.cover = cover;
    if (sourceSlug) post.sourceSlug = sourceSlug;
    if (staticSlug) post.staticSlug = staticSlug;

    await kv.put(`post:${slug}`, JSON.stringify(post), {
      metadata: { title: effectiveTitle, date, publishedAt, updatedAt, excerpt, slug: effectiveSlugRaw, eyecatch: eyecatch || "", socialImage: socialImage || "", tags: tags.join(","), sourceSlug: sourceSlug || "" },
    });

    const draftId = sanitizeDraftId(body?.draftId);

    if (originalPostSlug && originalPostSlug !== slug) {
      await kv.delete(`post:${originalPostSlug}`);
    }

    await deletePublishedDrafts(kv, {
      draftId,
      postSlug: slug,
      slug: effectiveSlugRaw,
      sourceSlug,
      staticSlug,
    });

    const url = `/blog/${encodeURIComponent(slug)}/`;
    notifyIndexNow(context, searchDiscoveryUrls(
      url,
      originalPostSlug && originalPostSlug !== slug ? `/blog/${encodeURIComponent(originalPostSlug)}/` : "",
    ));
    return json({ ok: true, slug, url, post: { ...post, url } }, 200, context.request);
  } catch (error) {
    if (String(error?.message || "") === "invalid_image_url") {
      return json({ error: "invalid_image_url" }, 400, context.request);
    }
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

    const requestPin = String(
      context.request.headers.get("x-yohelab-pin") || "",
    ).trim();
    const storedPin = getBlogPin(context.env);
    if (!isValidPin(storedPin) || !isValidPin(requestPin) || !timingSafeEqual(requestPin, storedPin)) {
      return json({ error: "unauthorized" }, 401, context.request);
    }

    const url = new URL(context.request.url);
    const body = await readJsonBody(context.request);
    const slug = String(body?.slug || url.searchParams.get("slug") || "").trim();
    const keepImages = body?.keepImages === true || url.searchParams.get("keepImages") === "1";
    if (!slug) return json({ error: "slug_required" }, 400, context.request);

    // 投稿を取得してアイキャッチ画像のキーを確認
    const raw = await kv.get(`post:${slug}`);
    if (!keepImages && raw) {
      try {
        const post = JSON.parse(raw);
        const eyecatch = post?.eyecatch || "";
        // R2画像（images.yohelab.com または pub-xxx.r2.dev）なら削除
        if (eyecatch && context.env.BLOG_IMAGES) {
          const r2Key = extractR2Key(eyecatch);
          if (r2Key) await context.env.BLOG_IMAGES.delete(r2Key);
        }
      } catch { /* JSON parse失敗は無視 */ }
    }

    await kv.delete(`post:${slug}`);
    notifyIndexNow(context, searchDiscoveryUrls(`/blog/${encodeURIComponent(slug)}/`));
    return json({ ok: true, slug }, 200, context.request);
  } catch (error) {
    return json({ error: error?.message || "unexpected_error" }, 500, context.request);
  }
}

export async function onRequestOptions(context) {
  return new Response(null, { status: 204, headers: corsHeaders(context.request) });
}

// ── helpers ────────────────────────────────────────────────

// R2画像URLからキーを抽出（images.yohelab.com/KEY または pub-xxx.r2.dev/KEY）
function extractR2Key(url) {
  try {
    const { hostname, pathname } = new URL(url);
    if (hostname === "images.yohelab.com" || hostname.endsWith(".r2.dev")) {
      return pathname.replace(/^\//, "") || null;
    }
  } catch { /* ignore */ }
  return null;
}

function searchDiscoveryUrls(...urls) {
  return [...new Set([...urls, ...SEARCH_DISCOVERY_URLS].map((url) => String(url || "").trim()).filter(Boolean))];
}

function sanitizeText(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function autoExcerpt(htmlOrText, title) {
  const text = sanitizeText(
    String(htmlOrText || "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " "),
  );
  if (text) return text.slice(0, 120);
  return title ? `${title}について、購入前や利用前に確認しやすいように整理した記事です。` : "";
}

function sanitizeSlug(value) {
  const fallback = `post-${new Date().toISOString().slice(0, 10)}-${crypto.randomUUID().slice(0, 8).toLowerCase()}`;
  return (
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || fallback
  );
}

function sanitizeOptionalSlug(value) {
  const text = String(value || "").trim();
  return text ? sanitizeSlug(text) : "";
}

function sanitizeStoredSlug(value) {
  const text = String(value || "").trim();
  return /^[a-z0-9ぁ-んァ-ヶ一-龠ー._-]{1,140}$/i.test(text) ? text : "";
}

function sanitizeDraftId(value) {
  const text = String(value || "").trim();
  return /^[a-z0-9._-]{6,80}$/i.test(text) ? text : "";
}

async function deletePublishedDrafts(kv, published = {}) {
  const targets = new Set(
    [
      published.draftId,
      published.postSlug,
      published.slug,
      published.sourceSlug,
      published.staticSlug,
    ]
      .map(comparableSlug)
      .filter(Boolean),
  );
  if (!targets.size) return;

  const deleted = new Set();
  if (published.draftId) {
    await kv.delete(`draft:${published.draftId}`);
    deleted.add(`draft:${published.draftId}`);
  }

  let cursor;
  do {
    const list = await kv.list({ prefix: "draft:", cursor });
    for (const key of list.keys || []) {
      if (deleted.has(key.name)) continue;
      const meta = key.metadata || {};
      const candidates = [
        key.name.replace(/^draft:/, ""),
        meta.slug,
        meta.sourceSlug,
        meta.staticSlug,
        meta.importedFrom,
      ].map(comparableSlug);
      if (candidates.some((candidate) => candidate && targets.has(candidate))) {
        await kv.delete(key.name);
        deleted.add(key.name);
      }
    }
    cursor = list.list_complete ? undefined : list.cursor;
  } while (cursor);
}

function comparableSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^draft:/, "")
    .replace(/^static-/, "")
    .replace(/^\/?blog\//, "")
    .replace(/\/$/, "")
    .replace(/^\d{4}-\d{2}-\d{2}-/, "");
}

function sanitizeDate(value) {
  const text = String(value || "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : "";
}

function sanitizeDateTime(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  const time = new Date(text).getTime();
  return Number.isNaN(time) ? "" : new Date(time).toISOString();
}

function publishedAtFromDate(value) {
  const date = sanitizeDate(value);
  if (!date) return "";
  return new Date(`${date}T00:00:00+09:00`).toISOString();
}

async function readExistingPost(kv, slug) {
  try {
    const raw = await kv.get(`post:${slug}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
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

async function readJsonBody(request) {
  const text = await request.text();
  try { return text ? JSON.parse(text) : {}; } catch { return {}; }
}

function json(body, status = 200, request = null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders(request),
    },
  });
}

function corsHeaders(request) {
  const origin = request?.headers?.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": allowedOrigin(origin),
    "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
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
