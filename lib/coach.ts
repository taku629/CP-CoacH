import type {
  AtCoderProblem,
  UserStats,
  Weakness,
  NextProblem,
  WeeklyPlan,
  DayPlan,
  Task,
} from "@/types";

// =====================
// 弱点タグの判定
// =====================
// タグごとのAC率が低い、または全く解いていないものを弱点とする。
// AtCoder Problems のタグは英語（"dp", "binary search", "graph" など）
const IMPORTANT_TAGS = [
  "dp",
  "binary search",
  "graph",
  "bfs",
  "dfs",
  "greedy",
  "math",
  "implementation",
  "string",
  "tree",
  "data structure",
  "segment tree",
  "two pointers",
];

export function detectWeaknesses(stats: UserStats): Weakness[] {
  const weaknesses: Weakness[] = [];

  // --- AtCoder 弱点分析 ---
  for (const tag of IMPORTANT_TAGS) {
    const tagStat = stats.atcoder.tagStats[tag];

    if (!tagStat || tagStat.ac === 0) {
      // そのタグを全く解いていない
      weaknesses.push({
        tag,
        reason: `AtCoder で ${tag} の問題をまだ解いていません`,
        priority: "high",
      });
      continue;
    }

    const acRate = tagStat.ac / tagStat.total;
    if (acRate < 0.4) {
      weaknesses.push({
        tag,
        reason: `AtCoder の ${tag} のAC率が ${Math.round(acRate * 100)}% と低めです`,
        priority: acRate < 0.2 ? "high" : "medium",
      });
    }
  }

  // --- LeetCode 弱点分析 ---
  // Easy 偏重チェック
  const { easySolved, mediumSolved, hardSolved, totalSolved } = stats.leetcode;
  if (totalSolved > 10) {
    const easyRatio = easySolved / totalSolved;
    if (easyRatio > 0.7) {
      weaknesses.push({
        tag: "Medium問題の経験不足",
        reason: `LeetCode の ${Math.round(easyRatio * 100)}% が Easy です。Medium に挑戦しましょう`,
        priority: "high",
      });
    }
    if (mediumSolved < 10 && totalSolved > 20) {
      weaknesses.push({
        tag: "Medium/Hard の演習量",
        reason: "LeetCode Medium を 10 問以上解くとコーディング面接の基礎が固まります",
        priority: "medium",
      });
    }
  }

  // タグ偏りチェック（上位3タグが全体の60%超ならそれ以外が弱点）
  const topTags = stats.leetcode.tagStats.slice(0, 3);
  const topSum = topTags.reduce((s, t) => s + t.problemsSolved, 0);
  const lcTotal = stats.leetcode.tagStats.reduce((s, t) => s + t.problemsSolved, 0);
  if (lcTotal > 0 && topSum / lcTotal > 0.6 && topTags.length >= 3) {
    weaknesses.push({
      tag: `LeetCode: ${topTags[0].tagName} 以外の分野`,
      reason: `${topTags.map((t) => t.tagName).join("、")} に集中しています。他の分野も練習しましょう`,
      priority: "medium",
    });
  }

  // 重複排除・優先度順ソート、最大6件
  const seen = new Set<string>();
  return weaknesses
    .filter((w) => {
      if (seen.has(w.tag)) return false;
      seen.add(w.tag);
      return true;
    })
    .sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.priority] - order[b.priority];
    })
    .slice(0, 6);
}

// =====================
// 次に解くべき5問の選出
// =====================
// 選出ルール:
//   AtCoder から 3問: 推定レーティング ± 200 の範囲で、弱点タグを優先
//   LeetCode から 2問: Medium で弱点タグ優先（Hard は推定レーティング1600以上の場合に1問）
export function selectNextProblems(
  stats: UserStats,
  allProblems: AtCoderProblem[],
  acSet: Set<string>,
  weaknesses: Weakness[],
  doneSet: Set<string> = new Set()
): NextProblem[] {
  const results: NextProblem[] = [];
  const rating = stats.atcoder.estimatedRating;

  // 推定レーティングから適切な難易度帯を決める
  const targetMin = Math.max(rating - 100, 400);
  const targetMax = rating + 300;

  // 弱点タグ上位3つ（AtCoder向け）
  const weakAtCoderTags = weaknesses
    .filter((w) => !w.tag.includes("LeetCode") && !w.tag.includes("Medium") && !w.tag.includes("Hard"))
    .slice(0, 3)
    .map((w) => w.tag);

  // --- AtCoder 問題選出 ---
  // 難易度が適切かつ未AC、弱点タグがあれば優先
  const candidates = allProblems
    .filter((p) => {
      if (!p.difficulty) return false;
      if (acSet.has(p.id)) return false;
      if (doneSet.has(p.id)) return false; // 「解いた」マーク済みは除外
      return p.difficulty >= targetMin && p.difficulty <= targetMax;
    })
    .sort((a, b) => {
      // 弱点タグの問題を優先（タグ一致 = -1000点ボーナス）
      const aTagBonus = (a.tags ?? []).some((t) => weakAtCoderTags.includes(t)) ? -1000 : 0;
      const bTagBonus = (b.tags ?? []).some((t) => weakAtCoderTags.includes(t)) ? -1000 : 0;
      return aTagBonus - bTagBonus || (a.difficulty ?? 0) - (b.difficulty ?? 0);
    });

  const atcoderPicks = candidates.slice(0, 3);
  for (const p of atcoderPicks) {
    const diff = p.difficulty ?? 0;
    const matchedTag = (p.tags ?? []).find((t) => weakAtCoderTags.includes(t)) ?? p.tags?.[0] ?? "不明";
    results.push({
      site: "atcoder",
      problemId: p.id,
      title: p.title ?? p.name,
      url: `https://atcoder.jp/contests/${p.contest_id}/tasks/${p.id}`,
      difficulty: `difficulty ${diff}（${diffLabel(diff)}）`,
      tag: matchedTag,
      reason: weakAtCoderTags.includes(matchedTag)
        ? `弱点の「${matchedTag}」を補強する問題です（difficulty ${diff}）`
        : `今の実力（推定 ~${rating}）より少し難しい練習問題です（difficulty ${diff}）`,
    });
  }

  // --- LeetCode 問題選出（固定セレクション） ---
  // MVP段階ではLeetCodeの問題DBを持たないので、弱点タグに対する推奨をルールベースで生成
  const lcWeakTags = weaknesses
    .filter((w) => !w.tag.includes("AtCoder"))
    .slice(0, 2);

  const lcDifficulty = rating >= 1600 ? "Hard" : "Medium";

  const lcSuggestions: Array<{ slug: string; title: string; tag: string; difficulty: string }> = [
    { slug: "two-sum", title: "Two Sum", tag: "hash table", difficulty: "Easy" },
    { slug: "climbing-stairs", title: "Climbing Stairs", tag: "dp", difficulty: "Easy" },
    { slug: "coin-change", title: "Coin Change", tag: "dp", difficulty: "Medium" },
    { slug: "number-of-islands", title: "Number of Islands", tag: "graph", difficulty: "Medium" },
    { slug: "binary-search", title: "Binary Search", tag: "binary search", difficulty: "Easy" },
    { slug: "search-a-2d-matrix", title: "Search a 2D Matrix", tag: "binary search", difficulty: "Medium" },
    { slug: "longest-common-subsequence", title: "Longest Common Subsequence", tag: "dp", difficulty: "Medium" },
    { slug: "maximum-subarray", title: "Maximum Subarray", tag: "dp", difficulty: "Medium" },
    { slug: "word-break", title: "Word Break", tag: "dp", difficulty: "Medium" },
    { slug: "course-schedule", title: "Course Schedule", tag: "graph", difficulty: "Medium" },
    { slug: "median-of-two-sorted-arrays", title: "Median of Two Sorted Arrays", tag: "binary search", difficulty: "Hard" },
  ];

  // 弱点タグに合う問題を優先選出
  const solvedTitles = new Set(
    stats.leetcode.recentSubmissions.map((s) => s.titleSlug)
  );

  const lcPicks = lcSuggestions
    .filter((s) => !solvedTitles.has(s.slug))
    .filter((s) => {
      if (lcWeakTags.length === 0) return s.difficulty === lcDifficulty;
      return lcWeakTags.some((w) => s.tag.includes(w.tag.toLowerCase()) || w.tag.toLowerCase().includes(s.tag));
    })
    .slice(0, 2);

  // 弱点マッチがなければ難易度でフィルタした上位を使う
  const fallback = lcSuggestions
    .filter((s) => !solvedTitles.has(s.slug) && s.difficulty === lcDifficulty)
    .slice(0, 2);

  const finalLcPicks = lcPicks.length >= 2 ? lcPicks : [...lcPicks, ...fallback].slice(0, 2);

  for (const p of finalLcPicks) {
    results.push({
      site: "leetcode",
      problemId: p.slug,
      title: p.title,
      url: `https://leetcode.com/problems/${p.slug}/`,
      difficulty: p.difficulty,
      tag: p.tag,
      reason: `LeetCode ${p.difficulty} の「${p.tag}」問題。コーディング面接での頻出パターンです`,
    });
  }

  return results;
}

// =====================
// 1週間の練習プラン生成
// =====================
// 合計 10〜15 問を月〜日に分配
// 月: AtCoder × 2（弱点タグ）
// 火: LeetCode × 2（Medium）
// 水: AtCoder × 2（難易度上げ）
// 木: LeetCode × 2（Medium/Hard）
// 金: AtCoder × 2（復習 or 新規）
// 土: 模擬コンテスト参加 or 難しめの1問
// 日: 振り返り・解説読み
export function generateWeeklyPlan(
  stats: UserStats,
  weaknesses: Weakness[]
): WeeklyPlan {
  const rating = stats.atcoder.estimatedRating;
  const topWeakTag = weaknesses[0]?.tag ?? "dp";
  const targetDiff = `${Math.max(rating, 400)}〜${rating + 300}`;
  const lcDiff = rating >= 1600 ? "Medium/Hard" : "Medium";

  const days: DayPlan[] = [
    {
      day: "月曜日",
      tasks: [
        {
          site: "atcoder",
          count: 2,
          difficulty: targetDiff,
          tag: topWeakTag,
          description: `AtCoder difficulty ${targetDiff} の「${topWeakTag}」2問を解く。まず自力で20分、無理なら解説を読む`,
        },
      ],
    },
    {
      day: "火曜日",
      tasks: [
        {
          site: "leetcode",
          count: 2,
          difficulty: lcDiff,
          tag: weaknesses[1]?.tag ?? "graph",
          description: `LeetCode ${lcDiff} を2問。解けなかった場合は Discuss で解法のパターンを学ぶ`,
        },
      ],
    },
    {
      day: "水曜日",
      tasks: [
        {
          site: "atcoder",
          count: 2,
          difficulty: `${rating}〜${rating + 200}`,
          tag: "greedy",
          description: `AtCoder で greedy / 実装系を2問。スピード感を意識して解く`,
        },
      ],
    },
    {
      day: "木曜日",
      tasks: [
        {
          site: "leetcode",
          count: 2,
          difficulty: lcDiff,
          tag: "binary search",
          description: `LeetCode ${lcDiff} の binary search 2問。テンプレを体に覚えさせる`,
        },
      ],
    },
    {
      day: "金曜日",
      tasks: [
        {
          site: "atcoder",
          count: 2,
          difficulty: targetDiff,
          tag: "dp",
          description: `AtCoder の DP 2問。今週の総仕上げ。自力 AC を目指す`,
        },
      ],
    },
    {
      day: "土曜日",
      tasks: [
        {
          site: "atcoder",
          count: 1,
          difficulty: `${rating + 200}〜${rating + 400}`,
          tag: "challenge",
          description: `AtCoder の過去コンテスト C〜D問題に挑戦。60分タイマーをセットして本番想定で解く`,
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
          description: `今週 AC できなかった問題の解説を読む。解法のパターンをノートにまとめる（30分）`,
        },
      ],
    },
  ];

  const totalProblems = days.reduce(
    (sum, d) => sum + d.tasks.reduce((s, t) => s + t.count, 0),
    0
  );

  return {
    goal: `今週の目標: ${topWeakTag} を克服し、AtCoder difficulty ${rating + 200} の問題をコンスタントに解けるようになる（週${totalProblems}問）`,
    advice: `無理に全問解こうとせず、1問をしっかり理解する方が力になります。解けなかった問題は翌日に解説を読みましょう。`,
    days,
  };
}

function diffLabel(diff: number): string {
  if (diff < 400) return "灰";
  if (diff < 800) return "茶";
  if (diff < 1200) return "緑";
  if (diff < 1600) return "水";
  if (diff < 2000) return "青";
  if (diff < 2400) return "黄";
  return "橙以上";
}

// AtCoder の推定レーティングから診断ラベルを返す
export function diagnosisLabel(acRating: number, lcStats: { easySolved: number; mediumSolved: number; totalSolved: number }): string {
  let acLabel = "";
  if (acRating < 400) acLabel = "AtCoder 灰〜茶レベル（基礎定着中）";
  else if (acRating < 800) acLabel = "AtCoder 茶レベル（基礎固め中）";
  else if (acRating < 1200) acLabel = "AtCoder 茶〜緑レベル（標準問題に挑戦中）";
  else if (acRating < 1600) acLabel = "AtCoder 緑〜水レベル（応用問題対応力あり）";
  else acLabel = "AtCoder 水〜青レベル（上級者）";

  const easyRatio =
    lcStats.totalSolved > 0
      ? Math.round((lcStats.easySolved / lcStats.totalSolved) * 100)
      : 100;

  let lcLabel = "";
  if (lcStats.totalSolved < 20) lcLabel = "LeetCode 初期段階";
  else if (easyRatio > 70) lcLabel = `LeetCode Easy 偏重（Easy ${easyRatio}%）`;
  else if (lcStats.mediumSolved > 50) lcLabel = "LeetCode Medium 中級以上";
  else lcLabel = "LeetCode Easy〜Medium 移行期";

  return `${acLabel} / ${lcLabel}`;
}
