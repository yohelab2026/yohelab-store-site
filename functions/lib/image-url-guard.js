const verifiedImageUrlCache = new WeakMap();

export function normalizeBlogImageUrl(value) {
  return String(value || "").trim().replace(/(\/assets\/blog\/[\w./-]+)\.(?:png|jpe?g)(?=($|[?#]))/gi, "$1.webp");
}

export function normalizeBlogImageFormats(html) {
  return String(html || "").replace(/((?:src|href)\s*=\s*["'])(https:\/\/yohelab\.com)?(\/assets\/blog\/[\w./-]+)\.(?:png|jpe?g)(["'? #>])/gi, "$1$2$3.webp$4");
}

export function normalizePermittedImageUrl(value) {
  const normalized = normalizeBlogImageUrl(String(value || "").trim());
  return normalized && isPermittedImageUrl(normalized) ? normalized : "";
}

export async function sanitizeVerifiedImageUrl(context, value) {
  const normalized = normalizePermittedImageUrl(value);
  if (!normalized) return "";

  const cache = getVerifiedImageUrlCache(context);
  if (cache.has(normalized)) return cache.get(normalized);

  const resolved = normalized.startsWith("/") ? new URL(normalized, context.request.url).href : normalized;
  const verified = (await confirmImageUrlExists(resolved)) ? normalized : "";
  cache.set(normalized, verified);
  return verified;
}

export async function collectVerifiedImageUrls(context, html) {
  const urls = [];
  for (const match of String(html || "").matchAll(/<img\b[^>]*\bsrc=(["'])(.*?)\1/gi)) {
    const safe = await sanitizeVerifiedImageUrl(context, match[2]);
    if (safe) urls.push(safe);
  }
  return [...new Set(urls)].slice(0, 30);
}

export async function firstVerifiedImageUrl(context, html) {
  const urls = await collectVerifiedImageUrls(context, html);
  return urls[0] || "";
}

export function isStaticAssetImageUrl(url) {
  if (url.includes("..") || url.includes("\\")) return false;
  return /^(?:\/assets\/blog\/[\w./-]+\.webp|\/assets\/og\/[\w./-]+\.(?:png|jpe?g|webp)|\/blog-images\/[\w.-]+\.webp)$/i.test(url);
}

function isPermittedImageUrl(url) {
  if (!url) return false;
  if (url.startsWith("/api/blog-image?key=")) return isPermittedBlogImageApiUrl(url);
  if (url.startsWith("/assets/") || url.startsWith("/blog-images/")) return isStaticAssetImageUrl(url);

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    if (!isAllowedHostname(parsed.hostname)) return false;
    const sameOriginPath = `${parsed.pathname}${parsed.search}`;
    if (sameOriginPath.startsWith("/api/blog-image?key=")) return isPermittedBlogImageApiUrl(sameOriginPath);
    if (sameOriginPath.startsWith("/assets/") || sameOriginPath.startsWith("/blog-images/")) return isStaticAssetImageUrl(sameOriginPath);
    return /^\/[\w./-]+\.webp$/i.test(parsed.pathname);
  } catch {
    return false;
  }
}

function isPermittedBlogImageApiUrl(url) {
  try {
    const parsed = new URL(url, "https://yohelab.com");
    if (parsed.pathname !== "/api/blog-image") return false;
    const key = parsed.searchParams.get("key") || "";
    if (!key || key.includes("..") || key.includes("\\")) return false;
    return /^(?:blog-images\/)?[\w./-]+\.webp$/i.test(key);
  } catch {
    return false;
  }
}

function isAllowedHostname(hostname) {
  return (
    hostname === "yohelab.com" ||
    hostname.endsWith(".yohelab.pages.dev") ||
    hostname === "images.yohelab.com" ||
    hostname.endsWith(".r2.dev") ||
    hostname === "localhost" ||
    hostname === "127.0.0.1"
  );
}

async function confirmImageUrlExists(url) {
  try {
    let response = await fetch(url, { method: "HEAD", redirect: "follow" });
    if (!looksLikeImageResponse(response, url)) {
      if (response.status === 405 || response.status === 501) {
        response = await fetch(url, {
          method: "GET",
          redirect: "follow",
          headers: { Range: "bytes=0-0" },
        });
      }
    }
    return looksLikeImageResponse(response, url);
  } catch {
    return false;
  }
}

function looksLikeImageResponse(response, url) {
  if (!response || !response.ok) return false;
  const contentType = String(response.headers.get("content-type") || "").toLowerCase();
  if (contentType.startsWith("image/")) return true;
  return /\.(?:webp|png|jpe?g)(?:$|[?#])/i.test(url);
}

function getVerifiedImageUrlCache(context) {
  if (!context || typeof context !== "object") return new Map();
  let cache = verifiedImageUrlCache.get(context);
  if (!cache) {
    cache = new Map();
    verifiedImageUrlCache.set(context, cache);
  }
  return cache;
}
