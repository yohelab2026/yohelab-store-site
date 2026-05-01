import { yohelabIconBase64 } from "./generated/yohelab-icon.js";

function base64ToBytes(base64) {
  const binary = atob(base64);
  return Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
}

export async function onRequest() {
  return new Response(base64ToBytes(yohelabIconBase64), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
