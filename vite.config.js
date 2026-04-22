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

export default defineConfig({
  plugins: [matomoSnippetPlugin()],
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        tools: "tools/index.html",
        labsIndex: "labs/index.html",
        games: "games/index.html",
        contact: "contact/index.html",
        commerce: "legal/commerce/index.html",
        privacy: "legal/privacy/index.html",
        terms: "legal/terms/index.html",
        proposal: "apps/proposal/index.html",
        proposalBeta: "products/proposal-beta/index.html",
        researchWriter: "apps/research-writer/index.html",
        researchWriterBeta: "products/research-writer-beta/index.html",
        xHelper: "apps/x-helper/index.html",
        xHelperBeta: "products/x-helper-beta/index.html",
        ecCopy: "apps/ec-copy/index.html",
        ecCopyBeta: "products/ec-copy-beta/index.html",
        aioMini: "apps/aio-mini/index.html",
        aioMiniBeta: "products/aio-mini-beta/index.html",
        lpProposal: "lp/proposal/index.html",
        lpResearchWriter: "lp/research-writer/index.html",
        lpXHelper: "lp/x-helper/index.html",
        lpEcCopy: "lp/ec-copy/index.html",
        lpAioMini: "lp/aio-mini/index.html",
        wpLabs: "labs/wordpress/index.html",
        chromeLabs: "labs/chrome/index.html",
        ...collectGameInputs(),
      },
    },
  },
});
