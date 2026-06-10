import { getBlogPin, getRequestPin, isValidPin, json, timingSafeEqual } from "../lib/blog-auth.js";

const CATEGORY_KEY = "settings:blog-categories";

const DEFAULT_CATEGORIES = [
  {
    key: "ai-news",
    label: "AIニュース",
    color: "#087a63",
    order: 10,
    children: [
      { key: "ai-news", label: "AIニュース", color: "#087a63", order: 10 },
      { key: "chatgpt", label: "ChatGPT", color: "#10a37f", order: 20 },
      { key: "claude", label: "Claude", color: "#cc785c", order: 30 },
      { key: "gemini", label: "Gemini", color: "#4285f4", order: 40 },
      { key: "perplexity", label: "Perplexity", color: "#1fb6cf", order: 50 },
      { key: "genspark", label: "Genspark", color: "#7c3aed", order: 60 },
      { key: "grok", label: "Grok", color: "#222222", order: 70 },
      { key: "deepseek", label: "DeepSeek", color: "#1d4ed8", order: 80 },
      { key: "codex", label: "Codex", color: "#111827", order: 90 },
      { key: "cursor", label: "Cursor", color: "#334155", order: 100 },
      { key: "copilot", label: "Copilot", color: "#2563eb", order: 110 },
      { key: "midjourney", label: "Midjourney", color: "#8b5cf6", order: 120 },
    ],
  },
  {
    key: "ai-tools",
    label: "AIツール",
    color: "#087a63",
    order: 20,
    children: [
      { key: "ai-tools", label: "AIツール", color: "#087a63", order: 10 },
      { key: "template", label: "記事テンプレ", color: "#087a63", order: 20 },
      { key: "sales", label: "売り場づくり", color: "#087a63", order: 30 },
    ],
  },
];
const DEFAULT_PARENT_KEYS = new Set(DEFAULT_CATEGORIES.map((item) => item.key));

export async function onRequestGet(context) {
  const categories = await readCategories(context.env);
  return json({ ok: true, categories, defaults: DEFAULT_CATEGORIES }, 200);
}

export async function onRequestPost(context) {
  const authError = authorize(context);
  if (authError) return authError;

  const kv = context.env.BLOG_KV;
  if (!kv) return json({ error: "BLOG_KV is not configured" }, 500);

  const body = await readJsonBody(context.request);
  const categories = normalizeCategories(body?.categories);
  await kv.put(CATEGORY_KEY, JSON.stringify({ categories, updatedAt: new Date().toISOString() }), {
    metadata: { updatedAt: new Date().toISOString() },
  });

  return json({ ok: true, categories }, 200);
}

function authorize(context) {
  const configuredPin = getBlogPin(context.env);
  const requestPin = getRequestPin(context.request);
  if (!isValidPin(configuredPin)) return json({ error: "blog_pin_not_configured" }, 503);
  if (!isValidPin(requestPin)) return json({ error: "invalid_pin_format" }, 400);
  if (!timingSafeEqual(requestPin, configuredPin)) return json({ error: "unauthorized" }, 401);
  return null;
}

async function readCategories(env) {
  const kv = env.BLOG_KV;
  if (!kv) return DEFAULT_CATEGORIES;
  try {
    const saved = await kv.get(CATEGORY_KEY, { type: "json" });
    return normalizeCategories(saved?.categories || saved);
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

function normalizeCategories(value) {
  const source = mergeDefaultCategories(Array.isArray(value) && value.length ? value : DEFAULT_CATEGORIES)
    .filter((parent) => DEFAULT_PARENT_KEYS.has(sanitizeSlug(parent?.key)));
  const parents = source.map((parent, parentIndex) => {
    const rawKey = sanitizeSlug(parent?.key);
    const fallback = DEFAULT_CATEGORIES.find((item) => item.key === rawKey) || DEFAULT_CATEGORIES[parentIndex] || {};
    const key = rawKey || fallback.key || `category-${parentIndex + 1}`;
    const childrenSource = Array.isArray(parent?.children) && parent.children.length
      ? parent.children
      : fallback.children || [];
    return {
      key,
      label: sanitizeText(parent?.label) || fallback.label || key,
      color: sanitizeColor(parent?.color) || fallback.color || "#087a63",
      order: sanitizeOrder(parent?.order, (parentIndex + 1) * 10),
      children: childrenSource.map((child, childIndex) => {
        const rawChildKey = sanitizeSlug(Array.isArray(child) ? child[0] : child?.key);
        const fallbackChild = (fallback.children || []).find((item) => item.key === rawChildKey) || (fallback.children || [])[childIndex] || {};
        const childKey = rawChildKey || fallbackChild.key || `${key}-${childIndex + 1}`;
        return {
          key: childKey,
          label: sanitizeText(Array.isArray(child) ? child[1] : child?.label) || fallbackChild.label || childKey,
          color: sanitizeColor(Array.isArray(child) ? "" : child?.color) || fallbackChild.color || "#087a63",
          order: sanitizeOrder(Array.isArray(child) ? childIndex * 10 : child?.order, (childIndex + 1) * 10),
        };
      }).sort((a, b) => a.order - b.order),
    };
  }).sort((a, b) => a.order - b.order);

  return parents.slice(0, 12);
}

function mergeDefaultCategories(value) {
  const source = Array.isArray(value) && value.length ? value : DEFAULT_CATEGORIES;
  const parents = source.map((parent) => ({
    ...parent,
    children: Array.isArray(parent?.children) ? parent.children.map((child) => ({ ...child })) : [],
  }));

  DEFAULT_CATEGORIES.forEach((defaultParent) => {
    const defaultParentKey = sanitizeSlug(defaultParent.key);
    const parent = parents.find((item) => sanitizeSlug(item?.key) === defaultParentKey);
    if (!parent) {
      parents.push({
        ...defaultParent,
        children: defaultParent.children.map((child) => ({ ...child })),
      });
      return;
    }

    if (!Array.isArray(parent.children)) parent.children = [];
    const childKeys = new Set(parent.children.map((child) => sanitizeSlug(child?.key)).filter(Boolean));
    defaultParent.children.forEach((defaultChild) => {
      const childKey = sanitizeSlug(defaultChild.key);
      if (!childKeys.has(childKey)) parent.children.push({ ...defaultChild });
    });
  });

  return parents;
}

function sanitizeSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

function sanitizeText(value) {
  return String(value || "").replace(/[<>]/g, "").trim().slice(0, 40);
}

function sanitizeColor(value) {
  const color = String(value || "").trim();
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color : "";
}

function sanitizeOrder(value, fallback) {
  const order = Number(value);
  return Number.isFinite(order) ? Math.max(0, Math.min(999, Math.round(order))) : fallback;
}

async function readJsonBody(request) {
  const text = await request.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}
