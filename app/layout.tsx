import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "星野 · 你的AI伴侣",
  description:
    "星野是你的专属AI伴侣，懂你所想，永远陪伴。暖心聊天、语音互动、生动形象，一个真正有温度的灵魂伴侣。",
  keywords: [
    "AI伴侣",
    "虚拟恋人",
    "聊天机器人",
    "语音陪伴",
    "星野",
    "AI情感",
  ],
  openGraph: {
    title: "星野 · 你的AI伴侣",
    description: "永远陪伴，懂你所想。一个真正有温度的灵魂伴侣。",
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
        {/* Live2D scripts loaded dynamically by component */}
        {children}
      </body>
    </html>
  );
}
