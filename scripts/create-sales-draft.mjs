const token = process.env.GITHUB_TOKEN || "";
const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN || "";
const lineTo = process.env.LINE_TO || process.env.LINE_USER_ID || process.env.LINE_GROUP_ID || "";
const repo = process.env.GITHUB_REPOSITORY || "yohelab2026/yohelab-store-site";
const dryRun = process.env.SALES_DRAFT_DRY_RUN === "1" || process.argv.includes("--dry-run");
const inputMode = process.env.SALES_DRAFT_MODE || process.argv.find((arg) => arg.startsWith("--mode="))?.split("=")[1] || "auto";

const apiBase = "https://api.github.com";
const productUrl = "https://yohelab.com/lp/bunsirube/";
const demoUrl = "https://yohelab.com/lp/bunsirube/demo/";
const installUrl = "https://yohelab.com/lp/bunsirube/install/";
const affiliateUrl = "https://yohelab.com/lp/bunsirube/affiliate/";

const topics = [
  {
    key: "ai-structure",
    theme: "AI検索時代の記事構造",
    audience: "比較記事やレビュー記事を書きたい個人ブロガー",
    angle: "AI表示の保証ではなく、本文を読み取りやすく整える考え方",
    blogTitle: "AI検索時代の記事構造とは？WordPressで本文・FAQ・出典を整える考え方",
    noteTitle: "AI検索時代に、ブログ記事の型を先に決める理由",
    imagePrompt: "白背景のWordPress記事画面に、結論、根拠、FAQ、CTAの4つのカードが並ぶシンプルな図解",
  },
  {
    key: "comparison-post",
    theme: "比較記事の作り方",
    audience: "商品紹介・アフィリエイト記事を書きたい人",
    angle: "比較表、向いている人、注意点、CTAを先に置く",
    blogTitle: "比較記事の書き方：商品名・価格・違い・CTAを迷わず並べる型",
    noteTitle: "比較記事で迷わないための、最初の見出しセット",
    imagePrompt: "3つの商品カードが横並びで、価格、特徴、向いている人、ボタンが見える図解",
  },
  {
    key: "faq-jsonld",
    theme: "FAQと構造化データ",
    audience: "SEOプラグインやFAQの扱いで迷っているWordPressユーザー",
    angle: "表示内容と一致したFAQを本文に置く",
    blogTitle: "FAQを記事に入れる理由：読者にもAIにも質問と答えを伝えやすくする",
    noteTitle: "FAQは飾りじゃなく、記事の不安を先に消す場所",
    imagePrompt: "読者の質問吹き出しと、記事本文内のFAQカードがつながるやわらかい図解",
  },
  {
    key: "free-theme-difference",
    theme: "無料テーマと文標の違い",
    audience: "Cocoonなどの無料テーマで十分か迷っている人",
    angle: "無料テーマと正面勝負せず、記事の型で選ぶ",
    blogTitle: "無料テーマと文標の違い：デザインより記事の型を先に整えたい人へ",
    noteTitle: "無料テーマで十分な人、文標が向いている人",
    imagePrompt: "無料テーマの多機能ボックスと、文標の記事型ボックスを左右比較した図解",
  },
  {
    key: "route-check",
    theme: "CTAと導線確認",
    audience: "記事を書いてもクリックされているか分からない人",
    angle: "書いて終わりにせず、CTA・比較表・広告リンクのクリックを小さく見る",
    blogTitle: "CTAは置いて終わりではない：WordPress内で導線を小さく確認する考え方",
    noteTitle: "ブログ記事の最後に、次の行動を置けているか",
    imagePrompt: "記事末尾のCTAボタンから、クリック数の小さな管理画面へ線が伸びる図解",
  },
  {
    key: "install-safe",
    theme: "文標の導入前チェック",
    audience: "WordPressテーマを買う前に失敗したくない人",
    angle: "対応環境、バックアップ、SEO重複、キャッシュ重複を先に見る",
    blogTitle: "WordPressテーマを入れる前に確認すること：バックアップ・SEO・キャッシュ",
    noteTitle: "テーマ導入で怖いのは、機能より事故。先に見る場所まとめ",
    imagePrompt: "チェックリスト形式で、バックアップ、PHP、SEO、キャッシュ、子テーマが並ぶ画面",
  },
  {
    key: "affiliate-shelf",
    theme: "アフィリエイトで棚を増やす",
    audience: "文標を紹介したいブロガー・制作者",
    angle: "DM営業ではなく、記事やnoteに置いてもらう導線を作る",
    blogTitle: "文標アフィリエイトの使い方：紹介記事に置きやすいポイント",
    noteTitle: "DMしない販売。文標をブログの棚に置いてもらう考え方",
    imagePrompt: "小さな棚にWordPressテーマの箱が置かれ、複数のブログへ矢印が伸びる図解",
  },
];

const modeMap = {
  morning: {
    label: "朝",
    lead: "今日はブログかnoteに置く下書きを作る日。",
    focus: "ブログ / note",
  },
  noon: {
    label: "昼",
    lead: "昼はXに短く出して、LPへの入口を増やす。",
    focus: "X",
  },
  evening: {
    label: "夜",
    lead: "夜は1日の投稿を使い回して、明日の下書きに残す。",
    focus: "再利用 / 追記",
  },
  daily: {
    label: "日次",
    lead: "今日の無人販売用の下書きをまとめる。",
    focus: "X / note / ブログ",
  },
};

function getJstParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    weekday: parts.weekday,
    ymd: `${parts.year}-${parts.month}-${parts.day}`,
  };
}

function resolveMode() {
  if (modeMap[inputMode]) return inputMode;
  const hour = new Date().getUTCHours();
  if (hour === 23) return "morning";
  if (hour === 3) return "noon";
  if (hour === 9) return "evening";
  return "daily";
}

function pickTopic(dateParts, mode) {
  const seed = Number(dateParts.year + dateParts.month + dateParts.day) + Object.keys(modeMap).indexOf(mode);
  return topics[seed % topics.length];
}

function buildXPosts(topic) {
  return [
    `WordPressテーマ選びで迷うなら、最初に見るのはデザインより「記事の型」でもいい。\n\n文標は、比較記事・レビュー記事・FAQ記事を、短い答え、根拠、出典、CTAまで整えながら書き始めるための軽量テーマです。\n${productUrl}`,
    `AI検索時代の記事で大事なのは、裏技より本文の分かりやすさ。\n\n結論、根拠、FAQ、比較表、CTAを本文に見える形で置く。\n文標はその流れをWordPress側で作りやすくしています。\n\n※AI表示や検索順位を保証するものではありません。\n${demoUrl}`,
    `${topic.theme}で今日1つだけ直すなら、記事の最後に「次に何をしてほしいか」を置くこと。\n\n読まれて終わりではなく、CTA・比較表・広告リンクのクリックを小さく確認できると、次の記事も直しやすい。\n${productUrl}`,
  ];
}

function buildBody(topic, mode, dateParts) {
  const modeInfo = modeMap[mode];
  const xPosts = buildXPosts(topic);

  return [
    `# 営業下書き ${dateParts.ymd} ${modeInfo.label}: ${topic.theme}`,
    "",
    "このIssueは自動営業マンが作った下書きです。自動投稿はしません。",
    "X、note、ブログへ出す前に、人間の目で確認してください。",
    "",
    "## 今日の狙い",
    `- 対象: ${topic.audience}`,
    `- 切り口: ${topic.angle}`,
    `- 重点: ${modeInfo.focus}`,
    `- 方針: ${modeInfo.lead}`,
    "",
    "## X投稿案",
    ...xPosts.flatMap((post, index) => [`### 案${index + 1}`, post, ""]),
    "## note下書き案",
    `### タイトル`,
    topic.noteTitle,
    "",
    "### 構成",
    "- なぜ今この話が必要か",
    "- よくある迷い",
    "- 文標でどう短くできるか",
    "- デモで確認できること",
    "- 最後に購入ページへ案内",
    "",
    "## ブログ下書き案",
    `### タイトル`,
    topic.blogTitle,
    "",
    "### 見出し案",
    "- 結論: 何を整えるべきか",
    "- 読者がつまずきやすいところ",
    "- 文標で使える記事型・FAQ・比較表・CTA",
    "- 注意点: AI表示や検索順位の保証ではない",
    "- 次に見るページ",
    "",
    "### 画像案",
    `- アイキャッチ: ${topic.imagePrompt}`,
    "- 本文図解: 結論 → 根拠 → FAQ → CTA の流れを1枚で見せる",
    "- alt案: 文標で記事構造を整える流れの図解",
    "",
    "## 置くリンク",
    `- 文標LP: ${productUrl}`,
    `- デモ: ${demoUrl}`,
    `- インストール方法: ${installUrl}`,
    `- アフィリエイト: ${affiliateUrl}`,
    "",
    "## 投稿前チェック",
    "- `AI検索に出る`、`必ず売れる`、`順位が上がる` とは書かない",
    "- `AI検索時代の記事構造`、`読み取りやすい本文構造` はOK",
    "- Google AI Overviews等への表示を保証するものではありません",
    "- 価格、返金、法務、Stripeリンクは変更しない",
    "- 公開前にスマホで読みにくくないか見る",
    "",
    "## LINEで続けるとき",
    "- `AI作業OK この下書きをブログ用に整えて` と送れば、PR作成対象にできます",
    "- `これは使わない` と送れば、10日後の自動整理対象のままでOKです",
  ].join("\n");
}

function buildLineMessage(issueUrl, topic, mode, dateParts) {
  const modeInfo = modeMap[mode];
  return [
    "よへラボ 自動営業マン",
    "",
    `${dateParts.ymd} ${modeInfo.label}の投稿案を保存しました。`,
    `テーマ: ${topic.theme}`,
    `おすすめ: ${modeInfo.focus}`,
    "",
    "今日やるなら:",
    "1. X投稿案を1つ出す",
    "2. noteかブログへ下書きを移す",
    "3. 最後に文標LPへ案内する",
    "",
    `下書きIssue:\n${issueUrl}`,
    "",
    "自動投稿はしていません。公開前に確認してください。",
  ].join("\n");
}

async function github(path, init = {}) {
  if (!token) throw new Error("GITHUB_TOKEN is not configured.");
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API failed: ${response.status} ${body}`);
  }
  return response.status === 204 ? null : response.json();
}

async function ensureLabel(name, color, description) {
  try {
    await github(`/repos/${repo}/labels/${encodeURIComponent(name)}`);
  } catch {
    await github(`/repos/${repo}/labels`, {
      method: "POST",
      body: JSON.stringify({ name, color, description }),
    });
  }
}

async function createIssue(title, body) {
  const labels = ["sales-draft", "line-inbox", "auto-sales"];
  await ensureLabel("sales-draft", "2f81f7", "自動営業マンが保存した投稿下書き");
  await ensureLabel("auto-sales", "f9d0c4", "X/note/blog向けの営業下書き");
  const issue = await github(`/repos/${repo}/issues`, {
    method: "POST",
    body: JSON.stringify({ title, body, labels }),
  });
  return issue;
}

async function sendLine(message) {
  if (!lineToken || !lineTo) {
    console.log("LINE notification skipped: LINE_CHANNEL_ACCESS_TOKEN and LINE_TO are not configured.");
    console.log(message);
    return;
  }

  const response = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lineToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: lineTo,
      messages: [{ type: "text", text: message.slice(0, 5000) }],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`LINE push failed: ${response.status} ${body}`);
  }
}

const dateParts = getJstParts();
const mode = resolveMode();
const modeInfo = modeMap[mode];
const topic = pickTopic(dateParts, mode);
const title = `営業下書き ${dateParts.ymd} ${modeInfo.label}: ${topic.theme}`;
const body = buildBody(topic, mode, dateParts);

if (dryRun) {
  console.log(JSON.stringify({
    ok: true,
    dryRun: true,
    mode,
    title,
    bodyPreview: body.slice(0, 1200),
  }, null, 2));
  process.exit(0);
}

const issue = await createIssue(title, body);
await sendLine(buildLineMessage(issue.html_url, topic, mode, dateParts));

console.log(JSON.stringify({
  ok: true,
  mode,
  issue: issue.html_url,
}, null, 2));
