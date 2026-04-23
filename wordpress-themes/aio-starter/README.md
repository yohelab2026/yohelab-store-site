# AIO Starter

AIO Starter は、初心者ブロガー向けの軽量WordPressテーマです。

## 入れ方

1. `aio-starter.zip` をWordPress管理画面からアップロード
2. `外観 > テーマ` で有効化
3. `外観 > AIO Starter` でGA4、Search Console、内部解析、llms.txtを設定

## 主な機能

- Article / BlogPosting / Person / WebSite / BreadcrumbList JSON-LD
- `[aio_faq]` と連動する FAQPage JSON-LD
- `/llms.txt` 自動生成
- 軽量内部アクセス解析
- GA4 / Search Console 設定欄
- FAQ、まとめ、著者、比較表、引用、目次ショートコード
- 簡易静的HTMLキャッシュ
- `comments.php`、`404.php`、`search.php`、`theme.json` あり

## ショートコード

```text
[aio_summary]この記事のポイントを書きます。[/aio_summary]

[aio_faq question="質問を入れる"]回答を入れます。[/aio_faq]

[aio_author]

[aio_compare]
<table>
  <tr><th>項目</th><th>内容</th></tr>
  <tr><td>速度</td><td>軽量</td></tr>
</table>
[/aio_compare]
```
