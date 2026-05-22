/**
 * /blog/post/?slug=xxx を個別記事URLへリダイレクトする Cloudflare Pages Function
 *
 * 静的HTMLでJS経由で取得していた記事メタデータを、サーバー側で先に埋めて返すことで
 * Googlebot・Bingbot・AIクローラー・SNSプレビューに正しいタイトル・description・OG・
 * JSON-LD・本文を瞬時に渡せるようになる。
 *
 * 失敗時は context.next() で従来の静的HTMLにフォールバック。
 */

const SITE_ORIGIN = "https://yohelab.com";
const SITE_NAME = "よへラボ";
const BLOG_NAME = "よへラボブログ";
const FALLBACK_IMAGE = `${SITE_ORIGIN}/yohelab-mascot-v2-20260518.png`;
const CATEGORY_KEY = "settings:blog-categories";
const RESERVED_BLOG_SLUGS = new Set(["admin", "post", "category", "tag"]);
const DEFAULT_CATEGORY_TREE = [
  { key: "ai-news", label: "AIニュース", children: [
    { key: "ai-news", label: "AIニュース" },
    { key: "chatgpt", label: "ChatGPT" },
    { key: "claude", label: "Claude" },
    { key: "gemini", label: "Gemini" },
    { key: "perplexity", label: "Perplexity" },
    { key: "genspark", label: "Genspark" },
    { key: "grok", label: "Grok" },
    { key: "copilot", label: "Copilot" },
    { key: "midjourney", label: "Midjourney" },
  ] },
  { key: "ai-rumor", label: "AIの噂・予測", children: [
    { key: "ai-rumor", label: "AIの噂" },
    { key: "ai-leak", label: "リーク・未発表" },
    { key: "ai-prediction", label: "今後の予測" },
  ] },
  { key: "earn", label: "副業ブログ", children: [
    { key: "earn", label: "収益化ネタ" },
    { key: "article", label: "記事づくり" },
  ] },
  { key: "wordpress", label: "ツール・商品", children: [
    { key: "wordpress", label: "WordPress・文標" },
    { key: "template", label: "記事テンプレ" },
  ] },
  { key: "home-work", label: "在宅ヒント", children: [
    { key: "home-work", label: "在宅ワーク習慣" },
  ] },
];
const STATIC_POST_REDIRECTS = new Map([
  ["ai-news-selling-ideas", "/blog/ai-news-selling-ideas/"],
  ["home-work-rhythm", "/blog/home-work-rhythm/"],
  ["bunsirube-version-history", "/blog/bunsirube-version-history/"],
  ["comparison-article-template", "/blog/comparison-article-template/"],
  ["free-theme-vs-bunsirube", "/blog/free-theme-vs-bunsirube/"],
  ["faq-source-ai-search", "/blog/faq-source-ai-search/"],
  ["sales-page-common-mistakes", "/blog/sales-page-common-mistakes/"],
  ["bunsirube-before-install", "/blog/bunsirube-before-install/"],
]);

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const slug = url.searchParams.get("slug") || "";

  // slug がなければブログ一覧へリダイレクト
  if (!slug) {
    return Response.redirect(new URL("/blog/", url.origin).toString(), 302);
  }

  return renderBlogPost(context, slug, url, { redirectToPretty: true });
}

export async function renderBlogPost(context, slug, requestUrl = new URL(context.request.url), options = {}) {
  const cleanSlug = String(slug || "").trim();
  if (!cleanSlug || isReservedBlogSlug(cleanSlug)) {
    return context.next();
  }

  const cleanStaticPath = cleanStaticSlugPath(cleanSlug);
  if (cleanStaticPath) {
    const staticUrl = new URL(cleanStaticPath, requestUrl.origin);
    if (samePath(requestUrl.pathname, staticUrl.pathname)) {
      return context.next();
    }
    return Response.redirect(staticUrl.toString(), 301);
  }

  const kv = context.env.BLOG_KV;
  if (!kv) {
    // KV 未設定なら静的HTMLにフォールバック
    return context.next();
  }

  let post;
  try {
    post = await kv.get(`post:${slug}`, { type: "json" });
  } catch (err) {
    return context.next();
  }

  if (!post) {
    // 見つからない時は静的HTMLや既存404にフォールバック。
    return context.next();
  }

  if (options.redirectToPretty) {
    return Response.redirect(new URL(prettyPostPath(cleanSlug), requestUrl.origin).toString(), 301);
  }

  const categoryMap = await readCategoryMap(kv);
  const html = renderPostHTML(post, cleanSlug, categoryMap);

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Cloudflare CDNで5分間キャッシュ。記事更新時は手動でPurge推奨
      "Cache-Control": "public, max-age=60, s-maxage=300",
      "X-Robots-Tag": "index,follow,max-image-preview:large,max-snippet:-1",
    },
  });
}

export function prettyPostPath(slug) {
  return `/blog/${encodeURIComponent(String(slug || "").trim())}/`;
}

export function prettyPostUrl(slug) {
  return `${SITE_ORIGIN}${prettyPostPath(slug)}`;
}

export function isReservedBlogSlug(slug) {
  return RESERVED_BLOG_SLUGS.has(String(slug || "").trim().toLowerCase());
}

function samePath(a, b) {
  return String(a || "").replace(/\/+$/, "") === String(b || "").replace(/\/+$/, "");
}

async function readCategoryMap(kv) {
  try {
    const saved = await kv.get(CATEGORY_KEY, { type: "json" });
    return buildCategoryMap(saved?.categories || saved || DEFAULT_CATEGORY_TREE);
  } catch {
    return buildCategoryMap(DEFAULT_CATEGORY_TREE);
  }
}

function buildCategoryMap(categories) {
  const map = new Map();
  const source = mergeDefaultCategoryTree(Array.isArray(categories) && categories.length ? categories : DEFAULT_CATEGORY_TREE);
  source.forEach((parent) => {
    const parentKey = sanitizeCategoryKey(parent?.key);
    const parentLabel = sanitizeCategoryLabel(parent?.label);
    if (parentKey && parentLabel) map.set(parentKey, parentLabel);
    (Array.isArray(parent?.children) ? parent.children : []).forEach((child) => {
      const childKey = sanitizeCategoryKey(child?.key);
      const childLabel = sanitizeCategoryLabel(child?.label);
      if (childKey && childLabel) map.set(childKey, childLabel);
    });
  });
  return map;
}

function mergeDefaultCategoryTree(value) {
  const source = Array.isArray(value) && value.length ? value : DEFAULT_CATEGORY_TREE;
  const parents = source.map((parent) => ({
    ...parent,
    children: Array.isArray(parent?.children) ? parent.children.map((child) => ({ ...child })) : [],
  }));

  DEFAULT_CATEGORY_TREE.forEach((defaultParent) => {
    const defaultParentKey = sanitizeCategoryKey(defaultParent.key);
    const parent = parents.find((item) => sanitizeCategoryKey(item?.key) === defaultParentKey);
    if (!parent) {
      parents.push({
        ...defaultParent,
        children: defaultParent.children.map((child) => ({ ...child })),
      });
      return;
    }

    if (!Array.isArray(parent.children)) parent.children = [];
    const childKeys = new Set(parent.children.map((child) => sanitizeCategoryKey(child?.key)).filter(Boolean));
    defaultParent.children.forEach((defaultChild) => {
      const childKey = sanitizeCategoryKey(defaultChild.key);
      if (!childKeys.has(childKey)) parent.children.push({ ...defaultChild });
    });
  });

  return parents;
}

function sanitizeCategoryKey(value) {
  return String(value || "").trim().toLowerCase();
}

function sanitizeCategoryLabel(value) {
  return String(value || "").replace(/[<>]/g, "").trim().slice(0, 40);
}

function cleanStaticSlugPath(slug) {
  const direct = STATIC_POST_REDIRECTS.get(slug);
  if (direct) return direct;
  const withoutDate = String(slug).replace(/^\d{4}-\d{2}-\d{2}-/, "");
  return STATIC_POST_REDIRECTS.get(withoutDate) || "";
}

function escHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escAttr(value) {
  return escHtml(value);
}

function escJsonString(value) {
  // JSON-LD内に埋め込む文字列。ダブルクォート・バックスラッシュ・改行をエスケープ
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "")
    .replace(/\t/g, "\\t")
    .replace(/<\/script/gi, "<\\/script");
}

function sanitizeBodyHtml(html, post = {}) {
  // 管理画面からの投稿でも、公開HTMLに出す前に危険なタグと属性は落とす。
  return enhanceArticleImages(String(html || "")
    .replace(/<\s*(script|style|iframe|object|embed|form|input|button|select|textarea|meta|link|base|svg|math)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|style|iframe|object|embed|form|input|button|select|textarea|meta|link|base|svg|math)\b[^>]*\/?>/gi, "")
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, "")
    .replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, "")
    .replace(/\s(srcdoc|formaction)\s*=\s*"[^"]*"/gi, "")
    .replace(/\s(srcdoc|formaction)\s*=\s*'[^']*'/gi, "")
    .replace(/\s(srcdoc|formaction)\s*=\s*[^\s>]+/gi, "")
    .replace(/(href|src)\s*=\s*(['"]?)\s*(javascript:|data:text\/html|vbscript:)[^'"\s>]*/gi, '$1="#"')
    .replace(/<\/script/gi, "<\\/script"), post);
}

function imageAltText(post = {}, src = "", type = "body") {
  const title = String(post.title || "").replace(/\s+/g, " ").trim();
  const fallback = type === "cover" ? "アイキャッチ画像" : "記事内画像";
  if (title) return type === "cover" ? `${title}のアイキャッチ画像` : `${title}の画像`;
  return fallback;
}

function isGenericImageAlt(value) {
  const text = String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
  return !text || ["画像", "記事内画像", "image", "photo", "picture"].includes(text);
}

function attrValue(attrs, name) {
  const match = String(attrs || "").match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return match ? (match[1] || match[2] || match[3] || "") : "";
}

function setAttr(attrs, name, value) {
  const safe = escAttr(value);
  const pattern = new RegExp(`(\\s${name}\\s*=\\s*)(?:"[^"]*"|'[^']*'|[^\\s>]+)`, "i");
  if (pattern.test(attrs)) return attrs.replace(pattern, `$1"${safe}"`);
  return `${attrs} ${name}="${safe}"`;
}

function enhanceArticleImages(html, post = {}) {
  return html.replace(/<img\b([^>]*)>/gi, (match, attrs) => {
    let next = attrs;
    if (isGenericImageAlt(attrValue(next, "alt"))) next = setAttr(next, "alt", imageAltText(post, attrValue(next, "src")));
    if (!/\sloading\s*=/.test(next)) next += ' loading="lazy"';
    if (!/\sdecoding\s*=/.test(next)) next += ' decoding="async"';
    if (!/\sstyle\s*=/.test(next)) next += ' style="max-width:100%;height:auto;border-radius:12px;margin:24px 0;display:block;"';
    return `<img${next}>`;
  });
}

function bodyToHtml(post) {
  if (post.bodyHtml && post.bodyHtml.trim()) {
    return sanitizeBodyHtml(post.bodyHtml, post);
  }
  if (post.body && post.body.trim()) {
    return String(post.body)
      .split(/\n\n+/)
      .map((p) => `<p>${escHtml(p.trim())}</p>`)
      .join("");
  }
  return "<p>本文がまだありません。</p>";
}

function plainExcerpt(post, max = 160) {
  if (post.excerpt && post.excerpt.trim()) return post.excerpt.trim().slice(0, max);
  const text = (post.bodyHtml || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text) return text.slice(0, max);
  return `${post.title || "記事"} | ${BLOG_NAME}`;
}

function buildJsonLd(post, slug, fullUrl) {
  const title = post.title || "記事";
  const description = plainExcerpt(post, 200);
  const datePublished = post.date || new Date().toISOString().slice(0, 10);
  const dateModified = post.updatedAt || post.modifiedAt || post.date || datePublished;
  const eyecatch = cardImageUrl(post.eyecatch || FALLBACK_IMAGE);

  const article = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description,
    image: eyecatch,
    datePublished,
    dateModified,
    author: { "@type": "Organization", name: SITE_NAME, url: SITE_ORIGIN },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: FALLBACK_IMAGE },
    },
    isPartOf: { "@type": "Blog", name: BLOG_NAME, url: `${SITE_ORIGIN}/blog/` },
    mainEntityOfPage: { "@type": "WebPage", "@id": fullUrl },
    url: fullUrl,
    inLanguage: "ja-JP",
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "ホーム", item: `${SITE_ORIGIN}/` },
      { "@type": "ListItem", position: 2, name: "ブログ", item: `${SITE_ORIGIN}/blog/` },
      { "@type": "ListItem", position: 3, name: title, item: fullUrl },
    ],
  };

  return [JSON.stringify(article), JSON.stringify(breadcrumb)];
}

function formatPostDate(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T00:00:00+09:00` : raw;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Tokyo" });
}

function dateTimeAttr(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? raw : date.toISOString();
}

function absoluteUrl(value) {
  if (!value) return FALLBACK_IMAGE;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("/")) return `${SITE_ORIGIN}${value}`;
  return `${SITE_ORIGIN}/${value}`;
}

function cardImageUrl(value) {
  const abs = absoluteUrl(value);
  try {
    const parsed = new URL(abs);
    if (parsed.hostname === "images.yohelab.com" || parsed.hostname.endsWith(".r2.dev")) {
      const key = parsed.pathname.replace(/^\/+/, "");
      if (/^[\w.-]+\.webp$/i.test(key)) return `${SITE_ORIGIN}/blog-images/${encodeURIComponent(key)}`;
    }
    if (parsed.hostname === "yohelab.com" && parsed.pathname === "/api/blog-image") {
      const key = parsed.searchParams.get("key") || "";
      if (/^[\w.-]+\.webp$/i.test(key)) return `${SITE_ORIGIN}/blog-images/${encodeURIComponent(key)}`;
    }
  } catch {
    return abs;
  }
  return abs;
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

function coverImageStyle(post) {
  const cover = normalizeCoverSettings(post.cover);
  return [
    `object-fit:${cover.fit}`,
    `object-position:${cover.x}% ${cover.y}%`,
    `transform:scale(${cover.zoom / 100})`,
    `transform-origin:${cover.x}% ${cover.y}%`,
  ].join(";");
}

function displayCategoryLabel(tag, categoryMap) {
  const raw = String(tag || "").trim();
  return categoryMap.get(raw.toLowerCase()) || raw;
}

function renderTags(tags, categoryMap) {
  if (!Array.isArray(tags) || !tags.length) return "";
  const seen = new Set();
  return tags
    .map((tag) => displayCategoryLabel(tag, categoryMap))
    .filter((label) => {
      if (!label || seen.has(label)) return false;
      seen.add(label);
      return true;
    })
    .slice(0, 8)
    .map((label) => `<span class="post-tag">${escHtml(label)}</span>`)
    .join("");
}

function renderBlogHeader() {
  return `<header class="site-header" style="background:#fff;border-bottom:3px solid #087a63;position:sticky;top:0;z-index:100;">
    <div class="header-inner" style="max-width:1100px;margin:0 auto;padding:0 16px;display:flex;align-items:center;gap:20px;height:56px;">
      <a href="/" style="display:flex;align-items:center;gap:10px;font-size:20px;font-weight:900;color:#087a63;letter-spacing:-0.03em;flex-shrink:0;text-decoration:none;">
        <img src="/yohelab-mascot-v2-20260518-64.png" width="36" height="36" alt="よへラボ" decoding="async" style="width:36px;height:36px;border-radius:8px;" />
        よへラボ
      </a>
      <nav style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;">
        <a href="/blog/" style="padding:5px 11px;border-radius:4px;font-size:13px;font-weight:700;color:#444;text-decoration:none;">ブログ</a>
        <a href="/lp/bunsirube/" style="padding:5px 11px;border-radius:4px;font-size:13px;font-weight:700;color:#444;text-decoration:none;">文標</a>
        <a href="/about/" style="padding:5px 11px;border-radius:4px;font-size:13px;font-weight:700;color:#444;text-decoration:none;">サイトについて</a>
      </nav>
    </div>
  </header>`;
}

function renderPostHTML(post, slug, categoryMap = buildCategoryMap(DEFAULT_CATEGORY_TREE)) {
  const title = post.title || "無題の記事";
  const description = plainExcerpt(post, 160);
  const date = post.date || new Date().toISOString().slice(0, 10);
  const updatedAt = post.updatedAt || post.modifiedAt || date;
  const publishedLabel = formatPostDate(date);
  const updatedLabel = formatPostDate(updatedAt);
  const dateMetaHtml = `<div class="post-date-line"><time datetime="${escAttr(dateTimeAttr(date))}">投稿日 ${escHtml(publishedLabel)}</time><span>/</span><time datetime="${escAttr(dateTimeAttr(updatedAt))}">最終更新日 ${escHtml(updatedLabel || publishedLabel)}</time></div>`;
  const eyecatchAbs = cardImageUrl(post.eyecatch || FALLBACK_IMAGE);
  const eyecatchAttr = post.eyecatch ? escAttr(post.eyecatch) : "";
  const tagsHtml = renderTags(post.tags, categoryMap);
  const coverHtml = post.eyecatch
    ? `<figure class="post-cover"><img src="${eyecatchAttr}" alt="${escAttr(imageAltText(post, post.eyecatch, "cover"))}" style="${escAttr(coverImageStyle(post))}" loading="eager" decoding="async" fetchpriority="high" /></figure>`
    : "";
  const titleHtml = post.eyecatch
    ? `<h1 class="sr-only">${escHtml(title)}</h1>`
    : `<section class="post-hero">
        <span class="post-hero-kicker">Article</span>
        <div class="post-meta">
          ${tagsHtml}
        </div>
        <h1 class="post-title">${escHtml(title)}</h1>
        ${dateMetaHtml}
      </section>`;
  const bodyHtml = bodyToHtml(post);
  const fullUrl = prettyPostUrl(slug);
  const [articleLd, breadcrumbLd] = buildJsonLd(post, slug, fullUrl);
  const twitterShare = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    title,
  )}&url=${encodeURIComponent(fullUrl)}`;

  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escHtml(title)} | ${escHtml(BLOG_NAME)}</title>
  <meta name="description" content="${escAttr(description)}" />
  <meta name="author" content="${escAttr(SITE_NAME)}" />
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1" />
  <link rel="canonical" href="${escAttr(fullUrl)}" />
  <link rel="alternate" hreflang="ja" href="${escAttr(fullUrl)}" />
  <link rel="alternate" hreflang="x-default" href="${escAttr(fullUrl)}" />
  <link rel="alternate" type="application/rss+xml" title="よへラボ RSS" href="${SITE_ORIGIN}/feed.xml" />
  <link rel="preload" as="image" href="${escAttr(post.eyecatch ? post.eyecatch : FALLBACK_IMAGE)}" fetchpriority="high" />
  <meta property="og:title" content="${escAttr(title)} | ${escAttr(BLOG_NAME)}" />
  <meta property="og:description" content="${escAttr(description)}" />
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="${escAttr(SITE_NAME)}" />
  <meta property="og:locale" content="ja_JP" />
  <meta property="og:url" content="${escAttr(fullUrl)}" />
  <meta property="og:image" content="${escAttr(eyecatchAbs)}" />
  <meta property="og:image:secure_url" content="${escAttr(eyecatchAbs)}" />
  <meta property="og:image:type" content="image/webp" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="675" />
  <meta property="article:published_time" content="${escAttr(date)}T00:00:00+09:00" />
  <meta property="article:modified_time" content="${escAttr(dateTimeAttr(updatedAt))}" />
  <meta property="article:author" content="${SITE_ORIGIN}/about/" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escAttr(title)}" />
  <meta name="twitter:description" content="${escAttr(description)}" />
  <meta name="twitter:image" content="${escAttr(eyecatchAbs)}" />
  <meta name="twitter:image:alt" content="${escAttr(imageAltText(post, post.eyecatch, "cover"))}" />
  <meta name="twitter:site" content="@yohe_lab" />
  <meta name="twitter:creator" content="@yohe_lab" />
  <link rel="icon" type="image/png" href="/yohelab-mascot-v2-20260518-32.png" />
  <link rel="stylesheet" href="/shared/site.min.css" />
  <script type="application/ld+json">${articleLd}</script>
  <script type="application/ld+json">${breadcrumbLd}</script>
  <script async src="/shared/matomo-loader.js"></script>
  <script defer src="/shared/back-to-top.js"></script>
  <style>
    body { background:#fff;color:var(--text); }
    .post-outer { max-width:760px;margin:0 auto;padding:48px 24px 100px; }
    .post-cover { width:100%;aspect-ratio:16/9;margin:0 0 28px;overflow:hidden;border-radius:28px;background:#eef5ff;border:1px solid #dce7fb;box-shadow:var(--shadow-sm); }
    .post-cover img { width:100%;height:100%;display:block; }
    .sr-only { position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0; }
    .post-hero { border-radius:28px;padding:32px;margin-bottom:30px;background:linear-gradient(135deg,#ecfdf5,#eef6ff);border:1px solid #dce7fb;box-shadow:var(--shadow-sm); }
    .post-hero-kicker { display:inline-flex;padding:7px 12px;border-radius:999px;background:#087a63;color:#fff;font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;margin-bottom:18px; }
    .post-meta { display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:13px;color:var(--muted);margin:0 0 18px; }
    .post-tag { background:#f0f8f4;color:var(--green-dark,#075c4c);border-radius:999px;padding:3px 12px;font-size:12px;font-weight:700;text-decoration:none; }
    .post-title { font-size:clamp(30px,5.6vw,54px);font-weight:900;line-height:1.12;margin:0;color:var(--text);letter-spacing:-.055em; }
    .post-date-line { display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:16px 0 0;color:var(--muted);font-size:14px;font-weight:700;line-height:1.7; }
    .post-body { font-size:17px; line-height:2; color:var(--text); }
    .post-body h2 { font-size: clamp(20px,3.5vw,26px); font-weight:900; margin:44px 0 16px; letter-spacing:-.03em; padding-bottom:10px; border-bottom:2px solid var(--border); }
    .post-body h3 { font-size: clamp(17px,3vw,21px); font-weight:800; margin:32px 0 12px; }
    .post-body p { margin-bottom:20px; }
    .post-body ul, .post-body ol { padding-left:26px; margin-bottom:20px; }
    .post-body li { margin-bottom:8px; line-height:1.85; }
    .post-body blockquote { border-left:4px solid var(--green); padding:14px 20px; background:#f0f8f4; border-radius:0 12px 12px 0; margin:24px 0; color:var(--muted); font-size:16px; }
    .post-body img { max-width:100%; height:auto; border-radius:12px; margin:24px 0; display:block; }
    .post-body a { color:var(--green); text-decoration:underline; }
    .post-body .blog-link-card { display:grid;grid-template-columns:minmax(0,1fr) 148px;gap:16px;align-items:stretch;margin:28px 0;padding:16px;border:1px solid var(--border);border-radius:18px;background:#fff;color:var(--text);text-decoration:none;box-shadow:0 12px 30px rgba(14,55,42,.07); }
    .post-body .blog-link-card:hover { border-color:#bde7d7;background:#fbfffd; }
    .post-body .blog-link-card-main { min-width:0;display:grid;gap:7px;align-content:center; }
    .post-body .blog-link-card-site { color:var(--green);font-size:12px;font-weight:900;line-height:1.4; }
    .post-body .blog-link-card-title { color:var(--text);font-size:16px;font-weight:900;line-height:1.55; }
    .post-body .blog-link-card-desc { color:var(--muted);font-size:13px;line-height:1.65;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden; }
    .post-body .blog-link-card-url { color:#78908a;font-size:12px;line-height:1.4;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
    .post-body .blog-link-card-thumb { border-radius:14px;overflow:hidden;background:#e8f7f1;min-height:104px;display:grid;place-items:center;color:var(--green);font-size:24px;font-weight:900; }
    .post-body .blog-link-card-thumb img { width:100%;height:100%;object-fit:cover;display:block;margin:0;border-radius:0; }
    .post-footer { margin-top:56px; padding-top:28px; border-top:1px solid var(--border); }
    .post-footer-inner { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:16px; }
    .back-link { display:inline-flex; align-items:center; gap:6px; color:var(--muted); font-size:14px; font-weight:700; text-decoration:none; transition:color .2s; }
    .back-link:hover { color:var(--green); }
    .share-btn { display:inline-flex; align-items:center; gap:6px; background:#1d9bf0; color:#fff; border:none; border-radius:999px; padding:8px 18px; font-size:13px; font-weight:700; cursor:pointer; text-decoration:none; }
    @media (max-width:600px) {
      .header-inner { flex-wrap:wrap; height:auto !important; padding-top:8px !important; padding-bottom:8px !important; }
      .header-inner > nav { order:3; width:100%; }
      .post-outer { padding:32px 18px 80px; }
      .post-cover { border-radius:22px;margin-bottom:20px; }
      .post-hero { padding:24px 20px;border-radius:22px; }
      .post-body .blog-link-card { grid-template-columns:1fr; }
      .post-body .blog-link-card-thumb { min-height:150px; }
    }
  </style>
</head>
<body>
  ${renderBlogHeader()}

  <main class="post-outer" id="post-outer">
    <article>
      ${coverHtml}
      ${titleHtml}
      <div class="post-body">${bodyHtml}</div>
      <div class="post-footer">
        <div class="post-footer-inner">
          <a class="back-link" href="/">← トップページに戻る</a>
          <a class="share-btn" href="${escAttr(twitterShare)}" target="_blank" rel="noreferrer">𝕏 シェア</a>
        </div>
      </div>
    </article>
  </main>

  <footer class="footer">
    <div class="footer-inner">
      <div>© よへラボ / よへラボブログ</div>
      <div class="footer-links">
        <a href="/blog/">記事一覧</a>
        <a href="/lp/research-writer/">記事メーカー</a>
        <a href="/lp/bunsirube/">WPテーマ</a>
      </div>
    </div>
  </footer>
</body>
</html>`;
}
