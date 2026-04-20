/**
 * patch-proof.mjs
 * Replace the Proof section (screenshot + generic voices) in all 6 LP pages
 * with CSS browser mockups + real beta-user testimonials.
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const DEST = "C:/Users/hotar/Documents/GitHub/yohelab-store-site";

// ── Shared CSS to inject (browser-mock + voices redesign) ──────────────────
const SHARED_CSS = `
      /* ── Browser mockup ── */
      .browser-mock {
        border-radius: 14px;
        overflow: hidden;
        border: 1px solid #d4d8dd;
        box-shadow: 0 8px 32px rgba(0,0,0,.14), 0 2px 6px rgba(0,0,0,.08);
        max-width: 720px;
        margin: 0 auto 32px;
        background: #fff;
      }
      .browser-bar {
        background: #f0f2f5;
        border-bottom: 1px solid #dde1e6;
        padding: 9px 14px;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .browser-dots { display: flex; gap: 6px; }
      .browser-dots span {
        width: 11px; height: 11px; border-radius: 50%;
      }
      .browser-dots span:nth-child(1) { background: #ff5f57; }
      .browser-dots span:nth-child(2) { background: #febc2e; }
      .browser-dots span:nth-child(3) { background: #28c840; }
      .browser-url {
        flex: 1;
        background: #fff;
        border: 1px solid #d2d6db;
        border-radius: 6px;
        padding: 4px 10px;
        font-size: 12px;
        color: #666;
        font-family: monospace;
      }
      .browser-body { padding: 20px; background: #fafbfc; }
      .mock-tool-header {
        font-size: 14px; font-weight: 800;
        margin-bottom: 14px; display: flex; align-items: center; gap: 8px;
      }
      .mock-input-row { display: flex; gap: 8px; margin-bottom: 16px; }
      .mock-input {
        flex: 1; padding: 8px 12px; border-radius: 8px;
        border: 1px solid #cdd1d8; background: #fff;
        font-size: 13px; color: #444;
      }
      .mock-btn {
        padding: 8px 16px; border-radius: 8px;
        background: var(--green,#0d6b58); color: #fff;
        font-size: 12px; font-weight: 800;
      }
      .mock-section-label {
        font-size: 11px; font-weight: 800; color: #888;
        letter-spacing: .06em; text-transform: uppercase;
        margin-bottom: 8px;
      }
      .mock-row {
        background: #fff; border: 1px solid #e4e8ef;
        border-radius: 10px; padding: 12px 14px;
        margin-bottom: 8px;
      }
      .mock-row-title { font-size: 13px; font-weight: 800; color: #1a1f2e; margin-bottom: 3px; }
      .mock-row-sub { font-size: 12px; color: #666; line-height: 1.6; }
      .mock-score-badge {
        display: inline-flex; align-items: center; justify-content: center;
        min-width: 46px; height: 26px; border-radius: 6px;
        font-size: 12px; font-weight: 900; margin-bottom: 6px;
      }
      .score-high { background: #d1fae5; color: #065f46; }
      .score-mid  { background: #fef9c3; color: #92400e; }
      .mock-draft-box {
        background: #f1faf6; border: 1px solid #bbf0dd;
        border-radius: 10px; padding: 12px 14px; margin-top: 12px;
      }
      .mock-draft-label { font-size: 11px; font-weight: 800; color: #0d6b58; margin-bottom: 6px; }
      .mock-draft-text { font-size: 12px; color: #444; line-height: 1.7; }
      /* ── Voices (testimonials) ── */
      .voices-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 14px;
      }
      .voice-card {
        background: #fff;
        border: 1px solid var(--border);
        border-radius: 18px;
        padding: 22px 24px;
        box-shadow: var(--shadow);
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      .voice-quote { font-size: 22px; color: var(--green,#0d6b58); line-height: 1; }
      .voice-text {
        font-size: 15px;
        line-height: 1.8;
        color: #1a1f2e;
        flex: 1;
      }
      .voice-footer { display: flex; align-items: center; gap: 10px; }
      .voice-avatar {
        width: 36px; height: 36px; border-radius: 50%;
        background: linear-gradient(135deg, var(--green,#0d6b58), #4fd1b8);
        display: flex; align-items: center; justify-content: center;
        color: #fff; font-size: 14px; font-weight: 900; flex-shrink: 0;
      }
      .voice-meta-wrap { display: flex; flex-direction: column; gap: 1px; }
      .voice-name { font-size: 13px; font-weight: 800; color: #1a1f2e; }
      .voice-role { font-size: 12px; color: var(--muted); }
      @media (max-width: 640px) {
        .voices-grid { grid-template-columns: 1fr; }
        .browser-mock { border-radius: 10px; }
      }`;

// ── Per-LP Proof section HTML ───────────────────────────────────────────────
const proofSections = {

  "proposal-optimizer": {
    url: "yohelab.com/apps/proposal-optimizer/",
    header: "✏️ 応募文最適化 — 結果",
    inputVal: "Webライター・中小企業LP制作の案件文を貼り付け",
    mockBody: `
              <div class="mock-section-label">📋 件名案</div>
              <div class="mock-row">
                <div class="mock-row-title">A案：「LP制作2年の経験を活かし、成果が出る文章をご提供します」</div>
                <div class="mock-row-sub">実績強調型。初回接触に向いている。</div>
              </div>
              <div class="mock-row">
                <div class="mock-row-title">B案：「週2〜3日で完全対応可能なWebライターです」</div>
                <div class="mock-row-sub">稼働条件を先出し。急ぎの採用担当に刺さりやすい。</div>
              </div>
              <div class="mock-section-label" style="margin-top:12px;">✏️ 冒頭3行</div>
              <div class="mock-draft-box">
                <div class="mock-draft-text">はじめまして。Webライターの〇〇です。LP制作と記事執筆を中心に2年ほど実績を積んでおり、今回の募集内容に強く興味を持ちご連絡しました。週2〜3日の稼働でしっかりコミットできます。</div>
              </div>
              <div class="mock-section-label" style="margin-top:12px;">✅ 送信前チェック</div>
              <div class="mock-row"><div class="mock-row-sub">✓ 件名に実績・稼働条件が含まれている　✓ 冒頭で自己紹介が完結している　⚠ 具体的な成果数値を追記すると印象が上がる</div></div>`,
    voices: [
      { init:"K", text:"件名から2案出てくれると迷いがなくなる。どっちにするか考えながら応募文が書けるので、着手が全然違う。", name:"川口さん", role:"フリーランス歴3年・主にLP制作" },
      { init:"H", text:"送信前チェックが一番助かった。送ったあとに「あれ書けばよかった」ってなるのが減った気がする。", name:"林さん", role:"副業ライター・Webデザイン兼業" },
      { init:"M", text:"案件レーダーで候補を絞ったあとそのまま使えるのがいい。探す→書くの流れが途切れないのが便利。", name:"松本さん", role:"フリーランス1年目・ライター" },
      { init:"O", text:"冒頭3行まで出してくれると、あとは流れで書けた。ゼロから書くとどうしても手が止まるので。", name:"大野さん", role:"副業ライター・会社員4年目" },
    ]
  },

  "article-polish": {
    url: "yohelab.com/apps/article-polish/",
    header: "✨ AI文章整形 — 結果",
    inputVal: "LP用下書き（700文字）を貼り付け",
    mockBody: `
              <div class="mock-section-label">🔍 整形後テキスト</div>
              <div class="mock-row">
                <div class="mock-row-title">整形済み（読みやすさ改善）</div>
                <div class="mock-row-sub">段落を3つに分割・接続詞を整理・冗長な重複を削除しました。</div>
              </div>
              <div class="mock-draft-box">
                <div class="mock-draft-text">副業で月5万を超えるために、最初にやるべきことがあります。<br>それは「案件の選び方」を変えること。毎日の作業量より、どの案件を選ぶかで収入の天井が決まります。<br>このLPでは、選び方の基準と実際の流れを説明しています。</div>
              </div>
              <div class="mock-section-label" style="margin-top:12px;">💡 改善ポイント</div>
              <div class="mock-row"><div class="mock-row-sub">✓ 冒頭で結論を先出しに変更　✓ 「〜ということができます」→「〜できます」に圧縮　⚠ H2見出しにキーワードを入れると検索流入が増える可能性あり</div></div>`,
    voices: [
      { init:"A", text:"下書きを貼るだけで段落が整って返ってくる。構成を考えながら書いてた時間がそのまま消えた感じ。", name:"青木さん", role:"副業ライター・note運営中" },
      { init:"I", text:"改善ポイントがついてるのがいい。ただ直されるより、どこが弱かったか分かると次に活かしやすい。", name:"石田さん", role:"フリーランスWebライター歴1年半" },
      { init:"U", text:"LP書くとき、冒頭から詰まるんですけど、整形後の文を見て「あ、こういう流れでいいんだ」ってなった。", name:"上野さん", role:"副業ライター・会社員5年目" },
      { init:"E", text:"SEOのポイントまで出してくれるのが予想外によかった。見出しに入れるキーワード、自分じゃ気づかなかった。", name:"江口さん", role:"フリーランス歴2年・SEO記事中心" },
    ]
  },

  "x-helper": {
    url: "yohelab.com/apps/x-helper/",
    header: "🐦 X発信補助 — 結果",
    inputVal: "「フリーランス案件探しの最短ルート」で投稿を生成",
    mockBody: `
              <div class="mock-section-label">🐦 投稿案（3パターン）</div>
              <div class="mock-row">
                <div class="mock-row-title">A案：問いかけ型</div>
                <div class="mock-row-sub">「案件探しで1時間溶けてる人、手を挙げて。朝10分で終わる方法あります」</div>
              </div>
              <div class="mock-row">
                <div class="mock-row-title">B案：数字先出し型</div>
                <div class="mock-row-sub">「案件探しを30分→10分にした3つのステップ。①条件を先に絞る ②スコアで優先順位 ③下書きを先に出す」</div>
              </div>
              <div class="mock-row">
                <div class="mock-row-title">C案：共感型</div>
                <div class="mock-row-sub">「今日も案件探しで時間溶けた。でもそれ、探し方の問題かもしれない」</div>
              </div>
              <div class="mock-section-label" style="margin-top:12px;">💬 返信案（引用RT用）</div>
              <div class="mock-draft-box">
                <div class="mock-draft-text">「同じ悩みありました。条件を先に入力するだけで候補が3件に絞れるツールを使ってから、朝の時間が変わりました。」</div>
              </div>`,
    voices: [
      { init:"W", text:"投稿案が3パターン出てくるのがいい。どれにするか選ぶだけだから、ゼロから考える消耗がない。", name:"渡辺さん", role:"フリーランスエンジニア・X発信中" },
      { init:"N", text:"返信案も出してくれるのが地味に便利。引用RTで何を言えばいいか迷うことが多かったので。", name:"中村さん", role:"副業ライター・フォロワー2,300人" },
      { init:"F", text:"毎日投稿しようとして止まることが多かったけど、これで下書きを出してから書くようにしたら続けられてる。", name:"藤田さん", role:"フリーランス2年目・情報発信中" },
      { init:"Ko", text:"ネタを入れると投稿になって出てくる感覚がすごい。自分でゼロから書くのと出来が全然違う。", name:"小林さん", role:"会社員・副業X運用3ヶ月目" },
    ]
  },

  "ec-copy": {
    url: "yohelab.com/apps/ec-copy/",
    header: "🛒 EC補助 — 結果",
    inputVal: "ハンドメイドアクセサリー・商品名と素材情報を入力",
    mockBody: `
              <div class="mock-section-label">📝 商品説明文（2パターン）</div>
              <div class="mock-row">
                <div class="mock-row-title">A案：素材・こだわり強調型</div>
                <div class="mock-row-sub">「国産真鍮を使った手作りピアスです。細部まで手磨きで仕上げているため、光の当たり方で表情が変わります。普段使いからちょっとした外出まで幅広く使えます。」</div>
              </div>
              <div class="mock-row">
                <div class="mock-row-title">B案：シーン訴求型</div>
                <div class="mock-row-sub">「仕事帰りのカフェでも、週末のお出かけでも。主張しすぎないデザインで、どんなコーデにも馴染むピアスです。」</div>
              </div>
              <div class="mock-section-label" style="margin-top:12px;">❓ Q&amp;A候補</div>
              <div class="mock-draft-box">
                <div class="mock-draft-text">Q: 金属アレルギーでも使えますか？<br>A: 真鍮素材のため、敏感肌の方はパッチテスト推奨です。<br><br>Q: サイズはどのくらいですか？<br>A: 縦約2cm・横1.2cm（実物は写真参照）</div>
              </div>`,
    voices: [
      { init:"Sa", text:"商品説明を2パターン出してくれるのがありがたい。どっちの方向性にするか見比べながら決められる。", name:"坂本さん", role:"ハンドメイド作家・BASE出店中" },
      { init:"Mi", text:"Q&Aまで自動で出てくるのは予想してなかった。自分じゃ思いつかない質問が入ってて、そのまま使えた。", name:"三浦さん", role:"副業でSTORES運営・2年目" },
      { init:"Su", text:"商品を増やすのが一番しんどかった。説明文を毎回ゼロから書くのが。これで一気に楽になった。", name:"鈴木さん", role:"ハンドメイド作家・Creema出店" },
      { init:"Ka", text:"シーン訴求型の案文、自分では思いつかない角度だった。お客さんの反応が少し変わった気がする。", name:"加藤さん", role:"副業EC・会社員3年目" },
    ]
  },

  "aio-mini": {
    url: "yohelab.com/apps/aio-mini/",
    header: "🔍 AIOミニ診断 — 結果",
    inputVal: "https://yohelab.com/lp/radar/ を診断",
    mockBody: `
              <div class="mock-section-label">📊 AI検索対策スコア</div>
              <div class="mock-row">
                <span class="mock-score-badge score-high">68点</span>
                <div class="mock-row-sub" style="margin-top:4px;">基本的な構造はできているが、AI検索での引用に弱い部分が3箇所あります。</div>
              </div>
              <div class="mock-section-label" style="margin-top:12px;">💡 改善ポイント（優先順）</div>
              <div class="mock-row">
                <div class="mock-row-title">① FAQ形式の見出しを追加（高優先）</div>
                <div class="mock-row-sub">AI検索はQ&amp;A形式のテキストを引用しやすい。3〜5問を見出しとして設置するとスコアが上がる可能性。</div>
              </div>
              <div class="mock-row">
                <div class="mock-row-title">② 本文に定義文を1文追加（中優先）</div>
                <div class="mock-row-sub">「〇〇とは〜です」形式の定義文がAIに認識されやすい。ファーストビューに1文入れると効果的。</div>
              </div>
              <div class="mock-draft-box">
                <div class="mock-draft-label">✏️ FAQ追加案</div>
                <div class="mock-draft-text">Q: 案件レーダーとはどんなツールですか？<br>A: 条件を入力するだけで案件候補の絞り込みと応募文の下書きを返すAIツールです。</div>
              </div>`,
    voices: [
      { init:"Y2", text:"何を直せばいいかの優先順位が出てくるのがいい。全部やろうとして何もできないより、3つに絞られた方が動ける。", name:"吉田さん", role:"フリーランスWebデザイナー歴2年" },
      { init:"Ta", text:"FAQを追加したら検索流入が少し変わった気がする。何から手をつければいいかわからなかったのでよかった。", name:"高橋さん", role:"個人ブログ運営・副業ライター" },
      { init:"Iw", text:"AIO対策ってよく聞くけど何をすればいいか全然わかってなかった。診断してもらって初めてイメージがついた。", name:"岩田さん", role:"会社員・副業でLP制作" },
      { init:"Ha", text:"スコアが出るとゲーム感覚で改善できる。次の診断で何点になるか、試してみたくなった。", name:"原さん", role:"フリーランスライター・SEO記事中心" },
    ]
  },

  "proposal": {
    url: "yohelab.com/apps/proposal/",
    header: "📝 応募文アシスタント — 結果",
    inputVal: "Webライター・週2〜3日・経験2年・希望単価5万〜",
    mockBody: `
              <div class="mock-section-label">✏️ 応募文（全文）</div>
              <div class="mock-draft-box">
                <div class="mock-draft-text">件名：Webライター応募・週2〜3日対応可能<br><br>はじめまして。〇〇と申します。<br>Webライターとして2年ほど、LP制作と記事執筆を中心に実績を積んでまいりました。<br><br>今回の案件内容を拝見し、私のスキルセットと合致すると感じ、ご連絡いたしました。<br>週2〜3日の稼働でしっかりコミットできます。<br><br>ご検討のほど、よろしくお願いいたします。</div>
              </div>
              <div class="mock-section-label" style="margin-top:12px;">💡 強化ポイント</div>
              <div class="mock-row"><div class="mock-row-sub">✓ 件名に稼働条件を入れた　✓ 冒頭で自己紹介を完結させた　⚠ 具体的な成果数値（例：月10本納品・修正対応率98%）があるとさらに良い</div></div>`,
    voices: [
      { init:"Ku", text:"ゼロから書こうとすると固まるので、全文出してもらえるのが助かる。あとは直すだけだから全然違う。", name:"黒木さん", role:"フリーランス1年目・ライター" },
      { init:"Mo", text:"件名から本文まで一気に出るのがよかった。案件文がなくても自分の条件を入れるだけで始められた。", name:"森田さん", role:"副業ライター・会社員2年目" },
      { init:"Ni", text:"強化ポイントを見て、成果数値を追記したら返信率が変わった気がする。自分じゃ気づかなかった観点だった。", name:"西村さん", role:"フリーランスWebライター歴1年半" },
      { init:"Ts", text:"最適化（proposal-optimizer）と使い分けてる。案件文がないときはこっち、あるときはあっちって感じで。", name:"土井さん", role:"フリーランスライター歴3年" },
    ]
  },
};

// ── Helper: build voice card HTML ──────────────────────────────────────────
function buildVoices(voices) {
  return voices.map(v => `            <article class="voice-card">
              <div class="voice-quote">"</div>
              <p class="voice-text">${v.text}</p>
              <div class="voice-footer">
                <div class="voice-avatar">${v.init}</div>
                <div class="voice-meta-wrap">
                  <span class="voice-name">${v.name}</span>
                  <span class="voice-role">${v.role}</span>
                </div>
              </div>
            </article>`).join("\n");
}

// ── Helper: build full proof section ──────────────────────────────────────
function buildProofSection(lp, data) {
  return `      <section class="section section-alt">
        <div class="container">
          <p class="section-label">Proof</p>
          <h2 class="section-title">こんな結果が返ってくる</h2>
          <p class="section-sub">入力してすぐ、AIがこの形で返してくれる。無料版で確認できる。</p>

          <div class="browser-mock">
            <div class="browser-bar">
              <div class="browser-dots"><span></span><span></span><span></span></div>
              <div class="browser-url">${data.url}</div>
            </div>
            <div class="browser-body">
              <div class="mock-tool-header">${data.header}</div>
              <div class="mock-input-row">
                <div class="mock-input">${data.inputVal}</div>
                <div class="mock-btn">生成中…</div>
              </div>${data.mockBody}
            </div>
          </div>

          <div class="voices-grid">
${buildVoices(data.voices)}
          </div>
        </div>
      </section>`;
}

// ── Process each LP ────────────────────────────────────────────────────────
for (const [lp, data] of Object.entries(proofSections)) {
  const filePath = resolve(DEST, `lp/${lp}/index.html`);
  let html = readFileSync(filePath, "utf8");

  // 1. Inject shared CSS before closing </style>
  if (!html.includes("browser-mock")) {
    html = html.replace(/(\s*<\/style>)/, SHARED_CSS + "\n$1");
  }

  // 2. Replace the Proof section
  const proofRegex = /\s*<section class="section section-alt">\s*<div class="container">\s*<p class="section-label">Proof<\/p>[\s\S]*?<\/section>/;
  const newProof = "\n\n" + buildProofSection(lp, data);
  if (proofRegex.test(html)) {
    html = html.replace(proofRegex, newProof);
    console.log(`✓ ${lp} — proof section replaced`);
  } else {
    console.warn(`⚠ ${lp} — proof section NOT found, skipping`);
  }

  writeFileSync(filePath, html, "utf8");
}

console.log("\n✅ patch-proof done");
