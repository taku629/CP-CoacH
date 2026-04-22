# CP Coach

AtCoder と LeetCode の ID を入力するだけで、弱点分析・次に解くべき5問・1週間の練習プランを自動生成する競プロ学習支援ツールです。

## 主な機能

| 機能 | 説明 |
|------|------|
| 現在地診断 | AtCoder の AC 履歴から推定レーティングを算出し、実力帯を判定 |
| 弱点分野の可視化 | DP・Graph・Binary Search など分野ごとの AC 率を分析 |
| 次に解くべき5問 | 実力より少し上の難易度帯から弱点タグを優先して AtCoder + LeetCode の両方から自動選出 |
| 1週間の練習プラン | 曜日ごとに無理のないメニューを設計 |
| 前回との比較 | 診断履歴をブラウザに保存して弱点の増減を可視化 |
| 解いた問題の管理 | 推薦問題に「解いた」マークをつけると次回の推薦から除外 |
| AI 診断文 | ANTHROPIC_API_KEY があれば Claude による自然言語の診断コメントを生成（未設定時はルールベースで動作）|

## ローカル起動

```bash
git clone <your-repo-url>
cd cp-coach
npm install

# 環境変数（省略可）
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env.local

npm run dev
# → http://localhost:3000
```

## 環境変数

`.env.local` に以下を設定してください。

| 変数名 | 必須 | 説明 |
|--------|------|------|
| `ANTHROPIC_API_KEY` | 任意 | Claude API キー。未設定でもルールベースで動作します |

AtCoder / LeetCode の API キーは不要です（公開 API を使用）。

## ページ構成

| URL | 説明 |
|-----|------|
| `/` | ランディングページ |
| `/coach` | 入力フォーム（AtCoder ID / LeetCode ID） |
| `/result` | 診断結果画面 |
| `/api/analyze` | 分析 Route Handler（AtCoder + LeetCode + Claude） |

## 技術スタック

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **AI**: Anthropic Claude API (`@anthropic-ai/sdk`)
- **Data**: AtCoder Problems API (kenkoooo.com) / LeetCode GraphQL API
- **Storage**: localStorage（履歴・問題ステータス）

## デプロイ（Vercel）

1. GitHub にリポジトリを作成して push する
2. [Vercel](https://vercel.com) でプロジェクトを作成してリポジトリを連携
3. ダッシュボードの **Settings → Environment Variables** に `ANTHROPIC_API_KEY` を追加
4. Redeploy してデプロイ完了後、以下の URL で動作確認

| URL | 確認内容 |
|-----|---------|
| `https://your-app.vercel.app/` | LP が表示される |
| `https://your-app.vercel.app/coach` | 入力フォームが動く |
| 診断実行後 `/result` | AtCoder / LeetCode バッジが「実データ接続中」になる |
| 2回目診断 | 前回比較カードが表示される |

詳細は [`docs/git-workflow.md`](docs/git-workflow.md) を参照してください。

## 今後の予定

- [ ] 面接モード（LeetCode 頻出パターン特化）
- [ ] コンテスト前後モード（直前調整プラン / 復習プラン）
- [ ] 復習ノート生成
- [ ] 週次メールレポート
- [ ] グループ機能

## 注意事項

- AtCoder / LeetCode のプロフィールを**公開設定**にしてから利用してください
- LeetCode の GraphQL API は非公式です。仕様変更により取得できなくなる場合があります
- AtCoder / LeetCode の取得に失敗した場合はモックデータを返します
