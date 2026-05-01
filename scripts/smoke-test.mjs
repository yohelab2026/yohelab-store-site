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
checks.push(["home links research writer app", home.includes('/apps/research-writer/')]);
checks.push(["home no legacy tool links", legacyPaths.every((path) => !home.includes(path))]);
checks.push(["home links tools hub", home.includes('/tools/')]);
checks.push(["home links services hub", home.includes('/services/')]);
checks.push(["home avoids overstated claims", !home.includes("AIに引用される") && !home.includes("引用されないブログ") && !home.includes("5,377億") && !home.includes("3.6兆")]);
checks.push(["tools avoids overstated claims", !read(dist("tools/index.html")).includes("AIに引用される") && !read(dist("tools/index.html")).includes("引用される構造")]);

const footerLinks = [
  '© よへラボ / yohelab.com',
  'href="/"',
  'href="/tools/"',
  'href="/services/"',
  'href="/blog/"',
  'href="/contact/"',
  'href="/legal/commerce/"',
  'href="/legal/privacy/"',
  'href="/legal/terms/"',
];
const footerPages = [
  "index.html",
  "tools/index.html",
  "services/index.html",
  "blog/index.html",
  "blog/post/index.html",
  "blog/admin/index.html",
  "apps/research-writer/index.html",
  "lp/research-writer/index.html",
  "lp/bunsirube/index.html",
  "products/research-writer-beta/index.html",
  "products/page-review/index.html",
  "products/bunsirube/index.html",
  "contact/index.html",
  "contact/bug/index.html",
  "games/index.html",
  "games/reaction/index.html",
  "legal/commerce/index.html",
  "legal/privacy/index.html",
  "legal/terms/index.html",
  "pro/activate-pending/index.html",
];
checks.push(["footer is unified across public pages", footerPages.every((page) => {
  const html = read(dist(page));
  return footerLinks.every((needle) => html.includes(needle));
})]);

const lpResearchWriter = read(dist("lp/research-writer/index.html"));
checks.push(["lp research writer title", lpResearchWriter.includes('記事メーカー') && lpResearchWriter.includes('よへラボ')]);
checks.push(["lp research writer free", lpResearchWriter.includes('無料で試す') || lpResearchWriter.includes('無料版を試す')]);
checks.push(["lp research writer safe claims", !lpResearchWriter.includes("AIに引用される") && !lpResearchWriter.includes("唯一の媒体") && !lpResearchWriter.includes("5,377億") && !lpResearchWriter.includes("3.6兆")]);
checks.push(["lp research writer avoids unbuilt auto posting", !lpResearchWriter.includes("WordPress自動投稿設定") && !lpResearchWriter.includes("優先キュー")]);

const researchApp = read(dist("apps/research-writer/index.html"));
checks.push(["research app title", researchApp.includes('3キーワードで、記事の材料と下書きを作る')]);
checks.push(["research app pro cap", researchApp.includes('プロ版は月50セット')]);
checks.push(["research app wp mode", researchApp.includes('WordPress設定も出す')]);

const researchProduct = read(dist("products/research-writer-beta/index.html"));
checks.push(["research product title", researchProduct.includes('3キーワードの記事メーカー プロプラン')]);
checks.push(["research product price", researchProduct.includes('¥1,980')]);

const wpProduct = read(dist("products/bunsirube/index.html"));
checks.push(["wp product title", wpProduct.includes('文標（ぶんしるべ）') && wpProduct.includes('WordPressテーマ')]);
checks.push(["wp product analytics", wpProduct.includes('テーマ内解析') && wpProduct.includes('外部解析')]);
checks.push(["wp product price", wpProduct.includes('¥5,500')]);
checks.push(["wp product support policy", wpProduct.includes('サポートと保証の線引き') && wpProduct.includes('購入前に確認してほしいこと')]);

checks.push(["research product sample and purchase flow", researchProduct.includes('プロプランで返すもの') && researchProduct.includes('購入後の流れ')]);
checks.push(["research product checkout cta", researchProduct.includes('https://buy.stripe.com/aFa4gr6jd6Pu4KC7eV73G0d?client_reference_id=research-writer') && researchProduct.includes('1日1セットまで')]);

const contact = read(dist("contact/index.html"));
checks.push(["contact includes research writer", contact.includes('3キーワードの記事メーカー')]);
checks.push(["contact removes shortcut cards", !contact.includes('ツール一覧') && !contact.includes('サービス一覧') && !contact.includes('各ページへ直接行く')]);
checks.push(["contact removes cancellation wording", !contact.includes('解約')]);
checks.push(["contact no legacy tools", legacyLabels.every((label) => !contact.includes(label))]);

const sitemap = read(dist("sitemap.xml"));
checks.push(["sitemap includes research writer", sitemap.includes('https://yohelab.com/lp/research-writer/')]);
checks.push(["sitemap excludes legacy apps", legacyPaths.every((path) => !sitemap.includes(path))]);
checks.push(["sitemap excludes removed labs", !sitemap.includes('https://yohelab.com/labs/')]);
checks.push(["sitemap excludes retired product redirects", !sitemap.includes('https://yohelab.com/products/article-starter-kit/') && !sitemap.includes('https://yohelab.com/products/wordpress-theme-beta/')]);
checks.push(["sitemap includes three sales pages", sitemap.includes('https://yohelab.com/lp/research-writer/') && sitemap.includes('https://yohelab.com/lp/bunsirube/') && sitemap.includes('https://yohelab.com/products/page-review/')]);
checks.push(["sitemap includes all game pages", ["reaction", "typing", "math-rush", "sequence"].every((slug) => sitemap.includes(`https://yohelab.com/games/${slug}/`))]);

const gameScript = read(dist("shared/arcade-game.js"));
checks.push(["game share keeps result data", gameScript.includes('searchParams.set("score"') && gameScript.includes('searchParams.set("result"')]);

const ent = read(src("functions/lib/entitlements.js"));
const checkout = read(src("functions/api/checkout.js"));
const blogAdminGate = read(src("functions/blog/admin/[[catchall]].js"));
const blogAdmin = read(dist("blog/admin/index.html"));
const blogPostFunction = read(src("functions/blog/post/index.js"));
const blogPostPage = read(dist("blog/post/index.html"));
const matomoLoader = read(dist("shared/matomo-loader.js"));
checks.push(["theme serial uses bunsirube prefix", ent.includes("BUN-") && !ent.includes("AIO-")]);
checks.push(["entitlement keeps research writer", ent.includes('"research-writer"')]);
checks.push(["entitlement adds wordpress theme", ent.includes('"wordpress-theme"')]);
checks.push(["entitlement adds page review", ent.includes('"page-review"')]);
checks.push(["entitlement drops legacy tools", !ent.includes(`"${"rad"}${"ar"}"`) && !ent.includes(`"${oldPropToken}-${oldOptimizer}"`) && !ent.includes(`"${"article"}-${"polish"}"` ) && !ent.includes(`"${oldPropToken}"` ) && !ent.includes(`"${"x"}-${"helper"}"` ) && !ent.includes(`"${"ec"}-${"copy"}"` ) && !ent.includes(`"${"aio"}-${"mini"}"` )]);
checks.push(["checkout function redirects to tracked payment links", checkout.includes('https://buy.stripe.com/aFa4gr6jd6Pu4KC7eV73G0d?client_reference_id=research-writer') && checkout.includes('https://buy.stripe.com/bJeaEPfTN2ze2Cubvb73G0e?client_reference_id=wordpress-theme') && checkout.includes('https://buy.stripe.com/bJedR10YTddS4KC42J73G0f?client_reference_id=page-review')]);
checks.push(["blog admin page is reachable behind page login", blogAdminGate.includes("context.next()") && blogAdminGate.includes("noindex") && !blogAdminGate.includes("ADMIN_KEY")]);
checks.push(["blog admin validates pin server side", blogAdmin.includes("/api/blog-auth") && blogAdmin.includes("SESSION_PIN_KEY") && !blogAdmin.includes("localStorage.setItem(PIN_KEY")]);
checks.push(["blog post sanitizes dangerous html server side", blogPostFunction.includes("sanitizeBodyHtml") && blogPostFunction.includes("iframe|object|embed") && blogPostFunction.includes("javascript:") && blogPostFunction.includes("data:text") && blogPostFunction.includes("vbscript:")]);
checks.push(["blog post sanitizes dangerous html client fallback", blogPostPage.includes("sanitizeBodyHtml") && blogPostPage.includes("iframe|object|embed") && blogPostPage.includes("javascript:") && blogPostPage.includes("data:text") && blogPostPage.includes("vbscript:")]);
checks.push(["matomo skips local without explicit url", matomoLoader.includes("isLocal && !window.YOHELAB_MATOMO_URL") && !matomoLoader.includes("http://localhost:8080/")]);

for (const [name, ok] of checks) {
  assert(ok, `Check failed: ${name}`);
  console.log(`OK  ${name}`);
}

console.log(`\nPassed ${checks.length} checks.`);

