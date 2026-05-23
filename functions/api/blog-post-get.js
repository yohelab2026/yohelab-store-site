import { staticBlogSocialPosts } from "../generated/static-blog-social-posts.js";

export async function onRequestGet(context) {
  const kv = context.env.BLOG_KV;
  if (!kv) return json({ error: "BLOG_KV is not configured" }, 500);

  const slug = new URL(context.request.url).searchParams.get("slug") || "";
  if (!slug) return json({ error: "slug required" }, 400);

  const value = await kv.get(`post:${slug}`, { type: "json" });
  if (!value) return json({ error: "not found" }, 404);

  return json({ post: hydrateStaticPostImages(value) });
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

function hydrateStaticPostImages(post = {}) {
  const meta = staticPostMetaFor(post);
  if (!meta) return post;
  const eyecatch = post.eyecatch || meta.eyecatch || "";
  const socialImage = post.socialImage || meta.socialImage || eyecatch || "";
  return { ...post, eyecatch, socialImage };
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, follow",
    },
  });
}
