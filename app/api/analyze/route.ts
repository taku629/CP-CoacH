import { NextRequest, NextResponse } from "next/server";
import type { AnalyzeRequest, AnalyzeResponse, UserStats, LeetCodeStats, AtCoderSubmission } from "@/types";
import { fetchAllProblems, fetchProblemModels, fetchUserSubmissions, estimateRating } from "@/lib/atcoder";
import { fetchLeetCodeStats } from "@/lib/leetcode";
import { detectWeaknesses, selectNextProblems, generateWeeklyPlan, diagnosisLabel } from "@/lib/coach";
import { generateDiagnosis } from "@/lib/claude";
import { getMockResult } from "@/lib/mock-data";

const EMPTY_LEETCODE: LeetCodeStats = {
  totalSolved: 0,
  easySolved: 0,
  mediumSolved: 0,
  hardSolved: 0,
  recentSubmissions: [],
  tagStats: [],
};

function buildAtCoderStats(submissions: AtCoderSubmission[], problemModels: Record<string, { difficulty?: number }>, problemMap: Map<string, { tags?: string[] }>) {
  const acDifficulties: number[] = [];
  const tagStats: Record<string, { ac: number; total: number }> = {};

  for (const sub of submissions) {
    const model = problemModels[sub.problem_id];
    if (model?.difficulty != null) acDifficulties.push(model.difficulty);
    for (const tag of problemMap.get(sub.problem_id)?.tags ?? []) {
      if (!tagStats[tag]) tagStats[tag] = { ac: 0, total: 0 };
      tagStats[tag].ac++;
      tagStats[tag].total++;
    }
  }

  const estimatedRating = estimateRating(acDifficulties);

  const diffBands = ["〜400", "400〜800", "800〜1200", "1200〜1600", "1600〜2000", "2000+"];
  const diffDistribution: Record<string, number> = Object.fromEntries(diffBands.map((b) => [b, 0]));
  for (const d of acDifficulties) {
    if (d < 400) diffDistribution["〜400"]++;
    else if (d < 800) diffDistribution["400〜800"]++;
    else if (d < 1200) diffDistribution["800〜1200"]++;
    else if (d < 1600) diffDistribution["1200〜1600"]++;
    else if (d < 2000) diffDistribution["1600〜2000"]++;
    else diffDistribution["2000+"]++;
  }

  return { acDifficulties, tagStats, estimatedRating, diffDistribution };
}

function buildDiagnosisText(
  acCount: number,
  estimatedRating: number,
  topWeakTag: string,
  lc: LeetCodeStats
): string {
  if (acCount === 0 && lc.totalSolved === 0) {
    return "AtCoder と LeetCode のデータが見つかりませんでした。IDが正しいか、プロフィールが公開設定になっているか確認してください。";
  }
  if (acCount === 0) {
    const lcDesc = lc.easySolved / Math.max(lc.totalSolved, 1) > 0.7
      ? `Easy 偏重（${Math.round(lc.easySolved / lc.totalSolved * 100)}%）なので Medium を増やしたい段階`
      : "Easy〜Medium バランスよく進めている段階";
    return `AtCoder のデータは取得できませんでした。LeetCode は ${lc.totalSolved} 問解いており、${lcDesc}です。LeetCode の結果をもとに診断しています。`;
  }

  const ratingDesc =
    estimatedRating < 400 ? "基礎を固めている段階" :
    estimatedRating < 800 ? "茶色レベルの問題が安定してきた段階" :
    estimatedRating < 1200 ? "緑色レベルに向かって成長中の段階" :
    estimatedRating < 1600 ? "水色レベルの応用問題に挑戦できる段階" :
    "青色以上の高難度問題にも対応できる段階";

  const lcPart = lc.totalSolved > 0
    ? `LeetCode は ${lc.totalSolved} 問（Easy ${lc.easySolved} / Medium ${lc.mediumSolved} / Hard ${lc.hardSolved}）。${
        lc.easySolved / lc.totalSolved > 0.7
          ? "Easy 偏重なので Medium を増やしていきましょう。"
          : lc.mediumSolved > 50
          ? "Medium 以上を多数解いており順調です。"
          : "Easy〜Medium のバランスで進めています。"
      }`
    : "LeetCode データは取得できませんでした。";

  return `AtCoder ${acCount} 問、推定レーティング ${estimatedRating}（${ratingDesc}）。${lcPart}特に「${topWeakTag}」の補強が次のステップアップにつながります。`;
}

export async function POST(req: NextRequest): Promise<NextResponse<AnalyzeResponse>> {
  try {
    const body: AnalyzeRequest = await req.json();
    const { atcoderId, leetcodeId, previousResult, doneProblems } = body;

    if (!atcoderId?.trim() || !leetcodeId?.trim()) {
      return NextResponse.json(
        { success: false, error: "AtCoder ID と LeetCode ID を入力してください" },
        { status: 400 }
      );
    }

    try {
      // 問題データ（共通・キャッシュ済み）を先に取得
      const [allProblems, problemModels] = await Promise.all([
        fetchAllProblems(),
        fetchProblemModels(),
      ]);

      // AtCoder / LeetCode のユーザーデータを並列で取得
      // allSettled で片側失敗でも止まらないようにする
      const [acSettled, lcSettled] = await Promise.allSettled([
        fetchUserSubmissions(atcoderId.trim()),
        fetchLeetCodeStats(leetcodeId.trim()),
      ]);

      const atcoderOk = acSettled.status === "fulfilled";
      const leetcodeOk = lcSettled.status === "fulfilled";

      if (!atcoderOk && !leetcodeOk) {
        // 両方失敗 → モックにフォールバック
        console.warn("[analyze] Both APIs failed, falling back to mock");
        return NextResponse.json({
          success: true,
          data: { ...getMockResult(atcoderId.trim(), leetcodeId.trim()), sources: { atcoder: false, leetcode: false } },
        });
      }

      if (!atcoderOk) {
        console.warn("[analyze] AtCoder API failed:", (acSettled as PromiseRejectedResult).reason);
      }
      if (!leetcodeOk) {
        console.warn("[analyze] LeetCode API failed:", (lcSettled as PromiseRejectedResult).reason);
      }

      const submissions = atcoderOk ? (acSettled as PromiseFulfilledResult<ReturnType<typeof fetchUserSubmissions> extends Promise<infer T> ? T : never>).value : [];
      const lcStats = leetcodeOk ? (lcSettled as PromiseFulfilledResult<LeetCodeStats>).value : EMPTY_LEETCODE;

      const problemMap = new Map(allProblems.map((p) => [p.id, p]));
      const { tagStats, estimatedRating, diffDistribution } = buildAtCoderStats(submissions, problemModels, problemMap);

      const userStats: UserStats = {
        atcoder: {
          acCount: submissions.length,
          difficultyDistribution: diffDistribution,
          tagStats,
          estimatedRating,
        },
        leetcode: lcStats,
      };

      const problemsWithDiff = allProblems.map((p) => ({
        ...p,
        difficulty: problemModels[p.id]?.difficulty ?? p.difficulty,
      }));

      const acSet = new Set(submissions.map((s) => s.problem_id));
      const doneSet = new Set(doneProblems ?? []);
      const weaknesses = detectWeaknesses(userStats);
      const nextProblems = selectNextProblems(userStats, problemsWithDiff, acSet, weaknesses, doneSet);
      const weeklyPlan = generateWeeklyPlan(userStats, weaknesses);
      const levelLabel = diagnosisLabel(estimatedRating, lcStats);
      const topWeakTag = weaknesses[0]?.tag ?? "dp";

      // Claude API で診断文を生成（失敗時はルールベースにフォールバック）
      const claudeOutput = await generateDiagnosis({ levelLabel, stats: userStats, weaknesses, previousResult });
      const levelDescription = claudeOutput?.diagnosisText ?? buildDiagnosisText(submissions.length, estimatedRating, topWeakTag, lcStats);
      const progressComment = claudeOutput?.progressComment ?? undefined;

      return NextResponse.json({
        success: true,
        data: { levelLabel, levelDescription, progressComment, weaknesses, nextProblems, weeklyPlan, sources: { atcoder: atcoderOk, leetcode: leetcodeOk } },
      });
    } catch (err) {
      // fetchAllProblems / fetchProblemModels の失敗 → モックにフォールバック
      console.warn("[analyze] Problem data fetch failed, falling back to mock:", err instanceof Error ? err.message : err);
      return NextResponse.json({
        success: true,
        data: { ...getMockResult(atcoderId.trim(), leetcodeId.trim()), sources: { atcoder: false, leetcode: false } },
      });
    }
  } catch (err) {
    console.error("[analyze]", err);
    return NextResponse.json({ success: false, error: "分析中にエラーが発生しました" }, { status: 500 });
  }
}
