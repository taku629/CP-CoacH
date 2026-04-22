// Client-safe AtCoder fetch functions (no next: { revalidate }, no Node.js cache)
// Called from browser — kenkoooo.com allows browser requests but blocks server IPs.
import type { AtCoderSubmission, AtCoderProblem, ProblemModel, UserStats } from "@/types";
import { estimateRating } from "./atcoder";

const BASE = "https://kenkoooo.com/atcoder";

const memCache = new Map<string, { data: unknown; expiresAt: number }>();

async function fetchCached<T>(url: string, ttlMs: number): Promise<T> {
  const hit = memCache.get(url);
  if (hit && Date.now() < hit.expiresAt) return hit.data as T;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const data: T = await res.json();
  memCache.set(url, { data, expiresAt: Date.now() + ttlMs });
  return data;
}

export async function fetchAllProblems(): Promise<AtCoderProblem[]> {
  return fetchCached<AtCoderProblem[]>(`${BASE}/resources/merged-problems.json`, 3_600_000);
}

export async function fetchProblemModels(): Promise<Record<string, ProblemModel>> {
  return fetchCached<Record<string, ProblemModel>>(`${BASE}/resources/problem-models.json`, 3_600_000);
}

export async function fetchUserSubmissions(userId: string): Promise<AtCoderSubmission[]> {
  const epochSecond = Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 180;
  const url = `${BASE}/atcoder-api/v3/user/submissions?user=${encodeURIComponent(userId)}&epoch_second=${epochSecond}`;
  const all = await fetchCached<AtCoderSubmission[]>(url, 300_000);
  const acMap = new Map<string, AtCoderSubmission>();
  for (const s of all) {
    if (s.result === "AC" && !acMap.has(s.problem_id)) acMap.set(s.problem_id, s);
  }
  return Array.from(acMap.values());
}

export type RatingResult =
  | { ok: true; rating: number | null }
  | { ok: false; reason: "not_found" | "error" };

export async function fetchUserRating(userId: string): Promise<RatingResult> {
  try {
    const res = await fetch(
      `https://atcoder.jp/users/${encodeURIComponent(userId)}/history.json`
    );
    if (res.status === 404) return { ok: false, reason: "not_found" };
    if (!res.ok) return { ok: false, reason: "error" };
    const history = (await res.json()) as { NewRating: number }[];
    if (!Array.isArray(history) || history.length === 0) return { ok: true, rating: null };
    const rating = history[history.length - 1].NewRating;
    return { ok: true, rating: typeof rating === "number" ? rating : null };
  } catch {
    return { ok: false, reason: "error" };
  }
}

export function buildAtCoderStats(
  submissions: AtCoderSubmission[],
  problemModels: Record<string, ProblemModel>,
  problemMap: Map<string, { tags?: string[] }>,
  officialRating: number | null
): {
  acDifficulties: number[];
  tagStats: Record<string, { ac: number; total: number }>;
  estimatedRating: number;
  diffDistribution: Record<string, number>;
  userStats: UserStats["atcoder"];
} {
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

  const rating = officialRating ?? estimateRating(acDifficulties);

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

  return {
    acDifficulties,
    tagStats,
    estimatedRating: rating,
    diffDistribution,
    userStats: {
      acCount: submissions.length,
      difficultyDistribution: diffDistribution,
      tagStats,
      estimatedRating: rating,
    },
  };
}
