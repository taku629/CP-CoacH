"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { DiagnosisResult, DiagnosisHistory } from "@/types";
import { DiagnosisCard } from "@/components/DiagnosisCard";
import { WeaknessCard } from "@/components/WeaknessCard";
import { NextProblemsCard } from "@/components/NextProblemsCard";
import { WeeklyPlanCard } from "@/components/WeeklyPlanCard";
import { ComparisonCard, HistoryPanel } from "@/components/HistoryPanel";
import { ShareButton } from "@/components/ShareButton";
import { saveToHistory, loadHistory, clearHistory } from "@/lib/storage";
import { runAnalysis } from "@/lib/analyze";

const LOADING_STEPS = [
  "AtCoder データを取得中...",
  "弱点を分析中...",
  "LeetCode データを取得中...",
  "AI で診断中...",
];

function ResultInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sharedA = (searchParams.get("a") ?? "").trim();
  const sharedL = (searchParams.get("l") ?? "").trim();
  const isShared = sharedA !== "" || sharedL !== "";

  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [ids, setIds] = useState<{ atcoderId: string; leetcodeId: string } | null>(null);
  const [history, setHistory] = useState<DiagnosisHistory[]>([]);
  const [prevEntry, setPrevEntry] = useState<DiagnosisHistory | null>(null);
  const [sharedLoading, setSharedLoading] = useState(isShared);
  const [sharedStep, setSharedStep] = useState(0);
  const [sharedError, setSharedError] = useState("");
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    let cancelled = false;

    async function loadShared() {
      const outcome = await runAnalysis(sharedA, sharedL, {
        onProgress: (s) => {
          if (!cancelled) setSharedStep(s);
        },
      });
      if (cancelled) return;
      if (!outcome.ok) {
        setSharedError(outcome.error);
        setSharedLoading(false);
        return;
      }
      setResult(outcome.data);
      setIds({ atcoderId: sharedA, leetcodeId: sharedL });
      setSharedLoading(false);
    }

    function loadOwn() {
      const raw = sessionStorage.getItem("cpcoach_result");
      const rawIds = sessionStorage.getItem("cpcoach_ids");
      if (!raw) {
        router.replace("/");
        return;
      }

      const parsed: DiagnosisResult = JSON.parse(raw);
      const parsedIds = rawIds
        ? JSON.parse(rawIds)
        : { atcoderId: "", leetcodeId: "" };

      const existing = loadHistory();
      const latest = existing[0] ?? null;
      setPrevEntry(latest);

      const updated = saveToHistory(parsedIds.atcoderId, parsedIds.leetcodeId, parsed);

      setResult(parsed);
      setIds(parsedIds);
      setHistory(updated);
    }

    if (isShared) {
      loadShared();
    } else {
      loadOwn();
    }

    return () => {
      cancelled = true;
    };
  }, [isShared, sharedA, sharedL, router]);

  if (sharedLoading) {
    const who = sharedA && sharedL ? `@${sharedA} / @${sharedL}` : `@${sharedA || sharedL}`;
    return (
      <main className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center space-y-5">
          <h1 className="text-xl font-bold text-indigo-700">{who} の診断結果を生成中</h1>
          <p className="text-sm text-gray-500">{LOADING_STEPS[sharedStep]}</p>
          <div className="flex justify-center gap-1.5">
            {LOADING_STEPS.map((_, i) => (
              <span
                key={i}
                className={`block w-1.5 h-1.5 rounded-full transition-colors duration-500 ${
                  i <= sharedStep ? "bg-indigo-500" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (sharedError) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center space-y-5">
          <div className="text-5xl">⚠️</div>
          <h1 className="text-xl font-bold text-gray-800">診断を取得できませんでした</h1>
          <p className="text-sm text-gray-500">{sharedError}</p>
          <button
            onClick={() => router.push("/coach")}
            className="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
          >
            自分のIDで診断する
          </button>
        </div>
      </main>
    );
  }

  if (!result) return null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 to-white py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-indigo-700">CP Coach</h1>
            {ids && (ids.atcoderId || ids.leetcodeId) && (
              <p className="text-xs text-gray-400 mt-0.5">
                {isShared && "共有された診断: "}
                AtCoder: {ids.atcoderId || "—"} / LeetCode: {ids.leetcodeId || "—"}
              </p>
            )}
          </div>
          <button
            onClick={() => router.push("/coach")}
            className="text-sm text-indigo-600 hover:underline"
          >
            {isShared ? "自分のIDで診断" : "やり直す"}
          </button>
        </div>

        {/* 診断結果 */}
        <DiagnosisCard data={result} />
        <WeaknessCard weaknesses={result.weaknesses} />
        <NextProblemsCard problems={result.nextProblems} />
        <WeeklyPlanCard plan={result.weeklyPlan} />
        <ShareButton result={result} ids={ids ?? undefined} />

        {/* 前回比較（自分の診断時のみ表示） */}
        {!isShared && prevEntry && <ComparisonCard prev={prevEntry} curr={result} />}

        {/* 履歴一覧（自分の診断のみ） */}
        {!isShared && history.length >= 2 && (
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

export default function ResultPage() {
  return (
    <Suspense fallback={null}>
      <ResultInner />
    </Suspense>
  );
}
