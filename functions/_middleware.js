const legacyRedirects = new Map([
  [`/apps/${"proposal"}/`, "/apps/research-writer/"],
  [`/lp/${"proposal"}/`, "/lp/research-writer/"],
  [`/products/${"proposal"}-beta/`, "/products/research-writer-beta/"],
  [`/apps/${"rad"}${"ar"}/`, "/apps/research-writer/"],
  [`/lp/${"rad"}${"ar"}/`, "/lp/research-writer/"],
  [`/products/${"rad"}${"ar"}-beta/`, "/products/research-writer-beta/"],
  [`/apps/${"proposal"}-${"optimizer"}/`, "/apps/research-writer/"],
  [`/lp/${"proposal"}-${"optimizer"}/`, "/lp/research-writer/"],
  [`/products/${"proposal"}-${"optimizer"}-beta/`, "/products/research-writer-beta/"],
  [`/apps/${"article"}-${"polish"}/`, "/apps/research-writer/"],
  [`/lp/${"article"}-${"polish"}/`, "/lp/research-writer/"],
  [`/products/${"article"}-${"polish"}-beta/`, "/products/research-writer-beta/"],
]);

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const target = legacyRedirects.get(url.pathname);
  if (target) {
    url.pathname = target;
    return Response.redirect(url.toString(), 301);
  }

  return context.next();
}
