import { getBlogPin, isValidPin, json, timingSafeEqual } from "../lib/blog-auth.js";

export async function onRequestPost(context) {
  const body = await readJsonBody(context.request);
  const requestPin = String(body?.pin || "").trim();
  const pin = getBlogPin(context.env);

  if (!isValidPin(requestPin)) return json({ error: "invalid_pin_format" }, 400);
  if (!timingSafeEqual(requestPin, pin)) return json({ error: "unauthorized" }, 401);

  return json({ ok: true });
}

async function readJsonBody(request) {
  const text = await request.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}
