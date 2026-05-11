/**
 * /sitemap.xml を動的生成する Cloudflare Pages Function
 *
 * 静的な sitemap.xml（public/sitemap.xml）にブログ記事のURLを追加して返す。
 * KVに記事が増えるたびにsitemapも自動更新される。
 *
 * 静的 public/sitemap.xml は Pages の静的アセットとして残るが、
 * Functions のほうが優先されるためこちらが配信される。
 */

const SITE_ORIGIN = "https://yohelab.com";

const STATIC_URLS = [
  { loc: "/", changefreq: "weekly", priority: "1.0" },
  { loc: "/lp/research-writer/", changefreq: "weekly", priority: "0.9" },
  { loc: "/lp/bunsirube/", changefreq: "weekly", priority: "0.9" },
  { loc: "/lp/bunsirube/install/", changefreq: "monthly", priority: "0.7" },
  { loc: "/lp/bunsirube/demo/", changefreq: "monthly", priority: "0.6" },
  { loc: "/lp/bunsirube/updates/", changefreq: "weekly", priority: "0.6" },
  { loc: "/apps/research-writer/", changefreq: "weekly", priority: "0.8" },
  { loc: "/products/page-review/", changefreq: "weekly", priority: "0.8" },
  { loc: "/products/research-writer-beta/", changefreq: "weekly", priority: "0.7" },
  { loc: "/products/bunsirube/", changefreq: "weekly", priority: "0.7" },
  { loc: "/blog/", changefreq: "daily", priority: "0.8" },
  { loc: "/blog/page-review-sample/", changefreq: "monthly", priority: "0.6" },
  { loc: "/blog/research-writer-free-flow/", changefreq: "monthly", priority: "0.6" },
  { loc: "/blog/bunsirube-before-install/", changefreq: "monthly", priority: "0.6" },
  { loc: "/blog/free-theme-vs-bunsirube/", changefreq: "monthly", priority: "0.6" },
  { loc: "/blog/bunsirube-version-history/", changefreq: "monthly", priority: "0.6" },
  { loc: "/blog/comparison-article-template/", changefreq: "monthly", priority: "0.6" },
  { loc: "/blog/faq-source-ai-search/", changefreq: "monthly", priority: "0.6" },
  { loc: "/blog/sales-page-common-mistakes/", changefreq: "monthly", priority: "0.6" },
  { loc: "/contact/", changefreq: "monthly", priority: "0.5" },
  { loc: "/games/", changefreq: "monthly", priority: "0.3" },
  { loc: "/legal/privacy/", changefreq: "monthly", priority: "0.3" },
  { loc: "/legal/terms/", changefreq: "monthly", priority: "0.3" },
  { loc: "/legal/commerce/", changefreq: "monthly", priority: "0.3" },
];

export async function onRequestGet(context) {
  const kv = context.env.BLOG_KV;
  const blogPosts = [];

  if (kv) {
    try {
      const list = await kv.list({ prefix: "post:" });
      for (const key of list.keys) {
        const slug = key.name.replace(/^post:/, "");
        const date = key.metadata?.date || "";
        blogPosts.push({
          loc: `/blog/post/?slug=${encodeURIComponent(slug)}`,
          lastmod: date,
          changefreq: "monthly",
          priority: "0.6",
        });
      }
    } catch (err) {
      // 失敗しても静的部分は返す
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const allUrls = [...STATIC_URLS, ...blogPosts];

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    allUrls
      .map((u) => {
        const lastmod = u.lastmod || today;
        return `  <url>\n    <loc>${SITE_ORIGIN}${u.loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`;
      })
      .join("\n") +
    `\n</urlset>\n`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=600",
    },
  });
}
