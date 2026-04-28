export async function onRequestPost(context) {
  try {
    const kv = context.env.BLOG_KV;
    if (!kv) return json({ error: "BLOG_KV is not configured" }, 500);

    const requestPin = String(
      context.request.headers.get("x-yohelab-pin") ||
      context.request.headers.get("x-yohelab-password") ||
      "",
    ).trim();

    if (!requestPin || !/^\d{4}$/.test(requestPin)) {
      return json({ error: "unauthorized" }, 401);
    }

    // KVに保存済みPINがあれば照合、なければ初回セットアップとして保存
    const storedPin = await kv.get("config:pin");
    if (storedPin) {
      if (requestPin !== storedPin) return json({ error: "unauthorized" }, 401);
    } else {
      // 初回: このPINをマスターPINとして保存
      await kv.put("config:pin", requestPin);
    }

    const body = await readJsonBody(context.request);

    const title = sanitizeText(body?.title);
    const slugRaw = sanitizeSlug(body?.slug || body?.title);
    const excerpt = sanitizeText(body?.excerpt);
    const bodyHtml = String(body?.bodyHtml || "").trim();
    const date = sanitizeDate(body?.date) || new Date().toISOString().slice(0, 10);
    const tags = normalizeTags(body?.tags);
    const eyecatch = sanitizeUrl(body?.eyecatch);

    if (!title || !slugRaw) {
      return json({ error: "title_required" }, 400);
    }

    // slug に日付プレフィックスを付けてユニークにする
    const slug = `${date}-${slugRaw}`;

    const post = { title, slug: slugRaw, date, excerpt, bodyHtml, tags };
    if (eyecatch) post.eyecatch = eyecatch;

    await kv.put(`post:${slug}`, JSON.stringify(post), {
      metadata: { title, date, excerpt, slug: slugRaw, eyecatch: eyecatch || "" },
    });

    return json({ ok: true, slug, post });
  } catch (error) {
    return json({ error: error?.message || "unexpected_error" }, 500);
  }
}

export async function onRequestDelete(context) {
  try {
    const kv = context.env.BLOG_KV;
    if (!kv) return json({ error: "BLOG_KV is not configured" }, 500);

    const requestPin = String(
      context.request.headers.get("x-yohelab-pin") || "",
    ).trim();
    const storedPin = await kv.get("config:pin");
    if (!storedPin || requestPin !== storedPin) return json({ error: "unauthorized" }, 401);
    if (!kv) return json({ error: "BLOG_KV is not configured" }, 500);

    const body = await readJsonBody(context.request);
    const slug = String(body?.slug || "").trim();
    if (!slug) return json({ error: "slug_required" }, 400);

    await kv.delete(`post:${slug}`);
    return json({ ok: true, slug });
  } catch (error) {
    return json({ error: error?.message || "unexpected_error" }, 500);
  }
}

// ── helpers ────────────────────────────────────────────────

function sanitizeText(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function sanitizeSlug(value) {
  const fallback = `post-${new Date().toISOString().slice(0, 10)}`;
  return (
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9ぁ-んァ-ヶ一-龠ー._-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || fallback
  );
}

function sanitizeDate(value) {
  const text = String(value || "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : "";
}

function sanitizeUrl(value) {
  const url = String(value || "").trim();
  if (!url) return "";
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" ? parsed.href : "";
  } catch {
    return "";
  }
}

function normalizeTags(value) {
  return Array.isArray(value)
    ? value.map((t) => sanitizeText(t)).filter(Boolean).slice(0, 10)
    : String(value || "")
        .split(/[\n,、]/)
        .map((t) => sanitizeText(t))
        .filter(Boolean)
        .slice(0, 10);
}

async function readJsonBody(request) {
  const text = await request.text();
  try { return text ? JSON.parse(text) : {}; } catch { return {}; }
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
