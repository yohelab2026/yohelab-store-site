const PERPLEXITY_URL = "https://api.perplexity.ai/search";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_MODEL = "claude-sonnet-4-20250514";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestPost(context) {
  try {
    const body = await readJsonBody(context.request);
    const action = String(body?.action || "").trim();

    if (action === "search") {
      return await handleSearch(body, context.env);
    }

    if (action === "generate") {
      return await handleGenerate(body, context.env);
    }

    return json({ error: "unknown_action" }, 400);
  } catch (error) {
    return json({ error: error?.message || "unexpected_error" }, 500);
  }
}

async function handleSearch(body, env) {
  const apiKey = (env.PERPLEXITY_API_KEY || "").trim();
  if (!apiKey) return json({ error: "PERPLEXITY_API_KEY is not configured" }, 500);

  const keywords = normalizeKeywords(body?.keywords);
  if (!keywords.length) return json({ error: "keywords_required" }, 400);

  const queryList = buildQueries(keywords);
  const response = await fetch(PERPLEXITY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: queryList,
      max_results: 20,
      max_tokens_per_page: 1024,
      search_recency_filter: "month",
      search_language_filter: ["ja"],
      country: "JP",
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    return json({ error: `perplexity_search_failed: ${response.status}`, detail: text }, response.status);
  }

  const data = await response.json();
  const results = normalizeSearchResults(data);

  return json({
    query: queryList,
    results,
  });
}

async function handleGenerate(body, env) {
  const apiKey = (env.ANTHROPIC_API_KEY || "").trim();
  if (!apiKey) return json({ error: "ANTHROPIC_API_KEY is not configured" }, 500);

  const keywords = normalizeKeywords(body?.keywords);
  const selectedResults = Array.isArray(body?.selectedResults) ? body.selectedResults : [];
  if (!keywords.length || !selectedResults.length) {
    return json({ error: "selected_results_required" }, 400);
  }

  const tone = String(body?.tone || "丁寧").trim();
  const audience = String(body?.audience || "note / ブログ / クラウドワークスのライター").trim();
  const length = String(body?.length || "3000").trim();
  const seoMode = Boolean(body?.seoMode);
  const angle = String(body?.angle || "").trim();
  const avoid = String(body?.avoid || "").trim();

  const system = `あなたはプロのWebライターです。
以下の情報をもとに、自然で読みやすい日本語の記事を作成してください。

# 重要
- 選ばれた情報だけを主材料にする
- 人間が書いたような自然な文章にする
- AIっぽい表現は禁止
- 冗長な言い回しを避ける
- 事実を勝手に追加しない
- 不明なことは断定しない
- 文章は読みやすさを最優先する
- 接続詞を不自然に連打しない
- 同じ語尾を続けすぎない

# 出力構成
【タイトル案】
3案
【導入文】
100〜200文字
【見出し構成】
H2・H3で整理
【本文】
${length}字前後
【まとめ】
簡潔に
【SNS投稿用テキスト】
120文字程度
${seoMode ? `
【SEOタイトル】
1行
【メタディスクリプション】
1〜2文
` : ""}

# 文章の方向性
- 読者に語りかける自然さを出す
- 調べた情報をそのまま並べず、流れを作る
- 読み物として整える
- ユーザーがそのまま使いやすい形で出す`;

  const user = `# キーワード
${keywords.join(" / ")}

# 想定読者
${audience}

# 文体
${tone}

# 記事の狙い
${angle || "最新情報を調べて、そのまま使える記事にする"}

# 避けたいこと
${avoid || "特になし"}

# 参考にする情報
${selectedResults
  .map((item, index) => {
    const lines = [
      `${index + 1}. ${item.title || "無題"}`,
      item.summary ? `要約: ${item.summary}` : "",
      item.url ? `URL: ${item.url}` : "",
      item.source ? `掲載元: ${item.source}` : "",
      item.date ? `更新日: ${item.date}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    return lines;
  })
  .join("\n\n")}

上の情報だけを材料に、自然で人間らしい記事を書いてください。`;

  const response = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: seoMode ? 3600 : 3200,
      temperature: 0.7,
      system,
      messages: [
        {
          role: "user",
          content: user,
        },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    return json({ error: `anthropic_generation_failed: ${response.status}`, detail: text }, response.status);
  }

  const data = await response.json();
  const result = extractText(data);

  return json({
    result,
    model: ANTHROPIC_MODEL,
  });
}

function normalizeKeywords(value) {
  const list = Array.isArray(value)
    ? value
    : String(value || "")
        .split(/[\n,、]/)
        .map((part) => part.trim());
  return list.filter(Boolean).slice(0, 3);
}

function buildQueries(keywords) {
  const base = keywords.join(" ");
  const queries = [
    `${base} 最新 情報 日本`,
    `${base} 事例 比較 日本`,
    `${base} トレンド まとめ 日本`,
  ];
  return [...new Set(queries.filter(Boolean))];
}

function normalizeSearchResults(data) {
  const raw = Array.isArray(data?.results) ? data.results : [];
  const seen = new Set();
  const normalized = [];

  for (const item of raw) {
    const url = String(item?.url || "").trim();
    const title = String(item?.title || "").trim();
    const key = url || title;
    if (!key || seen.has(key)) continue;
    seen.add(key);

    let source = "";
    try {
      source = url ? new URL(url).hostname.replace(/^www\./, "") : "";
    } catch {
      source = "";
    }

    normalized.push({
      key,
      title,
      url,
      summary: String(item?.snippet || "").trim(),
      source,
      date: String(item?.last_updated || item?.date || "").trim(),
    });
  }

  return normalized;
}

function extractText(data) {
  const blocks = Array.isArray(data?.content) ? data.content : [];
  return blocks
    .map((block) => (block && typeof block.text === "string" ? block.text : ""))
    .join("")
    .trim();
}

async function readJsonBody(request) {
  const text = await request.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...CORS_HEADERS,
    },
  });
}
