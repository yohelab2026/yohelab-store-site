import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.cwd());
const dist = (p) => resolve(root, "dist", p);
const src = (p) => resolve(root, p);

function read(path) {
  if (!existsSync(path)) {
    throw new Error(`Missing file: ${path}`);
  }
  return readFileSync(path, "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const checks = [];

const home = read(dist("index.html"));
checks.push(["home links radar lp", home.includes('/lp/radar/')]);
checks.push(["home links proposal lp", home.includes('/lp/proposal/')]);
checks.push(["home links new app lp", home.includes('/lp/proposal-optimizer/')]);
checks.push(["home links article polish lp", home.includes('/lp/article-polish/')]);
checks.push(["home headline", home.includes('仕事 もっと') && home.includes('AIが動く')]);
checks.push(["home hero eyebrow", home.includes('ひとりで稼ぐ人のための場所')]);
checks.push(["home tools section", home.includes('案件探し・応募文・文章整形')]);
checks.push(["home focus on three", home.includes('また止まった') && home.includes('なくなっていく')]);
checks.push(["home pricing bundle", home.includes('全ツールパック ¥1,980/月')]);
checks.push(["home no vague price", !home.includes('月額¥980〜')]);
checks.push(["home proof screenshots", home.includes('raw.githubusercontent.com/yohelab2026/yohelab-store-site/main/public/proof/radar-app.png') && home.includes('raw.githubusercontent.com/yohelab2026/yohelab-store-site/main/public/proof/proposal-optimizer-app.png')]);
checks.push(["home proof voices", home.includes('テスト時によく出る反応')]);

const lpRadar = read(dist("lp/radar/index.html"));
checks.push(["lp radar title", lpRadar.includes('案件レーダー | よへラボ')]);
checks.push(["lp radar free", lpRadar.includes('無料版を試す')]);
checks.push(["lp radar pro", lpRadar.includes('初月無料で始める')]);
checks.push(["lp radar paid label", lpRadar.includes('プロプランで増えるもの')]);
checks.push(["lp radar no internal copy", !lpRadar.includes('LPの役目')]);
checks.push(["lp radar proof section", lpRadar.includes('実際の画面と、よくある反応')]);

const lpProposal = read(dist("lp/proposal/index.html"));
checks.push(["lp proposal title", lpProposal.includes('AI応募文アシスタント | よへラボ')]);
checks.push(["lp proposal free", lpProposal.includes('無料版を試す')]);

const lpProposalOptimizer = read(dist("lp/proposal-optimizer/index.html"));
checks.push(["lp proposal optimizer title", lpProposalOptimizer.includes('AI応募文最適化 | よへラボ')]);
checks.push(["lp proposal optimizer free", lpProposalOptimizer.includes('無料版を試す')]);
checks.push(["lp proposal optimizer pro", lpProposalOptimizer.includes('件名案')]);
checks.push(["lp proposal optimizer proof section", lpProposalOptimizer.includes('実際の画面と、よくある反応')]);

const lpArticlePolish = read(dist("lp/article-polish/index.html"));
checks.push(["lp article polish title", lpArticlePolish.includes('AI文章整形 | よへラボ')]);
checks.push(["lp article polish free", lpArticlePolish.includes('無料版を試す')]);
checks.push(["lp article polish pro", lpArticlePolish.includes('全ツールパックで使う')]);
checks.push(["lp article polish paid label", lpArticlePolish.includes('プロプランで増えるもの')]);
checks.push(["lp article polish no internal copy", !lpArticlePolish.includes('LPの役目')]);
checks.push(["lp article polish proof section", lpArticlePolish.includes('実際の画面と、よくある反応')]);

const lpXHelper = read(dist("lp/x-helper/index.html"));
checks.push(["lp x helper title", lpXHelper.includes('AI X返信・投稿補助 | よへラボ')]);

const lpEcCopy = read(dist("lp/ec-copy/index.html"));
checks.push(["lp ec copy title", lpEcCopy.includes('EC商品説明・Q&amp;A整備 | よへラボ')]);

const lpAioMini = read(dist("lp/aio-mini/index.html"));
checks.push(["lp aio mini title", lpAioMini.includes('AIOミニ診断 | よへラボ')]);

const app = read(dist("apps/proposal-optimizer/index.html"));
checks.push(["app title", app.includes('AI応募文最適化')]);
checks.push(["app tool key", app.includes('proposal-optimizer')]);
checks.push(["app free limit", app.includes('無料版は1日1回')]);
checks.push(["app submit button", app.includes('応募文を最適化する')]);
checks.push(["app links product", app.includes('/products/proposal-optimizer-beta/')]);
checks.push(["app mentions opening lines", app.includes('冒頭3行')]);
checks.push(["app has radar prefill banner", app.includes('案件レーダーから引き継ぎました')]);

const articleApp = read(dist("apps/article-polish/index.html"));
checks.push(["article app title", articleApp.includes('AI文章整形')]);
checks.push(["article app tool key", articleApp.includes('article-polish')]);
checks.push(["article app free limit", articleApp.includes('無料版は1日1回')]);
checks.push(["article app submit button", articleApp.includes('文章を整える')]);
checks.push(["article app mentions seo", articleApp.includes('SEO / AIOを意識')]);
checks.push(["article app links product", articleApp.includes('/products/article-polish-beta/')]);

const product = read(dist("products/proposal-optimizer-beta/index.html"));
checks.push(["product title", product.includes('AI応募文最適化 プロプラン')]);
checks.push(["product payment link", product.includes('client_reference_id=proposal-optimizer')]);
checks.push(["product price", product.includes('月額980円')]);
checks.push(["product mentions opening lines", product.includes('冒頭3行')]);

const articleProduct = read(dist("products/article-polish-beta/index.html"));
checks.push(["article product title", articleProduct.includes('AI文章整形 プロプラン')]);
checks.push(["article product bundle link", articleProduct.includes('client_reference_id=all-tools')]);
checks.push(["article product free link", articleProduct.includes('/apps/article-polish/')]);
checks.push(["article product consultation", articleProduct.includes('導入相談する')]);

const radar = read(dist("apps/radar/index.html"));
checks.push(["radar links new app", radar.includes('/apps/proposal-optimizer/')]);
checks.push(["radar label updated", radar.includes('応募文最適化')]);
checks.push(["radar transfer button", radar.includes('この案件で応募文最適化へ')]);

const sitemap = read(dist("sitemap.xml"));
checks.push(["sitemap app url", sitemap.includes('https://yohelab.com/apps/proposal-optimizer/')]);
checks.push(["sitemap product url", sitemap.includes('https://yohelab.com/products/proposal-optimizer-beta/')]);
checks.push(["sitemap article app url", sitemap.includes('https://yohelab.com/apps/article-polish/')]);
checks.push(["sitemap article product url", sitemap.includes('https://yohelab.com/products/article-polish-beta/')]);
checks.push(["sitemap lp radar", sitemap.includes('https://yohelab.com/lp/radar/')]);
checks.push(["sitemap lp proposal optimizer", sitemap.includes('https://yohelab.com/lp/proposal-optimizer/')]);
checks.push(["sitemap lp article polish", sitemap.includes('https://yohelab.com/lp/article-polish/')]);

const gen = read(src("functions/api/generate.js"));
checks.push(["generate prompt", gen.includes('"proposal-optimizer"')]);
checks.push(["generate build prompt", gen.includes('応募文最適化AI')]);
checks.push(["generate includes opening lines", gen.includes('【冒頭3行】')]);
checks.push(["generate supports pro variants", gen.includes('【A案：件名案】')]);
checks.push(["generate article polish prompt", gen.includes('"article-polish"')]);
checks.push(["generate article polish build prompt", gen.includes('文章の用途')]);

const ent = read(src("functions/lib/entitlements.js"));
checks.push(["entitlement config", ent.includes('"proposal-optimizer"')]);
checks.push(["entitlement article polish", ent.includes('"article-polish"')]);

const contact = read(dist("contact/index.html"));
checks.push(["contact renamed proposal tool", contact.includes('AI応募文最適化')]);
checks.push(["contact includes cancel purpose", contact.includes('解約したい')]);
checks.push(["contact includes article polish", contact.includes('AI文章整形')]);

const tools = read(dist("tools/index.html"));
checks.push(["tools page title", tools.includes('AI実務ツール一覧')]);
checks.push(["tools page mentions article polish", tools.includes('AI文章整形')]);
checks.push(["tools page no labs card", !tools.includes('Labs（WordPress・Chrome拡張）')]);
checks.push(["tools page no labs wordpress link", !tools.includes('/labs/wordpress/')]);
checks.push(["tools page no labs chrome link", !tools.includes('/labs/chrome/')]);
checks.push(["tools page no games nav", !tools.includes('>ゲーム<')]);

const commerce = read(dist("legal/commerce/index.html"));
checks.push(["commerce single site name row", (commerce.match(/<th>サイト名<\/th>/g) || []).length === 1]);

const terms = read(dist("legal/terms/index.html"));
checks.push(["terms no email cancel wording", !terms.includes('解約はメール連絡でいつでも可能')]);

for (const [name, ok] of checks) {
  assert(ok, `Check failed: ${name}`);
  console.log(`OK  ${name}`);
}

console.log(`\nPassed ${checks.length} checks.`);
