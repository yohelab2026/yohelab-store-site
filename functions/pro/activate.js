import {
  getGrantNextPath,
  mergeAccessCookie,
  readCookie,
  serializeCookie,
  verifyPayload,
} from "../lib/entitlements.js";

export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const token = url.searchParams.get("token");
    const next = url.searchParams.get("next");

    if (!token) {
      return new Response("Missing token", { status: 400 });
    }

    const existingCookie = readCookie(context.request.headers.get("Cookie"));
    const merged = await mergeAccessCookie(existingCookie, token, context.env);
    if (!merged) {
      return new Response("Invalid token", { status: 400 });
    }

    const grant = await verifyPayload(token, context.env.ACCESS_SECRET);
    const fallbackNext = grant?.product ? getGrantNextPath(grant.product) : "/";
    const destination = sanitizeNext(next) || fallbackNext;
    const secure = url.protocol === "https:" && !["localhost", "127.0.0.1"].includes(url.hostname);

    return new Response(null, {
      status: 302,
      headers: {
        Location: destination,
        "Set-Cookie": serializeCookie(merged.token, undefined, secure),
      },
    });
  } catch (error) {
    return new Response(`Activation failed: ${error.message}`, { status: 500 });
  }
}

function sanitizeNext(next) {
  if (!next) return null;
  if (!next.startsWith("/")) return null;
  return next;
}
