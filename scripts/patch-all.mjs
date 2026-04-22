/**
 * patch-all.mjs
 * 1. Replace plain "ベータ版を試した人の声" heading with a visually rich section header
 * 2. Fix avatar text to show initials like "K.N"
 * 3. Fix games page circular link (ミニゲーム → coming soon)
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const DEST = "C:/Users/hotar/Documents/GitHub/yohelab-store-site";

// ── 1. Voices section head CSS ─────────────────────────────────────────────
const VOICES_HEAD_CSS = `
      /* ── Voices section header ── */
      .voices-section-head {
        text-align: center;
        margin: 40px 0 24px;
        padding: 28px 32px;
        background: linear-gradient(135deg, #f0fdf8 0%, #e6f7f1 100%);
        border: 1px solid rgba(13,107,88,.15);
        border-radius: 20px;
      }
      .voices-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 5px 14px;
        border-radius: 999px;
        background: rgba(13,107,88,.1);
        border: 1px solid rgba(13,107,88,.22);
        color: #0d6b58;
        font-size: 11px;
        font-weight: 900;
        letter-spacing: .08em;
        text-transform: uppercase;
        margin-bottom: 10px;
      }
      .voices-title {
        font-size: clamp(20px, 3vw, 26px);
        font-weight: 900;
        letter-spacing: -0.03em;
        color: #1a1f2e;
        margin-bottom: 6px;
      }
      .voices-sub {
        font-size: 14px;
        color: var(--muted);
        margin: 0;
      }`;

      .voices-grid {
        display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px;
      }
      .voice-card {
        background: #fff; border: 1px solid var(--border); border-radius: 18px;
        padding: 22px 24px; box-shadow: var(--shadow);
        display: flex; flex-direction: column; gap: 14px;
      }
      .voice-quote { font-size: 22px; color: var(--green,#0d6b58); line-height: 1; }
      .voice-text { font-size: 15px; line-height: 1.8; color: #1a1f2e; flex: 1; }
      .voice-footer { display: flex; align-items: center; gap: 10px; }
      .voice-avatar {
        width: 36px; height: 36px; border-radius: 50%;
        background: linear-gradient(135deg, var(--green,#0d6b58), #4fd1b8);
        display: flex; align-items: center; justify-content: center;
        color: #fff; font-size: 13px; font-weight: 900; flex-shrink: 0;
      }
      .voice-meta-wrap { display: flex; flex-direction: column; gap: 1px; }
      .voice-name { font-size: 13px; font-weight: 800; color: #1a1f2e; }
      .voice-role { font-size: 12px; color: var(--muted); }
      @media (max-width: 640px) {
        .voices-grid { grid-template-columns: 1fr; }
        .browser-mock { border-radius: 10px; }
      }`;

// ── Process LP files: replace plain voices heading with styled one ─
const LP_FILES = [
  "lp/x-helper/index.html",
  "lp/ec-copy/index.html",
  "lp/aio-mini/index.html",
  "lp/proposal/index.html",
];

for (const rel of LP_FILES) {
  const filePath = resolve(DEST, rel);
  let html = readFileSync(filePath, "utf8");

  // Replace plain voices-heading div with styled version
  const plainHeadRe = /<div class="voices-heading"[^>]*>[\s\S]*?<\/div>\s*(?=<div class="voices-grid">)/;
  const newHead = `<div class="voices-section-head">
            <div class="voices-badge">💬 Beta Voices</div>
            <h3 class="voices-title">ベータ版を試した人の声</h3>
            <p class="voices-sub">リリース前に使ってもらった方の、実際の感想です。</p>
          </div>
          `;
  if (plainHeadRe.test(html)) {
    html = html.replace(plainHeadRe, newHead);
    console.log(`✓ ${rel} — voices heading upgraded`);
  }

  // Inject voices-section-head CSS if not there
  if (!html.includes("voices-section-head")) {
    html = html.replace(/(\s*<\/style>)(?![\s\S]*<\/style>)/, VOICES_HEAD_CSS + "\n$1");
    console.log(`  + CSS injected into ${rel}`);
  }

  writeFileSync(filePath, html, "utf8");
}

// ── Process tools/index.html ───────────────────────────────────────────────
{
  const filePath = resolve(DEST, "tools/index.html");
  let html = readFileSync(filePath, "utf8");

  const plainHeadRe = /<div class="voices-heading"[^>]*>[\s\S]*?<\/div>\s*(?=<div class="voices-grid">)/;
  const newHead = `<div class="voices-section-head" style="background:linear-gradient(135deg,#f0fdf8,#e6f7f1);border:1px solid rgba(13,107,88,.15);border-radius:20px;padding:24px 28px;text-align:center;margin:0 0 24px;">
              <div style="display:inline-flex;align-items:center;gap:6px;padding:5px 14px;border-radius:999px;background:rgba(13,107,88,.1);border:1px solid rgba(13,107,88,.22);color:#0d6b58;font-size:11px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;margin-bottom:10px;">💬 Beta Voices</div>
              <h3 style="font-size:22px;font-weight:900;letter-spacing:-0.03em;color:#1a1f2e;margin-bottom:6px;">ベータ版を試した人の声</h3>
              <p style="font-size:14px;color:var(--muted);margin:0;">リリース前に使ってもらった方の、実際の感想です。</p>
            </div>
            `;
  if (plainHeadRe.test(html)) {
    html = html.replace(plainHeadRe, newHead);
    console.log("✓ tools/index.html — voices heading upgraded");
  } else {
    // Insert before voices-grid
    html = html.replace(/<div class="voices-grid">/, newHead + '<div class="voices-grid">');
    console.log("✓ tools/index.html — voices heading inserted");
  }

  writeFileSync(filePath, html, "utf8");
}

// ── Fix games: circular link ───────────────────────────────────────────────
{
  const gamesPath = resolve(DEST, "games/index.html");
  let html = readFileSync(gamesPath, "utf8");

  // Change the first game card from active link to coming-soon
  html = html.replace(
    /<a class="game-card reveal" href="\/games\/">([\s\S]*?)<h3>ミニゲーム<\/h3>([\s\S]*?)<\/a>/,
    `<div class="game-card coming-soon reveal">
              <span class="coming-tag">準備中</span>
              <div class="game-icon">🎯</div>
              <h3>ミニゲーム</h3>
              <p>ブラウザで今すぐ遊べる軽量ゲーム。まずは1〜2分で遊べるものから。</p>
              <span class="game-cta">もうすぐ公開</span>
            </div>`
  );

  writeFileSync(gamesPath, html, "utf8");
  console.log("✓ games/index.html — circular link fixed");
}

// ── Fix index.html games section ───────────────────────────────────────────
{
  const indexPath = resolve(DEST, "index.html");
  let html = readFileSync(indexPath, "utf8");

  // Change game card link from /games/ to coming state
  html = html.replace(
    /<a class="game-card-v2 reveal" href="\/games\/">([\s\S]*?)<h3>ミニゲーム<\/h3>([\s\S]*?)<\/a>/,
    `<div class="game-card-v2 coming reveal">
                <span class="coming-pill">準備中</span>
                <div class="game-icon">🎯</div>
                <h3>ミニゲーム</h3>
                <p>1〜2分で遊べる軽量ゲーム。ブラウザでそのまま遊べる。</p>
                <span class="game-cta">もうすぐ公開</span>
              </div>`
  );

  writeFileSync(indexPath, html, "utf8");
  console.log("✓ index.html — games card fixed");
}

console.log("\n✅ patch-all done");
