import { staticBlogSitemapPosts } from "./generated/static-blog-posts.js";
import { SITE } from "./lib/site-seo.js";
const FEED_LIMIT = 50;

export async function onRequestGet(context) {
  const posts = await feedPosts(context.env);
  const lastBuildDate = formatRfc822(posts[0]?.updatedAt || posts[0]?.publishedAt || posts[0]?.date || new Date().toISOString());
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n` +
    `  <channel>\n` +
    `    <title>${xmlEscape(SITE.name)}</title>\n` +
    `    <link>${SITE.origin}/</link>\n` +
    `    <description>${xmlEscape(SITE.description)}</description>\n` +
    `    <language>ja</language>\n` +
    `    <lastBuildDate>${xmlEscape(lastBuildDate)}</lastBuildDate>\n` +
    `    <atom:link href="${SITE.feedUrl}" rel="self" type="application/rss+xml" />\n` +
    posts.slice(0, FEED_LIMIT).map(feedItemXml).join("") +
    `  </channel>\n` +
    `</rss>\n`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=60, s-maxage=120",
      "X-Robots-Tag": "index,follow",
    },
  });
}

async function feedPosts(env) {
  const dynamic = await dynamicPosts(env);
  const dynamicCanonicalSlugs = new Set(dynamic.map((post) => comparableSlug(post.slug)).filter(Boolean));
  const staticPosts = staticBlogSitemapPosts
    .filter((post) => post?.slug && !dynamicCanonicalSlugs.has(comparableSlug(post.slug)))
    .map((post) => ({
      slug: post.slug,
      title: post.title || "よへラボの記事",
      excerpt: post.excerpt || SITE.description,
      url: post.url,
      date: post.date,
      publishedAt: `${post.date}T00:00:00+09:00`,
      updatedAt: "",
    }));

  return [...dynamic, ...staticPosts].sort((a, b) => postTime(b) - postTime(a));
}

async function dynamicPosts(env) {
  const kv = env?.BLOG_KV;
  if (!kv) return [];

  const keys = [];
  let cursor;
  do {
    const list = await kv.list({ prefix: "post:", cursor, limit: 100 });
    keys.push(...(list.keys || []));
    cursor = list.list_complete ? undefined : list.cursor;
  } while (cursor);

  return keys.map((key) => {
    const slug = key.name.replace(/^post:/, "");
    return {
      slug,
      url: `/blog/${encodeURIComponent(slug)}/`,
      title: key.metadata?.title || "よへラボの記事",
      excerpt: key.metadata?.excerpt || SITE.description,
      date: key.metadata?.date || "",
      publishedAt: key.metadata?.publishedAt || key.metadata?.date || "",
      updatedAt: key.metadata?.updatedAt || "",
    };
  });
}

function feedItemXml(post) {
  const loc = absoluteUrl(post.url || `/blog/${encodeURIComponent(post.slug)}/`);
  const pubDate = formatRfc822(post.publishedAt || post.date);
  const updated = formatRfc822(post.updatedAt || post.publishedAt || post.date);
  return (
    `    <item>\n` +
    `      <title>${xmlEscape(post.title)}</title>\n` +
    `      <link>${xmlEscape(loc)}</link>\n` +
    `      <guid isPermaLink="true">${xmlEscape(loc)}</guid>\n` +
    `      <pubDate>${xmlEscape(pubDate)}</pubDate>\n` +
    `      <description>${xmlEscape(post.excerpt)}</description>\n` +
    `      <atom:updated>${xmlEscape(updated)}</atom:updated>\n` +
    `    </item>\n`
  );
}

function absoluteUrl(pathOrUrl) {
  try {
    return new URL(pathOrUrl, SITE.origin).href;
  } catch {
    return `${SITE.origin}/`;
  }
}

function postTime(post = {}) {
  const value = post.updatedAt || post.publishedAt || post.date || "";
  const time = new Date(value).getTime();
  if (!Number.isNaN(time)) return time;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(`${value}T00:00:00+09:00`).getTime();
  return 0;
}

function formatRfc822(value) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))
    ? new Date(`${value}T00:00:00+09:00`)
    : new Date(value || Date.now());
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;
  return safeDate.toUTCString();
}

function comparableSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^\/?blog\//, "")
    .replace(/\/$/, "")
    .replace(/^\d{4}-\d{2}-\d{2}-/, "");
}

function xmlEscape(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
