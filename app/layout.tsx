import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cp-coach.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "CP Coach — 競プロ学習をAIがサポート",
    template: "%s | CP Coach",
  },
  description:
    "AtCoder と LeetCode の ID を入れるだけで、弱点分析・推薦問題5問・1週間の練習プランを自動生成。競技プログラミングの学習をAIがまとめてサポートします。",
  openGraph: {
    title: "CP Coach — 競プロ学習をAIがサポート",
    description:
      "AtCoder × LeetCode の弱点分析と練習プランを自動生成する競プロ学習OS。",
    type: "website",
    locale: "ja_JP",
    siteName: "CP Coach",
  },
  twitter: {
    card: "summary_large_image",
    title: "CP Coach — 競プロ学習をAIがサポート",
    description:
      "IDを入れるだけで、AtCoder × LeetCode の弱点分析 + 次の5問 + 1週間プランを自動生成。",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
