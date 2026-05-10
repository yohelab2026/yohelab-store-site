const PAGE_SIZE = 20;

export async function onRequestGet(context) {
  try {
    const kv = context.env.BLOG_KV;
    if (!kv) return json({ error: "BLOG_KV is not configured" }, 500);

    const url = new URL(context.request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));

    const list = await kv.list({ prefix: "post:" });

    const allPosts = list.keys
      .map((key) => ({
        slug: key.name.replace(/^post:/, ""),
        title: key.metadata?.title || "",
        date: key.metadata?.date || "",
        excerpt: key.metadata?.excerpt || "",
        eyecatch: key.metadata?.eyecatch || "",
      }))
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));

    const total = allPosts.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const posts = allPosts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    return json({ posts, page: safePage, totalPages, total });
  } catch (error) {
    return json({ error: error?.message || "unexpected_error" }, 500);
  }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=60, s-maxage=300",
      "X-Robots-Tag": "noindex, follow",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
