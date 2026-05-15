import {
  fetchAllProblems,
  fetchProblemModels,
  fetchUserSubmissions,
  fetchUserRating,
  buildAtCoderStats,
} from "@/lib/atcoder-client";
import {
  detectWeaknesses,
  selectNextProblems,
  generateWeeklyPlan,
  diagnosisLabel,
} from "@/lib/coach";
import type {
  AtCoderPrecomputed,
  DiagnosisResult,
  LeetCodeStats,
  UserStats,
} from "@/types";

const EMPTY_LEETCODE: LeetCodeStats = {
  totalSolved: 0,
  easySolved: 0,
  mediumSolved: 0,
  hardSolved: 0,
  recentSubmissions: [],
  tagStats: [],
};

export type AnalyzeOpts = {
  onProgress?: (step: number) => void;
  onWarning?: (msg: string) => void;
  previousResult?: DiagnosisResult;
  doneProblems?: string[];
};

export type AnalyzeOutcome =
  | { ok: true; data: DiagnosisResult }
  | { ok: false; error: string };

export async function runAnalysis(
  atcoderId: string,
  leetcodeId: string,
  opts: AnalyzeOpts = {}
): Promise<AnalyzeOutcome> {
  const { onProgress, onWarning, previousResult, doneProblems = [] } = opts;
  const atId = atcoderId.trim();
  const lcId = leetcodeId.trim();

  if (!atId && !lcId) {
    return { ok: false, error: "AtCoder ID か LeetCode ID のどちらかを入力してください" };
  }

  onProgress?.(0);
  let atcoderPrecomputed: AtCoderPrecomputed | undefined;

  if (atId) {
    try {
      const [submissions, allProblems, problemModels, ratingResult] = await Promise.all([
        fetchUserSubmissions(atId),
        fetchAllProblems(),
        fetchProblemModels(),
        fetchUserRating(atId),
      ]);

      let ratingNotFound = false;
      if (!ratingResult.ok && ratingResult.reason === "not_found") {
        ratingNotFound = true;
        onWarning?.(
          "AtCoder の公式レートを取得できませんでした（ユーザーが非公開または存在しない可能性があります）。推定レートを使用しています。"
        );
      }

      const officialRating = ratingResult.ok ? ratingResult.rating : null;
      const problemMap = new Map(allProblems.map((p) => [p.id, p]));
      const { userStats: atcoderUserStats } = buildAtCoderStats(
        submissions,
        problemModels,
        problemMap,
        officialRating
      );

      onProgress?.(1);

      const userStatsWithEmptyLc: UserStats = {
        atcoder: atcoderUserStats,
        leetcode: EMPTY_LEETCODE,
      };

      const problemsWithDiff = allProblems.map((p) => ({
        ...p,
        difficulty: problemModels[p.id]?.difficulty ?? p.difficulty,
      }));
      const acSet = new Set(submissions.map((s) => s.problem_id));
      const doneSet = new Set(doneProblems);
      const weaknesses = detectWeaknesses(userStatsWithEmptyLc);
      const nextProblems = selectNextProblems(
        userStatsWithEmptyLc,
        problemsWithDiff,
        acSet,
        weaknesses,
        doneSet
      );
      const weeklyPlan = generateWeeklyPlan(userStatsWithEmptyLc, weaknesses);
      const label = diagnosisLabel(atcoderUserStats.estimatedRating, EMPTY_LEETCODE);

      atcoderPrecomputed = {
        atcoderUserStats,
        weaknesses,
        levelLabel: label,
        nextProblems,
        weeklyPlan,
        ratingNotFound,
      };
    } catch (err) {
      console.warn(
        "[runAnalysis] AtCoder kenkoooo fetch failed:",
        err instanceof Error ? err.message : err
      );

      const ratingOnly = await fetchUserRating(atId).catch(
        () => ({ ok: false, reason: "error" }) as const
      );

      if (ratingOnly.ok && ratingOnly.rating !== null) {
        const rating = ratingOnly.rating;
        onWarning?.(
          `AtCoder の問題データは現在取得できませんが、レーティング ${rating}${ratingOnly.provisional ? "（仮）" : ""} を元に診断します。`
        );

        const ratingOnlyStats: UserStats["atcoder"] = {
          acCount: 0,
          difficultyDistribution: {},
          tagStats: {},
          estimatedRating: rating,
        };
        const userStatsWithEmptyLc: UserStats = {
          atcoder: ratingOnlyStats,
          leetcode: EMPTY_LEETCODE,
        };
        const weaknesses = detectWeaknesses(userStatsWithEmptyLc);
        const weeklyPlan = generateWeeklyPlan(userStatsWithEmptyLc, weaknesses);
        const label = diagnosisLabel(rating, EMPTY_LEETCODE);

        atcoderPrecomputed = {
          atcoderUserStats: ratingOnlyStats,
          weaknesses,
          levelLabel: label,
          nextProblems: [],
          weeklyPlan,
          ratingNotFound: ratingOnly.provisional,
        };
      } else if (!lcId) {
        return {
          ok: false,
          error:
            "AtCoder のデータ取得に失敗しました。AtCoder Problems API（kenkoooo.com）が一時的に応答していません。LeetCode ID も入力して再試行するか、しばらく時間をおいてからお試しください。",
        };
      } else {
        onWarning?.("AtCoder のデータ取得に失敗しました。LeetCode のみで分析します。");
      }
    }
  }

  onProgress?.(2);

  try {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        atcoderId: atId,
        leetcodeId: lcId,
        previousResult,
        doneProblems,
        atcoderPrecomputed,
      }),
    });
    onProgress?.(3);
    const data = await res.json();
    if (!data.success) {
      return { ok: false, error: data.error ?? "エラーが発生しました" };
    }
    return { ok: true, data: data.data as DiagnosisResult };
  } catch {
    return {
      ok: false,
      error: "通信エラーが発生しました。しばらくしてから再試行してください。",
    };
  }
}
