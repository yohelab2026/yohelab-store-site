/**
 * /sitemap.xml を動的生成する Cloudflare Pages Function
 *
 * /blog/post/?slug=... のようなクエリURLは載せず、
 * 公開済み記事は /blog/{slug}/ の個別URLだけを検索エンジンに渡す。
 */

const SITE_ORIGIN = "https://yohelab.com";

const URLS = [
  { loc: "/", lastmod: "2026-05-19", changefreq: "weekly", priority: "1.0" },
  { loc: "/about/", lastmod: "2026-05-18", changefreq: "monthly", priority: "0.7" },
  { loc: "/blog/", lastmod: "2026-05-19", changefreq: "weekly", priority: "0.6" },
  { loc: "/blog/ai-news-selling-ideas/", lastmod: "2026-05-18", changefreq: "monthly", priority: "0.7" },
  { loc: "/blog/home-work-rhythm/", lastmod: "2026-05-18", changefreq: "monthly", priority: "0.7" },
  { loc: "/blog/bunsirube-version-history/", lastmod: "2026-05-12", changefreq: "monthly", priority: "0.5" },
  { loc: "/blog/comparison-article-template/", lastmod: "2026-05-04", changefreq: "monthly", priority: "0.7" },
  { loc: "/blog/free-theme-vs-bunsirube/", lastmod: "2026-05-04", changefreq: "monthly", priority: "0.7" },
  { loc: "/blog/faq-source-ai-search/", lastmod: "2026-05-02", changefreq: "monthly", priority: "0.6" },
  { loc: "/blog/sales-page-common-mistakes/", lastmod: "2026-05-02", changefreq: "monthly", priority: "0.5" },
  { loc: "/blog/bunsirube-before-install/", lastmod: "2026-05-02", changefreq: "monthly", priority: "0.6" },
  { loc: "/lp/bunsirube/", lastmod: "2026-05-19", changefreq: "weekly", priority: "0.9" },
  { loc: "/lp/bunsirube/install/", lastmod: "2026-05-12", changefreq: "monthly", priority: "0.7" },
  { loc: "/lp/bunsirube/demo/", lastmod: "2026-05-12", changefreq: "monthly", priority: "0.7" },
  { loc: "/lp/bunsirube/updates/", lastmod: "2026-05-12", changefreq: "weekly", priority: "0.6" },
  { loc: "/lp/bunsirube/affiliate/", lastmod: "2026-05-12", changefreq: "monthly", priority: "0.4" },
  { loc: "/contact/", lastmod: "2026-05-12", changefreq: "monthly", priority: "0.4" },
  { loc: "/legal/commerce/", lastmod: "2026-05-12", changefreq: "monthly", priority: "0.3" },
  { loc: "/legal/privacy/", lastmod: "2026-05-12", changefreq: "monthly", priority: "0.3" },
  { loc: "/legal/terms/", lastmod: "2026-05-12", changefreq: "monthly", priority: "0.3" },
  { loc: "/legal/affiliate-terms/", lastmod: "2026-05-12", changefreq: "monthly", priority: "0.3" },
];

export async function onRequestGet(context) {
  const urls = mergeUrls(URLS, await dynamicBlogUrls(context.env));
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) =>
      `  <url>\n` +
      `    <loc>${xmlEscape(SITE_ORIGIN + u.loc)}</loc>\n` +
      `    <lastmod>${xmlEscape(u.lastmod)}</lastmod>\n` +
      `    <changefreq>${xmlEscape(u.changefreq)}</changefreq>\n` +
      `    <priority>${xmlEscape(u.priority)}</priority>\n` +
      `  </url>`,
    ).join("\n") +
    `\n</urlset>\n`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=600",
      "X-Robots-Tag": "index,follow",
    },
  });
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

    return keys
      .map((key) => {
        const slug = key.name.replace(/^post:/, "");
        if (!slug) return null;
        return {
          loc: `/blog/${encodeURIComponent(slug)}/`,
          lastmod: normalizeDate(key.metadata?.date),
          changefreq: "monthly",
          priority: "0.6",
        };
      })
      .filter(Boolean);
  } catch (error) {
    return [];
  }
}

function mergeUrls(staticUrls, dynamicUrls) {
  const byLoc = new Map();
  for (const item of [...staticUrls, ...dynamicUrls]) {
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
