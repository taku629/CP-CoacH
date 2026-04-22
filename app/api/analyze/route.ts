import { NextRequest, NextResponse } from "next/server";
import type { AnalyzeRequest, AnalyzeResponse, UserStats, LeetCodeStats } from "@/types";
import { fetchLeetCodeStats } from "@/lib/leetcode";
import { detectWeaknesses, generateWeeklyPlan, diagnosisLabel } from "@/lib/coach";
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

export async function POST(req: NextRequest): Promise<NextResponse<AnalyzeResponse>> {
  try {
    const body: AnalyzeRequest = await req.json();
    const { atcoderId, leetcodeId, previousResult, atcoderPrecomputed } = body;

    if (!atcoderPrecomputed && !leetcodeId?.trim()) {
      return NextResponse.json(
        { success: false, error: "AtCoder ID か LeetCode ID のどちらかを入力してください" },
        { status: 400 }
      );
    }

    // --- LeetCode fetch (server-side, CORS blocked in browser) ---
    let lcStats = EMPTY_LEETCODE;
    let leetcodeOk = false;
    if (leetcodeId?.trim()) {
      try {
        lcStats = await fetchLeetCodeStats(leetcodeId.trim());
        leetcodeOk = true;
      } catch (err) {
        console.warn("[analyze] LeetCode API failed:", err instanceof Error ? err.message : err);
      }
    }

    // --- No AtCoder precomputed data: fall back to mock ---
    if (!atcoderPrecomputed) {
      if (!leetcodeOk) {
        console.warn("[analyze] No AtCoder precomputed and LeetCode failed, using mock");
        return NextResponse.json({
          success: true,
          data: { ...getMockResult(atcoderId ?? "", leetcodeId ?? ""), sources: { atcoder: false, leetcode: false } },
        });
      }
      // LeetCode-only path
      const userStats: UserStats = {
        atcoder: { acCount: 0, difficultyDistribution: {}, tagStats: {}, estimatedRating: 0 },
        leetcode: lcStats,
      };
      const weaknesses = detectWeaknesses(userStats);
      const weeklyPlan = generateWeeklyPlan(userStats, weaknesses);
      const label = diagnosisLabel(0, lcStats);
      const claudeOut = await generateDiagnosis({ levelLabel: label, stats: userStats, weaknesses, previousResult });
      return NextResponse.json({
        success: true,
        data: {
          levelLabel: label,
          levelDescription: claudeOut?.diagnosisText ?? `LeetCode は ${lcStats.totalSolved} 問解いています。`,
          progressComment: claudeOut?.progressComment ?? undefined,
          weaknesses,
          nextProblems: [],
          weeklyPlan,
          sources: { atcoder: false, leetcode: true },
        },
      });
    }

    // --- Merge AtCoder precomputed + LeetCode ---
    const userStats: UserStats = {
      atcoder: atcoderPrecomputed.atcoderUserStats,
      leetcode: lcStats,
    };

    // Re-run weaknesses and label with full stats (LeetCode data now included)
    const weaknesses = detectWeaknesses(userStats);
    const levelLabel = diagnosisLabel(atcoderPrecomputed.atcoderUserStats.estimatedRating, lcStats);

    const claudeOut = await generateDiagnosis({ levelLabel, stats: userStats, weaknesses, previousResult });

    const levelDescription = claudeOut?.diagnosisText ?? buildFallbackDescription(
      atcoderPrecomputed.atcoderUserStats.acCount,
      atcoderPrecomputed.atcoderUserStats.estimatedRating,
      weaknesses[0]?.tag ?? "dp",
      lcStats,
      atcoderPrecomputed.ratingNotFound
    );

    return NextResponse.json({
      success: true,
      data: {
        levelLabel,
        levelDescription,
        progressComment: claudeOut?.progressComment ?? undefined,
        weaknesses,
        nextProblems: atcoderPrecomputed.nextProblems,
        weeklyPlan: atcoderPrecomputed.weeklyPlan,
        sources: { atcoder: true, leetcode: leetcodeOk },
      },
    });
  } catch (err) {
    console.error("[analyze]", err);
    return NextResponse.json({ success: false, error: "分析中にエラーが発生しました" }, { status: 500 });
  }
}

function buildFallbackDescription(
  acCount: number,
  rating: number,
  topWeakTag: string,
  lc: LeetCodeStats,
  ratingNotFound: boolean
): string {
  if (acCount === 0 && lc.totalSolved === 0) {
    return "AtCoder と LeetCode のデータが見つかりませんでした。IDが正しいか、プロフィールが公開設定になっているか確認してください。";
  }
  if (acCount === 0) {
    return `AtCoder のデータは取得できませんでした。LeetCode は ${lc.totalSolved} 問解いています。LeetCode の結果をもとに診断しています。`;
  }

  const ratingNote = ratingNotFound ? `（推定 ${rating}）` : `${rating}`;
  const ratingDesc =
    rating < 400  ? "基礎を固めている段階" :
    rating < 800  ? "茶色帯の問題が安定してきた段階" :
    rating < 1200 ? "緑色帯に向かって成長中の段階" :
    rating < 1600 ? "水色帯として応用問題に対応できている段階" :
    rating < 2000 ? "青色帯として高難度問題にも取り組めている段階" :
    "黄色以上の上位コーダーとして活躍している段階";

  const lcPart = lc.totalSolved > 0
    ? ` LeetCode は ${lc.totalSolved} 問（Easy ${lc.easySolved} / Medium ${lc.mediumSolved} / Hard ${lc.hardSolved}）。`
    : "";

  return `AtCoder ${acCount} 問、レーティング ${ratingNote}（${ratingDesc}）。${lcPart}「${topWeakTag}」をさらに伸ばすと次のステージが見えてきます。`;
}
