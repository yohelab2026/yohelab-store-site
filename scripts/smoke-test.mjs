import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.cwd());
const dist = (p) => resolve(root, "dist", p);
const src = (p) => resolve(root, p);

function read(path) {
  if (!existsSync(path)) throw new Error(`Missing file: ${path}`);
  return readFileSync(path, "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const checks = [];

const home = read(dist("index.html"));
const oldPropToken = `${"pro"}${"posal"}`;
const oldOptimizer = `${"opti"}${"mizer"}`;
const legacyPaths = [
  `/lp/${"rad"}${"ar"}/`,
  `/lp/${oldPropToken}-${oldOptimizer}/`,
  `/lp/${"article"}-${"polish"}/`,
  `/apps/${oldPropToken}/`,
  `/apps/${"x"}-${"helper"}/`,
  `/apps/${"ec"}-${"copy"}/`,
  `/apps/${"aio"}-${"mini"}/`,
  `/lp/${"x"}-${"helper"}/`,
  `/lp/${"ec"}-${"copy"}/`,
  `/lp/${"aio"}-${"mini"}/`,
  `/${"tool"}${"s"}/`,
];
const legacyLabels = [
  `案件${"レーダー"}`,
  `AI${"応"}${"募"}文${"最適化"}`,
  `AI文章${"整形"}`,
  `AI${"応"}${"募"}文${"アシスタント"}`,
  `${"X"}投稿ネタ生成ツール`,
  `${"EC"}商品説明・Q&A整備`,
  `${"AIO"}ミニ診断`,
];
checks.push(["home links research writer lp", home.includes('/lp/research-writer/')]);
checks.push(["home no legacy tool links", legacyPaths.every((path) => !home.includes(path))]);

const lpResearchWriter = read(dist("lp/research-writer/index.html"));
checks.push(["lp research writer title", lpResearchWriter.includes('AIOに読まれやすい記事を作る | よへラボ')]);
checks.push(["lp research writer free", lpResearchWriter.includes('無料版を試す')]);

const researchApp = read(dist("apps/research-writer/index.html"));
checks.push(["research app title", researchApp.includes('AIO特化リサーチ記事メーカー')]);
checks.push(["research app pro cap", researchApp.includes('プロ版は月50セット')]);
checks.push(["research app wp mode", researchApp.includes('WordPress設定も出す')]);

const researchProduct = read(dist("products/research-writer-beta/index.html"));
checks.push(["research product title", researchProduct.includes('AIO特化リサーチ記事メーカー プロプラン')]);
checks.push(["research product price", researchProduct.includes('¥1,980')]);

const wpApp = read(dist("apps/wordpress-theme/index.html"));
checks.push(["wp app title", wpApp.includes('AIO対応WordPressテーマ')]);
checks.push(["wp app analytics", wpApp.includes('テーマ内解析') && wpApp.includes('外部解析')]);
checks.push(["wp app plugin reduction", wpApp.includes('プラグインを増やしすぎない') || wpApp.includes('プラグイン追加ゼロ')]);
checks.push(["wp app starter download", wpApp.includes('/downloads/aio-starter.zip') && existsSync(dist("downloads/aio-starter.zip"))]);
checks.push(["wp app install guide", wpApp.includes('WordPressに入れる手順') && wpApp.includes('保証しないこと')]);

const wpProduct = read(dist("products/wordpress-theme-beta/index.html"));
checks.push(["wp product title", wpProduct.includes('AIO対応WordPressテーマ 用途別ライン')]);
checks.push(["wp product analytics", wpProduct.includes('テーマ内解析') && wpProduct.includes('外部解析')]);
checks.push(["wp product price pending", wpProduct.includes('価格未定')]);
checks.push(["wp product support policy", wpProduct.includes('サポートと保証の線引き') && wpProduct.includes('販売前の最終確認表')]);

checks.push(["research product sample and purchase flow", researchProduct.includes('プロプランで返すもの') && researchProduct.includes('申し込み後の流れ')]);

const contact = read(dist("contact/index.html"));
checks.push(["contact includes research writer", contact.includes('AIO特化リサーチ記事メーカー')]);
checks.push(["contact includes wordpress theme", contact.includes('AIO対応WordPressテーマ')]);
checks.push(["contact no legacy tools", legacyLabels.every((label) => !contact.includes(label))]);

const sitemap = read(dist("sitemap.xml"));
checks.push(["sitemap includes research writer", sitemap.includes('https://yohelab.com/lp/research-writer/')]);
checks.push(["sitemap excludes legacy apps", legacyPaths.every((path) => !sitemap.includes(path))]);
checks.push(["sitemap excludes removed labs", !sitemap.includes('https://yohelab.com/labs/')]);
checks.push(["sitemap includes all game pages", ["reaction", "typing", "math-rush", "sequence"].every((slug) => sitemap.includes(`https://yohelab.com/games/${slug}/`))]);

const gameScript = read(dist("shared/arcade-game.js"));
checks.push(["game share keeps result data", gameScript.includes('searchParams.set("score"') && gameScript.includes('searchParams.set("result"')]);

const ent = read(src("functions/lib/entitlements.js"));
checks.push(["entitlement keeps research writer", ent.includes('"research-writer"')]);
checks.push(["entitlement adds wordpress theme", ent.includes('"wordpress-theme"')]);
checks.push(["entitlement drops legacy tools", !ent.includes(`"${"rad"}${"ar"}"`) && !ent.includes(`"${oldPropToken}-${oldOptimizer}"`) && !ent.includes(`"${"article"}-${"polish"}"` ) && !ent.includes(`"${oldPropToken}"` ) && !ent.includes(`"${"x"}-${"helper"}"` ) && !ent.includes(`"${"ec"}-${"copy"}"` ) && !ent.includes(`"${"aio"}-${"mini"}"` )]);

for (const [name, ok] of checks) {
  assert(ok, `Check failed: ${name}`);
  console.log(`OK  ${name}`);
}

console.log(`\nPassed ${checks.length} checks.`);
