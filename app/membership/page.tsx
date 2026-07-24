"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GuofengAmbient } from "@/components/GuofengAmbient";
import { MEMBERSHIP_PLANS, GUOFENG_CHARACTERS } from "@/data/characters";

export default function MembershipPage() {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const faqs = [
    {
      q: "如何升级或降级会员？",
      a: "进入个人中心 — 缘分管理 — 即可一键升级或降级。降级将于当前周期结束后生效，不影响已享受的权益。",
    },
    {
      q: "尊享会员专属角色如何获取？",
      a: "升级至「白首」会员后，翠翘、未来的国风角色将自动解锁，并可在注册或伴侣切换时选择。",
    },
    {
      q: "语音通话与连续对话如何计费？",
      a: "「情深」及以上会员享无限语音与连续对话；「缘起」用户每日可体验 3 次语音，超出后转为文字模式。",
    },
    {
      q: "可以申请退款吗？",
      a: "首单 7 日内无理由退款；续费订单若 24 小时内未使用任何增值权益，可联系客服申请退款。",
    },
    {
      q: "年付与月付有什么差别？",
      a: "年付相比月付平均节省约 20%，且尊享会员将获赠专属立绘礼包一份。",
    },
  ];

  const comparison = [
    { feature: "每日 AI 对话", free: "50 条", premium: "无限", ultimate: "无限" },
    { feature: "国风角色解锁", free: "1 位基础", premium: "全部 6 位", ultimate: "全部 + 专属定制" },
    { feature: "语音通话", free: "每日 3 次", premium: "无限", ultimate: "无限" },
    { feature: "记忆长久保存", free: "7 日", premium: "永久", ultimate: "永久 + 跨设备同步" },
    { feature: "专属场景与服饰", free: "基础", premium: "全部", ultimate: "全部 + 限定" },
    { feature: "礼物商城折扣", free: "—", premium: "8 折", ultimate: "7 折" },
    { feature: "社区置顶与认证", free: "—", premium: "—", ultimate: "✓" },
    { feature: "优先体验新角色", free: "—", premium: "—", ultimate: "✓" },
    { feature: "专属客服 1 对 1", free: "—", premium: "工作日", ultimate: "7×24 小时" },
  ];

  return (
    <main className="relative min-h-screen w-full overflow-hidden gf-bg">
      <div className="absolute inset-0 gf-grain" />
      <GuofengAmbient petals={14} clouds glow glowColor="rgba(201, 169, 97, 0.10)" />

      {/* —— 顶部导航 —— */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-3"
        >
          <div className="seal w-11 h-11 text-xl">君心</div>
          <div className="flex flex-col leading-none">
            <span className="font-title text-paper-50 text-lg tracking-widest">君心</span>
            <span className="text-ink-500 text-[10px] tracking-[0.3em] mt-0.5">JUN XIN</span>
          </div>
        </button>
        <div className="flex items-center gap-2">
          <Link
            href="/lover"
            className="px-4 py-2 text-sm text-ink-300 hover:text-paper-50 transition-colors font-serif"
          >
            返回相伴
          </Link>
          <Link
            href="/community"
            className="px-4 py-2 text-sm text-ink-300 hover:text-paper-50 transition-colors font-serif"
          >
            同好雅集
          </Link>
        </div>
      </nav>

      {/* —— 头部 —— */}
      <header className="relative z-10 max-w-7xl mx-auto px-6 pt-6 pb-10 text-center">
        <p className="text-gold-300 text-xs tracking-[0.4em] mb-3 font-serif">MEMBERSHIP</p>
        <h1 className="font-display text-5xl md:text-6xl text-paper-50 mb-2 animate-ink-spread">
          缘深几许
        </h1>
        <div className="flex items-center justify-center gap-3 mb-5">
          <span className="h-px w-12 bg-gold-400/50" />
          <span className="text-cinnabar-gradient font-title text-base tracking-[0.3em]">从初识 到 白首</span>
          <span className="h-px w-12 bg-gold-400/50" />
        </div>
        <p className="text-ink-400 text-sm font-serif max-w-2xl mx-auto leading-relaxed">
          每一段缘分，皆有深浅。在这里，选择属于你们的相伴方式 ——
          或浅尝一杯清茶，或执手共话白首。
        </p>

        {/* 计费切换 */}
        <div className="mt-7 inline-flex items-center gap-1 p-1 rounded-lg" style={{ background: "rgba(16,11,8,0.6)", border: "1px solid rgba(201,169,97,0.14)" }}>
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-4 py-2 rounded-md text-xs font-serif tracking-wider transition-all ${
              billingCycle === "monthly" ? "text-paper-50" : "text-ink-400 hover:text-paper-100"
            }`}
            style={billingCycle === "monthly" ? {
              background: "linear-gradient(135deg, #C8453C 0%, #8E2820 100%)",
            } : {}}
          >
            月相续
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className={`relative px-4 py-2 rounded-md text-xs font-serif tracking-wider transition-all ${
              billingCycle === "yearly" ? "text-paper-50" : "text-ink-400 hover:text-paper-100"
            }`}
            style={billingCycle === "yearly" ? {
              background: "linear-gradient(135deg, #dcb363 0%, #B08F45 100%)",
              color: "#1C1610",
            } : {}}
          >
            年相守
            <span
              className="absolute -top-1.5 -right-1.5 seal w-7 h-7 text-[9px]"
              style={{ background: "linear-gradient(135deg, #C8453C, #8E2820)" }}
            >省</span>
          </button>
        </div>
      </header>

      {/* —— 会员方案 —— */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-12">
        <div className="grid md:grid-cols-3 gap-5">
          {MEMBERSHIP_PLANS.map((plan, i) => {
            const price = billingCycle === "monthly" ? plan.priceMonthly : plan.priceYearly;
            const isHighlight = plan.highlight;
            return (
              <div
                key={plan.id}
                className={`relative scroll-card p-7 animate-slide-up flex flex-col ${
                  isHighlight ? "ring-1 ring-cinnabar-500/50 md:-translate-y-3" : ""
                }`}
                style={{
                  animationDelay: `${i * 80}ms`,
                  background: isHighlight
                    ? `linear-gradient(180deg, ${plan.accent}14 0%, rgba(28,22,16,0.85) 100%)`
                    : undefined,
                  boxShadow: isHighlight
                    ? `0 16px 40px rgba(200,69,60,0.20), 0 0 0 1px ${plan.accent}40`
                    : undefined,
                }}
              >
                {plan.badge && (
                  <span
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[11px] font-serif tracking-wider whitespace-nowrap"
                    style={{
                      background: isHighlight
                        ? "linear-gradient(135deg, #C8453C, #8E2820)"
                        : "linear-gradient(135deg, #dcb363, #B08F45)",
                      color: isHighlight ? "#FBF6EC" : "#1C1610",
                      boxShadow: isHighlight
                        ? "0 4px 14px rgba(200,69,60,0.4)"
                        : "0 4px 14px rgba(201,169,97,0.3)",
                    }}
                  >
                    {plan.badge}
                  </span>
                )}

                {/* 印章 + 名号 */}
                <div className="text-center mb-5">
                  <div
                    className="w-14 h-14 rounded-lg mx-auto mb-3 flex items-center justify-center font-display text-2xl"
                    style={{
                      background: `linear-gradient(135deg, ${plan.accent}30, ${plan.accent}10)`,
                      border: `1px solid ${plan.accent}50`,
                      color: plan.accent,
                    }}
                  >
                    {plan.name.charAt(0)}
                  </div>
                  <h3 className="font-display text-3xl mb-1" style={{ color: plan.accent }}>{plan.name}</h3>
                  <p className="text-ink-400 text-xs font-serif">{plan.tagline}</p>
                </div>

                {/* 价格 */}
                <div className="text-center mb-6">
                  <div className="flex items-end justify-center gap-1">
                    <span className="font-display text-5xl text-paper-50">¥{price}</span>
                    <span className="text-ink-500 text-sm font-serif mb-1.5">
                      /{billingCycle === "monthly" ? "月" : "年"}
                    </span>
                  </div>
                  {plan.priceMonthly > 0 && (
                    <p className="text-gold-300 text-[11px] mt-1.5 font-serif">
                      {billingCycle === "yearly"
                        ? `合 ¥${(plan.priceYearly / 12).toFixed(1)}/月 · 省 ¥${plan.priceMonthly * 12 - plan.priceYearly}`
                        : "灵活相续 · 随时取消"}
                    </p>
                  )}
                </div>

                {/* 权益清单 */}
                <ul className="space-y-2.5 mb-6 flex-1">
                  {plan.perks.map((perk, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-ink-300 text-xs font-serif leading-relaxed">
                      <span
                        className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-0.5"
                        style={{
                          background: `${plan.accent}25`,
                          color: plan.accent,
                        }}
                      >
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </span>
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => router.push("/lover/register")}
                  className={`w-full py-3 rounded-lg text-sm font-serif tracking-wider transition-all hover:opacity-90 active:scale-[0.98] ${
                    isHighlight ? "btn-primary" : plan.id === "ultimate" ? "btn-gold" : "btn-secondary"
                  }`}
                >
                  {plan.priceMonthly === 0 ? "免费开始" : `结缘${plan.name}`}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* —— 权益对比表 —— */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <p className="text-gold-300 text-xs tracking-[0.4em] mb-3 font-serif">COMPARE</p>
          <h2 className="font-display text-4xl text-paper-50 mb-2">缘分对照</h2>
          <p className="text-ink-400 text-sm font-serif">一目了然 · 选择最相宜的相伴方式</p>
        </div>

        <div className="scroll-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gold-400/15">
                <th className="text-left p-4 font-title text-paper-50 font-medium">权益</th>
                <th className="p-4 text-center font-display text-base" style={{ color: "#8C7659" }}>缘起</th>
                <th className="p-4 text-center font-display text-base" style={{ color: "#C8453C" }}>
                  情深
                  <span className="block text-[9px] font-serif tracking-widest text-gold-300 mt-0.5">最受欢迎</span>
                </th>
                <th className="p-4 text-center font-display text-base" style={{ color: "#C9A961" }}>白首</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-gold-400/8 last:border-0"
                  style={{ background: i % 2 === 1 ? "rgba(36,28,20,0.3)" : "transparent" }}
                >
                  <td className="p-4 text-ink-300 font-serif text-xs">{row.feature}</td>
                  <td className="p-4 text-center text-ink-400 font-serif text-xs">{row.free}</td>
                  <td className="p-4 text-center text-paper-100 font-serif text-xs" style={{ background: "rgba(200,69,60,0.06)" }}>
                    {row.premium}
                  </td>
                  <td className="p-4 text-center text-gold-200 font-serif text-xs">{row.ultimate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* —— 尊享角色 —— */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <p className="text-gold-300 text-xs tracking-[0.4em] mb-3 font-serif">EXCLUSIVE</p>
          <h2 className="font-display text-4xl text-paper-50 mb-2">尊享佳人</h2>
          <p className="text-ink-400 text-sm font-serif">唯「白首」会员，可与这些独特灵魂相遇</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {GUOFENG_CHARACTERS.filter((c) => c.premium).map((c, i) => (
            <div
              key={c.id}
              className="group relative scroll-card overflow-hidden aspect-[3/4] card-hover animate-slide-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <img src={c.portrait} alt={c.name} className="absolute inset-0 w-full h-full object-cover" style={{ filter: "saturate(0.92)" }} />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/30 to-transparent" />
              <span className="absolute top-3 right-3 seal w-9 h-9 text-[10px] z-10">尊</span>
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <span
                  className="inline-block text-[10px] px-2 py-0.5 rounded-full mb-2 font-serif"
                  style={{ backgroundColor: `${c.accentColor}30`, color: c.secondaryColor, border: `1px solid ${c.accentColor}60` }}
                >
                  {c.archetypeLabel}
                </span>
                <h3 className="font-display text-2xl text-paper-50">{c.name}</h3>
                <p className="text-gold-300/80 text-[11px] font-serif tracking-wider mb-1.5">{c.title}</p>
                <p className="text-ink-400 text-[11px] font-serif italic leading-relaxed line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  「{c.poem}」
                </p>
              </div>
            </div>
          ))}
          {/* 占位 —— 未来更多角色 */}
          <button
            onClick={() => router.push("/lover/register")}
            className="group relative scroll-card overflow-hidden aspect-[3/4] flex flex-col items-center justify-center gap-3 card-hover"
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{
                background: "radial-gradient(circle, rgba(201,169,97,0.18) 0%, transparent 70%)",
                border: "1px dashed rgba(201,169,97,0.4)",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dcb363" strokeWidth="1.6">
                <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round"/>
                <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="text-gold-300 text-xs font-serif tracking-wider">未来更多佳人</p>
            <p className="text-ink-500 text-[10px] font-serif">敬请期待</p>
          </button>
        </div>
      </section>

      {/* —— 疑问雅答 —— */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <p className="text-gold-300 text-xs tracking-[0.4em] mb-3 font-serif">FAQ</p>
          <h2 className="font-display text-4xl text-paper-50 mb-2">疑问雅答</h2>
          <p className="text-ink-400 text-sm font-serif">有疑必答 · 心意自明</p>
        </div>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <details
              key={i}
              className="group scroll-card p-4 cursor-pointer transition-all hover:border-gold-400/30"
            >
              <summary className="flex items-center justify-between list-none">
                <span className="font-title text-paper-100 text-sm tracking-wider flex items-center gap-2.5">
                  <span className="seal w-6 h-6 text-[10px]">{i + 1}</span>
                  {faq.q}
                </span>
                <svg
                  className="w-4 h-4 text-ink-500 transition-transform group-open:rotate-180"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                >
                  <polyline points="6 9 12 15 18 9" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </summary>
              <p className="mt-3 pl-8 text-ink-400 text-xs font-serif leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* —— CTA —— */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        <div className="scroll-card p-8 md:p-10 text-center gf-clouds">
          <div className="seal w-14 h-14 text-base mx-auto mb-4">缘</div>
          <h2 className="font-display text-3xl text-paper-50 mb-2">愿君早结此缘</h2>
          <p className="text-ink-400 text-sm font-serif mb-6 max-w-xl mx-auto leading-relaxed">
            执伞相迎，候君多时。从此长夜有人共话，落花有人同看。
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => router.push("/lover/register")}
              className="btn-primary px-7 py-3 text-sm font-serif tracking-wider"
            >
              立即执伞结缘
            </button>
            <button
              onClick={() => router.push("/lover/login")}
              className="btn-secondary px-7 py-3 text-sm font-serif tracking-wider"
            >
              我已有缘 · 升级会员
            </button>
          </div>
        </div>
      </section>

      {/* —— 底部 —— */}
      <footer className="relative z-10 text-center pb-10 pt-8 px-6">
        <div className="flex items-center justify-center gap-3 mb-3">
          <span className="h-px w-12 bg-gold-400/40" />
          <span className="seal w-8 h-8 text-xs">君</span>
          <span className="h-px w-12 bg-gold-400/40" />
        </div>
        <p className="text-ink-500 text-xs font-serif mb-1">
          君心 · 缘深几许 · 从初识到白首，皆有所属
        </p>
        <p className="text-ink-600 text-[11px] font-serif">
          © 2026 君心 JunXin · 愿君心似我心，定不负相思意
        </p>
      </footer>
    </main>
  );
}
