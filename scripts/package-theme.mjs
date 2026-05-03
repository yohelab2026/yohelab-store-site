/**
 * scripts/package-theme.mjs
 *
 * wordpress-themes/<theme-slug>/ を ZIP にまとめる。
 * 生成した ZIP は R2 へアップロードして使う:
 *   npm run package-theme
 *   wrangler r2 object put theme-assets/bunsirube-0.2.8.zip --file=bunsirube-0.2.8.zip
 *   npm run package-child-theme
 *   wrangler r2 object put theme-assets/bunsirube-child-0.1.0.zip --file=bunsirube-child-0.1.0.zip
 */

import { copyFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = join(__dirname, "..");
const THEME_SLUG = process.argv[2] || "bunsirube";
const THEME_DIR = join(ROOT, "wordpress-themes", THEME_SLUG);
const STYLE_FILE = join(THEME_DIR, "style.css");

// ---- 除外パターン ----
const EXCLUDE = [
  /\/(\.git|\.github|\.DS_Store|node_modules|__MACOSX)(\/|$)/,
  /\/\.gitignore$/,
  /\/\.gitkeep$/,
  /\/thumbs\.db$/i,
];

function shouldExclude(filePath) {
  return EXCLUDE.some((re) => re.test(filePath.replace(/\\/g, "/")));
}

// ---- ファイル収集 ----
function collectFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const rel = relative(THEME_DIR, full);
    const zipPath = `${THEME_SLUG}/` + rel.replace(/\\/g, "/");
    if (shouldExclude("/" + zipPath)) continue;
    const stat = statSync(full);
    if (stat.isDirectory()) {
      results.push(...collectFiles(full));
    } else {
      results.push({ full, zipPath });
    }
  }
  return results;
}

// ---- ZIP 生成 (Node 標準ライブラリのみ使用) ----
// Node.js 18+ に組み込みの Blob/ArrayBuffer を活用したシンプルな実装
// 外部依存なしで ZIP を生成するために手書きの ZIP writer を使う

import { readFileSync } from "node:fs";

function crc32(buf) {
  const table = (() => {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[i] = c;
    }
    return t;
  })();
  let crc = 0xffffffff;
  for (const byte of buf) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function writeUint16LE(buf, offset, val) {
  buf[offset] = val & 0xff;
  buf[offset + 1] = (val >> 8) & 0xff;
}
function writeUint32LE(buf, offset, val) {
  buf[offset] = val & 0xff;
  buf[offset + 1] = (val >> 8) & 0xff;
  buf[offset + 2] = (val >> 16) & 0xff;
  buf[offset + 3] = (val >> 24) & 0xff;
}

// Valid fixed ZIP timestamp for reproducible packages: 2026-01-01 00:00:00.
const FIXED_DOS_TIME = 0;
const FIXED_DOS_DATE = ((2026 - 1980) << 9) | (1 << 5) | 1;

async function buildZip(files) {
  const parts = [];
  const centralDir = [];
  let offset = 0;

  const enc = new TextEncoder();

  for (const { full, zipPath } of files) {
    const data = readFileSync(full);
    const nameBuf = enc.encode(zipPath);
    const crc = crc32(data);
    const size = data.length;

    // Local file header
    const lhSize = 30 + nameBuf.length;
    const lh = new Uint8Array(lhSize);
    writeUint32LE(lh, 0, 0x04034b50); // signature
    writeUint16LE(lh, 4, 20);          // version needed
    writeUint16LE(lh, 6, 0);           // flags
    writeUint16LE(lh, 8, 0);           // no compression (store)
    writeUint16LE(lh, 10, FIXED_DOS_TIME);
    writeUint16LE(lh, 12, FIXED_DOS_DATE);
    writeUint32LE(lh, 14, crc);
    writeUint32LE(lh, 18, size);
    writeUint32LE(lh, 22, size);
    writeUint16LE(lh, 26, nameBuf.length);
    writeUint16LE(lh, 28, 0);          // extra length
    lh.set(nameBuf, 30);

    parts.push(lh, data);

    // Central directory entry
    const cdSize = 46 + nameBuf.length;
    const cd = new Uint8Array(cdSize);
    writeUint32LE(cd, 0, 0x02014b50); // signature
    writeUint16LE(cd, 4, 20);          // version made by
    writeUint16LE(cd, 6, 20);          // version needed
    writeUint16LE(cd, 8, 0);
    writeUint16LE(cd, 10, 0);
    writeUint16LE(cd, 12, FIXED_DOS_TIME);
    writeUint16LE(cd, 14, FIXED_DOS_DATE);
    writeUint32LE(cd, 16, crc);
    writeUint32LE(cd, 20, size);
    writeUint32LE(cd, 24, size);
    writeUint16LE(cd, 28, nameBuf.length);
    writeUint16LE(cd, 30, 0);
    writeUint16LE(cd, 32, 0);
    writeUint16LE(cd, 34, 0);
    writeUint16LE(cd, 36, 0);
    writeUint32LE(cd, 38, 0x81a40000); // external attr (regular file)
    writeUint32LE(cd, 42, offset);
    cd.set(nameBuf, 46);

    centralDir.push(cd);
    offset += lhSize + size;
  }

  const cdBuf = Buffer.concat(centralDir.map((b) => Buffer.from(b)));
  const eocd = new Uint8Array(22);
  writeUint32LE(eocd, 0, 0x06054b50);
  writeUint16LE(eocd, 4, 0);
  writeUint16LE(eocd, 6, 0);
  writeUint16LE(eocd, 8, centralDir.length);
  writeUint16LE(eocd, 10, centralDir.length);
  writeUint32LE(eocd, 12, cdBuf.length);
  writeUint32LE(eocd, 16, offset);
  writeUint16LE(eocd, 20, 0);

  return Buffer.concat([...parts.map((b) => Buffer.from(b)), cdBuf, Buffer.from(eocd)]);
}

// ---- メイン ----
const files = collectFiles(THEME_DIR);
console.log(`Packaging ${files.length} files from wordpress-themes/${THEME_SLUG}/ ...`);

const zip = await buildZip(files);
import { writeFileSync } from "node:fs";
const style = readFileSync(STYLE_FILE, "utf8");
const version = style.match(/^Version:\s*(.+)$/m)?.[1]?.trim() || "0.0.0";
const versionedName = `${THEME_SLUG}-${version}.zip`;
const versionedFile = join(ROOT, versionedName);
const stableName = `${THEME_SLUG}.zip`;
const stableFile = join(ROOT, stableName);
writeFileSync(versionedFile, zip);
copyFileSync(versionedFile, stableFile);

const kb = (zip.length / 1024).toFixed(1);
console.log(`✓ ${versionedName} (${kb} KB)`);
console.log(`✓ ${stableName} (${kb} KB, compatibility copy)`);
console.log("");
console.log("To upload to R2:");
console.log(`  wrangler r2 object put theme-assets/${versionedName} --file=${versionedName}`);
console.log(`  wrangler r2 object put theme-assets/${stableName} --file=${stableName}  # optional compatibility copy`);
