import Anthropic from "@anthropic-ai/sdk";
import type { UserStats, Weakness, DiagnosisResult } from "@/types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface DiagnosisOutput {
  diagnosisText: string;
  progressComment: string | null;
}

function buildPrompt(
  levelLabel: string,
  stats: UserStats,
  weaknesses: Weakness[],
  previousResult?: DiagnosisResult
): string {
  const weakList = weaknesses
    .slice(0, 4)
    .map((w) => `- ${w.tag}: ${w.reason}`)
    .join("\n");

  const prevSection = previousResult
    ? `## 前回の診断との差分
前回のレベル: ${previousResult.levelLabel}
前回の主な弱点: ${previousResult.weaknesses.slice(0, 3).map((w) => w.tag).join(", ")}
→ 今回新たに出た弱点: ${weaknesses.filter((w) => !previousResult.weaknesses.some((p) => p.tag === w.tag)).map((w) => w.tag).join(", ") || "なし"}
→ 今回消えた弱点: ${previousResult.weaknesses.filter((p) => !weaknesses.some((w) => w.tag === p.tag)).map((p) => p.tag).join(", ") || "なし"}`
    : "";

  return `あなたは競技プログラミングのコーチです。以下のデータをもとに、JSON形式で2つのテキストを生成してください。

## 現在のデータ
レベル判定: ${levelLabel}
AtCoder AC数: ${stats.atcoder.acCount}問 / 推定レーティング: ${stats.atcoder.estimatedRating}
LeetCode: Easy ${stats.leetcode.easySolved} / Medium ${stats.leetcode.mediumSolved} / Hard ${stats.leetcode.hardSolved}
主な弱点:
${weakList}

${prevSection}

## 出力仕様
必ず次のJSON形式だけを返してください（説明文は不要）:
{
  "diagnosis": "今の状態・良いところ・伸ばしたいところの3要素を含む、励ましのある診断コメント（150〜200字、箇条書き不可）",
  "progress": ${previousResult ? '"前回との変化を踏まえた短いコメント（80字以内）"' : "null"}
}`.trim();
}

export async function generateDiagnosis(params: {
  levelLabel: string;
  stats: UserStats;
  weaknesses: Weakness[];
  previousResult?: DiagnosisResult;
}): Promise<DiagnosisOutput | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const message = await client.messages.create(
      {
        model: "claude-sonnet-4-6",
        max_tokens: 500,
        messages: [
          { role: "user", content: buildPrompt(params.levelLabel, params.stats, params.weaknesses, params.previousResult) },
        ],
      },
      { signal: controller.signal }
    );

    const raw = message.content[0];
    if (raw.type !== "text") return null;

    // JSON部分だけ抽出（前後の余分なテキストに対応）
    const jsonMatch = raw.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]) as { diagnosis?: string; progress?: string | null };
    if (!parsed.diagnosis) return null;

    return {
      diagnosisText: parsed.diagnosis,
      progressComment: parsed.progress ?? null,
    };
  } catch (err) {
    const name = err instanceof Error ? err.name : "";
    if (name !== "AbortError") {
      console.warn("[claude] generateDiagnosis failed:", err instanceof Error ? err.message : err);
    }
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
