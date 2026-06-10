export const SITE = Object.freeze({
  origin: "https://yohelab.com",
  host: "yohelab.com",
  name: "よへラボ",
  blogName: "よへラボブログ",
  description: "AIニュース、記事構造、ブログ運営、売り場づくりのメモを整理する情報サイト。",
  homeDescription: "AIニュース、AI検索時代の記事構造、ブログ運営、売り場づくりのメモを日本語で整理するサイト。",
  twitterHandle: "@yohe_lab",
  ogImage: "https://yohelab.com/yohelab-mascot-v2-20260518.png",
  sitemapUrl: "https://yohelab.com/sitemap.xml",
  feedUrl: "https://yohelab.com/feed.xml",
  searchUrl: "https://yohelab.com/blog/?q={search_term_string}",
  indexableRobots: "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1",
  noindexRobots: "noindex, nofollow, noarchive",
  discoveryUrls: Object.freeze([
    "/",
    "/about/",
    "/blog/",
    "/contact/",
    "/sitemap.xml",
    "/feed.xml",
    "/robots.txt",
  ]),
});

export const ROBOTS_PRIVATE_PATHS = Object.freeze([
  "/blog/admin/",
  "/api/",
  "/pro/",
  "/games/",
]);

export const ROBOTS_USER_AGENTS = Object.freeze([
  "*",
  "GPTBot",
  "Claude-Web",
  "PerplexityBot",
  "Googlebot",
  "Bingbot",
  "DuckDuckBot",
  "Applebot",
  "YandexBot",
]);

export function siteUrl(pathOrUrl = "") {
  try {
    const url = new URL(String(pathOrUrl || ""), SITE.origin);
    if (url.hostname !== SITE.host) return "";
    url.hash = "";
    return url.href;
  } catch {
    return "";
  }
}

export function buildRobotsTxt() {
  const lines = [
    "# Public pages are open. Admin/API/private paths are blocked for every crawler.",
  ];

  for (const userAgent of ROBOTS_USER_AGENTS) {
    lines.push(`User-agent: ${userAgent}`);
    lines.push("Allow: /");
    for (const path of ROBOTS_PRIVATE_PATHS) {
      lines.push(`Disallow: ${path}`);
    }
    lines.push("");
  }

  lines.push(`Sitemap: ${SITE.sitemapUrl}`);
  lines.push(`Sitemap: ${SITE.feedUrl}`);
  lines.push("");
  return lines.join("\n");
}

export function buildHomeJsonLd() {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE.origin}/#organization`,
        name: SITE.name,
        alternateName: ["yohelab"],
        url: `${SITE.origin}/`,
        logo: {
          "@type": "ImageObject",
          url: `${SITE.origin}/yohelab-mascot-v2-20260518.png`,
          width: 1024,
          height: 1024,
        },
        sameAs: ["https://x.com/yohe_lab", "https://note.com/yohelab"],
      },
      {
        "@type": "WebSite",
        "@id": `${SITE.origin}/#website`,
        name: SITE.name,
        alternateName: ["yohelab"],
        url: `${SITE.origin}/`,
        description: SITE.homeDescription,
        publisher: { "@id": `${SITE.origin}/#organization` },
        inLanguage: "ja-JP",
        potentialAction: {
          "@type": "SearchAction",
          target: SITE.searchUrl,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${SITE.origin}/#breadcrumb`,
        itemListElement: [{ "@type": "ListItem", position: 1, name: "ホーム", item: `${SITE.origin}/` }],
      },
    ],
  });
}

export function buildBreadcrumbJsonLd(trail = []) {
  const items = Array.isArray(trail) ? trail.filter(Boolean) : [];
  const resolved = items.length ? items : [{ name: "ホーム", item: `${SITE.origin}/` }];
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: resolved.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: String(entry?.name || "").trim() || `項目${index + 1}`,
      item: siteUrl(entry?.item) || `${SITE.origin}/`,
    })),
  });
}
