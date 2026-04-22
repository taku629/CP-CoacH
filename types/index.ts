// AtCoder Problems API types
export interface AtCoderSubmission {
  id: number;
  epoch_second: number;
  problem_id: string;
  contest_id: string;
  user_id: string;
  language: string;
  point: number;
  length: number;
  result: string; // "AC", "WA", "TLE", ...
  execution_time: number;
}

export interface AtCoderProblem {
  id: string;
  contest_id: string;
  problem_index: string;
  name: string;
  title: string;
  shortest_submission_id: number;
  fastest_submission_id: number;
  first_ac_submission_id: number;
  source_url: string;
  // merged-problems fields
  difficulty?: number; // internal rating
  is_experimental?: boolean;
  tags?: string[];
  point?: number;
  predict?: number;
  solver_count?: number;
}

export interface ProblemModel {
  slope?: number;
  intercept?: number;
  variance?: number;
  difficulty?: number;
  discrimination?: number;
  irt_loglikelihood?: number;
  irt_users?: number;
  is_experimental?: boolean;
}

// LeetCode types
export interface LeetCodeStats {
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  recentSubmissions: LeetCodeSubmission[];
  tagStats: TagStat[];
}

export interface LeetCodeSubmission {
  title: string;
  titleSlug: string;
  timestamp: string;
  statusDisplay: string;
  lang: string;
}

export interface TagStat {
  tagName: string;
  tagSlug: string;
  problemsSolved: number;
}

// Coach analysis types
export interface UserStats {
  atcoder: {
    acCount: number;
    difficultyDistribution: Record<string, number>; // "0-400", "400-800", ...
    tagStats: Record<string, { ac: number; total: number }>;
    estimatedRating: number;
  };
  leetcode: LeetCodeStats;
}

export interface DiagnosisResult {
  levelLabel: string;
  levelDescription: string;
  progressComment?: string;
  weaknesses: Weakness[];
  nextProblems: NextProblem[];
  weeklyPlan: WeeklyPlan;
  sources?: { atcoder: boolean; leetcode: boolean };
}

export interface DiagnosisHistory {
  id: string;
  timestamp: number;
  atcoderId: string;
  leetcodeId: string;
  result: DiagnosisResult;
}

export interface Weakness {
  tag: string;
  reason: string;
  priority: "high" | "medium" | "low";
}

export interface NextProblem {
  site: "atcoder" | "leetcode";
  problemId: string;
  title: string;
  url: string;
  difficulty: string;
  tag: string;
  reason: string;
}

export interface WeeklyPlan {
  goal: string;
  advice: string;
  days: DayPlan[];
}

export interface DayPlan {
  day: string; // "月曜日"
  tasks: Task[];
}

export interface Task {
  site: "atcoder" | "leetcode";
  count: number;
  difficulty: string;
  tag: string;
  description: string;
}

export type ProblemStatus = "done" | "skipped";

export interface AnalyzeRequest {
  atcoderId: string;
  leetcodeId: string;
  previousResult?: DiagnosisResult;
  doneProblems?: string[];
}

export interface AnalyzeResponse {
  success: boolean;
  data?: DiagnosisResult;
  error?: string;
}
