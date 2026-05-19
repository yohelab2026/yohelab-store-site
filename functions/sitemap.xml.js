/**
 * /sitemap.xml を動的生成する Cloudflare Pages Function
 *
 * 重複コンテンツを避けるため、/blog/post/?slug=... のような
 * 管理画面由来のクエリURLは sitemap に載せない。
 * 公開済みの静的記事URLだけを検索エンジンに渡す。
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

export async function onRequestGet() {
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    URLS.map((u) =>
      `  <url>\n` +
      `    <loc>${SITE_ORIGIN}${u.loc}</loc>\n` +
      `    <lastmod>${u.lastmod}</lastmod>\n` +
      `    <changefreq>${u.changefreq}</changefreq>\n` +
      `    <priority>${u.priority}</priority>\n` +
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
