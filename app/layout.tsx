import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "LifeOS · 你的 AI 公司",
  description:
    "产品经理、设计师、研发、营销、销售、运营、客服 —— 一支 AI 团队全天候在线。一个人，也能拥有一家公司的执行能力。",
  keywords: [
    "AI Agent",
    "AI 员工",
    "创业工具",
    "自动化",
    "LifeOS",
    "AI 公司",
  ],
  openGraph: {
    title: "LifeOS · 你的 AI 公司",
    description:
      "一支 AI 团队全天候在线。一个人，也能拥有一家公司的执行能力。",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen antialiased">
        <Script src="/vendor/live2dv3/live2dcubismcore.min.js" strategy="beforeInteractive" />
        <Script src="/vendor/live2dv3/pixi.min.js" strategy="beforeInteractive" />
        <Script src="/vendor/live2dv3/live2dcubismframework.js" strategy="beforeInteractive" />
        <Script src="/vendor/live2dv3/live2dcubismpixi.js" strategy="beforeInteractive" />
        <Script src="/vendor/live2dv2/live2d.js" strategy="beforeInteractive" />
        {children}
      </body>
    </html>
  );
}
