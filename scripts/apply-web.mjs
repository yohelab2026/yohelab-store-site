/**
 * apply-web.mjs
 * C:\Users\hotar\Downloads\web_ の全ファイルを
 * yohelab-store-site に適用する。
 * 相対パス → 絶対パスに変換しながらコピー。
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";

const SRC  = "C:/Users/hotar/Downloads/web_";
const DEST = "C:/Users/hotar/Documents/GitHub/yohelab-store-site";

function fixPaths(html, depth) {
  // relative icon → absolute
  html = html.replace(/src="(?:\.\.\/)*yohelab-icon\.png"/g, 'src="/yohelab-icon.png"');
  // relative css/js → absolute
  html = html.replace(/href="(?:\.\.\/)*shared\//g, 'href="/shared/');
  html = html.replace(/src="(?:\.\.\/)*shared\//g, 'src="/shared/');
  return html;
}

function copy(srcRel, destRel) {
  const src  = resolve(SRC,  srcRel);
  const dest = resolve(DEST, destRel);
  mkdirSync(dirname(dest), { recursive: true });
  let content = readFileSync(src, "utf8");
  content = fixPaths(content);
  writeFileSync(dest, content, "utf8");
  console.log(`✓ ${destRel}`);
}

// ── index.html
copy("index.html", "index.html");

// ── shared CSS (overwrite site.css, add lp.css)
copy("shared/site.css", "shared/site.css");
copy("shared/lp.css",   "shared/lp.css");

// ── LP pages (7 tools)
const lps = ["proposal","x-helper","ec-copy","aio-mini"];
for (const lp of lps) {
  copy(`lp/${lp}/index.html`, `lp/${lp}/index.html`);
}

// ── Sub-pages (labs, games, contact)
copy("labs/index.html",    "labs/index.html");
copy("games/index.html",   "games/index.html");
copy("contact/index.html", "contact/index.html");

console.log("\n✅ apply-web done");
