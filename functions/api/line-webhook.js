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

function wantsChoices(text) {
  return /案を出して|選択肢|候補|どう直す|どう変える|改善したい|相談/i.test(text);
}

function wantsMoreChoices(text) {
  return /追加|別案|もっと|他の案/i.test(text);
}

function choiceNumber(text) {
  const aiOkMatch = text.match(/(?:AI作業OK|AI作業可|PR作成OK|PRまで|ai-work-ok)\s*(\d{1,2})?/i);
  if (aiOkMatch) return aiOkMatch[1] ? Number(aiOkMatch[1]) : null;
  const match = text.trim().match(/^(\d{1,2})$/);
  return match ? Number(match[1]) : null;
}

function cleanInstruction(text) {
  return text
    .replace(/AI作業OK[:：]?/gi, "")
    .replace(/AI作業可[:：]?/gi, "")
    .replace(/PR作成OK[:：]?/gi, "")
    .trim();
}

function copilotInstructions() {
  return [
    "You are working on the yohelab-store-site repository.",
    "Create a draft pull request for this issue.",
    "Follow AGENTS.md strictly.",
    "Keep 文標 as the main product.",
    "Safe automation area: copy, design, LP, blog, light UI fixes, broken links, image optimization, typo fixes, accessibility, speed improvements.",
    "Human review required area: prices, Stripe links, payments, legal pages, refunds, privacy policy, terms, commerce disclosure, theme ZIP files, child theme ZIP files, serial/license/authentication, Cloudflare Functions for auth/payment, GitHub Actions, secrets, deploy settings.",
    "Do not edit human review required areas. If the issue requires them, explain the risk in the PR and keep the PR draft.",
    "Do not use unsafe claims such as AI検索に出る, AI検索最適化済み, AIに拾われる, 必ず売れる, or 順位が上がる.",
    "Prefer safe wording such as AI検索時代の記事構造 and 読み取りやすい本文構造.",
    "For blog creation or rewrite issues, if images are requested, create suitable original blog images or diagrams as part of the PR.",
    "Do not use copyrighted stock images. Prefer lightweight original SVG/WebP/HTML-rendered diagrams that match よへラボ and 文標.",
    "For each image, include alt text, intended insertion position, image purpose, and keep it optimized with width/height plus lazy loading where it is embedded.",
    "If image generation is not available, create a simple original SVG diagram or blog card style visual in the repository and explain it in the PR.",
    "When the issue contains a selected LINE option, implement that selected option only.",
    "Run npm run build and npm run test:smoke before finishing.",
  ].join("\n");
}

function issueTitle(text) {
  const firstLine = cleanInstruction(text).split(/\r?\n/).find(Boolean) || "LINEからの改善指示";
  const clipped = firstLine.replace(/\s+/g, " ").slice(0, 70);
  return `LINE指示: ${clipped}`;
}

function choiceOptions() {
  return [
    "ブログ記事を新しく書く",
    "既存ブログをリライトする",
    "X投稿文を作る",
    "その他・自由入力で相談する",
  ];
}

function formatChoiceOptions() {
  return choiceOptions()
    .map((option, index) => `${index + 1}. ${option}`)
    .join("\n");
}

function optionText(number) {
  if (!Number.isInteger(number) || number < 1 || number > 4) return "";
  return choiceOptions()[number - 1] || "";
}

function followUpQuestions(number) {
  if (QUESTION_FLOWS[number]) {
    return firstStepQuestion(number);
  }
  return "";
}

const QUESTION_FLOWS = {
  1: [
    ["記事テーマ", "記事テーマは何にする？"],
    ["読む人", "読む人は誰にする？ 例: WordPress初心者、個人事業主、ブログ初心者"],
    ["画像数", "画像は何個入れる？ 0 / 1 / 3 / 5 / おまかせ"],
    ["画像タイプ", "画像タイプは？ アイキャッチ / 図解 / 操作イメージ / 比較表風 / おまかせ / なし"],
    ["画像の雰囲気", "画像の雰囲気は？ 文標っぽく / やわらかい / 実務寄り / シンプル / おまかせ / なし"],
    ["画像の入れ方", "画像はどこに入れる？ 冒頭だけ / セクションごと / 本文内に自然に / おまかせ / なし"],
    ["文字量", "文字量はどうする？ 短め / 標準 / 長め"],
    ["CTA", "最後の誘導はどれにする？ 文標購入 / デモを見る / 問い合わせ / なし"],
  ],
  2: [
    ["対象URLまたは記事名", "リライトする記事のURLか記事名を送って。"],
    ["目的", "目的はどれ？ 読みやすく / 売れる導線 / SEO/AIO / 古い情報修正"],
    ["画像追加", "画像は増やす？ なし / 1枚 / 3枚 / おまかせ"],
    ["画像タイプ", "画像タイプは？ アイキャッチ / 図解 / 操作イメージ / 比較表風 / おまかせ / なし"],
    ["画像の雰囲気", "画像の雰囲気は？ 文標っぽく / やわらかい / 実務寄り / シンプル / おまかせ / なし"],
    ["残したい表現", "残したい表現はある？ なければ「なし」でOK。"],
    ["消したい表現", "消したい表現はある？ なければ「なし」でOK。"],
  ],
  3: [
    ["宣伝したいもの", "宣伝したいものはどれ？ 文標 / ブログ / 記事メーカー / 980円レビュー"],
    ["投稿数", "投稿数は？ 1 / 3 / 5 / 10"],
    ["トーン", "トーンは？ やわらかめ / 強め / 実務寄り / 開発ログ風"],
    ["画像", "画像は入れる？ なし / 1枚 / カルーセル案"],
    ["画像タイプ", "画像タイプは？ アイキャッチ風 / 図解 / 操作イメージ / カルーセル構成 / おまかせ / なし"],
    ["画像の雰囲気", "画像の雰囲気は？ 文標っぽく / やわらかい / 実務寄り / シンプル / おまかせ / なし"],
    ["リンク先", "リンク先は？ トップ / 文標LP / デモ / ブログ"],
  ],
  4: [
    ["やりたいこと", "やりたいことをそのまま送って。"],
    ["目的", "目的は何？ 売上 / 分かりやすさ / SEO/AIO / デザイン / その他"],
    ["画像", "画像は必要？ なし / 1枚 / 複数"],
    ["画像の雰囲気", "画像の雰囲気は？ 文標っぽく / やわらかい / 実務寄り / シンプル / おまかせ / なし"],
  ],
};

function firstStepQuestion(number) {
  const flow = QUESTION_FLOWS[number];
  if (!flow) return "";
  return [
    `質問 1/${flow.length}`,
    flow[0][1],
    "",
    "途中でやめるなら「キャンセル」と送って。",
  ].join("\n");
}

function selectedFlowNumber(body = "") {
  const match = body.match(/<!-- line-selected-option:(\d{1,2}) -->/);
  return match ? Number(match[1]) : null;
}

function answeredFields(body = "") {
  const fields = new Set();
  for (const match of body.matchAll(/\*\*([^*]+)\*\*:\s/g)) {
    fields.add(match[1]);
  }
  return fields;
}

function nextFlowQuestion(body = "") {
  const number = selectedFlowNumber(body);
  const flow = QUESTION_FLOWS[number];
  if (!flow) return null;
  const answered = answeredFields(body);
  const index = flow.findIndex(([field]) => !answered.has(field));
  if (index === -1) return { done: true, number, flow };
  return {
    done: false,
    number,
    field: flow[index][0],
    question: flow[index][1],
    step: index + 1,
    total: flow.length,
  };
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

async function commentOnIssue(env, issueNumber, body) {
  const repo = githubRepo(env);
  return githubRequest(env, `/repos/${repo}/issues/${issueNumber}/comments`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

async function addLabelsToIssue(env, issueNumber, labels) {
  const repo = githubRepo(env);
  return githubRequest(env, `/repos/${repo}/issues/${issueNumber}/labels`, {
    method: "POST",
    body: JSON.stringify({ labels }),
  });
}

async function assignCopilotToIssue(env, issue) {
  const repo = githubRepo(env);
  await githubRequest(env, `/repos/${repo}/issues/${issue.number}/assignees`, {
    method: "POST",
    body: JSON.stringify({
      assignees: ["copilot-swe-agent[bot]"],
      agent_assignment: {
        target_repo: repo,
        base_branch: "main",
        custom_instructions: copilotInstructions(),
      },
    }),
  });
}

async function findLatestChoiceIssue(env, toId) {
  const repo = githubRepo(env);
  const issues = await githubRequest(
    env,
    `/repos/${repo}/issues?labels=line-inbox&state=open&sort=updated&direction=desc&per_page=30`,
  );
  return (issues || []).find((issue) => {
    const body = issue.body || "";
    return body.includes("<!-- line-choice-options:v1 -->") && body.includes(`LINE source: ${toId}`);
  });
}

async function issueConversationText(env, issue) {
  const repo = githubRepo(env);
  const comments = await githubRequest(env, `/repos/${repo}/issues/${issue.number}/comments?per_page=100`);
  return [
    issue.body || "",
    ...(comments || []).map((comment) => comment.body || ""),
  ].join("\n\n");
}

async function createChoiceIssue(text, toId, env) {
  const repo = githubRepo(env);
  await ensureGithubLabel(env, "line-inbox", "0e8a16", "LINEから届いた改善メモ");
  await ensureGithubLabel(env, "line-choice", "fbca04", "LINEで選択肢を返して進める相談");

  return githubRequest(env, `/repos/${repo}/issues`, {
    method: "POST",
    body: JSON.stringify({
      title: issueTitle(text).replace("LINE指示:", "LINE相談:"),
      labels: ["line-inbox", "line-choice"],
      body: [
        "LINEから届いた相談です。",
        "",
        "状態: 選択待ち",
        "",
        "```text",
        text.trim(),
        "```",
        "",
        "<!-- line-choice-options:v1 -->",
        "対応案:",
        formatChoiceOptions(false),
        "",
        "返信方法:",
        "- 数字だけ: その案をこのIssueに追記する",
        "- 追加: 4つの選択肢をもう一度出す",
        "- AI作業OK 1: 1番案でPR作成対象にする",
        "",
        `LINE source: ${toId}`,
      ].join("\n"),
    }),
  });
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
          ? "次の作業: Copilotが差分を作り、PR化する。文章・デザイン・LP・ブログ・軽い修正は自動。価格・Stripe・法務・配布物・認証まわりは確認必須。"
          : "次の作業: 必要なら `ai-work-ok` ラベルを付けてから作業する。",
      ].join("\n"),
    }),
  });

  if (!aiOk) return { issue, copilotAssigned: false, copilotError: "" };

  try {
    await assignCopilotToIssue(env, issue);
    return { issue, copilotAssigned: true, copilotError: "" };
  } catch (error) {
    console.error(error);
    await commentOnIssue(env, issue.number, [
      "Copilot coding agentへの自動割り当てに失敗しました。",
      "",
      "GitHub token permissions または Copilot coding agent の有効化状態を確認してください。",
      "",
      "必要なtoken権限: Metadata Read-only, Issues Read and write, Contents Read and write, Pull requests Read and write, Actions Read and write。",
    ].join("\n"));
    return { issue, copilotAssigned: false, copilotError: error.message };
  }
}

async function handleChoiceConversation(text, toId, env) {
  const latestIssue = await findLatestChoiceIssue(env, toId);
  const number = choiceNumber(text);

  if (!latestIssue) return null;

  if (wantsMoreChoices(text) && !wantsAiWork(text)) {
    const body = [
      "LINEでできることはこの4つです。",
      "",
      formatChoiceOptions(),
      "",
      "数字だけで選べます。PRまで進めるなら「AI作業OK 1」のように送ってください。",
    ].join("\n");
    await commentOnIssue(env, latestIssue.number, body);
    return {
      issue: latestIssue,
      mode: "選択肢",
      message: `LINEでできることはこの4つです。\n\n${formatChoiceOptions()}`,
    };
  }

  if (number) {
    const selected = optionText(number);
    if (!selected) return null;
    const followUp = followUpQuestions(number);
    await commentOnIssue(env, latestIssue.number, [
      `LINEで ${number} 番が選ばれました。`,
      "",
      `選択案: ${selected}`,
      QUESTION_FLOWS[number] ? `<!-- line-selected-option:${number} -->` : "",
      followUp ? ["", "追加確認:", followUp].join("\n") : "",
    ].join("\n"));

    if (!wantsAiWork(text)) {
      return {
        issue: latestIssue,
        mode: "選択済み",
        message: [
          `${number}番で進めます。`,
          `#${latestIssue.number} ${latestIssue.title}`,
          latestIssue.html_url,
          "",
          followUp || "PRまで進めるなら「AI作業OK」と送ってください。",
        ].join("\n"),
      };
    }
  }

  if (wantsAiWork(text)) {
    await ensureGithubLabel(env, "ai-work-ok", "1d76db", "AI作業PR作成まで進めてよい指示");
    await addLabelsToIssue(env, latestIssue.number, ["ai-work-ok"]);
    try {
      await assignCopilotToIssue(env, latestIssue);
      return {
        issue: latestIssue,
        mode: "AI作業OK",
        message: [
          "このIssueをCopilot coding agentに割り当てました。",
          `#${latestIssue.number} ${latestIssue.title}`,
          latestIssue.html_url,
        ].join("\n"),
      };
    } catch (error) {
      await commentOnIssue(env, latestIssue.number, [
        "Copilot coding agentへの自動割り当てに失敗しました。",
        "",
        "GitHub token permissions または Copilot coding agent の有効化状態を確認してください。",
      ].join("\n"));
      return {
        issue: latestIssue,
        mode: "AI作業OK",
        message: [
          "ai-work-ok ラベルは付けました。",
          "ただしCopilot割り当ては失敗しました。GitHub token権限を確認してください。",
          latestIssue.html_url,
        ].join("\n"),
      };
    }
  }

  if (!wantsChoices(text)) {
    if (text.trim() === "キャンセル") {
      await commentOnIssue(env, latestIssue.number, "LINEでキャンセルされました。");
      return {
        issue: latestIssue,
        mode: "キャンセル",
        message: "キャンセルしました。もう一度始める時は「相談」と送って。",
      };
    }

    const conversationText = await issueConversationText(env, latestIssue);
    const flowQuestion = nextFlowQuestion(conversationText);
    if (flowQuestion && !flowQuestion.done) {
      await commentOnIssue(env, latestIssue.number, [
        `**${flowQuestion.field}**: ${text.trim()}`,
      ].join("\n"));
      const nextQuestion = nextFlowQuestion(`${conversationText}\n\n**${flowQuestion.field}**: ${text.trim()}`);
      if (nextQuestion?.done) {
        return {
          issue: latestIssue,
          mode: "質問完了",
          message: [
            "必要な内容がそろいました。",
            latestIssue.html_url,
            "",
            "PRまで進めるなら「AI作業OK」と送ってください。",
          ].join("\n"),
        };
      }
      return {
        issue: latestIssue,
        mode: "質問中",
        message: [
          `質問 ${nextQuestion.step}/${nextQuestion.total}`,
          nextQuestion.question,
          "",
          "途中でやめるなら「キャンセル」と送って。",
        ].join("\n"),
      };
    }

    await commentOnIssue(env, latestIssue.number, [
      "LINEから追記されました。",
      "",
      "```text",
      text.trim(),
      "```",
    ].join("\n"));
    return {
      issue: latestIssue,
      mode: "追記",
      message: [
        `Issue #${latestIssue.number} に追記しました。`,
        latestIssue.html_url,
        "",
        "PRまで進めるなら「AI作業OK」と送ってください。",
      ].join("\n"),
    };
  }

  return null;
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
    const conversation = await handleChoiceConversation(text, toId, env);
    if (conversation) {
      await replyLine(event.replyToken, conversation.message, env);
      return;
    }

    if (wantsChoices(text)) {
      const issue = await createChoiceIssue(text, toId, env);
      await replyLine(
        event.replyToken,
        [
          "対応案を出しました。",
          "",
          formatChoiceOptions(false),
          "",
          `#${issue.number} ${issue.title}`,
          issue.html_url,
          "",
          "数字だけで選べます。PRまで進めるなら「AI作業OK 1」のように送ってください。",
        ].join("\n"),
        env,
      );
      return;
    }

    const result = await createLineIssue(text, toId, env);
    const issue = result.issue;
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
          ? result.copilotAssigned
            ? "Copilot coding agentに割り当てました。PR作成対象です。"
            : "ai-work-ok ラベル付き。ただしCopilot割り当ては失敗しました。GitHub token権限を確認してください。"
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
