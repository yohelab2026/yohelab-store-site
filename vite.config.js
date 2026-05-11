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

export default defineConfig({
  plugins: [matomoSnippetPlugin(), backToTopPlugin(), hreflangPlugin()],
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
