# yohelab-store-site プロジェクト引き継ぎガイド

このドキュメントは、新しいAIツールにプロジェクトを説明するためのものです。

---

## プロジェクト概要

- **サイト**: https://yohelab.com
- **リポジトリ**: https://github.com/yohelab2026/yohelab-store-site
- **ホスティング**: Cloudflare Pages（Viteでビルド。ビルドコマンド: `vite build`、出力先: `dist/`）
- **バックエンド**: Cloudflare Pages Functions（`functions/` ディレクトリ）

## ツール一覧

現在4つのツールがあります。それぞれにProプランがあります。

| キー | ツール名 | アプリパス |
|------|---------|-----------|
| `research-writer` | AIO特化リサーチ記事メーカー | /apps/research-writer/ |
| `wordpress-theme` | AIO対応WordPressテーマ | /apps/wordpress-theme/ |
| `x-helper` | X投稿ネタ生成ツール | /apps/x-helper/ |
| `ec-copy` | EC商品説明・Q&A整備 | /apps/ec-copy/ |
| `aio-mini` | AIOミニ診断 | /apps/aio-mini/ |

---

## 購入→プロ認証の仕組み

```
ユーザーが購入
  ↓
Stripe Webhook（checkout.session.completed）
  ↓
functions/api/stripe-webhook.js
  ↓
Resendでアクティベートメールを送信
  ↓
ユーザーがメール内のリンクをクリック
  ↓
/pro/activate?token=...&next=...
  ↓
functions/pro/activate.js
  ↓
HttpOnly Cookie（yohelab_access）をセット
  ↓
アプリページにリダイレクト
  ↓
/api/license?product=xxx でStripeのサブスク状態を照合
  ↓
active: true → PRO表示
```

---

## 重要ファイル

```
functions/
  api/
    license.js         # プロ認証確認エンドポイント
    stripe-webhook.js  # Stripe Webhookハンドラ
    generate.js        # AI生成エンドポイント
  pro/
    activate.js        # メールリンクからCookieをセット
  lib/
    entitlements.js    # 全ツールのプロダクト設定・認証ロジック
apps/
  research-writer/index.html
  x-helper/index.html
  ec-copy/index.html
  aio-mini/index.html
```

---

## 新しいツールを追加する手順

### 1. `functions/lib/entitlements.js` の `PRODUCT_CONFIG` に追加

```js
const PRODUCT_CONFIG = {
  "research-writer": { label: "AIO特化リサーチ記事メーカー", nextPath: "/apps/research-writer/" },
  "wordpress-theme": { label: "AIO対応WordPressテーマ", nextPath: "/apps/wordpress-theme/" },
  "x-helper": { label: "X投稿ネタ生成ツール", nextPath: "/apps/x-helper/" },
  "ec-copy": { label: "EC商品説明・Q&A整備", nextPath: "/apps/ec-copy/" },
  "aio-mini": { label: "AIOミニ診断", nextPath: "/apps/aio-mini/" },
  // ↓ 新しいツールをここに追加
  "new-tool": { label: "新しいツール名", nextPath: "/apps/new-tool/" },
};
```

### 2. アプリページ（`apps/new-tool/index.html`）に以下のインラインスクリプトを追加

```html
<script>(() => { async function load(p) { try { const r = await fetch(`/api/license?product=${encodeURIComponent(p)}`, { credentials: "include" }); if (!r.ok) return { active: false, product: p }; return r.json(); } catch { return { active: false, product: p }; } } window.YoheLabAccess = { load }; })();</script>
```

そして、ページ内でプロ判定をする：

```js
YoheLabAccess.load("new-tool").then(data => {
  if (data.active) {
    // PRO表示
  } else {
    // 無料表示
  }
});
```

### 3. Stripeで商品・Payment Linkを作成

- Payment LinkのURLに `?client_reference_id=new-tool` を付ける
- 例: `https://buy.stripe.com/xxxx?client_reference_id=new-tool`
- このキー（`new-tool`）は `PRODUCT_CONFIG` のキーと一致させる

### 4. gitにpushしてデプロイ

```bash
git add .
git commit -m "feat: add new-tool"
git push
```

---

## 環境変数（Cloudflare Pagesに設定済み）

| 変数名 | 用途 |
|--------|------|
| `STRIPE_SECRET_KEY` | Stripe制限付きAPIキー（rk_live_...） |
| `STRIPE_WEBHOOK_SECRET` | StripeのWebhook署名検証（whsec_...） |
| `RESEND_API_KEY` | メール送信（Resend） |
| `FROM_EMAIL` | 送信元メールアドレス |
| `ACCESS_SECRET` | Cookie署名用シークレット |

---

## 注意事項

- Cloudflare Pagesは **Viteでビルド**している。ビルドコマンド: `vite build`、出力先: `dist/`。
- `public/` ディレクトリは存在する。静的アセット（画像など）を置く場所。
- `vite.config.js` にビルド対象のHTMLページが列挙されている。新しいページを追加したら `vite.config.js` の `input` にも追加する。
- 環境変数を変更したら、必ずgit pushでデプロイをトリガーする（空コミットでもOK）。
- Stripeの制限付きAPIキー（`rk_live_...`）はSubscriptions読み取り権限のみ付与している。
- Cookieは `yohelab_access` という名前でHttpOnly・Secure・SameSite=Lax。有効期限1年。
- アドブロッカー対策として、外部JSファイルではなくインラインスクリプトを使用している。
