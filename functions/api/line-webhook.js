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

function compactText(text) {
  return text.trim().replace(/[ 　\t\r\n。、,.!！?？:：]/g, "").toLowerCase();
}

function wantsAiWork(text, relaxed = false) {
  if (/AI作業OK|AI作業可|作業OK|PR作成OK|PRまで|ai-work-ok|作業して|実行して/i.test(text)) {
    return true;
  }
  if (!relaxed) return false;
  const compact = compactText(text);
  return /^(ok|はい|うん|お願い|おねがい|進めて|すすめて|やって|これで|それで|go|pr)$/.test(compact);
}

function wantsChoices(text) {
  return /メニュー|案を出して|選択肢|候補|どう直す|どう変える|改善したい|相談|ブログ|記事|リライト|X投稿|エックス|ツイート|note|下書き|営業下書き|営業案|投稿案|投稿したい|書きたい/i.test(text);
}

function wantsChoiceMenu(text) {
  return /メニュー|案を出して|選択肢|候補|どう直す|どう変える|改善したい|相談/i.test(text);
}

function wantsMoreChoices(text) {
  return /追加|別案|もっと|他の案/i.test(text);
}

function choiceNumber(text) {
  const aiOkMatch = text.match(/(?:AI作業OK|AI作業可|PR作成OK|PRまで|ai-work-ok)\s*(\d{1,2})?/i);
  if (aiOkMatch) return aiOkMatch[1] ? Number(aiOkMatch[1]) : null;
  const match = text.trim().match(/^(\d{1,2})(?:\s*(?:番|で|にする|お願い|おねがい|進めて|すすめて|やって|ok|OK|でOK))?$/);
  if (match) return Number(match[1]);
  const compact = compactText(text);
  if (/^(1|ブログ|記事|新規記事|ブログ記事|記事作成|新しく書く|ブログを書く|ブログ新規)$/.test(compact)) return 1;
  if (/^(2|リライト|既存ブログ|書き直し|記事修正|ブログリライト)$/.test(compact)) return 2;
  if (/^(3|x|twitter|ツイート|x投稿|投稿文|x投稿文)$/.test(compact)) return 3;
  if (/^(4|その他|相談|自由|自由入力)$/.test(compact)) return 4;
  return match ? Number(match[1]) : null;
}

function cleanInstruction(text) {
  return text
    .replace(/AI作業OK[:：]?/gi, "")
    .replace(/AI作業可[:：]?/gi, "")
    .replace(/作業OK[:：]?/gi, "")
    .replace(/PR作成OK[:：]?/gi, "")
    .replace(/作業して[:：]?/gi, "")
    .replace(/実行して[:：]?/gi, "")
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

function quickReply(items) {
  return {
    items: items.slice(0, 13).map(({ label, text }) => ({
      type: "action",
      action: {
        type: "message",
        label: label.slice(0, 20),
        text,
      },
    })),
  };
}

function menuQuickReply() {
  return quickReply([
    { label: "1 ブログ新規", text: "1" },
    { label: "2 リライト", text: "2" },
    { label: "3 X投稿", text: "3" },
    { label: "4 その他", text: "4" },
  ]);
}

function flowQuickReply(number, field, conversationText = "") {
  return quickReply(flowOptions(number, field, conversationText).map((option, index) => ({
    label: `${index + 1} ${option.short || option.value || option.label}`,
    text: String(index + 1),
  })));
}

function proceedQuickReply() {
  return quickReply([
    { label: "作業OK", text: "OK" },
    { label: "追加案", text: "追加" },
    { label: "キャンセル", text: "キャンセル" },
  ]);
}

function questionQuickReply() {
  return quickReply([
    { label: "おまかせ", text: "おまかせ" },
    { label: "なし", text: "なし" },
    { label: "キャンセル", text: "キャンセル" },
  ]);
}

function followUpQuestions(number) {
  if (QUESTION_FLOWS[number]) {
    return firstStepQuestion(number);
  }
  return "";
}

const QUESTION_FLOWS = {
  1: [
    ["記事テーマ", "記事テーマを選んで。"],
    ["読む人", "読む人を選んで。"],
    ["画像数", "画像は何個入れる？"],
    ["画像タイプ", "画像タイプを選んで。"],
    ["画像の雰囲気", "画像の雰囲気を選んで。"],
    ["画像の入れ方", "画像を入れる場所を選んで。"],
    ["文字量", "文字量を選んで。"],
    ["CTA", "最後の誘導を選んで。"],
  ],
  2: [
    ["対象URLまたは記事名", "リライトする記事を選んで。"],
    ["目的", "目的を選んで。"],
    ["画像追加", "画像は増やす？"],
    ["画像タイプ", "画像タイプを選んで。"],
    ["画像の雰囲気", "画像の雰囲気を選んで。"],
    ["残したい表現", "残したい表現を選んで。"],
    ["消したい表現", "消したい表現を選んで。"],
  ],
  3: [
    ["宣伝したいもの", "宣伝したいものを選んで。"],
    ["投稿数", "投稿数を選んで。"],
    ["トーン", "トーンを選んで。"],
    ["画像", "画像を入れる？"],
    ["画像タイプ", "画像タイプを選んで。"],
    ["画像の雰囲気", "画像の雰囲気を選んで。"],
    ["リンク先", "リンク先を選んで。"],
  ],
  4: [
    ["やりたいこと", "やりたいことを選んで。"],
    ["目的", "目的を選んで。"],
    ["画像", "画像は必要？"],
    ["画像の雰囲気", "画像の雰囲気を選んで。"],
  ],
};

const BLOG_TOPIC_PAGES = [
  [
    "AI検索時代の記事構造の作り方",
    "無料テーマと文標の違い",
    "比較記事テンプレートの使い方",
    "FAQと出典を本文に置く理由",
    "WordPressテーマ導入前チェック",
    "商品紹介記事でよくある失敗",
    "ブログカードの使い方",
    "CTAを置く場所の考え方",
    "比較表カードで違いを見せる方法",
    "文標の初期設定ガイド",
  ],
  [
    "AI文章をブログで使う時の注意点",
    "検索順位を保証しないテーマ選び",
    "ブログ初心者が最初に作る5記事",
    "FAQ記事の書き方",
    "レビュー記事の型と注意点",
    "ランキング記事で誤解を減らす方法",
    "出典リンクの置き方",
    "内部リンクを増やす前に見ること",
    "WordPressを軽く保つ考え方",
    "文標の導線確認で見る数字",
  ],
  [
    "小さなサービスLPをWordPressで作る流れ",
    "アフィリエイト記事の比較表設計",
    "ブログで売り込みすぎないCTAの作り方",
    "AI検索時代の著者情報の見せ方",
    "古い記事を直す順番",
    "スマホで読みやすい記事構成",
    "構造化データを入れすぎない考え方",
    "WordPressテーマ変更前のバックアップ",
    "文標で作る商品紹介記事",
    "記事公開前チェックリスト",
  ],
];

const FIELD_OPTIONS = {
  "読む人": ["WordPress初心者", "個人事業主", "比較記事を書く人", "アフィリエイト初心者", "小さなサービス販売者", "ブログ再開組", "AI文章を使う人", "サイトを軽くしたい人", "FAQを増やしたい人", "おまかせ"],
  "画像数": ["0枚", "1枚", "3枚", "5枚", "おまかせ"],
  "画像タイプ": ["アイキャッチ", "図解", "操作イメージ", "比較表風", "カード風", "おまかせ", "なし"],
  "画像の雰囲気": ["文標っぽく", "やわらかい", "実務寄り", "シンプル", "明るめ", "落ち着き", "おまかせ", "なし"],
  "画像の入れ方": ["冒頭だけ", "セクションごと", "本文内に自然に", "最後にまとめ", "おまかせ", "なし"],
  "文字量": ["短め", "標準", "長め", "かなり詳しく", "おまかせ"],
  "CTA": ["文標購入", "デモを見る", "インストール方法", "問い合わせ", "ブログ一覧", "なし"],
  "対象URLまたは記事名": ["文標導入前チェック", "無料テーマと文標の違い", "AI検索向けFAQと出典", "比較記事テンプレート", "商品ページ失敗例", "記事メーカーの使い方", "980円レビューサンプル", "ブログ一覧から選ぶ", "おまかせ", "その他URL入力"],
  "目的": ["売上", "分かりやすさ", "SEO/AIO", "デザイン", "古い情報修正", "読みやすく", "導線改善", "おまかせ"],
  "画像追加": ["なし", "1枚", "3枚", "おまかせ"],
  "残したい表現": ["今の見出し", "価格訴求", "AI検索時代の表現", "文標の名前", "やわらかい文体", "なし", "その他入力"],
  "消したい表現": ["強すぎる効果保証", "売り手目線", "古い商品名", "長すぎる説明", "なし", "その他入力"],
  "宣伝したいもの": ["文標", "ブログ", "記事メーカー", "980円レビュー", "アフィリエイト", "今日の更新", "おまかせ"],
  "投稿数": ["1投稿", "3投稿", "5投稿", "10投稿", "スレッド案", "おまかせ"],
  "トーン": ["やわらかめ", "強め", "実務寄り", "開発ログ風", "短く", "共感寄り", "おまかせ"],
  "画像": ["なし", "1枚", "3枚", "カルーセル案", "おまかせ"],
  "リンク先": ["トップ", "文標LP", "デモ", "インストール方法", "ブログ", "問い合わせ", "おまかせ"],
  "やりたいこと": ["サイト修正", "文標テーマ修正", "ブログ相談", "X投稿相談", "売り方相談", "不具合確認", "速度/SEO確認", "その他入力"],
};

function optionPage(body, field) {
  let page = 1;
  for (const match of body.matchAll(/<!-- line-option-page:([^:]+):(\d+) -->/g)) {
    if (match[1] === field) page = Number(match[2]) || 1;
  }
  return page;
}

function optionLabel(value) {
  return String(value).replace(/[。、「」]/g, "").slice(0, 14);
}

function flowOptions(number, field, conversationText = "") {
  if (number === 1 && field === "記事テーマ") {
    const page = optionPage(conversationText, field);
    const topics = BLOG_TOPIC_PAGES[(page - 1) % BLOG_TOPIC_PAGES.length];
    return [
      ...topics.map((topic) => ({ value: topic, short: optionLabel(topic) })),
      { value: "別案を10個見る", short: "別案10個", action: "more" },
      { value: "その他入力", short: "その他入力", action: "custom" },
      { value: "キャンセル", short: "キャンセル", action: "cancel" },
    ];
  }

  const values = FIELD_OPTIONS[field] || ["おまかせ", "その他入力"];
  const items = values.map((value) => {
    const action = /その他|入力/.test(value) ? "custom" : "";
    return { value, short: optionLabel(value), action };
  });
  return [...items, { value: "キャンセル", short: "キャンセル", action: "cancel" }];
}

function formatNumberedOptions(options) {
  return options.map((option, index) => `${index + 1}. ${option.value}`).join("\n");
}

function formatFlowQuestion(number, field, question, step, total, conversationText = "") {
  const options = flowOptions(number, field, conversationText);
  return [
    `質問 ${step}/${total}`,
    question,
    "",
    formatNumberedOptions(options),
    "",
    "番号だけで選べます。",
  ].join("\n");
}

function firstStepQuestion(number) {
  const flow = QUESTION_FLOWS[number];
  if (!flow) return "";
  return formatFlowQuestion(number, flow[0][0], flow[0][1], 1, flow.length);
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

function awaitingCustomField(body, field) {
  return body.includes(`<!-- line-await-custom:${field} -->`) && !answeredFields(body).has(field);
}

function selectedFlowAnswer(text, flowQuestion, conversationText) {
  if (awaitingCustomField(conversationText, flowQuestion.field)) {
    return { value: text.trim(), action: "" };
  }

  const options = flowOptions(flowQuestion.number, flowQuestion.field, conversationText);
  const match = text.trim().match(/^(\d{1,2})(?:\s*(?:番|で|にする|お願い|おねがい|進めて|すすめて|やって|ok|OK|でOK))?$/);
  if (match) {
    const index = Number(match[1]) - 1;
    return options[index] || null;
  }

  const compact = compactText(text);
  return options.find((option) => compactText(option.value) === compact || compactText(option.short || "") === compact) || null;
}

async function answerFlowQuestion(env, issue, flowQuestion, text, conversationText) {
  const selected = selectedFlowAnswer(text, flowQuestion, conversationText);
  if (!selected) {
    return {
      issue,
      mode: "質問中",
      message: formatFlowQuestion(flowQuestion.number, flowQuestion.field, flowQuestion.question, flowQuestion.step, flowQuestion.total, conversationText),
      quickReply: flowQuickReply(flowQuestion.number, flowQuestion.field, conversationText),
    };
  }

  if (selected.action === "cancel") {
    await commentOnIssue(env, issue.number, "LINEでキャンセルされました。");
    return {
      issue,
      mode: "キャンセル",
      message: "キャンセルしました。もう一度始める時はメニューから選んで。",
      quickReply: menuQuickReply(),
    };
  }

  if (selected.action === "more") {
    const nextPage = optionPage(conversationText, flowQuestion.field) + 1;
    const nextText = `${conversationText}\n<!-- line-option-page:${flowQuestion.field}:${nextPage} -->`;
    await commentOnIssue(env, issue.number, [
      `LINEで ${flowQuestion.field} の別案が選ばれました。`,
      `<!-- line-option-page:${flowQuestion.field}:${nextPage} -->`,
    ].join("\n"));
    return {
      issue,
      mode: "別案",
      message: formatFlowQuestion(flowQuestion.number, flowQuestion.field, flowQuestion.question, flowQuestion.step, flowQuestion.total, nextText),
      quickReply: flowQuickReply(flowQuestion.number, flowQuestion.field, nextText),
    };
  }

  if (selected.action === "custom") {
    await commentOnIssue(env, issue.number, `<!-- line-await-custom:${flowQuestion.field} -->`);
    return {
      issue,
      mode: "自由入力待ち",
      message: `${flowQuestion.field}を自由に送って。`,
      quickReply: quickReply([{ label: "キャンセル", text: "キャンセル" }]),
    };
  }

  await commentOnIssue(env, issue.number, [
    `**${flowQuestion.field}**: ${selected.value}`,
  ].join("\n"));
  const nextConversationText = `${conversationText}\n\n**${flowQuestion.field}**: ${selected.value}`;
  const nextQuestion = nextFlowQuestion(nextConversationText);
  if (nextQuestion?.done) {
    return {
      issue,
      mode: "質問完了",
      message: [
        "必要な内容がそろいました。",
        issue.html_url,
        "",
        "PRまで進めるなら「OK」「進めて」「お願い」のどれかで大丈夫です。",
      ].join("\n"),
      quickReply: proceedQuickReply(),
    };
  }
  return {
    issue,
    mode: "質問中",
    message: formatFlowQuestion(nextQuestion.number, nextQuestion.field, nextQuestion.question, nextQuestion.step, nextQuestion.total, nextConversationText),
    quickReply: flowQuickReply(nextQuestion.number, nextQuestion.field, nextConversationText),
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

async function findLatestLineIssue(env, toId) {
  const repo = githubRepo(env);
  const issues = await githubRequest(
    env,
    `/repos/${repo}/issues?labels=line-inbox&state=open&sort=updated&direction=desc&per_page=30`,
  );
  return (issues || []).find((issue) => (issue.body || "").includes(`LINE source: ${toId}`));
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
        "- ボタン / 数字だけ: その案をこのIssueに追記する",
        "- 追加: 4つの選択肢をもう一度出す",
        "- OK / 進めて / お願い: PR作成対象にする",
        "- AI作業OK 1: 1番案でPR作成対象にすることもできます",
        "",
        `LINE source: ${toId}`,
      ].join("\n"),
    }),
  });
}

async function startChoiceIssueWithSelection(text, toId, env, number) {
  const issue = await createChoiceIssue(text || "LINEメニュー", toId, env);
  const selected = optionText(number);
  const followUp = followUpQuestions(number);
  await commentOnIssue(env, issue.number, [
    `LINEで ${number} 番が選ばれました。`,
    "",
    `選択案: ${selected}`,
    QUESTION_FLOWS[number] ? `<!-- line-selected-option:${number} -->` : "",
    followUp ? ["", "追加確認:", followUp].join("\n") : "",
  ].join("\n"));
  return { issue, selected, followUp };
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
  const aiWork = wantsAiWork(text, true);

  if (!latestIssue) return null;

  const conversationText = await issueConversationText(env, latestIssue);
  const flowQuestion = nextFlowQuestion(conversationText);

  if (text.trim() === "キャンセル") {
    await commentOnIssue(env, latestIssue.number, "LINEでキャンセルされました。");
    return {
      issue: latestIssue,
      mode: "キャンセル",
      message: "キャンセルしました。もう一度始める時はメニューから選んで。",
      quickReply: menuQuickReply(),
    };
  }

  if (flowQuestion && !flowQuestion.done && !aiWork) {
    return answerFlowQuestion(env, latestIssue, flowQuestion, text, conversationText);
  }

  if (wantsMoreChoices(text) && !aiWork) {
    const body = [
      "LINEでできることはこの4つです。",
      "",
      formatChoiceOptions(),
      "",
      "ボタンか数字だけで選べます。PRまで進めるなら「OK」「進めて」「お願い」でも通ります。",
    ].join("\n");
    await commentOnIssue(env, latestIssue.number, body);
    return {
      issue: latestIssue,
      mode: "選択肢",
      message: `LINEでできることはこの4つです。\n\n${formatChoiceOptions()}`,
      quickReply: menuQuickReply(),
    };
  }

  if (number && !flowQuestion) {
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

    if (!aiWork) {
      return {
        issue: latestIssue,
        mode: "選択済み",
        message: [
          `${number}番で進めます。`,
          `#${latestIssue.number} ${latestIssue.title}`,
          latestIssue.html_url,
          "",
          followUp || "PRまで進めるなら「OK」「進めて」「お願い」のどれかで大丈夫です。",
        ].join("\n"),
        quickReply: followUp ? flowQuickReply(number, QUESTION_FLOWS[number][0][0]) : proceedQuickReply(),
      };
    }
  }

  if (aiWork) {
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

  if (!wantsChoiceMenu(text)) {
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
        "PRまで進めるなら「OK」「進めて」「お願い」のどれかで大丈夫です。",
      ].join("\n"),
      quickReply: proceedQuickReply(),
    };
  }

  return null;
}

async function replyLine(replyToken, message, env, quickReplyPayload = null) {
  const token = lineToken(env);
  if (!replyToken || !token) return;

  const lineMessage = { type: "text", text: message.slice(0, 5000) };
  if (quickReplyPayload) {
    lineMessage.quickReply = quickReplyPayload;
  }

  await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      replyToken,
      messages: [lineMessage],
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
      await replyLine(event.replyToken, conversation.message, env, conversation.quickReply || null);
      return;
    }

    if (wantsAiWork(text, true)) {
      const latestIssue = await findLatestLineIssue(env, toId);
      if (latestIssue) {
        await ensureGithubLabel(env, "ai-work-ok", "1d76db", "AI作業PR作成まで進めてよい指示");
        await addLabelsToIssue(env, latestIssue.number, ["ai-work-ok"]);
        try {
          await assignCopilotToIssue(env, latestIssue);
          await replyLine(
            event.replyToken,
            [
              "このIssueをCopilot coding agentに割り当てました。",
              `#${latestIssue.number} ${latestIssue.title}`,
              latestIssue.html_url,
            ].join("\n"),
            env,
          );
        } catch (error) {
          console.error(error);
          await replyLine(
            event.replyToken,
            [
              "ai-work-ok ラベルは付けました。",
              "ただしCopilot割り当ては失敗しました。GitHub token権限を確認してください。",
              latestIssue.html_url,
            ].join("\n"),
            env,
          );
        }
        return;
      }
    }

    const directNumber = choiceNumber(text);
    if (directNumber && optionText(directNumber)) {
      const { issue, followUp } = await startChoiceIssueWithSelection(text, toId, env, directNumber);
      await replyLine(
        event.replyToken,
        [
          `${directNumber}番で始めます。`,
          `#${issue.number} ${issue.title}`,
          issue.html_url,
          "",
          followUp || "PRまで進めるなら「OK」「進めて」「お願い」のどれかで大丈夫です。",
        ].join("\n"),
        env,
        followUp ? flowQuickReply(directNumber, QUESTION_FLOWS[directNumber][0][0]) : proceedQuickReply(),
      );
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
          "ボタンか数字だけで選べます。PRまで進めるなら「OK」「進めて」「お願い」でも大丈夫です。",
        ].join("\n"),
        env,
        menuQuickReply(),
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
          : "PRまで進めたい時は、次の返信で「OK」「進めて」「お願い」のどれかを送ってください。",
      ].join("\n"),
      env,
      proceedQuickReply(),
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
