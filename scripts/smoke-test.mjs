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
checks.push(["home links new app", home.includes('/apps/proposal-optimizer/')]);
checks.push(["home headline", home.includes('案件探しAIを朝10分に')]);

const app = read(dist("apps/proposal-optimizer/index.html"));
checks.push(["app title", app.includes('AI応募文最適化')]);
checks.push(["app tool key", app.includes('proposal-optimizer')]);
checks.push(["app free limit", app.includes('無料版は1日1回')]);
checks.push(["app submit button", app.includes('応募文を最適化する')]);
checks.push(["app links product", app.includes('/products/proposal-optimizer-beta/')]);

const product = read(dist("products/proposal-optimizer-beta/index.html"));
checks.push(["product title", product.includes('AI応募文最適化 プロプラン')]);
checks.push(["product payment link", product.includes('client_reference_id=proposal-optimizer')]);
checks.push(["product price", product.includes('月額980円')]);

const radar = read(dist("apps/radar/index.html"));
checks.push(["radar links new app", radar.includes('/apps/proposal-optimizer/')]);
checks.push(["radar label updated", radar.includes('応募文最適化')]);

const sitemap = read(dist("sitemap.xml"));
checks.push(["sitemap app url", sitemap.includes('https://yohelab.com/apps/proposal-optimizer/')]);
checks.push(["sitemap product url", sitemap.includes('https://yohelab.com/products/proposal-optimizer-beta/')]);

const gen = read(src("functions/api/generate.js"));
checks.push(["generate prompt", gen.includes('"proposal-optimizer"')]);
checks.push(["generate build prompt", gen.includes('応募文最適化AI')]);

const ent = read(src("functions/lib/entitlements.js"));
checks.push(["entitlement config", ent.includes('"proposal-optimizer"')]);

for (const [name, ok] of checks) {
  assert(ok, `Check failed: ${name}`);
  console.log(`OK  ${name}`);
}

console.log(`\nPassed ${checks.length} checks.`);
