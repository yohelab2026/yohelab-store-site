export async function onRequestGet(context) {
  const kv = context.env.BLOG_KV;
  if (!kv) return json({ error: "BLOG_KV is not configured" }, 500);

  const slug = new URL(context.request.url).searchParams.get("slug") || "";
  if (!slug) return json({ error: "slug required" }, 400);

  const value = await kv.get(`post:${slug}`, { type: "json" });
  if (!value) return json({ error: "not found" }, 404);

  return json({ post: value });
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=60, s-maxage=300",
      "X-Robots-Tag": "noindex, follow",
    },
  });
}
