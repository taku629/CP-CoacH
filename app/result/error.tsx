"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("[result/error]", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center space-y-5">
        <div className="text-5xl">⚠️</div>
        <h1 className="text-xl font-bold text-gray-800">表示中にエラーが発生しました</h1>
        <p className="text-sm text-gray-500">
          結果の読み込みに失敗しました。再度分析するか、しばらくしてからお試しください。
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={unstable_retry}
            className="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
          >
            再試行
          </button>
          <button
            onClick={() => router.push("/coach")}
            className="px-5 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-colors"
          >
            診断に戻る
          </button>
        </div>
      </div>
    </main>
  );
}
