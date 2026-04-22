import type { LeetCodeStats, LeetCodeSubmission, TagStat } from "@/types";
import { cacheGet, cacheSet, LEETCODE_TTL } from "./cache";

const GRAPHQL_URL = "https://leetcode.com/graphql";

async function lcQuery<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "cp-coach-app/1.0",
      // LeetCode の CSRF はブラウザ向けなので、公開データは不要
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`LeetCode API error: ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(`LeetCode GraphQL error: ${JSON.stringify(json.errors)}`);
  return json.data as T;
}

// ユーザーの統計情報
export async function fetchLeetCodeStats(username: string): Promise<LeetCodeStats> {
  const cacheKey = `leetcode:stats:${username}`;
  const cached = cacheGet<LeetCodeStats>(cacheKey);
  if (cached) return cached;

  // 統計 + タグ別 + 最近の提出を1クエリにまとめる
  const query = `
    query getUserStats($username: String!) {
      matchedUser(username: $username) {
        submitStats: submitStatsGlobal {
          acSubmissionNum {
            difficulty
            count
          }
        }
        tagProblemCounts {
          advanced {
            tagName
            tagSlug
            problemsSolved
          }
          intermediate {
            tagName
            tagSlug
            problemsSolved
          }
          fundamental {
            tagName
            tagSlug
            problemsSolved
          }
        }
      }
      recentAcSubmissionList(username: $username, limit: 20) {
        title
        titleSlug
        timestamp
        statusDisplay
        lang
      }
    }
  `;

  const data = await lcQuery<{
    matchedUser: {
      submitStats: { acSubmissionNum: { difficulty: string; count: number }[] };
      tagProblemCounts: {
        advanced: TagStat[];
        intermediate: TagStat[];
        fundamental: TagStat[];
      };
    };
    recentAcSubmissionList: LeetCodeSubmission[];
  }>(query, { username });

  if (!data.matchedUser) {
    throw new Error(`LeetCode user "${username}" not found`);
  }

  const acStats = data.matchedUser.submitStats.acSubmissionNum;
  const getCount = (diff: string) => acStats.find((s) => s.difficulty === diff)?.count ?? 0;

  const allTags: TagStat[] = [
    ...data.matchedUser.tagProblemCounts.fundamental,
    ...data.matchedUser.tagProblemCounts.intermediate,
    ...data.matchedUser.tagProblemCounts.advanced,
  ]
    .filter((t) => t.problemsSolved > 0)
    .sort((a, b) => b.problemsSolved - a.problemsSolved);

  const stats: LeetCodeStats = {
    totalSolved: getCount("All"),
    easySolved: getCount("Easy"),
    mediumSolved: getCount("Medium"),
    hardSolved: getCount("Hard"),
    recentSubmissions: data.recentAcSubmissionList ?? [],
    tagStats: allTags,
  };

  cacheSet(cacheKey, stats, LEETCODE_TTL);
  return stats;
}
