import { isReservedBlogSlug, renderBlogPost } from "../../blog/post/index.js";

export async function onRequest(context) {
  const url = new URL(context.request.url);
  let slug = "";
  try {
    slug = decodeURIComponent(url.pathname.replace(/^\/en\/blog\/+/, "").replace(/\/+$/, ""));
  } catch {
    return context.next();
  }

  if (!slug || slug.includes("/") || isReservedBlogSlug(slug)) {
    return context.next();
  }

  return renderBlogPost(context, slug, url, { locale: "en" });
}
