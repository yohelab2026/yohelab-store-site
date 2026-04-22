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
const legacyPaths = [
  `/lp/${"rad"}${"ar"}/`,
  `/lp/${"proposal"}-${"optimizer"}/`,
  `/lp/${"article"}-${"polish"}/`,
  `/apps/${"proposal"}/`,
];
const legacyLabels = [
  `案件${"レーダー"}`,
  `AI応募文${"最適化"}`,
  `AI文章${"整形"}`,
  `AI応募文${"アシスタント"}`,
];
checks.push(["home links research writer lp", home.includes('/lp/research-writer/')]);
checks.push(["home no legacy tool links", legacyPaths.every((path) => !home.includes(path))]);

const lpResearchWriter = read(dist("lp/research-writer/index.html"));
checks.push(["lp research writer title", lpResearchWriter.includes('AIO特化リサーチ記事メーカー | よへラボ')]);
checks.push(["lp research writer free", lpResearchWriter.includes('無料版を試す')]);

const researchApp = read(dist("apps/research-writer/index.html"));
checks.push(["research app title", researchApp.includes('AIO特化リサーチ記事メーカー')]);
checks.push(["research app pro cap", researchApp.includes('プロ版は月50セット')]);
checks.push(["research app wp mode", researchApp.includes('WordPress設定も出す')]);

const researchProduct = read(dist("products/research-writer-beta/index.html"));
checks.push(["research product title", researchProduct.includes('AIO特化リサーチ記事メーカー プロプラン')]);
checks.push(["research product price", researchProduct.includes('¥980')]);

const wpApp = read(dist("apps/wordpress-theme/index.html"));
checks.push(["wp app title", wpApp.includes('AIO対応WordPressテーマ')]);
checks.push(["wp app analytics", wpApp.includes('テーマ内解析') && wpApp.includes('外部解析')]);
checks.push(["wp app plugin reduction", wpApp.includes('プラグイン削減')]);

const wpProduct = read(dist("products/wordpress-theme-beta/index.html"));
checks.push(["wp product title", wpProduct.includes('AIO対応WordPressテーマ プロプラン')]);
checks.push(["wp product analytics", wpProduct.includes('テーマ内解析') && wpProduct.includes('外部解析')]);
checks.push(["wp product plugin reduction", wpProduct.includes('プラグイン削減')]);

const contact = read(dist("contact/index.html"));
checks.push(["contact includes research writer", contact.includes('AIO特化リサーチ記事メーカー')]);
checks.push(["contact includes wordpress theme", contact.includes('AIO対応WordPressテーマ')]);
checks.push(["contact no legacy tools", legacyLabels.every((label) => !contact.includes(label))]);

const sitemap = read(dist("sitemap.xml"));
checks.push(["sitemap includes research writer", sitemap.includes('https://yohelab.com/lp/research-writer/')]);
checks.push(["sitemap excludes legacy apps", legacyPaths.every((path) => !sitemap.includes(path))]);

const ent = read(src("functions/lib/entitlements.js"));
checks.push(["entitlement keeps research writer", ent.includes('"research-writer"')]);
checks.push(["entitlement adds wordpress theme", ent.includes('"wordpress-theme"')]);
checks.push(["entitlement drops legacy tools", !ent.includes(`"${"rad"}${"ar"}"`) && !ent.includes(`"${"proposal"}-${"optimizer"}"`) && !ent.includes(`"${"article"}-${"polish"}"` ) && !ent.includes(`"${"proposal"}"` )]);

for (const [name, ok] of checks) {
  assert(ok, `Check failed: ${name}`);
  console.log(`OK  ${name}`);
}

console.log(`\nPassed ${checks.length} checks.`);
