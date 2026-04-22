/**
 * patch-tabnav.mjs
 * Add consistent tab nav (AIツール/ゲーム/Labs) + current-page highlight
 * to tools, games, labs pages.
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const DEST = "C:/Users/hotar/Documents/GitHub/yohelab-store-site";

// CSS to inject (same style as index.html)
const TAB_CSS = `
    /* ── Tab nav ── */
    .nav-tabs {
      display: flex; align-items: center; gap: 2px;
      background: rgba(255,255,255,.07);
      border: 1px solid rgba(255,255,255,.1);
      border-radius: 10px; padding: 3px;
    }
    .nav-tabs a {
      display: inline-flex; align-items: center; gap: 5px;
      height: 30px; padding: 0 13px; border-radius: 7px;
      font-size: 13px; font-weight: 700;
      color: rgba(255,255,255,.5); text-decoration: none;
      transition: background .15s, color .15s, box-shadow .15s;
      white-space: nowrap;
    }
    .nav-tabs a:hover { background: rgba(255,255,255,.08); color: rgba(255,255,255,.85); }
    .nav-tabs a.tab-active {
      background: rgba(255,255,255,.13); color: #fff;
      box-shadow: 0 1px 4px rgba(0,0,0,.3), 0 1px 0 rgba(255,255,255,.12) inset;
    }
    @media (max-width: 600px) { .nav-tabs { display: none; } }`;

// Tab bar HTML
const TAB_BAR = `<div class="nav-tabs" id="navTabs">
          <a href="/tools/">🤖 AIツール</a>
          <a href="/games/">🎮 ゲーム</a>
          <a href="/labs/">🔬 Labs</a>
        </div>`;

// Active tab JS snippet
const TAB_JS = `
  <script>
    const _tabs = document.querySelectorAll('#navTabs a');
    _tabs.forEach(a => { if (a.getAttribute('href') === location.pathname) a.classList.add('tab-active'); });
  </script>`;

// ── tools/index.html ────────────────────────────────────────────────────────
{
  const fp = resolve(DEST, "tools/index.html");
  let html = readFileSync(fp, "utf8");

  // Inject CSS before </head>
  if (!html.includes("nav-tabs")) {
    html = html.replace(/<\/head>/, `  <style>${TAB_CSS}\n  </style>\n</head>`);
    // Replace nav content
    html = html.replace(
      `<nav class="nav-links">
          <a href="/tools/">ツール</a>
          <a href="/#plan">料金</a>
          <a href="/contact/">問い合わせ</a>
          <a class="btn btn-primary btn-sm" href="/apps/research-writer/">無料で試す</a>
        </nav>`,
      `<nav class="nav-links">
          ${TAB_BAR}
          <a href="/contact/">問い合わせ</a>
          <a class="btn btn-primary btn-sm" href="/apps/research-writer/">無料で試す</a>
        </nav>`
    );
    // Inject JS before </body>
    html = html.replace(/<\/body>/, TAB_JS + "\n</body>");
    writeFileSync(fp, html, "utf8");
    console.log("✓ tools/index.html");
  }
}

// ── games/index.html ────────────────────────────────────────────────────────
{
  const fp = resolve(DEST, "games/index.html");
  let html = readFileSync(fp, "utf8");

  if (!html.includes("nav-tabs")) {
    html = html.replace(/<\/head>/, `  <style>${TAB_CSS}\n  </style>\n</head>`);
    html = html.replace(
      `<nav class="nav-links">
        <a href="/">トップ</a>
        <a href="/#tools">AIツール</a>
        <a href="/labs/">Labs</a>
        <a href="/contact/">問い合わせ</a>
      </nav>`,
      `<nav class="nav-links">
        ${TAB_BAR}
        <a href="/contact/">問い合わせ</a>
      </nav>`
    );
    html = html.replace(/<\/body>/, TAB_JS + "\n</body>");
    writeFileSync(fp, html, "utf8");
    console.log("✓ games/index.html");
  }
}

// ── labs/index.html ─────────────────────────────────────────────────────────
{
  const fp = resolve(DEST, "labs/index.html");
  let html = readFileSync(fp, "utf8");

  if (!html.includes("nav-tabs")) {
    html = html.replace(/<\/head>/, `  <style>${TAB_CSS}\n  </style>\n</head>`);
    html = html.replace(
      `<nav class="nav-links">
        <a href="/">トップ</a>
        <a href="/#tools">AIツール</a>
        <a href="/games/">ゲーム</a>
        <a href="/contact/">問い合わせ</a>
      </nav>`,
      `<nav class="nav-links">
        ${TAB_BAR}
        <a href="/contact/">問い合わせ</a>
      </nav>`
    );
    html = html.replace(/<\/body>/, TAB_JS + "\n</body>");
    writeFileSync(fp, html, "utf8");
    console.log("✓ labs/index.html");
  }
}

console.log("\n✅ patch-tabnav done");
