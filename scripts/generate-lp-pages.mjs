import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = resolve(process.cwd());
const out = (p) => resolve(root, p);

const allToolsHref = "https://buy.stripe.com/aFa5kv9vpb5K7WO1UB73G0b?client_reference_id=all-tools";

const pages = [
  {
    slug: "radar",
    path: "/lp/radar/",
    name: "案件レーダー",
    title: "案件レーダー | よへラボ",
    description: "案件探しを朝10分にしたい人向けの案内ページ。無料版で案件候補と応募文の下書きを試して、合えば月額980円のプロプランへ進める。",
    eyebrow: "案件探しAI",
    heroTitle: "案件を探す・選ぶ・書くを、1本にまとめる。",
    heroLead: "条件を入れるだけ。案件候補を先に絞って、応募文の下書きまで返す。ひとりで稼ぐ人の朝を短くする。",
    freeHref: "/apps/radar/",
    buyHref: "https://buy.stripe.com/dRmfZ9ePJ5Lq6SKbvb73G06?client_reference_id=radar",
    productHref: "/products/radar-beta/",
    compareHeadline: "無料版で試して、合えばそのままプロプランへ",
    freeCards: [
      { title: "案件候補", text: "条件に近い案件候補を先に並べる。見る量を減らして朝の迷いを消す。" },
      { title: "応募しやすさ", text: "スコアと理由が返るので、どれから見るか決めやすい。" },
      { title: "応募文1案", text: "応募文の骨組みが先にあるから、送るまでが速い。" },
    ],
    fitCards: [
      { title: "案件探しで時間が溶けやすい人", text: "朝のうちに今日応募する1件を決めたい人向け。" },
      { title: "毎日同じ条件で見たい人", text: "条件保存があると、同じ流れで回しやすい。" },
      { title: "応募文まで一気に進めたい人", text: "探すだけで止まらず、送るところまで短くしたい人向け。" },
    ],
    compareRows: [
      ["案件候補", "✓", "✓"],
      ["応募しやすさスコア", "✓", "✓"],
      ["応募文の下書き", "1案", "2文体・比較可"],
      ["条件保存", "—", "✓"],
      ["1日の利用回数", "1回まで", "無制限"],
      ["月額料金", "¥0", "¥980（初月無料）"],
    ],
    proCards: [
      { title: "毎朝の条件選び直しをなくす", text: "保存した条件でそのまま使える。開いてすぐ案件候補が出る。" },
      { title: "見なくていい案件を最初から減らす", text: "絞り込みの幅が広がると、読む量が減って判断が速くなる。" },
      { title: "応募文の複数案を比べられる", text: "候補を並べて見て、送る前に1本へ絞りやすい。" },
    ],
    faq: [
      ["無料版で何が返る？", "案件候補、応募しやすさスコア、応募文の下書き1案が返る。"],
      ["無料版とプロプランの違いは？", "無料版は全体で1日1回。プロプランは条件保存と比較機能が使える。"],
      ["いつでも解約できる？", "問い合わせフォームからいつでも解約申請できる。"],
      ["入力内容は保存される？", "無料版は生成のために送るが、運営側に自動保存しない。"],
    ],
  },
  {
    slug: "proposal",
    path: "/lp/proposal/",
    name: "AI応募文アシスタント",
    title: "AI応募文アシスタント | よへラボ",
    description: "案件名と自分の強みだけで応募文の下書きを作る案内ページ。無料版で1案を試して、合えば月額980円のプロプランへ進める。",
    eyebrow: "応募文の下書き",
    heroTitle: "案件名と強みだけで、応募文の下書きが出る。",
    heroLead: "案件文がなくても使える。ひとまず1案を出して、応募の初動で止まる時間を減らす。",
    freeHref: "/apps/proposal/",
    buyHref: "https://buy.stripe.com/fZu9AL3716Pu7WOeHn73G07?client_reference_id=proposal",
    productHref: "/products/proposal-beta/",
    compareHeadline: "無料版で1案、合えば複数案へ",
    freeCards: [
      { title: "案件名だけで使える", text: "案件文がなくても、ひとまず下書きを返せる。" },
      { title: "強みを先に活かせる", text: "自分の強みを入れるだけで、応募の入口ができる。" },
      { title: "まず1案を出す", text: "止まっていた応募文を前に進めるための1案。" },
    ],
    fitCards: [
      { title: "案件文がまだ手元にない人", text: "応募先の概要だけ見て動きたいときに向いている。" },
      { title: "ゼロから書き始めるのがしんどい人", text: "冒頭を作るだけでかなり楽になる。" },
      { title: "まず下書きが欲しい人", text: "完璧じゃなくていいから、先に形が欲しい人向け。" },
    ],
    compareRows: [
      ["応募文の下書き", "✓", "✓"],
      ["入力する情報", "案件名・強み", "案件名・強み・補足"],
      ["生成パターン", "1案", "複数案"],
      ["再編集", "—", "✓"],
      ["1日の利用回数", "1回まで", "無制限"],
      ["月額料金", "¥0", "¥980（初月無料）"],
    ],
    proCards: [
      { title: "複数案で比べる", text: "切り口違いの案を並べて、使えるものを選びやすくする。" },
      { title: "文体を出し分ける", text: "丁寧・端的・やわらかめを案件ごとに使い分けられる。" },
      { title: "その場で再編集できる", text: "強みや案件内容を足しながら、応募前の最後の詰めまで進める。" },
    ],
    faq: [
      ["案件文がなくても使える？", "案件名と自分の強みだけで試せる。"],
      ["無料版とプロプランの違いは？", "無料版は1案。プロプランは複数案と再編集ができる。"],
      ["いつでも解約できる？", "問い合わせフォームからいつでも解約申請できる。"],
      ["入力内容は保存される？", "無料版は運営側に自動保存しない。"],
    ],
  },
  {
    slug: "proposal-optimizer",
    path: "/lp/proposal-optimizer/",
    name: "AI応募文最適化",
    title: "AI応募文最適化 | よへラボ",
    description: "案件文を貼るだけで、件名案・冒頭3行・応募文・送信前チェックまで返る案内ページ。無料版で1回試して、合えば月額980円のプロプランへ進める。",
    eyebrow: "応募直前の仕上げ",
    heroTitle: "案件文を貼ると、件名案から送信前チェックまで返る。",
    heroLead: "応募直前の最後の仕上げ用。案件本文を入れるだけで、使える形に整える。",
    freeHref: "/apps/proposal-optimizer/",
    buyHref: "https://buy.stripe.com/fZu9AL3716Pu7WOeHn73G07?client_reference_id=proposal-optimizer",
    productHref: "/products/proposal-optimizer-beta/",
    compareHeadline: "無料版は仕上げの入口、プロプランは比べて選ぶところまで",
    freeCards: [
      { title: "件名案", text: "応募文の前に、まず送るための入口を作る。" },
      { title: "冒頭3行", text: "最初のつかみを整えて、読み始めてもらいやすくする。" },
      { title: "送信前チェック", text: "送る前に見直したい点を先に返す。" },
    ],
    fitCards: [
      { title: "案件文が手元にある人", text: "すでに応募先を決めていて、仕上げだけしたいとき向け。" },
      { title: "応募文をもう一段整えたい人", text: "ただ出すだけでなく、見え方まで詰めたい人向け。" },
      { title: "比較して選びたい人", text: "A案/B案で見比べたい人に合う。" },
    ],
    compareRows: [
      ["案件本文を貼る", "✓", "✓"],
      ["件名案", "1案", "複数案"],
      ["冒頭3行", "✓", "比べやすい形で複数"],
      ["送信前チェック", "簡易", "強化版"],
      ["保存・比較", "—", "✓"],
      ["月額料金", "¥0", "¥980（初月無料）"],
    ],
    proCards: [
      { title: "件名案と冒頭を複数で比べる", text: "最初の数行を先に比べて、送る文を選びやすくする。" },
      { title: "応募前の見直しを短くする", text: "送信前チェックがあると、あとで戻る回数が減る。" },
      { title: "案件レーダーからそのままつなぐ", text: "案件を見つけたあと、そのまま応募準備に入れる。" },
    ],
    faq: [
      ["案件レーダーと何が違う？", "案件レーダーは探すところ、応募文最適化は仕上げるところ。"],
      ["無料版で何が返る？", "件名案、冒頭3行、応募文の下書き、送信前チェックの入口が返る。"],
      ["いつでも解約できる？", "問い合わせフォームからいつでも解約申請できる。"],
      ["入力内容は保存される？", "無料版は運営側に自動保存しない。"],
    ],
  },
  {
    slug: "article-polish",
    path: "/lp/article-polish/",
    name: "AI文章整形",
    title: "AI文章整形 | よへラボ",
    description: "相談メモやラフな下書きを、人が読みやすいブログ・LP・note・サービス紹介文に整える案内ページ。無料版で1回試して、合えば全ツールパックで使える。",
    eyebrow: "文章を整えるAI",
    heroTitle: "相談メモを、読まれる文章に整える。",
    heroLead: "相談段階のメモや箇条書きを入れるだけ。ブログ、LP、note、サービス紹介に使える自然な文章へ整える。",
    freeHref: "/apps/article-polish/",
    buyHref: allToolsHref,
    buyLabel: "全ツールパックで使う",
    productHref: "/products/article-polish-beta/",
    compareHeadline: "無料版は1回、プロプランは比べて選ぶところまで",
    freeCards: [
      { title: "タイトル案", text: "読まれる入口を先に作る。文章の方向を決めやすくする。" },
      { title: "導入文", text: "相談メモのままだと伝わりにくい部分を、読み始めやすい形にする。" },
      { title: "SEOタイトル・メタ説明", text: "検索で見つかりやすい見出しと説明を整える。" },
    ],
    fitCards: [
      { title: "相談メモから記事を作りたい人", text: "ラフなメモを、公開できる形にしたいとき向け。" },
      { title: "LPやnoteを書き始めたい人", text: "文章のたたき台を先に欲しい人向け。" },
      { title: "SEOやAIOも意識したい人", text: "読みやすさと見つかりやすさを両方見たい人向け。" },
    ],
    compareRows: [
      ["文章を整える", "✓", "✓"],
      ["タイトル案", "1案", "複数案"],
      ["導入文", "1案", "複数案"],
      ["見出し案", "3項目", "比べやすく強化"],
      ["SEOタイトル / メタ説明", "簡易", "強化版"],
      ["1日の利用回数", "1回まで", "無制限"],
      ["導入方法", "無料版からすぐ試せる", "全ツールパックで使える"],
    ],
    proCards: [
      { title: "相談メモをそのまま記事化しやすい", text: "思いつきのメモから、公開できる文章に寄せやすい。" },
      { title: "A/Bで比べて決めやすい", text: "タイトルや導入の切り口を見比べて選びやすくする。" },
      { title: "SEOやAIOの整えも一緒に進める", text: "読まれる文章にするための下地を先に作れる。" },
    ],
    faq: [
      ["無料版で何が返る？", "タイトル案、導入文、見出し案、本文、SEOタイトル、メタ説明、仕上げメモが返る。"],
      ["無料版とプロプランの違いは？", "無料版は1回。プロプランは比較しながら整えやすい。"],
      ["全ツールパックには入ってる？", "入ってる。文章整形も、案件系や応募文系と一緒に使える。"],
      ["入力内容は保存される？", "無料版は運営側に自動保存しない。"],
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
              { "@type": "Offer", price: "980", priceCurrency: "JPY", name: "プロプラン", billingIncrement: "P1M", description: "月額980円・初月無料・いつでも解約可" },
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
          <p class="lp-note">複数ツールをまとめて使いたい場合は、<a href="${allToolsHref}" target="_blank" rel="noreferrer" style="color:var(--green);font-weight:800;">全ツールパック</a>も使える。</p>
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
