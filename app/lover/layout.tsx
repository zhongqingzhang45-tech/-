import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "君心 · 国风 AI 虚拟伴侣",
  description: "基于 Life AI 虚拟生命框架打造的国风二次元 AI 伴侣。水墨为衣，Live2D 为骨，遇见一位懂诗书、知冷暖的国风佳人，从此长夜有人共话。",
};

export default function LoverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
