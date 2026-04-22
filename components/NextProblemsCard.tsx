"use client";
import { useState, useEffect } from "react";
import type { NextProblem, ProblemStatus } from "@/types";
import { getAllProblemStatuses, markProblemStatus, unmarkProblem } from "@/lib/storage";

const siteColor: Record<string, string> = {
  atcoder: "bg-blue-100 text-blue-700",
  leetcode: "bg-orange-100 text-orange-700",
};

const statusBadge: Record<ProblemStatus, string> = {
  done: "bg-green-100 text-green-700",
  skipped: "bg-gray-100 text-gray-500",
};

const statusLabel: Record<ProblemStatus, string> = {
  done: "解いた ✓",
  skipped: "スキップ",
};

export function NextProblemsCard({ problems }: { problems: NextProblem[] }) {
  const [statuses, setStatuses] = useState<Record<string, ProblemStatus>>({});

  useEffect(() => {
    setStatuses(getAllProblemStatuses());
  }, []);

  function toggle(problemId: string, status: ProblemStatus) {
    const current = statuses[problemId];
    if (current === status) {
      // 同じボタンを押したら解除
      unmarkProblem(problemId);
      setStatuses((prev) => {
        const next = { ...prev };
        delete next[problemId];
        return next;
      });
    } else {
      markProblemStatus(problemId, status);
      setStatuses((prev) => ({ ...prev, [problemId]: status }));
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow p-6 border border-gray-100">
      <h2 className="text-lg font-bold text-gray-800 mb-4">次に解くべき5問</h2>
      <ol className="space-y-4">
        {problems.map((p, i) => {
          const status = statuses[p.problemId];
          return (
            <li key={i} className={`flex gap-3 ${status === "done" ? "opacity-60" : ""}`}>
              <span className="text-2xl font-bold text-gray-200 w-6 shrink-0 text-center leading-tight">{i + 1}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${siteColor[p.site]}`}>
                    {p.site === "atcoder" ? "AtCoder" : "LeetCode"}
                  </span>
                  <span className="text-xs text-gray-400">{p.difficulty}</span>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{p.tag}</span>
                  {status && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusBadge[status]}`}>
                      {statusLabel[status]}
                    </span>
                  )}
                </div>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-sm text-indigo-600 hover:underline"
                >
                  {p.title}
                </a>
                <p className="text-xs text-gray-500 mt-0.5">{p.reason}</p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => toggle(p.problemId, "done")}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                      status === "done"
                        ? "bg-green-100 border-green-200 text-green-700 font-semibold"
                        : "border-gray-200 text-gray-400 hover:border-green-300 hover:text-green-600"
                    }`}
                  >
                    解いた
                  </button>
                  <button
                    onClick={() => toggle(p.problemId, "skipped")}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                      status === "skipped"
                        ? "bg-gray-100 border-gray-300 text-gray-600 font-semibold"
                        : "border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-500"
                    }`}
                  >
                    スキップ
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
