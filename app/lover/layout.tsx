import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "星野 · 你的虚拟恋人",
  description: "一个有温度、有个性、会撒娇也会生气的虚拟伴侣。24小时在线陪伴，懂你、爱你、守护你。",
};

export default function LoverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
