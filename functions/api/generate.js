const GEMINI_MODEL = "gemini-2.5-flash-lite";

const SYSTEM_PROMPTS = {
  proposal: `フリーランスのクライアント向け応募文を、自然でプロフェッショナルな日本語で書いてください。
300〜400字程度で、以下の条件を守ること：
- 押しつけがましくない
- 実績をさりげなく盛り込む
- 相手の課題を理解していることが伝わる
- 最後に次のアクションを促す一文を入れる

厳守事項：
- [実績][数字][XXX]のようなプレースホルダーを絶対に使わない
- 入力に実績の具体的な数字がない場合は「〜の経験があります」のように自然な表現に留める
- 返答の冒頭に確認文・役割説明・前置き文を含めない。応募文を直接出力する`,

  x_post: `Xの投稿文を3本、日本語で作成してください。
各投稿は以下の条件を守ること：
- 140字以内
- 最初の1文でフォロワーの興味を引く
- 具体的な数字や事例を入れる
- ハッシュタグは1〜2個まで
- 番号（1. 2. 3.）をつけて出力する

厳守事項：
- 返答の冒頭に「承知しました」「了解しました」「以下の投稿文を作成しました」などの確認文・役割説明・説明文を一切含めない
- 1. から始まる投稿文を直接出力する`,

  x_reply: `Xの返信文を3パターン、日本語で作成してください。
各返信は以下の条件を守ること：
- 50〜80字程度
- 自然な会話調
- 相手の投稿内容に共感しつつ自分の視点を加える
- 番号（1. 2. 3.）をつけて出力する

厳守事項：
- 返答の冒頭に「承知しました」「了解しました」「以下の返信文を作成しました」などの確認文・役割説明・説明文を一切含めない
- 1. から始まる返信文を直接出力する`,

  ec_description: `ECサイトの商品説明文を3パターン、日本語で作成してください。
各パターンは以下の条件を守ること：
- 150〜200字程度
- トーンが異なる（例：丁寧・親しみやすい・高級感）
- 商品の特徴・メリットを具体的に伝える
- 購買意欲を高めるクロージング文を入れる
- 番号（1. 2. 3.）をつけて出力する

厳守事項：
- 入力情報にない数値・成分・認証・受賞歴・サイズ・素材・原産地等の事実を絶対に追加しない
- 情報が不十分な場合は曖昧な表現（「やわらかな素材」「使いやすいサイズ感」等）に留める
- 返答の冒頭に確認文・役割説明を含めない。1. から直接出力する`,

  ec_qa: `ECサイトの商品に関するよくある質問と回答を5セット、日本語で作成してください。
各Q&Aは以下の条件を守ること：
- 購入前の不安を解消する質問を選ぶ
- 回答は簡潔で明確（50〜100字）
- Q: A: の形式で出力する

厳守事項：
- 入力情報にない仕様・数値・対応状況を断言しない
- 不明な点は「〜については商品ページ・出品者にご確認ください」のように案内する
- 返答の冒頭に確認文・役割説明を含めない`,

  aio: `入力されたサイト情報を分析して、改善提案を日本語で出力してください。
必ず以下の形式で、すべてのセクションを埋めて出力すること：

【総合スコア】XX/100

【改善すべき点】
1. （具体的な問題点と改善方法。1〜2文で具体的に書く）
2. （具体的な問題点と改善方法。1〜2文で具体的に書く）
3. （具体的な問題点と改善方法。1〜2文で具体的に書く）

【見出し叩き台】
- H1: （サイトの目的に沿った具体的なH1提案）
- H2: （具体的なH2提案）
- H2: （具体的なH2提案）
- H2: （具体的なH2提案）

【FAQ案】
Q: （具体的な質問）
A: （50〜80字の回答）
Q: （具体的な質問）
A: （50〜80字の回答）
Q: （具体的な質問）
A: （50〜80字の回答）

厳守事項：
- すべてのセクションを必ず出力する。空欄・省略・「—」は禁止
- スコアは必ず「XX/100」の形式で数値を入れる（例：72/100）
- 返答の冒頭に確認文・役割説明を含めない`,
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
主な特徴：${data.features}
ターゲット：${data.target}
よくある不安・質問：${data.concerns || "特になし"}

上記をもとに商品説明文を3パターン作成してください。`;

    case "ec_qa":
      return `商品名：${data.productName}
主な特徴：${data.features}
よくある不安・質問：${data.concerns || "特になし"}

上記をもとに購入前Q&Aを5セット作成してください。不安・質問が入力されている場合はそれを優先的にQ&Aに反映すること。`;

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
      return json200({ error: "API key not configured" }, 500);
    }

    let body;
    try { body = await context.request.json(); }
    catch { return json200({ error: "Invalid JSON" }, 400); }

    const { tool, data } = body || {};
    if (!tool || !data) return json200({ error: "Missing tool or data" }, 400);

    const systemPrompt = SYSTEM_PROMPTS[tool];
    if (!systemPrompt) return json200({ error: `Unknown tool: ${tool}` }, 400);

    let userPrompt;
    try { userPrompt = buildUserPrompt(tool, data); }
    catch (e) { return json200({ error: e.message }, 400); }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
    let response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          generationConfig: {
            temperature: 0.7,
          maxOutputTokens: tool === "aio" ? 1800 : 900,
          },
        }),
      });
    } catch (e) {
      return json200({ error: `Network error: ${e.message}` }, 502);
    }

    if (!response.ok) {
      const err = await response.text();
      return json200({ error: `Gemini error ${response.status}: ${err}` }, 502);
    }

    const geminiJson = await response.json();
    const result = geminiJson.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return json200({ result });

  } catch (e) {
    return json200({ error: e.message }, 500);
  }
}

function json200(body) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}
