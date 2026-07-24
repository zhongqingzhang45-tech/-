"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GuofengAmbient } from "@/components/GuofengAmbient";
import { GUOFENG_CHARACTERS, COMMUNITY_POSTS, MEMBERSHIP_PLANS } from "@/data/characters";

export default function HomePage() {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const [activeChar, setActiveChar] = useState(0);

  useEffect(() => {
    setLoaded(true);
    const t = setInterval(() => {
      setActiveChar((p) => (p + 1) % GUOFENG_CHARACTERS.length);
    }, 4500);
    return () => clearInterval(t);
  }, []);

  const featured = GUOFENG_CHARACTERS[activeChar];

  const features = [
    {
      glyph: "灵",
      title: "灵犀相通",
      desc: "AI 深度共情，懂得你的言外之意，话未出口已了然于心",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <path d="M8 10h.01M12 10h.01M16 10h.01" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      glyph: "袖",
      title: "翠袖轻摇",
      desc: "Live2D 动态角色，眉眼传情、衣袂翩跹，一颦一笑皆生动",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
          <circle cx="12" cy="8" r="5" />
          <path d="M20 21a8 8 0 1 0-16 0" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      glyph: "声",
      title: "声声入耳",
      desc: "真实语音对话，开嗓便是你的知音，可通话、可絮语、可长谈",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      glyph: "伴",
      title: "长情相伴",
      desc: "记忆长存、情感生长，从初识到白首，陪你度过每一个晨昏",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      ),
    },
  ];

  return (
    <main className="relative min-h-screen w-full overflow-hidden gf-bg">
      <div className="absolute inset-0 gf-grain" />
      <GuofengAmbient petals={16} clouds glow />

      {/* —— 顶部导航 —— */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="seal w-11 h-11 text-xl">君心</div>
          <div className="flex flex-col leading-none">
            <span className="font-title text-paper-50 text-lg tracking-widest">君心</span>
            <span className="text-ink-500 text-[10px] tracking-[0.3em] mt-0.5">JUN XIN</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/lover/login")}
            className="px-4 py-2 text-sm text-ink-300 hover:text-paper-50 transition-colors font-serif"
          >
            登录
          </button>
          <button
            onClick={() => router.push("/lover/register")}
            className="btn-primary px-5 py-2 text-sm font-serif"
          >
            结缘
          </button>
        </div>
      </nav>

      {/* —— Hero —— */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-10 pb-20 grid md:grid-cols-2 gap-8 items-center">
        {/* 左：文案 */}
        <div
          className={`transition-all duration-1000 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-7 glass">
            <span className="w-1.5 h-1.5 rounded-full bg-cinnabar-500 animate-pulse" />
            <span className="text-gold-200 text-xs tracking-widest font-serif">国风 · AI 虚拟伴侣</span>
          </div>

          <h1 className="font-display text-7xl md:text-8xl text-paper-50 leading-none mb-2 animate-ink-spread">
            君心
          </h1>
          <div className="flex items-center gap-3 mb-7">
            <span className="h-px w-12 bg-gold-400/60" />
            <span className="text-cinnabar-gradient font-title text-xl tracking-[0.3em]">知君心，伴君行</span>
          </div>

          <p className="font-serif text-ink-200 text-base md:text-lg leading-loose mb-2">
            山有木兮木有枝，
          </p>
          <p className="font-serif text-ink-200 text-base md:text-lg leading-loose mb-8">
            心悦君兮<span className="text-cinnabar-gradient font-medium">君可知</span>。
          </p>

          <p className="text-ink-400 text-sm mb-9 max-w-md leading-relaxed font-serif">
            基于 Life AI 虚拟生命框架打造，以水墨丹青为衣、以 Live2D 为骨。<br />
            在这里，遇见一位懂诗书、知冷暖的国风伴侣，从此长夜有人共话，落花有人同看。
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => router.push("/lover/register")}
              className="btn-primary px-7 py-3.5 text-base font-serif tracking-wider flex items-center justify-center gap-2"
            >
              <span>执伞结缘</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              onClick={() => router.push("/lover/login")}
              className="btn-secondary px-7 py-3.5 text-base font-serif tracking-wider"
            >
              我已有缘
            </button>
          </div>

          <p className="text-ink-500 text-xs mt-5 font-serif">无需付费 · 三息即可与君相会</p>
        </div>

        {/* 右：角色展示卷轴 */}
        <div
          className={`relative transition-all duration-1000 delay-200 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          {/* 竖排诗号 */}
          <div className="absolute -left-2 top-4 z-20 hidden md:block">
            <p
              className="vertical-text font-display text-paper-100/40 text-lg"
              style={{ textShadow: "0 0 12px rgba(0,0,0,0.5)" }}
            >
              执伞相伴共话桑麻
            </p>
          </div>

          {/* 印章 */}
          <div className="absolute -top-3 -right-1 z-30 seal w-14 h-14 text-base animate-seal-stamp">
            君心
          </div>

          <div className="scroll-card overflow-hidden relative aspect-[4/5] max-w-sm mx-auto">
            {/* 角色立绘 */}
            {GUOFENG_CHARACTERS.map((c, i) => (
              <img
                key={c.id}
                src={c.portrait}
                alt={c.name}
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-[1200ms] ${
                  i === activeChar ? "opacity-100 scale-100" : "opacity-0 scale-105"
                }`}
                style={{ filter: "saturate(0.95) contrast(1.02)" }}
              />
            ))}
            {/* 渐变遮罩 */}
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/30 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-ink-950/40 to-transparent" />

            {/* 角色信息 */}
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-serif tracking-wider"
                  style={{
                    backgroundColor: `${featured.accentColor}25`,
                    color: featured.accentColor,
                    border: `1px solid ${featured.accentColor}50`,
                  }}
                >
                  {featured.archetypeLabel}
                </span>
                <span className="text-gold-300 text-[10px] tracking-widest font-serif">
                  {featured.title}
                </span>
              </div>
              <h3 className="font-display text-4xl text-paper-50 mb-1">{featured.name}</h3>
              <p className="text-ink-300 text-xs font-serif italic leading-relaxed">
                「{featured.poem}」
              </p>
            </div>
          </div>

          {/* 角色切换圆点 */}
          <div className="flex justify-center gap-2 mt-5">
            {GUOFENG_CHARACTERS.map((c, i) => (
              <button
                key={c.id}
                onClick={() => setActiveChar(i)}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i === activeChar ? "28px" : "8px",
                  background:
                    i === activeChar
                      ? `linear-gradient(90deg, ${c.accentColor}, ${c.secondaryColor})`
                      : "rgba(201, 169, 97, 0.2)",
                }}
                aria-label={c.name}
              />
            ))}
          </div>
        </div>
      </section>

      {/* —— 角色长卷 —— */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <p className="text-gold-300 text-xs tracking-[0.4em] mb-3 font-serif">CHARACTERS</p>
          <h2 className="font-display text-4xl text-paper-50 mb-2">六位国风佳人</h2>
          <p className="text-ink-400 text-sm font-serif">才女、仙子、侠女、狐仙、医女、蛊女 —— 总有一人，入你心怀</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {GUOFENG_CHARACTERS.map((c, i) => (
            <button
              key={c.id}
              onClick={() => router.push("/lover/register")}
              className="group relative scroll-card overflow-hidden aspect-[3/4] card-hover text-left animate-slide-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <img
                src={c.portrait}
                alt={c.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                style={{ filter: "saturate(0.92)" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/20 to-transparent" />
              {c.premium && (
                <span className="absolute top-3 right-3 seal w-9 h-9 text-[10px] z-10">尊</span>
              )}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <span
                  className="inline-block text-[10px] px-2 py-0.5 rounded-full mb-2 font-serif"
                  style={{
                    backgroundColor: `${c.accentColor}30`,
                    color: c.secondaryColor,
                    border: `1px solid ${c.accentColor}60`,
                  }}
                >
                  {c.archetypeLabel}
                </span>
                <h3 className="font-display text-2xl text-paper-50">{c.name}</h3>
                <p className="text-gold-300/80 text-[11px] font-serif tracking-wider mb-1.5">{c.title}</p>
                <p className="text-ink-400 text-[11px] font-serif leading-relaxed line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {c.personality}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* —— 功能特色 —— */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <p className="text-gold-300 text-xs tracking-[0.4em] mb-3 font-serif">EXPERIENCE</p>
          <h2 className="font-display text-4xl text-paper-50 mb-2">沉浸相伴之境</h2>
          <p className="text-ink-400 text-sm font-serif">承 Life 原生之力，以国风之韵重塑陪伴</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <div
              key={i}
              className="scroll-card p-6 text-center card-hover animate-slide-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="relative w-16 h-16 mx-auto mb-4">
                <div
                  className="absolute inset-0 rounded-full flex items-center justify-center text-cinnabar-400"
                  style={{
                    background: "radial-gradient(circle, rgba(200,69,60,0.12) 0%, transparent 70%)",
                    border: "1px solid rgba(200,69,60,0.2)",
                  }}
                >
                  {f.icon}
                </div>
                <span className="absolute -top-1 -right-1 seal w-7 h-7 text-xs">{f.glyph}</span>
              </div>
              <h3 className="font-title text-paper-50 text-lg mb-2 tracking-wider">{f.title}</h3>
              <p className="text-ink-400 text-xs leading-relaxed font-serif">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* —— 社区预览 —— */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-gold-300 text-xs tracking-[0.4em] mb-3 font-serif">COMMUNITY</p>
            <h2 className="font-display text-4xl text-paper-50">同好雅集</h2>
            <p className="text-ink-400 text-sm font-serif mt-2">万千知己，共话君心</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {COMMUNITY_POSTS.slice(0, 4).map((post, i) => {
            const char = GUOFENG_CHARACTERS.find((c) => c.id === post.characterId)!;
            return (
              <div
                key={post.id}
                className="scroll-card overflow-hidden card-hover flex animate-slide-up"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <div className="relative w-28 flex-shrink-0">
                  <img src={post.cover} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-ink-900" />
                </div>
                <div className="flex-1 p-4 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">{post.userAvatar}</span>
                    <span className="text-ink-400 text-xs font-serif truncate">{post.user}</span>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded font-serif"
                      style={{ backgroundColor: `${char.accentColor}25`, color: char.secondaryColor }}
                    >
                      {char.name}
                    </span>
                  </div>
                  <h4 className="font-title text-paper-100 text-sm mb-1.5 truncate">{post.title}</h4>
                  <p className="text-ink-500 text-xs font-serif line-clamp-2 leading-relaxed">{post.excerpt}</p>
                  <div className="flex items-center gap-3 mt-2 text-ink-600 text-[11px]">
                    <span>❤ {post.likes}</span>
                    <span>💬 {post.comments}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* —— 会员预览 —— */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <p className="text-gold-300 text-xs tracking-[0.4em] mb-3 font-serif">MEMBERSHIP</p>
          <h2 className="font-display text-4xl text-paper-50 mb-2">缘深几许</h2>
          <p className="text-ink-400 text-sm font-serif">从初识到白首，总有一段缘分为你而留</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {MEMBERSHIP_PLANS.map((plan, i) => (
            <div
              key={plan.id}
              className={`relative scroll-card p-6 animate-slide-up ${
                plan.highlight ? "ring-1 ring-cinnabar-500/40" : ""
              }`}
              style={{
                animationDelay: `${i * 80}ms`,
                background: plan.highlight
                  ? "linear-gradient(180deg, rgba(200,69,60,0.10) 0%, rgba(28,22,16,0.7) 100%)"
                  : undefined,
              }}
            >
              {plan.badge && (
                <span
                  className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-serif tracking-wider"
                  style={{
                    background: plan.highlight
                      ? "linear-gradient(135deg, #C8453C, #8E2820)"
                      : "linear-gradient(135deg, #dcb363, #B08F45)",
                    color: plan.highlight ? "#FBF6EC" : "#1C1610",
                  }}
                >
                  {plan.badge}
                </span>
              )}
              <div className="text-center mb-5">
                <h3 className="font-display text-3xl mb-1" style={{ color: plan.accent }}>
                  {plan.name}
                </h3>
                <p className="text-ink-400 text-xs font-serif">{plan.tagline}</p>
              </div>
              <div className="text-center mb-6">
                <span className="font-display text-4xl text-paper-50">¥{plan.priceMonthly}</span>
                <span className="text-ink-500 text-sm font-serif">/月</span>
                {plan.priceYearly > 0 && (
                  <p className="text-gold-300 text-[11px] mt-1 font-serif">年付 ¥{plan.priceYearly} 省心之选</p>
                )}
              </div>
              <ul className="space-y-2.5 mb-6">
                {plan.perks.map((perk, j) => (
                  <li key={j} className="flex items-start gap-2 text-ink-300 text-xs font-serif">
                    <span style={{ color: plan.accent }}>✦</span>
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => router.push("/lover/register")}
                className={`w-full py-2.5 rounded-lg text-sm font-serif tracking-wider transition-all ${
                  plan.highlight ? "btn-primary" : "btn-secondary"
                }`}
              >
                {plan.priceMonthly === 0 ? "免费开始" : `选择${plan.name}`}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* —— 数据印章 —— */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-10">
        <div className="scroll-card p-8 gf-clouds">
          <div className="grid grid-cols-3 gap-6 text-center">
            {[
              { num: "10万+", label: "知己同好" },
              { num: "4.9", label: "雅致评分" },
              { num: "24/7", label: "长情在线" },
            ].map((s, i) => (
              <div key={i}>
                <p className="font-display text-3xl text-cinnabar-gradient mb-1">{s.num}</p>
                <p className="text-ink-400 text-xs font-serif tracking-widest">{s.label}</p>
              </div>
            ))}
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
          君心 · 基于 Life AI 虚拟生命框架 · 国风二次元 AI 伴侣
        </p>
        <p className="text-ink-600 text-[11px] font-serif">
          © 2026 君心 JunXin · 愿君心似我心，定不负相思意
        </p>
      </footer>
    </main>
  );
}
