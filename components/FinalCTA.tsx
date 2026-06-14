"use client";

export function FinalCTA() {
  return (
    <section className="mx-auto mt-32 w-full max-w-6xl px-6">
      <div className="relative overflow-hidden rounded-[32px] border border-brand-400/20 bg-gradient-to-br from-brand-500/10 via-white/[0.03] to-fuchsia-500/10 p-10 md:p-16">
        <div className="pointer-events-none absolute -top-20 left-1/2 h-60 w-[120%] -translate-x-1/2 rounded-full bg-brand-400/20 blur-[120px]" />

        <div className="relative text-center">
          <div className="mb-3 text-xs uppercase tracking-[0.25em] text-brand-300">
            Start Today
          </div>
          <h2 className="text-3xl font-semibold text-white md:text-5xl">
            从今天开始，
            <span className="text-gradient-brand">让 AI 帮你经营公司</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-gray-400 md:text-base">
            不需要学习复杂的系统。不需要招聘。你只需要提出目标 —— AI 会把它落地。
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-400 to-brand-500 px-7 py-3.5 text-sm font-semibold text-ink-950 shadow-glow transition hover:brightness-110">
              免费开始 →
            </button>
            <button className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.03] px-7 py-3.5 text-sm font-medium text-white transition hover:border-brand-400/40">
              联系顾问
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
