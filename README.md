# KaiminPUZZLE 🐑

## ゲーム概要

KaiminPUZZLE は、かわいい羊「kaimin」が登場する Match-2 形式のパズルゲームです。

### 主な特徴

- タイトル画面で難易度を選択できる
  - `EASY`：`kaimin` パネル 5 枚以上、`rainbow` パネル 5 枚以上
  - `NORMAL`：`kaimin`、`rainbow` それぞれ 4 枚以下、かつ特殊パネル合計 6 枚以上
  - `HARD`：`kaimin` 1 枚、`rainbow` 1 枚
  - `VERY HARD`：特殊パネルなし
- 結果画面でプレイヤーネーム入力とランキング登録が可能
- プレイヤーネーム入力をスキップするとランキング登録されない
- `VERY HARD` に近いほど得点倍率が高くなる難易度優遇
- クリア時は残りパネル 1 枚ごとに 200 ポイント減算
- 全消しクリア時は最終得点が 2 倍になり、`kaimin` がダンスアニメーションを表示

### 特殊パネルの動作

- `kaimin` パネルは自分自身をクリックしないと消えない
- クリックした `kaimin` は周囲 2 マスまでの 5x5 範囲のパネルを消去する
- 他の `kaimin` の消去には影響されない
- `rainbow` パネルは任意の色として扱えるが、
  - 2 枚以上の同色パネルと合わせて 3 枚以上でなければ消せない

## 画面フロー

1. タイトル画面
2. ゲーム画面
3. 結果画面

結果画面では、プレイヤーネームを登録するかスキップし、ランキングを確認した後にタイトル画面へ戻れます。

## オンラインでプレイ

**ブラウザでプレイ:** https://kaimin-puzzle.vercel.app/

## 開発者向けセットアップ

必要条件:
- Node.js (推奨: 18+) と npm

```bash
git clone https://github.com/TakeshiKuroiwa/kaiminPUZZLE.git
cd kaiminPUZZLE
npm install
npm run dev
```

ビルド:

```bash
npm run build
```

## 主要ファイル

- `src/hooks/useBoard.ts` — ゲーム進行、スコア計算、難易度管理
- `src/utils/boardUtils.ts` — ボード生成、マッチ検出、重力処理、移動判定
- `src/components/Board.tsx`, `src/components/Block.tsx` — ブロック表示とクリック処理
- `src/App.tsx` — タイトル画面 / ゲーム画面 / 結果画面の画面遷移
- `api/rankings.ts` — Vercel Function によるランキング取得 / 登録

## Vercel 配備

このリポジトリは Vercel で公開しています。フロントエンドは Vite の静的ビルド、ランキング保存は `api/rankings.ts` の Vercel Function と Vercel KV / Upstash Redis を使います。

本番 URL:

```txt
https://kaimin-puzzle.vercel.app/
```

Vercel のデプロイ元:

```txt
Repository: TakeshiKuroiwa/kaiminPUZZLE
Branch: main
```

Vercel 側の設定:

```txt
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
```

ランキング機能には以下の環境変数が必要です。Vercel KV / Upstash Redis をプロジェクトに接続すると Vercel 側に追加されます。

```txt
KV_REST_API_URL
KV_REST_API_TOKEN
```

`main` ブランチに push すると Vercel に自動デプロイされます。ランキング登録は `/api/rankings` を通して保存されます。

## 貢献

バグ報告や機能改善提案、プルリクエストは歓迎です。Issue を作成してください。
