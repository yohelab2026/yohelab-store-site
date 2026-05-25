import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, resolve } from "node:path";
import { gzipSync } from "node:zlib";

const root = resolve(process.cwd());
const distRoot = resolve(root, "dist");

if (!existsSync(distRoot)) {
  throw new Error("dist folder is missing. Run npm run build first.");
}

const criticalPages = [
  { path: "index.html", htmlGzipKb: 16, assetKb: 150 },
  { path: "blog/index.html", htmlGzipKb: 10, assetKb: 620 },
  { path: "lp/bunsirube/index.html", htmlGzipKb: 28, assetKb: 1100 },
  { path: "lp/bunsirube/demo/index.html", htmlGzipKb: 12, assetKb: 720 },
  { path: "lp/bunsirube/install/index.html", htmlGzipKb: 12, assetKb: 720 },
  { path: "contact/index.html", htmlGzipKb: 8, assetKb: 140 },
  { path: "legal/privacy/index.html", htmlGzipKb: 6, assetKb: 120 },
];

const requiredHead = [
  ["title", /<title>[^<]{8,}<\/title>/i],
  ["description", /<meta\s+name=["']description["']\s+content=["'][^"']{40,}["']/i],
  ["viewport", /<meta\s+name=["']viewport["']/i],
  ["canonical", /<link\s+rel=["']canonical["']/i],
  ["robots", /<meta\s+name=["']robots["']/i],
  ["og:title", /<meta\s+property=["']og:title["']/i],
  ["og:image", /<meta\s+property=["']og:image["']/i],
  ["twitter:card", /<meta\s+name=["']twitter:card["']/i],
  ["json-ld", /<script\s+type=["']application\/ld\+json["']/i],
];

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = resolve(dir, entry.name);
    if (entry.isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

function readDist(path) {
  const file = resolve(distRoot, path);
  if (!existsSync(file)) throw new Error(`Missing dist file: ${path}`);
  return readFileSync(file, "utf8");
}

function localAssetPath(ref) {
  if (!ref || /^(https?:|data:|mailto:|tel:|#)/i.test(ref)) return null;
  const clean = ref.split("#")[0].split("?")[0];
  if (!clean || clean === "/") return null;
  return resolve(distRoot, clean.replace(/^\//, ""));
}

function criticalAssetRefs(html) {
  const refs = [];
  for (const match of html.matchAll(/<link\b(?=[^>]*\srel=["']stylesheet["'])[^>]*\shref=["']([^"']+)["'][^>]*>/gi)) refs.push(match[1]);
  for (const match of html.matchAll(/<script\b[^>]*\ssrc=["']([^"']+)["'][^>]*>/gi)) refs.push(match[1]);
  for (const match of html.matchAll(/<link\b(?=[^>]*\srel=["']preload["'])(?=[^>]*\sas=["']image["'])[^>]*\shref=["']([^"']+)["'][^>]*>/gi)) refs.push(match[1]);
  for (const match of html.matchAll(/<img\b[^>]*\ssrc=["']([^"']+)["'][^>]*>/gi)) {
    const tag = match[0];
    if (/\sloading=["']lazy["']/i.test(tag)) continue;
    refs.push(match[1]);
  }
  return refs
    .map((ref) => localAssetPath(ref))
    .filter((file) => file && existsSync(file) && /\.(css|js|png|webp|jpe?g|svg)$/i.test(file));
}

function imageLikeRefs(html) {
  const refs = [];
  for (const match of html.matchAll(/<img\b[^>]*\ssrc=["']([^"']+)["'][^>]*>/gi)) refs.push(match[1]);
  for (const match of html.matchAll(/<video\b[^>]*\sposter=["']([^"']+)["'][^>]*>/gi)) refs.push(match[1]);
  for (const match of html.matchAll(/<link\b(?=[^>]*\srel=["']preload["'])(?=[^>]*\sas=["']image["'])[^>]*\shref=["']([^"']+)["'][^>]*>/gi)) refs.push(match[1]);
  return refs.map(localAssetPath).filter((file) => file && existsSync(file));
}

function assertOk(condition, message) {
  if (!condition) throw new Error(message);
}

const htmlFiles = walk(distRoot).filter((file) => extname(file).toLowerCase() === ".html");
const renderedTextFiles = walk(distRoot).filter((file) => [".html", ".css", ".js", ".webmanifest"].includes(extname(file).toLowerCase()));

for (const file of renderedTextFiles) {
  const rel = file.replace(`${distRoot}\\`, "").replaceAll("\\", "/");
  const text = readFileSync(file, "utf8");
  assertOk(!/(^|[^0-9a-fA-F])#0b8f72(?![0-9a-fA-F])/i.test(text), `${rel}: old brand green can fail contrast checks`);
  assertOk(!/(^|[^0-9a-fA-F])#777(?![0-9a-fA-F])/i.test(text), `${rel}: muted text color is too light for Lighthouse contrast`);
}

for (const file of htmlFiles) {
  const rel = file.replace(`${distRoot}\\`, "").replaceAll("\\", "/");
  const html = readFileSync(file, "utf8");
  const imgTags = [...html.matchAll(/<img\b[^>]*>/gi)].map((match) => match[0]);
  const missingAlt = imgTags.filter((tag) => !/\salt\s*=/.test(tag));
  assertOk(missingAlt.length === 0, `${rel}: image alt is missing`);

  const heavyMascotPattern = /<(?:img|link)\b[^>]+(?:src|href)=["']\/yohelab-mascot-v2-20260518\.(?:png|webp)["'][^>]*>/i;
  assertOk(!heavyMascotPattern.test(html), `${rel}: full-size mascot is used in rendered markup`);

  for (const asset of imageLikeRefs(html)) {
    const kb = statSync(asset).size / 1024;
    assertOk(kb <= 300, `${rel}: image-like asset is too large (${kb.toFixed(1)} KB): ${asset.replace(`${distRoot}\\`, "")}`);
  }
}

for (const page of criticalPages) {
  const html = readDist(page.path);
  const missing = requiredHead.filter(([, re]) => !re.test(html)).map(([name]) => name);
  assertOk(missing.length === 0, `${page.path}: missing SEO head tags: ${missing.join(", ")}`);

  if (page.path === "index.html") {
    assertOk(!html.includes("/shared/site.min.css"), "index.html: avoid render-blocking shared CSS on the homepage");
  }

  const htmlGzipKb = gzipSync(html).length / 1024;
  assertOk(htmlGzipKb <= page.htmlGzipKb, `${page.path}: gzipped HTML budget exceeded (${htmlGzipKb.toFixed(1)} KB > ${page.htmlGzipKb} KB)`);

  const assets = [...new Set(criticalAssetRefs(html))];
  const assetKb = assets.reduce((sum, file) => sum + statSync(file).size / 1024, 0);
  assertOk(assetKb <= page.assetKb, `${page.path}: local asset budget exceeded (${assetKb.toFixed(1)} KB > ${page.assetKb} KB)`);
}

const robotsTxt = readFileSync(resolve(root, "robots.txt"), "utf8");
assertOk(!/^\s*Content-Signal\s*:/im.test(robotsTxt), "robots.txt: Content-Signal is not accepted by Lighthouse");

const middleware = readFileSync(resolve(root, "functions", "_middleware.js"), "utf8");
assertOk(
  middleware.includes('url.pathname === "/robots.txt"') && !/^\s*Content-Signal\s*:/im.test(middleware),
  "functions/_middleware.js: robots.txt must be served without Content-Signal directives",
);

console.log(`OK  performance and SEO budgets passed (${criticalPages.length} critical pages, ${htmlFiles.length} html files).`);
