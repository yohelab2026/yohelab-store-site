// Block WordPress-style probing (/wp-content/themes/*.zip etc.).
// We are not a WordPress site; these requests are scanners or pirates.
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
