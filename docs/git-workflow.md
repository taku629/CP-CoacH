# Git ワークフロー

## ブランチ戦略

```
main         ← 本番リリース済みの状態（Vercel の本番環境に連携）
feat/*       ← 新機能の開発ブランチ
fix/*        ← バグ修正ブランチ
```

## 新機能を追加するとき

```bash
git checkout -b feat/feature-name
# 実装...
git add <files>
git commit -m "feat: 機能名を追加"
git push origin feat/feature-name
# → GitHub で PR を作成 → main にマージ
```

## バグを直すとき

```bash
git checkout -b fix/bug-description
# 修正...
git commit -m "fix: 修正内容"
git push origin fix/bug-description
# → PR → main にマージ
```

## コミットメッセージ規則

| prefix | 用途 |
|--------|------|
| `feat:` | 新機能 |
| `fix:` | バグ修正 |
| `refactor:` | リファクタリング（動作変更なし） |
| `docs:` | ドキュメント更新 |
| `chore:` | ビルド設定・依存関係など |

例:
```
feat: AtCoder Problems API 接続を追加
fix: LeetCode 取得失敗時のフォールバックを修正
docs: README にデプロイ手順を追記
```

## Vercel との連携

- `main` ブランチへの push → 自動で本番デプロイ
- feature ブランチへの push → Preview URL が自動生成（動作確認に使う）
