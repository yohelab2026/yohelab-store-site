const KEY_PATTERN = /^[\w.-]+\.webp$/i;

export async function onRequestGet(context) {
  const key = String(context.params?.key || "").trim();
  if (!KEY_PATTERN.test(key)) return notFound();

  const storage = context.env.BLOG_IMAGES || context.env.BLOG_KV || null;
  if (!storage) return new Response("Not configured", { status: 500 });

  const entry = await readImage(storage, key);
  if (!entry) return notFound();

  return new Response(entry.body, {
    headers: {
      "Content-Type": entry.contentType || "image/webp",
      "Cache-Control": "public, max-age=31536000, immutable",
      "Access-Control-Allow-Origin": "*",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "index,follow,max-image-preview:large",
    },
  });
}

function notFound() {
  return new Response("Not found", {
    status: 404,
    headers: {
      "Cache-Control": "public, max-age=60",
      "X-Robots-Tag": "noindex,follow",
    },
  });
}

function isR2Storage(storage) {
  return typeof storage?.getWithMetadata !== "function";
}

async function readImage(storage, key) {
  if (isR2Storage(storage)) {
    const object = await storage.get(key);
    if (!object) return null;
    return {
      body: object.body,
      contentType: object.httpMetadata?.contentType || object.customMetadata?.contentType || "image/webp",
    };
  }

  const entry = await storage.getWithMetadata(`img:${key}`, { type: "arrayBuffer" });
  if (!entry.value) return null;
  return {
    body: entry.value,
    contentType: entry.metadata?.contentType || "image/webp",
  };
}
