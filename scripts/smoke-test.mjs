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
checks.push(["lp research writer title", lpResearchWriter.includes('AIOリサーチアシスタント | よへラボ')]);
checks.push(["lp research writer free", lpResearchWriter.includes('無料版を試す')]);

const researchApp = read(dist("apps/research-writer/index.html"));
checks.push(["research app title", researchApp.includes('AIOリサーチアシスタント')]);
checks.push(["research app pro cap", researchApp.includes('プロ版は月50セット')]);
checks.push(["research app wp mode", researchApp.includes('WordPress設定も出す')]);

const researchProduct = read(dist("products/research-writer-beta/index.html"));
checks.push(["research product title", researchProduct.includes('AIOリサーチアシスタント プロプラン')]);
checks.push(["research product price", researchProduct.includes('¥1,980')]);

const contact = read(dist("contact/index.html"));
checks.push(["contact includes research writer", contact.includes('AIOリサーチアシスタント')]);
checks.push(["contact no legacy tools", legacyLabels.every((label) => !contact.includes(label))]);

const tools = read(dist("tools/index.html"));
checks.push(["tools mentions research writer", tools.includes('AIOリサーチアシスタント')]);
checks.push(["tools no legacy main cards", legacyLabels.every((label) => !tools.includes(label))]);

const sitemap = read(dist("sitemap.xml"));
checks.push(["sitemap includes research writer", sitemap.includes('https://yohelab.com/lp/research-writer/')]);
checks.push(["sitemap excludes legacy apps", legacyPaths.every((path) => !sitemap.includes(path))]);

const ent = read(src("functions/lib/entitlements.js"));
checks.push(["entitlement keeps research writer", ent.includes('"research-writer"')]);
checks.push(["entitlement drops legacy tools", !ent.includes(`"${"rad"}${"ar"}"`) && !ent.includes(`"${"proposal"}-${"optimizer"}"`) && !ent.includes(`"${"article"}-${"polish"}"` ) && !ent.includes(`"${"proposal"}"` )]);

for (const [name, ok] of checks) {
  assert(ok, `Check failed: ${name}`);
  console.log(`OK  ${name}`);
}

console.log(`\nPassed ${checks.length} checks.`);
