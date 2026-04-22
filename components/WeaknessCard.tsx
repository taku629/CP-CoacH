"use client";
import type { Weakness } from "@/types";

const priorityColor: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-gray-100 text-gray-600",
};

const priorityLabel: Record<string, string> = {
  high: "要強化",
  medium: "要練習",
  low: "余裕があれば",
};

export function WeaknessCard({ weaknesses }: { weaknesses: Weakness[] }) {
  return (
    <div className="bg-white rounded-2xl shadow p-6 border border-gray-100">
      <h2 className="text-lg font-bold text-gray-800 mb-4">弱点分野</h2>
      <ul className="space-y-3">
        {weaknesses.map((w, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-0.5 shrink-0 ${priorityColor[w.priority]}`}>
              {priorityLabel[w.priority]}
            </span>
            <div>
              <p className="font-semibold text-sm text-gray-800">{w.tag}</p>
              <p className="text-xs text-gray-500">{w.reason}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
