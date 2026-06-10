import { defineConfig } from "vite";
import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { SITE, buildBreadcrumbJsonLd, buildHomeJsonLd } from "./functions/lib/site-seo.js";

function collectGameInputs() {
  const input = {};
  const gamesRoot = resolve("games");
  if (!existsSync(gamesRoot)) return input;

  for (const entry of readdirSync(gamesRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const indexPath = `games/${entry.name}/index.html`;
    if (existsSync(indexPath)) {
      input[`game-${entry.name}`] = indexPath;
    }
  }
  return input;
}

function collectBlogTaxonomyInputs() {
  const input = {};

  for (const section of ["category", "tag"]) {
    const sectionRoot = resolve("blog", section);
    if (!existsSync(sectionRoot)) continue;

    for (const entry of readdirSync(sectionRoot, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const indexPath = `blog/${section}/${entry.name}/index.html`;
      if (existsSync(indexPath)) {
        input[`blog-${section}-${entry.name}`] = indexPath;
      }
    }
  }

  return input;
}

function matomoSnippetPlugin() {
  const snippet = `<script async src="/shared/matomo-loader.js"></script>`;

  return {
    name: "matomo-snippet",
    transformIndexHtml(html, ctx) {
      if (!ctx?.path || ctx.path === "/google0009e82266fc5714.html") return html;
      if (html.includes("matomo-loader.js")) return html;
      return html.replace("</head>", `    ${snippet}\n  </head>`);
    },
  };
}

function ga4SnippetPlugin() {
  const measurementId = "G-ZK7SP3RVSB";
  const snippet = `<script async src="https://www.googletagmanager.com/gtag/js?id=${measurementId}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${measurementId}');
  </script>`;

  return {
    name: "ga4-snippet",
    transformIndexHtml(html, ctx) {
      if (!ctx?.path || ctx.path === "/google0009e82266fc5714.html") return html;
      if (ctx.path.includes("/blog/admin/")) return html;
      if (html.includes(measurementId) || html.includes("googletagmanager.com/gtag/js")) return html;
      return html.replace("</head>", `  ${snippet}\n</head>`);
    },
  };
}

function backToTopPlugin() {
  const snippet = `<script defer src="/shared/back-to-top.js"></script>`;

  return {
    name: "back-to-top",
    transformIndexHtml(html, ctx) {
      if (!ctx?.path || ctx.path === "/google0009e82266fc5714.html") return html;
      if (html.includes("back-to-top.js")) return html;
      // 管理画面はロックスクリーンが優先なので除外
      if (ctx.path && ctx.path.includes("/blog/admin/")) return html;
      return html.replace("</head>", `    ${snippet}\n  </head>`);
    },
  };
}

/**
 * canonical タグがあるページに hreflang ja / x-default を自動注入する
 * 単一言語サイトでも明示しておくと国際SEOで損しない
 */
function hreflangPlugin() {
  return {
    name: "hreflang-injector",
    transformIndexHtml(html) {
      if (html.includes('hreflang="ja"')) return html;
      const m = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"\s*\/?>/i);
      if (!m) return html;
      const url = m[1];
      const tags = `\n    <link rel="alternate" hreflang="ja" href="${url}" />\n    <link rel="alternate" hreflang="x-default" href="${url}" />`;
      return html.replace(m[0], `${m[0]}${tags}`);
    },
  };
}

const SEO_TITLE_MAX_CHARS = 60;

function seoCharLength(value) {
  return Array.from(String(value || "")).length;
}

function decodeHtmlEntities(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function escHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escAttr(value) {
  return escHtml(value).replace(/"/g, "&quot;");
}

function cleanSeoTitle(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/^\s*(?:よへラボブログ|よへラボゲーム|よへラボ記事一覧|よへラボ)\s*(?:[|｜\-–—:：]\s*)?/i, "")
    .replace(/\s*(?:[|｜\-–—:：]\s*)?(?:よへラボブログ|よへラボゲーム|よへラボ記事一覧|よへラボ)\s*$/i, "")
    .trim();
}

function truncateSeoPart(value, maxChars) {
  const clean = String(value || "").replace(/\s+/g, " ").trim();
  const chars = Array.from(clean);
  if (chars.length <= maxChars) return clean;
  return `${chars.slice(0, Math.max(1, maxChars - 1)).join("").replace(/[、。・|｜\-–—:：\s]+$/g, "")}…`;
}

function seoBrandForPath(pathname = "") {
  if (pathname.startsWith("/blog/")) return SITE.blogName;
  if (pathname.startsWith("/games/")) return "よへラボゲーム";
  return SITE.name;
}

function formatSeoTitle(rawTitle, pathname = "") {
  const title = decodeHtmlEntities(rawTitle).replace(/\s+/g, " ").trim();
  const brand = seoBrandForPath(pathname);
  const main = cleanSeoTitle(title) || brand;
  const delimiter = " | ";

  if (pathname.startsWith("/blog/")) {
    return `${brand}${delimiter}${truncateSeoPart(main, SEO_TITLE_MAX_CHARS - seoCharLength(brand) - seoCharLength(delimiter))}`;
  }

  if (title.includes("よへラボ") && seoCharLength(title) <= SEO_TITLE_MAX_CHARS) {
    return title;
  }

  if (seoCharLength(title) > SEO_TITLE_MAX_CHARS) {
    return `${brand}${delimiter}${truncateSeoPart(main, SEO_TITLE_MAX_CHARS - seoCharLength(brand) - seoCharLength(delimiter))}`;
  }

  return `${main}${delimiter}${brand}`;
}

function upsertTitleMeta(html, attrName, attrValue, content) {
  const escaped = escAttr(content);
  const attr = `${attrName}="${attrValue}"`;
  const re = new RegExp(`<meta\\s+${attrName}="${attrValue}"\\s+content="[^"]*"\\s*\\/?>`, "i");
  if (re.test(html)) return html.replace(re, `<meta ${attr} content="${escaped}" />`);
  return html.replace("</head>", `  <meta ${attr} content="${escaped}" />\n</head>`);
}

function applySeoTitlePolicy(html, pathname = "") {
  const match = html.match(/<title>([\s\S]*?)<\/title>/i);
  if (!match) return html;
  const seoTitle = formatSeoTitle(match[1], pathname);
  let out = html.replace(match[0], `<title>${escHtml(seoTitle)}</title>`);
  out = upsertTitleMeta(out, "property", "og:title", seoTitle);
  out = upsertTitleMeta(out, "name", "twitter:title", seoTitle);
  return out;
}

function headHardeningPlugin() {
  const ogImage = SITE.ogImage;
  const turnstileSiteKey = process.env.VITE_TURNSTILE_SITE_KEY || process.env.TURNSTILE_SITE_KEY || "";
  const clarityId = process.env.VITE_CLARITY_ID || process.env.CLARITY_ID || "";
  const iconLinks = [
    '<link rel="apple-touch-icon" sizes="180x180" href="/yohelab-mascot-v2-20260518-180.png" />',
    '<link rel="icon" type="image/png" sizes="192x192" href="/yohelab-mascot-v2-20260518-192.png" />',
    '<link rel="icon" type="image/png" sizes="512x512" href="/yohelab-mascot-v2-20260518-512.png" />',
    '<link rel="manifest" href="/site.webmanifest?v=mascot-v2-20260518" />',
  ].join("\n    ");

  return {
    name: "head-hardening",
    transformIndexHtml(html, ctx) {
      if (!ctx?.path || ctx.path === "/google0009e82266fc5714.html") return html;
      const pageBrand = SITE.name;
      const pageLocale = "ja_JP";

      let out = html
        .replace(/<meta property="og:image" content="https:\/\/yohelab\.com\/yohelab-(?:cat-)?icon\.png" \/>/g, `<meta property="og:image" content="${ogImage}" />`)
        .replace(/<meta name="twitter:card" content="summary" \/>/g, '<meta name="twitter:card" content="summary_large_image" />')
        .replace(/<meta name="theme-color" content="(?:#f5fbff|#ffffff)" \/>/g, '<meta name="theme-color" content="#087a63" />');

      if (out.includes(`content="${ogImage}"`) && !out.includes('property="og:image:width"')) {
        out = out.replace(
          `<meta property="og:image" content="${ogImage}" />`,
          `<meta property="og:image" content="${ogImage}" />\n  <meta property="og:image:width" content="1200" />\n  <meta property="og:image:height" content="630" />`,
        );
      }

      const pageOgImage = out.match(/<meta\s+property="og:image"\s+content="([^"]+)"\s*\/?>/i)?.[1];
      if (pageOgImage && !out.includes('name="twitter:image"')) {
        out = out.replace(/<meta name="twitter:card" content="summary_large_image" \/>/i, (match) => `${match}\n  <meta name="twitter:image" content="${pageOgImage}" />`);
      }
      if (pageOgImage && !out.includes('property="og:image:secure_url"')) {
        out = out.replace(/<meta\s+property="og:image"\s+content="([^"]+)"\s*\/?>/i, (match, imageUrl) => `${match}\n  <meta property="og:image:secure_url" content="${imageUrl}" />`);
      }
      if (pageOgImage && !out.includes('property="og:image:type"')) {
        const imageType = pageOgImage.endsWith(".webp") ? "image/webp" : pageOgImage.endsWith(".png") ? "image/png" : pageOgImage.endsWith(".jpg") || pageOgImage.endsWith(".jpeg") ? "image/jpeg" : "";
        if (imageType) {
          out = out.replace(/<meta\s+property="og:image(?:\:secure_url)?"\s+content="[^"]+"\s*\/?>/i, (match) => `${match}\n  <meta property="og:image:type" content="${imageType}" />`);
        }
      }
      if (!out.includes('name="author"')) {
        out = out.replace("</head>", `  <meta name="author" content="${pageBrand}" />\n</head>`);
      }
      if (!out.includes('property="og:site_name"')) {
        out = out.replace("</head>", `  <meta property="og:site_name" content="${pageBrand}" />\n</head>`);
      }
      if (!out.includes('property="og:locale"')) {
        out = out.replace("</head>", `  <meta property="og:locale" content="${pageLocale}" />\n</head>`);
      }
      if (!out.includes('name="twitter:site"')) {
        out = out.replace("</head>", `  <meta name="twitter:site" content="${SITE.twitterHandle}" />\n  <meta name="twitter:creator" content="${SITE.twitterHandle}" />\n</head>`);
      }
      const canonical = out.match(/<link\s+rel="canonical"\s+href="([^"]+)"\s*\/?>/i)?.[1];
      if (canonical && !out.includes('property="og:url"')) {
        out = out.replace("</head>", `  <meta property="og:url" content="${canonical}" />\n</head>`);
      }
      if (!out.includes('name="format-detection"')) {
        out = out.replace("</head>", `  <meta name="format-detection" content="telephone=no,address=no,email=no" />\n</head>`);
      }
      if (!out.includes('type="application/rss+xml"')) {
        out = out.replace("</head>", `  <link rel="alternate" type="application/rss+xml" title="${pageBrand} RSS" href="${SITE.feedUrl}" />\n</head>`);
      }

      out = out.replace(/<img([^>]+src="\/yohelab-mascot-v2-20260518\.webp"[^>]*)>/g, (match, attrs) => {
        const next = ensureImageAttrs(attrs.replace('src="/yohelab-mascot-v2-20260518.webp"', 'src="/yohelab-mascot-v2-20260518-64.png"'));
        return `<img${next}>`;
      });
      out = out
        .replace(/(<link[^>]+rel="icon"[^>]+href=")\/yohelab-mascot-v2-20260518\.png("[^>]*>)/g, `$1/yohelab-mascot-v2-20260518-32.png$2`)
        .replace(/(<link[^>]+rel="preload"[^>]+as="image"[^>]+href=")\/yohelab-mascot-v2-20260518\.png("[^>]*>)/g, `$1/yohelab-mascot-v2-20260518-64.png$2`)
        .replace(/<img([^>]+src="\/yohelab-mascot-v2-20260518\.png"[^>]*)>/g, (match, attrs) => {
          const next = ensureImageAttrs(attrs.replace('src="/yohelab-mascot-v2-20260518.png"', 'src="/yohelab-mascot-v2-20260518-64.png"'));
          return `<img${next}>`;
        })
        .replace(/<img([^>]+src="\/yohelab-mascot-v2-20260518-64\.png"[^>]*)>/g, (match, attrs) => {
          const next = ensureImageAttrs(attrs);
          return `<img${next}>`;
        });

      if (ctx.path === "/index.html" && !out.includes('"@type":"WebSite"')) {
        out = out.replace("</head>", `  <script type="application/ld+json">${buildHomeJsonLd()}</script>\n</head>`);
      }

      if (!out.includes('rel="apple-touch-icon"')) {
        out = out.replace(/<link rel="icon"[^>]+\/>/, (match) => `${match}\n    ${iconLinks}`);
      }

      if (turnstileSiteKey) {
        out = out.replace(/<meta name="turnstile-site-key" content="" \/>/g, `<meta name="turnstile-site-key" content="${turnstileSiteKey}" />`);
      }

      if (clarityId && !out.includes("clarity.ms/tag")) {
        const claritySnippet = `<script>(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${clarityId}");</script>`;
        out = out.replace("</head>", `  ${claritySnippet}\n</head>`);
      }

      const title = out.match(/<title>([^<]+)<\/title>/i)?.[1]?.replace(/\s*\|\s*よへラボ.*$/, "").trim();
      if (canonical && canonical !== `${SITE.origin}/` && title && !out.includes('"@type":"BreadcrumbList"')) {
        out = out.replace("</head>", `  <script type="application/ld+json">${buildBreadcrumbJsonLd([
          { name: "トップ", item: `${SITE.origin}/` },
          { name: title, item: canonical },
        ])}</script>\n</head>`);
      }

      out = applySeoTitlePolicy(out, ctx.path);

      return out;
    },
  };
}

function ensureImageAttrs(attrs) {
  const selfClosing = /\/\s*$/.test(attrs);
  let next = String(attrs || "").replace(/\/\s*$/, "").trimEnd();
  if (!/\swidth=/.test(next)) next += ' width="36"';
  if (!/\sheight=/.test(next)) next += ' height="36"';
  if (!/\sdecoding=/.test(next)) next += ' decoding="async"';
  return `${next}${selfClosing ? " /" : ""}`;
}

function mobilePolishPlugin() {
  const style = `<style id="yohelab-mobile-polish">
html { overflow-x: clip; text-size-adjust: 100%; -webkit-text-size-adjust: 100%; }
body { overflow-x: clip; }
img, video, canvas, svg { max-width: 100%; height: auto; }
table { max-width: 100%; }
a, button, input, select, textarea { touch-action: manipulation; }
a:focus-visible, button:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible { outline: 2px solid #087a63; outline-offset: 3px; }
@media (max-width: 640px) {
  button, input, select, textarea, .btn, .nav-links a, .header-inner nav a, .tab-btn, .filter-btn, .post-tag, .share-btn, .back-link { min-height: 44px; }
  input, select, textarea { font-size: 16px !important; }
  .site-header { width: 100%; }
  .header-inner { max-width: none !important; width: 100% !important; overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .header-inner nav { min-width: max-content; }
  .post-outer, .article-shell { width: auto !important; max-width: none !important; padding-left: 16px !important; padding-right: 16px !important; }
  .post-title, .article-hero h1 { overflow-wrap: anywhere; }
  .post-excerpt, .article-lead { font-size: 16px !important; line-height: 1.8 !important; }
  .post-body, .article-card { font-size: 16px !important; line-height: 1.9 !important; }
  .post-cover { border-radius: 16px !important; margin-bottom: 22px !important; }
  .post-body table, .post-table, .compare, table { display: block !important; width: 100% !important; overflow-x: auto !important; -webkit-overflow-scrolling: touch; }
  .post-body pre, .post-body code { white-space: pre-wrap; overflow-wrap: anywhere; }
}
</style>`;

  return {
    name: "mobile-polish",
    transformIndexHtml(html, ctx) {
      if (!ctx?.path || ctx.path === "/google0009e82266fc5714.html") return html;
      if (html.includes('id="yohelab-mobile-polish"')) return html;
      return html.replace("</head>", `  ${style}\n</head>`);
    },
  };
}

export default defineConfig({
  plugins: [matomoSnippetPlugin(), ga4SnippetPlugin(), backToTopPlugin(), hreflangPlugin(), headHardeningPlugin(), mobilePolishPlugin()],
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        about: "about/index.html",
        games: "games/index.html",
        contact: "contact/index.html",
        blog: "blog/index.html",
        blogAiNewsSellingIdeas: "blog/ai-news-selling-ideas/index.html",
        blogGpt56ThisWeek: "blog/gpt-56-this-week/index.html",
        blogComparisonArticleTemplate: "blog/comparison-article-template/index.html",
        blogFaqSourceAiSearch: "blog/faq-source-ai-search/index.html",
        blogSalesPageCommonMistakes: "blog/sales-page-common-mistakes/index.html",
        blogAdmin: "blog/admin/index.html",
        blogPost: "blog/post/index.html",
        commerce: "legal/commerce/index.html",
        privacy: "legal/privacy/index.html",
        terms: "legal/terms/index.html",
        researchWriter: "apps/research-writer/index.html",
        researchWriterBeta: "products/research-writer-beta/index.html",
        pageReview: "products/page-review/index.html",
        activatePending: "pro/activate-pending/index.html",
        lpResearchWriter: "lp/research-writer/index.html",
        ...collectBlogTaxonomyInputs(),
        ...collectGameInputs(),
      },
    },
  },
});
