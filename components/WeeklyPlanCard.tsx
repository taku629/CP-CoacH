"use client";
import type { WeeklyPlan } from "@/types";

const siteColor: Record<string, string> = {
  atcoder: "text-blue-600",
  leetcode: "text-orange-500",
};

export function WeeklyPlanCard({ plan }: { plan: WeeklyPlan }) {
  return (
    <div className="bg-white rounded-2xl shadow p-6 border border-gray-100">
      <h2 className="text-lg font-bold text-gray-800 mb-2">1週間の練習プラン</h2>
      <div className="bg-indigo-50 rounded-xl p-4 mb-4">
        <p className="text-sm font-semibold text-indigo-700">{plan.goal}</p>
        <p className="text-xs text-indigo-500 mt-1">{plan.advice}</p>
      </div>
      <div className="space-y-3">
        {plan.days.map((day, i) => (
          <div key={i} className="flex gap-3">
            <span className="w-16 shrink-0 text-xs font-semibold text-gray-500 pt-0.5">{day.day}</span>
            <div className="flex-1 space-y-1">
              {day.tasks.map((task, j) => (
                <div key={j} className="text-sm text-gray-700">
                  {task.count > 0 && (
                    <span className={`font-semibold ${siteColor[task.site]}`}>
                      {task.site === "atcoder" ? "AtCoder" : "LeetCode"} {task.count}問
                    </span>
                  )}
                  <span className="text-gray-500 ml-1 text-xs">{task.description}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
