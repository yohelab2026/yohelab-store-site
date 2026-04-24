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
    title: "AIOに読まれやすい記事を作る | よへラボ",
    description: "GoogleのAI概要（AIO）時代に向けて、3キーワードで最新情報を収集し、見出し・FAQ・出典・WordPress設定まで整えた記事下書きを生成。無料版は1日1セット、プロプランは月50セット。",
    eyebrow: "AIOに読まれやすい記事メーカー",
    heroTitle: "SEOだけで止まらない。<em>AIOに読まれやすい記事</em>を作る。",
    heroLead: "GoogleのAI概要やAI Modeでも、基本は通常のSEOと同じく、インデックス可能で信頼できる本文が前提になる。だから最新情報、明確な見出し、FAQ、出典をそろえた記事下書きを、3キーワードから作れるようにした。",
    freeHref: "/apps/research-writer/",
    buyHref: "/api/checkout?product=research-writer",
    buyLabel: "プロプランを始める",
    productHref: "/products/research-writer-beta/",
    proPrice: "1980",
    proOfferDescription: "月額1,980円・月50セット・いつでも解約可",
    compareHeadline: "無料版は1日1セット、プロプランは月50セットまで",
    freeCards: [
      { title: "最新情報を自動収集", text: "3キーワードを入れるだけ。Perplexityが最新の情報源を集める。" },
      { title: "AIO向け構造で記事化", text: "見出し・FAQ・結論を先に置く、AIにも人にも読まれやすい構造で出力。" },
      { title: "情報を選んで精度を上げる", text: "10〜20件の候補から使う情報を選び、精度の高い記事を生成。" },
    ],
    fitCards: [
      { title: "ブログ・メディア運営者", text: "AI検索時代に合わせて、見出し・FAQ・出典の整った記事を増やしたい人向け。" },
      { title: "コンテンツマーケター", text: "構造化された記事を素早く作り、AIO対策を仕事の武器にしたい人向け。" },
      { title: "AIライター・副業ライター", text: "AIの補助で記事品質を上げ、クライアントに差をつけたい人向け。" },
    ],
    compareRows: [
      ["キーワード入力", "3つ", "3つ"],
      ["最新情報の収集", "✓", "✓"],
      ["AIO向け構造出力", "✓", "強化版"],
      ["FAQ自動生成", "✓", "✓"],
      ["利用回数", "1日1セットまで", "月50セットまで"],
      ["月額料金", "¥0", "¥1,980"],
    ],
    proCards: [
      { title: "月50セットまで量産できる", text: "AIO向け記事下書きを月50セットペースで回せる。ブログ・メディア運営の実弾になる。" },
      { title: "FAQ付きで構造が強い", text: "FAQ・見出し・結論の型が自動で入り、読者とAI検索の両方に伝わりやすい形で量産。" },
      { title: "調査から執筆まで一気通貫", text: "リサーチと記事化を同じ画面で完結。ツールを行き来するロスがない。" },
    ],
    faq: [
      ["AIOとは何ですか？", "ここではGoogleのAI概要（AI Overview）など、検索結果内でAIが回答を要約する流れを指している。表示や引用は保証されないが、通常のSEOと同じく技術要件と本文品質が重要になる。"],
      ["どんな記事がAI検索に読まれやすい？", "インデックス可能で、見出し構造・FAQ・結論・出典が明確な記事。このツールはその下書き構造を作る。"],
      ["無料版とプロプランの違いは？", "無料版は1日1セット。プロプランは月50セットまで使えて、AIO向け構造の強化版出力も使える。"],
      ["いつでも解約できる？", "問い合わせフォームからいつでも解約申請できる。"],
    ],
    proofShot: {
      src: proofUrl("research-writer-app.svg"),
      alt: "AIO特化リサーチ記事メーカーの画面スクリーンショット",
      label: "AIOに読まれやすい記事メーカー",
      title: "3キーワード入れるだけ。AIO向け構造の記事が出る。",
      text: "最新情報を収集し、見出し・FAQ・結論・出典の構造を整えた記事下書きを生成。AI検索時代に合わせた型で出力する。",
      bullets: ["最新情報を自動収集", "AIO向け構造で出力", "FAQ・見出しが自動で入る"],
    },
    voices: [
      { text: "AIO対策で何を整えればいいか分からない時に、見出し・FAQ・出典まで一気に下書きできる。", meta: "想定ユースケース" },
      { text: "リサーチと執筆が一つになっているので、記事の骨組みを作る時間を短くできる。", meta: "想定ユースケース" },
      { text: "SEOだけでなく、AI検索でも読み取りやすい記事構成に寄せたい時の土台になる。", meta: "想定ユースケース" },
    ],
  },
  {
    slug: "wordpress-theme",
    path: "/lp/wordpress-theme/",
    name: "AIO Starter WordPressテーマ",
    title: "AIO Starter WordPressテーマ — 軽くてAIO向けの土台 | よへラボ",
    description: "FAQ・構造化データ・llms.txt・内部解析をテーマ側に内蔵。メインカラーと文字色も管理画面で変えられる、AIO/LLMO向けの軽量WordPressテーマ。",
    eyebrow: "AIOに強いWordPressテーマ",
    heroTitle: "プラグイン追加ゼロ。<em>AIO対応の土台</em>がテーマに入っている。",
    heroLead: "FAQ・構造化データ・llms.txt・内部解析・GA4設定をテーマ側にまとめて、後付けプラグインを増やしすぎない。さらにメインカラーと文字色を管理画面で変えられる。まずAIO Starterを配布し、Affiliate、Mediaへ広げる設計。",
    freeHref: "/apps/wordpress-theme/",
    buyHref: "/contact/#wordpress-theme",
    buyLabel: "導入相談する",
    productHref: "/products/wordpress-theme-beta/",
    proPrice: null,
    proOfferDescription: "価格未定。Starterを先に試し、Affiliate / Media は用途別の次期ラインとして案内。",
    compareHeadline: "Starterで土台を確認、用途別にAffiliate / Mediaへ広げる",
    freeCards: [
      { title: "AIO向け構造を試せる", text: "FAQ・見出し・構造化データ・llms.txtをテーマ側で動かして確認できる。" },
      { title: "初期設定をまとめる", text: "色、解析、GA4、Search Console、llms.txtを同じ設定画面で扱える。" },
      { title: "GA4・GSC設定内蔵", text: "外部プラグイン不要。管理画面から直接測定IDを入れられる。" },
      { title: "色を簡単に変更", text: "メインカラーと文字色を、管理画面の色入力で変えられる。" },
    ],
    fitCards: [
      { title: "初心者ブロガー・副業 → AIO Starter", text: "シンプル・軽い・すぐ使える。まず公開できる土台を迷わず作る。" },
      { title: "アフィリエイター → AIO Affiliate", text: "CTA・広告枠・比較表・クリック計測を強化。収益導線を設計しやすくする次期ライン。" },
      { title: "メディア・企業ブログ → AIO Media", text: "E-E-A-T・マルチ著者・品質スコア・NewsArticle対応。信頼性を強める上位ライン。" },
    ],
    compareRows: [
      ["テーマ", "AIO Starter", "Affiliate / Media"],
      ["JSON-LD自動出力", "✓", "✓（強化）"],
      ["FAQ・まとめ・目次ブロック", "✓", "✓"],
      ["llms.txt自動生成", "✓", "✓（詳細設定）"],
      ["内部アクセス解析", "軽量版", "フル〜ダッシュボード"],
      ["GA4 / GSC設定", "✓", "✓"],
      ["デザインプリセット", "3色（green/light/dark）", "用途別UIを追加予定"],
      ["価格", "配布中", "未定"],
    ],
    proCards: [
      { title: "3ラインで用途を分けられる", text: "Starter・Affiliate・Mediaを用途に合わせて設計。色だけでなく機能で棲み分ける。" },
      { title: "プラグインを増やしすぎない", text: "FAQ・構造化・解析・llms.txtをテーマ側に入れ、必要な外部連携だけ選ぶ。" },
      { title: "価格は正式販売前に確定", text: "現時点ではStarterを試せる状態。サポート・アップデート範囲と合わせて価格を決める。" },
      { title: "デザインの微調整が簡単", text: "管理画面からプリセットと色を切り替えて、ブランドに合わせやすい。" },
    ],
    faq: [
      ["3種類はどう違う？", "Starterは初心者・副業向け、Affiliateは収益化向け、Mediaは企業・メディア向け。まずStarterを配布し、残り2つは用途別の次期ラインとして設計している。"],
      ["Yoast SEOやRank Mathは不要になる？", "完全な代替を保証するものではない。FAQ・構造化データ・メタ情報・解析の入口をテーマ側で扱えるので、必要なプラグインを減らしやすい設計。"],
      ["サポートとアップデートはある？", "正式販売時にサポート範囲とアップデート方針を明記する。現時点では問い合わせフォームから導入相談を受ける。"],
      ["まず試せる？", "はい。AIO Starter ZIPをアプリページからダウンロードして試せる。"],
      ["色は変えられる？", "はい。メインカラーと文字色を管理画面の設定から変更できる。"],
    ],
    proofShot: {
      src: proofUrl("wordpress-theme-app.svg"),
      alt: "AIO Starter WordPressテーマの画面スクリーンショット",
      label: "AIO Starter テーマ",
      title: "FAQ・構造化・llms.txtがテーマに入っている",
      text: "管理画面でGA4・GSCを設定し、テーマ内解析でPVを確認。メインカラーと文字色も変えられる。プラグインを増やしすぎずにAIO向けの土台を整える。",
      bullets: ["JSON-LD全種を自動出力", "llms.txt自動生成", "内部解析・GA4内蔵"],
    },
    voices: [
      { text: "SEO系プラグインを増やす前に、テーマ側でどこまでできるか確認できる。", meta: "想定ユースケース" },
      { text: "色、解析、llms.txt、構造化データを同じ場所で触れるので、初期設定の迷いが減る。", meta: "想定ユースケース" },
      { text: "Starterで軽い土台を作り、収益化やメディア運用が必要になったら用途別ラインに広げられる。", meta: "想定ユースケース" },
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
              <div class="lp-card"><h3>無料版</h3><p>${page.slug === "research-writer" ? "1日1セットまで試して、返ってくるものを見る。合うかどうかの判断に使う。" : "まず無料版で試して、返ってくるものを見る。合うかどうかの判断に使う。"}</p></div>
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
