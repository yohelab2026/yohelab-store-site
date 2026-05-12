import { getClientIp, rateLimitOk } from "../lib/affiliate.js";

const ALLOWED_PURPOSES = new Set([
  "文標本体の不具合",
  "広告リンク・CTAの表示不具合",
  "ダウンロード・シリアル・自動更新の不備",
  "30日返金希望",
  "決済・個人情報に関する連絡",
  "販売者情報請求",
  "バグ報告",
]);

export async function onRequestPost(context) {
  try {
    const ip = getClientIp(context.request);
    const within = await rateLimitOk(context.env, "contact", ip, { limit: 8, windowSec: 3600 });
    if (!within) {
      return json({ ok: false, error: "送信が多すぎます。1時間ほど時間をおいて再度お試しください。" }, 429);
    }

    const body = await readBody(context.request);
    if (String(body.website || "").trim()) {
      return json({ ok: true });
    }

    const purpose = String(body.purpose || "").trim().slice(0, 80);
    const name = String(body.name || "").trim().slice(0, 120);
    const email = String(body.email || "").trim().toLowerCase().slice(0, 254);
    const message = String(body.message || body.description || "").trim().slice(0, 5000);
    const detail = String(body.detail || "").trim().slice(0, 3000);
    const pageUrl = String(body.page_url || "").trim().slice(0, 500);
    const turnstileToken = String(body.turnstile_token || "").trim();

    if (!ALLOWED_PURPOSES.has(purpose)) return json({ ok: false, error: "問い合わせ内容を選んでください。" }, 400);
    if (!name) return json({ ok: false, error: "名前を入力してください。" }, 400);
    const emailOptional = purpose === "バグ報告" && !email;
    if (!emailOptional && !isValidEmail(email)) return json({ ok: false, error: "メールアドレスの形式が正しくありません。" }, 400);
    if (!message) return json({ ok: false, error: "内容を入力してください。" }, 400);

    const turnstileOk = await verifyTurnstileIfConfigured(context.env, turnstileToken, ip);
    if (!turnstileOk) return json({ ok: false, error: "確認に失敗しました。ページを再読み込みして再度送信してください。" }, 403);

    await sendContactEmail({
      env: context.env,
      purpose,
      name,
      email: email || "",
      message,
      detail,
      pageUrl,
      ip,
      userAgent: context.request.headers.get("User-Agent") || "",
    });

    return json({ ok: true });
  } catch (error) {
    return json({ ok: false, error: error.message || "送信に失敗しました。" }, 500);
  }
}

async function verifyTurnstileIfConfigured(env, token, ip) {
  const secret = env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token);
  form.append("remoteip", ip);
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: form,
  });
  if (!res.ok) return false;
  const result = await res.json();
  return result.success === true;
}

async function sendContactEmail({ env, purpose, name, email, message, detail, pageUrl, ip, userAgent }) {
  const apiKey = env.RESEND_API_KEY;
  const from = env.RESEND_FROM_EMAIL;
  const to = env.ADMIN_EMAIL || "support@yohelab.com";
  if (!apiKey || !from) {
    throw new Error("問い合わせ送信用メール設定が未設定です。");
  }

  const subject = `【よへラボ】${purpose}: ${name}`;
  const text = [
    `問い合わせ内容: ${purpose}`,
    `名前: ${name}`,
    `返信先: ${email}`,
    `ページ: ${pageUrl || "(未取得)"}`,
    `IP: ${ip}`,
    `User-Agent: ${userAgent}`,
    "",
    "本文:",
    message,
    "",
    detail ? `補足:\n${detail}` : "補足: なし",
  ].join("\n");

  const html = `
    <div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.75;color:#1f2937;max-width:680px;">
      <h2 style="font-size:18px;margin:0 0 14px;">よへラボ 問い合わせ</h2>
      <table style="border-collapse:collapse;width:100%;font-size:14px;">
        ${row("問い合わせ内容", purpose)}
        ${row("名前", name)}
        ${row("返信先", email)}
        ${row("ページ", pageUrl || "(未取得)")}
        ${row("IP", ip)}
      </table>
      <h3 style="font-size:15px;margin:22px 0 8px;">本文</h3>
      <pre style="white-space:pre-wrap;background:#f8fafc;border:1px solid #dbe5ef;border-radius:10px;padding:14px;">${escapeHtml(message)}</pre>
      <h3 style="font-size:15px;margin:22px 0 8px;">補足</h3>
      <pre style="white-space:pre-wrap;background:#f8fafc;border:1px solid #dbe5ef;border-radius:10px;padding:14px;">${escapeHtml(detail || "なし")}</pre>
    </div>
  `;

  const payload = {
    from,
    to,
    subject,
    text,
    html,
  };
  if (isValidEmail(email)) payload.reply_to = email;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("問い合わせメールの送信に失敗しました。");
}

function row(label, value) {
  return `<tr><th style="text-align:left;width:150px;background:#f1f8f5;border:1px solid #dbe5ef;padding:8px;">${escapeHtml(label)}</th><td style="border:1px solid #dbe5ef;padding:8px;">${escapeHtml(value)}</td></tr>`;
}

async function readBody(request) {
  const ct = request.headers.get("content-type") || "";
  if (ct.includes("application/json")) return request.json();
  const form = await request.formData();
  return Object.fromEntries(form.entries());
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
