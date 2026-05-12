import {
  getGrantLabel,
  getGrantNextPath,
  getProductConfig,
  makeGrantToken,
  makeSerial,
  getAllProducts,
} from "../lib/entitlements.js";
import {
  getAffiliateMeta,
  markSaleRefundedByPurchaseId,
  recordSale,
  AFFILIATE_PRODUCT_AMOUNT,
} from "../lib/affiliate.js";

const SUPPORTED_EVENTS = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "charge.refunded",
  "refund.updated",
]);
const AFFILIATE_REF_RE = /^AFF-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

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

    if (event.type === "charge.refunded" || event.type === "refund.updated") {
      return handleRefundEvent(event, context.env);
    }

    const session = event.data?.object;
    const rawRef = String(session?.client_reference_id || "");
    // Format: "PRODUCT" or "PRODUCT:AFF-XXXX-XXXX"
    const [product, affRefRaw] = rawRef.split(":");
    if (!product || !getAllProducts()[product]) {
      return json({ received: true, ignored: "unknown_product" });
    }
    const affiliateCode = affRefRaw && AFFILIATE_REF_RE.test(affRefRaw.toUpperCase())
      ? affRefRaw.toUpperCase()
      : null;

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

    // Record affiliate sale (best-effort — don't block grant on this)
    let affiliateRecorded = false;
    if (affiliateCode && product === "wordpress-theme") {
      try {
        const meta = await getAffiliateMeta(affiliateCode, context.env);
        if (meta && meta.status !== "suspended") {
          // Avoid self-referral: affiliate's own purchase is not eligible
          if (meta.email && meta.email === String(email).toLowerCase()) {
            affiliateRecorded = false;
          } else {
            const amount = Number(session?.amount_total) || AFFILIATE_PRODUCT_AMOUNT;
            await recordSale({
              code: affiliateCode,
              purchaseId,
              amount,
              email,
              createdAt: Date.now(),
            }, context.env);
            affiliateRecorded = true;
            // Notify affiliate
            try {
              await sendAffiliateNotification({
                to: meta.email,
                code: affiliateCode,
                name: meta.name || "",
                commission: Math.floor(amount * 0.5),
                from: context.env.RESEND_FROM_EMAIL,
                apiKey: context.env.RESEND_API_KEY,
              });
            } catch {}
          }
        }
      } catch (e) {
        // Swallow — affiliate failure should not block customer email
      }
    }

    return json({ received: true, emailed: true, product, affiliateRecorded });
  } catch (error) {
    return json({ error: error.message }, 500);
  }
}

async function handleRefundEvent(event, env) {
  const obj = event.data?.object || {};
  const purchaseId = String(obj.payment_intent || obj.paymentIntent || obj.charge || "").trim();
  const fullyRefunded = event.type === "refund.updated"
    ? obj.status === "succeeded"
    : (obj.refunded === true || (Number(obj.amount || 0) > 0 && Number(obj.amount_refunded || 0) >= Number(obj.amount || 0)));

  if (!purchaseId || !fullyRefunded) {
    return json({ received: true, ignored: "partial_or_missing_refund_purchase" });
  }

  const affiliateRefunded = await markSaleRefundedByPurchaseId(purchaseId, env);
  return json({ received: true, refundRecorded: true, affiliateRefunded, purchaseId });
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
        "",
        "■ 30日返金保証",
        "購入から30日以内であれば、理由を問わず全額返金できる。",
        "問い合わせフォームから「文標 返金希望」と購入時メールアドレスを送信すると手続きする。",
        "https://yohelab.com/contact/",
        "",
        "■ 対応範囲",
        "対応するのは、文標本体の不具合、広告リンク・CTAの明らかな表示不具合、配布ZIPの破損、ダウンロード不備、シリアル認証、自動更新の不備に限る。",
        "導入代行、初期設定代行、使い方相談、個別カスタマイズ、外部プラグイン衝突調査、記事制作、SEO相談、広告運用相談は対象外。",
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
      <p style="margin-top:18px;padding:14px 16px;border-radius:10px;background:#fff7ed;border:1px solid #fcd9b6;color:#7c2d12"><strong>🛡 30日返金保証</strong><br>購入から30日以内であれば、理由を問わず全額返金します。<a href="https://yohelab.com/contact/" style="color:#7c2d12;font-weight:700;text-decoration:underline">問い合わせフォーム</a> から「文標 返金希望」と購入時メールアドレスを送信してください。Stripe経由で決済元に返金されます（着金まで5〜10営業日）。返金後はシリアルが無効化されます。</p>
      <p style="color:#64748b">テーマ自体はシリアルなしでも動きます。シリアルは購入者確認と自動更新のために使います。不具合連絡時に確認する場合があります。</p>
      <p style="color:#64748b">対応するのは、文標本体の不具合、広告リンク・CTAの明らかな表示不具合、配布ZIPの破損、ダウンロード不備、シリアル認証、自動更新の不備です。導入代行、初期設定代行、使い方相談、個別カスタマイズ、外部プラグイン衝突調査、記事制作、SEO相談、広告運用相談は対象外です。</p>
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

async function sendAffiliateNotification({ to, code, name, commission, from, apiKey }) {
  if (!apiKey || !from || !to) return;
  const subject = "【よへラボ】文標の紹介が成立しました";
  const text = [
    `${name || "アフィリエイトパートナー"} 様`,
    "",
    "文標の購入が、あなたの紹介リンクから発生しました。",
    "",
    `紹介報酬: ¥${(commission || 0).toLocaleString()}（保留中）`,
    `アフィリエイトコード: ${code}`,
    "",
    "■ 確定タイミング",
    "購入から30日経過後（返金可能期間が終了したのち）に確定します。",
    "返金された場合は、当該成果は無効となります。",
    "",
    "■ ダッシュボード",
    `https://yohelab.com/affiliate/dashboard/?code=${code}`,
    "",
    "■ 支払い",
    "月末締め・翌月末払い・累積¥3,000以上で振込対象。",
    "口座情報がまだの場合は問い合わせフォームから送信してください:",
    "https://yohelab.com/contact/",
    "",
    "ご紹介ありがとうございます。",
    "よへラボ",
  ].join("\n");
  const html = `
    <div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.7;color:#1f2937;max-width:600px;">
      <p>${escapeHtml(name || "アフィリエイトパートナー")} 様</p>
      <p>文標の購入が、あなたの紹介リンクから発生しました。</p>
      <p style="padding:14px 18px;border-radius:10px;background:#fff7ed;border:1px solid #fcd9b6;color:#7c2d12;">
        <strong>紹介報酬: ¥${escapeHtml((commission || 0).toLocaleString())}</strong><span style="margin-left:10px;font-size:12px;background:#fff;padding:2px 8px;border-radius:6px;color:#9a3412">保留中</span>
      </p>
      <p style="font-size:13px;color:#536174;">購入から30日経過後（返金可能期間が終了したのち）に確定します。返金された場合は当該成果は無効となります。</p>
      <p><a href="https://yohelab.com/affiliate/dashboard/?code=${escapeHtml(code)}" style="display:inline-block;padding:10px 18px;border-radius:10px;background:#0b8f72;color:#fff;font-weight:900;text-decoration:none;">ダッシュボードを開く</a></p>
      <p style="font-size:13px;color:#64748b;">口座情報がまだの場合は <a href="https://yohelab.com/contact/" style="color:#0b8f72">問い合わせフォーム</a> から送信してください（月末締め・翌月末払い）。</p>
    </div>
  `;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, text, html }),
  });
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
