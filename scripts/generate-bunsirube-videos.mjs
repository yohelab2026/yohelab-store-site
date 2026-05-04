import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { copyFile, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
let puppeteer;
try {
  puppeteer = require("puppeteer");
} catch {
  const userRequire = createRequire(join(process.env.USERPROFILE || "C:/Users/hotar", "package.json"));
  puppeteer = userRequire("puppeteer");
}

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const OUT_DIR = join(ROOT, "public", "assets", "bunsirube", "videos");
const ROOT_ASSET_DIR = join(ROOT, "assets", "bunsirube", "videos");
const SHOT_DIR = join(OUT_DIR, "_shots");
const WP_URL = process.env.BUNSIRUBE_WP_URL || "http://localhost:8088";
const WP_USER = process.env.BUNSIRUBE_WP_USER || "admin";
const WP_PASS = process.env.BUNSIRUBE_WP_PASS || "adminpass123";
const POST_ID = process.env.BUNSIRUBE_DEMO_POST_ID || "19";

const viewport = { width: 1280, height: 720, deviceScaleFactor: 1 };

function browserExecutablePath() {
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  ].filter(Boolean);
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return puppeteer.executablePath();
}

function ffmpegExecutablePath() {
  const candidates = [
    process.env.FFMPEG_PATH,
    "C:\\Users\\hotar\\Downloads\\tools\\ffmpeg\\ffmpeg-8.1-essentials_build\\bin\\ffmpeg.exe",
  ].filter(Boolean);
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return "ffmpeg";
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit" });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with ${code}`));
    });
  });
}

async function login(page) {
  await page.goto(`${WP_URL}/wp-login.php`, { waitUntil: "networkidle2" });
  if (page.url().includes("wp-login.php")) {
    await page.type("#user_login", WP_USER, { delay: 8 });
    await page.type("#user_pass", WP_PASS, { delay: 8 });
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle2" }),
      page.click("#wp-submit"),
    ]);
  }
}

async function shot(page, name, url, selector = "body") {
  await page.goto(url, { waitUntil: "networkidle2" });
  await page.waitForSelector(selector, { timeout: 15000 });
  await page.screenshot({ path: join(SHOT_DIR, `${name}.png`), fullPage: false });
  return join(SHOT_DIR, `${name}.png`);
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function dataUrl(file) {
  const bytes = await readFile(file);
  return `data:image/png;base64,${bytes.toString("base64")}`;
}

function rendererHtml(payload) {
  const json = JSON.stringify(payload).replace(/</g, "\\u003c");
  return `<!doctype html>
<meta charset="utf-8">
<title>文標 demo renderer</title>
<canvas id="stage" width="1280" height="720"></canvas>
<script>
const payload = ${json};
const canvas = document.getElementById("stage");
const ctx = canvas.getContext("2d");
const W = canvas.width;
const H = canvas.height;
const fps = 30;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundRect(x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function fitCover(img, x, y, w, h) {
  const scale = Math.max(w / img.width, h / img.height);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (img.width - sw) / 2;
  const sy = (img.height - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function fitContain(img, x, y, w, h) {
  const scale = Math.min(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  const dx = x + (w - dw) / 2;
  const dy = y + (h - dh) / 2;
  ctx.drawImage(img, dx, dy, dw, dh);
}

function drawText(text, x, y, maxWidth, lineHeight) {
  const words = String(text).split("");
  let line = "";
  for (const ch of words) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      line = ch;
      y += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, y);
}

function drawFrame(images, t) {
  const total = payload.duration;
  const segment = total / payload.slides.length;
  const idx = Math.min(payload.slides.length - 1, Math.floor(t / segment));
  const local = (t - idx * segment) / segment;
  const slide = payload.slides[idx];
  const img = images[idx];
  const nextImg = images[Math.min(images.length - 1, idx + 1)];
  const fade = Math.max(0, Math.min(1, (local - .82) / .18));

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#eaf5ff");
  bg.addColorStop(.55, "#ffffff");
  bg.addColorStop(1, "#e8fff8");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.globalAlpha = .22;
  fitCover(img, 0, 0, W, H);
  ctx.restore();

  ctx.fillStyle = "rgba(255,255,255,.72)";
  ctx.fillRect(0, 0, W, H);

  const sx = 72;
  const sy = 92;
  const sw = 1136;
  const sh = 510;
  ctx.shadowColor = "rgba(16,27,49,.18)";
  ctx.shadowBlur = 34;
  ctx.shadowOffsetY = 18;
  ctx.fillStyle = "#fff";
  roundRect(sx - 8, sy - 8, sw + 16, sh + 16, 28);
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.strokeStyle = "rgba(13,143,114,.24)";
  ctx.lineWidth = 2;
  roundRect(sx - 8, sy - 8, sw + 16, sh + 16, 28);
  ctx.stroke();

  fitContain(img, sx, sy, sw, sh);

  if (fade > 0 && nextImg) {
    ctx.save();
    ctx.globalAlpha = fade;
    fitContain(nextImg, sx, sy, sw, sh);
    ctx.restore();
  }

  const p = slide.pointer || [0.72, 0.68];
  const wobble = Math.sin(t * 5) * 4;
  const px = sx + sw * p[0] + wobble;
  const py = sy + sh * p[1] + Math.cos(t * 4) * 3;
  ctx.fillStyle = "rgba(11,155,127,.15)";
  ctx.beginPath();
  ctx.arc(px, py, 34 + Math.sin(t * 5) * 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#0b9b7f";
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(px + 18, py + 42);
  ctx.lineTo(px + 28, py + 26);
  ctx.lineTo(px + 46, py + 24);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(16,27,49,.92)";
  roundRect(72, 625, 1136, 62, 18);
  ctx.fill();
  ctx.fillStyle = "#e9fff7";
  ctx.font = "700 15px Arial, sans-serif";
  ctx.fillText(payload.kicker, 96, 648);
  ctx.fillStyle = "#fff";
  ctx.font = "800 26px Arial, sans-serif";
  ctx.fillText(slide.title, 96, 677);
  ctx.fillStyle = "rgba(255,255,255,.82)";
  ctx.font = "500 18px Arial, sans-serif";
  ctx.fillText(slide.caption, 520, 677);

  ctx.fillStyle = "rgba(11,155,127,.95)";
  roundRect(72, 28, 172, 42, 21);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "800 17px Arial, sans-serif";
  ctx.fillText(payload.label, 98, 55);

  ctx.fillStyle = "rgba(16,27,49,.86)";
  ctx.font = "900 24px Arial, sans-serif";
  ctx.fillText(payload.title, 270, 57);
}

async function record() {
  const images = await Promise.all(payload.slides.map((slide) => loadImage(slide.image)));
  drawFrame(images, 0);

  const stream = canvas.captureStream(fps);
  const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
    ? "video/webm;codecs=vp9"
    : "video/webm;codecs=vp8";
  const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 1800000 });
  const chunks = [];
  recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  const done = new Promise((resolve) => recorder.onstop = resolve);
  recorder.start();

  const start = performance.now();
  await new Promise((resolve) => {
    function tick(now) {
      const t = Math.min(payload.duration, (now - start) / 1000);
      drawFrame(images, t);
      if (t >= payload.duration) resolve();
      else requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
  recorder.stop();
  await done;
  const blob = new Blob(chunks, { type: "video/webm" });
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

let cachedImages;
async function renderAt(t) {
  cachedImages ||= await Promise.all(payload.slides.map((slide) => loadImage(slide.image)));
  drawFrame(cachedImages, t);
}

async function renderPoster() {
  await renderAt(0);
}

window.record = record;
window.renderPoster = renderPoster;
window.renderAt = renderAt;
</script>`;
}

async function renderVideo(browser, name, payload) {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  await page.setContent(rendererHtml(payload), { waitUntil: "load" });
  await page.evaluate(() => window.renderAt(0));
  const poster = await page.screenshot({ type: "png" });
  await writeFile(join(OUT_DIR, `${name}-poster.png`), poster);

  const frameDir = join(OUT_DIR, "_frames", name);
  await rm(frameDir, { recursive: true, force: true });
  await mkdir(frameDir, { recursive: true });
  const fps = 12;
  const frames = Math.ceil(payload.duration * fps);
  for (let i = 0; i < frames; i += 1) {
    await page.evaluate((time) => window.renderAt(time), i / fps);
    await page.screenshot({ path: join(frameDir, `frame-${String(i).padStart(4, "0")}.png`), type: "png" });
  }
  await run(ffmpegExecutablePath(), [
    "-y",
    "-framerate", String(fps),
    "-i", join(frameDir, "frame-%04d.png"),
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-crf", "24",
    "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
    join(OUT_DIR, `${name}.mp4`),
  ]);
  await page.close();
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  await rm(SHOT_DIR, { recursive: true, force: true });
  await mkdir(SHOT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: browserExecutablePath(),
    defaultViewport: viewport,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,720"],
  });

  const page = await browser.newPage();
  await page.setViewport(viewport);
  await login(page);

  const shots = {
    themes: await shot(page, "themes", `${WP_URL}/wp-admin/themes.php`, "body"),
    settings: await shot(page, "settings", `${WP_URL}/wp-admin/themes.php?page=bunsirube`, "body"),
    htaccess: await shot(page, "htaccess", `${WP_URL}/wp-admin/themes.php?page=bunsirube-htaccess`, "body"),
    editor: await shot(page, "editor", `${WP_URL}/wp-admin/post.php?post=${POST_ID}&action=edit`, "body"),
    article: await shot(page, "article", `${WP_URL}/?p=${POST_ID}`, "body"),
    dashboard: await shot(page, "dashboard", `${WP_URL}/wp-admin/index.php`, "body"),
  };
  await page.close();

  const urls = Object.fromEntries(await Promise.all(Object.entries(shots).map(async ([key, file]) => [key, await dataUrl(file)])));

  await renderVideo(browser, "bunsirube-quick-tour", {
    title: "30秒で分かる文標",
    label: "30 SEC",
    kicker: "QUICK TOUR",
    duration: 34,
    slides: [
      { image: urls.settings, title: "導入後は外観 > 文標へ", caption: "色・SEO出力・解析・ライセンスをまとめて確認。", pointer: [.22, .32] },
      { image: urls.editor, title: "7種類の記事型から始める", caption: "比較・レビュー・FAQなど、書く目的で型を選べます。", pointer: [.82, .30] },
      { image: urls.article, title: "FAQ・比較表・CTAを置く", caption: "AI検索も意識して、答えと根拠を本文に残します。", pointer: [.48, .59] },
      { image: urls.dashboard, title: "押された導線を確認する", caption: "CTA・比較表・広告リンクをWordPress内で小さく確認。", pointer: [.33, .43] },
    ],
  });

  await renderVideo(browser, "bunsirube-install", {
    title: "文標の導入と初期設定",
    label: "01 / SETUP",
    kicker: "ZIP導入",
    duration: 13,
    slides: [
      { image: urls.themes, title: "テーマを有効化", caption: "WordPressのテーマ画面で文標を選びます。", pointer: [.36, .46] },
      { image: urls.settings, title: "外観 > 文標を開く", caption: "色・SEO出力・解析・ライセンスをまとめて確認。", pointer: [.22, .32] },
      { image: urls.htaccess, title: ".htaccessは必要な時だけ", caption: "自動バックアップと手元保存で事故を減らします。", pointer: [.42, .28] },
    ],
  });

  await renderVideo(browser, "bunsirube-writing", {
    title: "記事型から書き始める流れ",
    label: "02 / WRITE",
    kicker: "記事作成",
    duration: 13,
    slides: [
      { image: urls.editor, title: "記事型を選ぶ", caption: "比較・レビュー・FAQなど、7種類の型から開始。", pointer: [.82, .30] },
      { image: urls.article, title: "比較表・FAQ・CTAを配置", caption: "読者が迷わない順番で記事パーツを置けます。", pointer: [.39, .53] },
      { image: urls.article, title: "本文に答えと根拠を残す", caption: "AI検索も意識して、見える本文に情報を置きます。", pointer: [.57, .70] },
    ],
  });

  await renderVideo(browser, "bunsirube-route-check", {
    title: "導線確認と公開前チェック",
    label: "03 / CHECK",
    kicker: "導線確認",
    duration: 13,
    slides: [
      { image: urls.article, title: "CTA・比較表をクリック確認", caption: "記事を書いて終わりにしない導線を作ります。", pointer: [.46, .59] },
      { image: urls.dashboard, title: "クリック数を小さく確認", caption: "CTA・比較表・広告リンク・ブログカードを参考値で確認。", pointer: [.33, .43] },
      { image: urls.settings, title: "事故防止チェック", caption: "SEO重複、二重キャッシュ、子テーマ利用を見直せます。", pointer: [.54, .52] },
    ],
  });

  await browser.close();
  await rm(join(OUT_DIR, "_frames"), { recursive: true, force: true });
  await rm(SHOT_DIR, { recursive: true, force: true });
  await rm(ROOT_ASSET_DIR, { recursive: true, force: true });
  await mkdir(ROOT_ASSET_DIR, { recursive: true });
  for (const entry of await readdir(OUT_DIR, { withFileTypes: true })) {
    if (entry.isFile() && /\.(mp4|png)$/i.test(entry.name)) {
      await copyFile(join(OUT_DIR, entry.name), join(ROOT_ASSET_DIR, entry.name));
    }
  }
  console.log("Generated Bunsirube videos in", OUT_DIR);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
