import { makeAffiliateCode, getAffiliateMeta, setAffiliateMeta, getKv, rateLimitOk, getClientIp } from "../lib/affiliate.js";

export async function onRequestPost(context) {
  try {
    const ip = getClientIp(context.request);
    const within = await rateLimitOk(context.env, "signup", ip, { limit: 5, windowSec: 3600 });
    if (!within) {
      return json({ ok: false, error: "登録試行が多すぎます。1時間ほど時間をおいて再度お試しください。" }, 429);
    }

    const body = await readBody(context.request);
    const name = String(body.name || "").trim().slice(0, 120);
    const email = String(body.email || "").trim().toLowerCase().slice(0, 254);
    const siteUrl = String(body.site_url || "").trim().slice(0, 500);
    const memo = String(body.memo || "").trim().slice(0, 500);

    if (!name) return json({ ok: false, error: "お名前を入力してください。" }, 400);
    if (!isValidEmail(email)) return json({ ok: false, error: "メールアドレスの形式が正しくありません。" }, 400);
    if (!isValidUrl(siteUrl)) return json({ ok: false, error: "サイト・SNSのURLが正しくありません（http:// または https:// で始まる必要があります）。" }, 400);

    if (!getKv(context.env)) {
      return json({ ok: false, error: "ストレージが設定されていません。運営にお問い合わせください。" }, 503);
    }

    const code = await makeAffiliateCode(email, context.env);

    // Check existing — do not regenerate, just return existing if found
    const existing = await getAffiliateMeta(code, context.env);
    let isNew = false;
    if (existing) {
      // If different email user with same hash collision (shouldn't happen with HMAC + email),
      // ensure the existing record matches
      if (existing.email && existing.email !== email) {
        return json({ ok: false, error: "このメールアドレスは既に使用されています。" }, 409);
      }
    } else {
      await setAffiliateMeta(code, {
        code,
        name,
        email,
        siteUrl,
        memo,
        createdAt: Date.now(),
        status: "active",
      }, context.env);
      isNew = true;

      // Notify admin (best-effort)
      try {
        await sendAdminNotification({
          name,
          email,
          siteUrl,
          memo,
          code,
          apiKey: context.env.RESEND_API_KEY,
          from: context.env.RESEND_FROM_EMAIL,
          adminEmail: context.env.ADMIN_EMAIL || "support@yohelab.com",
        });
      } catch {}
    }

    const refLink = `https://yohelab.com/lp/bunsirube/?ref=${code}`;

    // Send signup email to affiliate (best-effort)
    try {
      await sendAffiliateSignupEmail({
        to: email,
        name,
        code,
        refLink,
        isNew,
        apiKey: context.env.RESEND_API_KEY,
        from: context.env.RESEND_FROM_EMAIL,
      });
    } catch {}

    return json({ ok: true, code, refLink, isNew });
  } catch (error) {
    return json({ ok: false, error: error.message || "登録に失敗しました。" }, 500);
  }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

async function readBody(request) {
  const ct = request.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    return request.json();
  }
  const form = await request.formData();
  return Object.fromEntries(form.entries());
}

async function sendAffiliateSignupEmail({ to, name, code, refLink, isNew, apiKey, from }) {
  if (!apiKey || !from) return;
  const subject = isNew
    ? "【よへラボ】文標アフィリエイト登録完了"
    : "【よへラボ】文標アフィリエイトコード（再発行）";
  const text = [
    `${name} 様`,
    "",
    "文標アフィリエイトプログラムへの登録ありがとうございます。",
    "",
    "■ アフィリエイトコード",
    code,
    "",
    "■ あなたの紹介リンク",
    refLink,
    "",
    "このリンクからアクセスして30日以内に購入されると、",
    "あなたの成果として記録され、購入金額の50%（¥2,750）が報酬となります。",
    "",
    "■ ダッシュボード（成果確認）",
    `https://yohelab.com/affiliate/dashboard/?code=${code}`,
    "",
    "■ 規約と支払いについて",
    "・最低支払額: ¥3,000（累積）",
    "・支払サイト: 月末締め・翌月末払い",
    "・支払方法: 国内銀行振込（手数料当方負担）",
    "・初回支払いの前に、口座情報を問い合わせフォームから送信してください",
    "・規約: https://yohelab.com/legal/affiliate-terms/",
    "",
    "■ 表示義務（必読）",
    "紹介リンクを掲載するページには「PR」「アフィリエイトリンクを含む」の表示をお願いします。",
    "ステマ規制（消費者庁告示）への対応として必要です。",
    "",
    "ご質問は問い合わせフォームから:",
    "https://yohelab.com/contact/",
    "",
    "よろしくお願いします。",
    "よへラボ",
  ].join("\n");

  const html = `
    <div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.7;color:#1f2937;max-width:600px;">
      <p>${escapeHtml(name)} 様</p>
      <p>文標アフィリエイトプログラムへの登録ありがとうございます。</p>
      <p style="padding:14px 18px;border-radius:10px;background:#ecfdf5;border:1px solid #b7ead6;">
        <strong style="font-size:14px;color:#065f46;">アフィリエイトコード</strong><br />
        <span style="font-family:ui-monospace,monospace;font-size:18px;font-weight:900;letter-spacing:.05em">${escapeHtml(code)}</span>
      </p>
      <p style="padding:14px 18px;border-radius:10px;background:#f3f8ff;border:1px solid #cdd9f1;">
        <strong style="font-size:14px;color:#0b3a73;">あなたの紹介リンク</strong><br />
        <a href="${escapeHtml(refLink)}" style="color:#0b3a73;font-weight:700;font-size:14px;word-break:break-all;">${escapeHtml(refLink)}</a>
      </p>
      <p>このリンクからアクセスして<strong>30日以内</strong>に購入されると、あなたの成果として記録され、購入金額の50%（<strong>¥2,750</strong>）が報酬となります。</p>
      <p><a href="https://yohelab.com/affiliate/dashboard/?code=${escapeHtml(code)}" style="display:inline-block;padding:12px 22px;border-radius:10px;background:#0b8f72;color:#fff;font-weight:900;text-decoration:none;">ダッシュボードを開く</a></p>
      <h3 style="font-size:15px;margin-top:24px;color:#065f46;">支払いについて</h3>
      <ul style="font-size:14px;color:#536174;line-height:1.85;padding-left:20px;">
        <li>最低支払額: ¥3,000（累積）</li>
        <li>支払サイト: 月末締め・翌月末払い</li>
        <li>支払方法: 国内銀行振込（手数料当方負担）</li>
        <li>初回支払いの前に、口座情報を問い合わせフォームから送信してください</li>
      </ul>
      <p style="font-size:13px;color:#9a3412;background:#fff7ed;border:1px solid #fcd9b6;border-radius:10px;padding:12px 14px;margin-top:16px;">
        <strong>表示義務（必読）:</strong> 紹介リンクを掲載するページには「PR」「アフィリエイトリンクを含む」の表示をお願いします。ステマ規制（消費者庁告示）への対応として必要です。
      </p>
      <p style="font-size:13px;color:#64748b;margin-top:16px;">規約: <a href="https://yohelab.com/legal/affiliate-terms/" style="color:#0b8f72;">アフィリエイトプログラム規約</a></p>
      <p style="font-size:13px;color:#64748b;">ご質問は <a href="https://yohelab.com/contact/" style="color:#0b8f72;">問い合わせフォーム</a> から。</p>
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

async function sendAdminNotification({ name, email, siteUrl, memo, code, apiKey, from, adminEmail }) {
  if (!apiKey || !from || !adminEmail) return;
  const text = [
    "新しいアフィリエイト登録",
    "",
    `名前: ${name}`,
    `メール: ${email}`,
    `サイトURL: ${siteUrl}`,
    `コード: ${code}`,
    `メモ: ${memo || "(なし)"}`,
  ].join("\n");
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: adminEmail,
      subject: `[Affiliate] 新規登録: ${name} (${code})`,
      text,
    }),
  });
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
    },
  });
}
