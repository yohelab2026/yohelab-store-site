const textEncoder = new TextEncoder();

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function base64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

async function verifyLineSignature(body, signature, channelSecret) {
  if (!signature || !channelSecret) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(channelSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", key, textEncoder.encode(body));
  return base64(digest) === signature;
}

function sourceId(source = {}) {
  return source.userId || source.groupId || source.roomId || "";
}

function lineToken(env) {
  return env.LINE_CHANNEL_ACCESS_TOKEN || "";
}

function githubRepo(env) {
  return env.GITHUB_REPOSITORY || "yohelab2026/yohelab-store-site";
}

function shouldReplyWithLineTo(text) {
  const normalized = text.trim().toLowerCase();
  return ["id", "line_to", "line to", "設定id", "通知先id"].includes(normalized);
}

function wantsAiWork(text) {
  return /AI作業OK|AI作業可|PR作成OK|PRまで|ai-work-ok/i.test(text);
}

function cleanInstruction(text) {
  return text
    .replace(/AI作業OK[:：]?/gi, "")
    .replace(/AI作業可[:：]?/gi, "")
    .replace(/PR作成OK[:：]?/gi, "")
    .trim();
}

function issueTitle(text) {
  const firstLine = cleanInstruction(text).split(/\r?\n/).find(Boolean) || "LINEからの改善指示";
  const clipped = firstLine.replace(/\s+/g, " ").slice(0, 70);
  return `LINE指示: ${clipped}`;
}

async function githubRequest(env, path, init = {}) {
  const token = env.GITHUB_ISSUE_TOKEN || env.GITHUB_TOKEN || "";
  if (!token) {
    throw new Error("GITHUB_ISSUE_TOKEN is not configured.");
  }

  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "yohelab-line-webhook",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API failed: ${response.status} ${body}`);
  }

  return response.status === 204 ? null : response.json();
}

async function ensureGithubLabel(env, name, color, description) {
  const repo = githubRepo(env);
  const encoded = encodeURIComponent(name);
  try {
    await githubRequest(env, `/repos/${repo}/labels/${encoded}`);
  } catch {
    await githubRequest(env, `/repos/${repo}/labels`, {
      method: "POST",
      body: JSON.stringify({ name, color, description }),
    });
  }
}

async function createLineIssue(text, toId, env) {
  const repo = githubRepo(env);
  const aiOk = wantsAiWork(text);
  const labels = ["line-inbox", ...(aiOk ? ["ai-work-ok"] : [])];

  await ensureGithubLabel(env, "line-inbox", "0e8a16", "LINEから届いた改善メモ");
  if (aiOk) {
    await ensureGithubLabel(env, "ai-work-ok", "1d76db", "AI作業PR作成まで進めてよい指示");
  }

  const issue = await githubRequest(env, `/repos/${repo}/issues`, {
    method: "POST",
    body: JSON.stringify({
      title: issueTitle(text),
      labels,
      body: [
        "LINEから届いた改善指示です。",
        "",
        aiOk ? "状態: AI作業OK" : "状態: メモのみ",
        "",
        "```text",
        cleanInstruction(text) || text.trim(),
        "```",
        "",
        `LINE source: ${toId}`,
        "",
        aiOk
          ? "次の作業: Codexで差分を作り、PR化する。価格・Stripe・法務は勝手に変更しない。"
          : "次の作業: 必要なら `ai-work-ok` ラベルを付けてから作業する。",
      ].join("\n"),
    }),
  });

  return issue;
}

async function replyLine(replyToken, message, env) {
  const token = lineToken(env);
  if (!replyToken || !token) return;

  await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: "text", text: message.slice(0, 5000) }],
    }),
  });
}

async function replyWithLineTo(replyToken, toId, env) {
  const token = lineToken(env);
  if (!replyToken || !toId || !token) return;

  const idType = toId.startsWith("U") ? "user" : toId.startsWith("C") ? "group" : "room";
  const message = [
    "LINE通知の設定IDです。",
    "",
    `LINE_TO=${toId}`,
    `種類: ${idType}`,
    "",
    "GitHub Secrets に LINE_TO として入れてください。",
  ].join("\n");

  await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: "text", text: message }],
    }),
  });
}

async function handleTextMessage(event, toId, env) {
  const text = event.message?.text || "";
  if (!text.trim()) return;

  if (shouldReplyWithLineTo(text)) {
    await replyWithLineTo(event.replyToken, toId, env);
    return;
  }

  try {
    const issue = await createLineIssue(text, toId, env);
    const mode = wantsAiWork(text) ? "AI作業OK" : "メモのみ";
    await replyLine(
      event.replyToken,
      [
        "GitHub Issueに入れました。",
        "",
        `状態: ${mode}`,
        `#${issue.number} ${issue.title}`,
        issue.html_url,
        "",
        wantsAiWork(text)
          ? "ai-work-ok ラベル付き。PR作成対象です。"
          : "PRまで進めたい時は、文頭に「AI作業OK」を付けて送ってください。",
      ].join("\n"),
      env,
    );
  } catch (error) {
    console.error(error);
    await replyLine(
      event.replyToken,
      [
        "GitHub Issue化に失敗しました。",
        "",
        "Cloudflareの環境変数 GITHUB_ISSUE_TOKEN を確認してください。",
      ].join("\n"),
      env,
    );
  }
}

export async function onRequestGet() {
  return json({
    ok: true,
    message: "LINE webhook endpoint is ready. Configure this URL in LINE Developers.",
  });
}

export async function onRequestPost({ request, env }) {
  const channelSecret = env.LINE_CHANNEL_SECRET || "";
  if (!channelSecret) {
    return json({ ok: false, error: "LINE_CHANNEL_SECRET is not configured." }, 503);
  }

  const signature = request.headers.get("x-line-signature") || "";
  const body = await request.text();
  const valid = await verifyLineSignature(body, signature, channelSecret);
  if (!valid) {
    return json({ ok: false, error: "Invalid LINE signature." }, 401);
  }

  const payload = JSON.parse(body || "{}");
  const events = Array.isArray(payload.events) ? payload.events : [];
  const ids = [];

  for (const event of events) {
    const id = sourceId(event.source);
    if (!id) continue;
    ids.push(id);
    if (event.type === "message" && event.message?.type === "text") {
      await handleTextMessage(event, id, env);
    }
  }

  console.log("LINE webhook source ids:", ids.join(", ") || "-");
  return json({ ok: true, idsFound: ids.length });
}
