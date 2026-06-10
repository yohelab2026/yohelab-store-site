import { SITE } from "./site-seo.js";
export const INDEXNOW_KEY = "6d3c0f4a4e99441ab8e58f8ce6a8c5d9";
const INDEXNOW_ENDPOINTS = [
  "https://api.indexnow.org/indexnow",
  "https://www.bing.com/indexnow",
];

export function absoluteSiteUrl(pathOrUrl) {
  try {
    const url = new URL(String(pathOrUrl || ""), SITE.origin);
    if (url.hostname !== SITE.host) return "";
    url.hash = "";
    return url.href;
  } catch {
    return "";
  }
}

export function notifyIndexNow(context, urls) {
  const task = submitIndexNow(urls).catch(() => null);
  if (typeof context?.waitUntil === "function") {
    context.waitUntil(task);
    return;
  }
  return task;
}

export async function submitIndexNow(urls) {
  const urlList = [...new Set((Array.isArray(urls) ? urls : [urls]).map(absoluteSiteUrl).filter(Boolean))].slice(0, 100);
  if (!urlList.length) return { ok: false, submitted: 0 };

  const payload = JSON.stringify({
    host: SITE.host,
    key: INDEXNOW_KEY,
    keyLocation: `${SITE.origin}/${INDEXNOW_KEY}.txt`,
    urlList,
  });

  const attempts = [];
  for (const endpoint of INDEXNOW_ENDPOINTS) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: payload,
    });
    attempts.push({ endpoint, ok: response.ok, status: response.status });
    if (response.ok) {
      return {
        ok: true,
        status: response.status,
        submitted: urlList.length,
        endpoint,
        attempts,
      };
    }
  }

  return {
    ok: false,
    status: attempts.at(-1)?.status || 0,
    submitted: urlList.length,
    attempts,
  };
}
