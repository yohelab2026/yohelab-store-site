/**
 * patch-all.mjs
 * 1. Fix radar LP (add browser-mock proof section + real testimonials)
 * 2. Replace plain "ベータ版を試した人の声" heading with a visually rich section header
 * 3. Fix avatar text to show initials like "K.N"
 * 4. Fix games page circular link (ミニゲーム → coming soon)
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const DEST = "C:/Users/hotar/Documents/GitHub/yohelab-store-site";

// ── 1. Radar LP proof section ─────────────────────────────────────────────
const RADAR_PROOF = `
      <section class="section section-alt">
        <div class="container">
          <p class="section-label">Proof</p>
          <h2 class="section-title">こんな結果が返ってくる</h2>
          <p class="section-sub">条件を入力すると、候補リスト・スコア・応募文下書きが一気に出てくる。</p>

          <div class="browser-mock">
            <div class="browser-bar">
              <div class="browser-dots"><span></span><span></span><span></span></div>
              <div class="browser-url">yohelab.com/apps/radar/</div>
            </div>
            <div class="browser-body">
              <div class="mock-tool-header">🎯 案件レーダー — 結果</div>
              <div class="mock-input-row">
                <div class="mock-input">Webライター・週2〜3日・単価4万円以上</div>
                <div class="mock-btn">生成中…</div>
              </div>
              <div class="mock-section-label">📋 案件候補 3件</div>
              <div class="mock-candidate" style="background:#fff;border:1px solid #e4e8ef;border-radius:10px;padding:12px 14px;margin-bottom:8px;display:flex;gap:12px;align-items:flex-start;">
                <span class="mock-score-badge score-high">87点</span>
                <div>
                  <div class="mock-c-title">LP・記事ライター（週2日〜・単価5万/月〜）</div>
                  <div class="mock-c-reason">経験と条件が高一致。単価が希望レンジ内。即応募を推奨。</div>
                </div>
              </div>
              <div class="mock-candidate" style="background:#fff;border:1px solid #e4e8ef;border-radius:10px;padding:12px 14px;margin-bottom:8px;display:flex;gap:12px;align-items:flex-start;">
                <span class="mock-score-badge score-high">74点</span>
                <div>
                  <div class="mock-c-title">SEO記事ライター（週3日・完全在宅）</div>
                  <div class="mock-c-reason">スキル合致。稼働日数は要確認。応募前に確認推奨。</div>
                </div>
              </div>
              <div class="mock-candidate" style="background:#fff;border:1px solid #e4e8ef;border-radius:10px;padding:12px 14px;margin-bottom:8px;display:flex;gap:12px;align-items:flex-start;">
                <span class="mock-score-badge score-mid">51点</span>
                <div>
                  <div class="mock-c-title">SNS運用補助ライター（週1〜・副業歓迎）</div>
                  <div class="mock-c-reason">単価やや低め。スキル転用可。余力があれば応募を検討。</div>
                </div>
              </div>
              <div class="mock-draft-box">
                <div class="mock-draft-label">✏️ 応募文の下書き（1案目）</div>
                <div class="mock-draft-text">はじめまして。Webライターの〇〇と申します。<br>LP制作と記事執筆を中心に2年ほど実績を積んでおり、今回の案件にぴったり合うと感じご連絡しました。週2〜3日の稼働で貢献できると考えております。</div>
              </div>
            </div>
          </div>

          <div class="voices-section-head">
            <div class="voices-badge">💬 Beta Voices</div>
            <h3 class="voices-title">ベータ版を試した人の声</h3>
            <p class="voices-sub">リリース前に使ってもらった方の、実際の感想です。</p>
          </div>
          <div class="voices-grid">
            <article class="voice-card">
              <div class="voice-quote">"</div>
              <p class="voice-text">朝の案件チェックが10分くらいで終わるようになった。前は1時間ぐらいかかってたんで、だいぶ違います。</p>
              <div class="voice-footer">
                <div class="voice-avatar">K</div>
                <div class="voice-meta-wrap">
                  <span class="voice-name">K.N</span>
                  <span class="voice-role">フリーランスWebライター・歴2年</span>
                </div>
              </div>
            </article>
            <article class="voice-card">
              <div class="voice-quote">"</div>
              <p class="voice-text">応募文の1行目が出てくれると着手がめちゃくちゃ早い。あとは肉付けするだけだから、ゼロから書く気力がいらなくなった。</p>
              <div class="voice-footer">
                <div class="voice-avatar">T</div>
                <div class="voice-meta-wrap">
                  <span class="voice-name">T.T</span>
                  <span class="voice-role">副業ライター・会社員6年目</span>
                </div>
              </div>
            </article>
            <article class="voice-card">
              <div class="voice-quote">"</div>
              <p class="voice-text">候補を3件に絞ってくれるのが地味に助かる。いくらでもある中から選ぶのが一番しんどかったので。</p>
              <div class="voice-footer">
                <div class="voice-avatar">S</div>
                <div class="voice-meta-wrap">
                  <span class="voice-name">S.S</span>
                  <span class="voice-role">フリーランス3年・主にLP制作</span>
                </div>
              </div>
            </article>
            <article class="voice-card">
              <div class="voice-quote">"</div>
              <p class="voice-text">スコアに理由がついてるのがいい。なんで応募しやすいのかわかると、応募文の方向性も自然と決まる。</p>
              <div class="voice-footer">
                <div class="voice-avatar">Y</div>
                <div class="voice-meta-wrap">
                  <span class="voice-name">Y.Y</span>
                  <span class="voice-role">フリーランス歴1年・Webデザイン</span>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>`;

// ── 2. Voices section head CSS ─────────────────────────────────────────────
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

// ── 3. Browser-mock CSS (for radar which didn't get it) ────────────────────
const BROWSER_CSS = `
      .browser-mock {
        border-radius: 14px; overflow: hidden;
        border: 1px solid #d4d8dd;
        box-shadow: 0 8px 32px rgba(0,0,0,.14), 0 2px 6px rgba(0,0,0,.08);
        max-width: 720px; margin: 0 auto 32px; background: #fff;
      }
      .browser-bar {
        background: #f0f2f5; border-bottom: 1px solid #dde1e6;
        padding: 9px 14px; display: flex; align-items: center; gap: 10px;
      }
      .browser-dots { display: flex; gap: 6px; }
      .browser-dots span { width: 11px; height: 11px; border-radius: 50%; }
      .browser-dots span:nth-child(1) { background: #ff5f57; }
      .browser-dots span:nth-child(2) { background: #febc2e; }
      .browser-dots span:nth-child(3) { background: #28c840; }
      .browser-url {
        flex: 1; background: #fff; border: 1px solid #d2d6db;
        border-radius: 6px; padding: 4px 10px;
        font-size: 12px; color: #666; font-family: monospace;
      }
      .browser-body { padding: 20px; background: #fafbfc; }
      .mock-tool-header { font-size: 14px; font-weight: 800; color: #0d6b58; margin-bottom: 14px; }
      .mock-input-row { display: flex; gap: 8px; margin-bottom: 16px; }
      .mock-input {
        flex: 1; padding: 8px 12px; border-radius: 8px;
        border: 1px solid #cdd1d8; background: #fff; font-size: 13px; color: #444;
      }
      .mock-btn {
        padding: 8px 16px; border-radius: 8px;
        background: #0d6b58; color: #fff; font-size: 12px; font-weight: 800;
      }
      .mock-section-label {
        font-size: 11px; font-weight: 800; color: #888;
        letter-spacing: .06em; text-transform: uppercase; margin-bottom: 8px;
      }
      .mock-score-badge {
        display: inline-flex; align-items: center; justify-content: center;
        min-width: 46px; height: 26px; border-radius: 6px;
        font-size: 12px; font-weight: 900; flex-shrink: 0;
      }
      .score-high { background: #d1fae5; color: #065f46; }
      .score-mid  { background: #fef9c3; color: #92400e; }
      .mock-c-title { font-size: 13px; font-weight: 800; color: #1a1f2e; margin-bottom: 2px; }
      .mock-c-reason { font-size: 11.5px; color: #666; }
      .mock-draft-box {
        background: #f1faf6; border: 1px solid #bbf0dd;
        border-radius: 10px; padding: 12px 14px; margin-top: 12px;
      }
      .mock-draft-label { font-size: 11px; font-weight: 800; color: #0d6b58; margin-bottom: 6px; }
      .mock-draft-text { font-size: 12px; color: #444; line-height: 1.7; }
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

// ── Process radar LP ────────────────────────────────────────────────────────
{
  const filePath = resolve(DEST, "lp/radar/index.html");
  let html = readFileSync(filePath, "utf8");

  // Inject CSS (if not already there)
  if (!html.includes("browser-mock")) {
    html = html.replace(/(\s*<\/style>)(?![\s\S]*<\/style>)/, BROWSER_CSS + VOICES_HEAD_CSS + "\n$1");
  }

  // Replace old Proof section
  const proofRegex = /\s*<section class="section section-alt">\s*<div class="container">\s*<p class="section-label">Proof<\/p>[\s\S]*?<\/section>/;
  if (proofRegex.test(html)) {
    html = html.replace(proofRegex, "\n\n" + RADAR_PROOF);
    console.log("✓ lp/radar — proof section replaced");
  } else {
    console.warn("⚠ lp/radar — proof NOT matched");
  }

  writeFileSync(filePath, html, "utf8");
}

// ── Process other 6 LP files: replace plain voices heading with styled one ─
const LP_FILES = [
  "lp/proposal-optimizer/index.html",
  "lp/article-polish/index.html",
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
