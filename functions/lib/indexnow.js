const SITE_ORIGIN = "https://yohelab.com";
const SITE_HOST = "yohelab.com";
export const INDEXNOW_KEY = "6d3c0f4a4e99441ab8e58f8ce6a8c5d9";
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

export function absoluteSiteUrl(pathOrUrl) {
  try {
    const url = new URL(String(pathOrUrl || ""), SITE_ORIGIN);
    if (url.hostname !== SITE_HOST) return "";
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

  const response = await fetch(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: SITE_HOST,
      key: INDEXNOW_KEY,
      keyLocation: `${SITE_ORIGIN}/${INDEXNOW_KEY}.txt`,
      urlList,
    }),
  });

  return {
    ok: response.ok,
    status: response.status,
    submitted: urlList.length,
  };
}
