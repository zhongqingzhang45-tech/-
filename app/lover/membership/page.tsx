"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BRAND } from "@/lib/brand";
import { MEMBERSHIP_PLANS, MembershipPlan } from "@/data/membership";

function PlanCard({ plan, index }: { plan: MembershipPlan; index: number }) {
  const isPopular = plan.popular;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className={`relative rounded-3xl p-6 border transition-all hover:scale-[1.01] ${
        isPopular
          ? "bg-gradient-to-b from-gold-400/10 to-transparent border-gold-400/30"
          : "glass border-white/[0.06] hover:border-brand-400/20"
      }`}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold text-ink-950 bg-gradient-to-r from-gold-400 to-amber-400">
          最受欢迎
        </div>
      )}

      <div className="mb-5">
        <div
          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium mb-3 ${
            isPopular ? "bg-gold-400/10 text-gold-400" : "bg-brand-400/10 text-brand-400"
          }`}
        >
          {plan.badge}
        </div>
        <h3 className="text-2xl font-bold text-white font-serif-cn mb-1">{plan.name}</h3>
        <p className="text-white/50 text-sm">{plan.description}</p>
      </div>

      <div className="mb-6">
        <span className="text-4xl font-bold text-white">{plan.unit}{plan.price}</span>
        <span className="text-white/50 text-sm">/{plan.period}</span>
      </div>

      <ul className="space-y-3 mb-6">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-sm text-white/70">
            <span className={isPopular ? "text-gold-400" : "text-brand-400"}>✓</span>
            <span>{feature}</span>
          </li>
        ))}
        {plan.unavailable?.map((item) => (
          <li key={item} className="flex items-start gap-3 text-sm text-white/30">
            <span>×</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <button
        className={`w-full py-3 rounded-xl font-semibold transition-all active:scale-[0.98] ${
          isPopular
            ? "text-ink-950 bg-gradient-to-r from-gold-400 to-amber-400 hover:shadow-lg hover:shadow-gold-400/20"
            : "text-ink-950 btn-primary"
        }`}
      >
        {plan.price === 0 ? "免费开始" : "立即开通"}
      </button>
    </motion.div>
  );
}

export default function MembershipPage() {
  return (
    <div className="min-h-screen w-full ink-wash-bg">
      {/* 背景氛围 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[700px] rounded-full opacity-25"
          style={{
            background: "radial-gradient(circle, rgba(251, 191, 36, 0.12) 0%, transparent 60%)",
            filter: "blur(80px)",
          }}
        />
      </div>

      {/* 导航栏 */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-10 py-5">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-jade flex items-center justify-center shadow-lg shadow-brand-500/20">
            <span className="text-xl">🦌</span>
          </div>
          <span className="text-white text-xl font-bold font-serif-cn tracking-wide">{BRAND.name}</span>
        </Link>
        <Link
          href="/lover"
          className="text-ink-300 hover:text-white text-sm font-medium transition-colors"
        >
          返回伴侣空间
        </Link>
      </nav>

      <main className="relative z-10 px-6 md:px-10 py-8 pb-20">
        <div className="max-w-5xl mx-auto">
          {/* 标题区 */}
          <div className="text-center mb-12">
            <p className="text-gold-400 text-sm font-medium mb-2">灵犀会员</p>
            <h1 className="text-3xl md:text-5xl font-bold text-white font-serif-cn mb-4">
              解锁完整陪伴体验
            </h1>
            <p className="text-white/50 max-w-lg mx-auto">
              从初识到良缘，选择适合你的会员方案，让国风 AI 伴侣的陪伴更加完整。
            </p>
          </div>

          {/* 方案卡片 */}
          <div className="grid md:grid-cols-3 gap-5 mb-16">
            {MEMBERSHIP_PLANS.map((plan, index) => (
              <PlanCard key={plan.id} plan={plan} index={index} />
            ))}
          </div>

          {/* 权益对比 */}
          <div className="glass rounded-3xl p-6 md:p-8 border border-white/[0.06]">
            <h2 className="text-xl font-bold text-white font-serif-cn mb-6 text-center">
              权益对比
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left py-3 px-4 text-white/50 font-medium">权益</th>
                    {MEMBERSHIP_PLANS.map((plan) => (
                      <th key={plan.id} className="text-center py-3 px-4 text-white font-serif-cn">
                        {plan.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "文字聊天", values: ["每日 50 条", "无限", "无限"] },
                    { label: "语音通话", values: ["—", "每日 60 分钟", "每月额外 +120 分钟"] },
                    { label: "国风角色", values: ["2 位", "全部", "全部 + 限定"] },
                    { label: "Live2D 动作", values: ["基础", "高级", "高级"] },
                    { label: "专属场景", values: ["—", "✓", "✓"] },
                    { label: "社区发帖", values: ["仅浏览", "✓", "✓"] },
                    { label: "聊天记录保存", values: ["本地", "本地", "云端永久"] },
                    { label: "限定剧情", values: ["—", "—", "✓"] },
                  ].map((row) => (
                    <tr key={row.label} className="border-b border-white/[0.04]">
                      <td className="py-3 px-4 text-white/70">{row.label}</td>
                      {row.values.map((value, i) => (
                        <td key={i} className="text-center py-3 px-4 text-white/60">
                          {value === "✓" ? (
                            <span className="text-brand-400">✓</span>
                          ) : value === "—" ? (
                            <span className="text-white/20">—</span>
                          ) : (
                            value
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-center text-white/30 text-xs mt-8">
            会员服务自动续费，可随时取消。开通即表示同意会员服务协议。
          </p>
        </div>
      </main>
    </div>
  );
}
