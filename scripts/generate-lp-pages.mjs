import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = resolve(process.cwd());
const out = (p) => resolve(root, p);

const proofBase = "https://raw.githubusercontent.com/yohelab2026/yohelab-store-site/main/public/proof";
const proofUrl = (name) => `${proofBase}/${name}`;

const pages = [
  {
    slug: "research-writer",
    path: "/lp/research-writer/",
    name: "AIO特化リサーチ記事メーカー",
    title: "AIOに引用される記事を作る | よへラボ",
    description: "GoogleのAI概要（AIO）に引用される記事の書き方を自動化。3キーワードで最新情報を収集し、構造化された記事を生成。無料版で1回試して、月額1,980円のプロプランへ。",
    eyebrow: "AIOに引用される記事メーカー",
    heroTitle: "SEOの時代は終わった。<em>AIOに引用される記事</em>を作る。",
    heroLead: "GoogleはAI概要（AIO）で検索結果の上位を独占しはじめた。クリックされる前に答えが出る時代。AIOに引用されるには、構造が整った記事が必要だ。このツールはそれを自動でやる。",
    freeHref: "/apps/research-writer/",
    buyHref: "/contact/#research-writer",
    buyLabel: "導入相談する",
    productHref: "/products/research-writer-beta/",
    proPrice: "1980",
    proOfferDescription: "月額1,980円・月50回・いつでも解約可",
    compareHeadline: "無料版で1回、プロプランは比べて選ぶところまで",
    freeCards: [
      { title: "最新情報を自動収集", text: "3キーワードを入れるだけ。Perplexityが最新の情報源を集める。" },
      { title: "AIO向け構造で記事化", text: "見出し・FAQ・結論を先に置く、AIOに引用されやすい構造で出力。" },
      { title: "情報を選んで精度を上げる", text: "10〜20件の候補から使う情報を選び、精度の高い記事を生成。" },
    ],
    fitCards: [
      { title: "ブログ・メディア運営者", text: "AIOに引用される記事を量産して、検索流入の次の流れに乗りたい人向け。" },
      { title: "コンテンツマーケター", text: "構造化された記事を素早く作り、AIO対策を仕事の武器にしたい人向け。" },
      { title: "AIライター・副業ライター", text: "AIの補助で記事品質を上げ、クライアントに差をつけたい人向け。" },
    ],
    compareRows: [
      ["キーワード入力", "3つ", "3つ"],
      ["最新情報の収集", "✓", "✓"],
      ["AIO向け構造出力", "✓", "強化版"],
      ["FAQ自動生成", "✓", "✓"],
      ["利用回数", "1セットまで", "月50セットまで"],
      ["月額料金", "¥0", "¥1,980"],
    ],
    proCards: [
      { title: "月50本まで量産できる", text: "AIO向け記事を月50本ペースで回せる。ブログ・メディア運営の実弾になる。" },
      { title: "FAQ付きで構造化が強い", text: "FAQ・見出し・結論の型が自動で入り、AIOに引用されやすい構造を量産。" },
      { title: "調査から執筆まで一気通貫", text: "リサーチと記事化を同じ画面で完結。ツールを行き来するロスがない。" },
    ],
    faq: [
      ["AIOとは何ですか？", "GoogleのAI概要（AI Overview）のこと。検索結果の最上位に表示されるAIが生成した回答で、引用されたサイトだけが露出できる。"],
      ["どんな記事がAIOに引用されやすい？", "見出し構造・FAQ・結論が明確な記事。このツールはその構造を自動で生成する。"],
      ["無料版とプロプランの違いは？", "無料版は1セット。プロプランは月50セットまで使えて、AIO向け構造の強化版出力も使える。"],
      ["いつでも解約できる？", "問い合わせフォームからいつでも解約申請できる。"],
    ],
    proofShot: {
      src: proofUrl("research-writer-app.svg"),
      alt: "AIO特化リサーチ記事メーカーの画面スクリーンショット",
      label: "AIOに引用される記事メーカー",
      title: "3キーワード入れるだけ。AIO構造の記事が出る。",
      text: "最新情報を収集し、見出し・FAQ・結論の構造を整えた記事を自動生成。AIOに引用されやすい型で出力する。",
      bullets: ["最新情報を自動収集", "AIO向け構造で出力", "FAQ・見出しが自動で入る"],
    },
    voices: [
      { text: "AIO対策って何をすればいいか分からなかった。このツールで記事を作ったら、翌週にAIOに引用された。", meta: "ブログ運営・30代" },
      { text: "リサーチと執筆が一つになっているのがいい。構造化された記事が量産できるようになった。", meta: "コンテンツマーケター・40代" },
      { text: "SEOで順位を上げる時代は終わった気がしてた。AIO対策に切り替えて、流入の質が変わった。", meta: "メディア運営・20代" },
    ],
  },
  {
    slug: "wordpress-theme",
    path: "/lp/wordpress-theme/",
    name: "AIO Starter WordPressテーマ",
    title: "AIO Starter WordPressテーマ — プラグイン不要のAIO対応 | よへラボ",
    description: "FAQ・構造化データ・llms.txt・内部解析をテーマ側に内蔵。メインカラーと文字色も管理画面で変えられる、AIO/LLMO対応のWordPressテーマ。AIO Starter 5,500円から。",
    eyebrow: "AIOに強いWordPressテーマ",
    heroTitle: "プラグイン追加ゼロ。<em>AIO対応の土台</em>がテーマに入っている。",
    heroLead: "FAQ・構造化データ・llms.txt・内部解析・GA4設定をテーマ側にまとめて、後付けプラグインを増やさない。さらにメインカラーと文字色を管理画面で変えられる。AIO Starter（5,500円）から始め、Affiliate（8,800円）、Media（11,000円）へ広げられる。",
    freeHref: "/apps/wordpress-theme/",
    buyHref: "/contact/#wordpress-theme",
    buyLabel: "導入相談する",
    productHref: "/products/wordpress-theme-beta/",
    proPrice: "5500",
    proOfferDescription: "AIO Starter 5,500円 / Affiliate 8,800円 / Media 11,000円（買い切り）",
    compareHeadline: "無料版で土台を確認、有料版で3種類のテーマを使い分ける",
    freeCards: [
      { title: "AIO向け構造を試せる（無料）", text: "FAQ・見出し・構造化データ・llms.txtをテーマ側で動かして確認できる。" },
      { title: "ワンクリック初期設定", text: "テーマ有効化と同時にAIO必須設定が完了。設定に迷わない。" },
      { title: "GA4・GSC設定内蔵", text: "外部プラグイン不要。管理画面から直接測定IDを入れられる。" },
      { title: "色を簡単に変更", text: "メインカラーと文字色を、管理画面の色入力で変えられる。" },
    ],
    fitCards: [
      { title: "初心者ブロガー・副業 → AIO Starter", text: "シンプル・軽い・すぐ使える。5,500円で「買った時点でAIO対応完了」を実現。" },
      { title: "アフィリエイター → AIO Affiliate", text: "CTA・広告枠・比較表・クリック計測を強化。AIOに強くかつ収益導線も設計。8,800円。" },
      { title: "メディア・企業ブログ → AIO Media", text: "E-E-A-T・マルチ著者・品質スコア・NewsArticle対応。信頼性とAIO引用を両立。11,000円。" },
    ],
    compareRows: [
      ["テーマ", "無料版（Starter）", "有料版（Starter〜Media）"],
      ["JSON-LD自動出力", "✓", "✓（強化）"],
      ["FAQ・まとめ・目次ブロック", "✓", "✓"],
      ["llms.txt自動生成", "✓", "✓（詳細設定）"],
      ["内部アクセス解析", "軽量版", "フル〜ダッシュボード"],
      ["GA4 / GSC設定", "✓", "✓"],
      ["デザインプリセット", "3種（green/light/dark）", "3種＋テーマ別"],
      ["価格", "¥0", "5,500円〜11,000円（買い切り）"],
    ],
    proCards: [
      { title: "3テーマで用途を分けられる", text: "Starter・Affiliate・Mediaを用途に合わせて選ぶ。色ではなく機能で棲み分ける。" },
      { title: "プラグイン追加ゼロで完結", text: "FAQ・構造化・解析・llms.txtがテーマに入っている。SWELLのように「追加コスト・手間ゼロ」の安心感。" },
      { title: "買い切りで使い続けられる", text: "月額なし。5,500円〜11,000円の買い切り。サポート・アップデート付き。" },
      { title: "デザインの微調整が簡単", text: "管理画面からプリセットと色を切り替えて、ブランドに合わせやすい。" },
    ],
    faq: [
      ["3種類のテーマはどう違う？", "Starter（初心者向け・5,500円）、Affiliate（アフィリエイター向け・8,800円）、Media（メディア・企業向け・11,000円）。全テーマ共通でAIO対応・プラグインレス設計。"],
      ["Yoast SEOやRank Mathは不要になる？", "FAQ・構造化データ・メタ情報はテーマ側で管理できる。Yoastなしで運用できる設計になっている。"],
      ["サポートとアップデートはある？", "WordPress 6.5以上に対応。バージョンアップへの追従とサポート窓口（X DM・問い合わせフォーム）を提供。"],
      ["まず無料で試せる？", "はい。無料版（AIO Starter）をアプリページからダウンロードして試せる。合えば有料版へ進める。"],
      ["色は変えられる？", "はい。メインカラーと文字色を管理画面の設定から変更できる。"],
    ],
    proofShot: {
      src: proofUrl("wordpress-theme-app.svg"),
      alt: "AIO Starter WordPressテーマの画面スクリーンショット",
      label: "AIO Starter テーマ",
      title: "FAQ・構造化・llms.txtがテーマに入っている",
      text: "管理画面でGA4・GSCを設定し、テーマ内解析でPVを確認。メインカラーと文字色も変えられる。プラグインを増やさずにAIO対応が進む。",
      bullets: ["JSON-LD全種を自動出力", "llms.txt自動生成", "内部解析・GA4内蔵"],
    },
    voices: [
      { text: "Yoastなしで動かせるのが驚き。AIO対策がテーマに全部入っているから、導入してすぐ使えた。", meta: "ブログ運営・30代" },
      { text: "プラグインを10本以上整理できた。軽くなったし、AIO対応もできている。買い切りなのもいい。", meta: "メディア運営・40代" },
      { text: "3テーマが用途で分かれているのが分かりやすい。まずStarterを試してAffiliateに移った。", meta: "アフィリエイター・20代" },
    ],
  },
];

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderCards(cards) {
  return cards
    .map(
      (card) => `
          <article class="lp-card">
            <h3>${esc(card.title)}</h3>
            <p>${esc(card.text)}</p>
          </article>`,
    )
    .join("");
}

function renderVoiceCards(cards) {
  return cards
    .map(
      (card) => `
            <article class="voice-card">
              <p class="voice-text">${esc(card.text)}</p>
              <div class="voice-meta">${esc(card.meta)}</div>
            </article>`,
    )
    .join("");
}

function renderRows(rows) {
  return rows
    .map(
      ([label, free, pro]) => `
              <tr>
                <td>${esc(label)}</td>
                <td class="free">${esc(free)}</td>
                <td class="pro">${esc(pro)}</td>
              </tr>`,
    )
    .join("");
}

function renderShotCard(shot) {
  const bullets = (shot.bullets || [])
    .map((bullet) => `<li>${esc(bullet)}</li>`)
    .join("");

  return `
            <figure class="shot-card">
              <div class="shot-frame">
                <img src="${esc(shot.src)}" alt="${esc(shot.alt)}" />
              </div>
              <figcaption class="shot-copy">
                <span class="shot-label">${esc(shot.label || "実際の画面")}</span>
                <h3>${esc(shot.title)}</h3>
                <p>${esc(shot.text)}</p>
                <ul class="shot-list">${bullets}</ul>
              </figcaption>
            </figure>`;
}

function renderFaq(items) {
  return items
    .map(
      ([question, answer]) => `
            <details class="faq">
              <summary>${esc(question)}</summary>
              <div class="faq-body">${esc(answer)}</div>
            </details>`,
    )
    .join("");
}

function renderPage(page) {
  const compareRows = renderRows(page.compareRows);
  const freeCards = renderCards(page.freeCards);
  const fitCards = renderCards(page.fitCards);
  const proCards = renderCards(page.proCards);
  const faq = renderFaq(page.faq);
  const proofShot = renderShotCard(page.proofShot);
  const proofVoices = renderVoiceCards(page.voices);
  const proPrice = page.proPrice ?? "980";
  const proOfferDescription = page.proOfferDescription || `月額${proPrice}円・初月無料・いつでも解約可`;
  const offers = [{ "@type": "Offer", price: "0", priceCurrency: "JPY", name: "無料版" }];
  if (page.proPrice == null) {
    offers.push({ "@type": "Offer", name: "正式版", description: proOfferDescription, availability: "https://schema.org/PreOrder" });
  } else {
    offers.push({
      "@type": "Offer",
      price: proPrice,
      priceCurrency: "JPY",
      name: "プロプラン",
      billingIncrement: "P1M",
      description: proOfferDescription,
    });
  }

  return `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${esc(page.title)}</title>
    <meta name="description" content="${esc(page.description)}" />
    <meta property="og:title" content="${esc(page.title)}" />
    <meta property="og:description" content="${esc(page.description)}" />
    <meta property="og:type" content="website" />
    <meta property="og:locale" content="ja_JP" />
    <meta property="og:url" content="https://yohelab.com${page.path}" />
    <meta property="og:image" content="https://yohelab.com/yohelab-icon.png" />
    <meta name="twitter:card" content="summary" />
    <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" />
    <meta name="theme-color" content="#0d6b58" />
    <link rel="canonical" href="https://yohelab.com${page.path}" />
    <link rel="icon" type="image/png" href="/yohelab-icon.png" />
    <link rel="stylesheet" href="/shared/site.css" />
    <style>
      .lp-hero {
        padding: 88px 0 72px;
        background:
          radial-gradient(ellipse 85% 65% at 50% 0%, rgba(13,107,88,.16), transparent 58%),
          linear-gradient(180deg, #0f221d 0%, #0b1613 100%);
        color: #fff;
      }
      .lp-hero .container {
        width: min(1100px, 100% - 48px);
      }
      .lp-hero-copy {
        max-width: 920px;
        margin: 0 auto;
        text-align: center;
      }
      .lp-eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 16px;
        border-radius: 999px;
        background: rgba(255,255,255,.09);
        border: 1px solid rgba(255,255,255,.16);
        color: rgba(255,255,255,.92);
        font-size: 13px;
        font-weight: 700;
        margin-bottom: 28px;
      }
      .lp-hero h1 {
        color: #fff;
        font-size: clamp(42px, 6.4vw, 74px);
        letter-spacing: -0.05em;
        line-height: 1.06;
        margin-bottom: 18px;
      }
      .lp-hero h1 em {
        color: #4fd1b8;
        font-style: normal;
      }
      .lp-lead {
        max-width: 760px;
        margin: 0 auto 28px;
        color: rgba(255,255,255,.76);
        font-size: 19px;
        line-height: 1.9;
      }
      .lp-actions {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 12px;
        margin-bottom: 20px;
      }
      .lp-hero-note {
        color: rgba(255,255,255,.55);
        font-size: 13px;
      }
      .lp-band {
        margin-top: 28px;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 14px;
      }
      .lp-band .lp-card {
        background: rgba(255,255,255,.07);
        border: 1px solid rgba(255,255,255,.12);
        color: #fff;
        box-shadow: none;
      }
      .lp-band .lp-card h3 {
        color: #fff;
      }
      .lp-band .lp-card p {
        color: rgba(255,255,255,.72);
      }
      .lp-section {
        padding: 72px 0;
      }
      .lp-grid-3 {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
      }
      .lp-grid-2 {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
      }
      .lp-card {
        padding: 26px;
        border-radius: 20px;
        border: 1px solid var(--border);
        background: var(--white);
        box-shadow: var(--shadow);
      }
      .lp-card h3 {
        font-size: 17px;
        font-weight: 800;
        margin-bottom: 10px;
      }
      .lp-card p {
        color: var(--muted);
        font-size: 15px;
        line-height: 1.75;
      }
      .lp-mini-head {
        text-align: center;
        margin-bottom: 22px;
      }
      .lp-mini-head h2 {
        font-size: 30px;
        font-weight: 900;
        letter-spacing: -0.04em;
        margin-bottom: 8px;
      }
      .lp-mini-head p {
        color: var(--muted);
        font-size: 16px;
      }
      .lp-preview {
        display: grid;
        grid-template-columns: 1.1fr .9fr;
        gap: 16px;
        align-items: stretch;
      }
      .lp-preview-box {
        padding: 28px;
        border-radius: 20px;
        border: 1px solid var(--green-mid);
        background: linear-gradient(180deg, #f7fcfa 0%, #eef8f4 100%);
        box-shadow: var(--shadow);
      }
      .lp-preview-box h3 {
        font-size: 20px;
        font-weight: 900;
        margin-bottom: 10px;
      }
      .lp-preview-box p {
        color: var(--muted);
        line-height: 1.75;
        font-size: 15px;
      }
      .lp-preview-list {
        display: grid;
        gap: 10px;
        margin-top: 18px;
      }
      .lp-preview-list div {
        display: flex;
        gap: 10px;
        align-items: flex-start;
        color: var(--text);
        font-size: 14px;
        line-height: 1.65;
      }
      .lp-preview-list span {
        color: var(--green);
        font-weight: 900;
      }
      .lp-side-box {
        padding: 28px;
        border-radius: 20px;
        border: 1px solid var(--border);
        background: var(--white);
        box-shadow: var(--shadow);
      }
      .lp-side-box h3 {
        font-size: 18px;
        font-weight: 900;
        margin-bottom: 12px;
      }
      .lp-side-box ul {
        display: grid;
        gap: 8px;
      }
      .lp-side-box li {
        display: flex;
        gap: 8px;
        color: var(--muted);
        line-height: 1.6;
        font-size: 14px;
      }
      .lp-side-box li::before {
        content: "→";
        color: var(--green);
        font-weight: 800;
      }
      .lp-table-wrap {
        max-width: 860px;
        margin: 0 auto;
      }
      .lp-table {
        width: 100%;
        border-collapse: collapse;
        border-radius: 18px;
        overflow: hidden;
        border: 1px solid var(--border);
        box-shadow: var(--shadow);
      }
      .lp-table th,
      .lp-table td {
        padding: 15px 18px;
        font-size: 15px;
        text-align: center;
      }
      .lp-table th:first-child,
      .lp-table td:first-child {
        text-align: left;
      }
      .lp-table th {
        background: var(--bg);
        font-weight: 800;
      }
      .lp-table .free {
        color: var(--muted);
        background: #fff;
      }
      .lp-table .pro {
        background: #f1faf6;
        color: var(--green-dark);
        font-weight: 700;
      }
      .lp-check {
        color: var(--green);
        font-weight: 900;
      }
      .lp-dash {
        color: #b8bfca;
      }
      .lp-cta {
        text-align: center;
        padding: 64px 0 84px;
        background: linear-gradient(180deg, #fff 0%, #f6fbf9 100%);
      }
      .lp-cta h2 {
        font-size: clamp(30px, 5vw, 50px);
        font-weight: 900;
        letter-spacing: -0.04em;
        margin-bottom: 12px;
      }
      .lp-cta p {
        color: var(--muted);
        font-size: 16px;
        line-height: 1.8;
        max-width: 680px;
        margin: 0 auto 22px;
      }
      .lp-links {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 16px;
      }
      .lp-links .btn {
        min-width: 220px;
      }
      .lp-note {
        margin-top: 12px;
        font-size: 13px;
        color: var(--muted);
      }
      .lp-faq {
        max-width: 840px;
        margin: 0 auto;
      }
      .lp-faq .faq {
        border: 1px solid var(--border);
        border-radius: 16px;
        background: var(--white);
        box-shadow: var(--shadow);
      }
      .lp-faq .faq + .faq {
        margin-top: 10px;
      }
      .lp-faq .faq summary {
        cursor: pointer;
      }
      @media (max-width: 960px) {
        .lp-band,
        .lp-grid-3,
        .lp-grid-2,
        .lp-preview {
          grid-template-columns: 1fr;
        }
        .lp-hero {
          padding: 72px 0 56px;
        }
        .lp-hero h1 {
          font-size: clamp(36px, 10vw, 56px);
        }
      }
    </style>
    <script type="application/ld+json">
      ${JSON.stringify({
        "@context": "https://schema.org",
        "@graph": [
          { "@type": "WebSite", name: "よへラボ", url: "https://yohelab.com/" },
          {
            "@type": "SoftwareApplication",
            name: page.name,
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            offers,
            description: page.description,
          },
        ],
      })}
    </script>
  </head>
  <body>
    <header class="nav">
      <div class="nav-inner">
        <a class="brand" href="/">
          <img src="/yohelab-icon.png" alt="よへラボのアイコン" />
          <span>よへラボ</span>
          <span class="brand-sub">AIOツール</span>
        </a>
        <nav class="nav-links">
          <a href="/">トップ</a>
          <a href="${page.freeHref}">無料版</a>
          <a href="${page.productHref}">プロプラン</a>
          <a href="/contact/">問い合わせ</a>
          <a class="btn btn-primary btn-sm" href="${page.buyHref}" target="_blank" rel="noreferrer">${esc(page.buyLabel || "初月無料で始める")}</a>
        </nav>
      </div>
    </header>

    <main>
      <section class="lp-hero">
        <div class="container">
          <div class="lp-hero-copy">
            <p class="lp-eyebrow">${esc(page.eyebrow)}</p>
            <h1>${page.heroTitle}</h1>
            <p class="lp-lead">${page.heroLead}</p>
            <div class="lp-actions">
              <a class="btn btn-primary btn-lg" href="${page.freeHref}">無料版を試す →</a>
              <a class="btn btn-lg" style="color:rgba(255,255,255,.86);border:1.5px solid rgba(255,255,255,.25);" href="${page.buyHref}" target="_blank" rel="noreferrer">${esc(page.buyLabel || "初月無料で始める")}</a>
            </div>
            <p class="lp-hero-note">無料版で相性を見て、合えばプロプランへ。全部ブラウザでそのまま使える。</p>
            <div class="lp-band">
              <div class="lp-card"><h3>無料版</h3><p>まず1回試して、返ってくるものを見る。合うかどうかの判断に使う。</p></div>
              <div class="lp-card"><h3>プロプラン</h3><p>比較や保存まで広げて、毎日の作業を短くする。使い方に合うならそこで続ける。</p></div>
              <div class="lp-card"><h3>導線</h3><p>無料版からそのまま進める。途中で止まりにくい順番にしている。</p></div>
            </div>
          </div>
        </div>
      </section>

      <section class="lp-section">
        <div class="container">
          <div class="lp-mini-head">
            <h2>${esc(page.compareHeadline)}</h2>
            <p>無料で返ってくるものと、プロプランで増える機能を同じ画面で比べられる。</p>
          </div>
          <div class="lp-preview">
      <div class="lp-preview-box">
        <h3>無料版で見えるもの</h3>
              <p>まずは1回。どんな結果が返るかを確認してから進める。</p>
              <div class="lp-preview-list">
                ${page.freeCards
                  .map(
                    (item) => `
                  <div><span>✓</span><div><strong>${esc(item.title)}</strong><br>${esc(item.text)}</div></div>`,
                  )
                  .join("")}
              </div>
              <p style="margin-top:18px;"><a class="btn btn-primary" href="${page.freeHref}">無料版を試す →</a></p>
            </div>
            <div class="lp-side-box">
              <h3>プロプランで増えるもの</h3>
              <ul>
                ${page.proCards.map((item) => `<li>${esc(item.text)}</li>`).join("")}
              </ul>
              <p class="lp-note">無料版で相性を見て、必要ならそのままプロプランへ進める。</p>
              <p style="margin-top:16px;"><a class="btn btn-primary" href="${page.buyHref}" target="_blank" rel="noreferrer" style="width:100%;">${esc(page.buyLabel || "初月無料で始める")}</a></p>
            </div>
          </div>
        </div>
      </section>

      <section class="section section-alt">
        <div class="container">
          <p class="section-label">Proof</p>
          <h2 class="section-title">実際の画面と、よくある反応</h2>
          <p class="section-sub">スクショは実機の画面。声は、試用時によく出る反応を先に載せている。</p>
          <div class="shot-grid" style="max-width:900px;margin:0 auto 28px;">${proofShot}</div>
          <div class="voices-grid">${proofVoices}</div>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <p class="section-label">Fit</p>
          <h2 class="section-title">こういう人に向いている</h2>
          <p class="section-sub">合う人・合わない人がすぐ分かるように、使いどころを先に絞っている。</p>
          <div class="lp-grid-3">
            ${fitCards}
          </div>
        </div>
      </section>

      <section class="section section-alt">
        <div class="container">
          <p class="section-label">Compare</p>
          <h2 class="section-title">無料版とプロプランの違い</h2>
          <div class="lp-table-wrap">
            <table class="lp-table">
              <thead>
                <tr>
                  <th>機能</th>
                  <th>無料版</th>
                  <th>プロプラン</th>
                </tr>
              </thead>
              <tbody>
                ${compareRows}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section class="section" style="background:var(--bg);">
        <div class="container">
          <p class="section-label">Features</p>
          <h2 class="section-title">プロプランでできること</h2>
          <div class="lp-grid-3">
            ${proCards}
          </div>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <p class="section-label">FAQ</p>
          <h2 class="section-title">よくある質問</h2>
          <div class="lp-faq faq-list">
            ${faq}
          </div>
        </div>
      </section>

      <section class="lp-cta">
        <div class="container">
          <h2>${page.heroTitle}</h2>
          <p>${page.heroLead}</p>
          <div class="lp-links">
            <a class="btn btn-primary btn-lg" href="${page.freeHref}">無料版を試す →</a>
            <a class="btn btn-primary btn-lg" href="${page.buyHref}" target="_blank" rel="noreferrer">${esc(page.buyLabel || "初月無料で始める")}</a>
          </div>
          <p class="lp-note"><a href="${page.productHref}" style="color:var(--green);font-weight:800;">プロプランの詳細を見る →</a></p>
        </div>
      </section>
    </main>
  </body>
</html>`;
}

for (const page of pages) {
  const filePath = out(`lp/${page.slug}/index.html`);
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, renderPage(page), "utf8");
}

const sitemapSource = out("sitemap.xml");
const sitemapTarget = out("public/sitemap.xml");
mkdirSync(dirname(sitemapTarget), { recursive: true });
writeFileSync(sitemapTarget, readFileSync(sitemapSource, "utf8"), "utf8");
