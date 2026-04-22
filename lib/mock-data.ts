import type { DiagnosisResult } from "@/types";

// v0.1: ダミーデータ
// v0.2以降: atcoder.ts / leetcode.ts / coach.ts / claude.ts の実装に差し替える
export function getMockResult(atcoderId: string, leetcodeId: string): DiagnosisResult {
  return {
    levelLabel: "データ取得に失敗しました（サンプル表示）",
    levelDescription: `AtCoder / LeetCode のデータを取得できなかったため、サンプルデータを表示しています。IDが正しいか、プロフィールが公開設定になっているか確認してください。`,
    weaknesses: [
      {
        tag: "dp",
        reason: "AtCoder で dp タグの問題のAC率が28%と低めです。基本パターンの習得が急務です",
        priority: "high",
      },
      {
        tag: "binary search",
        reason: "AtCoder で binary search の問題をまだほとんど解いていません",
        priority: "high",
      },
      {
        tag: "graph",
        reason: "BFS/DFS を使うグラフ問題のAC率が35%です。典型パターンを体に覚えさせましょう",
        priority: "medium",
      },
      {
        tag: "Medium問題の経験不足",
        reason: "LeetCode の73%がEasyです。Mediumに挑戦することでコーディング力が大きく上がります",
        priority: "high",
      },
      {
        tag: "segment tree",
        reason: "AtCoder で segment tree を使う問題に着手できていません",
        priority: "low",
      },
    ],
    nextProblems: [
      {
        site: "atcoder",
        problemId: "abc213_d",
        title: "Takahashi Tour",
        url: "https://atcoder.jp/contests/abc213/tasks/abc213_d",
        difficulty: "difficulty 895（緑）",
        tag: "graph",
        reason: "弱点の「graph」を補強するDFS問題。木上の全頂点を訪問するパターンを習得できます",
      },
      {
        site: "atcoder",
        problemId: "abc184_e",
        title: "Third Avenue",
        url: "https://atcoder.jp/contests/abc184/tasks/abc184_e",
        difficulty: "difficulty 1040（緑）",
        tag: "bfs",
        reason: "BFS の応用問題。テレポートを活用した最短経路探索で実践的なBFS力がつきます",
      },
      {
        site: "atcoder",
        problemId: "abc179_d",
        title: "Leaping Reindeer",
        url: "https://atcoder.jp/contests/abc179/tasks/abc179_d",
        difficulty: "difficulty 960（緑）",
        tag: "dp",
        reason: "今の実力（推定 ~900）より少し難しいDP問題。遷移の考え方を鍛えられます",
      },
      {
        site: "leetcode",
        problemId: "coin-change",
        title: "Coin Change",
        url: "https://leetcode.com/problems/coin-change/",
        difficulty: "Medium",
        tag: "dp",
        reason: "LeetCode Medium の定番DP問題。最小コインの組み合わせを求めるパターンは頻出です",
      },
      {
        site: "leetcode",
        problemId: "number-of-islands",
        title: "Number of Islands",
        url: "https://leetcode.com/problems/number-of-islands/",
        difficulty: "Medium",
        tag: "graph",
        reason: "グリッド上のBFS/DFS典型問題。コーディング面接でほぼ必ず問われるパターンです",
      },
    ],
    weeklyPlan: {
      goal: "今週の目標: DP と Graph の基本パターンを習得し、AtCoder difficulty 1000前後の問題をコンスタントに解けるようになる（週11問）",
      advice: "無理に全問解こうとせず、1問をしっかり理解する方が力になります。解けなかった問題は翌日に解説を読みましょう。",
      days: [
        {
          day: "月曜日",
          tasks: [
            {
              site: "atcoder",
              count: 2,
              difficulty: "800〜1100",
              tag: "dp",
              description: "AtCoder difficulty 800〜1100 の DP 問題を2問。まず自力で20分、無理なら解説を読む",
            },
          ],
        },
        {
          day: "火曜日",
          tasks: [
            {
              site: "leetcode",
              count: 2,
              difficulty: "Medium",
              tag: "graph",
              description: "LeetCode Medium を2問。解けなかった場合は Discuss で解法のパターンを学ぶ",
            },
          ],
        },
        {
          day: "水曜日",
          tasks: [
            {
              site: "atcoder",
              count: 2,
              difficulty: "900〜1100",
              tag: "greedy",
              description: "AtCoder で greedy / 実装系を2問。スピード感を意識して解く",
            },
          ],
        },
        {
          day: "木曜日",
          tasks: [
            {
              site: "leetcode",
              count: 2,
              difficulty: "Medium",
              tag: "binary search",
              description: "LeetCode Medium の binary search 2問。テンプレを体に覚えさせる",
            },
          ],
        },
        {
          day: "金曜日",
          tasks: [
            {
              site: "atcoder",
              count: 2,
              difficulty: "900〜1200",
              tag: "dp",
              description: "AtCoder の DP 2問。今週の総仕上げ。自力 AC を目指す",
            },
          ],
        },
        {
          day: "土曜日",
          tasks: [
            {
              site: "atcoder",
              count: 1,
              difficulty: "1100〜1300",
              tag: "challenge",
              description: "AtCoder の過去コンテスト C〜D問題に挑戦。60分タイマーをセットして本番想定で解く",
            },
          ],
        },
        {
          day: "日曜日",
          tasks: [
            {
              site: "atcoder",
              count: 0,
              difficulty: "-",
              tag: "review",
              description: "今週 AC できなかった問題の解説を読む。解法のパターンをノートにまとめる（30分）",
            },
          ],
        },
      ],
    },
  };
}
