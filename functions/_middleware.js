const RETIRED_REDIRECTS = new Map([
  ["/index.html", "/"],
  ["/apps/wordpress-theme", "/lp/bunsirube/"],
  ["/apps/wordpress-theme/", "/lp/bunsirube/"],
  ["/apps/bunsirube", "/lp/bunsirube/"],
  ["/apps/bunsirube/", "/lp/bunsirube/"],
  ["/lp/wordpress-theme", "/lp/bunsirube/"],
  ["/lp/wordpress-theme/", "/lp/bunsirube/"],
  ["/products/wordpress-theme-beta", "/products/bunsirube/"],
  ["/products/wordpress-theme-beta/", "/products/bunsirube/"],
  ["/products/radar-beta", "/lp/bunsirube/"],
  ["/products/radar-beta/", "/lp/bunsirube/"],
  ["/products/article-starter-kit", "/lp/research-writer/"],
  ["/products/article-starter-kit/", "/lp/research-writer/"],
  ["/tools", "/lp/bunsirube/"],
  ["/tools/", "/lp/bunsirube/"],
  ["/services", "/lp/bunsirube/demo/"],
  ["/services/", "/lp/bunsirube/demo/"],
  ["/blog/yohelab-blog-start", "/blog/"],
  ["/blog/yohelab-blog-start/", "/blog/"],
  ["/blog/starter-kit", "/blog/"],
  ["/blog/starter-kit/", "/blog/"],
  ["/blog/theme-note", "/blog/"],
  ["/blog/theme-note/", "/blog/"],
  ["/blog/home-work-rhythm", "/blog/"],
  ["/blog/home-work-rhythm/", "/blog/"],
  ["/blog/category/home-work", "/blog/"],
  ["/blog/category/home-work/", "/blog/"],
  ["/blog/tag/home-work", "/blog/"],
  ["/blog/tag/home-work/", "/blog/"],
]);

const PROTECTED_THEME_ZIP = /^\/bunsirube(?:-child)?(?:-[0-9][0-9.]+)?\.zip$/i;

const ROBOTS_TXT = `# Admin/API/private paths are blocked for every crawler.
User-agent: *
Allow: /
Disallow: /blog/admin/
Disallow: /api/
Disallow: /pro/
Disallow: /affiliate/dashboard/
Disallow: /games/

User-agent: GPTBot
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Googlebot
Allow: /

Sitemap: https://yohelab.com/sitemap.xml
`;

export async function onRequest(context) {
  const url = new URL(context.request.url);

  if (url.pathname === "/robots.txt") {
    return new Response(ROBOTS_TXT, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  if (PROTECTED_THEME_ZIP.test(url.pathname)) {
    return new Response("not found", {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  }

  const target = RETIRED_REDIRECTS.get(url.pathname);

  if (target) {
    return Response.redirect(new URL(target, url.origin), 301);
  }

  const taxonomyTarget = blogTaxonomyRedirect(url);
  if (taxonomyTarget) {
    return Response.redirect(taxonomyTarget, 301);
  }

  return context.next();
}

function blogTaxonomyRedirect(url) {
  const match = url.pathname.match(/^\/blog\/(category|tag)\/([^/]+)\/?$/);
  if (!match) return null;
  const nextUrl = new URL("/blog/", url.origin);
  nextUrl.searchParams.set(match[1] === "tag" ? "tag" : "category", decodeURIComponent(match[2]));
  return nextUrl;
}
