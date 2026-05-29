import { getBlogPin, isValidPin, timingSafeEqual } from "../lib/blog-auth.js";
import { submitIndexNow } from "../lib/indexnow.js";

const DEFAULT_URLS = [
  "/",
  "/about/",
  "/blog/",
  "/lp/bunsirube/",
  "/lp/bunsirube/install/",
  "/lp/bunsirube/demo/",
  "/lp/bunsirube/updates/",
  "/products/bunsirube/",
  "/contact/",
  "/sitemap.xml",
  "/feed.xml",
  "/robots.txt",
];

export async function onRequestPost(context) {
  try {
    if (!isAllowedOrigin(context.request)) return json({ error: "forbidden_origin" }, 403, context.request);
    const authError = authorize(context);
    if (authError) return authError;

    const body = await readJsonBody(context.request);
    const urls = Array.isArray(body?.urls) && body.urls.length ? body.urls : DEFAULT_URLS;
    const result = await submitIndexNow(urls);
    return json({ ok: result.ok, ...result }, result.ok ? 200 : 502, context.request);
  } catch (error) {
    return json({ error: error?.message || "unexpected_error" }, 500, context.request);
  }
}

export async function onRequestOptions(context) {
  return new Response(null, { status: 204, headers: corsHeaders(context.request) });
}

function authorize(context) {
  const requestPin = String(context.request.headers.get("x-yohelab-pin") || "").trim();
  const storedPin = getBlogPin(context.env);
  if (!isValidPin(storedPin) || !isValidPin(requestPin) || !timingSafeEqual(requestPin, storedPin)) {
    return json({ error: "unauthorized" }, 401, context.request);
  }
  return null;
}

async function readJsonBody(request) {
  const text = await request.text();
  try { return text ? JSON.parse(text) : {}; } catch { return {}; }
}

function json(body, status = 200, request = null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
      ...corsHeaders(request),
    },
  });
}

function corsHeaders(request) {
  const origin = request?.headers?.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": allowedOrigin(origin),
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-yohelab-pin",
    Vary: "Origin",
  };
}

function isAllowedOrigin(request) {
  return Boolean(allowedOrigin(request.headers.get("Origin") || ""));
}

function allowedOrigin(origin) {
  if (!origin) return "https://yohelab.com";
  try {
    const { hostname, protocol } = new URL(origin);
    if (protocol !== "https:" && hostname !== "localhost" && hostname !== "127.0.0.1") return "";
    if (hostname === "yohelab.com" || hostname.endsWith(".yohelab.pages.dev") || hostname === "localhost" || hostname === "127.0.0.1") return origin;
  } catch {
    return "";
  }
  return "";
}
