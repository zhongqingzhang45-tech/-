import { WORKFLOW_STEPS } from "@/data/content";

export function Workflow() {
  return (
    <section className="mx-auto mt-32 w-full max-w-6xl px-6">
      <div className="mb-12 text-center">
        <div className="mb-2 text-xs uppercase tracking-[0.25em] text-brand-400">
          Workflow
        </div>
        <h2 className="text-3xl font-semibold text-white md:text-4xl">
          从目标到结果，<span className="text-gradient-brand">全自动执行</span>
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-400 md:text-base">
          5 步流程，你只做第一步 —— 提出目标。剩下的交给 AI。
        </p>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute left-0 right-0 top-10 hidden h-px bg-gradient-to-r from-transparent via-brand-500/30 to-transparent md:block" />

        <div className="grid gap-4 md:grid-cols-5">
          {WORKFLOW_STEPS.map((step, idx) => (
            <div
              key={step.step}
              className="relative rounded-2xl border border-white/5 bg-white/[0.02] p-6 text-center"
              style={{
                animation: `slideUp 0.6s ease-out ${idx * 60}ms both`,
              }}
            >
              <div className="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-brand-400/30 bg-brand-400/10 text-lg font-bold text-brand-300">
                {step.step.replace("STEP ", "")}
              </div>
              <h3 className="text-base font-semibold text-white">{step.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-gray-400">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
