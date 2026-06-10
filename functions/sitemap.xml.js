/**
 * /sitemap.xml を動的生成する Cloudflare Pages Function
 *
 * /blog/post/?slug=... のようなクエリURLは載せず、
 * 公開済み記事は /blog/{slug}/ の個別URLだけを検索エンジンに渡す。
 */
import { staticBlogSitemapPosts } from "./generated/static-blog-posts.js";
import { SITE } from "./lib/site-seo.js";

const URLS = [
  { loc: "/", lastmod: "2026-06-10", changefreq: "weekly", priority: "1.0", alternates: [
    { hreflang: "ja", loc: "/" },
    { hreflang: "en", loc: "/en/" },
    { hreflang: "x-default", loc: "/" },
  ] },
  { loc: "/en/", lastmod: "2026-06-10", changefreq: "weekly", priority: "0.8", alternates: [
    { hreflang: "ja", loc: "/" },
    { hreflang: "en", loc: "/en/" },
    { hreflang: "x-default", loc: "/" },
  ] },
  { loc: "/about/", lastmod: "2026-05-18", changefreq: "monthly", priority: "0.7" },
  { loc: "/blog/", lastmod: "2026-06-10", changefreq: "weekly", priority: "0.6", alternates: [
    { hreflang: "ja", loc: "/blog/" },
    { hreflang: "en", loc: "/en/blog/" },
    { hreflang: "x-default", loc: "/blog/" },
  ] },
  { loc: "/en/blog/", lastmod: "2026-06-10", changefreq: "weekly", priority: "0.6", alternates: [
    { hreflang: "ja", loc: "/blog/" },
    { hreflang: "en", loc: "/en/blog/" },
    { hreflang: "x-default", loc: "/blog/" },
  ] },
  { loc: "/lp/bunsirube/", lastmod: "2026-05-19", changefreq: "weekly", priority: "0.9" },
  { loc: "/lp/bunsirube/install/", lastmod: "2026-05-12", changefreq: "monthly", priority: "0.7" },
  { loc: "/lp/bunsirube/demo/", lastmod: "2026-05-12", changefreq: "monthly", priority: "0.7" },
  { loc: "/lp/bunsirube/updates/", lastmod: "2026-05-12", changefreq: "weekly", priority: "0.6" },
  { loc: "/contact/", lastmod: "2026-05-12", changefreq: "monthly", priority: "0.4" },
  { loc: "/legal/commerce/", lastmod: "2026-05-12", changefreq: "monthly", priority: "0.3" },
  { loc: "/legal/privacy/", lastmod: "2026-05-12", changefreq: "monthly", priority: "0.3" },
  { loc: "/legal/terms/", lastmod: "2026-05-12", changefreq: "monthly", priority: "0.3" },
];
const STATIC_CANONICAL_SLUGS = new Set(staticBlogSitemapPosts.map((post) => post.slug).filter(Boolean));

export async function onRequestGet(context) {
  const urls = mergeUrls(URLS, await dynamicBlogUrls(context.env), staticBlogUrls());
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
    urls.map((u) =>
      `  <url>\n` +
      `    <loc>${xmlEscape(SITE.origin + u.loc)}</loc>\n` +
      (u.alternates || []).map((alternate) => `    <xhtml:link rel="alternate" hreflang="${xmlEscape(alternate.hreflang)}" href="${xmlEscape(SITE.origin + alternate.loc)}" />\n`).join("") +
      `    <lastmod>${xmlEscape(u.lastmod)}</lastmod>\n` +
      `    <changefreq>${xmlEscape(u.changefreq)}</changefreq>\n` +
      `    <priority>${xmlEscape(u.priority)}</priority>\n` +
      `  </url>`,
    ).join("\n") +
    `\n</urlset>\n`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=60, s-maxage=120",
      "X-Robots-Tag": "index,follow",
    },
  });
}

function staticBlogUrls() {
  return staticBlogSitemapPosts
    .map((post) => ({
      loc: post.url,
      lastmod: normalizeDate(post.date),
      changefreq: "monthly",
      priority: "0.6",
    }))
    .filter((item) => item.loc && /^\/blog\/[^/]+\/$/.test(item.loc));
}

async function dynamicBlogUrls(env) {
  const kv = env?.BLOG_KV;
  if (!kv) return [];

  try {
    const keys = [];
    let cursor;
    do {
      const list = await kv.list({ prefix: "post:", cursor });
      keys.push(...(list.keys || []));
      cursor = list.list_complete ? undefined : list.cursor;
    } while (cursor);

    const keyBySlug = new Map(keys.map((key) => [key.name.replace(/^post:/, ""), key]));

    return keys
      .map((key) => {
        const slug = key.name.replace(/^post:/, "");
        if (!slug) return null;
        const canonicalSlug = slug.replace(/^\d{4}-\d{2}-\d{2}-/, "");
        if (STATIC_CANONICAL_SLUGS.has(canonicalSlug)) return null;
        const locale = normalizeLocale(key.metadata?.locale);
        const translationSlug = findTranslationSlug(keys, slug, key.metadata?.translationSlug);
        const translationKey = translationSlug ? keyBySlug.get(translationSlug) : null;
        const translationLocale = normalizeLocale(translationKey?.metadata?.locale);
        const loc = postPath(slug, locale);
        const alternates = [{ hreflang: locale, loc }];
        const validTranslationSlug = translationKey && translationLocale !== locale ? translationSlug : "";
        if (validTranslationSlug) alternates.push({ hreflang: translationLocale, loc: postPath(validTranslationSlug, translationLocale) });
        alternates.push({ hreflang: "x-default", loc: locale === "ja" ? loc : validTranslationSlug ? postPath(validTranslationSlug, translationLocale) : loc });
        return {
          loc,
          lastmod: normalizeDate(key.metadata?.updatedAt || key.metadata?.publishedAt || key.metadata?.date),
          changefreq: "monthly",
          priority: "0.6",
          alternates,
        };
      })
      .filter(Boolean);
  } catch (error) {
    return [];
  }
}

function findTranslationSlug(keys, currentSlug, directSlug) {
  const direct = String(directSlug || "").trim();
  if (direct && direct !== currentSlug) return direct;
  const reverse = (keys.find((key) => (
    key.name !== `post:${currentSlug}`
    && String(key.metadata?.translationSlug || "").trim() === currentSlug
  ))?.name || "").replace(/^post:/, "");
  return reverse === currentSlug ? "" : reverse;
}

function normalizeLocale(value) {
  return String(value || "").trim().toLowerCase().startsWith("en") ? "en" : "ja";
}

function postPath(slug, locale = "ja") {
  return `${normalizeLocale(locale) === "en" ? "/en/blog/" : "/blog/"}${encodeURIComponent(slug)}/`;
}

function mergeUrls(...groups) {
  const byLoc = new Map();
  for (const item of groups.flat()) {
    if (!item?.loc || item.loc.includes("/blog/post/")) continue;
    byLoc.set(item.loc, item);
  }
  return [...byLoc.values()];
}

function normalizeDate(value) {
  const text = String(value || "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : new Date().toISOString().slice(0, 10);
}

function xmlEscape(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
