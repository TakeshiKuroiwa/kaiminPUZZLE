# KaiminPUZZLE 🐑

## ユーザー向け — 概要

KaiminPUZZLE は、かわいい羊「kaiminちゃん」が登場するシンプルで爽快な Match-2 パズルゲームです。

- 操作: ブロックをクリックして同色の隣接ブロックを消す
- 特殊ブロック: `kaimin`（周囲3x3消去）、`rainbow`（任意同色として扱う）
- コンボ / Dream Time: 連鎖でスコア増加、5コンボで Dream Time（スコア2倍）
- ビジュアル: 消去時に円形のリップル（光）エフェクト

まずはローカルでプレイして感触を確かめてください。

## 開発者向け — セットアップ & 貢献

必要条件:
- Node.js (推奨: 18+) と npm

ローカルセットアップ:

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

主要ファイル:
- `src/hooks/useBoard.ts` — ゲームロジック（クリック処理、スコア、コンボ）
- `src/utils/boardUtils.ts` — マッチ検出、重力、列シフト
- `src/components/Board.tsx`, `src/components/Block.tsx` — UI とクリック伝播

開発のポイント:
- ブロックの見た目と内部 `x,y` がずれるとクリック位置がずれるため、レンダリングインデックス（map の `x,y`）をクリック座標として渡す実装にしています。
- 消去アニメーション中の入力抑止や追加の視覚フィードバックは今後の改善候補です。

## GitHub Pages への配備（手動）

このリポジトリを GitHub にプッシュし、GitHub Pages で公開する簡単な方法は `dist` を `docs/` にコピーして `main` ブランチの `docs` を Pages のソースに指定する方法です。

手順:

```bash
npm run build
rm -rf docs
cp -r dist docs
git add docs
git commit -m "chore: deploy docs for GitHub Pages"
git push origin main
# GitHub のリポジトリ Settings → Pages で Source を 'main' ブランチの /docs に設定
```

自動化したい場合は `gh-pages` パッケージや GitHub Actions を使った自動デプロイを追加できます。

## 貢献
- バグ報告・改善提案・プルリク歓迎。Issue を立ててください。

---
（README はユーザー向けの概要と開発者向けの手順を分けて記載しています）
