import { defineConfig } from "vite";

export default defineConfig({
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
        xHelper: "apps/x-helper/index.html",
        xHelperBeta: "products/x-helper-beta/index.html",
        ecCopy: "apps/ec-copy/index.html",
        ecCopyBeta: "products/ec-copy-beta/index.html",
        aioMini: "apps/aio-mini/index.html",
        aioMiniBeta: "products/aio-mini-beta/index.html",
        lpRadar: "lp/radar/index.html",
        lpProposal: "lp/proposal/index.html",
        lpProposalOptimizer: "lp/proposal-optimizer/index.html",
        lpXHelper: "lp/x-helper/index.html",
        lpEcCopy: "lp/ec-copy/index.html",
        lpAioMini: "lp/aio-mini/index.html",
        wpLabs: "labs/wordpress/index.html",
        chromeLabs: "labs/chrome/index.html",
      },
    },
  },
});
