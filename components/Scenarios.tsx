import { SCENARIOS } from "@/data/content";

export function Scenarios() {
  return (
    <section className="mx-auto mt-32 w-full max-w-6xl px-6">
      <div className="mb-12 text-center">
        <div className="mb-2 text-xs uppercase tracking-[0.25em] text-brand-400">
          Problems Solved
        </div>
        <h2 className="text-3xl font-semibold text-white md:text-4xl">
          从<span className="text-gradient-brand"> 创业 </span>到
          <span className="text-gradient-brand"> 运营 </span>，
          全流程覆盖
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-400 md:text-base">
          选择你当前的目标，LifeOS 会自动匹配最合适的 AI 部门组合，为你端到端地执行。
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {SCENARIOS.map((s, idx) => (
          <div
            key={s.id}
            className="group relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent p-6 transition hover:border-brand-400/30"
            style={{ animation: `slideUp 0.6s ease-out ${idx * 50}ms both` }}
          >
            <div className="flex items-start justify-between">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
                style={{
                  background: `${s.color}15`,
                  color: s.color,
                }}
              >
                {s.icon}
              </div>
              <span
                className="font-mono text-xs opacity-50"
                style={{ color: s.color }}
              >
                0{idx + 1}
              </span>
            </div>

            <h3 className="mt-5 text-lg font-semibold text-white">{s.title}</h3>
            <p className="mt-1 text-xs text-gray-400">{s.subtitle}</p>

            <ul className="mt-4 space-y-1.5 text-sm text-gray-300">
              {s.bullets.map((b) => (
                <li key={b} className="flex items-start gap-2">
                  <span
                    className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full"
                    style={{ background: s.color }}
                  />
                  <span className="leading-relaxed">{b}</span>
                </li>
              ))}
            </ul>

            <div className="mt-5 flex items-center gap-1 text-xs font-medium transition group-hover:gap-2" style={{ color: s.color }}>
              <span>立即开始</span>
              <span>→</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
