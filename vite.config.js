import { defineConfig } from "vite";

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

export default defineConfig({
  plugins: [matomoSnippetPlugin()],
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        contact: "contact/index.html",
        commerce: "legal/commerce/index.html",
        privacy: "legal/privacy/index.html",
        terms: "legal/terms/index.html",
        radar: "apps/radar/index.html",
        radarBeta: "products/radar-beta/index.html",
        proposal: "apps/proposal/index.html",
        proposalBeta: "products/proposal-beta/index.html",
        proposalOptimizer: "apps/proposal-optimizer/index.html",
        proposalOptimizerBeta: "products/proposal-optimizer-beta/index.html",
        articlePolish: "apps/article-polish/index.html",
        articlePolishBeta: "products/article-polish-beta/index.html",
        xHelper: "apps/x-helper/index.html",
        xHelperBeta: "products/x-helper-beta/index.html",
        ecCopy: "apps/ec-copy/index.html",
        ecCopyBeta: "products/ec-copy-beta/index.html",
        aioMini: "apps/aio-mini/index.html",
        aioMiniBeta: "products/aio-mini-beta/index.html",
        lpRadar: "lp/radar/index.html",
        lpProposal: "lp/proposal/index.html",
        lpProposalOptimizer: "lp/proposal-optimizer/index.html",
        lpArticlePolish: "lp/article-polish/index.html",
        lpXHelper: "lp/x-helper/index.html",
        lpEcCopy: "lp/ec-copy/index.html",
        lpAioMini: "lp/aio-mini/index.html",
        wpLabs: "labs/wordpress/index.html",
        chromeLabs: "labs/chrome/index.html",
      },
    },
  },
});
