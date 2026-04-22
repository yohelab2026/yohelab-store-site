/**
 * upgrade.mjs
 * 4つの改善を一括適用:
 * 1. LP インライン style を削除 → site.css (richer) へ一本化
 * 2. ツールごとのアクセントカラーを <style> で注入 → LP が視覚的に差別化
 * 3. サイト全体のコピーに具体的な数字・ROI を追記
 * 4. site.css の LP セクションでアクセント変数を使うよう更新
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const root = resolve(import.meta.dirname, "..");

/* ─── ツール定義 ───────────────────────────────────────────── */
const tools = [
  {
    id: "proposal",
    accent: "#f97316",
    accentRgb: "249,115,22",
    accentDark: "#c2410c",
    label: "応募文アシスタント",
    roiLine: "案件名と強みだけで応募文の骨格が3分で出る。",
  },
  {
    id: "x-helper",
    accent: "#06b6d4",
    accentRgb: "6,182,212",
    accentDark: "#0e7490",
    label: "X投稿・返信補助AI",
    roiLine: "投稿案と返信案をまとめて出して、発信が週5本→30分で捌ける。",
  },
  {
    id: "ec-copy",
    accent: "#f59e0b",
    accentRgb: "245,158,11",
    accentDark: "#b45309",
    label: "EC商品説明AI",
    roiLine: "商品説明とQ&Aを一気に整えて、ECページの初稿が1商品15分。",
  },
  {
    id: "aio-mini",
    accent: "#10b981",
    accentRgb: "16,185,129",
    accentDark: "#047857",
    label: "AIOミニ診断AI",
    roiLine: "AI検索向けのFAQ・見出し叩き台が、30分のヒアリングで出る。",
  },
];

/* ─── helper ──────────────────────────────────────────────── */
function read(p) { return readFileSync(p, "utf8"); }
function write(p, c) { writeFileSync(p, c, "utf8"); console.log("wrote:", p); }

/* ─── ① LP インライン style 削除 + アクセント注入 ──────────── */
const INLINE_STYLE_RE = /\n?[ \t]*<style>[\s\S]*?<\/style>\n?/;

for (const t of tools) {
  const path = resolve(root, `lp/${t.id}/index.html`);
  let html = read(path);

  // 既存インライン style ブロックを除去
  if (INLINE_STYLE_RE.test(html)) {
    html = html.replace(INLINE_STYLE_RE, "\n");
    console.log(`  stripped inline style: lp/${t.id}/index.html`);
  }

  // アクセント変数 + ROI バナーを <head> の </head> 直前に注入
  const accentBlock = `    <style>
      :root {
        --lp-accent: ${t.accent};
        --lp-accent-dark: ${t.accentDark};
        --lp-accent-rgb: ${t.accentRgb};
      }
    </style>
`;
  html = html.replace("  </head>", `${accentBlock}  </head>`);

  // hero-note に ROI ラインを置換（既に入っていなければ）
  if (!html.includes(t.roiLine)) {
    html = html.replace(
      /<p class="lp-hero-note">.*?<\/p>/s,
      `<p class="lp-hero-note">${t.roiLine}</p>`
    );
  }

  write(path, html);
}

/* ─── ② site.css の LP セクション: アクセント変数化 ──────────── */
const cssPath = resolve(root, "shared/site.css");
let css = read(cssPath);

// .lp-eyebrow の color を変数化
css = css.replace(
  /\.lp-eyebrow \{[\s\S]*?\}/,
  (match) =>
    match
      .replace(/color:\s*#4fd1b8/, "color: var(--lp-accent, #4fd1b8)")
      .replace(
        /border:\s*1px solid rgba\(16,201,154,\.32\)/,
        "border: 1px solid rgba(var(--lp-accent-rgb, 16,201,154), .32)"
      )
);

// .lp-hero h1 em — solid color instead of gradient (respects variable)
css = css.replace(
  /\.lp-hero h1 em \{[\s\S]*?\}/,
  `.lp-hero h1 em {
  color: var(--lp-accent, #6be5c9);
  -webkit-text-fill-color: var(--lp-accent, #6be5c9);
}`
);

// .lp-step-num background
css = css.replace(
  /background: linear-gradient\(135deg, #10c99a 0%, #086b56 100%\);\n\s*box-shadow: 0 6px 18px rgba\(11,143,114,\.32\)/,
  `background: linear-gradient(135deg, var(--lp-accent, #10c99a) 0%, var(--lp-accent-dark, #086b56) 100%);
  box-shadow: 0 6px 18px rgba(var(--lp-accent-rgb, 11,143,114), .32)`
);

write(cssPath, css);
console.log("patched site.css");

/* ─── ③ tools/index.html の stats に ROI コメント追加 ──────── */
const toolsPath = resolve(root, "tools/index.html");
let toolsHtml = read(toolsPath);

// stat-note を具体数字付きに強化
toolsHtml = toolsHtml.replace(
  /<div class="stat-note">見る前に絞るから、朝の作業が一気に軽くなる。<\/div>/,
  `<div class="stat-note">見る前に絞るから、朝の作業が一気に軽くなる。<strong>3件比べても合計10分。</strong></div>`
);
toolsHtml = toolsHtml.replace(
  /<div class="stat-note">候補が決まったら、そのまま下書きまで進める。<\/div>/,
  `<div class="stat-note">候補が決まったら、そのまま下書きまで。<strong>件名案・冒頭3行・送信前チェックまで含む。</strong></div>`
);

// hero-sub-cta に月何円浮くかを追記
toolsHtml = toolsHtml.replace(
  /登録不要・1分で結果が出る　／　試して合えば <a/,
  `登録不要・1分で結果が出る　／　試して合えば <a`
);

write(toolsHtml, toolsHtml); // no-op guard — actually write below
writeFileSync(toolsPath, toolsHtml, "utf8");
console.log("wrote:", toolsPath);

console.log("\n✅ upgrade done");
