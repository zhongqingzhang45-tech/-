"use client";

import { useEffect, useRef, useState } from "react";
import type { AgentExpert } from "@/data/agents";

interface ChatMessage {
  id: string;
  role: "user" | "agent";
  content: string;
  time: string;
}

interface Props {
  agent: AgentExpert;
  onClose: () => void;
}

const PROMPT_SUGGESTIONS: Record<string, string[]> = {
  "product-manager": ["帮我把这个想法拆成 MVP", "生成一份 PRD 的结构", "怎么定义目标用户？"],
  "feedback-synthesizer": ["分析这 20 条用户反馈", "提炼 Top 5 问题", "如何区分噪声和真实需求？"],
  "sprint-prioritizer": ["帮我排序这些需求的优先级", "识别需求间的依赖关系", "生成下周的迭代计划"],
  "ui-designer": ["设计一套品牌配色", "帮我设计一个 SaaS 登录页", "需要一个图标方案"],
  "ux-architect": ["优化注册流程的信息架构", "帮我梳理用户旅程", "设计一套交互模式库"],
  "brand-guardian": ["为我们品牌生成视觉规范", "检查物料是否符合品牌", "设计品牌色板和字体方案"],
  "frontend-developer": ["实现一个响应式 Dashboard", "写一个优雅的卡片组件", "给这个页面加动效"],
  "backend-architect": ["设计订单系统的 API", "怎么优化数据库查询？", "推荐部署架构方案"],
  "ai-engineer": ["帮我设计 Agent 的 Prompt 方案", "如何设计函数调用流程？", "怎么做 Agent 的评测？"],
  "database-optimizer": ["SQL 查询太慢了怎么办", "如何设计合适的索引？", "冷热数据分层建议"],
  "devops-automator": ["搭建 CI/CD 流水线", "优化 Docker 镜像大小", "设计监控告警方案"],
  "incident-response-commander": ["线上故障怎么排查？", "帮我写一份故障复盘模板", "如何组织应急演练？"],
  "growth-hacker": ["我该从哪些渠道获客？", "设计一个裂变活动", "怎么提升转化率？"],
  "content-creator": ["写一篇产品发布长文", "生成短视频脚本", "写一篇公众号推文"],
  "xiaohongshu-specialist": ["生成 5 条爆款笔记选题", "优化封面和标题", "写种草风格正文"],
  "douyin-strategist": ["写 10 条短视频脚本", "设计直播带货流程", "生成投放策略"],
  "private-domain-operator": ["设计会员 SOP 体系", "写社群内容日历", "策划复购活动"],
  "deal-strategist": ["生成专业的销售跟进话术", "帮我报价一个项目", "起草合作合同框架"],
  "support-responder": ["写一套标准 FAQ 话术", "怎么回复愤怒的客户？", "生成工单回复模板"],
  "financial-analyst": ["做一个财务预算表", "分析本月现金流", "税务提醒事项清单"],
  "security-architect": ["做一次安全基线检查", "渗透测试要点清单", "合规自查清单"],
  "senior-project-manager": ["生成项目周报", "识别项目的风险点", "跨部门协调会议纪要"],
  "brand-creative-director": ["为新品设计品牌视觉系统", "统一对外文案语调", "生成一套社媒物料模板"],
};

export function AgentChatPanel({ agent, onClose }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "agent",
      content: `你好，我是 LifeOS 的${agent.name}。${agent.tagline}。有什么需要我帮你做的？`,
      time: "刚刚",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length, sending]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || sending) return;
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text.trim(),
      time: "刚刚",
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/agents/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: agent.id, message: text }),
      });
      if (!res.ok) throw new Error("failed");
      const json = await res.json();
      const reply: ChatMessage = {
        id: `a-${Date.now()}`,
        role: "agent",
        content: json.reply || "让我想一想…",
        time: "刚刚",
      };
      setMessages((prev) => [...prev, reply]);
    } catch (e) {
      const reply: ChatMessage = {
        id: `a-${Date.now()}`,
        role: "agent",
        content:
          "我暂时无法连接到服务器。不过我已经记录了你的需求，稍后我会基于我学习的知识给你一份详细方案。",
        time: "刚刚",
      };
      setMessages((prev) => [...prev, reply]);
    } finally {
      setSending(false);
    }
  };

  const suggestions = PROMPT_SUGGESTIONS[agent.id] || [];

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end sm:items-center sm:justify-center sm:p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative flex h-full w-full max-w-xl flex-col overflow-hidden border-l border-brand-400/20 bg-ink-950 shadow-2xl sm:h-[640px] sm:rounded-3xl sm:border">
        <div
          className="absolute -top-32 left-1/2 h-64 w-[120%] -translate-x-1/2 rounded-full blur-3xl"
          style={{ background: `${agent.accent}20` }}
        />

        <header className="relative flex items-center gap-4 border-b border-white/5 bg-white/[0.02] p-5">
          <div
            className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-white shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${agent.accent}, ${agent.accent}99)`,
              boxShadow: `0 0 28px ${agent.accent}40`,
            }}
          >
            {agent.name.slice(0, 2)}
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-ink-950 bg-emerald-500">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="text-base font-semibold text-white">
                AI {agent.name}
              </div>
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                在线
              </span>
            </div>
            <div className="truncate text-xs text-gray-400">
              {agent.role} · {agent.tagline}
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition hover:bg-white/10 hover:text-white"
            aria-label="关闭"
          >
            ✕
          </button>
        </header>

        <div
          ref={scrollRef}
          className="relative flex-1 space-y-4 overflow-y-auto p-5"
        >
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-brand-500/20 text-white shadow-glow-sm"
                    : "bg-white/5 text-gray-200"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl bg-white/5 px-4 py-3 text-sm text-gray-400">
                <span className="flex gap-1">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-400 [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-400 [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-400 [animation-delay:300ms]" />
                </span>
                正在思考…
              </div>
            </div>
          )}
        </div>

        {suggestions.length > 0 && messages.length <= 1 && (
          <div className="flex flex-wrap gap-2 border-t border-white/5 bg-white/[0.02] px-5 py-3">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-gray-300 transition hover:border-brand-400/40 hover:text-white"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="border-t border-white/5 bg-white/[0.02] p-4">
          <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-ink-950/60 p-2 focus-within:border-brand-400/40">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              placeholder={`对 AI ${agent.name} 说点什么…（Enter 发送）`}
              rows={1}
              className="max-h-32 min-h-[24px] flex-1 resize-none bg-transparent px-3 py-1.5 text-sm text-white placeholder:text-gray-500 focus:outline-none"
            />
            <button
              disabled={!input.trim() || sending}
              onClick={() => sendMessage(input)}
              className="flex h-8 items-center justify-center gap-1 rounded-xl px-3 text-sm font-medium text-ink-950 transition disabled:cursor-not-allowed disabled:opacity-40"
              style={{
                background: input.trim()
                  ? `linear-gradient(135deg, ${agent.accent}, ${agent.accent}cc)`
                  : "#374151",
              }}
            >
              发送 →
            </button>
          </div>
          <div className="mt-2 text-center text-[11px] text-gray-500">
            对话由 LifeOS AI Agent 处理 · 当前接通：{agent.name}
          </div>
        </div>
      </div>
    </div>
  );
}
