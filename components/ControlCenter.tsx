"use client";

import { useEffect, useState } from "react";

interface StatusSummary {
  online: number;
  busy: number;
  runningTasks: number;
  tasksToday: number;
  autoExecutionRate: number;
}

interface AgentSnapshot {
  id: string;
  name: string;
  status: "online" | "busy";
  currentTask: string;
  taskProgress: number;
}

const TICKER_MESSAGES = [
  "正在为 3 位创业者生成商业计划书",
  "AI 产品经理 正在编写 PRD v1.2",
  "AI 设计师 正在完成 Landing 页视觉稿",
  "AI 研发部 正在部署订单系统 v2.1",
  "AI 销售部 正在跟进 12 条销售线索",
  "AI 客服 正在响应 8 个客户咨询",
  "AI 运营部 正在生成本周数据分析周报",
  "已累计为 1,247 家企业完成自动化任务",
];

export function ControlCenter() {
  const [summary, setSummary] = useState<StatusSummary>({
    online: 8,
    busy: 2,
    runningTasks: 18,
    tasksToday: 86,
    autoExecutionRate: 94,
  });
  const [activeAgents, setActiveAgents] = useState<AgentSnapshot[]>([]);
  const [tickerIdx, setTickerIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/agents/status", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            setSummary(json.summary);
            setActiveAgents(
              json.agents
                .filter((a: any) => a.status === "busy")
                .slice(0, 4)
                .map((a: any) => ({
                  id: a.id,
                  name: a.name,
                  status: a.status,
                  currentTask: a.currentTask,
                  taskProgress: a.taskProgress,
                }))
            );
          }
        }
      } catch (e) {
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const iv = setInterval(fetchStatus, 5000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const iv = setInterval(() => {
      setTickerIdx((i) => (i + 1) % TICKER_MESSAGES.length);
    }, 3200);
    return () => clearInterval(iv);
  }, []);

  return (
    <section className="relative mx-auto mt-24 w-full max-w-6xl px-6">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-brand-400">
            <span className="dot-online" />
            LifeOS Control Center
          </div>
          <h2 className="text-2xl font-semibold text-white md:text-3xl">
            AI 团队，<span className="text-gradient-brand">实时运转中</span>
          </h2>
        </div>
        <div className="hidden text-right text-xs text-gray-400 md:block">
          <div className="font-mono">
            {new Date().toLocaleString("zh-CN", { hour12: false })}
          </div>
          <div>每 5 秒刷新一次</div>
        </div>
      </div>

      <div className="glass grid gap-4 rounded-3xl p-6 md:grid-cols-2 md:p-8">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-2">
          <StatCard
            label="在线 AI 员工"
            value={summary.online}
            suffix={`/ ${summary.online + summary.busy}`}
            accent="#22d3ee"
            hint={`${summary.busy} 位忙碌中`}
          />
          <StatCard
            label="今日任务"
            value={summary.tasksToday}
            suffix=" 件"
            accent="#34d399"
            hint="已完成 + 进行中"
          />
          <StatCard
            label="商机跟进"
            value={summary.runningTasks}
            suffix=" 条"
            accent="#fb7185"
            hint="自动同步 CRM"
          />
          <StatCard
            label="自动执行率"
            value={summary.autoExecutionRate}
            suffix="%"
            accent="#fbbf24"
            hint="无需人工干预"
          />
        </div>

        <div className="flex flex-col">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-medium text-gray-200">
              AI 正在执行任务
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              LIVE
            </div>
          </div>
          <div className="flex-1 rounded-2xl bg-ink-950/60 p-4">
            <div
              key={tickerIdx}
              className="mb-3 animate-slide-up font-mono text-sm text-brand-300"
            >
              › {TICKER_MESSAGES[tickerIdx]}
              <span className="ml-1 animate-blink">_</span>
            </div>
            <div className="space-y-3">
              {(activeAgents.length > 0 ? activeAgents : [
                { id: "product-manager", name: "产品经理", status: "busy" as const, currentTask: "正在规划需求", taskProgress: 65 },
                { id: "frontend", name: "前端工程师", status: "busy" as const, currentTask: "正在实现仪表盘", taskProgress: 42 },
                { id: "growth", name: "增长顾问", status: "busy" as const, currentTask: "正在生成推广方案", taskProgress: 78 },
                { id: "operations", name: "运营顾问", status: "busy" as const, currentTask: "正在分析运营数据", taskProgress: 31 },
              ]).map((agent) => (
                <div key={agent.id} className="group">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-400 shadow-glow-sm" />
                      <span className="text-gray-200">AI {agent.name}</span>
                    </div>
                    <span className="font-mono text-gray-500">
                      {agent.taskProgress}%
                    </span>
                  </div>
                  <div className="mb-1 truncate text-[11px] text-gray-500">
                    {agent.currentTask}
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-ink-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-500 transition-all duration-1000 ease-out"
                      style={{ width: `${agent.taskProgress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
  suffix,
  accent,
  hint,
}: {
  label: string;
  value: number;
  suffix?: string;
  accent: string;
  hint?: string;
}) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let current = 0;
    const step = Math.max(1, Math.ceil(value / 30));
    const iv = setInterval(() => {
      current += step;
      if (current >= value) {
        current = value;
        clearInterval(iv);
      }
      setDisplay(current);
    }, 36);
    return () => clearInterval(iv);
  }, [value]);

  return (
    <div className="rounded-2xl border border-white/5 bg-ink-950/40 p-5 transition hover:border-white/10">
      <div className="text-xs text-gray-400">{label}</div>
      <div className="mt-2 flex items-baseline gap-1">
        <span
          className="text-4xl font-bold font-mono tabular-nums"
          style={{ color: accent }}
        >
          {display}
        </span>
        <span className="text-sm text-gray-500">{suffix}</span>
      </div>
      {hint && <div className="mt-1 text-[11px] text-gray-500">{hint}</div>}
    </div>
  );
}
