import type { DiagnosisHistory, DiagnosisResult, ProblemStatus } from "@/types";

const HISTORY_KEY = "cpcoach_history";
const MAX_HISTORY = 8;

export function loadHistory(): DiagnosisHistory[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as DiagnosisHistory[];
  } catch {
    return [];
  }
}

export function saveToHistory(
  atcoderId: string,
  leetcodeId: string,
  result: DiagnosisResult
): DiagnosisHistory[] {
  const history = loadHistory();
  const entry: DiagnosisHistory = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: Date.now(),
    atcoderId,
    leetcodeId,
    result,
  };
  const next = [entry, ...history].slice(0, MAX_HISTORY);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    // localStorage が使えない環境（プライベートブラウズ等）は無視
  }
  return next;
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    // ignore
  }
}

// ────────────────────────────────────────────────
// 推薦問題のステータス管理（done / skipped）
// ────────────────────────────────────────────────
const PROBLEM_STATUS_KEY = "cpcoach_problem_status";

export function getAllProblemStatuses(): Record<string, ProblemStatus> {
  try {
    const raw = localStorage.getItem(PROBLEM_STATUS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, ProblemStatus>) : {};
  } catch {
    return {};
  }
}

export function getProblemStatus(problemId: string): ProblemStatus | null {
  const all = getAllProblemStatuses();
  return all[problemId] ?? null;
}

export function markProblemStatus(problemId: string, status: ProblemStatus): void {
  const all = getAllProblemStatuses();
  all[problemId] = status;
  try {
    localStorage.setItem(PROBLEM_STATUS_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}

export function unmarkProblem(problemId: string): void {
  const all = getAllProblemStatuses();
  delete all[problemId];
  try {
    localStorage.setItem(PROBLEM_STATUS_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}

export function getDoneProblems(): string[] {
  const all = getAllProblemStatuses();
  return Object.entries(all).filter(([, v]) => v === "done").map(([k]) => k);
}

// 弱点タグの差分を計算して返す
export function compareWeaknesses(
  prev: DiagnosisHistory["result"]["weaknesses"],
  curr: DiagnosisHistory["result"]["weaknesses"]
): { added: string[]; removed: string[]; kept: string[] } {
  const prevTags = new Set(prev.map((w) => w.tag));
  const currTags = new Set(curr.map((w) => w.tag));
  return {
    added: [...currTags].filter((t) => !prevTags.has(t)),
    removed: [...prevTags].filter((t) => !currTags.has(t)),
    kept: [...currTags].filter((t) => prevTags.has(t)),
  };
}
