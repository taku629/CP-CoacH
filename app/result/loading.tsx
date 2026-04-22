export default function Loading() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 to-white py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6 animate-pulse">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-7 w-28 bg-gray-200 rounded-lg" />
            <div className="h-3 w-48 bg-gray-100 rounded" />
          </div>
          <div className="h-4 w-16 bg-gray-100 rounded" />
        </div>

        {/* 診断カード */}
        {[120, 90, 180, 220].map((h, i) => (
          <div key={i} className="bg-white rounded-2xl shadow p-6 border border-gray-100 space-y-3">
            <div className="h-5 w-40 bg-gray-200 rounded" />
            <div className="h-3 w-full bg-gray-100 rounded" />
            <div className={`bg-gray-100 rounded`} style={{ height: h / 4 }} />
          </div>
        ))}
      </div>
    </main>
  );
}
