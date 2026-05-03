import {
  getGrantLabel,
  getGrantNextPath,
  getProductConfig,
  makeGrantToken,
  makeSerial,
  getAllProducts,
} from "../lib/entitlements.js";

const SUPPORTED_EVENTS = new Set(["checkout.session.completed", "checkout.session.async_payment_succeeded"]);

export async function onRequestPost(context) {
  try {
    const secret = context.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) return json({ error: "STRIPE_WEBHOOK_SECRET is not configured" }, 500);

    const rawBody = await context.request.text();
    const signatureHeader = context.request.headers.get("Stripe-Signature");
    if (!(await verifyStripeSignature(rawBody, signatureHeader, secret))) {
      return json({ error: "Invalid signature" }, 400);
    }

    const event = JSON.parse(rawBody);
    if (!SUPPORTED_EVENTS.has(event.type)) {
      return json({ received: true, ignored: event.type });
    }

    const session = event.data?.object;
    const product = session?.client_reference_id;
    if (!product || !getAllProducts()[product]) {
      return json({ received: true, ignored: "unknown_product" });
    }

    const email = session?.customer_details?.email || session?.customer_email;
    const purchaseId = product === "wordpress-theme"
      ? (session?.payment_intent || session?.id)
      : session?.subscription;
    if (!email || !purchaseId) {
      return json({ received: true, ignored: product === "wordpress-theme" ? "missing_email_or_payment" : "missing_email_or_subscription" });
    }

    const grantToken = await makeGrantToken(
      { product, subscriptionId: purchaseId, email },
      context.env,
      Date.now(),
    );
    const serial = product === "wordpress-theme"
      ? await makeSerial({ product, subscriptionId: purchaseId, email }, context.env)
      : "";

    const siteUrl = (context.env.SITE_URL || "https://yohelab.com").replace(/\/$/, "");
    const next = getProductConfig(product)?.activatePath || getGrantNextPath(product);
    const accessUrl = `${siteUrl}/pro/activate?token=${encodeURIComponent(grantToken)}&next=${encodeURIComponent(next)}`;
    const downloadUrl = serial
      ? `${siteUrl}/api/theme-download?serial=${encodeURIComponent(serial)}&email=${encodeURIComponent(email)}&purchase=${encodeURIComponent(purchaseId)}`
      : "";
    const childDownloadUrl = downloadUrl ? `${downloadUrl}&variant=child` : "";
    await sendGrantEmail({
      to: email,
      accessUrl,
      downloadUrl,
      childDownloadUrl,
      serial,
      product,
      label: getGrantLabel(product),
      from: context.env.RESEND_FROM_EMAIL,
      apiKey: context.env.RESEND_API_KEY,
    });

    return json({ received: true, emailed: true, product });
  } catch (error) {
    return json({ error: error.message }, 500);
  }
}

async function sendGrantEmail({ to, accessUrl, downloadUrl, childDownloadUrl, serial, product, label, from, apiKey }) {
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured");
  if (!from) throw new Error("RESEND_FROM_EMAIL is not configured");

  const subject = product === "wordpress-theme"
    ? `【よへラボ】${label}のZIPとシリアルナンバー`
    : `【よへラボ】${label}の有料版リンク`;
  const textLines = product === "wordpress-theme"
    ? [
        `${label} の購入ありがとう。`,
        "",
        "シリアルナンバー:",
        serial,
        "",
        "ZIPダウンロードURL:",
        downloadUrl,
        "",
        "改造用子テーマZIP:",
        childDownloadUrl,
        "",
        "WordPress管理画面の「外観 > 文標」にシリアルナンバーを入力すると、購入済みとして表示される。",
        "購入者ページ:",
        accessUrl,
      ]
    : [
        `${label} の有料版を有効にしたよ。`,
        "",
        "下のURLを開くと、購入済みの有料版が使える。",
        accessUrl,
        "",
        "無料版と有料版の違いは各ページで確認できる。",
      ];
  const text = textLines.join("\n");

  const html = product === "wordpress-theme" ? `
    <div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.7;color:#1f2937">
      <p>${escapeHtml(label)} の購入ありがとう。</p>
      <p>下のシリアルナンバーを WordPress管理画面の <strong>外観 &gt; 文標</strong> に入力してね。</p>
      <p style="padding:12px 16px;border-radius:10px;background:#ecfdf5;border:1px solid #b7ead6;font-size:18px;font-weight:800;letter-spacing:.08em">${escapeHtml(serial)}</p>
      <p><strong>ZIPダウンロードURL</strong><br><a href="${escapeHtml(downloadUrl)}" style="color:#0d6b58;font-weight:700">${escapeHtml(downloadUrl)}</a></p>
      <p><strong>改造用子テーマZIP</strong><br><a href="${escapeHtml(childDownloadUrl)}" style="color:#0d6b58;font-weight:700">${escapeHtml(childDownloadUrl)}</a></p>
      <p><strong>購入者ページ</strong><br><a href="${escapeHtml(accessUrl)}" style="color:#0d6b58;font-weight:700">${escapeHtml(accessUrl)}</a></p>
      <p style="color:#64748b">テーマ自体はシリアルなしでも動きます。シリアルは購入者確認、更新、サポート用です。</p>
    </div>
  ` : `
    <div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.7;color:#1f2937">
      <p>${escapeHtml(label)} の有料版を有効にしたよ。</p>
      <p>下のURLを開くと、購入済みの有料版が使える。</p>
      <p><a href="${escapeHtml(accessUrl)}" style="color:#0d6b58;font-weight:700">${escapeHtml(accessUrl)}</a></p>
      <p>無料版と有料版の違いは各ページで確認できる。</p>
    </div>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      text,
      html,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend error ${response.status}: ${body}`);
  }
}

async function verifyStripeSignature(rawBody, signatureHeader, secret) {
  if (!signatureHeader) return false;
  const items = signatureHeader.split(",").map((part) => {
    const [key, value] = part.split("=");
    return { key: key.trim(), value: value?.trim() || "" };
  });
  const tsItem = items.find((item) => item.key === "t");
  if (!tsItem) return false;
  const timestamp = Number(tsItem.value);
  if (!timestamp || Number.isNaN(timestamp)) return false;

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > 300) return false;

  const payload = `${timestamp}.${rawBody}`;
  const expected = await hmacHex(secret, payload);
  return items
    .filter((item) => item.key === "v1")
    .some((item) => item.value === expected);
}

async function hmacHex(secret, message) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
