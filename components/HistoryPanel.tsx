"use client";
import type { DiagnosisHistory, DiagnosisResult } from "@/types";
import { compareWeaknesses } from "@/lib/storage";

// ────────────────────────────────────────────────
// 前回比較サマリーカード
// ────────────────────────────────────────────────
export function ComparisonCard({
  prev,
  curr,
}: {
  prev: DiagnosisHistory;
  curr: DiagnosisResult;
}) {
  const diff = compareWeaknesses(prev.result.weaknesses, curr.weaknesses);

  const prevAc = prev.result.sources?.atcoder;
  const prevLc = prev.result.sources?.leetcode;
  const currAc = curr.sources?.atcoder;
  const currLc = curr.sources?.leetcode;

  const sourceChanged =
    prevAc !== currAc || prevLc !== currLc;

  const prevDate = new Date(prev.timestamp).toLocaleDateString("ja-JP", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const hasDiff = diff.added.length > 0 || diff.removed.length > 0 || sourceChanged;

  return (
    <div className="bg-white rounded-2xl shadow p-6 border border-gray-100">
      <h2 className="text-lg font-bold text-gray-800 mb-1">前回との比較</h2>
      <p className="text-xs text-gray-400 mb-4">前回: {prevDate}（{prev.atcoderId} / {prev.leetcodeId}）</p>

      {!hasDiff ? (
        <p className="text-sm text-gray-500">前回と診断内容に大きな変化はありませんでした。</p>
      ) : (
        <div className="space-y-3">
          {/* 弱点タグの変化 */}
          {diff.added.length > 0 && (
            <div className="flex gap-2 flex-wrap items-start">
              <span className="text-xs font-semibold text-red-600 mt-0.5 shrink-0">新たな弱点</span>
              <div className="flex gap-1 flex-wrap">
                {diff.added.map((tag) => (
                  <span key={tag} className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">{tag}</span>
                ))}
              </div>
            </div>
          )}
          {diff.removed.length > 0 && (
            <div className="flex gap-2 flex-wrap items-start">
              <span className="text-xs font-semibold text-green-600 mt-0.5 shrink-0">克服した弱点</span>
              <div className="flex gap-1 flex-wrap">
                {diff.removed.map((tag) => (
                  <span key={tag} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{tag}</span>
                ))}
              </div>
            </div>
          )}
          {diff.kept.length > 0 && (
            <div className="flex gap-2 flex-wrap items-start">
              <span className="text-xs font-semibold text-gray-400 mt-0.5 shrink-0">引き続き要強化</span>
              <div className="flex gap-1 flex-wrap">
                {diff.kept.map((tag) => (
                  <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{tag}</span>
                ))}
              </div>
            </div>
          )}

          {/* 接続ソースの変化 */}
          {sourceChanged && (
            <div className="text-xs text-gray-500 border-t pt-2 mt-2">
              接続状況が変わりました:{" "}
              {currAc && !prevAc && <span className="text-green-600 font-semibold">AtCoder が新たに接続</span>}
              {currLc && !prevLc && <span className="text-orange-500 font-semibold ml-1">LeetCode が新たに接続</span>}
              {!currAc && prevAc && <span className="text-red-400 font-semibold">AtCoder が取得不可に</span>}
              {!currLc && prevLc && <span className="text-red-400 font-semibold ml-1">LeetCode が取得不可に</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────
// 履歴一覧パネル
// ────────────────────────────────────────────────
export function HistoryPanel({
  history,
  onClear,
}: {
  history: DiagnosisHistory[];
  onClear: () => void;
}) {
  if (history.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800">診断履歴</h2>
        <button
          onClick={onClear}
          className="text-xs text-gray-400 hover:text-red-400 transition-colors"
        >
          履歴を削除
        </button>
      </div>
      <ol className="space-y-3">
        {history.map((h, i) => {
          const date = new Date(h.timestamp).toLocaleDateString("ja-JP", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
          const acBadge = h.result.sources?.atcoder !== false;
          const lcBadge = h.result.sources?.leetcode;
          return (
            <li key={h.id} className="flex gap-3 items-start">
              <span className="text-xs text-gray-300 font-bold w-4 shrink-0 pt-0.5">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                  <span className="text-xs text-gray-400">{date}</span>
                  {acBadge && <span className="text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded-full font-semibold">AC</span>}
                  {lcBadge && <span className="text-xs bg-orange-50 text-orange-500 px-1.5 py-0.5 rounded-full font-semibold">LC</span>}
                </div>
                <p className="text-xs font-semibold text-gray-600 truncate">
                  {h.atcoderId} / {h.leetcodeId}
                </p>
                <p className="text-xs text-gray-400 truncate mt-0.5">
                  {h.result.levelLabel}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
