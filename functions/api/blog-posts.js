import { staticBlogSocialPosts } from "../generated/static-blog-social-posts.js";

const PAGE_SIZE = 20;

export async function onRequestGet(context) {
  try {
    const kv = context.env.BLOG_KV;
    if (!kv) return json({ error: "BLOG_KV is not configured" }, 500);

    const url = new URL(context.request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));

    const keys = await listPostKeys(kv);

    const allPosts = keys
      .map((key) => {
        const slug = key.name.replace(/^post:/, "");
        const sourceSlug = key.metadata?.sourceSlug || key.metadata?.slug || "";
        const meta = staticPostMetaFor({ slug, sourceSlug });
        const eyecatch = key.metadata?.eyecatch || meta?.eyecatch || "";
        const socialImage = eyecatch;
        return {
          slug,
          url: `/blog/${encodeURIComponent(slug)}/`,
          title: key.metadata?.title || "",
          date: key.metadata?.date || "",
          publishedAt: key.metadata?.publishedAt || "",
          actionAt: key.metadata?.publishedAt || key.metadata?.updatedAt || key.metadata?.date || "",
          updatedAt: key.metadata?.updatedAt || key.metadata?.date || "",
          excerpt: key.metadata?.excerpt || "",
          eyecatch,
          socialImage,
          tags: parseTags(key.metadata?.tags),
          sourceSlug,
          importedFrom: key.metadata?.importedFrom || "",
        };
      })
      .sort(compareByPublishedOrder);

    const total = allPosts.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const posts = allPosts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    return json({ posts, page: safePage, totalPages, total });
  } catch (error) {
    return json({ error: error?.message || "unexpected_error" }, 500);
  }
}

async function listPostKeys(kv) {
  const keys = [];
  let cursor;
  do {
    const list = await kv.list({ prefix: "post:", cursor });
    keys.push(...(list.keys || []));
    cursor = list.list_complete ? undefined : list.cursor;
  } while (cursor);
  return keys;
}

function parseTags(value) {
  return String(value || "")
    .split(/[\n,、]/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function compareByPublishedOrder(a, b) {
  const diff = sortTime(b) - sortTime(a);
  if (diff) return diff;
  return String(a.title || "").localeCompare(String(b.title || ""), "ja");
}

function sortTime(post = {}) {
  const value = String(post.publishedAt || post.actionAt || post.updatedAt || post.date || "").trim();
  if (!value) return 0;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(`${value}T00:00:00+09:00`).getTime();
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function staticPostMetaFor(post = {}) {
  const candidates = [
    post.sourceSlug,
    post.staticSlug,
    post.slug,
    String(post.slug || "").replace(/^\d{4}-\d{2}-\d{2}-/, ""),
  ].filter(Boolean);
  return staticBlogSocialPosts.find((item) => candidates.includes(item.slug)) || null;
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, follow",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
