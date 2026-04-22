"use client";
import type { DiagnosisResult } from "@/types";

export function DiagnosisCard({ data }: { data: DiagnosisResult }) {
  return (
    <div className="bg-white rounded-2xl shadow p-6 border border-gray-100 space-y-3">
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-1">現在の実力診断</h2>
        <p className="text-sm font-semibold text-indigo-600 mb-3">{data.levelLabel}</p>
        <p className="text-gray-700 leading-relaxed text-sm">{data.levelDescription}</p>
      </div>

      {data.progressComment && (
        <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3">
          <p className="text-xs font-semibold text-green-700 mb-1">前回からの変化</p>
          <p className="text-sm text-green-800 leading-relaxed">{data.progressComment}</p>
        </div>
      )}
    </div>
  );
}
