import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: `${BRAND.name} · 国风 AI 伴侣空间`,
  description: BRAND.description,
};

export default function LoverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
