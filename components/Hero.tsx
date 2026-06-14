"use client";

import { useEffect, useState } from "react";

const TITLES = [
  "一个人，也能拥有一家公司的执行能力。",
  "从想法到落地，AI 团队为你全程推进。",
  "让你的每一个想法，都有 10 位 AI 专家在背后支持。",
];

export function Hero() {
  const [idx, setIdx] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    const iv = setInterval(() => setIdx((i) => (i + 1) % TITLES.length), 4500);
    return () => clearInterval(iv);
  }, []);

  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const openAgentChat = (agentId: string) => {
    const customEvent = new CustomEvent("lifeos-open-agent", { detail: { agentId } });
    window.dispatchEvent(customEvent);
  };

  return (
    <section className="relative mx-auto flex w-full max-w-6xl flex-col items-center pt-24 pb-8 px-6 text-center md:pt-32">
      <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-400/5 px-4 py-1.5 text-xs text-brand-300">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-400" />
        </span>
        AI Business Operating System
      </div>

      <h1 className="mb-6 text-5xl font-bold leading-tight text-white md:text-6xl lg:text-7xl">
        <span className="block">LifeOS</span>
        <span className="mt-3 block bg-gradient-to-br from-white via-brand-200 to-brand-400 bg-clip-text text-3xl font-medium text-transparent md:text-4xl lg:text-5xl">
          你的 AI 公司
        </span>
      </h1>

      <div className="mb-8 flex min-h-[64px] items-center justify-center">
        <p
          className="animate-fade-in max-w-2xl text-base leading-relaxed text-gray-300 md:text-lg"
          suppressHydrationWarning
        >
          {hydrated ? TITLES[idx] : TITLES[0]}
        </p>
      </div>

      <p className="max-w-2xl text-sm text-gray-500 md:text-base">
        产品经理、设计师、研发工程师、营销顾问、销售顾问、运营顾问、客服专家 —— 全天候在线。
      </p>

      <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
        <button
          onClick={() => scrollToId("lifeos-agent-team")}
          className="group relative inline-flex items-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-brand-400 to-brand-500 px-7 py-3.5 text-sm font-semibold text-ink-950 transition shadow-glow hover:brightness-110 active:scale-95"
        >
          <span>免费开始</span>
          <span className="transition group-hover:translate-x-0.5">→</span>
        </button>
        <button
          onClick={() => openAgentChat("product-manager")}
          className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.03] px-7 py-3.5 text-sm font-medium text-white transition hover:border-brand-400/40 hover:text-brand-300 active:scale-95"
        >
          <span>▶</span>
          <span>立即体验对话</span>
        </button>
      </div>

      <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <span className="text-brand-300">✓</span> 无需信用卡
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-brand-300">✓</span> 10 位 AI 员工
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-brand-300">✓</span> 6 大部门协同
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-brand-300">✓</span> 3 分钟上手
        </div>
      </div>
    </section>
  );
}
