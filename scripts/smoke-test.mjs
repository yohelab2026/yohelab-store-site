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
  read(dist("blog/starter-kit/index.html")),
  read(dist("blog/theme-note/index.html")),
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

const sitemap = read(dist("sitemap.xml"));
checks.push(["sitemap includes research writer", sitemap.includes('https://yohelab.com/lp/research-writer/')]);
checks.push(["sitemap excludes legacy apps", legacyPaths.every((path) => !sitemap.includes(path))]);
checks.push(["sitemap excludes removed labs", !sitemap.includes('https://yohelab.com/labs/')]);
checks.push(["sitemap excludes retired product redirects", !sitemap.includes('https://yohelab.com/products/article-starter-kit/') && !sitemap.includes('https://yohelab.com/products/wordpress-theme-beta/')]);
checks.push(["sitemap includes three sales pages", sitemap.includes('https://yohelab.com/lp/research-writer/') && sitemap.includes('https://yohelab.com/lp/bunsirube/') && sitemap.includes('https://yohelab.com/products/page-review/')]);
checks.push(["sitemap includes bunsirube demo and updates", sitemap.includes('https://yohelab.com/lp/bunsirube/demo/') && sitemap.includes('https://yohelab.com/lp/bunsirube/updates/')]);
checks.push(["sitemap includes bunsirube install guide", sitemap.includes('https://yohelab.com/lp/bunsirube/install/')]);
checks.push(["sitemap includes static blog guide posts", ["page-review-sample", "research-writer-free-flow", "bunsirube-before-install", "faq-source-ai-search", "sales-page-common-mistakes"].every((slug) => sitemap.includes(`https://yohelab.com/blog/${slug}/`))]);
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
const lineWebhook = read(src("functions/api/line-webhook.js"));
const aiPrGuard = read(src(".github/workflows/ai-pr-guard.yml"));
const lineMaintenanceWorkflow = read(src(".github/workflows/line-maintenance-report.yml"));
const lineIssueCleanup = read(src("scripts/cleanup-line-issues.mjs"));
const themeDownload = read(src("functions/api/theme-download.js"));
const themeUpdate = read(src("functions/generated/theme-update.js"));
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
checks.push(["middleware blocks direct theme zip downloads", middleware.includes("PROTECTED_THEME_ZIP") && middleware.includes("X-Robots-Tag") && middleware.includes("no-store") && gitignore.includes("*.zip")]);
checks.push(["blog admin page is reachable behind page login", blogAdminGate.includes("context.next()") && blogAdminGate.includes("noindex") && !blogAdminGate.includes("ADMIN_KEY")]);
checks.push(["blog admin validates pin server side", blogAdmin.includes("/api/blog-auth") && blogAdmin.includes("SESSION_PIN_KEY") && !blogAdmin.includes("localStorage.setItem(PIN_KEY")]);
checks.push(["blog image uploads convert to one webp", blogAdmin.includes("convertToSingleWebp") && blogAdmin.includes("canvas.toBlob(resolve, 'image/webp'") && blogImageFunction.includes('const ALLOWED_TYPES = ["image/webp"]') && blogImageFunction.includes(".webp`")]);
checks.push(["blog images are stable and lazy", blogAdmin.includes('width="${image.width}"') && blogAdmin.includes('height="${image.height}"') && blogPostFunction.includes("enhanceArticleImages") && blogPostFunction.includes('loading="lazy"') && blogPostPage.includes("enhanceArticleImages") && blogPostApi.includes("autoExcerpt")]);
checks.push(["blog post sanitizes dangerous html server side", blogPostFunction.includes("sanitizeBodyHtml") && blogPostFunction.includes("iframe|object|embed") && blogPostFunction.includes("javascript:") && blogPostFunction.includes("data:text") && blogPostFunction.includes("vbscript:")]);
checks.push(["blog post sanitizes dangerous html client fallback", blogPostPage.includes("sanitizeBodyHtml") && blogPostPage.includes("iframe|object|embed") && blogPostPage.includes("javascript:") && blogPostPage.includes("data:text") && blogPostPage.includes("vbscript:")]);
checks.push(["bunsirube lp links to separate update history", bunsirubeLp.includes("最新の更新") && bunsirubeLp.includes("/lp/bunsirube/updates/") && !bunsirubeLp.includes("2026.05.03 / v0.2.0") && bunsirubeLp.includes("自動アップデート用シリアル")]);
checks.push(["bunsirube updates page includes full history", bunsirubeUpdates.includes("文標の更新履歴") && bunsirubeUpdates.includes("v0.3.1") && bunsirubeUpdates.includes("v0.2.0") && bunsirubeUpdates.includes("初期ベータ構成")]);
checks.push(["bunsirube lp includes demo and support", bunsirubeLp.includes('/lp/bunsirube/demo/') && bunsirubeLp.includes("デモ画面を見る") && bunsirubeLp.includes("テーマ購入前の不安") && bunsirubeLp.includes("30日返金保証") && bunsirubeLp.includes("低価格の理由") && bunsirubeLp.includes("不具合対応の範囲") && bunsirubeDemo.includes("文標の見た目と使い方")]);
checks.push(["bunsirube lp links install guide", bunsirubeLp.includes('/lp/bunsirube/install/') && bunsirubeLp.includes("インストール方法を見る") && bunsirubeLp.includes("文標のインストール方法")]);
checks.push(["bunsirube install guide explains setup and settings", bunsirubeInstall.includes("文標の入れ方と初期設定") && bunsirubeInstall.includes("親テーマZIP") && bunsirubeInstall.includes("子テーマZIP") && bunsirubeInstall.includes("シリアル番号") && bunsirubeInstall.includes("SEOプラグイン") && bunsirubeInstall.includes("FAQ JSON-LD") && bunsirubeInstall.includes("導線確認") && bunsirubeInstall.includes("bunsirube-install-poster.png") && bunsirubeInstall.includes('"@type": "HowTo"') && bunsirubeInstall.includes('"@type": "FAQPage"')]);
checks.push(["bunsirube lp separates purchase and server tests", bunsirubeLp.includes("購入フローの検証") && bunsirubeLp.includes("不正シリアル拒否") && bunsirubeLp.includes("動作確認とサーバー対応の表記を分けています") && bunsirubeLp.includes("実機で通ったものだけ「確認済み」")]);
checks.push(["bunsirube lp explains AI and human maintenance", bunsirubeLp.includes("AIと人で常に見ています") && bunsirubeLp.includes("人の確認を通して安全に直せるところから更新") && wpProduct.includes("AIと人で継続確認") && wpProduct.includes("価格・法務・決済・配布ZIPは人の確認を必須")]);
checks.push(["bunsirube lp positions AI-era article structure safely", bunsirubeLp.includes("AI検索時代の記事構造") && bunsirubeLp.includes("本文で読み取りやすい構造") && bunsirubeLp.includes("Google AI Overviews等への表示を保証するものではありません") && !bunsirubeLp.includes("AI検索に出るテーマ") && !bunsirubeLp.includes("AI検索最適化済み") && !bunsirubeLp.includes("AIに拾われる")]);
checks.push(["bunsirube lp embeds demo videos", bunsirubeLp.includes("30秒で分かる文標") && bunsirubeLp.includes('/assets/bunsirube/videos/bunsirube-quick-tour.mp4') && bunsirubeLp.includes('/assets/bunsirube/videos/bunsirube-install.mp4') && bunsirubeLp.includes('/assets/bunsirube/videos/bunsirube-writing.mp4') && bunsirubeLp.includes('/assets/bunsirube/videos/bunsirube-route-check.mp4') && bunsirubeLp.includes('"@type":"VideoObject"')]);
checks.push(["bunsirube video structured data parses", bunsirubeVideoObjects.length === 4 && bunsirubeVideoObjects.some((item) => item.contentUrl?.includes("bunsirube-quick-tour.mp4") && item.duration === "PT34S") && bunsirubeVideoObjects.filter((item) => item.duration === "PT13S").length === 3 && bunsirubeVideoObjects.every((item) => item.name && item.thumbnailUrl && item.contentUrl && item.duration)]);
checks.push(["root video assets exist for direct deploy", existsSync(src("assets/bunsirube/videos/bunsirube-quick-tour.mp4")) && existsSync(src("assets/bunsirube/videos/bunsirube-install.mp4")) && existsSync(src("assets/bunsirube/videos/bunsirube-writing.mp4")) && existsSync(src("assets/bunsirube/videos/bunsirube-route-check.mp4"))]);
checks.push(["bunsirube demo includes article type samples", bunsirubeDemo.includes("比較記事デモ") && bunsirubeDemo.includes("レビュー記事デモ") && bunsirubeDemo.includes("FAQ記事デモ") && bunsirubeDemo.includes("管理画面見本")]);
checks.push(["bunsirube demo embeds blog creation videos", bunsirubeDemo.includes("ブログ作成の流れを動画で見る") && bunsirubeDemo.includes('/assets/bunsirube/videos/bunsirube-install.mp4?v=blog-demo-20260505') && bunsirubeDemo.includes('/assets/bunsirube/videos/bunsirube-writing.mp4?v=blog-demo-20260505') && bunsirubeDemo.includes('/assets/bunsirube/videos/bunsirube-route-check.mp4?v=blog-demo-20260505') && !bunsirubeDemo.includes("実機") && !bunsirubeDemo.includes("想定") && !bunsirubeDemo.includes("イメージ")]);
checks.push(["bunsirube demo uses tax-included purchase label", bunsirubeDemo.includes("¥5,500（税込）で購入する") && bunsirubeDemo.includes("表示価格はすべて税込です。")]);
checks.push(["privacy policy covers current paid products and theme analytics", privacy.includes("有料サービス・ダウンロード商品") && privacy.includes("文標テーマでは") && privacy.includes("CTA・比較表・広告リンク・ブログカード") && !privacy.includes("2026年4月30日") && !privacy.includes("プロプラン")]);
const blogIndex = read(dist("blog/index.html"));
checks.push(["blog surfaces pre-purchase bunsirube guides", blogIndex.includes("文標を買う前に読む3本") && blogIndex.includes("/blog/free-theme-vs-bunsirube/") && blogIndex.includes("/blog/comparison-article-template/")]);
checks.push(["new bunsirube guide posts exist", read(dist("blog/free-theme-vs-bunsirube/index.html")).includes("無料テーマと文標の違い") && read(dist("blog/comparison-article-template/index.html")).includes("比較記事の書き方")]);
checks.push(["sitemap includes new bunsirube guide posts", sitemap.includes("https://yohelab.com/blog/free-theme-vs-bunsirube/") && sitemap.includes("https://yohelab.com/blog/comparison-article-template/")]);
checks.push(["dynamic sitemap includes new bunsirube guide posts", sitemapFunction.includes("/blog/free-theme-vs-bunsirube/") && sitemapFunction.includes("/blog/comparison-article-template/")]);
checks.push(["dynamic sitemap includes bunsirube updates", sitemapFunction.includes("/lp/bunsirube/updates/")]);
checks.push(["dynamic sitemap includes bunsirube install guide", sitemapFunction.includes("/lp/bunsirube/install/")]);
checks.push(["matomo skips local without explicit url", matomoLoader.includes("isLocal && !window.YOHELAB_MATOMO_URL") && !matomoLoader.includes("http://localhost:8080/")]);
checks.push(["line webhook verifies signature and replies with line id", lineWebhook.includes("x-line-signature") && lineWebhook.includes("LINE_CHANNEL_SECRET") && lineWebhook.includes("/v2/bot/message/reply") && lineWebhook.includes("LINE_TO=")]);
checks.push(["line webhook creates github issues with ai-work-ok label", lineWebhook.includes("GITHUB_ISSUE_TOKEN") && lineWebhook.includes("line-inbox") && lineWebhook.includes("ai-work-ok") && lineWebhook.includes("/repos/${repo}/issues") && lineWebhook.includes("AI作業OK")]);
checks.push(["line webhook assigns ai work issues to copilot safely", lineWebhook.includes('copilot-swe-agent[bot]') && lineWebhook.includes("agent_assignment") && lineWebhook.includes("copilotInstructions") && lineWebhook.includes("Human review required area") && lineWebhook.includes("Safe automation area")]);
checks.push(["line webhook supports choice based LINE conversations", lineWebhook.includes("wantsChoices") && lineWebhook.includes("line-choice") && lineWebhook.includes("<!-- line-choice-options:v1 -->") && lineWebhook.includes("AI作業OK 1") && lineWebhook.includes("findLatestChoiceIssue") && lineWebhook.includes("数字だけで選べます") && lineWebhook.includes("ブログ記事を新しく書く") && lineWebhook.includes("既存ブログをリライトする") && lineWebhook.includes("X投稿文を作る") && lineWebhook.includes("その他・自由入力で相談する") && !lineWebhook.includes("ファーストビューの見出しと説明を強くする") && !lineWebhook.includes("文標の購入前記事を追加する")]);
checks.push(["line webhook asks content questions one by one", lineWebhook.includes("QUESTION_FLOWS") && lineWebhook.includes("質問 1/") && lineWebhook.includes("line-selected-option") && lineWebhook.includes("nextFlowQuestion") && lineWebhook.includes("issueConversationText") && lineWebhook.includes("/comments?per_page=100") && lineWebhook.includes("記事テーマは何にする？") && lineWebhook.includes("キャンセル")]);
checks.push(["old LINE issues are cleaned up daily without deleting history", lineMaintenanceWorkflow.includes("Cleanup old LINE issues") && lineMaintenanceWorkflow.includes("issues: write") && lineMaintenanceWorkflow.includes("LINE_ISSUE_STALE_DAYS: 10") && lineMaintenanceWorkflow.includes("LINE_CLEANUP_CLOSED") && lineIssueCleanup.includes("GITHUB_OUTPUT") && lineIssueCleanup.includes("line-auto-closed") && lineIssueCleanup.includes("keep-open") && lineIssueCleanup.includes("state: \"closed\"") && lineIssueCleanup.includes("LINE由来のIssue") && lineIssueCleanup.includes("削除ではなくクローズ")]);
checks.push(["ai pr guard blocks sensitive changes and auto-merges safe ai prs", aiPrGuard.includes("needs-human-review") && aiPrGuard.includes("safe-auto-candidate") && aiPrGuard.includes("buy\\.stripe\\.com") && aiPrGuard.includes("legal\\/") && aiPrGuard.includes("gh pr merge") && aiPrGuard.includes("--auto")]);
checks.push(["theme delivery points to latest package and manifest", themeDownload.includes('key: "bunsirube-0.3.3.zip"') && themeUpdate.includes('\\"version\\": \\"0.3.3\\"') && themeUpdate.includes("/lp/bunsirube/updates/")]);
checks.push(["purchase flow test covers email serial license and invalid cases", purchaseFlowTest.includes("checkout.session.completed") && purchaseFlowTest.includes("api.resend.com/emails") && purchaseFlowTest.includes("serial missing from email") && purchaseFlowTest.includes("expected generated serial to activate") && purchaseFlowTest.includes("expected invalid serial rejection") && purchaseFlowTest.includes("expected bad signature 400")]);

// Affiliate program checks
const affiliateLp = read(dist("lp/bunsirube/affiliate/index.html"));
const affiliateDashboard = read(dist("affiliate/dashboard/index.html"));
const affiliateTerms = read(dist("legal/affiliate-terms/index.html"));
const affiliateSignupApi = read(src("functions/api/affiliate-signup.js"));
const affiliateStatusApi = read(src("functions/api/affiliate-status.js"));
const affiliateClickApi = read(src("functions/api/affiliate-click.js"));
const affiliateLib = read(src("functions/lib/affiliate.js"));
const affiliateTrackJs = read(src("public/affiliate-track.js"));
const stripeWebhookSrc = read(src("functions/api/stripe-webhook.js"));

checks.push(["30-day refund guarantee documented in legal/commerce", commerce.includes("30日") && commerce.includes("理由を問わず") && commerce.includes("全額返金") && !commerce.includes("購入後の返金には応じられません")]);
checks.push(["30-day refund guarantee documented in legal/terms", read(dist("legal/terms/index.html")).includes("30日返金保証") && read(dist("legal/terms/index.html")).includes("シリアルが無効化") && read(dist("legal/terms/index.html")).includes("アフィリエイト")]);
checks.push(["30-day refund prominent on LP", bunsirubeLp.includes("30日返金保証") && bunsirubeLp.includes("理由を問わず") && bunsirubeLp.includes("Stripe経由")]);
checks.push(["30-day refund in welcome email", stripeWebhookSrc.includes("30日返金保証") && stripeWebhookSrc.includes("文標 返金希望")]);
checks.push(["affiliate signup page has form with required fields", affiliateLp.includes('文標 アフィリエイト') && affiliateLp.includes('1件 ¥2,750') && affiliateLp.includes('id="aff-form"') && affiliateLp.includes('name="email"') && affiliateLp.includes('name="site_url"') && affiliateLp.includes('/legal/affiliate-terms/') && affiliateLp.includes('/api/affiliate-signup')]);
checks.push(["affiliate dashboard page has login + stats", affiliateDashboard.includes('ダッシュボード') && affiliateDashboard.includes('id="login-form"') && affiliateDashboard.includes('/api/affiliate-status') && affiliateDashboard.includes('総クリック数') && affiliateDashboard.includes('支払予定') && affiliateDashboard.includes('AFF-XXXX-XXXX')]);
checks.push(["affiliate ToS lists 50% commission and 30-day attribution", affiliateTerms.includes('50%') && affiliateTerms.includes('2,750') && affiliateTerms.includes('30日') && affiliateTerms.includes('ラストクリック') && affiliateTerms.includes('禁止事項') && affiliateTerms.includes('ステルスマーケティング') && affiliateTerms.includes('自己購入')]);
checks.push(["affiliate api endpoints are wired", affiliateSignupApi.includes('makeAffiliateCode') && affiliateSignupApi.includes('setAffiliateMeta') && affiliateStatusApi.includes('listSales') && affiliateStatusApi.includes('computeAffiliateStats') && affiliateClickApi.includes('recordClick')]);
checks.push(["affiliate lib has stable code generation and stats", affiliateLib.includes('AFFILIATE_COMMISSION_RATE = 0.5') && affiliateLib.includes('AFFILIATE_COMMISSION_AMOUNT = 2750') && affiliateLib.includes('makeAffiliateCode') && affiliateLib.includes('hmacBase64Url') && affiliateLib.includes('AFF-')]);
checks.push(["affiliate-track.js handles ?ref and decorates Stripe links", affiliateTrackJs.includes('AFF-') && affiliateTrackJs.includes('yohelab_aff') && affiliateTrackJs.includes('30') && affiliateTrackJs.includes('buy.stripe.com') && affiliateTrackJs.includes('client_reference_id') && affiliateTrackJs.includes('/api/affiliate-click')]);
checks.push(["pages with Stripe link include affiliate-track.js", bunsirubeLp.includes('/affiliate-track.js') && read(dist("index.html")).includes('/affiliate-track.js') && read(dist("lp/bunsirube/install/index.html")).includes('/affiliate-track.js') && read(dist("lp/bunsirube/demo/index.html")).includes('/affiliate-track.js') && read(dist("products/bunsirube/index.html")).includes('/affiliate-track.js')]);
checks.push(["stripe webhook parses affiliate code and prevents self-referral", stripeWebhookSrc.includes('AFFILIATE_REF_RE') && stripeWebhookSrc.includes('rawRef.split(":")') && stripeWebhookSrc.includes('meta.email === String(email).toLowerCase()') && stripeWebhookSrc.includes('recordSale')]);
checks.push(["affiliate footer links present on LP and home", bunsirubeLp.includes('/lp/bunsirube/affiliate/') && bunsirubeLp.includes('/legal/affiliate-terms/') && read(dist("index.html")).includes('/lp/bunsirube/affiliate/') && read(dist("index.html")).includes('/legal/affiliate-terms/')]);

for (const [name, ok] of checks) {
  assert(ok, `Check failed: ${name}`);
  console.log(`OK  ${name}`);
}

console.log(`\nPassed ${checks.length} checks.`);
