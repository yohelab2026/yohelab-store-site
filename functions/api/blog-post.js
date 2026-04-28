const GITHUB_API = "https://api.github.com";
const BLOG_DIR = "content/blog/posts";

export async function onRequestPost(context) {
  try {
    const body = await readJsonBody(context.request);
    const pin = String(
      context.env.BLOG_PIN ||
      context.env.BLOG_PASSWORD ||
      context.env.BLOG_ADMIN_TOKEN ||
      context.env.ACCESS_SECRET ||
      "1030",
    ).trim();
    const requestPin = String(
      context.request.headers.get("x-yohelab-pin") ||
      context.request.headers.get("x-yohelab-password") ||
      "",
    ).trim();

    if (!pin) return json({ error: "BLOG_PIN is not configured" }, 500);
    if (!requestPin || requestPin !== pin) return json({ error: "unauthorized" }, 401);

    const githubToken = String(context.env.GITHUB_TOKEN || "").trim();
    const repo = String(context.env.GITHUB_REPO || "yohelab2026/yohelab-store-site").trim();
    const branch = String(context.env.GITHUB_BLOG_BRANCH || "main").trim();

    if (!githubToken) return json({ error: "GITHUB_TOKEN is not configured" }, 500);

    const title = sanitizeText(body?.title);
    const slug = sanitizeSlug(body?.slug);
    const excerpt = sanitizeText(body?.excerpt);
    const html = String(body?.bodyHtml || body?.body || "").trim();
    const bodyText = htmlToMarkdown(html);
    const date = sanitizeDate(body?.date) || new Date().toISOString().slice(0, 10);
    const tags = normalizeTags(body?.tags);

    if (!title || !slug || !bodyText) {
      return json({ error: "title_slug_body_required" }, 400);
    }

    const post = {
      title,
      slug,
      date,
      excerpt,
      body: bodyText,
      tags,
    };

    const path = `${BLOG_DIR}/${date}-${slug}.json`;
    const content = `${JSON.stringify(post, null, 2)}\n`;
    const encoded = Buffer.from(content, "utf8").toString("base64");

    const existing = await githubRequest(repo, `/contents/${encodeURIComponent(path).replace(/%2F/g, "/")}?ref=${encodeURIComponent(branch)}`, {
      method: "GET",
      token: githubToken,
    }).catch((error) => (error?.status === 404 ? null : Promise.reject(error)));

    const putBody = {
      message: `Add blog post: ${title}`,
      content: encoded,
      branch,
    };
    if (existing?.sha) putBody.sha = existing.sha;

    const saved = await githubRequest(repo, `/contents/${encodeURIComponent(path).replace(/%2F/g, "/")}`, {
      method: "PUT",
      token: githubToken,
      body: putBody,
    });

    return json({
      ok: true,
      path,
      commit: saved?.commit?.sha || "",
      url: saved?.content?.html_url || "",
      post,
    });
  } catch (error) {
    return json({ error: error?.message || "unexpected_error" }, 500);
  }
}

async function githubRequest(repo, path, { method = "GET", token, body } = {}) {
  const response = await fetch(`${GITHUB_API}/repos/${repo}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "yohelab-blog-publisher",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    const error = new Error(`github_request_failed:${response.status}:${text}`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

function sanitizeText(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function sanitizeSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9ぁ-んァ-ヶ一-龠ー._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function sanitizeDate(value) {
  const text = String(value || "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : "";
}

function normalizeTags(value) {
  return Array.isArray(value)
    ? value.map((item) => sanitizeText(item)).filter(Boolean).slice(0, 10)
    : String(value || "")
        .split(/[\n,、]/)
        .map((item) => sanitizeText(item))
        .filter(Boolean)
        .slice(0, 10);
}

function htmlToMarkdown(html) {
  return String(html || "")
    .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i>(.*?)<\/i>/gi, '*$1*')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<div>/gi, '')
    .replace(/<\/div>/gi, '\n')
    .replace(/<p>/gi, '')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function readJsonBody(request) {
  const text = await request.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
