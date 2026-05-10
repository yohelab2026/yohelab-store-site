// Block direct access to theme ZIPs and any /themes/* probing.
// Legitimate downloads go through /api/theme-download with a signed token.
export function onRequest() {
  return new Response("Not found", {
    status: 404,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
