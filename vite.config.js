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
        wpLabs: "labs/wordpress/index.html",
        chromeLabs: "labs/chrome/index.html",
      },
    },
  },
});
