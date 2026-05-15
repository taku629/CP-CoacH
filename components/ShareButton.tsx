"use client";
import { useState } from "react";
import type { DiagnosisResult } from "@/types";

function buildShareUrl(
  origin: string,
  ids?: { atcoderId: string; leetcodeId: string }
) {
  if (!ids || (!ids.atcoderId && !ids.leetcodeId)) return origin;
  const params = new URLSearchParams();
  if (ids.atcoderId) params.set("a", ids.atcoderId);
  if (ids.leetcodeId) params.set("l", ids.leetcodeId);
  return `${origin}/result?${params.toString()}`;
}

function buildTweet(result: DiagnosisResult, shareUrl: string) {
  const topWeakness = result.weaknesses[0]?.tag ?? "なし";
  const problemCount = result.nextProblems.length;
  const lines = [
    "🎯 CP Coachで競プロ診断してみた",
    "",
    `📊 ${result.levelLabel}`,
    `💪 重点強化分野: ${topWeakness}`,
    `📋 次の${problemCount}問でステップアップ予定！`,
    "",
    `${shareUrl} #競プロ #AtCoder #LeetCode`,
  ];
  return lines.join("\n");
}

export function ShareButton({
  result,
  ids,
}: {
  result: DiagnosisResult;
  ids?: { atcoderId: string; leetcodeId: string };
}) {
  const [copied, setCopied] = useState(false);

  const getText = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return buildTweet(result, buildShareUrl(origin, ids));
  };

  const handleTweet = () => {
    const text = getText();
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow p-6 border border-gray-100">
      <h2 className="text-lg font-bold text-gray-800 mb-1">結果をシェア</h2>
      <p className="text-xs text-gray-500 mb-4">
        診断結果をXでシェアして、競プロ仲間と進捗を共有しよう
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          onClick={handleTweet}
          className="flex-1 bg-black hover:bg-gray-800 text-white font-bold text-sm px-5 py-3 rounded-xl transition-colors"
        >
          𝕏 でポストする
        </button>
        <button
          onClick={handleCopy}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm px-5 py-3 rounded-xl transition-colors"
        >
          {copied ? "✓ コピーしました" : "テキストをコピー"}
        </button>
      </div>
    </div>
  );
}
