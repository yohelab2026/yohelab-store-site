export async function onRequestGet(context) {
  try {
    const kv = context.env.BLOG_KV;
    if (!kv) return json({ error: "BLOG_KV is not configured" }, 500);

    const list = await kv.list({ prefix: "post:" });

    // メタデータだけで一覧を返す（本文は含めない）
    const posts = list.keys
      .map((key) => ({
        slug: key.name.replace(/^post:/, ""),
        title: key.metadata?.title || "",
        date: key.metadata?.date || "",
        excerpt: key.metadata?.excerpt || "",
        eyecatch: key.metadata?.eyecatch || "",
        kvKey: key.name,
      }))
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));

    return json({ posts });
  } catch (error) {
    return json({ error: error?.message || "unexpected_error" }, 500);
  }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
