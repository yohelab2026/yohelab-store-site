import { getBlogPin, isValidPin, timingSafeEqual } from "../lib/blog-auth.js";

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

    for (const rawPost of posts) {
      const normalized = normalizeStaticPost(rawPost, now);
      if (!normalized.title && !normalized.bodyHtml) continue;

      if (normalized.status === "draft") {
        const draftId = `static-${normalized.slug}`.slice(0, 80);
        const key = `draft:${draftId}`;
        const exists = await kv.get(key);
        if (exists) {
          result.skippedDrafts += 1;
          continue;
        }

        const draft = {
          draftId,
          title: normalized.title,
          slug: normalized.slug,
          excerpt: normalized.excerpt,
          bodyHtml: normalized.bodyHtml,
          body: normalized.body,
          tags: normalized.tags,
          eyecatch: normalized.eyecatch,
          socialImage: normalized.socialImage,
          imageUrls: collectImageUrls(normalized.bodyHtml, normalized.eyecatch, normalized.socialImage),
          updatedAt: normalized.updatedAt,
          importedFrom: "static-posts",
          sourceSlug: normalized.slug,
        };

        await kv.put(key, JSON.stringify(draft), {
          metadata: {
            title: draft.title,
            slug: draft.slug,
            sourceSlug: draft.sourceSlug,
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
        continue;
      }

      const post = {
        title: normalized.title,
        slug: normalized.slug,
        date: normalized.date,
        excerpt: normalized.excerpt,
        bodyHtml: normalized.bodyHtml,
        body: normalized.body,
        tags: normalized.tags,
        eyecatch: normalized.eyecatch,
        socialImage: normalized.socialImage,
        importedFrom: "static-posts",
        sourceSlug: normalized.slug,
      };

      await kv.put(key, JSON.stringify(post), {
        metadata: {
          title: post.title,
          date: post.date,
          excerpt: post.excerpt,
          slug: post.slug,
          sourceSlug: post.sourceSlug,
          eyecatch: post.eyecatch || "",
          socialImage: post.socialImage || "",
          tags: post.tags.join(","),
          importedFrom: post.importedFrom,
        },
      });
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

function normalizeStaticPost(rawPost, now) {
  const title = sanitizeText(rawPost?.title).replace(/^【下書き】\s*/, "") || "無題の記事";
  const slug = sanitizeSlug(rawPost?.slug || rawPost?.title || title);
  const date = sanitizeDate(rawPost?.date) || now.slice(0, 10);
  const bodyHtml = String(rawPost?.bodyHtml || "").trim();
  const body = sanitizeText(rawPost?.body || stripHtml(bodyHtml));
  const excerpt = sanitizeText(rawPost?.excerpt) || autoExcerpt(bodyHtml || body, title);
  const eyecatch = sanitizeUrl(rawPost?.eyecatch);
  const socialImage = sanitizeUrl(rawPost?.socialImage) || eyecatch;
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
    status: String(rawPost?.status || "").trim() === "draft" ? "draft" : "published",
    updatedAt: rawPost?.updatedAt || now,
  };
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

function sanitizeUrl(value) {
  const url = String(value || "").trim();
  if (!url) return "";
  if (/^\/api\/blog-image\?key=[\w.-]+$/.test(url)) return url;
  if (/^\/(?:assets|blog|images)\//.test(url)) return url;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" ? parsed.href : "";
  } catch {
    return "";
  }
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

function collectImageUrls(html, eyecatch, socialImage) {
  const urls = new Set();
  if (eyecatch) urls.add(eyecatch);
  if (socialImage) urls.add(socialImage);
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
