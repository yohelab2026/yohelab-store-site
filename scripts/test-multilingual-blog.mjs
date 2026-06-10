import { renderBlogPost } from "../functions/blog/post/index.js";
import { onRequestGet as renderSitemap } from "../functions/sitemap.xml.js";

const slug = "2026-06-11-japanese-only-guide";
const posts = new Map([
  [slug, {
    title: "日本語記事だけで公開する確認メモ",
    slug,
    date: "2026-06-11",
    excerpt: "英語版を作らず、日本語記事として公開するための確認記事です。",
    bodyHtml: "<p>この記事は日本語ページとしてだけ公開します。</p>",
    locale: "en",
    translationSlug: "legacy-en-slug",
  }],
]);

const kv = {
  async get(key, options = {}) {
    const value = posts.get(String(key).replace(/^post:/, ""));
    if (!value) return null;
    return options.type === "json" ? structuredClone(value) : JSON.stringify(value);
  },
  async list({ prefix }) {
    if (prefix !== "post:") return { keys: [], list_complete: true };
    return {
      keys: [...posts.entries()].map(([postSlug, post]) => ({
        name: `post:${postSlug}`,
        metadata: {
          title: post.title,
          date: post.date,
          locale: post.locale,
          translationSlug: post.translationSlug,
        },
      })),
      list_complete: true,
    };
  },
};

function contextFor(url) {
  return {
    request: new Request(url),
    env: { BLOG_KV: kv },
    next: () => new Response("fallback", { status: 404 }),
  };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const response = await renderBlogPost(contextFor(`https://yohelab.com/blog/${slug}/`), slug, new URL(`https://yohelab.com/blog/${slug}/`), { locale: "en" });
const html = await response.text();
assert(response.status === 200, "Japanese-only article must render");
assert(html.includes('<html lang="ja">'), "Article must render with Japanese html lang");
assert(html.includes(`rel="canonical" href="https://yohelab.com/blog/${slug}/"`), "Canonical must use /blog/");
assert(!html.includes("/en/blog/"), "Article must not link to English blog routes");
assert(!html.includes('hreflang="en"'), "Article must not output English hreflang");
assert(html.includes('"inLanguage":"ja-JP"'), "BlogPosting JSON-LD must be Japanese");

const sitemapResponse = await renderSitemap({ env: { BLOG_KV: kv } });
const sitemap = await sitemapResponse.text();
assert(sitemap.includes(`https://yohelab.com/blog/${slug}/`), "Sitemap must include Japanese article URL");
assert(!sitemap.includes("/en/blog/"), "Sitemap must not include English article URLs");
assert(!sitemap.includes('hreflang="en"'), "Sitemap must not include English alternates");

console.log("Japanese-only blog routing and SEO checks passed.");
