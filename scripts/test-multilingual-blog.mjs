import { renderBlogPost } from "../functions/blog/post/index.js";
import { onRequestGet as renderSitemap } from "../functions/sitemap.xml.js";

const jaSlug = "2026-06-10-multilingual-guide-ja";
const enSlug = "2026-06-10-multilingual-guide-en";
const selfSlug = "2026-06-10-self-translation";
const posts = new Map([
  [jaSlug, {
    title: "多言語ブログの作り方",
    slug: "multilingual-guide-ja",
    date: "2026-06-10",
    excerpt: "多言語ブログ運用の確認記事です。",
    bodyHtml: "<p>日本語の記事です。</p>",
    locale: "ja",
    translationSlug: enSlug,
  }],
  [enSlug, {
    title: "How to build a multilingual blog",
    slug: "multilingual-guide-en",
    date: "2026-06-10",
    excerpt: "A test article for multilingual publishing.",
    bodyHtml: "<p>This is the English article.</p>",
    locale: "en",
    translationSlug: jaSlug,
  }],
  [selfSlug, {
    title: "Self translation guard",
    slug: "self-translation",
    date: "2026-06-10",
    excerpt: "A test article that must not link to itself as a translation.",
    bodyHtml: "<p>This article must not create a self-referencing translation link.</p>",
    locale: "en",
    translationSlug: selfSlug,
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
      keys: [...posts.entries()].map(([slug, post]) => ({
        name: `post:${slug}`,
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

const enResponse = await renderBlogPost(contextFor(`https://yohelab.com/en/blog/${enSlug}/`), enSlug, new URL(`https://yohelab.com/en/blog/${enSlug}/`), { locale: "en" });
const enHtml = await enResponse.text();
assert(enResponse.status === 200, "English article must render");
assert(enHtml.includes('<html lang="en">'), "English article must set html lang");
assert(enHtml.includes(`rel="canonical" href="https://yohelab.com/en/blog/${enSlug}/"`), "English canonical must use /en/blog/");
assert(enHtml.includes(`hreflang="ja" href="https://yohelab.com/blog/${jaSlug}/"`), "English article must link to Japanese translation");
assert(enHtml.includes('"inLanguage":"en"'), "English BlogPosting JSON-LD must set inLanguage");
assert(enHtml.includes('content="en_US"'), "English article must set Open Graph locale");
assert(enHtml.includes('"url":"https://yohelab.com/en/blog/"'), "English BlogPosting JSON-LD must use the English blog URL");
assert(enHtml.includes('href="/en/blog/">Blog</a>'), "English article navigation must link to the English blog");

const jaResponse = await renderBlogPost(contextFor(`https://yohelab.com/blog/${jaSlug}/`), jaSlug, new URL(`https://yohelab.com/blog/${jaSlug}/`), { locale: "ja" });
const jaHtml = await jaResponse.text();
assert(jaResponse.status === 200, "Japanese article must render");
assert(jaHtml.includes(`hreflang="en" href="https://yohelab.com/en/blog/${enSlug}/"`), "Japanese article must link to English translation");
assert(jaHtml.includes('"inLanguage":"ja-JP"'), "Japanese BlogPosting JSON-LD must set inLanguage");

const wrongLocaleResponse = await renderBlogPost(contextFor(`https://yohelab.com/blog/${enSlug}/`), enSlug, new URL(`https://yohelab.com/blog/${enSlug}/`), { locale: "ja" });
assert(wrongLocaleResponse.status === 301, "Wrong-locale article URL must redirect permanently");
assert(wrongLocaleResponse.headers.get("location") === `https://yohelab.com/en/blog/${enSlug}/`, "Wrong-locale redirect must target the English canonical");

const selfResponse = await renderBlogPost(contextFor(`https://yohelab.com/en/blog/${selfSlug}/`), selfSlug, new URL(`https://yohelab.com/en/blog/${selfSlug}/`), { locale: "en" });
const selfHtml = await selfResponse.text();
assert(selfResponse.status === 200, "Self-referencing translation article must still render");
assert(!selfHtml.includes("Read in English"), "An article must not link to itself as a translation");

const sitemapResponse = await renderSitemap({ env: { BLOG_KV: kv } });
const sitemap = await sitemapResponse.text();
assert(sitemap.includes('xmlns:xhtml="http://www.w3.org/1999/xhtml"'), "Sitemap must declare xhtml namespace");
assert(sitemap.includes(`https://yohelab.com/en/blog/${enSlug}/`), "Sitemap must include English article");
assert(sitemap.includes(`hreflang="ja" href="https://yohelab.com/blog/${jaSlug}/"`), "Sitemap must include Japanese alternate");
assert(sitemap.includes(`hreflang="en" href="https://yohelab.com/en/blog/${enSlug}/"`), "Sitemap must include English alternate");

console.log("Multilingual blog routing and SEO checks passed.");
