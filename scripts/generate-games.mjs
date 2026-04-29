import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.cwd());
const gamesRoot = resolve(root, "games");
const sharedCss = "/shared/arcade.css";
const sharedGameJs = "/shared/arcade-game.js";

const games = [
  {
    slug: "clear-road",
    title: "クリアロード",
    name: "クリアロード",
    description: "3本のレーンを避けながら進む、1分で終わるブラウザゲーム。",
    lead: "スマホで片手でも遊べる、いちばん入りやすい定番。障害物をよけ続けて、どこまで生き残れるかだけを見る。",
    icon: "🛣️",
    badge: "1分で遊べる",
    mode: "dodge",
    timeLimit: 30,
    startText: "左・右でレーン移動",
    runningText: "よけ続ける",
    hints: ["左か右に動いて避ける", "短時間で集中しやすい", "スマホの親指で遊びやすい"],
    bullets: ["レーンを避けるだけ", "短い", "何回もやり直せる"],
  },
  {
    slug: "coin-run",
    title: "コインラン",
    name: "コインラン",
    description: "コインを拾って、爆弾だけ避ける。反射だけで遊べる短時間ゲーム。",
    lead: "見るものを減らして、拾うか避けるかだけに絞った。スマホ時代の軽いゲームとして作りやすい形。",
    icon: "🪙",
    badge: "拾うだけ",
    mode: "collect",
    timeLimit: 30,
    startText: "星を拾って、爆弾は避ける",
    runningText: "星を集める",
    hints: ["星だけ拾う", "爆弾は触らない", "目標数まで集める"],
    bullets: ["星を集める", "爆弾を避ける", "短くて分かりやすい"],
  },
  {
    slug: "fruit-catch",
    title: "フルーツキャッチ",
    name: "フルーツキャッチ",
    description: "フルーツだけ拾って、爆弾は避ける。スマホで遊びやすい拾う系ゲーム。",
    lead: "コインランの気持ちよさをそのままに、見た目を少し変えた1本。短くて、何度も遊びやすい。",
    icon: "🍓",
    badge: "拾って避ける",
    mode: "collect",
    timeLimit: 30,
    startText: "フルーツを拾って、爆弾は避ける",
    runningText: "フルーツ回収中",
    hints: ["フルーツだけ拾う", "爆弾は触らない", "短く終わる"],
    bullets: ["見た目が分かりやすい", "片手で遊びやすい", "すぐ再挑戦できる"],
  },
  {
    slug: "stack-tower",
    title: "スタックタワー",
    name: "スタックタワー",
    description: "動くブロックを止めて積み上げる、タイミング命の積み上げゲーム。",
    lead: "1回のタップで決まる、単純だけど何度でもやりたくなるタイプ。縦持ちでも遊びやすい。",
    icon: "🧱",
    badge: "タイミング勝負",
    mode: "stack",
    timeLimit: 60,
    startText: "タイミングよく積む",
    runningText: "積み上げ中",
    hints: ["1回ずつタップ", "ズレると細くなる", "8段積めばクリア"],
    bullets: ["ワンボタン", "失敗がすぐ分かる", "繰り返し遊びやすい"],
  },
  {
    slug: "color-switch",
    title: "カラースイッチ",
    name: "カラースイッチ",
    description: "表示された色名に合うボタンを押す、見分け系の瞬発ゲーム。",
    lead: "小さい画面でも伝わる。色の見分けと瞬間判断だけで進む、短いラウンド向けのゲーム。",
    icon: "🎨",
    badge: "見分ける",
    mode: "color",
    timeLimit: 30,
    startText: "色を見て選ぶ",
    runningText: "連続正解を狙う",
    hints: ["色名に合わせて押す", "10問でクリア", "失敗してもすぐ次へ"],
    bullets: ["色で迷う", "短問数", "スマホ向き"],
  },
  {
    slug: "pair-memory",
    title: "ペアメモ",
    name: "ペアメモ",
    description: "カードをめくって同じ絵をそろえる、王道の記憶ゲーム。",
    lead: "定番だけど、1ゲームが短くて終わるからスマホでも入りやすい。絵柄はシンプルにしてある。",
    icon: "🧠",
    badge: "定番パズル",
    mode: "memory",
    timeLimit: 90,
    startText: "同じ絵を2枚探す",
    runningText: "ペア探し中",
    hints: ["同じ絵を2枚そろえる", "全部そろえるとクリア", "記憶だけで進める"],
    bullets: ["わかりやすい", "年齢を選びにくい", "何回でも挑戦しやすい"],
  },
  {
    slug: "orbit-escape",
    title: "オービットエスケープ",
    name: "オービットエスケープ",
    description: "ぐるっと回る障害物を避ける、円周移動の回避ゲーム。",
    lead: "横スクロールじゃなく、円の上を回るので見た目が変わる。短時間で判断が続くタイプ。",
    icon: "🛰️",
    badge: "回避アクション",
    mode: "orbit",
    timeLimit: 30,
    startText: "左右で回って避ける",
    runningText: "回避中",
    hints: ["左回り・右回りで動く", "赤い障害物を避ける", "30秒生き残る"],
    bullets: ["見た目が変わる", "動作が軽い", "スマホでも分かりやすい"],
  },
  {
    slug: "tap-rush",
    title: "タップラッシュ",
    name: "タップラッシュ",
    description: "出てきたターゲットを連打する、反応速度だけのゲーム。",
    lead: "説明いらずで始まるタイプ。1分前後の空き時間にいちばん入りやすい。",
    icon: "⚡",
    badge: "連打ゲーム",
    mode: "tap",
    timeLimit: 30,
    startText: "ターゲットを叩く",
    runningText: "出たら押す",
    hints: ["見つけたらすぐタップ", "消える前に押す", "回数を稼ぐ"],
    bullets: ["直感的", "短い", "中毒性を出しやすい"],
  },
  {
    slug: "blink-rush",
    title: "ブリンクラッシュ",
    name: "ブリンクラッシュ",
    description: "一瞬だけ出るターゲットを拾う、反射だけの短距離ゲーム。",
    lead: "タップラッシュよりも少し速く、見つけた瞬間に押す感覚を強くした1本。スマホ向け。",
    icon: "💡",
    badge: "反射ゲーム",
    mode: "tap",
    timeLimit: 25,
    startText: "一瞬で出る丸を押す",
    runningText: "見逃さず押す",
    hints: ["出たらすぐ押す", "消える前にタップ", "短い集中で終わる"],
    bullets: ["短い", "分かりやすい", "スマホで気持ちいい"],
  },
  {
    slug: "number-order",
    title: "ナンバーオーダー",
    name: "ナンバーオーダー",
    description: "1から順番に数字を押す、集中型のミニゲーム。",
    lead: "頭を少し使うけど、ルールはかなり単純。スマホでもテーブルでも遊びやすい構成。",
    icon: "🔢",
    badge: "順番ゲーム",
    mode: "number",
    timeLimit: 45,
    startText: "1から順番に押す",
    runningText: "順番を追う",
    hints: ["1から順に押す", "間違えてもすぐ戻る", "12までいけばクリア"],
    bullets: ["ルールが短い", "頭を使う", "小さく遊べる"],
  },
  {
    slug: "reaction",
    title: "反応速度テスト",
    name: "反応速度テスト",
    description: "緑になった瞬間に押す、反応速度を測る短時間ゲーム。",
    lead: "待って、色が変わった瞬間に押すだけ。3回の平均で自分の反応速度を見られる。",
    icon: "⚡",
    badge: "人気",
    mode: "reaction",
    timeLimit: 30,
    hideTimer: true,
    lowerIsBetter: true,
    scoreLabel: "{n}ms",
    shareText: "反応速度テストの結果は平均{score}ms！",
    startText: "緑になったら押す",
    runningText: "合図を待つ",
    hints: ["緑になるまで待つ", "早押ししすぎるとやり直し", "3回測って平均を見る"],
    bullets: ["一瞬で分かる", "シェアしやすい", "スマホでもPCでも遊べる"],
  },
  {
    slug: "typing",
    title: "タイピングラッシュ",
    name: "タイピングラッシュ",
    description: "30秒で何語打てるかを競う、短時間タイピングゲーム。",
    lead: "表示された単語を打ってEnter。シンプルだけど、スコアが出るともう一回やりたくなる。",
    icon: "⌨️",
    badge: "入力系",
    mode: "typing",
    timeLimit: 30,
    startText: "単語を打ってEnter",
    runningText: "タイピング中",
    hints: ["表示された単語を入力", "Enterで判定", "30秒で何語打てるか競う"],
    bullets: ["PC向け", "スコアが分かりやすい", "短く競える"],
  },
  {
    slug: "math-rush",
    title: "計算ラッシュ",
    name: "計算ラッシュ",
    description: "30秒で計算問題を何問解けるかを競う、4択の脳トレゲーム。",
    lead: "足し算・引き算・掛け算を4択で答える。短い時間で頭を起こすタイプのゲーム。",
    icon: "🔢",
    badge: "計算",
    mode: "math",
    timeLimit: 30,
    startText: "正しい答えを選ぶ",
    runningText: "計算中",
    hints: ["問題を見て答えを選ぶ", "間違えても次へ進む", "30秒で正解数を伸ばす"],
    bullets: ["スマホでも押しやすい", "短い脳トレ", "数字だけで遊べる"],
  },
  {
    slug: "sequence",
    title: "カラーシーケンス",
    name: "カラーシーケンス",
    description: "光った順番を覚えて同じ順番で押す、記憶力ゲーム。",
    lead: "光った色の順番を覚える。レベルが上がるほど長くなるので、短いけど集中力がいる。",
    icon: "🌈",
    badge: "記憶",
    mode: "sequence",
    timeLimit: 90,
    startText: "光った順番を覚える",
    runningText: "順番を再現する",
    hints: ["光った順番を覚える", "同じ順番で押す", "レベルが上がると長くなる"],
    bullets: ["記憶力勝負", "何度も挑戦できる", "スマホで遊びやすい"],
  },
];

function pageTemplate(game) {
  const badges = [
    game.badge,
    "スマホ向け",
    "登録不要",
    "無料",
  ];
  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${game.name} | よへラボゲーム</title>
  <meta name="description" content="${game.description}" />
  <meta property="og:title" content="${game.name} | よへラボゲーム" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://yohelab.com/games/${game.slug}/" />
  <meta property="og:image" content="https://yohelab.com/yohelab-icon.png" />
  <meta name="theme-color" content="#f5fbff" />
  <link rel="icon" type="image/png" href="/yohelab-icon.png" />
  <link rel="stylesheet" href="/shared/site.css" />
  <link rel="stylesheet" href="${sharedCss}" />
</head>
<body>
  <header class="nav lp-nav">
    <div class="nav-inner">
      <a class="brand brand-light" href="/">
        <img src="/yohelab-icon.png" alt="よへラボ" />
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
    <section class="arcade-hero">
      <div class="container">
        <p class="arcade-eyebrow">🧪 ブラウザで1分</p>
        <h1>${game.name}</h1>
        <p>${game.lead}</p>
        <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:18px;">
          ${badges.map((b) => `<span class="hero-chip" style="background:#ffffff;color:var(--arcade-green);border-color:rgba(16,184,146,.2)">${b}</span>`).join("")}
        </div>
      </div>
    </section>

    <section class="arcade-shell">
      <div class="container">
        <div class="arcade-grid" id="gameRoot">
          <div class="arcade-panel">
            <div class="arcade-top">
              <div class="arcade-stats">
                <div class="arcade-stat"><span class="label">スコア</span><span class="value" id="statScore">0</span></div>
                <div class="arcade-stat"><span class="label">残り時間</span><span class="value" id="statTime">${game.timeLimit}秒</span></div>
                <div class="arcade-stat"><span class="label">ベスト</span><span class="value" id="statBest">0</span></div>
              </div>
              <div class="arcade-actions">
                <button class="btn-arcade primary" id="startBtn">スタート</button>
                <button class="btn-arcade" id="restartBtn">やり直す</button>
              </div>
            </div>
            <div class="arcade-board" id="board">
              <div class="game-banner">READY</div>
            </div>
            <div class="touch-pad" id="touchPad"></div>
            <div class="arcade-footer-note" id="statusText">${game.startText}</div>
          </div>
          <aside class="arcade-side">
            <h3>遊び方</h3>
            <ul id="hintList">
              ${game.hints.map((h) => `<li>${h}</li>`).join("")}
            </ul>
            <div class="arcade-tip">${game.description}</div>
            <p style="margin-top:14px;">ゲームは全部ブラウザだけ。サーバーの負荷をほぼ増やさない軽い作り。</p>
          </aside>
        </div>
      </div>
    </section>
  </main>

  <script>
    window.YOHE_GAME = ${JSON.stringify({
      slug: game.slug,
      mode: game.mode,
      timeLimit: game.timeLimit,
      startText: game.startText,
      runningText: game.runningText,
      hints: game.hints,
      shareUrl: `https://yohelab.com/games/${game.slug}/`,
      hideTimer: game.hideTimer,
      lowerIsBetter: game.lowerIsBetter,
      scoreLabel: game.scoreLabel,
      shareText: game.shareText,
      noBest: game.noBest,
    })};
  </script>
  <script src="${sharedGameJs}"></script>
</body>
</html>`;
}

for (const game of games) {
  const dir = resolve(gamesRoot, game.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, "index.html"), pageTemplate(game), "utf8");
}

console.log(`Generated ${games.length} game pages.`);
