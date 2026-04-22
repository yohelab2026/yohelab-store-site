/**
 * patch-voices.mjs
 * 1. Replace full names with initials in all voice cards
 * 2. Add "ベータ版を試した人の声" sub-heading before .voices-grid in LP pages
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const DEST = "C:/Users/hotar/Documents/GitHub/yohelab-store-site";

// Name → initials mapping
const NAMES = {
  "北村さん": "K.N",
  "田中さん": "T.T",
  "佐藤さん": "S.S",
  "山田さん": "Y.Y",
  "山下さん": "Y.Y",
  "川口さん": "K.K",
  "林さん":   "H.H",
  "松本さん": "M.M",
  "大野さん": "O.O",
  "青木さん": "A.A",
  "石田さん": "I.I",
  "上野さん": "U.U",
  "江口さん": "E.E",
  "渡辺さん": "W.W",
  "中村さん": "N.N",
  "藤田さん": "F.T",
  "小林さん": "K.K",
  "坂本さん": "S.S",
  "三浦さん": "M.M",
  "鈴木さん": "S.S",
  "加藤さん": "K.K",
  "吉田さん": "Y.Y",
  "高橋さん": "T.T",
  "岩田さん": "I.I",
  "原さん":   "H.H",
  "黒木さん": "K.K",
  "森田さん": "M.M",
  "西村さん": "N.N",
  "土井さん": "T.D",
};

// Avatar initial → updated to match new initials
const AVATAR_MAP = {
  "K2": "K.K", "W2": "W.W", "F2": "F.T",
};

const FILES = [
  "lp/x-helper/index.html",
  "lp/ec-copy/index.html",
  "lp/aio-mini/index.html",
  "lp/proposal/index.html",
  "tools/index.html",
];

for (const rel of FILES) {
  const filePath = resolve(DEST, rel);
  let html = readFileSync(filePath, "utf8");

  // 1. Replace full names → initials in voice-name spans
  for (const [name, init] of Object.entries(NAMES)) {
    const re = new RegExp(`(<span class="voice-name">)${name}(<\\/span>)`, "g");
    html = html.replace(re, `$1${init}$2`);
  }

  // 2. Update avatar text to match initials (single letter → e.g. "K.N")
  // Avatar currently shows first letter only. Update to show full initial.
  for (const [name, init] of Object.entries(NAMES)) {
    const firstLetter = init[0];
    // Match avatar divs right before the voice-meta-wrap containing this name
    // Simpler: just replace <div class="voice-avatar">X</div> near the name
    const avatarRe = new RegExp(
      `(<div class="voice-avatar">)(${firstLetter}|${init.replace(".","\\.")})(</div>\\s*<div class="voice-meta-wrap">\\s*<span class="voice-name">${init})`,
      "g"
    );
    html = html.replace(avatarRe, `$1${init}$3`);
  }

  // 3. Add "ベータ版を試した人の声" heading before voices-grid
  //    (only if not already added)
  if (!html.includes("ベータ版を試した人の声")) {
    html = html.replace(
      /(<div class="voices-grid">)/g,
      `<div class="voices-heading" style="text-align:center;margin-bottom:20px;">
            <p style="font-size:11px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;color:#888;margin-bottom:6px;">Beta Voices</p>
            <h3 style="font-size:22px;font-weight:900;letter-spacing:-0.03em;color:#1a1f2e;">ベータ版を試した人の声</h3>
          </div>
          $1`
    );
  }

  writeFileSync(filePath, html, "utf8");
  console.log(`✓ ${rel}`);
}

console.log("\n✅ patch-voices done");
