import { DEPARTMENTS } from "@/data/content";

export function Departments() {
  return (
    <section className="mx-auto mt-32 w-full max-w-6xl px-6">
      <div className="mb-12 flex flex-col items-start justify-between gap-3 md:flex-row md:items-end">
        <div>
          <div className="mb-2 text-xs uppercase tracking-[0.25em] text-brand-400">
            Core Capabilities
          </div>
          <h2 className="text-3xl font-semibold text-white md:text-4xl">
            六大 AI 部门，
            <span className="text-gradient-brand">协同作战</span>
          </h2>
        </div>
        <p className="max-w-md text-sm text-gray-400">
          产品、研发、营销、销售、客服、运营 —— 六个部门在同一个系统里自动协作，你只负责决策和方向。
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {DEPARTMENTS.map((dept, idx) => (
          <div
            key={dept.id}
            className="group relative overflow-hidden rounded-3xl border border-white/5 bg-white/[0.02] p-7 transition hover:-translate-y-1 hover:border-brand-400/30"
            style={{
              animation: `slideUp 0.6s ease-out ${idx * 60}ms both`,
            }}
          >
            <div
              className={`pointer-events-none absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-100 ${dept.color}`}
            />

            <div className="relative flex items-start justify-between">
              <div
                className="font-mono text-5xl font-bold"
                style={{ color: `${dept.accent}66` }}
              >
                {dept.number}
              </div>
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl text-xl"
                style={{
                  background: `${dept.accent}15`,
                  color: dept.accent,
                }}
              >
                {dept.icon}
              </div>
            </div>

            <h3 className="relative mt-6 text-xl font-semibold text-white">
              {dept.name}
            </h3>
            <p className="relative mt-1 text-xs text-gray-400">{dept.tagline}</p>
            <p className="relative mt-4 text-sm leading-relaxed text-gray-300">
              {dept.description}
            </p>

            <div className="relative mt-5 flex flex-wrap gap-1.5">
              {dept.deliverables.map((d) => (
                <span
                  key={d}
                  className="rounded-full border border-white/5 bg-ink-950/50 px-2.5 py-1 text-[11px] text-gray-400"
                >
                  {d}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
