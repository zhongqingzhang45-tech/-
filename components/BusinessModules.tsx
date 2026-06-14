import { BUSINESS_MODULES } from "@/data/content";

export function BusinessModules() {
  return (
    <section className="mx-auto mt-32 w-full max-w-6xl px-6">
      <div className="mb-12 flex flex-col items-start justify-between gap-3 md:flex-row md:items-end">
        <div>
          <div className="mb-2 text-xs uppercase tracking-[0.25em] text-brand-400">
            Product Features
          </div>
          <h2 className="text-3xl font-semibold text-white md:text-4xl">
            企业经营所需，
            <span className="text-gradient-brand">核心模块</span>
          </h2>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-400/10 px-4 py-1.5 text-xs text-brand-300">
          <span className="dot-online" />
          Business Dashboard · 在线
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
        {BUSINESS_MODULES.map((m, idx) => (
          <div
            key={m.name}
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-5 transition hover:-translate-y-0.5 hover:border-brand-400/30"
            style={{ animation: `slideUp 0.6s ease-out ${idx * 50}ms both` }}
          >
            <div
              className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl text-base text-brand-300"
              style={{ background: "rgba(34, 211, 238, 0.1)" }}
            >
              {m.icon}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">{m.name}</h3>
              <p className="mt-1 text-xs leading-relaxed text-gray-400">
                {m.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
