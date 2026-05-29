import { submitIndexNow } from "../functions/lib/indexnow.js";

const SITE_ORIGIN = "https://yohelab.com";
const CORE_URLS = [
  "/",
  "/about/",
  "/blog/",
  "/lp/bunsirube/",
  "/lp/bunsirube/install/",
  "/lp/bunsirube/demo/",
  "/lp/bunsirube/updates/",
  "/products/bunsirube/",
  "/contact/",
  "/sitemap.xml",
  "/feed.xml",
  "/robots.txt",
];

const urls = unique([
  ...CORE_URLS.map((path) => new URL(path, SITE_ORIGIN).href),
  ...(await liveSitemapUrls()),
]);

const chunks = chunk(urls, 100);
const results = [];
for (const group of chunks) {
  results.push(await submitIndexNow(group));
}

const ok = results.every((result) => result.ok);
const submitted = results.reduce((total, result) => total + Number(result.submitted || 0), 0);
console.log(JSON.stringify({ ok, submitted, batches: results.length, results }, null, 2));
if (!ok) process.exitCode = 1;

async function liveSitemapUrls() {
  try {
    const response = await fetch(`${SITE_ORIGIN}/sitemap.xml?notify=${Date.now()}`, {
      headers: { "User-Agent": "yohelab-search-discovery-notifier/1.0" },
    });
    if (!response.ok) return [];
    const xml = await response.text();
    return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => decodeXml(match[1]));
  } catch {
    return [];
  }
}

function unique(values) {
  return [...new Set(values.map(canonicalUrl).filter(Boolean))];
}

function canonicalUrl(value) {
  try {
    const url = new URL(String(value || ""), SITE_ORIGIN);
    if (url.hostname !== "yohelab.com") return "";
    url.hash = "";
    return url.href;
  } catch {
    return "";
  }
}

function decodeXml(value) {
  return String(value || "")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'");
}

function chunk(values, size) {
  const groups = [];
  for (let index = 0; index < values.length; index += size) groups.push(values.slice(index, index + size));
  return groups;
}
