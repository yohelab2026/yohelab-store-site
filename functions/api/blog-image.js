/**
 * GET  /api/blog-image?key=xxx  → 画像を返す
 * POST /api/blog-image           → 画像をアップロードして URL を返す（PIN認証必須）
 */

import { getBlogPin, isValidPin, timingSafeEqual } from "../lib/blog-auth.js";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 25 * 1024 * 1024; // 25MB
const DEFAULT_PUBLIC_IMAGE_BASE = "https://images.yohelab.com";

export async function onRequestGet(context) {
  const storage = getImageStorage(context.env);
  if (!storage) return new Response("Not configured", { status: 500 });

  const key = new URL(context.request.url).searchParams.get("key") || "";
  if (!key) return new Response("Not found", { status: 404 });

  const entry = await readImage(storage, key);
  if (!entry) return new Response("Not found", { status: 404 });

  const contentType = entry.contentType || "image/jpeg";
  return new Response(entry.body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

export async function onRequestPost(context) {
  if (!isAllowedOrigin(context.request)) {
    return json({ error: "forbidden_origin" }, 403, context.request);
  }

  const storage = getImageStorage(context.env);
  if (!storage) return json({ error: "BLOG_IMAGES or BLOG_KV is not configured" }, 500, context.request);

  // PIN 認証
  const requestPin = String(
    context.request.headers.get("x-yohelab-pin") || "",
  ).trim();
  const storedPin = getBlogPin(context.env);
  if (!isValidPin(requestPin) || !timingSafeEqual(requestPin, storedPin)) {
    return json({ error: "unauthorized" }, 401, context.request);
  }

  const contentType = context.request.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return json({ error: "multipart required" }, 400, context.request);
  }

  const formData = await context.request.formData();
  const file = formData.get("file");

  if (!file || typeof file === "string") return json({ error: "no file" }, 400, context.request);
  if (!ALLOWED_TYPES.includes(file.type)) return json({ error: "unsupported type" }, 400, context.request);

  const buffer = await file.arrayBuffer();
  if (buffer.byteLength > MAX_BYTES) return json({ error: "too large (max 25MB)" }, 400, context.request);

  const key = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await writeImage(storage, key, buffer, file);

  const url = publicImageUrl(context.env, key, storage);
  return json({ ok: true, url, key }, 200, context.request);
}

export async function onRequestOptions(context) {
  return new Response(null, { status: 204, headers: corsHeaders(context.request) });
}

function json(body, status = 200, request = null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
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

function getImageStorage(env) {
  return env.BLOG_IMAGES || env.BLOG_KV || null;
}

function isR2Storage(storage) {
  return typeof storage?.head === "function";
}

async function readImage(storage, key) {
  if (isR2Storage(storage)) {
    const object = await storage.get(key);
    if (!object) return null;
    return {
      body: object.body,
      contentType: object.httpMetadata?.contentType || object.customMetadata?.contentType || "image/jpeg",
    };
  }

  const entry = await storage.getWithMetadata(`img:${key}`, { type: "arrayBuffer" });
  if (!entry.value) return null;
  return {
    body: entry.value,
    contentType: entry.metadata?.contentType || "image/jpeg",
  };
}

async function writeImage(storage, key, buffer, file) {
  if (isR2Storage(storage)) {
    await storage.put(key, buffer, {
      httpMetadata: { contentType: file.type },
      customMetadata: { name: file.name || key },
    });
    return;
  }

  await storage.put(`img:${key}`, buffer, {
    metadata: { contentType: file.type, name: file.name || key },
    expirationTtl: 60 * 60 * 24 * 365 * 5, // 5年
  });
}

function publicImageUrl(env, key, storage) {
  if (!isR2Storage(storage)) return `/api/blog-image?key=${key}`;
  const base = String(env.BLOG_IMAGES_PUBLIC_URL || DEFAULT_PUBLIC_IMAGE_BASE).replace(/\/+$/, "");
  return `${base}/${key}`;
}

function isAllowedOrigin(request) {
  return Boolean(allowedOrigin(request.headers.get("Origin") || ""));
}

function allowedOrigin(origin) {
  if (!origin) return "https://yohelab.com";
  try {
    const { hostname, protocol } = new URL(origin);
    if (protocol !== "https:" && hostname !== "localhost" && hostname !== "127.0.0.1") return "";
    if (hostname === "yohelab.com" || hostname.endsWith(".yohelab.pages.dev") || hostname === "localhost" || hostname === "127.0.0.1") {
      return origin;
    }
  } catch {
    return "";
  }
  return "";
}
