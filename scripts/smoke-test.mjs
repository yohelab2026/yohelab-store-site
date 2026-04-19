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
checks.push(["home links radar app", home.includes('/apps/radar/')]);
checks.push(["home links proposal app", home.includes('/apps/proposal/')]);
checks.push(["home links new app", home.includes('/apps/proposal-optimizer/')]);
checks.push(["home headline", home.includes('案件探しAIを朝10分に')]);
checks.push(["home tools section", home.includes('よへラボの主要ツール')]);
checks.push(["home demo label softened", home.includes('操作イメージ')]);
checks.push(["home no portal claim", !home.includes('カスタマーポータル')]);

const app = read(dist("apps/proposal-optimizer/index.html"));
checks.push(["app title", app.includes('AI応募文最適化')]);
checks.push(["app tool key", app.includes('proposal-optimizer')]);
checks.push(["app free limit", app.includes('無料版は1日1回')]);
checks.push(["app submit button", app.includes('応募文を最適化する')]);
checks.push(["app links product", app.includes('/products/proposal-optimizer-beta/')]);
checks.push(["app mentions opening lines", app.includes('冒頭3行')]);
checks.push(["app has radar prefill banner", app.includes('案件レーダーから引き継ぎました')]);

const product = read(dist("products/proposal-optimizer-beta/index.html"));
checks.push(["product title", product.includes('AI応募文最適化 プロプラン')]);
checks.push(["product payment link", product.includes('client_reference_id=proposal-optimizer')]);
checks.push(["product price", product.includes('月額980円')]);
checks.push(["product mentions opening lines", product.includes('冒頭3行')]);

const radar = read(dist("apps/radar/index.html"));
checks.push(["radar links new app", radar.includes('/apps/proposal-optimizer/')]);
checks.push(["radar label updated", radar.includes('応募文最適化')]);
checks.push(["radar transfer button", radar.includes('この案件で応募文最適化へ')]);

const sitemap = read(dist("sitemap.xml"));
checks.push(["sitemap app url", sitemap.includes('https://yohelab.com/apps/proposal-optimizer/')]);
checks.push(["sitemap product url", sitemap.includes('https://yohelab.com/products/proposal-optimizer-beta/')]);

const gen = read(src("functions/api/generate.js"));
checks.push(["generate prompt", gen.includes('"proposal-optimizer"')]);
checks.push(["generate build prompt", gen.includes('応募文最適化AI')]);
checks.push(["generate includes opening lines", gen.includes('【冒頭3行】')]);
checks.push(["generate supports pro variants", gen.includes('【A案：件名案】')]);

const ent = read(src("functions/lib/entitlements.js"));
checks.push(["entitlement config", ent.includes('"proposal-optimizer"')]);

const contact = read(dist("contact/index.html"));
checks.push(["contact renamed proposal tool", contact.includes('AI応募文最適化')]);
checks.push(["contact includes cancel purpose", contact.includes('解約したい')]);

const commerce = read(dist("legal/commerce/index.html"));
checks.push(["commerce single site name row", (commerce.match(/<th>サイト名<\/th>/g) || []).length === 1]);

const terms = read(dist("legal/terms/index.html"));
checks.push(["terms no email cancel wording", !terms.includes('解約はメール連絡でいつでも可能')]);

for (const [name, ok] of checks) {
  assert(ok, `Check failed: ${name}`);
  console.log(`OK  ${name}`);
}

console.log(`\nPassed ${checks.length} checks.`);
