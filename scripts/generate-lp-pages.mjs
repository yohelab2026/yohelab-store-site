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
    title: "AIO・AI検索に読まれやすい記事を作る | よへラボ",
    description: "3キーワード入力で最新情報を収集し、見出し・FAQ・出典まで整えたAIO向け記事下書きを生成。GoogleのAI概要（AIO）・AI Mode対応。無料版は1日1セット、プロプランは月50セット・1,980円。",
    eyebrow: "AIOに読まれやすい記事メーカー",
    heroTitle: "3キーワードで、<em>AI検索に読まれやすい記事</em>の下書きが出る。",
    heroLead: "見出し・FAQ・出典・結論をそろえた構造が、AIにも人にも伝わりやすい。リサーチと記事化を同じ画面で完結させて、1記事あたりの作業を短くする。",
    heroNote: "無料版で1回試して、返ってくるものを見てから判断できる。ブラウザだけで使える。",
    heroBand: [
      { title: "無料版で1回試す", text: "1日1セット。どんな記事下書きが返るか確認してから進める。" },
      { title: "プロプランで量産", text: "月50セット。毎日の記事作業を短くして、本数を増やす。" },
      { title: "すぐ使える", text: "インストール不要。ブラウザで今すぐ試せる。" },
    ],
    freeHref: "/apps/research-writer/",
    buyHref: "/api/checkout?product=research-writer",
    buyLabel: "月額1,980円で始める",
    productHref: "/products/research-writer-beta/",
    proPrice: "1980",
    proOfferDescription: "月額1,980円・月50セット・いつでも解約可",
    compareHeadline: "無料で1回試してから、必要なら月額へ",
    compareSubtitle: "無料版で出てくるものを確認して、合えばそのまま月50セットに移行できる。",
    freeBoxTitle: "無料版でできること",
    freeBoxNote: "まず1回。どんな記事下書きが返るか確認してから進める。",
    proBoxTitle: "プロプランで増えること",
    proBoxNote: "月50セット。毎日使える量に増やして、記事作業のスピードを上げる。",
    compareSectionTitle: "無料版とプロプランの違い",
    proSectionLabel: "Features",
    proSectionTitle: "プロプランでできること",
    ctaTitle: "今すぐ<em>AI検索向け記事</em>の下書きを作る",
    ctaLead: "無料版で1回試して返ってくるものを確認できる。合えばそのままプロプランへ。月50セット・1,980円・いつでも解約可。",
    freeCards: [
      { title: "最新情報を自動収集", text: "3キーワードを入れるだけ。Perplexityが最新の情報源を集めてくる。" },
      { title: "AIO向け構造で出力", text: "見出し・FAQ・結論・出典が自動で入る。AIにも人にも読まれやすい構造。" },
      { title: "情報を選んで精度を上げる", text: "10〜20件の候補から使う情報を選び、精度の高い記事下書きを生成。" },
    ],
    fitCards: [
      { title: "ブログ・メディア運営者", text: "AI検索時代に合わせて、構造の整った記事を量産したい人向け。" },
      { title: "コンテンツマーケター", text: "リサーチから記事化まで一気通貫で終わらせて、本数を増やしたい人向け。" },
      { title: "副業ライター・AIライター", text: "記事品質を上げながら、作業時間を短くしてクライアントに差をつけたい人向け。" },
    ],
    compareRows: [
      ["キーワード入力", "3つ", "3つ"],
      ["最新情報の収集", "✓", "✓"],
      ["AIO向け構造出力", "✓", "強化版"],
      ["FAQ自動生成", "✓", "✓"],
      ["利用回数", "1日1セットまで", "月50セットまで"],
      ["月額料金", "¥0（無料）", "¥1,980"],
    ],
    proCards: [
      { title: "月50セットで量産できる", text: "AIO向け記事下書きを月50セット回せる。ブログ・メディア運営の実弾になる量。" },
      { title: "FAQ付きで構造が強い", text: "FAQ・見出し・結論が自動で入る。読者とAI検索の両方に伝わる型で量産できる。" },
      { title: "リサーチから記事化まで一画面", text: "ツールを行き来するロスがない。収集→選択→記事化を同じ画面で完結。" },
    ],
    faq: [
      ["AIOとは何ですか？", "GoogleのAI概要（AI Overview）・AI Modeなど、検索結果の中でAIが回答を要約して表示する仕組みを指している。通常のSEOと同じく技術要件と本文品質が重要で、このツールはAIが読みやすい記事構造を作る。"],
      ["どんな記事が引用されやすい？", "見出し構造・FAQ・結論・出典が明確で、インデックス可能な記事。このツールはその構造を持った下書きを出力する。"],
      ["無料版とプロプランの違いは？", "無料版は1日1セット。プロプランは月50セットまで使えて、AIO向け構造の強化版出力も使える。月1,980円でいつでも解約可能。"],
      ["すぐ使える？", "はい。インストール不要でブラウザからすぐ使える。無料版は登録不要で試せる。"],
      ["WordPressに直接投稿できる？", "現在は記事下書きの生成まで対応している。生成した内容をWordPressに貼り付けて使う形。"],
      ["いつでも解約できる？", "問い合わせフォームからいつでも解約申請できる。解約後は当月末まで利用可能。"],
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
      { text: "AIO対策で何を整えればいいか分からない時に、見出し・FAQ・出典まで一気に下書きできる。", meta: "メディア運営者" },
      { text: "リサーチと執筆が一つになっているので、記事の骨組みを作る時間を短くできる。", meta: "コンテンツマーケター" },
      { text: "SEOだけでなく、AI検索でも読み取りやすい記事構成に寄せたい時の土台になる。", meta: "副業ライター" },
    ],
  },
  {
    slug: "wordpress-theme",
    path: "/lp/wordpress-theme/",
    name: "AIO Starter WordPressテーマ",
    title: "AIO Starter — AI検索対応WordPressテーマ ベータ¥5,500 | よへラボ",
    description: "FAQ・JSON-LD・llms.txt・内部解析・GA4設定をテーマに内蔵した軽量WordPressテーマ。プラグイン追加ゼロでAI検索時代の土台を整える。ベータ価格¥5,500（正式版¥8,800）買い切り・月額なし。購入後すぐZIPとシリアルナンバーが届く。",
    eyebrow: "AI検索時代の軽量WordPressテーマ",
    heroTitle: "プラグイン不要。<em>AI検索に強い土台</em>がテーマに最初から入っている。",
    heroLead: "FAQ・JSON-LD・llms.txt・内部解析・GA4設定をテーマ側にまとめた。後からプラグインを積み上げなくても、AI検索時代に必要なものが最初から揃っている。",
    heroNote: "ベータ価格 ¥5,500 → 正式版リリース後 ¥8,800 に改定。月額なし・買い切り。",
    heroBand: [
      { title: "JSON-LD全種を自動出力", text: "Article・FAQPage・BreadcrumbListをテーマ側で自動生成。プラグイン不要。" },
      { title: "llms.txt＋内部解析内蔵", text: "AIクローラー向けllms.txtと、PV・流入元を記録する軽量解析をテーマに内蔵。" },
      { title: "ベータ¥5,500・買い切り", text: "月額なし・ずっと使える。正式版リリース後¥8,800に改定予定。" },
    ],
    freeHref: "/apps/wordpress-theme/",
    freeLabel: "機能を確認する",
    freeOffer: false,
    buyHref: "/api/checkout?product=wordpress-theme",
    buyLabel: "¥5,500（ベータ）で購入する",
    productHref: "/products/wordpress-theme-beta/",
    proPrice: "5500",
    proOfferDescription: "ベータ価格¥5,500（正式版¥8,800）・買い切り・月額なし",
    compareHeadline: "機能を全部確認してから購入できる",
    compareSubtitle: "ZIPを渡すと商品本体が渡るため、無料体験ではなく機能・設定・デザインを確認してから購入する形式。",
    freeBoxTitle: "このページで確認できること",
    freeBoxNote: "機能・設定画面・記事設計・FAQ・JSON-LD・llms.txtを購入前に確認できる。",
    proBoxTitle: "購入後に届くもの",
    proBoxNote: "ZIPファイル・シリアルナンバー・自動アップデート・基本サポートがついてくる。",
    compareSectionTitle: "デモ確認できること vs 購入後に手に入るもの",
    freeColumnLabel: "確認できること",
    proColumnLabel: "購入後",
    proSectionLabel: "Features",
    proSectionTitle: "AIO Starterで手に入るもの全部",
    ctaTitle: "AI検索時代の土台を、<em>今すぐ整える</em>",
    ctaLead: "ベータ価格¥5,500で購入。購入後すぐにZIPとシリアルナンバーがメールで届く。月額なし・買い切り。正式版リリース後¥8,800に改定。",
    freeCards: [
      { title: "FAQ・JSON-LDの動作を確認", text: "FAQショートコード・Article/FAQPage JSON-LD・llms.txtが実際にどう動くか確認できる。" },
      { title: "初期設定画面を確認", text: "メインカラー・解析・GA4・GSC・llms.txtを同じ管理画面から設定できる構成。" },
      { title: "記事テンプレート7種を確認", text: "比較・レビュー・案件紹介・AI検索FAQ・ランキング・商品紹介の型を事前に確認できる。" },
      { title: "表示速度・軽さを確認", text: "不要なCSSとJSを削減した構造。コアウェブバイタルに配慮した設計を確認できる。" },
    ],
    fitCards: [
      { title: "ブログ・アフィリエイトを始める人", text: "プラグインの選び方に迷わなくていい。JSON-LD・FAQ・解析がテーマに最初から入っている。" },
      { title: "SEO系プラグインを減らしたい人", text: "Yoast・Rank Mathで対応していた構造化データ・メタ設定をテーマ側に寄せられる。" },
      { title: "AI検索対応を最初の設計から整えたい人", text: "llms.txt・JSON-LD・FAQ構成を土台から作りたい人向け。後付けよりテーマから整えるほうが早い。" },
    ],
    compareRows: [
      ["機能", "確認できること", "購入後"],
      ["デザイン・レイアウト", "✓", "✓"],
      ["JSON-LD自動出力", "✓", "✓（ZIP込み）"],
      ["FAQショートコード", "✓", "✓（ZIP込み）"],
      ["llms.txt自動生成", "✓", "✓（ZIP込み）"],
      ["内部解析・GA4設定", "✓", "✓（ZIP込み）"],
      ["記事テンプレート7種", "✓", "✓（ZIP込み）"],
      ["自動アップデート", "—", "✓（シリアル認証）"],
      ["価格", "¥0（確認のみ）", "¥5,500（ベータ）"],
    ],
    proCards: [
      { title: "JSON-LD + FAQショートコード", text: "Article・FAQPage・Breadcrumb・Personを自動出力。[aio_faq]でFAQを設置するとJSON-LDも一緒に出る。" },
      { title: "llms.txt 自動生成", text: "/llms.txtをWordPressの投稿・固定ページから自動生成。AIクローラー向けの入口をテーマ側で整える。" },
      { title: "記事テンプレート 7種類", text: "比較・レビュー・案件紹介・AI検索FAQ・ランキング・商品紹介・AIO基本型をブロックパターンで選べる。" },
    ],
    faq: [
      ["ベータ版とは？", "現在ベータ版として¥5,500で提供中。WordPress 6.9.4・PHP 8.3で動作確認済み。バグは専用フォームで受け付けて随時修正。正式版リリース後に¥8,800へ価格改定予定。"],
      ["月額費用はかかる？", "かからない。¥5,500（ベータ）の買い切り。一度買えば正式版になってもそのまま使い続けられる。"],
      ["Yoast SEOやRank Mathは不要になる？", "完全な代替保証はしないが、JSON-LD・FAQ・メタ情報・解析の入口がテーマに内蔵されているので、多くの場合プラグインを減らせる設計になっている。"],
      ["購入後すぐに使える？", "Stripe決済完了後、ZIPとシリアルナンバーがメールで届く。WordPressの管理画面からZIPをアップロードして有効化するだけ。"],
      ["アップデートはある？", "ある。WordPress管理画面から通常のテーマと同じ手順でアップデートできる。シリアルナンバーを設定しておくと自動で更新通知が出る。"],
      ["色やデザインは変えられる？", "メインカラーと文字色を管理画面から変更できる。ボタン・見出し・リンクに反映される。"],
      ["サポートはある？", "ZIP導入・基本設定・ショートコードの使い方・GA4/GSCの設定までサポートする。バグは専用フォームから報告できる。"],
    ],
    proofShot: {
      src: proofUrl("wordpress-theme-app.svg"),
      alt: "AIO Starter WordPressテーマの管理画面スクリーンショット",
      label: "AIO Starter テーマ",
      title: "FAQ・JSON-LD・llms.txtがテーマに入っている",
      text: "管理画面でGA4・GSCを設定し、内部解析でPVを確認。メインカラーと文字色も変えられる。プラグイン追加ゼロでAI検索向けの土台を整える。",
      bullets: ["JSON-LD全種を自動出力", "llms.txt自動生成", "内部解析・GA4内蔵"],
    },
    voices: [
      { text: "SEO系プラグインを増やす前に、テーマ側でどこまでできるか試してみた。初期設定が一か所にまとまっていて、立ち上げが早かった。", meta: "副業ブロガー" },
      { text: "色・解析・llms.txt・構造化データを同じ場所で触れるので、初期設定の迷いが減る。ブログ開設から公開までがスムーズだった。", meta: "ブログ運営者" },
      { text: "Yoast SEOで設定していたJSON-LDをテーマ側に移せた。プラグインが1つ減って管理が楽になった。", meta: "アフィリエイター" },
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
            <h3>${esc(card.title)}${card.price ? `<span class="lp-price-badge">${esc(card.price)}</span>` : ""}</h3>
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

function renderHeroBand(band) {
  return band
    .map(
      (card) => `
              <div class="lp-card"><h3>${esc(card.title)}</h3><p>${esc(card.text)}</p></div>`,
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
  const heroBand = renderHeroBand(page.heroBand || []);
  const proPrice = page.proPrice ?? "980";
  const proOfferDescription = page.proOfferDescription || `月額${proPrice}円・初月無料・いつでも解約可`;
  const offers = page.freeOffer === false ? [] : [{ "@type": "Offer", price: "0", priceCurrency: "JPY", name: "無料版" }];
  if (page.proPrice == null) {
    offers.push({ "@type": "Offer", name: "正式版", description: proOfferDescription, availability: "https://schema.org/PreOrder" });
  } else {
    offers.push({
      "@type": "Offer",
      price: proPrice,
      priceCurrency: "JPY",
      name: "プロプラン",
      description: proOfferDescription,
    });
  }

  const heroNote = page.heroNote || "無料版で相性を見て、合えばプロプランへ。全部ブラウザでそのまま使える。";
  const compareSubtitle = page.compareSubtitle || "無料で返ってくるものと、プロプランで増える機能を同じ画面で比べられる。";
  const freeBoxTitle = page.freeBoxTitle || "無料版で見えるもの";
  const freeBoxNote = page.freeBoxNote || "まずは1回。どんな結果が返るかを確認してから進める。";
  const proBoxTitle = page.proBoxTitle || "プロプランで増えるもの";
  const proBoxNote = page.proBoxNote || "無料版で相性を見て、必要ならそのままプロプランへ進める。";
  const compareSectionTitle = page.compareSectionTitle || "無料版とプロプランの違い";
  const proSectionLabel = page.proSectionLabel || "Features";
  const proSectionTitle = page.proSectionTitle || "プロプランでできること";
  const ctaTitle = page.ctaTitle || page.heroTitle;
  const ctaLead = page.ctaLead || page.heroLead;
  const freeLabel = page.freeLabel || "無料で試す";

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
          linear-gradient(180deg, #f8fbff 0%, #eef5ff 100%);
        color: var(--text);
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
        background: rgba(255,255,255,.92);
        border: 1px solid rgba(11,143,114,.18);
        color: var(--green-dark);
        font-size: 13px;
        font-weight: 700;
        margin-bottom: 28px;
      }
      .lp-hero h1 {
        color: var(--text);
        font-size: clamp(42px, 6.4vw, 74px);
        letter-spacing: -0.05em;
        line-height: 1.06;
        margin-bottom: 18px;
      }
      .lp-hero h1 em {
        background: linear-gradient(135deg, #0b8f72 0%, #1fb6cf 55%, #3f8cff 100%);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        font-style: normal;
      }
      .lp-lead {
        max-width: 760px;
        margin: 0 auto 28px;
        color: var(--muted);
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
        color: var(--muted-light);
        font-size: 13px;
      }
      .lp-band {
        margin-top: 28px;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 14px;
      }
      .lp-band .lp-card {
        background: rgba(255,255,255,.88);
        border: 1px solid rgba(11,143,114,.12);
        color: var(--text);
        box-shadow: none;
      }
      .lp-band .lp-card h3 {
        color: var(--text);
      }
      .lp-band .lp-card p {
        color: var(--muted);
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
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
      }
      .lp-card p {
        color: var(--muted);
        font-size: 15px;
        line-height: 1.75;
      }
      .lp-price-badge {
        display: inline-block;
        padding: 3px 12px;
        border-radius: 999px;
        background: var(--green-soft, #e6f8f2);
        color: var(--green-dark, #075c4c);
        font-size: 14px;
        font-weight: 700;
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
      .lp-cta h2 em {
        color: var(--green-dark, #075c4c);
        font-style: normal;
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
      .voice-card {
        padding: 24px;
        border-radius: 18px;
        border: 1px solid var(--border);
        background: var(--white);
        box-shadow: var(--shadow-sm);
      }
      .voice-text {
        font-size: 15px;
        line-height: 1.8;
        color: var(--text);
        margin-bottom: 12px;
      }
      .voice-text::before { content: "「"; }
      .voice-text::after  { content: "」"; }
      .voice-meta {
        font-size: 13px;
        color: var(--muted);
        font-weight: 700;
      }
      .voices-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 14px;
        margin-top: 24px;
      }
      .lp-footer {
        background: #0b1613;
        color: rgba(255,255,255,.5);
        font-size: 13px;
        padding: 28px 0;
        text-align: center;
      }
      .lp-footer a { color: rgba(255,255,255,.5); }
      .lp-footer a:hover { color: #fff; }
      .lp-footer-links { display: flex; justify-content: center; flex-wrap: wrap; gap: 16px; margin-top: 10px; }
      @media (max-width: 960px) {
        .lp-band,
        .lp-grid-3,
        .lp-preview,
        .voices-grid {
          grid-template-columns: 1fr 1fr;
        }
        .lp-hero {
          padding: 72px 0 56px;
        }
        .lp-hero h1 {
          font-size: clamp(36px, 10vw, 56px);
        }
      }
      @media (max-width: 640px) {
        .lp-band,
        .lp-grid-3,
        .lp-grid-2,
        .lp-preview,
        .voices-grid {
          grid-template-columns: 1fr;
        }
        .lp-table th, .lp-table td { padding: 10px 12px; font-size: 13px; }
        .lp-hero { padding: 56px 0 44px; }
        .lp-section { padding: 48px 0; }
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
        </a>
        <nav class="nav-links">
        <a href="/apps/research-writer/">ツール</a>
        <a href="/products/page-review/">サービス</a>
        <a href="/blog/">ブログ</a>
        <a href="/contact/">問い合わせ</a>
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
              <a class="btn btn-primary btn-lg" href="${page.freeHref}">${esc(freeLabel)} →</a>
              <a class="btn btn-lg" style="color:rgba(255,255,255,.86);border:1.5px solid rgba(255,255,255,.25);background:rgba(255,255,255,.06);" href="${page.buyHref}" target="_blank" rel="noreferrer">${esc(page.buyLabel || "購入する")}</a>
            </div>
            <p class="lp-hero-note">${esc(heroNote)}</p>
            <div class="lp-band">
              ${heroBand}
            </div>
          </div>
        </div>
      </section>

      <section class="lp-section">
        <div class="container">
          <div class="lp-mini-head">
            <h2>${esc(page.compareHeadline)}</h2>
            <p>${esc(compareSubtitle)}</p>
          </div>
          <div class="lp-preview">
            <div class="lp-preview-box">
              <h3>${esc(freeBoxTitle)}</h3>
              <p>${esc(freeBoxNote)}</p>
              <div class="lp-preview-list">
                ${page.freeCards
                  .map(
                    (item) => `
                  <div><span>✓</span><div><strong>${esc(item.title)}</strong><br>${esc(item.text)}</div></div>`,
                  )
                  .join("")}
              </div>
              <p style="margin-top:18px;"><a class="btn btn-primary" href="${page.freeHref}">${esc(freeLabel)} →</a></p>
            </div>
            <div class="lp-side-box">
              <h3>${esc(proBoxTitle)}</h3>
              <ul>
                ${page.proCards.map((item) => `<li>${esc(item.title)}${item.price ? " " + item.price : ""} — ${esc(item.text.slice(0, 40))}…</li>`).join("")}
              </ul>
              <p class="lp-note">${esc(proBoxNote)}</p>
              <p style="margin-top:16px;"><a class="btn btn-primary" href="${page.buyHref}" target="_blank" rel="noreferrer" style="width:100%;">${esc(page.buyLabel || "購入する")}</a></p>
            </div>
          </div>
        </div>
      </section>

      <section class="section section-alt">
        <div class="container">
          <p class="section-label">Proof</p>
          <h2 class="section-title">実際の画面と、使ってみた声</h2>
          <p class="section-sub">スクリーンショットは実機の画面。声は実際の使用例から。</p>
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
          <p style="text-align:center;margin-top:28px;">
            <a class="btn btn-primary btn-lg" href="${page.freeHref}">${esc(freeLabel)} →</a>
          </p>
        </div>
      </section>

      <section class="section section-alt">
        <div class="container">
          <p class="section-label">Compare</p>
          <h2 class="section-title">${esc(compareSectionTitle)}</h2>
          <div class="lp-table-wrap">
            <table class="lp-table">
              <thead>
                <tr>
                  <th>機能</th>
                  <th>${page.freeColumnLabel || "無料版 / Starter"}</th>
                  <th>${page.proColumnLabel || "プロプラン"}</th>
                </tr>
              </thead>
              <tbody>
                ${compareRows}
              </tbody>
            </table>
          </div>
          <p style="text-align:center;margin-top:24px;">
            <a class="btn btn-primary" href="${page.buyHref}" target="_blank" rel="noreferrer">${esc(page.buyLabel || "購入する")}</a>
          </p>
        </div>
      </section>

      <section class="section" style="background:var(--bg);">
        <div class="container">
          <p class="section-label">${esc(proSectionLabel)}</p>
          <h2 class="section-title">${esc(proSectionTitle)}</h2>
          <div class="lp-grid-3">
            ${proCards}
          </div>
          <p style="text-align:center;margin-top:28px;">
            <a class="btn btn-primary btn-lg" href="${page.buyHref}" target="_blank" rel="noreferrer">${esc(page.buyLabel || "購入する")}</a>
          </p>
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
          <h2>${ctaTitle}</h2>
          <p>${esc(ctaLead)}</p>
          <div class="lp-links">
            <a class="btn btn-primary btn-lg" href="${page.buyHref}" target="_blank" rel="noreferrer">${esc(page.buyLabel || "購入する")} →</a>
            <a class="btn btn-lg" style="color:var(--text);border:1.5px solid var(--border);" href="${page.freeHref}">${esc(freeLabel)}</a>
          </div>
          <p class="lp-note"><a href="${page.productHref}" style="color:var(--green);font-weight:800;">プラン詳細を見る →</a></p>
        </div>
      </section>
    </main>

    <footer class="lp-footer">
      <div>© よへラボ / yohelab.com</div>
      <div class="lp-footer-links">
        <a href="/">トップ</a>
        <a href="${page.freeHref}">${esc(freeLabel)}</a>
        <a href="${page.productHref}">プラン詳細</a>
        <a href="/contact/">問い合わせ</a>
        <a href="/legal/commerce/">特定商取引法</a>
        <a href="/legal/privacy/">プライバシー</a>
        <a href="/legal/terms/">利用規約</a>
      </div>
    </footer>
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
