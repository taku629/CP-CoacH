import Link from "next/link";

const FEATURES = [
  {
    icon: "🎯",
    title: "現在地診断",
    desc: "AtCoder の AC 履歴と推定レーティング、LeetCode の難易度分布から今の実力を客観的に把握できます。",
  },
  {
    icon: "⚠️",
    title: "弱点分野の可視化",
    desc: "DP・Graph・Binary Search など分野ごとの AC 率を分析し、次に集中すべき領域を特定します。",
  },
  {
    icon: "📋",
    title: "次に解くべき5問",
    desc: "実力より少し上の難易度帯から弱点タグを優先した問題を自動選出。AtCoder + LeetCode の両方から提案します。",
  },
  {
    icon: "📅",
    title: "1週間の練習プラン",
    desc: "曜日ごとに無理のないメニューを設計。AtCoder と LeetCode をバランスよく組み合わせた週次プランを生成します。",
  },
  {
    icon: "📈",
    title: "前回との比較",
    desc: "診断履歴をブラウザに保存し、弱点タグの増減・克服状況を前回と比較して成長を可視化します。",
  },
  {
    icon: "✅",
    title: "解いた問題の管理",
    desc: "推薦された問題に「解いた」「スキップ」をマーク。次回の推薦に反映され、同じ問題が繰り返し出なくなります。",
  },
];

const TARGETS = [
  { emoji: "🟤", label: "AtCoder 茶〜緑を目指している方" },
  { emoji: "💻", label: "LeetCode をコツコツ積み上げたい方" },
  { emoji: "🎓", label: "就活・インターンに向けてアルゴリズムを鍛えたい学生" },
  { emoji: "📚", label: "何から手をつければいいか分からない初〜中級者" },
];

const FUTURE = [
  "面接モード（LeetCode頻出のコーディング問題に特化した練習セット）",
  "コンテスト前後モード（本番前の最終調整プラン / 復習プラン）",
  "復習ノート生成（間違えた問題の解法パターンを自動まとめ）",
  "週次メールレポート（成長サマリーを毎週届ける）",
  "グループ機能（友人と進捗を共有して切磋琢磨）",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-800">
      {/* ナビ */}
      <header className="border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-indigo-700 font-extrabold text-xl tracking-tight">CP Coach</span>
          <Link
            href="/coach"
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-5 py-2 rounded-xl transition-colors"
          >
            今すぐ診断する
          </Link>
        </div>
      </header>

      {/* ヒーロー */}
      <section className="bg-gradient-to-br from-indigo-50 to-white py-24 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-block bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full mb-6">
            AtCoder × LeetCode 対応
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
            IDを入れるだけで、<br className="hidden sm:block" />
            <span className="text-indigo-600">今週の練習プラン</span>が自動生成
          </h1>
          <p className="text-lg text-gray-500 mb-10 leading-relaxed">
            弱点分析から推薦問題の選定、1週間のメニュー設計まで。<br className="hidden sm:block" />
            競プロ学習の「次の一手」をAIがまとめて提案します。
          </p>
          <Link
            href="/coach"
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg px-10 py-4 rounded-2xl transition-colors shadow-lg shadow-indigo-200"
          >
            無料で診断する →
          </Link>
          <p className="text-xs text-gray-400 mt-4">IDを入れるだけ。登録不要・無料</p>
        </div>
      </section>

      {/* 機能一覧 */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-gray-900 mb-3">
            できること
          </h2>
          <p className="text-center text-gray-500 text-sm mb-12">
            AtCoder と LeetCode の両方を分析して、6つのアウトプットを一括生成します
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-gray-800 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 対象ユーザー */}
      <section className="py-20 px-6 bg-indigo-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3">こんな人に向いています</h2>
          <p className="text-gray-500 text-sm mb-10">競プロを続けているけど、何から手をつけるか迷っている方へ</p>
          <div className="space-y-3 text-left max-w-md mx-auto">
            {TARGETS.map((t) => (
              <div key={t.label} className="flex items-center gap-3 bg-white rounded-xl px-5 py-3 shadow-sm border border-indigo-100">
                <span className="text-2xl">{t.emoji}</span>
                <span className="text-sm font-semibold text-gray-700">{t.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 使い方 */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-12">使い方は3ステップ</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { step: "1", title: "IDを入力", desc: "AtCoder と LeetCode のユーザーIDを入力するだけ。" },
              { step: "2", title: "分析を待つ", desc: "AtCoder の AC 履歴と LeetCode のデータを自動で取得・分析します（約15秒）。" },
              { step: "3", title: "プランを実行", desc: "弱点・推薦5問・週次プランを受け取り、今日から練習を開始できます。" },
            ].map((s) => (
              <div key={s.step} className="flex flex-col items-center">
                <div className="w-12 h-12 bg-indigo-600 text-white font-extrabold text-lg rounded-full flex items-center justify-center mb-4 shadow-lg shadow-indigo-200">
                  {s.step}
                </div>
                <h3 className="font-bold text-gray-800 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 将来機能 */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3">今後追加予定の機能</h2>
          <p className="text-gray-500 text-sm mb-10">CP Coach はまだ成長中のプロダクトです</p>
          <ul className="space-y-2 text-left max-w-xl mx-auto">
            {FUTURE.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-gray-600 bg-white rounded-xl px-5 py-3 border border-gray-100">
                <span className="text-indigo-400 mt-0.5 shrink-0">→</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-br from-indigo-600 to-indigo-800 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">
            今日から練習の質を上げよう
          </h2>
          <p className="text-indigo-200 text-sm mb-8">
            登録不要・完全無料。AtCoder と LeetCode の ID があれば、今すぐ始められます。
          </p>
          <Link
            href="/coach"
            className="inline-block bg-white text-indigo-700 font-bold text-lg px-10 py-4 rounded-2xl hover:bg-indigo-50 transition-colors shadow-lg"
          >
            無料で診断する →
          </Link>
        </div>
      </section>

      {/* フッター */}
      <footer className="border-t border-gray-100 py-8 px-6 text-center text-xs text-gray-400">
        <p>CP Coach — AtCoder × LeetCode 学習支援ツール</p>
        <p className="mt-1">データは AtCoder Problems API / LeetCode から取得しています。</p>
      </footer>
    </div>
  );
}
