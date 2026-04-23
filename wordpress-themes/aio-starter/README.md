# AIO Starter

AIO Starter は、初心者ブロガー向けの軽量WordPressテーマです。

## 入れ方

1. `aio-starter.zip` をWordPress管理画面からアップロード
2. `外観 > テーマ` で有効化
3. `外観 > AIO Starter` でGA4、Search Console、内部解析、llms.txtを設定

## 最終チェック表

| 項目 | 状態 |
|---|---|
| テーマ基本ファイル | OK |
| ZIP配布物 | OK |
| 404 / 検索 / コメント | OK |
| screenshot.png | OK |
| theme.json | OK |
| 3色プリセット | OK |
| メインカラー / 文字色の変更 | OK |
| JSON-LD | OK |
| llms.txt | OK |
| 内部アクセス解析 | OK |
| GA4 / Search Console | OK |
| FAQ / まとめ / 著者 / 比較表 / 引用 / 目次 | OK |
| モバイル向けCSS | OK |
| 実機WordPress有効化 | 未実施 |
| Theme Check / Lighthouse | 未実施 |
| スマホ実機 | 未実施 |
| コメント返信 | 未実施 |

## 主な機能

- Article / BlogPosting / Person / WebSite / BreadcrumbList JSON-LD
- `[aio_faq]` と連動する FAQPage JSON-LD
- `/llms.txt` 自動生成
- 軽量内部アクセス解析
- GA4 / Search Console 設定欄
- FAQ、まとめ、著者、比較表、引用、目次ショートコード
- 簡易静的HTMLキャッシュ
- `comments.php`、`404.php`、`search.php`、`theme.json` あり
- 管理画面からメインカラーと文字色を変更可能

## ショートコード

### まとめブロック（記事冒頭）
```text
[aio_summary title="この記事のポイント"]
・AIO対応とは構造化データを整えること
・FAQを記事に入れるとAIにも人にも意図が伝わりやすい
[/aio_summary]
```

### FAQブロック（FAQPage JSON-LDと連動）
```text
[aio_faq question="AIOとは何ですか？"]
GoogleのAI概要など、検索結果内でAIが回答を要約する流れのことです。
[/aio_faq]
```

### 目次（h2/h3 から自動生成）
```text
[aio_toc title="目次"]
```
※記事の冒頭に置くと、h2/h3 見出しからリンク付き目次を自動生成します。

### 著者情報（E-E-A-T強化）
```text
[aio_author]
[aio_author expertise="SEOコンサルタント" twitter="@username"]
```

### 引用・出典ブロック
```text
[aio_cite source="Google Search Central" url="https://developers.google.com/"]
引用したいテキストを入れます。
[/aio_cite]
```

### 比較表ブロック
```text
[aio_compare]
<table>
  <tr><th>項目</th><th>無料版</th><th>有料版</th></tr>
  <tr><td>テンプレート数</td><td>1種</td><td>3種</td></tr>
</table>
[/aio_compare]
```

## AIO向け記事の書き方

AIO/AI検索時代に読み取りやすい記事構成の例：

```text
[aio_toc]

[aio_summary]
・結論を先に3行でまとめる
・FAQを下部に入れる
・見出し構造をh2→h3の順で整える
[/aio_summary]

## 結論（最初に答えを出す）
本文...

## 詳細説明
本文...

## よくある質問
[aio_faq question="質問1"]回答1[/aio_faq]
[aio_faq question="質問2"]回答2[/aio_faq]

[aio_author expertise="専門分野"]
```
