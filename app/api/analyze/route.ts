import { NextRequest, NextResponse } from "next/server";
import type { AnalyzeRequest, AnalyzeResponse, UserStats, LeetCodeStats, AtCoderSubmission } from "@/types";
import { fetchAllProblems, fetchProblemModels, fetchUserSubmissions, fetchUserRating, estimateRating } from "@/lib/atcoder";
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

function buildAtCoderStats(
  submissions: AtCoderSubmission[],
  problemModels: Record<string, { difficulty?: number }>,
  problemMap: Map<string, { tags?: string[] }>,
  officialRating: number | null
) {
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

  // 公式レートを優先。取得できない場合のみ difficulty 分布から推定
  const estimatedRating = officialRating ?? estimateRating(acDifficulties);

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
  rating: number,
  topWeakTag: string,
  lc: LeetCodeStats
): string {
  if (acCount === 0 && lc.totalSolved === 0) {
    return "AtCoder と LeetCode のデータが見つかりませんでした。IDが正しいか、プロフィールが公開設定になっているか確認してください。";
  }
  if (acCount === 0) {
    const lcDesc = lc.easySolved / Math.max(lc.totalSolved, 1) > 0.7
      ? `Easy 中心に着実に積み上げている段階です。Medium にも挑戦していきましょう`
      : "Easy〜Medium をバランスよく進めています";
    return `AtCoder のデータは取得できませんでした。LeetCode は ${lc.totalSolved} 問解いており、${lcDesc}。LeetCode の結果をもとに診断しています。`;
  }

  const ratingDesc =
    rating < 400  ? "基礎を固めている段階" :
    rating < 800  ? "茶色帯の問題が安定してきた段階" :
    rating < 1200 ? "緑色帯に向かって成長中の段階" :
    rating < 1600 ? "水色帯として応用問題に対応できている段階" :
    rating < 2000 ? "青色帯として高難度問題にも取り組めている段階" :
    "黄色以上の上位コーダーとして活躍している段階";

  const lcPart = lc.totalSolved > 0
    ? `LeetCode は ${lc.totalSolved} 問（Easy ${lc.easySolved} / Medium ${lc.mediumSolved} / Hard ${lc.hardSolved}）。${
        lc.mediumSolved >= 50 ? "Medium を多数経験しており安定しています。" :
        lc.mediumSolved >= 20 ? "Medium も着実に積み上げています。" :
        rating >= 1200 ? "Medium の絶対数を増やすとさらに伸びしろが広がります。" :
        "Medium にも少しずつ挑戦していきましょう。"
      }`
    : "";

  return `AtCoder ${acCount} 問、レーティング ${rating}（${ratingDesc}）。${lcPart}「${topWeakTag}」をさらに伸ばすと次のステージが見えてきます。`;
}

export async function POST(req: NextRequest): Promise<NextResponse<AnalyzeResponse>> {
  try {
    const body: AnalyzeRequest = await req.json();
    const { atcoderId, leetcodeId, previousResult, doneProblems } = body;

    if (!atcoderId?.trim() && !leetcodeId?.trim()) {
      return NextResponse.json(
        { success: false, error: "AtCoder ID か LeetCode ID のどちらかを入力してください" },
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
      // 公式レートも同時取得（失敗しても問題ない）
      const [acSettled, lcSettled, ratingSettled] = await Promise.allSettled([
        atcoderId?.trim() ? fetchUserSubmissions(atcoderId.trim()) : Promise.reject("no id"),
        leetcodeId?.trim() ? fetchLeetCodeStats(leetcodeId.trim()) : Promise.reject("no id"),
        atcoderId?.trim() ? fetchUserRating(atcoderId.trim()) : Promise.resolve(null),
      ]);

      const atcoderOk = acSettled.status === "fulfilled";
      const leetcodeOk = lcSettled.status === "fulfilled";
      const officialRating = ratingSettled.status === "fulfilled" ? ratingSettled.value : null;

      if (!atcoderOk && !leetcodeOk) {
        console.warn("[analyze] Both APIs failed, falling back to mock");
        return NextResponse.json({
          success: true,
          data: { ...getMockResult(atcoderId?.trim() ?? "", leetcodeId?.trim() ?? ""), sources: { atcoder: false, leetcode: false } },
        });
      }

      if (!atcoderOk && atcoderId?.trim()) {
        console.warn("[analyze] AtCoder API failed:", (acSettled as PromiseRejectedResult).reason);
      }
      if (!leetcodeOk && leetcodeId?.trim()) {
        console.warn("[analyze] LeetCode API failed:", (lcSettled as PromiseRejectedResult).reason);
      }
      if (officialRating !== null) {
        console.info(`[analyze] Official rating for ${atcoderId}: ${officialRating}`);
      }

      const submissions = atcoderOk ? (acSettled as PromiseFulfilledResult<AtCoderSubmission[]>).value : [];
      const lcStats = leetcodeOk ? (lcSettled as PromiseFulfilledResult<LeetCodeStats>).value : EMPTY_LEETCODE;

      const problemMap = new Map(allProblems.map((p) => [p.id, p]));
      const { tagStats, estimatedRating, diffDistribution } = buildAtCoderStats(
        submissions, problemModels, problemMap, officialRating
      );

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

      const claudeOutput = await generateDiagnosis({ levelLabel, stats: userStats, weaknesses, previousResult });
      const levelDescription = claudeOutput?.diagnosisText ?? buildDiagnosisText(submissions.length, estimatedRating, topWeakTag, lcStats);
      const progressComment = claudeOutput?.progressComment ?? undefined;

      return NextResponse.json({
        success: true,
        data: { levelLabel, levelDescription, progressComment, weaknesses, nextProblems, weeklyPlan, sources: { atcoder: atcoderOk, leetcode: leetcodeOk } },
      });
    } catch (err) {
      console.warn("[analyze] Problem data fetch failed, falling back to mock:", err instanceof Error ? err.message : err);
      return NextResponse.json({
        success: true,
        data: { ...getMockResult(atcoderId?.trim() ?? "", leetcodeId?.trim() ?? ""), sources: { atcoder: false, leetcode: false } },
      });
    }
  } catch (err) {
    console.error("[analyze]", err);
    return NextResponse.json({ success: false, error: "分析中にエラーが発生しました" }, { status: 500 });
  }
}
