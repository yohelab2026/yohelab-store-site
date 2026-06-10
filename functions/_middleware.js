import { buildRobotsTxt } from "./lib/site-seo.js";

const RETIRED_REDIRECTS = new Map([
  ["/index.html", "/"],
  ["/apps/wordpress-theme", "/"],
  ["/apps/wordpress-theme/", "/"],
  ["/apps/bunsirube", "/"],
  ["/apps/bunsirube/", "/"],
  ["/lp/wordpress-theme", "/"],
  ["/lp/wordpress-theme/", "/"],
  ["/lp/bunsirube", "/"],
  ["/lp/bunsirube/", "/"],
  ["/products/bunsirube", "/"],
  ["/products/bunsirube/", "/"],
  ["/products/wordpress-theme-beta", "/"],
  ["/products/wordpress-theme-beta/", "/"],
  ["/products/radar-beta", "/"],
  ["/products/radar-beta/", "/"],
  ["/products/article-starter-kit", "/apps/research-writer/"],
  ["/products/article-starter-kit/", "/apps/research-writer/"],
  ["/tools", "/blog/"],
  ["/tools/", "/blog/"],
  ["/services", "/contact/"],
  ["/services/", "/contact/"],
  ["/contact/bug", "/contact/"],
  ["/contact/bug/", "/contact/"],
  ["/affiliate/dashboard", "/contact/"],
  ["/affiliate/dashboard/", "/contact/"],
  ["/legal/affiliate-terms", "/legal/terms/"],
  ["/legal/affiliate-terms/", "/legal/terms/"],
  ["/en", "/"],
  ["/en/", "/"],
  ["/en/blog", "/blog/"],
  ["/en/blog/", "/blog/"],
  ["/blog/bunsirube-before-install", "/blog/"],
  ["/blog/bunsirube-before-install/", "/blog/"],
  ["/blog/free-theme-vs-bunsirube", "/blog/"],
  ["/blog/free-theme-vs-bunsirube/", "/blog/"],
  ["/blog/bunsirube-version-history", "/blog/"],
  ["/blog/bunsirube-version-history/", "/blog/"],
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

export async function onRequest(context) {
  const url = new URL(context.request.url);

  if (url.pathname === "/robots.txt") {
    return new Response(buildRobotsTxt(), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=300, s-maxage=300",
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
