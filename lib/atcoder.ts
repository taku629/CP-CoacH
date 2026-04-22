import type { AtCoderSubmission, AtCoderProblem, ProblemModel } from "@/types";
import { cacheGet, cacheSet, PROBLEMS_TTL, SUBMISSIONS_TTL } from "./cache";

const BASE = "https://kenkoooo.com/atcoder";

async function fetchJSON<T>(url: string, cacheKey: string, ttl: number): Promise<T> {
  const cached = cacheGet<T>(cacheKey);
  if (cached) return cached;

  const res = await fetch(url, {
    headers: { "User-Agent": "cp-coach-app/1.0 (educational tool)" },
    next: { revalidate: ttl },
  });
  if (!res.ok) throw new Error(`AtCoder API error: ${res.status} ${url}`);
  const data: T = await res.json();
  cacheSet(cacheKey, data, ttl);
  return data;
}

// 全問題情報（難易度・タグ付き）
export async function fetchAllProblems(): Promise<AtCoderProblem[]> {
  return fetchJSON<AtCoderProblem[]>(
    `${BASE}/resources/merged-problems.json`,
    "atcoder:merged-problems",
    PROBLEMS_TTL
  );
}

// 問題の難易度モデル
export async function fetchProblemModels(): Promise<Record<string, ProblemModel>> {
  return fetchJSON<Record<string, ProblemModel>>(
    `${BASE}/resources/problem-models.json`,
    "atcoder:problem-models",
    PROBLEMS_TTL
  );
}

// ユーザーの提出一覧（ACのみ、最新500件）
export async function fetchUserSubmissions(userId: string): Promise<AtCoderSubmission[]> {
  // epoch_second=0 で全件取得、実際は最新を優先
  const epochSecond = Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 180; // 180日分
  const url = `${BASE}/atcoder-api/v3/user/submissions?user=${encodeURIComponent(userId)}&epoch_second=${epochSecond}`;
  const all = await fetchJSON<AtCoderSubmission[]>(
    url,
    `atcoder:submissions:${userId}`,
    SUBMISSIONS_TTL
  );
  // ACのみ抽出、重複問題は最初のACだけ残す
  const acMap = new Map<string, AtCoderSubmission>();
  for (const s of all) {
    if (s.result === "AC" && !acMap.has(s.problem_id)) {
      acMap.set(s.problem_id, s);
    }
  }
  return Array.from(acMap.values());
}

// ユーザーが解いた問題IDセット（弱点分析用）
export async function fetchUserAcSet(userId: string): Promise<Set<string>> {
  const subs = await fetchUserSubmissions(userId);
  return new Set(subs.map((s) => s.problem_id));
}

// 難易度帯のラベル
export function difficultyLabel(diff: number): string {
  if (diff < 400) return "灰 (〜400)";
  if (diff < 800) return "茶 (400〜800)";
  if (diff < 1200) return "緑 (800〜1200)";
  if (diff < 1600) return "水 (1200〜1600)";
  if (diff < 2000) return "青 (1600〜2000)";
  if (diff < 2400) return "黄 (2000〜2400)";
  return "橙以上 (2400+)";
}

// AtCoder の難易度からざっくりレーティングを推定
// ACした問題の難易度の75パーセンタイル付近を「実力の目安」とする
export function estimateRating(acProblemsWithDifficulty: number[]): number {
  if (acProblemsWithDifficulty.length === 0) return 0;
  const sorted = [...acProblemsWithDifficulty].sort((a, b) => a - b);
  const idx = Math.floor(sorted.length * 0.75);
  return sorted[Math.min(idx, sorted.length - 1)];
}
