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
]);

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const target = RETIRED_REDIRECTS.get(url.pathname);

  if (target) {
    return Response.redirect(new URL(target, url.origin), 301);
  }

  return context.next();
}
