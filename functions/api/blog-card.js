import { getBlogPin, getRequestPin, isValidPin, json, timingSafeEqual } from "../lib/blog-auth.js";

const MAX_HTML_CHARS = 220000;
const FETCH_TIMEOUT_MS = 6000;

export async function onRequestGet(context) {
  const authError = authorize(context);
  if (authError) return authError;

  const requestUrl = new URL(context.request.url);
  const target = normalizeTargetUrl(requestUrl.searchParams.get("url") || "");
  if (!target.ok) return json({ error: target.error || "invalid_url" }, 400);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    let response;
    try {
      response = await fetch(target.url, {
        redirect: "follow",
        signal: controller.signal,
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "User-Agent": "YoheLabBlogCard/1.0 (+https://yohelab.com/)",
        },
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) return json({ error: "fetch_failed", status: response.status }, 502);
    const contentType = response.headers.get("content-type") || "";
    if (contentType && !contentType.toLowerCase().includes("text/html")) {
      return json({ error: "not_html" }, 415);
    }

    const finalUrl = response.url || target.url;
    const html = (await response.text()).slice(0, MAX_HTML_CHARS);
    return json({ ok: true, card: extractCard(html, finalUrl) }, 200);
  } catch {
    return json({ error: "fetch_failed" }, 502);
  }
}

function authorize(context) {
  const configuredPin = getBlogPin(context.env);
  const requestPin = getRequestPin(context.request);
  if (!isValidPin(configuredPin)) return json({ error: "blog_pin_not_configured" }, 503);
  if (!isValidPin(requestPin)) return json({ error: "invalid_pin_format" }, 400);
  if (!timingSafeEqual(requestPin, configuredPin)) return json({ error: "unauthorized" }, 401);
  return null;
}

function normalizeTargetUrl(value) {
  let parsed;
  try {
    parsed = new URL(String(value || "").trim());
  } catch {
    return { ok: false, error: "invalid_url" };
  }

  if (!["http:", "https:"].includes(parsed.protocol)) return { ok: false, error: "unsupported_protocol" };
  if (isBlockedHost(parsed.hostname)) return { ok: false, error: "blocked_host" };
  parsed.hash = "";
  return { ok: true, url: parsed.toString() };
}

function isBlockedHost(hostname) {
  const host = String(hostname || "").toLowerCase().replace(/^\[|\]$/g, "");
  if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) return true;
  if (host === "0.0.0.0" || host.startsWith("127.") || host.startsWith("10.") || host.startsWith("192.168.")) return true;
  const ipv4 = host.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (ipv4) {
    const a = Number(ipv4[1]);
    const b = Number(ipv4[2]);
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 169 && b === 254) return true;
  }
  if (host === "::1" || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80:")) return true;
  return false;
}

function extractCard(html, baseUrl) {
  const title = firstMeta(html, ["og:title", "twitter:title"]) || tagText(html, "title") || baseUrl;
  const description = firstMeta(html, ["og:description", "twitter:description", "description"]);
  const siteName = firstMeta(html, ["og:site_name"]) || new URL(baseUrl).hostname.replace(/^www\./, "");
  const image = absoluteUrl(firstMeta(html, ["og:image", "og:image:secure_url", "twitter:image"]), baseUrl);
  return {
    url: baseUrl,
    title: cleanText(title).slice(0, 120),
    description: cleanText(description).slice(0, 160),
    siteName: cleanText(siteName).slice(0, 80),
    image,
  };
}

function firstMeta(html, names) {
  for (const name of names) {
    const escaped = escapeRegExp(name);
    const regexes = [
      new RegExp(`<meta\\b(?=[^>]*(?:property|name)=["']${escaped}["'])[^>]*content=["']([^"']*)["'][^>]*>`, "i"),
      new RegExp(`<meta\\b(?=[^>]*content=["']([^"']*)["'])[^>]*(?:property|name)=["']${escaped}["'][^>]*>`, "i"),
    ];
    for (const regex of regexes) {
      const found = html.match(regex);
      if (found?.[1]) return decodeHtml(found[1]);
    }
  }
  return "";
}

function tagText(html, tagName) {
  const found = html.match(new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i"));
  return found?.[1] ? decodeHtml(found[1].replace(/<[^>]+>/g, "")) : "";
}

function absoluteUrl(value, baseUrl) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    const parsed = new URL(raw, baseUrl);
    if (!["http:", "https:"].includes(parsed.protocol)) return "";
    if (isBlockedHost(parsed.hostname)) return "";
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return "";
  }
}

function cleanText(value) {
  return decodeHtml(value).replace(/\s+/g, " ").trim();
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .trim();
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
