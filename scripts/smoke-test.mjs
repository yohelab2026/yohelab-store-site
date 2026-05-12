import { readFileSync, existsSync, readdirSync as _readdirSync } from "node:fs";
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

function jsonLdObjects(html) {
  return [...html.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g)]
    .flatMap((match) => {
      const parsed = JSON.parse(match[1]);
      return parsed["@graph"] || [parsed];
    });
}

const checks = [];

const home = read(dist("index.html"));
const oldPropToken = `${"pro"}${"posal"}`;
const oldOptimizer = `${"opti"}${"mizer"}`;
const oldBlogPin = `${"10"}${"30"}`;
const oldPasswordHeader = `x-yohelab-${"password"}`;
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
checks.push(["home does not promote old research writer app", !home.includes('/apps/research-writer/') && !home.includes('/lp/research-writer/')]);
checks.push(["home no legacy tool links", legacyPaths.every((path) => !home.includes(path))]);
checks.push(["home focuses bunsirube conversion", home.includes("AI検索時代の記事構造を") && home.includes("文標の詳細を見る") && home.includes("¥5,500（税込）で購入する") && home.includes("購入前に読める確認メモ") && !home.includes("文標で、記事の型を整える。") && !home.includes("無料で遊べるミニゲーム")]);
checks.push(["home uses safer AI search wording", home.includes("AI検索時代に読み取りやすい本文構造") && !home.includes("AI検索にも読まれやすい") && !home.includes("AI検索に出るテーマ") && !home.includes("AI検索最適化済み")]);
checks.push(["home surfaces buyer guide and tax-included prices", home.includes("購入前に読める確認メモ") && home.includes("/blog/bunsirube-before-install/") && home.includes("/lp/bunsirube/updates/") && home.includes("¥5,500（税込）") && home.includes("表示価格はすべて税込です。")]);
checks.push(["home avoids overstated claims", !home.includes("AIに引用される") && !home.includes("引用されないブログ") && !home.includes("5,377億") && !home.includes("3.6兆")]);

const footerLinks = [
  '© よへラボ / yohelab.com',
  'href="/"',
  'href="/blog/"',
  'href="/contact/"',
  'href="/legal/commerce/"',
  'href="/legal/privacy/"',
  'href="/legal/terms/"',
];
const footerPages = [
  "index.html",
  "blog/index.html",
  "blog/post/index.html",
  "blog/admin/index.html",
  "apps/research-writer/index.html",
  "lp/research-writer/index.html",
  "lp/bunsirube/index.html",
  "lp/bunsirube/install/index.html",
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
const legacyNavHtml = [
  read(dist("404.html")),
  read(dist("blog/bunsirube-before-install/index.html")),
  read(dist("lp/bunsirube/demo/index.html")),
  read(dist("pro/activate-pending/index.html")),
].join("\n");
checks.push(["old tools services navigation is removed", !legacyNavHtml.includes('href="/tools/"') && !legacyNavHtml.includes('href="/services/"') && legacyNavHtml.includes('href="/lp/bunsirube/"') && legacyNavHtml.includes('href="/lp/bunsirube/demo/"')]);

const lpResearchWriter = read(dist("lp/research-writer/index.html"));
checks.push(["lp research writer preparing page", lpResearchWriter.includes('記事メーカー') && lpResearchWriter.includes('現在準備中') && lpResearchWriter.includes('/lp/bunsirube/') && lpResearchWriter.includes('noindex,follow')]);
checks.push(["lp research writer safe claims", !lpResearchWriter.includes("AIに引用される") && !lpResearchWriter.includes("唯一の媒体") && !lpResearchWriter.includes("5,377億") && !lpResearchWriter.includes("3.6兆")]);
checks.push(["lp research writer avoids retired sales copy", !lpResearchWriter.includes("WordPress自動投稿設定") && !lpResearchWriter.includes("優先キュー") && !lpResearchWriter.includes("3時間40回") && !lpResearchWriter.includes("副業実践者の34") && !lpResearchWriter.includes("圧倒的に安い") && !lpResearchWriter.includes("元が取れる") && !lpResearchWriter.includes("GoogleとAI検索の両方からアクセスが来る") && !lpResearchWriter.includes("30分で1本")]);

const researchApp = read(dist("apps/research-writer/index.html"));
checks.push(["research app preparing page", researchApp.includes('記事メーカーは') && researchApp.includes('現在準備中') && researchApp.includes('/lp/bunsirube/') && researchApp.includes('noindex,follow')]);

const researchProduct = read(dist("products/research-writer-beta/index.html"));
checks.push(["research product redirects to preparing page", researchProduct.includes('現在準備中') && researchProduct.includes('url=/lp/research-writer/') && researchProduct.includes('noindex,follow')]);

const pageReview = read(dist("products/page-review/index.html"));
checks.push(["page review preparing page", pageReview.includes("商品ページ改善レビューは") && pageReview.includes("現在準備中") && pageReview.includes('/lp/bunsirube/') && pageReview.includes('noindex,follow')]);
checks.push(["page review has no checkout cta while paused", !pageReview.includes("buy.stripe.com") && !pageReview.includes("980円（税込）で申し込む")]);

const wpProduct = read(dist("products/bunsirube/index.html"));
checks.push(["wp product title", wpProduct.includes('文標（ぶんしるべ）') && wpProduct.includes('WordPressテーマ')]);
checks.push(["wp product analytics", wpProduct.includes('テーマ内解析') && wpProduct.includes('外部解析')]);
checks.push(["wp product price", wpProduct.includes('¥5,500')]);
checks.push(["wp product uses tax-included price labels", wpProduct.includes("¥5,500（税込）") && wpProduct.includes("¥8,800（税込）")]);
checks.push(["wp product support policy", wpProduct.includes('不具合対応と保証の線引き') && wpProduct.includes('広い個別サポートを付けない分') && wpProduct.includes('30日返金保証')]);
checks.push(["wp product embeds demo videos", wpProduct.includes('/assets/bunsirube/videos/bunsirube-install.mp4') && wpProduct.includes('/assets/bunsirube/videos/bunsirube-writing.mp4') && wpProduct.includes('/assets/bunsirube/videos/bunsirube-route-check.mp4')]);

checks.push(["research product has no checkout cta while paused", !researchProduct.includes('buy.stripe.com') && !researchProduct.includes('1日1セットまで')]);

const contact = read(dist("contact/index.html"));
checks.push(["contact prioritizes bunsirube", contact.includes('文標の購入前確認') && contact.includes('文標（ぶんしるべ）')]);
checks.push(["contact removes shortcut cards", !contact.includes('ツール一覧') && !contact.includes('サービス一覧') && !contact.includes('各ページへ直接行く')]);
checks.push(["contact removes cancellation wording", !contact.includes('解約')]);
checks.push(["contact no legacy tools", legacyLabels.every((label) => !contact.includes(label))]);
checks.push(["contact invites pre-purchase questions", contact.includes("購入前の確認") && !contact.includes("記事作成スターターキット")]);
checks.push(["contact avoids broad post-purchase support", contact.includes("使い方相談や個別設定代行は対象外") && contact.includes("返金希望") && !contact.includes("導入、使い方、不具合の相談") && !contact.includes("使い方を確認したい")]);

const sitemap = read(dist("sitemap.xml"));
checks.push(["sitemap includes research writer", sitemap.includes('https://yohelab.com/lp/research-writer/')]);
checks.push(["sitemap excludes legacy apps", legacyPaths.every((path) => !sitemap.includes(path))]);
checks.push(["sitemap excludes removed labs", !sitemap.includes('https://yohelab.com/labs/')]);
checks.push(["sitemap excludes retired product redirects", !sitemap.includes('https://yohelab.com/products/article-starter-kit/') && !sitemap.includes('https://yohelab.com/products/wordpress-theme-beta/')]);
checks.push(["sitemap includes three sales pages", sitemap.includes('https://yohelab.com/lp/research-writer/') && sitemap.includes('https://yohelab.com/lp/bunsirube/') && sitemap.includes('https://yohelab.com/products/page-review/')]);
checks.push(["sitemap includes bunsirube demo and updates", sitemap.includes('https://yohelab.com/lp/bunsirube/demo/') && sitemap.includes('https://yohelab.com/lp/bunsirube/updates/')]);
checks.push(["sitemap includes bunsirube install guide", sitemap.includes('https://yohelab.com/lp/bunsirube/install/')]);
checks.push(["sitemap includes static blog guide posts", ["page-review-sample", "research-writer-free-flow", "bunsirube-before-install", "bunsirube-version-history", "faq-source-ai-search", "sales-page-common-mistakes"].every((slug) => sitemap.includes(`https://yohelab.com/blog/${slug}/`))]);
checks.push(["sitemap includes all game pages", ["reaction", "typing", "math-rush", "sequence"].every((slug) => sitemap.includes(`https://yohelab.com/games/${slug}/`))]);

const gameScript = read(dist("shared/arcade-game.js"));
checks.push(["game share keeps result data", gameScript.includes('searchParams.set("score"') && gameScript.includes('searchParams.set("result"')]);
const gamesIndex = read(dist("games/index.html"));
checks.push(["games index points back to bunsirube not retired tool anchor", gamesIndex.includes('href="/lp/bunsirube/"') && !gamesIndex.includes('href="/#tool"') && !gamesIndex.includes("AIツールを見る")]);

const ent = read(src("functions/lib/entitlements.js"));
const checkout = read(src("functions/api/checkout.js"));
const middleware = read(src("functions/_middleware.js"));
const gitignore = read(src(".gitignore"));
const sitemapFunction = read(src("functions/sitemap.xml.js"));
const blogAdminGate = read(src("functions/blog/admin/[[catchall]].js"));
const blogAdmin = read(dist("blog/admin/index.html"));
const blogImageFunction = read(src("functions/api/blog-image.js"));
const blogPostFunction = read(src("functions/blog/post/index.js"));
const blogPostPage = read(dist("blog/post/index.html"));
const blogPostApi = read(src("functions/api/blog-post.js"));
const blogDraftApi = read(src("functions/api/blog-draft.js"));
const blogAuthLib = read(src("functions/lib/blog-auth.js"));
const blogAuthApi = read(src("functions/api/blog-auth.js"));
const lineWebhook = read(src("functions/api/line-webhook.js"));
const aiPrGuard = read(src(".github/workflows/ai-pr-guard.yml"));
const lineMaintenanceWorkflow = read(src(".github/workflows/line-maintenance-report.yml"));
const lineRichMenuWorkflow = read(src(".github/workflows/line-rich-menu.yml"));
const lineRichMenuScript = read(src("scripts/setup-line-rich-menu.mjs"));
const salesDraftWorkflow = read(src(".github/workflows/sales-draft-agent.yml"));
const salesDraftScript = read(src("scripts/create-sales-draft.mjs"));
const lineIssueCleanup = read(src("scripts/cleanup-line-issues.mjs"));
const themeDownload = read(src("functions/api/theme-download.js"));
const themeUpdate = read(src("functions/generated/theme-update.js"));
const hasThemeSource =
  existsSync(src("wordpress-themes/bunsirube/functions.php")) &&
  existsSync(src("wordpress-themes/bunsirube/style.css")) &&
  existsSync(src("wordpress-themes/bunsirube/inc/settings.php"));
const themeFunctions = hasThemeSource ? read(src("wordpress-themes/bunsirube/functions.php")) : "";
const themeStyle = hasThemeSource ? read(src("wordpress-themes/bunsirube/style.css")) : "";
const themeSettings = hasThemeSource ? read(src("wordpress-themes/bunsirube/inc/settings.php")) : "";
const publicLlms = read(src("public/llms.txt"));
const rootLlms = read(src("llms.txt"));
const purchaseFlowTest = read(src("scripts/test-purchase-flow.mjs"));
const bunsirubeLp = read(dist("lp/bunsirube/index.html"));
const bunsirubeInstall = read(dist("lp/bunsirube/install/index.html"));
const bunsirubeDemo = read(dist("lp/bunsirube/demo/index.html"));
const bunsirubeUpdates = read(dist("lp/bunsirube/updates/index.html"));
const privacy = read(dist("legal/privacy/index.html"));
const commerce = read(dist("legal/commerce/index.html"));
const matomoLoader = read(dist("shared/matomo-loader.js"));
const bunsirubeVideoObjects = jsonLdObjects(bunsirubeLp).filter((item) => item["@type"] === "VideoObject");
checks.push(["theme serial uses bunsirube prefix", ent.includes("BUN-") && !ent.includes("AIO-")]);
checks.push(["entitlement keeps research writer", ent.includes('"research-writer"')]);
checks.push(["entitlement adds wordpress theme", ent.includes('"wordpress-theme"')]);
checks.push(["entitlement adds page review", ent.includes('"page-review"')]);
checks.push(["entitlement drops legacy tools", !ent.includes(`"${"rad"}${"ar"}"`) && !ent.includes(`"${oldPropToken}-${oldOptimizer}"`) && !ent.includes(`"${"article"}-${"polish"}"` ) && !ent.includes(`"${oldPropToken}"` ) && !ent.includes(`"${"x"}-${"helper"}"` ) && !ent.includes(`"${"ec"}-${"copy"}"` ) && !ent.includes(`"${"aio"}-${"mini"}"` )]);
checks.push(["checkout function redirects to tracked payment links", checkout.includes('https://buy.stripe.com/aFa4gr6jd6Pu4KC7eV73G0d?client_reference_id=research-writer') && checkout.includes('https://buy.stripe.com/bJeaEPfTN2ze2Cubvb73G0e?client_reference_id=wordpress-theme') && checkout.includes('https://buy.stripe.com/bJedR10YTddS4KC42J73G0f?client_reference_id=page-review')]);
checks.push(["middleware redirects retired product pages", middleware.includes('"/products/article-starter-kit/"') && middleware.includes('"/products/wordpress-theme-beta/"') && middleware.includes('"/lp/wordpress-theme/"')]);
checks.push(["middleware redirects retired radar beta page", middleware.includes('"/products/radar-beta"') && middleware.includes('"/products/radar-beta/"') && middleware.includes('"/lp/bunsirube/"')]);
checks.push(["middleware redirects old tools services paths", middleware.includes('"/tools/"') && middleware.includes('"/services/"') && middleware.includes('"/lp/bunsirube/demo/"')]);
checks.push(["middleware canonicalizes /index.html to root", middleware.includes('["/index.html", "/"]')]);
checks.push(["middleware blocks direct theme zip downloads", middleware.includes("PROTECTED_THEME_ZIP") && middleware.includes("X-Robots-Tag") && middleware.includes("no-store") && gitignore.includes("*.zip")]);
const themesCatchAll = read(src("functions/themes/[[path]].js"));
const wpContentCatchAll = read(src("functions/wp-content/[[path]].js"));
checks.push(["themes path returns 404 via Pages Function", themesCatchAll.includes("status: 404") && themesCatchAll.includes("X-Robots-Tag")]);
checks.push(["wp-content probing returns 404 via Pages Function", wpContentCatchAll.includes("status: 404") && wpContentCatchAll.includes("X-Robots-Tag")]);
checks.push(["dist has no exposed themes or wp-content directories", !existsSync(dist("themes")) && !existsSync(dist("wp-content"))]);
checks.push(["blog admin page is reachable behind page login", blogAdminGate.includes("context.next()") && blogAdminGate.includes("noindex") && !blogAdminGate.includes("ADMIN_KEY")]);
checks.push(["blog admin validates pin server side", blogAdmin.includes("/api/blog-auth") && blogAdmin.includes("SESSION_PIN_KEY") && !blogAdmin.includes("localStorage.setItem(PIN_KEY")]);
checks.push(["blog admin has no hardcoded fallback password", !blogAdmin.includes(oldBlogPin) && !blogAuthLib.includes(`"${oldBlogPin}"`) && !blogAuthLib.includes(oldPasswordHeader) && blogAuthApi.includes("blog_pin_not_configured") && blogAdminGate.includes("no-store") && blogAdminGate.includes("X-Frame-Options")]);
checks.push(["blog image uploads convert to one webp", blogAdmin.includes("convertToSingleWebp") && blogAdmin.includes("canvas.toBlob(resolve, 'image/webp'") && blogImageFunction.includes('const ALLOWED_TYPES = ["image/webp"]') && blogImageFunction.includes(".webp`")]);
checks.push(["blog images are stable and lazy", blogAdmin.includes('width="${image.width}"') && blogAdmin.includes('height="${image.height}"') && blogPostFunction.includes("enhanceArticleImages") && blogPostFunction.includes('loading="lazy"') && blogPostPage.includes("enhanceArticleImages") && blogPostApi.includes("autoExcerpt")]);
checks.push(["blog drafts are stored server side and removed on publish", blogDraftApi.includes("draft:") && blogDraftApi.includes("DRAFT_TTL_SECONDS") && blogDraftApi.includes("imageUrls") && blogDraftApi.includes("X-Robots-Tag") && blogPostApi.includes("draftId") && blogPostApi.includes("kv.delete(`draft:${draftId}`)")]);
checks.push(["blog admin saves server drafts", blogAdmin.includes("/api/blog-draft") && blogAdmin.includes("サーバー下書き") && blogAdmin.includes("loadDraftList") && blogAdmin.includes("openDraft") && blogAdmin.includes("deleteDraft")]);
checks.push(["blog admin remembers pin in browser", blogAdmin.includes("SAVED_PIN_KEY") && blogAdmin.includes("savePinForThisBrowser") && blogAdmin.includes("readSavedPin")]);
checks.push(["test blog posts are removed from public index and sitemap", !read(dist("blog/index.html")).includes("yohelab-blog-start") && !read(dist("blog/index.html")).includes("starter-kit") && !read(dist("blog/index.html")).includes("theme-note") && !sitemap.includes("/blog/yohelab-blog-start/") && !sitemap.includes("/blog/starter-kit/") && !sitemap.includes("/blog/theme-note/")]);
checks.push(["middleware redirects removed test blog pages", middleware.includes('"/blog/yohelab-blog-start/"') && middleware.includes('"/blog/starter-kit/"') && middleware.includes('"/blog/theme-note/"')]);
checks.push(["blog post sanitizes dangerous html server side", blogPostFunction.includes("sanitizeBodyHtml") && blogPostFunction.includes("iframe|object|embed") && blogPostFunction.includes("javascript:") && blogPostFunction.includes("data:text") && blogPostFunction.includes("vbscript:")]);
checks.push(["blog post sanitizes dangerous html client fallback", blogPostPage.includes("sanitizeBodyHtml") && blogPostPage.includes("iframe|object|embed") && blogPostPage.includes("javascript:") && blogPostPage.includes("data:text") && blogPostPage.includes("vbscript:")]);
checks.push(["bunsirube lp links to separate update history", bunsirubeLp.includes("最新の更新") && bunsirubeLp.includes("/lp/bunsirube/updates/") && !bunsirubeLp.includes("2026.05.03 / v0.2.0") && bunsirubeLp.includes("自動アップデート用シリアル")]);
checks.push(["bunsirube updates page includes full history", bunsirubeUpdates.includes("文標の更新履歴") && bunsirubeUpdates.includes("v0.3.1") && bunsirubeUpdates.includes("v0.2.0") && bunsirubeUpdates.includes("初期ベータ構成")]);
checks.push(["bunsirube lp includes demo and support", bunsirubeLp.includes('/lp/bunsirube/demo/') && bunsirubeLp.includes("デモ画面を見る") && bunsirubeLp.includes("テーマ購入前の不安") && bunsirubeLp.includes("30日返金保証") && bunsirubeLp.includes("低価格の理由") && bunsirubeLp.includes("不具合対応の範囲") && bunsirubeDemo.includes("文標の見た目と使い方")]);
checks.push(["bunsirube lp links install guide", bunsirubeLp.includes('/lp/bunsirube/install/') && bunsirubeLp.includes("インストール方法を見る") && bunsirubeLp.includes("文標のインストール方法")]);
checks.push(["bunsirube install guide explains setup and settings", bunsirubeInstall.includes("文標の入れ方と初期設定") && bunsirubeInstall.includes("親テーマZIP") && bunsirubeInstall.includes("子テーマZIP") && bunsirubeInstall.includes("シリアル番号") && bunsirubeInstall.includes("SEOプラグイン") && bunsirubeInstall.includes("FAQ JSON-LD") && bunsirubeInstall.includes("導線確認") && bunsirubeInstall.includes("bunsirube-install-poster.png") && bunsirubeInstall.includes('"@type": "HowTo"') && bunsirubeInstall.includes('"@type": "FAQPage"')]);
checks.push(["bunsirube lp separates purchase and server checks", bunsirubeLp.includes("購入フローの検証") && bunsirubeLp.includes("不正シリアル拒否") && bunsirubeLp.includes("動作確認とサーバー対応の表記を分けています") && bunsirubeLp.includes("実際の環境で通ったものだけ「確認済み」")]);
checks.push(["bunsirube lp explains AI and human maintenance", bunsirubeLp.includes("AIと人で常に見ています") && bunsirubeLp.includes("人の確認を通して安全に直せるところから更新") && wpProduct.includes("AIと人で継続確認") && wpProduct.includes("価格・法務・決済・配布ZIPは人の確認を必須")]);
checks.push(["bunsirube lp positions AI-era article structure safely", bunsirubeLp.includes("AI検索時代の記事構造") && bunsirubeLp.includes("本文で読み取りやすい構造") && bunsirubeLp.includes("Google AI Overviews等への表示を保証するものではありません") && !bunsirubeLp.includes("AI検索に出るテーマ") && !bunsirubeLp.includes("AI検索最適化済み") && !bunsirubeLp.includes("AIに拾われる")]);
checks.push(["bunsirube lp embeds demo videos", bunsirubeLp.includes("30秒で分かる文標") && bunsirubeLp.includes('/assets/bunsirube/videos/bunsirube-quick-tour.mp4') && bunsirubeLp.includes('/assets/bunsirube/videos/bunsirube-install.mp4') && bunsirubeLp.includes('/assets/bunsirube/videos/bunsirube-writing.mp4') && bunsirubeLp.includes('/assets/bunsirube/videos/bunsirube-route-check.mp4') && bunsirubeLp.includes('"@type":"VideoObject"')]);
checks.push(["bunsirube video structured data parses", bunsirubeVideoObjects.length === 4 && bunsirubeVideoObjects.some((item) => item.contentUrl?.includes("bunsirube-quick-tour.mp4") && item.duration === "PT34S") && bunsirubeVideoObjects.filter((item) => item.duration === "PT13S").length === 3 && bunsirubeVideoObjects.every((item) => item.name && item.thumbnailUrl && item.contentUrl && item.duration && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+09:00$/.test(item.uploadDate || ""))]);
checks.push(["root video assets exist for direct deploy", existsSync(src("assets/bunsirube/videos/bunsirube-quick-tour.mp4")) && existsSync(src("assets/bunsirube/videos/bunsirube-install.mp4")) && existsSync(src("assets/bunsirube/videos/bunsirube-writing.mp4")) && existsSync(src("assets/bunsirube/videos/bunsirube-route-check.mp4"))]);
checks.push(["bunsirube demo includes article type samples", bunsirubeDemo.includes("比較記事デモ") && bunsirubeDemo.includes("レビュー記事デモ") && bunsirubeDemo.includes("FAQ記事デモ") && bunsirubeDemo.includes("管理画面見本")]);
checks.push(["bunsirube demo embeds blog creation videos", bunsirubeDemo.includes("ブログ作成の流れを動画で見る") && bunsirubeDemo.includes('/assets/bunsirube/videos/bunsirube-install.mp4?v=blog-demo-20260505') && bunsirubeDemo.includes('/assets/bunsirube/videos/bunsirube-writing.mp4?v=blog-demo-20260505') && bunsirubeDemo.includes('/assets/bunsirube/videos/bunsirube-route-check.mp4?v=blog-demo-20260505') && !bunsirubeDemo.includes("実機") && !bunsirubeDemo.includes("想定") && !bunsirubeDemo.includes("イメージ")]);
checks.push(["bunsirube demo uses tax-included purchase label", bunsirubeDemo.includes("¥5,500（税込）で購入する") && bunsirubeDemo.includes("表示価格はすべて税込です。")]);
checks.push(["privacy policy covers current paid products and theme analytics", privacy.includes("有料サービス・ダウンロード商品") && privacy.includes("文標テーマでは") && privacy.includes("CTA・比較表・広告リンク・ブログカード") && !privacy.includes("2026年4月30日") && !privacy.includes("プロプラン")]);
const blogIndex = read(dist("blog/index.html"));
const blogIndexSource = read(src("blog/index.html"));
const blogMain = read(src("blog/main.js"));
checks.push(["blog surfaces pre-purchase bunsirube guides", blogIndex.includes("文標を買う前に読む3本") && blogIndex.includes("/blog/free-theme-vs-bunsirube/") && blogIndex.includes("/blog/comparison-article-template/")]);
checks.push(["new bunsirube guide posts exist", read(dist("blog/free-theme-vs-bunsirube/index.html")).includes("無料テーマと文標の違い") && read(dist("blog/comparison-article-template/index.html")).includes("比較記事の書き方") && read(dist("blog/bunsirube-version-history/index.html")).includes("文標のバージョンアップ履歴")]);
checks.push(["static blog cards use eyecatch images", !blogIndexSource.includes('<div class="post-card-img-placeholder"') && ["free-theme-vs-bunsirube", "comparison-article-template", "page-review-sample", "research-writer-free-flow", "bunsirube-before-install", "faq-source-ai-search", "sales-page-common-mistakes", "bunsirube-version-history"].every((slug) => blogIndexSource.includes(`/assets/blog/${slug}/eyecatch.png`))]);
checks.push(["blog publish requires eyecatch", blogAdmin.includes("アイキャッチ画像を設定してください。") && blogAdmin.includes("coverDrop.scrollIntoView")]);
checks.push(["blog cards are fully clickable", blogIndexSource.includes(".post-card:focus-visible") && blogMain.includes("prepareCardLinks") && blogMain.includes("window.location.href = link.href") && blogMain.includes("role', 'link'")]);
checks.push(["paused product blog samples are noindex follow", read(dist("blog/page-review-sample/index.html")).includes('content="noindex,follow') && read(dist("blog/research-writer-free-flow/index.html")).includes('content="noindex,follow') && read(dist("blog/free-theme-vs-bunsirube/index.html")).includes('content="index,follow')]);
checks.push(["sitemap includes new bunsirube guide posts", sitemap.includes("https://yohelab.com/blog/free-theme-vs-bunsirube/") && sitemap.includes("https://yohelab.com/blog/comparison-article-template/") && sitemap.includes("https://yohelab.com/blog/bunsirube-version-history/")]);
checks.push(["dynamic sitemap includes new bunsirube guide posts", sitemapFunction.includes("/blog/free-theme-vs-bunsirube/") && sitemapFunction.includes("/blog/comparison-article-template/") && sitemapFunction.includes("/blog/bunsirube-version-history/")]);
checks.push(["dynamic sitemap includes bunsirube updates", sitemapFunction.includes("/lp/bunsirube/updates/")]);
checks.push(["dynamic sitemap includes bunsirube install guide", sitemapFunction.includes("/lp/bunsirube/install/")]);
checks.push(["matomo skips local without explicit url", matomoLoader.includes("isLocal && !window.YOHELAB_MATOMO_URL") && !matomoLoader.includes("http://localhost:8080/")]);
checks.push(["line webhook verifies signature and replies with line id", lineWebhook.includes("x-line-signature") && lineWebhook.includes("LINE_CHANNEL_SECRET") && lineWebhook.includes("/v2/bot/message/reply") && lineWebhook.includes("LINE_TO=")]);
checks.push(["line webhook creates github issues with ai-work-ok label", lineWebhook.includes("GITHUB_ISSUE_TOKEN") && lineWebhook.includes("line-inbox") && lineWebhook.includes("ai-work-ok") && lineWebhook.includes("/repos/${repo}/issues") && lineWebhook.includes("AI作業OK")]);
checks.push(["line webhook assigns ai work issues to copilot safely", lineWebhook.includes('copilot-swe-agent[bot]') && lineWebhook.includes("agent_assignment") && lineWebhook.includes("copilotInstructions") && lineWebhook.includes("Human review required area") && lineWebhook.includes("Safe automation area")]);
checks.push(["line webhook supports choice based LINE conversations", lineWebhook.includes("wantsChoices") && lineWebhook.includes("line-choice") && lineWebhook.includes("<!-- line-choice-options:v1 -->") && lineWebhook.includes("AI作業OK 1") && lineWebhook.includes("findLatestChoiceIssue") && lineWebhook.includes("ボタンか数字だけで選べます") && lineWebhook.includes("ブログ記事を新しく書く") && lineWebhook.includes("既存ブログをリライトする") && lineWebhook.includes("X投稿文を作る") && lineWebhook.includes("その他・自由入力で相談する") && !lineWebhook.includes("ファーストビューの見出しと説明を強くする") && !lineWebhook.includes("文標の購入前記事を追加する")]);
checks.push(["line webhook has quick replies and relaxed approval words", lineWebhook.includes("quickReply") && lineWebhook.includes("menuQuickReply") && lineWebhook.includes("flowQuickReply") && lineWebhook.includes("proceedQuickReply") && lineWebhook.includes("OK") && lineWebhook.includes("進めて") && lineWebhook.includes("お願い") && lineWebhook.includes("findLatestLineIssue")]);
checks.push(["line webhook asks content questions with numbered choices", lineWebhook.includes("QUESTION_FLOWS") && lineWebhook.includes("質問 ${step}/${total}") && lineWebhook.includes("line-selected-option") && lineWebhook.includes("nextFlowQuestion") && lineWebhook.includes("issueConversationText") && lineWebhook.includes("/comments?per_page=100") && lineWebhook.includes("記事テーマを選んで。") && lineWebhook.includes("番号だけで選べます") && lineWebhook.includes("BLOG_TOPIC_PAGES") && lineWebhook.includes("別案を10個見る") && lineWebhook.includes("line-option-page") && lineWebhook.includes("キャンセル")]);
checks.push(["line webhook plans blog images conversationally", lineWebhook.includes("画像タイプを選んで。") && lineWebhook.includes("画像の雰囲気を選んで。") && lineWebhook.includes("画像を入れる場所を選んで。") && lineWebhook.includes("アイキャッチ") && lineWebhook.includes("比較表風")]);
checks.push(["line copilot instructions require safe original blog images", lineWebhook.includes("create suitable original blog images") && lineWebhook.includes("Do not use copyrighted stock images") && lineWebhook.includes("alt text") && lineWebhook.includes("intended insertion position") && lineWebhook.includes("original SVG diagram")]);
checks.push(["line rich menu asset and setup script exist", existsSync(src("assets/line/rich-menu-bunsirube.png")) && lineRichMenuScript.includes("https://api.line.me/v2/bot/richmenu") && lineRichMenuScript.includes("https://api-data.line.me/v2/bot/richmenu") && lineRichMenuScript.includes("文標メニュー")]);
checks.push(["line rich menu has four simple large actions", lineRichMenuScript.includes('message("1 ブログ", "1")') && lineRichMenuScript.includes('message("2 リライト", "2")') && lineRichMenuScript.includes('message("3 X投稿", "3")') && lineRichMenuScript.includes('message("4 その他", "4")') && !lineRichMenuScript.includes('uri("文標LP"')]);
checks.push(["line rich menu workflow runs only when menu files change or manually", lineRichMenuWorkflow.includes("workflow_dispatch") && lineRichMenuWorkflow.includes("assets/line/rich-menu-bunsirube.png") && lineRichMenuWorkflow.includes("scripts/setup-line-rich-menu.mjs") && lineRichMenuWorkflow.includes("LINE_CHANNEL_ACCESS_TOKEN") && lineRichMenuWorkflow.includes("npm run line:rich-menu")]);
checks.push(["old LINE issues are cleaned up daily without deleting history", lineMaintenanceWorkflow.includes("Cleanup old LINE issues") && lineMaintenanceWorkflow.includes("issues: write") && lineMaintenanceWorkflow.includes("LINE_ISSUE_STALE_DAYS: 10") && lineMaintenanceWorkflow.includes("LINE_CLEANUP_CLOSED") && lineIssueCleanup.includes("GITHUB_OUTPUT") && lineIssueCleanup.includes("line-auto-closed") && lineIssueCleanup.includes("keep-open") && lineIssueCleanup.includes("state: \"closed\"") && lineIssueCleanup.includes("LINE由来のIssue") && lineIssueCleanup.includes("削除ではなくクローズ")]);
checks.push(["sales draft agent runs on schedule and sends LINE", salesDraftWorkflow.includes("Sales draft agent") && salesDraftWorkflow.includes("30 23 * * *") && salesDraftWorkflow.includes("30 3 * * *") && salesDraftWorkflow.includes("30 9 * * *") && salesDraftWorkflow.includes("issues: write") && salesDraftWorkflow.includes("LINE_CHANNEL_ACCESS_TOKEN") && salesDraftWorkflow.includes("LINE_TO") && salesDraftWorkflow.includes("npm run sales:draft")]);
checks.push(["sales draft agent saves issues not auto posts", salesDraftScript.includes("自動投稿はしません") && salesDraftScript.includes("sales-draft") && salesDraftScript.includes("auto-sales") && salesDraftScript.includes("/repos/${repo}/issues") && salesDraftScript.includes("https://api.line.me/v2/bot/message/push") && salesDraftScript.includes("X投稿案") && salesDraftScript.includes("note下書き案") && salesDraftScript.includes("ブログ下書き案") && salesDraftScript.includes("画像案")]);
checks.push(["sales draft agent uses safe AI-search wording", salesDraftScript.includes("AI検索時代の記事構造") && salesDraftScript.includes("読み取りやすい本文構造") && salesDraftScript.includes("AI表示や検索順位の保証ではない") && salesDraftScript.includes("表示を保証するものではありません") && salesDraftScript.includes("`AI検索に出る`、`必ず売れる`、`順位が上がる` とは書かない")]);
checks.push(["sales draft issues are included in cleanup", lineIssueCleanup.includes("listIssuesByLabel(\"sales-draft\")") && lineIssueCleanup.includes("営業下書きIssue")]);
checks.push(["ai pr guard blocks sensitive changes and auto-merges safe ai prs", aiPrGuard.includes("needs-human-review") && aiPrGuard.includes("safe-auto-candidate") && aiPrGuard.includes("buy\\.stripe\\.com") && aiPrGuard.includes("legal\\/") && aiPrGuard.includes("gh pr merge") && aiPrGuard.includes("--auto")]);
checks.push(["theme delivery points to latest package and manifest", themeDownload.includes('key: "bunsirube-0.3.3.zip"') && themeUpdate.includes('\\"version\\": \\"0.3.3\\"') && themeUpdate.includes("/lp/bunsirube/updates/")]);
checks.push(["theme source is checked locally or intentionally absent in CI", hasThemeSource || process.env.GITHUB_ACTIONS === "true"]);
checks.push(["theme internal version matches latest package", !hasThemeSource || (themeStyle.includes("Version: 0.3.3") && themeFunctions.includes("BUNSIRUBE_VERSION', '0.3.3'") && themeSettings.includes("不具合対応の範囲") && !themeSettings.includes("ZIP導入、基本設定、記事型、文標ショートコードの使い方を対象"))]);
checks.push(["public llms focuses current bunsirube offer", publicLlms.includes("WordPressテーマ「文標") && publicLlms.includes("サポート範囲") && publicLlms.includes("Google AI Overviews等への表示を保証するものではありません") && !publicLlms.includes("初回モニター¥980") && !publicLlms.includes("月額1,980円")]);
checks.push(["root llms fallback matches public llms", rootLlms === publicLlms]);
checks.push(["purchase flow test covers email serial license and invalid cases", purchaseFlowTest.includes("checkout.session.completed") && purchaseFlowTest.includes("api.resend.com/emails") && purchaseFlowTest.includes("serial missing from email") && purchaseFlowTest.includes("expected generated serial to activate") && purchaseFlowTest.includes("expected invalid serial rejection") && purchaseFlowTest.includes("expected bad signature 400")]);

// Affiliate program checks
const affiliateLp = read(dist("lp/bunsirube/affiliate/index.html"));
const affiliateDashboard = read(dist("affiliate/dashboard/index.html"));
const affiliateTerms = read(dist("legal/affiliate-terms/index.html"));
const affiliateSignupApi = read(src("functions/api/affiliate-signup.js"));
const affiliateStatusApi = read(src("functions/api/affiliate-status.js"));
const affiliateClickApi = read(src("functions/api/affiliate-click.js"));
const affiliateLib = read(src("functions/lib/affiliate.js"));
const affiliateTrackJs = read(src("public/shared/affiliate-track.js"));
const lpHasInlineAffiliate = bunsirubeLp.includes("Affiliate referral tracking") && bunsirubeLp.includes("yohelab_aff");
const homeHasInlineAffiliate = read(dist("index.html")).includes("yohelab_aff") && read(dist("index.html")).includes("buy.stripe.com");
const stripeWebhookSrc = read(src("functions/api/stripe-webhook.js"));

checks.push(["30-day refund guarantee documented in legal/commerce", commerce.includes("30日") && commerce.includes("理由を問わず") && commerce.includes("全額返金") && !commerce.includes("購入後の返金には応じられません")]);
checks.push(["30-day refund guarantee documented in legal/terms", read(dist("legal/terms/index.html")).includes("30日返金保証") && read(dist("legal/terms/index.html")).includes("シリアルが無効化") && read(dist("legal/terms/index.html")).includes("アフィリエイト")]);
checks.push(["30-day refund prominent on LP", bunsirubeLp.includes("30日返金保証") && bunsirubeLp.includes("理由を問わず") && bunsirubeLp.includes("Stripe経由")]);
checks.push(["30-day refund in welcome email", stripeWebhookSrc.includes("30日返金保証") && stripeWebhookSrc.includes("文標 返金希望")]);
checks.push(["affiliate signup page has form with required fields", affiliateLp.includes('文標 アフィリエイト') && affiliateLp.includes('1件 ¥2,750') && affiliateLp.includes('id="aff-form"') && affiliateLp.includes('name="email"') && affiliateLp.includes('name="site_url"') && affiliateLp.includes('/legal/affiliate-terms/') && affiliateLp.includes('/api/affiliate-signup')]);
checks.push(["affiliate page uses safe AI positioning", affiliateLp.includes("AI検索時代の記事構造") && affiliateLp.includes("AI表示を保証するものではありません") && !affiliateLp.includes("AI検索特化") && !affiliateLp.includes("AI Overviews対応テーマ") && !affiliateLp.includes("AI検索に出る")]);
checks.push(["affiliate dashboard page has login + stats", affiliateDashboard.includes('ダッシュボード') && affiliateDashboard.includes('id="login-form"') && affiliateDashboard.includes('/api/affiliate-status') && affiliateDashboard.includes('総クリック数') && affiliateDashboard.includes('支払予定') && affiliateDashboard.includes('AFF-XXXX-XXXX')]);
checks.push(["affiliate ToS lists 50% commission and 30-day attribution", affiliateTerms.includes('50%') && affiliateTerms.includes('2,750') && affiliateTerms.includes('30日') && affiliateTerms.includes('ラストクリック') && affiliateTerms.includes('禁止事項') && affiliateTerms.includes('ステルスマーケティング') && affiliateTerms.includes('自己購入')]);
checks.push(["affiliate api endpoints are wired", affiliateSignupApi.includes('makeAffiliateCode') && affiliateSignupApi.includes('setAffiliateMeta') && affiliateStatusApi.includes('listSales') && affiliateStatusApi.includes('computeAffiliateStats') && affiliateClickApi.includes('recordClick')]);
checks.push(["affiliate lib has stable code generation and stats", affiliateLib.includes('AFFILIATE_COMMISSION_RATE = 0.5') && affiliateLib.includes('AFFILIATE_COMMISSION_AMOUNT = 2750') && affiliateLib.includes('makeAffiliateCode') && affiliateLib.includes('hmacBase64Url') && affiliateLib.includes('AFF-')]);
checks.push(["affiliate-track.js handles ?ref and decorates Stripe links", affiliateTrackJs.includes('AFF-') && affiliateTrackJs.includes('yohelab_aff') && affiliateTrackJs.includes('30') && affiliateTrackJs.includes('buy.stripe.com') && affiliateTrackJs.includes('client_reference_id') && affiliateTrackJs.includes('/api/affiliate-click')]);
checks.push(["pages with Stripe link include affiliate tracking script", lpHasInlineAffiliate && homeHasInlineAffiliate && read(dist("lp/bunsirube/install/index.html")).includes('yohelab_aff') && read(dist("lp/bunsirube/demo/index.html")).includes('yohelab_aff') && read(dist("products/bunsirube/index.html")).includes('yohelab_aff')]);
checks.push(["stripe webhook parses affiliate code and prevents self-referral", stripeWebhookSrc.includes('AFFILIATE_REF_RE') && stripeWebhookSrc.includes('rawRef.split(":")') && stripeWebhookSrc.includes('meta.email === String(email).toLowerCase()') && stripeWebhookSrc.includes('recordSale')]);
checks.push(["affiliate footer links present on LP and home", bunsirubeLp.includes('/lp/bunsirube/affiliate/') && bunsirubeLp.includes('/legal/affiliate-terms/') && read(dist("index.html")).includes('/lp/bunsirube/affiliate/') && read(dist("index.html")).includes('/legal/affiliate-terms/')]);
checks.push(["affiliate signup rate-limits and caps input lengths", affiliateSignupApi.includes('rateLimitOk') && affiliateSignupApi.includes('"signup"') && affiliateSignupApi.includes('status: 429') === false && affiliateSignupApi.includes(', 429)') && affiliateSignupApi.includes('.slice(0, 120)') && affiliateSignupApi.includes('.slice(0, 254)') && affiliateSignupApi.includes('.slice(0, 500)')]);
checks.push(["affiliate status hides existence and rate-limits", affiliateStatusApi.includes('rateLimitOk') && affiliateStatusApi.includes('"status"') && affiliateStatusApi.includes('MISMATCH_RESPONSE') && !/コードが見つかりません/.test(affiliateStatusApi)]);
checks.push(["affiliate click endpoint rate-limits per IP", affiliateClickApi.includes('rateLimitOk') && affiliateClickApi.includes('"click"') && affiliateClickApi.includes('getClientIp')]);
checks.push(["affiliate lib exposes rate limiter using BLOG_KV", affiliateLib.includes('export async function rateLimitOk') && affiliateLib.includes('CF-Connecting-IP') && affiliateLib.includes('expirationTtl')]);
const robotsTxt = read(dist("robots.txt"));
checks.push(["robots.txt blocks admin api pro and affiliate dashboard", robotsTxt.includes('Disallow: /blog/admin/') && robotsTxt.includes('Disallow: /api/') && robotsTxt.includes('Disallow: /pro/') && robotsTxt.includes('Disallow: /affiliate/dashboard/') && robotsTxt.includes('Sitemap: https://yohelab.com/sitemap.xml')]);
checks.push(["affiliate dashboard is noindex", read(dist("affiliate/dashboard/index.html")).includes('noindex,nofollow') || read(dist("affiliate/dashboard/index.html")).includes('noindex, nofollow')]);
function walkDist(dirAbs, acc = []) {
  for (const entry of _readdirSync(dirAbs, { withFileTypes: true })) {
    const p = `${dirAbs}/${entry.name}`;
    if (entry.isDirectory()) walkDist(p, acc);
    else acc.push(p);
  }
  return acc;
}
const distFiles = walkDist(dist(""));
const leakSuffixes = [".map", ".env", ".bak", ".swp", ".orig", ".DS_Store"];
const leaked = distFiles.filter((p) => leakSuffixes.some((s) => p.endsWith(s)));
checks.push(["dist has no leaked source maps env or backup files", leaked.length === 0]);
checks.push(["dist has no exposed wp-content or themes directories", !distFiles.some((p) => p.includes("/wp-content/")) && !distFiles.some((p) => /\/dist\/themes\//.test(p))]);
const htmlFilesWithIndexLinks = distFiles.filter((p) => p.endsWith(".html") && readFileSync(p, "utf8").includes("/index.html"));
checks.push(["public html does not link to /index.html", htmlFilesWithIndexLinks.length === 0]);
checks.push(["sitemap does not include /index.html", !sitemap.includes("/index.html")]);
checks.push(["redirect rules canonicalize /index.html", read(dist("_redirects")).includes("/index.html / 301")]);

for (const [name, ok] of checks) {
  assert(ok, `Check failed: ${name}`);
  console.log(`OK  ${name}`);
}

console.log(`\nPassed ${checks.length} checks.`);
