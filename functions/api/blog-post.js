import { getBlogPin, isValidPin, timingSafeEqual } from "../lib/blog-auth.js";

export async function onRequestPost(context) {
  try {
    if (!isAllowedOrigin(context.request)) {
      return json({ error: "forbidden_origin" }, 403, context.request);
    }
    const kv = context.env.BLOG_KV;
    if (!kv) return json({ error: "BLOG_KV is not configured" }, 500, context.request);

    const requestPin = String(
      context.request.headers.get("x-yohelab-pin") ||
      context.request.headers.get("x-yohelab-password") ||
      "",
    ).trim();

    const storedPin = getBlogPin(context.env);
    if (!isValidPin(requestPin) || !timingSafeEqual(requestPin, storedPin)) {
      return json({ error: "unauthorized" }, 401, context.request);
    }

    const body = await readJsonBody(context.request);

    const title = sanitizeText(body?.title);
    const slugRaw = sanitizeSlug(body?.slug || body?.title);
    const excerpt = sanitizeText(body?.excerpt);
    const bodyHtml = String(body?.bodyHtml || "").trim();
    const date = sanitizeDate(body?.date) || new Date().toISOString().slice(0, 10);
    const tags = normalizeTags(body?.tags);
    const eyecatch = sanitizeUrl(body?.eyecatch);

    // タイトルがなくてもアイキャッチ画像があればOK（画像がタイトル代わり）
    if (!title && !eyecatch) {
      return json({ error: "title_required" }, 400, context.request);
    }

    // slug に日付プレフィックスを付けてユニークにする
    // タイトルなし（画像のみ）の場合はスラッグとタイトルをフォールバック
    const effectiveTitle = title || `post-${date}`;
    const effectiveSlugRaw = slugRaw || sanitizeSlug(effectiveTitle);
    const slug = `${date}-${effectiveSlugRaw}`;

    const post = { title: effectiveTitle, slug: effectiveSlugRaw, date, excerpt, bodyHtml, tags };
    if (eyecatch) post.eyecatch = eyecatch;

    await kv.put(`post:${slug}`, JSON.stringify(post), {
      metadata: { title: effectiveTitle, date, excerpt, slug: effectiveSlugRaw, eyecatch: eyecatch || "" },
    });

    return json({ ok: true, slug, post }, 200, context.request);
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

    const requestPin = String(
      context.request.headers.get("x-yohelab-pin") || "",
    ).trim();
    const storedPin = getBlogPin(context.env);
    if (!isValidPin(requestPin) || !timingSafeEqual(requestPin, storedPin)) {
      return json({ error: "unauthorized" }, 401, context.request);
    }

    const body = await readJsonBody(context.request);
    const slug = String(body?.slug || "").trim();
    if (!slug) return json({ error: "slug_required" }, 400, context.request);

    // 投稿を取得してアイキャッチ画像のキーを確認
    const raw = await kv.get(`post:${slug}`);
    if (raw) {
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
  // 自サイトの画像API（/api/blog-image?key=...）も許可
  if (/^\/api\/blog-image\?key=[\w-]+$/.test(url)) return url;
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
    "Access-Control-Allow-Headers": "Content-Type, x-yohelab-pin, x-yohelab-password",
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
