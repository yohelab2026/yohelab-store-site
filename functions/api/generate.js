const GEMINI_MODEL = "gemini-1.5-flash";

const SYSTEM_PROMPTS = {
  proposal: `あなたはフリーランスの応募文を書く専門家です。
クライアントへの応募文を、自然でプロフェッショナルな日本語で書いてください。
300〜400字程度で、以下の条件を守ること：
- 押しつけがましくない
- 実績をさりげなく盛り込む
- 相手の課題を理解していることが伝わる
- 最後に次のアクションを促す一文を入れる`,

  x_post: `あなたはフリーランス・個人事業主向けのSNSマーケティングの専門家です。
Xの投稿文を3本、日本語で作成してください。
各投稿は以下の条件を守ること：
- 140字以内
- 最初の1文でフォロワーの興味を引く
- 具体的な数字や事例を入れる
- ハッシュタグは1〜2個まで
- 番号（1. 2. 3.）をつけて出力する`,

  x_reply: `あなたはフリーランス・個人事業主向けのSNSマーケティングの専門家です。
Xの返信文を3パターン、日本語で作成してください。
各返信は以下の条件を守ること：
- 50〜80字程度
- 自然な会話調
- 相手の投稿内容に共感しつつ自分の視点を加える
- 番号（1. 2. 3.）をつけて出力する`,

  ec_description: `あなたはECサイトの商品説明文を書く専門家です。
商品説明文を3パターン、日本語で作成してください。
各パターンは以下の条件を守ること：
- 150〜200字程度
- トーンが異なる（例：丁寧・親しみやすい・高級感）
- 商品の特徴・メリットを具体的に伝える
- 購買意欲を高めるクロージング文を入れる
- 番号（1. 2. 3.）をつけて出力する`,

  ec_qa: `あなたはECサイトのQ&A作成の専門家です。
商品に関するよくある質問と回答を5セット、日本語で作成してください。
各Q&Aは以下の条件を守ること：
- 購入前の不安を解消する質問を選ぶ
- 回答は簡潔で明確（50〜100字）
- Q: A: の形式で出力する`,

  aio: `あなたはSEOとWebサイト改善の専門家です。
入力されたサイト情報を分析して、改善提案を日本語で出力してください。
以下の形式で出力すること：

【総合スコア】XX/100

【改善すべき点】
1. （具体的な問題点と改善方法）
2. （具体的な問題点と改善方法）
3. （具体的な問題点と改善方法）

【見出し叩き台】
- H1: （提案）
- H2: （提案）× 3本

【FAQ案】
Q: （質問）
A: （回答）
を3セット`,
};

function buildUserPrompt(tool, data) {
  switch (tool) {
    case "proposal":
      return `案件名・内容：${data.project}
クライアントの課題・ニーズ：${data.needs}
自分の強み・実績：${data.strength}
文体トーン：${data.tone}
締めの一文スタイル：${data.close}

上記をもとに応募文を作成してください。`;

    case "x_post":
      return `発信テーマ：${data.theme}
ターゲット：${data.target}
伝えたいこと：${data.message}
トーン：${data.tone}

上記をもとにX投稿文を3本作成してください。`;

    case "x_reply":
      return `返信する投稿の内容：${data.original}
自分のキャラクター・立場：${data.character}
トーン：${data.tone}

上記をもとに返信文を3パターン作成してください。`;

    case "ec_description":
      return `商品名：${data.productName}
商品カテゴリ：${data.category}
主な特徴：${data.features}
ターゲット：${data.target}

上記をもとに商品説明文を3パターン作成してください。`;

    case "ec_qa":
      return `商品名：${data.productName}
商品カテゴリ：${data.category}
主な特徴：${data.features}

上記をもとに購入前Q&Aを5セット作成してください。`;

    case "aio":
      return `サイトURL・名称：${data.siteUrl}
サイトの目的：${data.purpose}
ターゲット：${data.target}
現在の課題（任意）：${data.issues || "特になし"}

上記をもとにSEO・サイト改善提案を出力してください。`;

    default:
      throw new Error(`Unknown tool: ${tool}`);
  }
}

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
    const apiKey = context.env.GEMINI_API_KEY;
    if (!apiKey) {
      return json200({ result: "[DEBUG] APIキー未設定" });
    }

    let body;
    try { body = await context.request.json(); }
    catch { return json200({ result: "[DEBUG] リクエストのJSONパース失敗" }); }

    const { tool, data } = body || {};
    if (!tool || !data) return json200({ result: "[DEBUG] tool/dataが未指定" });

    const systemPrompt = SYSTEM_PROMPTS[tool];
    if (!systemPrompt) return json200({ result: `[DEBUG] 不明なtool: ${tool}` });

    let userPrompt;
    try { userPrompt = buildUserPrompt(tool, data); }
    catch (e) { return json200({ result: `[DEBUG] promptビルドエラー: ${e.message}` }); }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
    let response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 800 },
        }),
      });
    } catch (e) {
      return json200({ result: `[DEBUG] Gemini fetchエラー: ${e.message}` });
    }

    if (!response.ok) {
      const err = await response.text();
      return json200({ result: `[DEBUG] Gemini HTTPエラー ${response.status}: ${err}` });
    }

    let geminiJson;
    try { geminiJson = await response.json(); }
    catch (e) { return json200({ result: `[DEBUG] GeminiレスポンスのJSONパース失敗: ${e.message}` }); }

    const result = geminiJson.candidates?.[0]?.content?.parts?.[0]?.text ?? `[DEBUG] candidatesが空: ${JSON.stringify(geminiJson).slice(0, 200)}`;

    return json200({ result });

  } catch (e) {
    return json200({ result: `[DEBUG] 予期せぬエラー: ${e.message}` });
  }
}

function json200(body) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}
