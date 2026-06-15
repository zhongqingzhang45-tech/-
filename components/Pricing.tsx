"use client";

import { PRICING_TIERS } from "@/data/content";

export function Pricing() {
  const handleSubscribe = (tier: (typeof PRICING_TIERS)[0]) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("lifeos-open-payment", {
          detail: {
            planId: tier.id,
            planName: tier.name,
            planPrice: tier.price.replace("¥", "").replace("联系顾问", "0"),
          },
        })
      );
    }
  };

  return (
    <section id="lifeos-pricing" className="mx-auto mt-32 w-full max-w-6xl px-6">
      <div className="mb-12 text-center">
        <div className="mb-2 text-xs uppercase tracking-[0.25em] text-brand-400">
          Pricing
        </div>
        <h2 className="text-3xl font-semibold text-white md:text-4xl">
          选择适合你的<span className="text-gradient-brand"> 方案</span>
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-400 md:text-base">
          从个人创业者到大型企业，不同阶段灵活切换。随时升级，随时降级。
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {PRICING_TIERS.map((tier, idx) => (
          <div
            key={tier.id}
            className={`relative flex flex-col overflow-hidden rounded-3xl border p-7 transition ${
              tier.highlight
                ? "border-brand-400/50 bg-gradient-to-b from-brand-400/10 via-white/[0.03] to-transparent shadow-glow"
                : "border-white/5 bg-white/[0.02] hover:border-white/15"
            }`}
            style={{
              animation: `slideUp 0.6s ease-out ${idx * 60}ms both`,
            }}
          >
            {tier.highlight && (
              <div className="absolute right-5 top-5 rounded-full bg-brand-400 px-2.5 py-1 text-[10px] font-bold text-ink-950">
                推荐
              </div>
            )}

            <div className="text-sm font-medium text-gray-300">{tier.name}</div>
            <div className="mt-4 flex items-baseline gap-1">
              <span
                className="text-4xl font-bold"
                style={{ color: tier.accent }}
              >
                {tier.price}
              </span>
              <span className="text-xs text-gray-500">{tier.unit}</span>
            </div>

            <ul className="mt-6 space-y-2.5 text-sm text-gray-300">
              {tier.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span
                    className="mt-1 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: `${tier.accent}30`, color: tier.accent }}
                  >
                    <span className="text-[8px]">✓</span>
                  </span>
                  <span className="leading-relaxed">{f}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe(tier)}
              className={`mt-7 w-full rounded-xl py-2.5 text-sm font-medium transition ${
                tier.highlight
                  ? "bg-gradient-to-r from-brand-400 to-brand-500 text-ink-950 hover:brightness-110"
                  : "border border-white/10 text-white hover:border-brand-400/40 hover:text-brand-300"
              }`}
            >
              {tier.cta}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
