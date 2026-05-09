# 文標 紹介動画

文標の紹介用Remotionプロジェクトです。

- `BunsirubeVertical`: 1080x1920、SNS縦動画向け
- `BunsirubeHorizontal`: 1920x1080、LPやYouTube横動画向け

## 素材

`public/bunsirube/` に、既存の文標操作動画ポスターをコピーして使っています。

## 生成先

完成動画はサイト側の公開アセットに出します。

- `../assets/bunsirube/promo/bunsirube-intro-vertical.mp4`
- `../assets/bunsirube/promo/bunsirube-intro-horizontal.mp4`
- `../public/assets/bunsirube/promo/`

## コマンド

```console
npm install
npm run lint
npx remotion studio
```

縦動画:

```console
npx remotion render src/index.ts BunsirubeVertical ../assets/bunsirube/promo/bunsirube-intro-vertical.mp4 --codec=h264 --pixel-format=yuv420p --crf=22
```

横動画:

```console
npx remotion render src/index.ts BunsirubeHorizontal ../assets/bunsirube/promo/bunsirube-intro-horizontal.mp4 --codec=h264 --pixel-format=yuv420p --crf=22
```

Windows環境で証明書エラーが出る場合:

```console
$env:NODE_OPTIONS='--use-system-ca'
```
