import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "林晚 · 你的数字生命伴侣",
  description:
    "她不只是一个AI。她有童年、有恐惧、有渴望、有成长。实时语音、Live2D 形象、一起玩游戏——一个真正活着的数字生命。",
  keywords: [
    "数字生命",
    "虚拟情侣",
    "AI 陪伴",
    "Live2D",
    "语音聊天",
    "Minecraft",
    "Factorio",
    "Neuro-sama",
  ],
  openGraph: {
    title: "林晚 · 你的数字生命伴侣",
    description: "她有灵魂、会成长、能陪伴。一个真正活着的数字生命。",
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
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
