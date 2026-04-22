"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { DiagnosisResult, DiagnosisHistory } from "@/types";
import { DiagnosisCard } from "@/components/DiagnosisCard";
import { WeaknessCard } from "@/components/WeaknessCard";
import { NextProblemsCard } from "@/components/NextProblemsCard";
import { WeeklyPlanCard } from "@/components/WeeklyPlanCard";
import { ComparisonCard, HistoryPanel } from "@/components/HistoryPanel";
import { saveToHistory, loadHistory, clearHistory } from "@/lib/storage";

export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [ids, setIds] = useState<{ atcoderId: string; leetcodeId: string } | null>(null);
  const [history, setHistory] = useState<DiagnosisHistory[]>([]);
  const [prevEntry, setPrevEntry] = useState<DiagnosisHistory | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("cpcoach_result");
    const rawIds = sessionStorage.getItem("cpcoach_ids");
    if (!raw) {
      router.replace("/");
      return;
    }

    const parsed: DiagnosisResult = JSON.parse(raw);
    const parsedIds = rawIds ? JSON.parse(rawIds) : { atcoderId: "", leetcodeId: "" };

    // 保存前に「直前の履歴」を取得して比較表示に使う
    const existing = loadHistory();
    const latest = existing[0] ?? null;
    setPrevEntry(latest);

    // 今回の結果を保存
    const updated = saveToHistory(parsedIds.atcoderId, parsedIds.leetcodeId, parsed);

    setResult(parsed);
    setIds(parsedIds);
    setHistory(updated);
  }, [router]);

  if (!result) return null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 to-white py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-indigo-700">CP Coach</h1>
            {ids && (
              <p className="text-xs text-gray-400 mt-0.5">
                AtCoder: {ids.atcoderId} / LeetCode: {ids.leetcodeId}
              </p>
            )}
          </div>
          <button
            onClick={() => router.push("/coach")}
            className="text-sm text-indigo-600 hover:underline"
          >
            やり直す
          </button>
        </div>

        {/* 診断結果 */}
        <DiagnosisCard data={result} />
        <WeaknessCard weaknesses={result.weaknesses} />
        <NextProblemsCard problems={result.nextProblems} />
        <WeeklyPlanCard plan={result.weeklyPlan} />

        {/* 前回比較（2回目以降の診断で表示） */}
        {prevEntry && <ComparisonCard prev={prevEntry} curr={result} />}

        {/* 履歴一覧（2件以上保存されていたら表示） */}
        {history.length >= 2 && (
          <HistoryPanel
            history={history}
            onClear={() => {
              clearHistory();
              setHistory([]);
              setPrevEntry(null);
            }}
          />
        )}

        {/* フッター */}
        <div className="text-center text-xs text-gray-400 pb-6 space-y-1">
          <p>
            <span className={result.sources?.atcoder !== false ? "text-green-500 font-semibold" : "text-gray-400"}>
              AtCoder
            </span>
            {": "}
            {result.sources?.atcoder !== false ? "実データ接続中" : "取得できませんでした"}
            {" / "}
            <span className={result.sources?.leetcode ? "text-orange-500 font-semibold" : "text-gray-400"}>
              LeetCode
            </span>
            {": "}
            {result.sources?.leetcode ? "実データ接続中" : "取得できませんでした"}
          </p>
          <p>データは AtCoder Problems API / LeetCode から取得しています。</p>
          <p>
            <a href="/" className="text-indigo-400 hover:underline">CP Coach について</a>
          </p>
        </div>
      </div>
    </main>
  );
}
