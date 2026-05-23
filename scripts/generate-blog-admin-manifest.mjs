import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const blogDir = join(root, "blog");
const outFile = join(root, "blog", "admin", "static-posts.json");
const publicOutDir = join(root, "public", "blog", "admin");
const publicOutFile = join(publicOutDir, "static-posts.json");
const functionsGeneratedDir = join(root, "functions", "generated");
const sitemapPostsFile = join(functionsGeneratedDir, "static-blog-posts.js");
const socialPostsFile = join(functionsGeneratedDir, "static-blog-social-posts.js");
const skip = new Set(["admin", "post"]);

const dirs = await readdir(blogDir, { withFileTypes: true });
const posts = [];

for (const dirent of dirs) {
  if (!dirent.isDirectory() || skip.has(dirent.name)) continue;
  const file = join(blogDir, dirent.name, "index.html");
  let html = "";
  try {
    html = await readFile(file, "utf8");
  } catch {
    continue;
  }

  const title = cleanTitle(extractH1(html) || extractTitle(html) || dirent.name);
  const excerpt = extractMeta(html, "description");
  const robots = extractMeta(html, "robots").toLowerCase();
  const status = robots.includes("noindex") ? "draft" : "published";
  const date = extractJsonLdDate(html) || extractFirstDate(html) || "";
  const eyecatch = normalizeImage(extractPostCover(html) || extractOgImage(html));
  const socialImage = normalizeImage(extractTwitterImage(html) || extractOgImage(html) || eyecatch);
  const tags = extractTags(html);
  const bodyHtml = cleanupBody(extractPostBody(html) || extractDraftBody(html) || extractArticle(html) || "");

  posts.push({
    slug: dirent.name,
    url: `/blog/${dirent.name}/`,
    title,
    excerpt,
    status,
    date,
    tags,
    eyecatch,
    socialImage,
    bodyHtml,
  });
}

posts.sort((a, b) => {
  if (a.status !== b.status) return a.status === "draft" ? -1 : 1;
  return String(b.date).localeCompare(String(a.date)) || a.title.localeCompare(b.title, "ja");
});

const previous = await readJson(outFile);
const generatedAt = samePosts(previous?.posts, posts)
  ? previous.generatedAt || new Date().toISOString()
  : new Date().toISOString();
const json = `${JSON.stringify({ generatedAt, posts }, null, 2)}\n`;
await writeFile(outFile, json, "utf8");
await mkdir(publicOutDir, { recursive: true });
await writeFile(publicOutFile, json, "utf8");
await mkdir(functionsGeneratedDir, { recursive: true });
await writeFile(sitemapPostsFile, buildStaticBlogPostsModule(posts), "utf8");
await writeFile(socialPostsFile, buildStaticBlogSocialPostsModule(posts), "utf8");
console.log(`Generated ${posts.length} static blog posts manifest.`);

function extractTitle(html) {
  return decode(stripTags(match(html, /<title[^>]*>([\s\S]*?)<\/title>/i))).replace(/\s*\|\s*よへラボ(?:ブログ)?\s*$/i, "");
}

function extractH1(html) {
  return decode(stripTags(match(html, /<h1\b[^>]*>([\s\S]*?)<\/h1>/i)));
}

function cleanTitle(title) {
  return decode(String(title || "")).replace(/\s+/g, " ").trim();
}

function extractMeta(html, name) {
  const escaped = escapeRegExp(name);
  return decode(
    match(html, new RegExp(`<meta\\b(?=[^>]*(?:name|property)=["']${escaped}["'])[^>]*content=["']([^"']*)["'][^>]*>`, "i")),
  );
}

function extractOgImage(html) {
  return match(html, /<meta\b(?=[^>]*property=["']og:image["'])[^>]*content=["']([^"']*)["'][^>]*>/i);
}

function extractTwitterImage(html) {
  return match(html, /<meta\b(?=[^>]*name=["']twitter:image["'])[^>]*content=["']([^"']*)["'][^>]*>/i);
}

function extractPostCover(html) {
  return match(html, /<img\b(?=[^>]*class=["'][^"']*post-cover[^"']*["'])[^>]*src=["']([^"']+)["'][^>]*>/i);
}

function extractJsonLdDate(html) {
  return match(html, /"datePublished"\s*:\s*"(\d{4}-\d{2}-\d{2})"/i);
}

function extractFirstDate(html) {
  return match(html, /(\d{4}-\d{2}-\d{2})/);
}

function extractPostBody(html) {
  return matchBalancedDiv(html, /<div\b[^>]*class=["'][^"']*post-body[^"']*["'][^>]*>/i);
}

function extractArticle(html) {
  return match(html, /<article\b[^>]*>([\s\S]*?)<\/article>/i);
}

function extractDraftBody(html) {
  const marker = "<!-- 本文 -->";
  const start = html.indexOf(marker);
  if (start === -1) return "";
  return matchBalancedDiv(html.slice(start), /<div\b[^>]*>/i);
}

function extractTags(html) {
  const tags = new Set();
  for (const [, text] of html.matchAll(/class=["'][^"']*post-tag[^"']*["'][^>]*>([\s\S]*?)<\/(?:span|a)>/gi)) {
    const tag = decode(stripTags(text)).trim();
    if (tag) tags.add(tag);
  }
  for (const [, tag] of html.matchAll(/[?&]tag=([a-z0-9_-]+)/gi)) {
    if (tag) tags.add(tag);
  }
  return [...tags].slice(0, 12);
}

function cleanupBody(html) {
  return String(html || "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "")
    .replace(/<div\b[^>]*>\s*<div[^>]*>関連記事[\s\S]*?<\/div>\s*<\/div>/gi, "")
    .trim();
}

function normalizeImage(url) {
  return String(url || "").replace(/^https:\/\/yohelab\.com/i, "");
}

function match(html, regex) {
  const found = String(html || "").match(regex);
  return found ? found[1] || "" : "";
}

function matchBalancedDiv(html, openRegex) {
  const source = String(html || "");
  const open = source.match(openRegex);
  if (!open || open.index == null) return "";
  const start = open.index;
  const afterOpen = start + open[0].length;
  const tagRegex = /<\/?div\b[^>]*>/gi;
  tagRegex.lastIndex = afterOpen;
  let depth = 1;
  let tag;
  while ((tag = tagRegex.exec(source))) {
    if (tag[0].startsWith("</")) depth -= 1;
    else depth += 1;
    if (depth === 0) return source.slice(afterOpen, tag.index);
  }
  return "";
}

function stripTags(value) {
  return String(value || "").replace(/<[^>]+>/g, "");
}

function decode(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function readJson(file) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    return null;
  }
}

function samePosts(a, b) {
  return JSON.stringify(Array.isArray(a) ? a : []) === JSON.stringify(Array.isArray(b) ? b : []);
}

function buildStaticBlogPostsModule(posts) {
  const sitemapPosts = posts
    .filter((post) => post.status === "published")
    .map((post) => ({
      slug: post.slug,
      url: post.url,
      date: normalizeDate(post.date),
    }))
    .filter((post) => post.slug && /^\/blog\/[^/]+\/$/.test(post.url));

  return `// Generated by scripts/generate-blog-admin-manifest.mjs. Do not edit by hand.\n` +
    `export const staticBlogSitemapPosts = ${JSON.stringify(sitemapPosts, null, 2)};\n`;
}

function buildStaticBlogSocialPostsModule(posts) {
  const socialPosts = posts
    .map((post) => ({
      slug: post.slug,
      eyecatch: post.eyecatch || "",
      socialImage: post.socialImage || post.eyecatch || "",
    }))
    .filter((post) => post.slug && (post.eyecatch || post.socialImage));

  return `// Generated by scripts/generate-blog-admin-manifest.mjs. Do not edit by hand.\n` +
    `export const staticBlogSocialPosts = ${JSON.stringify(socialPosts, null, 2)};\n`;
}

function normalizeDate(value) {
  const text = String(value || "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : new Date().toISOString().slice(0, 10);
}
