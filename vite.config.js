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
        games: "games/index.html",
        contact: "contact/index.html",
        blog: "blog/index.html",
        blogAdmin: "blog/admin/index.html",
        blogPost: "blog/post/index.html",
        commerce: "legal/commerce/index.html",
        privacy: "legal/privacy/index.html",
        terms: "legal/terms/index.html",
        researchWriter: "apps/research-writer/index.html",
        researchWriterBeta: "products/research-writer-beta/index.html",
        articleStarterKit: "products/article-starter-kit/index.html",
        activatePending: "pro/activate-pending/index.html",
        lpResearchWriter: "lp/research-writer/index.html",
        wordpressTheme: "apps/wordpress-theme/index.html",
        wordpressThemeBeta: "products/wordpress-theme-beta/index.html",
        lpWordpressTheme: "lp/wordpress-theme/index.html",
        ...collectGameInputs(),
      },
    },
  },
});
