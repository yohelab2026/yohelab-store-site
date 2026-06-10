import { staticBlogSocialPosts } from "../../generated/static-blog-social-posts.js";
import { SITE, buildBreadcrumbJsonLd } from "../../lib/site-seo.js";

/**
 * /blog/post/?slug=xxx を個別記事URLへリダイレクトする Cloudflare Pages Function
 *
 * 静的HTMLでJS経由で取得していた記事メタデータを、サーバー側で先に埋めて返すことで
 * Googlebot・Bingbot・AIクローラー・SNSプレビューに正しいタイトル・description・OG・
 * JSON-LD・本文を瞬時に渡せるようになる。
 *
 * 失敗時は context.next() で従来の静的HTMLにフォールバック。
 */

const SITE_ORIGIN = SITE.origin;
const SITE_NAME = SITE.name;
const BLOG_NAME = SITE.blogName;
const FALLBACK_IMAGE = `${SITE_ORIGIN}/yohelab-mascot-v2-20260518.png`;
const GA4_MEASUREMENT_ID = "G-ZK7SP3RVSB";
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
    { key: "deepseek", label: "DeepSeek" },
    { key: "codex", label: "Codex" },
    { key: "cursor", label: "Cursor" },
    { key: "copilot", label: "Copilot" },
    { key: "midjourney", label: "Midjourney" },
  ] },
  { key: "ai-tools", label: "AIツール", children: [
    { key: "ai-tools", label: "AIツール" },
    { key: "bunsirube", label: "文標" },
    { key: "wordpress", label: "文標・WordPress" },
    { key: "template", label: "記事テンプレ" },
  ] },
];
const DEFAULT_PARENT_KEYS = new Set(DEFAULT_CATEGORY_TREE.map((item) => item.key));
const STATIC_POST_REDIRECTS = new Map([
  ["ai-news-selling-ideas", "/blog/ai-news-selling-ideas/"],
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
  const requestedLocale = normalizeLocale(options.locale || localeFromPath(requestUrl.pathname));
  if (!cleanSlug || isReservedBlogSlug(cleanSlug)) {
    return context.next();
  }

  const cleanStaticPath = requestedLocale === "ja" ? cleanStaticSlugPath(cleanSlug) : "";
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
    return Response.redirect(new URL(prettyPostPath(cleanSlug, normalizeLocale(post.locale)), requestUrl.origin).toString(), 301);
  }

  post = hydrateStaticPostImages(post);
  const locale = normalizeLocale(post.locale);
  if (locale !== requestedLocale) {
    return Response.redirect(new URL(prettyPostPath(cleanSlug, locale), requestUrl.origin).toString(), 301);
  }
  const categoryMap = await readCategoryMap(kv);
  const translation = await findTranslation(kv, cleanSlug, post);
  const html = renderPostHTML(post, cleanSlug, categoryMap, { locale, translation });

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Cloudflare CDNで5分間キャッシュ。記事更新時は手動でPurge推奨
      "Cache-Control": "public, max-age=60, s-maxage=300",
      "X-Robots-Tag": "index,follow,max-image-preview:large,max-snippet:-1",
    },
  });
}

export function prettyPostPath(slug, locale = "ja") {
  return `${normalizeLocale(locale) === "en" ? "/en/blog/" : "/blog/"}${encodeURIComponent(String(slug || "").trim())}/`;
}

export function prettyPostUrl(slug, locale = "ja") {
  return `${SITE_ORIGIN}${prettyPostPath(slug, locale)}`;
}

export function isReservedBlogSlug(slug) {
  return RESERVED_BLOG_SLUGS.has(String(slug || "").trim().toLowerCase());
}

function samePath(a, b) {
  return String(a || "").replace(/\/+$/, "") === String(b || "").replace(/\/+$/, "");
}

function normalizeLocale(value) {
  return String(value || "").trim().toLowerCase().startsWith("en") ? "en" : "ja";
}

function localeFromPath(pathname) {
  return String(pathname || "").startsWith("/en/") ? "en" : "ja";
}

async function findTranslation(kv, currentSlug, post = {}) {
  const currentLocale = normalizeLocale(post.locale);
  const directSlug = String(post.translationSlug || "").trim();
  if (directSlug && directSlug !== currentSlug) {
    const direct = await kv.get(`post:${directSlug}`, { type: "json" });
    const directLocale = normalizeLocale(direct?.locale);
    if (direct && directLocale !== currentLocale) return { slug: directSlug, locale: directLocale, title: direct.title || "" };
  }

  let cursor;
  do {
    const list = await kv.list({ prefix: "post:", cursor, limit: 100 });
    const reverse = (list.keys || []).find((key) => (
      key.name !== `post:${currentSlug}`
      && normalizeLocale(key.metadata?.locale) !== currentLocale
      && String(key.metadata?.translationSlug || "").trim() === currentSlug
    ));
    if (reverse) {
      return {
        slug: reverse.name.replace(/^post:/, ""),
        locale: normalizeLocale(reverse.metadata?.locale),
        title: reverse.metadata?.title || "",
      };
    }
    cursor = list.list_complete ? undefined : list.cursor;
  } while (cursor);
  return null;
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
  const source = mergeDefaultCategoryTree(Array.isArray(categories) && categories.length ? categories : DEFAULT_CATEGORY_TREE)
    .filter((parent) => DEFAULT_PARENT_KEYS.has(sanitizeCategoryKey(parent?.key)));
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

const SEO_TITLE_MAX_CHARS = 60;

function seoCharLength(value) {
  return Array.from(String(value || "")).length;
}

function cleanSeoTitle(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/^\s*(?:よへラボブログ|よへラボ記事一覧|よへラボ)\s*(?:[|｜\-–—:：]\s*)?/i, "")
    .replace(/\s*(?:[|｜\-–—:：]\s*)?(?:よへラボブログ|よへラボ記事一覧|よへラボ)\s*$/i, "")
    .trim();
}

function truncateSeoPart(value, maxChars) {
  const clean = String(value || "").replace(/\s+/g, " ").trim();
  const chars = Array.from(clean);
  if (chars.length <= maxChars) return clean;
  return `${chars.slice(0, Math.max(1, maxChars - 1)).join("").replace(/[、。・|｜\-–—:：\s]+$/g, "")}…`;
}

function postSeoTitle(title, locale = "ja") {
  const delimiter = " | ";
  const brand = locale === "en" ? "Yohe Lab" : BLOG_NAME;
  const main = cleanSeoTitle(title) || (locale === "en" ? "Article" : "記事");
  return `${brand}${delimiter}${truncateSeoPart(main, SEO_TITLE_MAX_CHARS - seoCharLength(brand) - seoCharLength(delimiter))}`;
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

function bodyToHtml(post, locale = "ja") {
  if (post.bodyHtml && post.bodyHtml.trim()) {
    return removeLeadingH1(sanitizeBodyHtml(post.bodyHtml, post));
  }
  if (post.body && post.body.trim()) {
    return String(post.body)
      .split(/\n\n+/)
      .map((p) => `<p>${escHtml(p.trim())}</p>`)
      .join("");
  }
  return `<p>${locale === "en" ? "This article does not have any content yet." : "本文がまだありません。"}</p>`;
}

function removeLeadingH1(html) {
  return String(html || "").replace(/^\s*<h1\b[^>]*>[\s\S]*?<\/h1>\s*/i, "");
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

function buildJsonLd(post, slug, fullUrl, locale = "ja") {
  const title = post.title || "記事";
  const description = plainExcerpt(post, 200);
  const datePublished = post.date || new Date().toISOString().slice(0, 10);
  const dateModified = visibleUpdatedAt(post, datePublished);
  const eyecatch = socialImageUrl(post);

  const article = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description,
    image: eyecatch,
    datePublished,
    author: { "@type": "Organization", name: SITE_NAME, url: SITE_ORIGIN },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: FALLBACK_IMAGE },
    },
    isPartOf: { "@type": "Blog", name: locale === "en" ? "Yohe Lab Blog" : BLOG_NAME, url: locale === "en" ? `${SITE_ORIGIN}/en/blog/` : `${SITE_ORIGIN}/blog/` },
    mainEntityOfPage: { "@type": "WebPage", "@id": fullUrl },
    url: fullUrl,
    inLanguage: locale === "en" ? "en" : "ja-JP",
  };
  if (dateModified) article.dateModified = dateModified;

  const breadcrumb = buildBreadcrumbJsonLd([
    { name: locale === "en" ? "Home" : "ホーム", item: locale === "en" ? `${SITE_ORIGIN}/en/` : `${SITE_ORIGIN}/` },
    { name: locale === "en" ? "Blog" : "ブログ", item: locale === "en" ? `${SITE_ORIGIN}/en/blog/` : `${SITE_ORIGIN}/blog/` },
    { name: title, item: fullUrl },
  ]);

  return [JSON.stringify(article), breadcrumb];
}

function formatPostDate(value, locale = "ja") {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T00:00:00+09:00` : raw;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString(locale === "en" ? "en-US" : "ja-JP", { year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Tokyo" });
}

function dateTimeAttr(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? raw : date.toISOString();
}

function dateOnly(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("ja-JP-u-ca-gregory", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Tokyo",
  }).formatToParts(date);
  const part = (type) => parts.find((item) => item.type === type)?.value || "";
  return [part("year"), part("month"), part("day")].filter(Boolean).join("-");
}

function visibleUpdatedAt(post = {}, publishedDate = "") {
  const updated = post.updatedAt || post.modifiedAt || "";
  if (!updated) return "";
  const publishedDay = dateOnly(publishedDate);
  const updatedDay = dateOnly(updated);
  return publishedDay && updatedDay && publishedDay !== updatedDay ? updated : "";
}

function absoluteUrl(value) {
  if (!value) return FALLBACK_IMAGE;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("/")) return `${SITE_ORIGIN}${value}`;
  return `${SITE_ORIGIN}/${value}`;
}

function staticPostMetaFor(post = {}) {
  const candidates = [
    post.sourceSlug,
    post.staticSlug,
    post.slug,
    String(post.slug || "").replace(/^\d{4}-\d{2}-\d{2}-/, ""),
  ].filter(Boolean);
  return staticBlogSocialPosts.find((item) => candidates.includes(item.slug)) || null;
}

function hydrateStaticPostImages(post = {}) {
  const meta = staticPostMetaFor(post);
  if (!meta) return post;
  const eyecatch = post.eyecatch || meta.eyecatch || "";
  const socialImage = eyecatch;
  return { ...post, eyecatch, socialImage };
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

function socialImageUrl(post = {}) {
  return cardImageUrl(post.eyecatch || post.socialImage || FALLBACK_IMAGE);
}

function imageMimeForUrl(value) {
  const url = String(value || "").toLowerCase().split("?")[0];
  if (url.endsWith(".jpg") || url.endsWith(".jpeg")) return "image/jpeg";
  if (url.endsWith(".png")) return "image/png";
  return "image/webp";
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

const EN_CATEGORY_LABELS = new Map([
  ["ai-news", "AI News"],
  ["ai-tools", "AI Tools"],
  ["bunsirube", "Bunsirube"],
  ["wordpress", "WordPress"],
  ["template", "Article Templates"],
  ["article", "Articles"],
  ["chatgpt", "ChatGPT"],
  ["claude", "Claude"],
  ["gemini", "Gemini"],
  ["copilot", "Copilot"],
  ["openai", "OpenAI"],
]);

function displayCategoryLabel(tag, categoryMap, locale = "ja") {
  const raw = String(tag || "").trim();
  if (locale === "en") return EN_CATEGORY_LABELS.get(raw.toLowerCase()) || raw;
  return categoryMap.get(raw.toLowerCase()) || raw;
}

function renderTags(tags, categoryMap, locale = "ja") {
  if (!Array.isArray(tags) || !tags.length) return "";
  const seen = new Set();
  return tags
    .map((tag) => displayCategoryLabel(tag, categoryMap, locale))
    .filter((label) => {
      if (!label || seen.has(label)) return false;
      seen.add(label);
      return true;
    })
    .slice(0, 8)
    .map((label) => `<span class="post-tag">${escHtml(label)}</span>`)
    .join("");
}

function ga4Snippet() {
  return `<script async src="https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${GA4_MEASUREMENT_ID}');
  </script>`;
}

function renderBlogHeader(locale = "ja") {
  const isEnglish = locale === "en";
  return `<header class="site-header" style="background:#fff;border-bottom:3px solid #087a63;position:sticky;top:0;z-index:100;">
    <div class="header-inner" style="max-width:1100px;margin:0 auto;padding:0 16px;display:flex;align-items:center;gap:20px;height:56px;">
      <a href="${isEnglish ? "/en/" : "/"}" style="display:flex;align-items:center;gap:10px;font-size:20px;font-weight:900;color:#087a63;letter-spacing:-0.03em;flex-shrink:0;text-decoration:none;">
        <img src="/yohelab-mascot-v2-20260518-64.png" width="36" height="36" alt="" decoding="async" style="width:36px;height:36px;border-radius:8px;" />
        ${isEnglish ? "Yohe Lab" : "よへラボ"}
      </a>
      <nav style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;">
        <a href="${isEnglish ? "/en/blog/" : "/blog/"}" style="padding:5px 11px;border-radius:4px;font-size:13px;font-weight:700;color:#444;text-decoration:none;">${isEnglish ? "Blog" : "ブログ"}</a>
        <a href="/lp/bunsirube/" style="padding:5px 11px;border-radius:4px;font-size:13px;font-weight:700;color:#444;text-decoration:none;">${isEnglish ? "Bunsirube" : "文標"}</a>
        <a href="${isEnglish ? "/en/" : "/about/"}" style="padding:5px 11px;border-radius:4px;font-size:13px;font-weight:700;color:#444;text-decoration:none;">${isEnglish ? "English home" : "サイトについて"}</a>
      </nav>
    </div>
  </header>`;
}

function renderPostHTML(post, slug, categoryMap = buildCategoryMap(DEFAULT_CATEGORY_TREE), options = {}) {
  const locale = normalizeLocale(options.locale || post.locale);
  const isEnglish = locale === "en";
  const translation = options.translation || null;
  const title = post.title || (isEnglish ? "Untitled article" : "無題の記事");
  const seoTitle = postSeoTitle(title, locale);
  const description = plainExcerpt(post, 160);
  const date = post.date || new Date().toISOString().slice(0, 10);
  const updatedAt = visibleUpdatedAt(post, date);
  const publishedLabel = formatPostDate(date, locale);
  const updatedLabel = formatPostDate(updatedAt, locale);
  const updateMetaHtml = updatedAt && updatedLabel ? `<span>/</span><time datetime="${escAttr(dateTimeAttr(updatedAt))}">${isEnglish ? "Updated" : "最終更新日"} ${escHtml(updatedLabel)}</time>` : "";
  const dateMetaHtml = `<div class="post-date-line"><time datetime="${escAttr(dateTimeAttr(date))}">${isEnglish ? "Published" : "投稿日"} ${escHtml(publishedLabel)}</time>${updateMetaHtml}</div>`;
  const eyecatchAbs = socialImageUrl(post);
  const displayEyecatch = post.eyecatch || FALLBACK_IMAGE;
  const eyecatchAttr = post.eyecatch ? escAttr(post.eyecatch) : "";
  const tagsHtml = renderTags(post.tags, categoryMap, locale);
  const coverHtml = post.eyecatch
    ? `<figure class="post-cover"><img src="${eyecatchAttr}" alt="${escAttr(imageAltText(post, post.eyecatch, "cover"))}" style="${escAttr(coverImageStyle(post))}" loading="eager" decoding="async" fetchpriority="high" /></figure>`
    : "";
  const titleHtml = post.eyecatch
    ? `<h1 class="sr-only">${escHtml(title)}</h1>
      <div class="post-meta">
        ${tagsHtml}
      </div>
      ${dateMetaHtml}`
    : `<section class="post-hero">
        <span class="post-hero-kicker">Article</span>
        <div class="post-meta">
          ${tagsHtml}
        </div>
        <h1 class="post-title">${escHtml(title)}</h1>
        ${dateMetaHtml}
      </section>`;
  const bodyHtml = bodyToHtml(post, locale);
  const fullUrl = prettyPostUrl(slug, locale);
  const translationUrl = translation ? prettyPostUrl(translation.slug, translation.locale) : "";
  const [articleLd, breadcrumbLd] = buildJsonLd(post, slug, fullUrl, locale);
  const twitterShare = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    title,
  )}&url=${encodeURIComponent(fullUrl)}`;

  return `<!doctype html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escHtml(seoTitle)}</title>
  <meta name="description" content="${escAttr(description)}" />
  <meta name="author" content="${escAttr(SITE_NAME)}" />
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1" />
  <link rel="canonical" href="${escAttr(fullUrl)}" />
  <link rel="alternate" hreflang="${locale}" href="${escAttr(fullUrl)}" />
  ${translationUrl ? `<link rel="alternate" hreflang="${escAttr(translation.locale)}" href="${escAttr(translationUrl)}" />` : ""}
  <link rel="alternate" hreflang="x-default" href="${escAttr(locale === "ja" ? fullUrl : translationUrl || fullUrl)}" />
  <link rel="alternate" type="application/rss+xml" title="よへラボ RSS" href="${SITE_ORIGIN}/feed.xml" />
  <link rel="preload" as="image" href="${escAttr(displayEyecatch)}" fetchpriority="high" />
  <meta property="og:title" content="${escAttr(seoTitle)}" />
  <meta property="og:description" content="${escAttr(description)}" />
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="${escAttr(SITE_NAME)}" />
  <meta property="og:locale" content="${isEnglish ? "en_US" : "ja_JP"}" />
  ${translationUrl ? `<meta property="og:locale:alternate" content="${translation.locale === "en" ? "en_US" : "ja_JP"}" />` : ""}
  <meta property="og:url" content="${escAttr(fullUrl)}" />
  <meta property="og:image" content="${escAttr(eyecatchAbs)}" />
  <meta property="og:image:url" content="${escAttr(eyecatchAbs)}" />
  <meta property="og:image:secure_url" content="${escAttr(eyecatchAbs)}" />
  <meta property="og:image:type" content="${escAttr(imageMimeForUrl(eyecatchAbs))}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="675" />
  <meta property="og:image:alt" content="${escAttr(imageAltText(post, post.eyecatch, "cover"))}" />
  <meta property="article:published_time" content="${escAttr(date)}T00:00:00+09:00" />
  ${updatedAt ? `<meta property="article:modified_time" content="${escAttr(dateTimeAttr(updatedAt))}" />` : ""}
  <meta property="article:author" content="${SITE_ORIGIN}/about/" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escAttr(seoTitle)}" />
  <meta name="twitter:description" content="${escAttr(description)}" />
  <meta name="twitter:image" content="${escAttr(eyecatchAbs)}" />
  <meta name="twitter:image:src" content="${escAttr(eyecatchAbs)}" />
  <meta name="twitter:image:alt" content="${escAttr(imageAltText(post, post.eyecatch, "cover"))}" />
  <meta name="twitter:site" content="@yohe_lab" />
  <meta name="twitter:creator" content="@yohe_lab" />
  <link rel="icon" type="image/png" href="/yohelab-mascot-v2-20260518-32.png" />
  <link rel="stylesheet" href="/shared/site.min.css" />
  <script type="application/ld+json">${articleLd}</script>
  <script type="application/ld+json">${breadcrumbLd}</script>
  <script async src="/shared/matomo-loader.js"></script>
  ${ga4Snippet()}
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
  ${renderBlogHeader(locale)}

  <main class="post-outer" id="post-outer">
    <article>
      ${coverHtml}
      ${titleHtml}
      <div class="post-body">${bodyHtml}</div>
      <div class="post-footer">
        <div class="post-footer-inner">
          <a class="back-link" href="${isEnglish ? "/en/" : "/"}">← ${isEnglish ? "Back to home" : "トップページに戻る"}</a>
          ${translationUrl ? `<a class="back-link" href="${escAttr(translationUrl)}" hreflang="${escAttr(translation.locale)}">${translation.locale === "en" ? "Read in English" : "日本語で読む"} →</a>` : ""}
          <a class="share-btn" href="${escAttr(twitterShare)}" target="_blank" rel="noreferrer">𝕏 ${isEnglish ? "Share" : "シェア"}</a>
        </div>
      </div>
    </article>
  </main>

  <footer class="footer">
    <div class="footer-inner">
      <div>© ${isEnglish ? "Yohe Lab" : "よへラボ / よへラボブログ"}</div>
      <div class="footer-links">
        <a href="${isEnglish ? "/en/blog/" : "/blog/"}">${isEnglish ? "Blog" : "記事一覧"}</a>
        <a href="/lp/research-writer/">${isEnglish ? "Article maker" : "記事メーカー"}</a>
        <a href="/lp/bunsirube/">${isEnglish ? "WordPress theme" : "WPテーマ"}</a>
      </div>
    </div>
  </footer>
</body>
</html>`;
}
