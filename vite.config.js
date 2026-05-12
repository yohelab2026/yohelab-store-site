import { defineConfig } from "vite";
import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

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

function headHardeningPlugin() {
  const ogImage = "https://yohelab.com/assets/og/bunsirube-og.png";
  const turnstileSiteKey = process.env.VITE_TURNSTILE_SITE_KEY || process.env.TURNSTILE_SITE_KEY || "";
  const clarityId = process.env.VITE_CLARITY_ID || process.env.CLARITY_ID || "";
  const iconLinks = [
    '<link rel="apple-touch-icon" sizes="180x180" href="/yohelab-icon-180.png" />',
    '<link rel="icon" type="image/png" sizes="192x192" href="/yohelab-icon-192.png" />',
    '<link rel="icon" type="image/png" sizes="512x512" href="/yohelab-icon-512.png" />',
    '<link rel="manifest" href="/site.webmanifest" />',
  ].join("\n    ");

  return {
    name: "head-hardening",
    transformIndexHtml(html, ctx) {
      if (!ctx?.path || ctx.path === "/google0009e82266fc5714.html") return html;

      let out = html
        .replace(/<meta property="og:image" content="https:\/\/yohelab\.com\/yohelab-icon\.png" \/>/g, `<meta property="og:image" content="${ogImage}" />`)
        .replace(/<meta name="twitter:card" content="summary" \/>/g, '<meta name="twitter:card" content="summary_large_image" />')
        .replace(/<meta name="theme-color" content="(?:#f5fbff|#ffffff)" \/>/g, '<meta name="theme-color" content="#0b8f72" />');

      if (out.includes(`content="${ogImage}"`) && !out.includes('property="og:image:width"')) {
        out = out.replace(
          `<meta property="og:image" content="${ogImage}" />`,
          `<meta property="og:image" content="${ogImage}" />\n  <meta property="og:image:width" content="1200" />\n  <meta property="og:image:height" content="630" />`,
        );
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

      const canonical = out.match(/<link\s+rel="canonical"\s+href="([^"]+)"\s*\/?>/i)?.[1];
      const title = out.match(/<title>([^<]+)<\/title>/i)?.[1]?.replace(/\s*\|\s*よへラボ.*$/, "").trim();
      if (canonical && canonical !== "https://yohelab.com/" && title && !out.includes('"@type":"BreadcrumbList"')) {
        const breadcrumb = {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "トップ", item: "https://yohelab.com/" },
            { "@type": "ListItem", position: 2, name: title, item: canonical },
          ],
        };
        out = out.replace("</head>", `  <script type="application/ld+json">${JSON.stringify(breadcrumb)}</script>\n</head>`);
      }

      return out;
    },
  };
}

export default defineConfig({
  plugins: [matomoSnippetPlugin(), backToTopPlugin(), hreflangPlugin(), headHardeningPlugin()],
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        games: "games/index.html",
        contact: "contact/index.html",
        contactBug: "contact/bug/index.html",
        blog: "blog/index.html",
        blogPageReviewSample: "blog/page-review-sample/index.html",
        blogResearchWriterFreeFlow: "blog/research-writer-free-flow/index.html",
        blogBunsirubeBeforeInstall: "blog/bunsirube-before-install/index.html",
        blogFreeThemeVsBunsirube: "blog/free-theme-vs-bunsirube/index.html",
        blogBunsirubeVersionHistory: "blog/bunsirube-version-history/index.html",
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
        bunsirubeProduct: "products/bunsirube/index.html",
        lpWordpressTheme: "lp/bunsirube/index.html",
        lpWordpressThemeInstall: "lp/bunsirube/install/index.html",
        lpWordpressThemeDemo: "lp/bunsirube/demo/index.html",
        lpWordpressThemeUpdates: "lp/bunsirube/updates/index.html",
        lpWordpressThemeAffiliate: "lp/bunsirube/affiliate/index.html",
        affiliateDashboard: "affiliate/dashboard/index.html",
        affiliateTerms: "legal/affiliate-terms/index.html",
        ...collectGameInputs(),
      },
    },
  },
});
