import { ImageResponse } from "next/og";

export const alt = "CP Coach — AtCoder × LeetCode 競プロ学習コーチ";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #4f46e5 0%, #312e81 100%)",
          color: "white",
          padding: "60px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            background: "rgba(255,255,255,0.15)",
            padding: "8px 20px",
            borderRadius: "999px",
            fontSize: 28,
            fontWeight: 600,
            marginBottom: 28,
          }}
        >
          AtCoder × LeetCode 対応
        </div>
        <div
          style={{
            fontSize: 110,
            fontWeight: 900,
            letterSpacing: "-0.02em",
            lineHeight: 1.05,
            marginBottom: 24,
          }}
        >
          CP Coach
        </div>
        <div
          style={{
            fontSize: 42,
            fontWeight: 700,
            textAlign: "center",
            lineHeight: 1.3,
            marginBottom: 16,
          }}
        >
          IDを入れるだけで、今週の練習プランが自動生成
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#c7d2fe",
            textAlign: "center",
          }}
        >
          弱点分析 ・ 次の5問 ・ 1週間メニュー
        </div>
      </div>
    ),
    { ...size }
  );
}
