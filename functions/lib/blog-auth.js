export function getBlogPin(env) {
  return String(env.BLOG_PIN || "").trim();
}

export function getRequestPin(request) {
  return String(
    request.headers.get("x-yohelab-pin") ||
    "",
  ).trim();
}

export function isValidPin(pin) {
  return /^\d{4}$/.test(String(pin || ""));
}

export function timingSafeEqual(a, b) {
  const left = String(a || "");
  const right = String(b || "");
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) {
    diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }
  return diff === 0;
}

export function encodeBase64Utf8(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
