const RETIRED_REDIRECTS = new Map([
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
]);

const PROTECTED_THEME_ZIP = /^\/bunsirube(?:-child)?(?:-[0-9][0-9.]+)?\.zip$/i;

export async function onRequest(context) {
  const url = new URL(context.request.url);

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

  return context.next();
}
