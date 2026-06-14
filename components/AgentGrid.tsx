"use client";

import { useState } from "react";
import type { AgentExpert } from "@/data/agents";
import { AGENT_EXPERTS } from "@/data/agents";
import { AgentChatPanel } from "./AgentChatPanel";

export function AgentGrid() {
  const [active, setActive] = useState<AgentExpert | null>(null);

  return (
    <section className="mx-auto mt-32 w-full max-w-6xl px-6">
      <div className="mb-12 text-center">
        <div className="mb-3 text-xs uppercase tracking-[0.25em] text-brand-400">
          AI Expert Team
        </div>
        <h2 className="text-3xl font-semibold text-white md:text-4xl">
          <span className="text-gradient-brand">10 位 AI 专家</span>
          ，全天候在线
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-400 md:text-base">
          每一位专家都经过专门训练，可独立工作，也可跨部门协同。点击任意一位，立即开始对话。
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {AGENT_EXPERTS.map((agent, idx) => (
          <button
            key={agent.id}
            onClick={() => setActive(agent)}
            className="group relative flex flex-col items-center overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-5 text-left transition hover:-translate-y-1 hover:border-brand-400/30 hover:bg-white/[0.04]"
            style={{
              animation: `slideUp 0.6s ease-out ${idx * 40}ms both`,
              boxShadow:
                "0 0 0 rgba(6,182,212,0)",
            }}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              style={{
                background: `radial-gradient(ellipse at center top, ${agent.accent}25, transparent 70%)`,
              }}
            />

            <div className="relative mb-3">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-bold text-white"
                style={{
                  background: `linear-gradient(135deg, ${agent.accent}, ${agent.accent}aa)`,
                  boxShadow: `0 0 24px ${agent.accent}55`,
                }}
              >
                {agent.name.slice(0, 2)}
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-ink-950 bg-emerald-500">
                <span className="h-2 w-2 rounded-full bg-white" />
              </span>
            </div>

            <div className="relative text-sm font-semibold text-white">
              {agent.name}
            </div>
            <div className="relative mt-0.5 text-[10px] uppercase tracking-wider text-gray-500">
              {agent.role}
            </div>

            <div className="relative mt-3 w-full text-center text-[11px] text-gray-400 line-clamp-2">
              {agent.tagline}
            </div>

            <div
              className="relative mt-4 rounded-full border px-3 py-1 text-[11px] text-gray-300 opacity-0 transition group-hover:opacity-100"
              style={{
                borderColor: `${agent.accent}55`,
                background: `${agent.accent}10`,
                color: agent.accent,
              }}
            >
              点击对话 →
            </div>
          </button>
        ))}
      </div>

      {active && <AgentChatPanel agent={active} onClose={() => setActive(null)} />}
    </section>
  );
}
