import { getBlogPin, isValidPin, timingSafeEqual } from "../lib/blog-auth.js";
import {
  collectVerifiedImageUrls,
  normalizeBlogImageFormats,
  normalizePermittedImageUrl,
  sanitizeVerifiedImageUrl,
} from "../lib/image-url-guard.js";

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
    const posts = Array.isArray(body?.posts) ? body.posts.slice(0, 80) : [];
    const now = new Date().toISOString();
    const result = {
      ok: true,
      importedDrafts: 0,
      importedPosts: 0,
      skippedDrafts: 0,
      skippedPosts: 0,
      total: posts.length,
    };
    const publishedSlugs = await readPublishedSlugs(kv);
    const hiddenStaticDraftSlugs = await readHiddenStaticDraftSlugs(kv);

    for (const rawPost of posts) {
      const normalized = await normalizeStaticPost(context, rawPost, now);
      if (!normalized) {
        if (String(rawPost?.status || "").trim() === "draft") result.skippedDrafts += 1;
        else result.skippedPosts += 1;
        continue;
      }
      if (!normalized.title && !normalized.bodyHtml) continue;

      if (normalized.status === "draft") {
        const staticSlug = comparableSlug(normalized.slug);
        if (publishedSlugs.has(staticSlug) || hiddenStaticDraftSlugs.has(staticSlug)) {
          result.skippedDrafts += 1;
          continue;
        }

        const draftId = `static-${normalized.slug}`.slice(0, 80);
        const key = `draft:${draftId}`;
        const exists = await kv.get(key);
        if (exists) {
          result.skippedDrafts += 1;
          continue;
        }
        const eyecatch = normalized.eyecatch;

        const draft = {
          draftId,
          title: normalized.title,
          slug: normalized.slug,
          excerpt: normalized.excerpt,
          bodyHtml: normalized.bodyHtml,
          body: normalized.body,
          tags: normalized.tags,
          eyecatch,
          socialImage: eyecatch,
          imageUrls: normalized.imageUrls,
          updatedAt: normalized.updatedAt,
          importedFrom: "static-posts",
          sourceSlug: normalized.slug,
          locale: "ja",
        };

        await kv.put(key, JSON.stringify(draft), {
          metadata: {
            title: draft.title,
            slug: draft.slug,
            sourceSlug: draft.sourceSlug,
            locale: "ja",
            excerpt: draft.excerpt,
            eyecatch: draft.eyecatch || "",
            socialImage: draft.socialImage || "",
            tags: draft.tags.join(","),
            updatedAt: draft.updatedAt,
            importedFrom: draft.importedFrom,
          },
        });
        result.importedDrafts += 1;
        continue;
      }

      const postKeySlug = `${normalized.date}-${normalized.slug}`;
      const key = `post:${postKeySlug}`;
      const exists = await kv.get(key);
      if (exists) {
        result.skippedPosts += 1;
        await deleteStaticDraftForSlug(kv, normalized.slug);
        continue;
      }

      const eyecatch = normalized.eyecatch;
      const post = {
        title: normalized.title,
        slug: normalized.slug,
        date: normalized.date,
        publishedAt: normalized.publishedAt,
        excerpt: normalized.excerpt,
        bodyHtml: normalized.bodyHtml,
        body: normalized.body,
        tags: normalized.tags,
        eyecatch,
        socialImage: eyecatch,
        importedFrom: "static-posts",
        sourceSlug: normalized.slug,
        locale: "ja",
      };

      await kv.put(key, JSON.stringify(post), {
        metadata: {
          title: post.title,
          date: post.date,
          publishedAt: post.publishedAt,
          excerpt: post.excerpt,
          slug: post.slug,
          sourceSlug: post.sourceSlug,
          locale: "ja",
          eyecatch: post.eyecatch || "",
          socialImage: post.socialImage || "",
          tags: post.tags.join(","),
          importedFrom: post.importedFrom,
        },
      });
      await deleteStaticDraftForSlug(kv, normalized.slug);
      publishedSlugs.add(comparableSlug(normalized.slug));
      result.importedPosts += 1;
    }

    return json(result, 200, context.request);
  } catch (error) {
    return json({ error: error?.message || "unexpected_error" }, 500, context.request);
  }
}

export async function onRequestOptions(context) {
  return new Response(null, { status: 204, headers: corsHeaders(context.request) });
}

async function normalizeStaticPost(context, rawPost, now) {
  const title = sanitizeText(rawPost?.title).replace(/^【下書き】\s*/, "") || "無題の記事";
  const slug = sanitizeSlug(rawPost?.slug || rawPost?.title || title);
  const sourceUpdatedAt = sanitizeDateTime(rawPost?.updatedAt);
  const sourcePublishedAt = sanitizeDateTime(rawPost?.publishedAt);
  const date = sanitizeDate(rawPost?.date) || (sourcePublishedAt || sourceUpdatedAt || now).slice(0, 10);
  const bodyHtml = normalizeBlogImageFormats(String(rawPost?.bodyHtml || "").trim());
  const body = sanitizeText(rawPost?.body || stripHtml(bodyHtml));
  const excerpt = sanitizeText(rawPost?.excerpt) || autoExcerpt(bodyHtml || body, title);
  const requestedEyecatchRaw = String(rawPost?.eyecatch || "").trim();
  const requestedEyecatchCandidate = normalizePermittedImageUrl(requestedEyecatchRaw);
  const requestedEyecatch = await sanitizeVerifiedImageUrl(context, requestedEyecatchRaw);
  const bodyImageUrls = await collectVerifiedImageUrls(context, bodyHtml);
  const eyecatch = requestedEyecatch || requestedEyecatchCandidate || bodyImageUrls[0] || "";
  const socialImage = eyecatch;
  return {
    title,
    slug,
    date,
    excerpt,
    bodyHtml,
    body,
    tags: normalizeTags(rawPost?.tags),
    eyecatch,
    socialImage,
    imageUrls: [...new Set([...bodyImageUrls, ...[eyecatch, socialImage].filter(Boolean)])].slice(0, 30),
    status: String(rawPost?.status || "").trim() === "draft" ? "draft" : "published",
    publishedAt: sourcePublishedAt || sourceUpdatedAt || publishedAtFromDate(date) || now,
    updatedAt: sourceUpdatedAt,
  };
}

async function readPublishedSlugs(kv) {
  const slugs = new Set();
  let cursor;
  do {
    const list = await kv.list({ prefix: "post:", cursor });
    for (const key of list.keys || []) {
      const meta = key.metadata || {};
      [
        key.name.replace(/^post:/, ""),
        meta.slug,
        meta.sourceSlug,
        meta.staticSlug,
        meta.importedFrom,
      ].forEach((value) => {
        const slug = comparableSlug(value);
        if (slug) slugs.add(slug);
      });
    }
    cursor = list.list_complete ? undefined : list.cursor;
  } while (cursor);
  return slugs;
}

async function readHiddenStaticDraftSlugs(kv) {
  const slugs = new Set();
  let cursor;
  do {
    const list = await kv.list({ prefix: "draft-hidden:", cursor, limit: 100 });
    for (const key of list.keys || []) {
      const slug = comparableSlug(key.metadata?.slug || key.name.replace(/^draft-hidden:/, ""));
      if (slug) slugs.add(slug);
    }
    cursor = list.list_complete ? undefined : list.cursor;
  } while (cursor);
  return slugs;
}

async function deleteStaticDraftForSlug(kv, slug) {
  const target = comparableSlug(slug);
  if (!target) return;

  let cursor;
  do {
    const list = await kv.list({ prefix: "draft:", cursor });
    for (const key of list.keys || []) {
      const meta = key.metadata || {};
      const candidates = [
        key.name.replace(/^draft:/, ""),
        meta.slug,
        meta.sourceSlug,
        meta.staticSlug,
        meta.importedFrom,
      ].map(comparableSlug);
      if (candidates.includes(target)) await kv.delete(key.name);
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

function authorize(context) {
  const requestPin = String(context.request.headers.get("x-yohelab-pin") || "").trim();
  const storedPin = getBlogPin(context.env);
  if (!isValidPin(storedPin) || !isValidPin(requestPin) || !timingSafeEqual(requestPin, storedPin)) {
    return json({ error: "unauthorized" }, 401, context.request);
  }
  return null;
}

function sanitizeText(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function sanitizeSlug(value) {
  const fallback = `post-${new Date().toISOString().slice(0, 10)}`;
  return (
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9ぁ-んァ-ヶ一-龠ー._-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || fallback
  );
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
  return date ? new Date(`${date}T00:00:00+09:00`).toISOString() : "";
}

function normalizeTags(value) {
  return Array.isArray(value)
    ? value.map((t) => sanitizeText(t)).filter(Boolean).slice(0, 16)
    : String(value || "")
        .split(/[\n,、]/)
        .map((t) => sanitizeText(t))
        .filter(Boolean)
        .slice(0, 16);
}

function autoExcerpt(htmlOrText, title) {
  const text = sanitizeText(stripHtml(htmlOrText));
  if (text) return text.slice(0, 140);
  return title ? `${title}について、後から編集しやすいように取り込んだ記事です。` : "";
}

function stripHtml(value) {
  return String(value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ");
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
    "Access-Control-Allow-Methods": "POST, OPTIONS",
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
