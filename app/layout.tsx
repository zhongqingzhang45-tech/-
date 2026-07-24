import type { Metadata } from "next";
import Script from "next/script";
import { Noto_Serif_SC } from "next/font/google";
import "./globals.css";
import { BRAND } from "@/lib/brand";

const notoSerifSC = Noto_Serif_SC({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-serif-sc",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${BRAND.name} · 国风 AI 伴侣`,
  description: BRAND.description,
  keywords: BRAND.keywords,
  openGraph: {
    title: `${BRAND.name} · 国风 AI 伴侣`,
    description: BRAND.tagline,
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className={notoSerifSC.variable}>
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
