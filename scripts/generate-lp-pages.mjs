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
    title: "AIO特化リサーチ記事メーカー | よへラボ",
    description: "3キーワードから最新情報を集め、選んだ情報だけで自然な記事にまとめる案内ページ。無料版で1回試して、合えば月額1,980円・月50回のプロプランへ進める。",
    eyebrow: "調べて書くAI",
    heroTitle: "3キーワードで、調べて、選んで、記事にする。",
    heroLead: "最新情報を拾って、使う情報だけ選び、自然な文章にまとめる。note、ブログ、クラウドワークス向けの調査記事を短くする。",
    freeHref: "/apps/research-writer/",
    buyHref: "/contact/#research-writer",
    buyLabel: "導入相談する",
    productHref: "/products/research-writer-beta/",
    proPrice: "1980",
    proOfferDescription: "月額1,980円・月50回・いつでも解約可",
    compareHeadline: "無料版で1回、プロプランは比べて選ぶところまで",
    freeCards: [
      { title: "最新情報を拾う", text: "Perplexityで3キーワードから関連情報を集める。" },
      { title: "10〜20件の候補", text: "タイトルと要約が並ぶから、読む材料を先に選びやすい。" },
      { title: "選んだ情報で記事化", text: "チェックした情報だけを材料に、自然な記事へまとめる。" },
    ],
    fitCards: [
      { title: "noteやブログを書きたい人", text: "調べるところで止まらず、そのまま文章に進めたい人向け。" },
      { title: "クラウドワークスで記事を書く人", text: "材料を先に集めて、構成づくりを短くしたい人向け。" },
      { title: "AIっぽさを薄めたい人", text: "検索と執筆を分けずに、自然な文章へ寄せたい人向け。" },
    ],
    compareRows: [
      ["キーワード入力", "3つ", "3つ"],
      ["最新情報の取得", "✓", "✓"],
      ["検索結果の選択", "10〜20件", "10〜20件"],
      ["記事生成", "✓", "✓"],
      ["SEO寄せ", "簡易", "強化"],
      ["利用回数", "1セットまで", "月50セットまで"],
      ["月額料金", "¥0", "¥1,980"],
    ],
    proCards: [
      { title: "月50回まで使える", text: "毎月の回数を決めて、記事づくりを回しやすくする。" },
      { title: "SEO寄せを強められる", text: "見出しやメタ説明まで整えて、公開しやすくする。" },
      { title: "書く前の迷いを短くする", text: "選んだ情報をそのまま流して、記事の型を作りやすい。" },
    ],
    faq: [
      ["無料版で何が返る？", "最新情報の検索結果と、選んだ情報をもとにした記事が返る。"],
      ["どんな人向け？", "note、ブログ、クラウドワークスで記事を書く人向け。"],
      ["無料版とプロプランの違いは？", "無料版は1セット。プロプランは月50セットまで使えて、比較しながら進めやすい。"],
      ["いつでも解約できる？", "問い合わせフォームからいつでも解約申請できる。"],
    ],
    proofShot: {
      src: proofUrl("research-writer-app.svg"),
      alt: "AIO特化リサーチ記事メーカーの画面スクリーンショット",
      label: "調べて書く",
      title: "キーワード3つから、記事の材料を選べる",
      text: "検索結果を見てチェックし、選んだ情報だけで記事を作る。調べる時間を先に短くする。",
      bullets: ["最新情報が先に並ぶ", "選んだ情報だけで書ける", "note / ブログ / CW向け"],
    },
    voices: [
      { text: "調べるところで止まっていたのが進みやすい。材料を先に選べるのがわかりやすい。", meta: "noteやブログを書きたい人" },
      { text: "記事の型が先に見えると、書く順番が決めやすい。クラウドワークス向けにも使いやすい。", meta: "クラウドワークスで記事を書く人" },
      { text: "AIっぽい文章を薄めたい時に合ってる。検索と執筆がつながっているのがいい。", meta: "AIっぽさを薄めたい人" },
    ],
  },
  {
    slug: "wordpress-theme",
    path: "/lp/wordpress-theme/",
    name: "AIO対応WordPressテーマ",
    title: "AIO対応WordPressテーマ | よへラボ",
    description: "AIOに強くて軽いWordPressテーマの案内ページ。3つのデザインとアクセス解析の選択肢を入れて、プラグインを増やしにくい土台を作る。",
    eyebrow: "AIO向けWordPress",
    heroTitle: "AIOに強くて、<em>軽い</em>WordPressテーマ。",
    heroLead: "見出し、FAQ、構造化データ、アクセス解析、AIOチェックを最初から素直に入れておける。テーマ内解析か外部解析かを選びながら、プラグインを減らしやすい。",
    freeHref: "/apps/wordpress-theme/",
    buyHref: "/contact/#wordpress-theme",
    buyLabel: "導入相談する",
    productHref: "/products/wordpress-theme-beta/",
    proPrice: "980",
    proOfferDescription: "月額980円・初月無料・いつでも解約可",
    compareHeadline: "無料版で1つ試し、プロプランで3つのデザインを使い分ける",
    freeCards: [
      { title: "1テンプレート", text: "まず1つの型で、AIO向けの土台を試せる。" },
      { title: "アクセス解析の選択", text: "テーマ内解析か外部解析かを選んで始められる。" },
      { title: "AIOチェック", text: "FAQ、構造化、見出し整理のON/OFFを先に決める。" },
    ],
    fitCards: [
      { title: "プラグインを減らしたい人", text: "後付けを増やさず、テーマ側に寄せたい人向け。" },
      { title: "記事サイトとLPを両方作る人", text: "用途ごとに見せ方を分けたい人向け。" },
      { title: "解析の置き方を整理したい人", text: "テーマ内か外部かを先に分けたい人向け。" },
    ],
    compareRows: [
      ["テンプレート数", "1種", "3種"],
      ["アクセス解析", "テーマ内 / 外部", "テーマ内 / 外部"],
      ["FAQ・構造化", "✓", "✓"],
      ["プラグイン削減", "簡易", "強化"],
      ["月額料金", "¥0", "¥980"],
    ],
    proCards: [
      { title: "3つのデザイン", text: "ミニマル、エディトリアル、セールスを使い分けやすい。" },
      { title: "解析の選び方を固定", text: "テーマ内解析か外部解析かを先に決められる。" },
      { title: "テーマ側へ寄せる", text: "FAQ、パンくず、SEOメタをプラグインに頼りすぎない。" },
    ],
    faq: [
      ["無料版で何が返る？", "1つのテンプレートと、アクセス解析・AIOチェックの入口が返る。"],
      ["無料版とプロプランの違いは？", "無料版は1種。プロプランは3種のデザインを使い分けられる。"],
      ["テーマ内解析と外部解析の違いは？", "テーマ内で持つか、外部サービスに寄せるかの違い。"],
      ["いつでも解約できる？", "問い合わせフォームからいつでも解約申請できる。"],
    ],
    proofShot: {
      src: proofUrl("wordpress-theme-app.svg"),
      alt: "AIO対応WordPressテーマの画面スクリーンショット",
      label: "WordPressテーマ",
      title: "3つのデザインと、解析の選び方をまとめる",
      text: "テーマ内解析か外部解析かを選びながら、AIO向けの型を足していく。プラグインを増やしにくい土台にする。",
      bullets: ["3デザインを使い分ける", "解析の選択肢がある", "FAQと構造化を寄せやすい"],
    },
    voices: [
      { text: "テーマ内でできることが多い方が楽。あとからプラグインを増やしたくない時にいい。", meta: "プラグインを減らしたい人" },
      { text: "解析の置き方を選べるのが助かる。外部に寄せるかを先に決めやすい。", meta: "解析の置き方を整理したい人" },
      { text: "LPと記事サイトを同じ土台で作りたい時に使いやすい。", meta: "記事サイトとLPを両方作る人" },
    ],
  },
  {
    slug: "x-helper",
    path: "/lp/x-helper/",
    name: "AI X返信・投稿補助",
    title: "AI X返信・投稿補助 | よへラボ",
    description: "Xでの投稿と返信を短くする案内ページ。無料版で3案を試して、合えば月額980円のプロプランへ進める。",
    eyebrow: "X発信の下書き",
    heroTitle: "Xの発信と返信を、まとめて下書きにする。",
    heroLead: "投稿文で止まる時間を減らす。切り口違いの案を先に並べて、続けやすくする。",
    freeHref: "/apps/x-helper/",
    buyHref: "https://buy.stripe.com/bJe14fgXR8XCfpg9n373G08?client_reference_id=x-helper",
    productHref: "/products/x-helper-beta/",
    compareHeadline: "無料版で3案、プロプランで続けやすく",
    freeCards: [
      { title: "投稿案3本", text: "同じ内容でも切り口違いの案を返す。" },
      { title: "返信案", text: "返信で止まる時間を減らして、次へ進める。" },
      { title: "切り口違い", text: "トーンを変えて比べやすくする。" },
    ],
    fitCards: [
      { title: "投稿文で止まりやすい人", text: "書き始めの負担を減らしたい人向け。" },
      { title: "毎日発信したい人", text: "ネタを1本ずつ整えるより、下書きを先に欲しい人向け。" },
      { title: "返信もまとめて整えたい人", text: "投稿だけでなく、返答のたたき台も欲しい人向け。" },
    ],
    compareRows: [
      ["投稿案", "3案", "複数案・保存"],
      ["返信案", "✓", "✓"],
      ["トーン切り替え", "簡易", "強化版"],
      ["保存・再利用", "—", "✓"],
      ["1日の利用回数", "1回まで", "無制限"],
      ["月額料金", "¥0", "¥980（初月無料）"],
    ],
    proCards: [
      { title: "投稿を続けやすくする", text: "毎回ゼロから考える負担を減らす。" },
      { title: "返信の温度感を揃える", text: "相手に合わせて返答の調子を出し分ける。" },
      { title: "発信の切れ目を減らす", text: "下書きを先に出して、投稿の止まりを減らす。" },
    ],
    faq: [
      ["無料版で何が返る？", "投稿案3本と返信案が返る。"],
      ["無料版とプロプランの違いは？", "無料版は試用用。プロプランは保存と再利用ができる。"],
      ["いつでも解約できる？", "問い合わせフォームからいつでも解約申請できる。"],
      ["入力内容は保存される？", "無料版は運営側に自動保存しない。"],
    ],
    proofShot: {
      src: proofUrl("x-helper-app.png"),
      alt: "AI X返信・投稿補助の画面スクリーンショット",
      label: "X発信補助",
      title: "投稿案と返信案を、先に3本ずつ出す",
      text: "ネタはあるのに文章にならない時に使う。切り口を並べて、続けやすくする。",
      bullets: ["投稿案3本が出る", "返信案もまとめて出る", "切り口違いで比べやすい"],
    },
    voices: [
      { text: "投稿案が3本あると続けやすい。毎回ゼロから考える重さが減る。", meta: "投稿で止まりやすい人" },
      { text: "返信の温度感を先に整えられるのがいい。返答で止まる時間が短くなる。", meta: "返信をすぐ返したい人" },
      { text: "毎日使うなら保存したい。発信の切れ目を減らしたい時に合ってる。", meta: "毎日発信したい人" },
    ],
  },
  {
    slug: "ec-copy",
    path: "/lp/ec-copy/",
    name: "EC商品説明・Q&A整備",
    title: "EC商品説明・Q&A整備 | よへラボ",
    description: "商品説明文とQ&Aをまとめて整える案内ページ。無料版で3パターンを試して、合えば月額980円のプロプランへ進める。",
    eyebrow: "EC向けコピー",
    heroTitle: "商品説明とQ&Aを、売り方違いで整える。",
    heroLead: "BASEやSTORESの運営で止まりやすい説明文を短くする。商品ページをまとめて整える。",
    freeHref: "/apps/ec-copy/",
    buyHref: "https://buy.stripe.com/aFa4gr9vp5Lq6SKgPv73G09?client_reference_id=ec-copy",
    productHref: "/products/ec-copy-beta/",
    compareHeadline: "無料版で3パターン、プロプランで量産しやすく",
    freeCards: [
      { title: "説明文3パターン", text: "売り方の違う説明文を先に出して比べる。" },
      { title: "Q&A 5セット", text: "購入前によくある質問をまとめやすい。" },
      { title: "売り方違い", text: "落ち着いた説明、売り寄り、短文寄りを比べる。" },
    ],
    fitCards: [
      { title: "商品ページを増やしたい人", text: "1件ずつ考えるより、まとめて整えたい人向け。" },
      { title: "BASE・STORESを使っている人", text: "短く見せたい・売りやすくしたい人向け。" },
      { title: "Q&Aも一緒に作りたい人", text: "購入前の不安を先に減らしたいとき向け。" },
    ],
    compareRows: [
      ["説明文", "3パターン", "複数案・保存"],
      ["Q&A", "5セット", "複数セット"],
      ["売り方違いの比較", "簡易", "強化版"],
      ["保存・再利用", "—", "✓"],
      ["1日の利用回数", "1回まで", "無制限"],
      ["月額料金", "¥0", "¥980（初月無料）"],
    ],
    proCards: [
      { title: "商品数が多いほど楽になる", text: "1件ずつ手で書くより、まとめて整えやすい。" },
      { title: "Q&Aを先に整える", text: "購入前に知りたい点を先回りして出せる。" },
      { title: "売り方を比べて選べる", text: "短く見せるか、しっかり見せるかを選びやすい。" },
    ],
    faq: [
      ["無料版で何が返る？", "説明文3パターンとQ&A 5セットが返る。"],
      ["無料版とプロプランの違いは？", "無料版は試用用。プロプランは保存と再利用ができる。"],
      ["いつでも解約できる？", "問い合わせフォームからいつでも解約申請できる。"],
      ["入力内容は保存される？", "無料版は運営側に自動保存しない。"],
    ],
    proofShot: {
      src: proofUrl("ec-copy-app.png"),
      alt: "EC商品説明・Q&A整備の画面スクリーンショット",
      label: "EC補助",
      title: "商品説明とQ&Aを、売り方違いで整える",
      text: "BASEやSTORESの運営で止まりやすい説明文を短くする。商品ページをまとめて整える。",
      bullets: ["説明文3パターン", "Q&A 5セット", "売り方違いで比べやすい"],
    },
    voices: [
      { text: "商品ページが早く整うのがいい。1件ずつ考えなくて済むのが楽。", meta: "商品ページを増やしたい人" },
      { text: "Q&Aが一緒に出るのが助かる。買う前の不安を先に減らしやすい。", meta: "BASE・STORESを使っている人" },
      { text: "短く見せるか、しっかり見せるかを比べやすい。売り方の比較に向いてる。", meta: "売り方を比べて選びたい人" },
    ],
  },
  {
    slug: "aio-mini",
    path: "/lp/aio-mini/",
    name: "AIOミニ診断",
    title: "AIOミニ診断 | よへラボ",
    description: "AI検索で見つかりやすいかをざっくり確かめる案内ページ。無料版で見え方を試して、合えば月額980円のプロプランへ進める。",
    eyebrow: "AI検索の見え方",
    heroTitle: "AI検索で見つかる見え方を、先に整える。",
    heroLead: "URLと概要を入れるだけ。見つかりやすさのスコアと改善点を返して、先に直す。",
    freeHref: "/apps/aio-mini/",
    buyHref: "https://buy.stripe.com/28E8wHfTNddSb90bvb73G0a?client_reference_id=aio-mini",
    productHref: "/products/aio-mini-beta/",
    compareHeadline: "無料版で見え方を試し、プロプランで整え続ける",
    freeCards: [
      { title: "見つかりやすさスコア", text: "いまの見え方をざっくり数値で見る。" },
      { title: "改善点", text: "先に直したい場所を短く返す。" },
      { title: "FAQ・見出しの叩き台", text: "AI検索に乗りやすい整理の入口を作る。" },
    ],
    fitCards: [
      { title: "AI検索対策を先に知りたい人", text: "今のサイトがどう見えるかを軽く確かめたい人向け。" },
      { title: "FAQや見出しを整えたい人", text: "ページの出し方を先に整理したい人向け。" },
      { title: "小さく改善を続けたい人", text: "まずはざっくり見て、必要なところだけ直したい人向け。" },
    ],
    compareRows: [
      ["見つかりやすさ診断", "✓", "✓"],
      ["改善点", "✓", "✓"],
      ["FAQ・見出し叩き台", "簡易", "強化版"],
      ["比較・保存", "—", "✓"],
      ["1日の利用回数", "1回まで", "無制限"],
      ["月額料金", "¥0", "¥980（初月無料）"],
    ],
    proCards: [
      { title: "先に見える形を整える", text: "AI検索に乗りやすいページの形に寄せやすい。" },
      { title: "FAQの叩き台を作る", text: "ユーザーが止まりやすい場所を先に埋める。" },
      { title: "改善を続けやすい", text: "毎回の確認を軽くして、改善の回転を上げる。" },
    ],
    faq: [
      ["無料版で何が返る？", "見つかりやすさスコア、改善点、FAQや見出しの叩き台が返る。"],
      ["無料版とプロプランの違いは？", "無料版は1回。プロプランは保存して続けやすい。"],
      ["いつでも解約できる？", "問い合わせフォームからいつでも解約申請できる。"],
      ["入力内容は保存される？", "無料版は運営側に自動保存しない。"],
    ],
    proofShot: {
      src: proofUrl("aio-mini-app.png"),
      alt: "AIOミニ診断の画面スクリーンショット",
      label: "AIO診断",
      title: "AI検索での見え方を、先に確かめる",
      text: "URLと概要を入れるだけ。見つかりやすさのスコアと改善点を返して、先に直す。",
      bullets: ["見つかりやすさスコア", "改善点がすぐ見える", "FAQの叩き台が作れる"],
    },
    voices: [
      { text: "AI検索でどう見えるかを先に知れるのがいい。まず軽く試したい時にちょうどいい。", meta: "AI検索対策を先に知りたい人" },
      { text: "FAQや見出しの叩き台が出ると、直す場所が見つけやすい。", meta: "FAQや見出しを整えたい人" },
      { text: "最初から重くないのが使いやすい。小さく改善したい人向け。", meta: "小さく改善を続けたい人" },
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
  const proPrice = page.proPrice || "980";
  const proOfferDescription = page.proOfferDescription || `月額${proPrice}円・初月無料・いつでも解約可`;

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
            offers: [
              { "@type": "Offer", price: "0", priceCurrency: "JPY", name: "無料版" },
              { "@type": "Offer", price: proPrice, priceCurrency: "JPY", name: "プロプラン", billingIncrement: "P1M", description: proOfferDescription },
            ],
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
          <span class="brand-sub">AI実務ツール開発</span>
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
          <h2>${esc(page.heroTitle)}</h2>
          <p>${esc(page.heroLead)}</p>
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
