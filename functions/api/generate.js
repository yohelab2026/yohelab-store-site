const GEMINI_MODEL = "gemini-2.5-flash-lite";

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

  radar: `あなたはクラウドソーシング（Lancers・クラウドワークス・ coconala）の案件アドバイザーです。
ユーザーの条件に基づき、今まさに募集中のリアルな案件候補を4〜5件生成してください。
各案件には、その人の強みを活かした応募文の下書きも含めてください。

必ず以下のJSON配列のみで出力すること（前後の説明・マークダウン・コードブロック一切不要）：
[
  {
    "title": "案件名（実際のクラウドソーシングにありそうな具体的なタイトル）",
    "budget": 数値（円、ユーザーの最低予算以上）,
    "remote": true または false,
    "tags": ["カテゴリタグ", "スキルタグ"],
    "summary": "案件の概要。クライアントが何を求めているかを1〜2文で具体的に書く。",
    "score": 数値（65〜95の範囲、ユーザーの強みとの相性で決める）,
    "reason": "この案件をすすめる理由。ユーザーの強みがどう活きるか1〜2文で具体的に書く。",
    "proposal": "応募文の下書き（200〜300字）。①自己紹介1文 ②この案件を選んだ理由 ③具体的な進め方の提案 ④締めの一文 の構成で書く。"
  }
]

重要なルール：
- 案件タイトルは「LP制作（Webライター経験者優遇）」「Instagram運用補助・月5万円〜」のように具体的にする
- 予算はユーザーの最低予算以上、かつ現実的な範囲（最低予算の1.5〜3倍程度まで）にする
- 除外条件に該当する案件は絶対に含めない
- scoreが高い案件ほどリストの先頭に並べる
- 応募文はその案件固有の内容に触れ、コピペっぽくならないようにする
- 毎回必ず異なる案件・異なる応募文を出す（同じ出力を繰り返さない）
- JSON配列以外のテキストを絶対に出力しない`,

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

    case "radar":
      return `検索キーワード：${data.keyword}
最低予算：${data.minBudget}円
得意分野：${data.specialty}
除外条件：${data.exclude || "なし"}
自分の強み：${data.strengths}

上記の条件に合う案件候補をJSON配列で出力してください。`;

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
            temperature: tool === "radar" ? 0.9 : 0.7,
            maxOutputTokens: tool === "radar" ? 4000 : 800,
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
