"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loadHistory, getDoneProblems } from "@/lib/storage";

const LOADING_STEPS = [
  "AtCoder データを取得中...",
  "LeetCode データを取得中...",
  "AI で分析中...",
  "練習プランを生成中...",
];

export default function CoachPage() {
  const router = useRouter();
  const [atcoderId, setAtcoderId] = useState("");
  const [leetcodeId, setLeetcodeId] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState("");
  const stepRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (stepRef.current) clearInterval(stepRef.current);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!atcoderId.trim() && !leetcodeId.trim()) {
      setError("AtCoder ID か LeetCode ID のどちらかを入力してください");
      return;
    }
    setError("");
    setLoading(true);
    setLoadingStep(0);

    stepRef.current = setInterval(() => {
      setLoadingStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1));
    }, 3500);

    try {
      const history = loadHistory();
      const previousResult = history[0]?.result;
      const doneProblems = getDoneProblems();

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          atcoderId: atcoderId.trim(),
          leetcodeId: leetcodeId.trim(),
          previousResult,
          doneProblems,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error ?? "エラーが発生しました");
        return;
      }

      sessionStorage.setItem("cpcoach_result", JSON.stringify(data.data));
      sessionStorage.setItem("cpcoach_ids", JSON.stringify({ atcoderId, leetcodeId }));
      router.push("/result");
    } catch {
      setError("通信エラーが発生しました。しばらくしてから再試行してください。");
    } finally {
      if (stepRef.current) clearInterval(stepRef.current);
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex flex-col">
      {/* ナビ */}
      <header className="px-6 py-4 flex items-center justify-between max-w-4xl mx-auto w-full">
        <Link href="/" className="text-indigo-700 font-extrabold text-lg tracking-tight">
          CP Coach
        </Link>
        <Link href="/" className="text-xs text-gray-400 hover:text-indigo-600 transition-colors">
          ← サービス紹介へ
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-extrabold text-indigo-700 tracking-tight">診断スタート</h1>
            <p className="text-gray-500 mt-2 text-sm">
              どちらか一方だけでも分析できます
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-lg p-8 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                AtCoder ID <span className="text-gray-400 font-normal">（任意）</span>
              </label>
              <input
                type="text"
                value={atcoderId}
                onChange={(e) => setAtcoderId(e.target.value)}
                placeholder="例: tourist"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                LeetCode ID <span className="text-gray-400 font-normal">（任意）</span>
              </label>
              <input
                type="text"
                value={leetcodeId}
                onChange={(e) => setLeetcodeId(e.target.value)}
                placeholder="例: neal_wu"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                disabled={loading}
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold py-3 rounded-xl transition-colors text-sm"
            >
              {loading ? LOADING_STEPS[loadingStep] : "分析する"}
            </button>

            {loading && (
              <div className="flex justify-center gap-1.5 pt-1">
                {LOADING_STEPS.map((_, i) => (
                  <span
                    key={i}
                    className={`block w-1.5 h-1.5 rounded-full transition-colors duration-500 ${
                      i <= loadingStep ? "bg-indigo-500" : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
            )}
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            AtCoder / LeetCode のプロフィールを公開設定にしてから実行してください。
          </p>
        </div>
      </div>
    </main>
  );
}
