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
checks.push(["home links research writer lp", home.includes('/lp/research-writer/')]);
checks.push(["home no deleted tool links", !home.includes('/lp/radar/') && !home.includes('/lp/proposal-optimizer/') && !home.includes('/lp/article-polish/')]);

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
checks.push(["contact includes research writer", contact.includes('リサーチ記事メーカー') || contact.includes('AIOリサーチアシスタント')]);
checks.push(["contact no deleted tools", !contact.includes('案件レーダー') && !contact.includes('AI応募文最適化') && !contact.includes('AI文章整形')]);

const tools = read(dist("tools/index.html"));
checks.push(["tools mentions research writer", tools.includes('AIOリサーチアシスタント') || tools.includes('リサーチ記事メーカー')]);
checks.push(["tools no deleted main cards", !tools.includes('案件レーダー') && !tools.includes('AI応募文最適化') && !tools.includes('AI文章整形')]);

const sitemap = read(dist("sitemap.xml"));
checks.push(["sitemap includes research writer", sitemap.includes('https://yohelab.com/lp/research-writer/')]);
checks.push(["sitemap excludes deleted apps", !sitemap.includes('/apps/radar/') && !sitemap.includes('/apps/proposal-optimizer/') && !sitemap.includes('/apps/article-polish/')]);

const ent = read(src("functions/lib/entitlements.js"));
checks.push(["entitlement keeps research writer", ent.includes('"research-writer"')]);
checks.push(["entitlement drops deleted tools", !ent.includes('"radar"') && !ent.includes('"proposal-optimizer"') && !ent.includes('"article-polish"')]);

for (const [name, ok] of checks) {
  assert(ok, `Check failed: ${name}`);
  console.log(`OK  ${name}`);
}

console.log(`\nPassed ${checks.length} checks.`);
