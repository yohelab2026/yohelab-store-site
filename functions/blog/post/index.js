/**
 * /blog/post/?slug=xxx を個別記事URLへリダイレクトする Cloudflare Pages Function
 *
 * 静的HTMLでJS経由で取得していた記事メタデータを、サーバー側で先に埋めて返すことで
 * Googlebot・Bingbot・AIクローラー・SNSプレビューに正しいタイトル・description・OG・
 * JSON-LD・本文を瞬時に渡せるようになる。
 *
 * 失敗時は context.next() で従来の静的HTMLにフォールバック。
 */

const SITE_ORIGIN = "https://yohelab.com";
const SITE_NAME = "よへラボ";
const BLOG_NAME = "よへラボブログ";
const FALLBACK_IMAGE = `${SITE_ORIGIN}/yohelab-mascot-v2-20260518.png`;
const RESERVED_BLOG_SLUGS = new Set(["admin", "post", "category", "tag"]);
const STATIC_POST_REDIRECTS = new Map([
  ["ai-news-selling-ideas", "/blog/ai-news-selling-ideas/"],
  ["home-work-rhythm", "/blog/home-work-rhythm/"],
  ["bunsirube-version-history", "/blog/bunsirube-version-history/"],
  ["comparison-article-template", "/blog/comparison-article-template/"],
  ["free-theme-vs-bunsirube", "/blog/free-theme-vs-bunsirube/"],
  ["faq-source-ai-search", "/blog/faq-source-ai-search/"],
  ["sales-page-common-mistakes", "/blog/sales-page-common-mistakes/"],
  ["bunsirube-before-install", "/blog/bunsirube-before-install/"],
]);

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const slug = url.searchParams.get("slug") || "";

  // slug がなければブログ一覧へリダイレクト
  if (!slug) {
    return Response.redirect(new URL("/blog/", url.origin).toString(), 302);
  }

  return renderBlogPost(context, slug, url, { redirectToPretty: true });
}

export async function renderBlogPost(context, slug, requestUrl = new URL(context.request.url), options = {}) {
  const cleanSlug = String(slug || "").trim();
  if (!cleanSlug || isReservedBlogSlug(cleanSlug)) {
    return context.next();
  }

  const cleanStaticPath = cleanStaticSlugPath(cleanSlug);
  if (cleanStaticPath) {
    const staticUrl = new URL(cleanStaticPath, requestUrl.origin);
    if (samePath(requestUrl.pathname, staticUrl.pathname)) {
      return context.next();
    }
    return Response.redirect(staticUrl.toString(), 301);
  }

  const kv = context.env.BLOG_KV;
  if (!kv) {
    // KV 未設定なら静的HTMLにフォールバック
    return context.next();
  }

  let post;
  try {
    post = await kv.get(`post:${slug}`, { type: "json" });
  } catch (err) {
    return context.next();
  }

  if (!post) {
    // 見つからない時は静的HTMLや既存404にフォールバック。
    return context.next();
  }

  if (options.redirectToPretty) {
    return Response.redirect(new URL(prettyPostPath(cleanSlug), requestUrl.origin).toString(), 301);
  }

  const html = renderPostHTML(post, cleanSlug);

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Cloudflare CDNで5分間キャッシュ。記事更新時は手動でPurge推奨
      "Cache-Control": "public, max-age=60, s-maxage=300",
      "X-Robots-Tag": "index,follow,max-image-preview:large,max-snippet:-1",
    },
  });
}

export function prettyPostPath(slug) {
  return `/blog/${encodeURIComponent(String(slug || "").trim())}/`;
}

export function prettyPostUrl(slug) {
  return `${SITE_ORIGIN}${prettyPostPath(slug)}`;
}

export function isReservedBlogSlug(slug) {
  return RESERVED_BLOG_SLUGS.has(String(slug || "").trim().toLowerCase());
}

function samePath(a, b) {
  return String(a || "").replace(/\/+$/, "") === String(b || "").replace(/\/+$/, "");
}

function cleanStaticSlugPath(slug) {
  const direct = STATIC_POST_REDIRECTS.get(slug);
  if (direct) return direct;
  const withoutDate = String(slug).replace(/^\d{4}-\d{2}-\d{2}-/, "");
  return STATIC_POST_REDIRECTS.get(withoutDate) || "";
}

function escHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escAttr(value) {
  return escHtml(value);
}

function escJsonString(value) {
  // JSON-LD内に埋め込む文字列。ダブルクォート・バックスラッシュ・改行をエスケープ
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "")
    .replace(/\t/g, "\\t")
    .replace(/<\/script/gi, "<\\/script");
}

function sanitizeBodyHtml(html) {
  // 管理画面からの投稿でも、公開HTMLに出す前に危険なタグと属性は落とす。
  return enhanceArticleImages(String(html || "")
    .replace(/<\s*(script|style|iframe|object|embed|form|input|button|select|textarea|meta|link|base|svg|math)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|style|iframe|object|embed|form|input|button|select|textarea|meta|link|base|svg|math)\b[^>]*\/?>/gi, "")
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, "")
    .replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, "")
    .replace(/\s(srcdoc|formaction)\s*=\s*"[^"]*"/gi, "")
    .replace(/\s(srcdoc|formaction)\s*=\s*'[^']*'/gi, "")
    .replace(/\s(srcdoc|formaction)\s*=\s*[^\s>]+/gi, "")
    .replace(/(href|src)\s*=\s*(['"]?)\s*(javascript:|data:text\/html|vbscript:)[^'"\s>]*/gi, '$1="#"')
    .replace(/<\/script/gi, "<\\/script"));
}

function enhanceArticleImages(html) {
  return html.replace(/<img\b([^>]*)>/gi, (match, attrs) => {
    let next = attrs;
    if (!/\salt\s*=/.test(next)) next += ' alt="記事内画像"';
    if (!/\sloading\s*=/.test(next)) next += ' loading="lazy"';
    if (!/\sdecoding\s*=/.test(next)) next += ' decoding="async"';
    if (!/\sstyle\s*=/.test(next)) next += ' style="max-width:100%;height:auto;border-radius:12px;margin:24px 0;display:block;"';
    return `<img${next}>`;
  });
}

function bodyToHtml(post) {
  if (post.bodyHtml && post.bodyHtml.trim()) {
    return sanitizeBodyHtml(post.bodyHtml);
  }
  if (post.body && post.body.trim()) {
    return String(post.body)
      .split(/\n\n+/)
      .map((p) => `<p>${escHtml(p.trim())}</p>`)
      .join("");
  }
  return "<p>本文がまだありません。</p>";
}

function plainExcerpt(post, max = 160) {
  if (post.excerpt && post.excerpt.trim()) return post.excerpt.trim().slice(0, max);
  const text = (post.bodyHtml || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text) return text.slice(0, max);
  return `${post.title || "記事"} | ${BLOG_NAME}`;
}

function buildJsonLd(post, slug, fullUrl) {
  const title = post.title || "記事";
  const description = plainExcerpt(post, 200);
  const datePublished = post.date || new Date().toISOString().slice(0, 10);
  const eyecatch = post.eyecatch ? absoluteUrl(post.eyecatch) : FALLBACK_IMAGE;

  const article = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description,
    image: eyecatch,
    datePublished,
    dateModified: datePublished,
    author: { "@type": "Organization", name: SITE_NAME, url: SITE_ORIGIN },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: FALLBACK_IMAGE },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": fullUrl },
    url: fullUrl,
    inLanguage: "ja-JP",
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "ホーム", item: `${SITE_ORIGIN}/` },
      { "@type": "ListItem", position: 2, name: "ブログ", item: `${SITE_ORIGIN}/blog/` },
      { "@type": "ListItem", position: 3, name: title, item: fullUrl },
    ],
  };

  return [JSON.stringify(article), JSON.stringify(breadcrumb)];
}

function absoluteUrl(value) {
  if (!value) return FALLBACK_IMAGE;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("/")) return `${SITE_ORIGIN}${value}`;
  return `${SITE_ORIGIN}/${value}`;
}

function normalizeCoverSettings(value) {
  const input = typeof value === "object" && value ? value : {};
  return {
    fit: input.fit === "contain" ? "contain" : "cover",
    x: clampNumber(input.x, 0, 100, 50),
    y: clampNumber(input.y, 0, 100, 50),
    zoom: clampNumber(input.zoom, 100, 160, 100),
  };
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.round(number)));
}

function coverImageStyle(post) {
  const cover = normalizeCoverSettings(post.cover);
  return [
    `object-fit:${cover.fit}`,
    `object-position:${cover.x}% ${cover.y}%`,
    `transform:scale(${cover.zoom / 100})`,
    `transform-origin:${cover.x}% ${cover.y}%`,
  ].join(";");
}

function renderTags(tags) {
  if (!Array.isArray(tags) || !tags.length) return "";
  return tags
    .slice(0, 8)
    .map((t) => `<span class="post-tag">${escHtml(t)}</span>`)
    .join("");
}

function renderBlogHeader() {
  return `<header class="site-header" style="background:#fff;border-bottom:3px solid #0b8f72;position:sticky;top:0;z-index:100;">
    <div class="header-inner" style="max-width:1100px;margin:0 auto;padding:0 16px;display:flex;align-items:center;gap:20px;height:56px;">
      <a href="/" style="display:flex;align-items:center;gap:10px;font-size:20px;font-weight:900;color:#0b8f72;letter-spacing:-0.03em;flex-shrink:0;text-decoration:none;">
        <img src="/yohelab-mascot-v2-20260518.webp" alt="よへラボ" style="width:36px;height:36px;border-radius:8px;" />
        よへラボ
      </a>
      <nav style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;">
        <a href="/blog/" style="padding:5px 11px;border-radius:4px;font-size:13px;font-weight:700;color:#444;text-decoration:none;">ブログ</a>
        <a href="/lp/bunsirube/" style="padding:5px 11px;border-radius:4px;font-size:13px;font-weight:700;color:#444;text-decoration:none;">文標</a>
        <a href="/about/" style="padding:5px 11px;border-radius:4px;font-size:13px;font-weight:700;color:#444;text-decoration:none;">サイトについて</a>
      </nav>
    </div>
  </header>`;
}

function renderPostHTML(post, slug) {
  const title = post.title || "無題の記事";
  const description = plainExcerpt(post, 160);
  const date = post.date || new Date().toISOString().slice(0, 10);
  const eyecatchAbs = post.eyecatch ? absoluteUrl(post.eyecatch) : FALLBACK_IMAGE;
  const eyecatchAttr = post.eyecatch ? escAttr(post.eyecatch) : "";
  const tagsHtml = renderTags(post.tags);
  const bodyHtml = bodyToHtml(post);
  const fullUrl = prettyPostUrl(slug);
  const [articleLd, breadcrumbLd] = buildJsonLd(post, slug, fullUrl);
  const twitterShare = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    title,
  )}&url=${encodeURIComponent(fullUrl)}`;

  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escHtml(title)} | ${escHtml(BLOG_NAME)}</title>
  <meta name="description" content="${escAttr(description)}" />
  <meta name="author" content="${escAttr(SITE_NAME)}" />
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1" />
  <link rel="canonical" href="${escAttr(fullUrl)}" />
  <link rel="alternate" hreflang="ja" href="${escAttr(fullUrl)}" />
  <link rel="alternate" hreflang="x-default" href="${escAttr(fullUrl)}" />
  <link rel="alternate" type="application/rss+xml" title="よへラボ RSS" href="${SITE_ORIGIN}/feed.xml" />
  <meta property="og:title" content="${escAttr(title)} | ${escAttr(BLOG_NAME)}" />
  <meta property="og:description" content="${escAttr(description)}" />
  <meta property="og:type" content="article" />
  <meta property="og:locale" content="ja_JP" />
  <meta property="og:url" content="${escAttr(fullUrl)}" />
  <meta property="og:image" content="${escAttr(eyecatchAbs)}" />
  <meta property="article:published_time" content="${escAttr(date)}T00:00:00+09:00" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escAttr(title)}" />
  <meta name="twitter:description" content="${escAttr(description)}" />
  <meta name="twitter:image" content="${escAttr(eyecatchAbs)}" />
  <meta name="twitter:site" content="@yohe_lab" />
  <meta name="twitter:creator" content="@yohe_lab" />
  <link rel="icon" type="image/png" href="/yohelab-mascot-v2-20260518-32.png" />
  <link rel="stylesheet" href="/shared/site.min.css" />
  <script type="application/ld+json">${articleLd}</script>
  <script type="application/ld+json">${breadcrumbLd}</script>
  <script async src="/shared/matomo-loader.js"></script>
  <script defer src="/shared/back-to-top.js"></script>
  <style>
    body { background:#fff;color:var(--text); }
    .post-outer { max-width:760px;margin:0 auto;padding:48px 24px 100px; }
    .post-hero { border-radius:28px;padding:32px;margin-bottom:30px;background:linear-gradient(135deg,#ecfdf5,#eef6ff);border:1px solid #dce7fb;box-shadow:var(--shadow-sm); }
    .post-hero-kicker { display:inline-flex;padding:7px 12px;border-radius:999px;background:#0b8f72;color:#fff;font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;margin-bottom:18px; }
    .post-meta { display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:13px;color:var(--muted);margin-bottom:18px; }
    .post-tag { background:#f0f8f4;color:var(--green-dark,#075c4c);border-radius:999px;padding:3px 12px;font-size:12px;font-weight:700;text-decoration:none; }
    .post-title { font-size:clamp(30px,5.6vw,54px);font-weight:900;line-height:1.12;margin:0;color:var(--text);letter-spacing:-.055em; }
    .post-excerpt { font-size:18px;color:var(--muted);line-height:1.85;margin:22px 0 0; }
    .post-body { font-size:17px; line-height:2; color:var(--text); }
    .post-body h2 { font-size: clamp(20px,3.5vw,26px); font-weight:900; margin:44px 0 16px; letter-spacing:-.03em; padding-bottom:10px; border-bottom:2px solid var(--border); }
    .post-body h3 { font-size: clamp(17px,3vw,21px); font-weight:800; margin:32px 0 12px; }
    .post-body p { margin-bottom:20px; }
    .post-body ul, .post-body ol { padding-left:26px; margin-bottom:20px; }
    .post-body li { margin-bottom:8px; line-height:1.85; }
    .post-body blockquote { border-left:4px solid var(--green); padding:14px 20px; background:#f0f8f4; border-radius:0 12px 12px 0; margin:24px 0; color:var(--muted); font-size:16px; }
    .post-body img { max-width:100%; height:auto; border-radius:12px; margin:24px 0; display:block; }
    .post-body a { color:var(--green); text-decoration:underline; }
    .post-footer { margin-top:56px; padding-top:28px; border-top:1px solid var(--border); }
    .post-footer-inner { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:16px; }
    .back-link { display:inline-flex; align-items:center; gap:6px; color:var(--muted); font-size:14px; font-weight:700; text-decoration:none; transition:color .2s; }
    .back-link:hover { color:var(--green); }
    .share-btn { display:inline-flex; align-items:center; gap:6px; background:#1d9bf0; color:#fff; border:none; border-radius:999px; padding:8px 18px; font-size:13px; font-weight:700; cursor:pointer; text-decoration:none; }
    .related { margin-top:48px; padding:24px; background:#f6fbf8; border-radius:18px; border:1px solid var(--border); }
    .related p { font-size:13px; font-weight:700; color:var(--muted); margin-bottom:14px; }
    .related-links { display:flex; flex-wrap:wrap; gap:10px; }
    .related-links a { padding:8px 16px; background:#fff; border:1px solid var(--border); border-radius:999px; font-size:13px; font-weight:700; color:var(--text); text-decoration:none; transition:border-color .2s; }
    .related-links a:hover { border-color:var(--green); color:var(--green); }
    @media (max-width:600px) {
      .header-inner { flex-wrap:wrap; height:auto !important; padding-top:8px !important; padding-bottom:8px !important; }
      .header-inner > nav { order:3; width:100%; }
      .post-outer { padding:32px 18px 80px; }
      .post-hero { padding:24px 20px;border-radius:22px; }
    }
  </style>
</head>
<body>
  ${renderBlogHeader()}

  <main class="post-outer" id="post-outer">
    <article>
      <section class="post-hero">
        <span class="post-hero-kicker">Article</span>
        <div class="post-meta">
          <span>${escHtml(date)}</span>
          ${tagsHtml}
        </div>
        <h1 class="post-title">${escHtml(title)}</h1>
        ${post.excerpt ? `<p class="post-excerpt">${escHtml(post.excerpt)}</p>` : ""}
      </section>
      <div class="post-body">${bodyHtml}</div>
      <div class="post-footer">
        <div class="post-footer-inner">
          <a class="back-link" href="/blog/">← 記事一覧に戻る</a>
          <a class="share-btn" href="${escAttr(twitterShare)}" target="_blank" rel="noreferrer">𝕏 シェア</a>
        </div>
      </div>
      <div class="related">
        <p>よへラボのツール</p>
        <div class="related-links">
          <a href="/lp/research-writer/">3キーワードの記事メーカー</a>
          <a href="/lp/bunsirube/">文標（ぶんしるべ）</a>
          <a href="/blog/">ブログ一覧</a>
        </div>
      </div>
    </article>
  </main>

  <footer class="footer">
    <div class="footer-inner">
      <div>© よへラボ / よへラボブログ</div>
      <div class="footer-links">
        <a href="/blog/">記事一覧</a>
        <a href="/lp/research-writer/">記事メーカー</a>
        <a href="/lp/bunsirube/">WPテーマ</a>
      </div>
    </div>
  </footer>
</body>
</html>`;
}
