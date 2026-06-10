import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, resolve } from "node:path";

const root = resolve(process.cwd());
const distRoot = resolve(root, "dist");

if (!existsSync(distRoot)) {
  throw new Error("dist folder is missing. Run npm run build first.");
}

const checks = [];
const forbiddenPublicText = [/文標/u, /Bunsirube/u, /\/lp\/bunsirube/u, /\/products\/bunsirube/u, /hreflang="en"/u, /https:\/\/yohelab\.com\/en\//u];
const requiredPages = [
  "index.html",
  "blog/index.html",
  "blog/ai-news-selling-ideas/index.html",
  "blog/comparison-article-template/index.html",
  "blog/faq-source-ai-search/index.html",
  "blog/sales-page-common-mistakes/index.html",
  "about/index.html",
  "contact/index.html",
  "legal/commerce/index.html",
  "legal/privacy/index.html",
  "legal/terms/index.html",
  "games/index.html",
  "404.html",
  "sitemap.xml",
  "feed.xml",
  "llms.txt",
  "site.webmanifest",
];
const removedPaths = [
  "en/index.html",
  "en/blog/index.html",
  "lp/bunsirube/index.html",
  "lp/bunsirube/install/index.html",
  "lp/bunsirube/demo/index.html",
  "lp/bunsirube/updates/index.html",
  "products/bunsirube/index.html",
  "blog/bunsirube-before-install/index.html",
  "blog/bunsirube-version-history/index.html",
  "blog/free-theme-vs-bunsirube/index.html",
  "contact/bug/index.html",
  "affiliate/dashboard/index.html",
  "legal/affiliate-terms/index.html",
];

function dist(path) {
  return resolve(distRoot, path);
}

function src(path) {
  return resolve(root, path);
}

function read(path) {
  return readFileSync(path, "utf8");
}

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = resolve(dir, entry.name);
    if (entry.isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

function assertOk(condition, message) {
  checks.push([message, Boolean(condition)]);
}

for (const page of requiredPages) {
  assertOk(existsSync(dist(page)), `required page exists: ${page}`);
}

for (const page of removedPaths) {
  assertOk(!existsSync(dist(page)), `removed public page is absent: ${page}`);
}

const home = read(dist("index.html"));
const blog = read(dist("blog/index.html"));
const sitemap = read(dist("sitemap.xml"));
const feed = read(dist("feed.xml"));
const llms = read(dist("llms.txt"));
const manifest = read(dist("site.webmanifest"));
const redirects = read(src("public/_redirects"));

assertOk(home.includes("<title>") && !home.includes("文標"), "home title and body omit old product name");
assertOk(home.includes("日本語向け") || blog.includes("日本語向け"), "site states templates or notes are Japanese-oriented");
assertOk(blog.includes("/blog/ai-news-selling-ideas/") && blog.includes("/blog/comparison-article-template/"), "blog index keeps active Japanese articles");
assertOk(!blog.includes("/en/") && !blog.includes("English"), "blog index omits English version links");
assertOk(sitemap.includes("https://yohelab.com/blog/comparison-article-template/"), "sitemap includes active blog article");
assertOk(!sitemap.includes("/en/") && !sitemap.includes("bunsirube"), "sitemap excludes English and old product URLs");
assertOk(!feed.includes("/en/") && !feed.includes("bunsirube") && !feed.includes("文標"), "feed excludes English and old product content");
assertOk(!llms.includes("/en/") && !llms.includes("bunsirube") && !llms.includes("文標"), "llms.txt excludes English and old product content");
assertOk(!manifest.includes("文標") && !manifest.includes("bunsirube"), "web manifest uses the site brand only");
assertOk(redirects.includes("/en/* / 301") && redirects.includes("/lp/bunsirube/* / 301"), "old URLs redirect away from removed pages");
assertOk(!existsSync(src("functions/en/blog/[slug].js")), "English dynamic blog route is removed");
assertOk(existsSync(src("assets/line/rich-menu.png")) && !existsSync(src("assets/line/rich-menu-bunsirube.png")), "LINE menu asset uses generic file name");

const textFiles = walk(distRoot).filter((file) => {
  const rel = file.replace(`${distRoot}\\`, "").replaceAll("\\", "/");
  if (rel === "_redirects") return false;
  if (rel.startsWith("assets/")) return false;
  const ext = extname(file).toLowerCase();
  return [".html", ".xml", ".txt", ".json", ".webmanifest"].includes(ext);
});

for (const file of textFiles) {
  const rel = file.replace(`${distRoot}\\`, "").replaceAll("\\", "/");
  const text = read(file);
  for (const pattern of forbiddenPublicText) {
    assertOk(!pattern.test(text), `${rel}: old product or English SEO marker is absent (${pattern})`);
  }
}

const htmlFiles = walk(distRoot).filter((file) => extname(file).toLowerCase() === ".html");
for (const file of htmlFiles) {
  const rel = file.replace(`${distRoot}\\`, "").replaceAll("\\", "/");
  const html = read(file);
  if (rel.includes("/blog/admin/") || rel === "404.html") continue;
  assertOk(/<title>[^<]{8,}<\/title>/i.test(html), `${rel}: has a title`);
  assertOk(/<meta\s+name=["']description["']\s+content=["'][^"']{30,}["']/i.test(html), `${rel}: has meta description`);
  assertOk(/<link\s+rel=["']canonical["']/i.test(html), `${rel}: has canonical`);
}

for (const file of htmlFiles) {
  const rel = file.replace(`${distRoot}\\`, "").replaceAll("\\", "/");
  const html = read(file);
  const imgTags = [...html.matchAll(/<img\b[^>]*>/gi)].map((match) => match[0]);
  const missingAlt = imgTags.filter((tag) => !/\salt\s*=/.test(tag));
  assertOk(missingAlt.length === 0, `${rel}: every image has alt`);
}

for (const file of walk(distRoot)) {
  const rel = file.replace(`${distRoot}\\`, "").replaceAll("\\", "/");
  if (!/\.(png|webp|jpe?g|svg)$/i.test(file)) continue;
  if (rel.startsWith("assets/blog/")) continue;
  if (rel.startsWith("assets/og/")) continue;
  const kb = statSync(file).size / 1024;
  assertOk(kb <= 1800, `${rel}: static asset is within broad smoke-test size budget`);
}

const failed = checks.filter(([, ok]) => !ok);
if (failed.length) {
  console.error("Smoke test failed:");
  for (const [name] of failed) console.error(`- ${name}`);
  process.exit(1);
}

console.log(`OK smoke checks passed (${checks.length} checks).`);
