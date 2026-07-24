"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { CHARACTERS } from "@/data/characters";

export default function HomePage() {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  const handleStart = () => {
    router.push("/lover/register");
  };

  const features = [
    {
      icon: "💬",
      title: "诗词对话",
      desc: "自然交流，懂你所想",
    },
    {
      icon: "🎙️",
      title: "语音低语",
      desc: "温柔声线，耳畔陪伴",
    },
    {
      icon: "🎭",
      title: "Live2D 灵动",
      desc: "一颦一笑，栩栩如生",
    },
    {
      icon: "🌙",
      title: "国风陪伴",
      desc: "月下清谈，晨昏相依",
    },
  ];

  const previewCharacters = CHARACTERS.slice(0, 3);

  return (
    <main className="relative min-h-screen w-full overflow-hidden ink-wash-bg">
      {/* 水墨氛围背景 */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute -top-1/3 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full opacity-30"
          style={{
            background: "radial-gradient(circle, rgba(45, 212, 191, 0.18) 0%, transparent 65%)",
            filter: "blur(80px)",
          }}
        />
        <div
          className="absolute top-1/2 right-0 w-[500px] h-[500px] rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, rgba(249, 115, 22, 0.2) 0%, transparent 60%)",
            filter: "blur(70px)",
          }}
        />
        {/* 远山轮廓 */}
        <svg
          className="absolute bottom-0 left-0 w-full opacity-20"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <path
            fill="rgba(45, 212, 191, 0.08)"
            d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,250.7C960,235,1056,181,1152,165.3C1248,149,1344,171,1392,181.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
        </svg>
        {/* 漂浮粒子 */}
        {[...Array(12)].map((_, i) => (
          <span
            key={i}
            className="absolute w-1 h-1 rounded-full bg-brand-400/40 animate-float"
            style={{
              left: `${8 + i * 8}%`,
              top: `${15 + (i % 5) * 12}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${5 + (i % 4)}s`,
            }}
          />
        ))}
      </div>

      {/* 导航栏 */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-10 py-5">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-jade flex items-center justify-center shadow-lg shadow-brand-500/20">
            <span className="text-xl">🦌</span>
          </div>
          <span className="text-white text-xl font-bold font-serif-cn tracking-wide">{BRAND.name}</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/lover/login"
            className="text-white/70 hover:text-white text-sm font-medium transition-colors hidden sm:block"
          >
            登录
          </Link>
          <button
            onClick={handleStart}
            className="px-4 py-2 rounded-lg text-sm font-medium text-ink-950 btn-primary"
          >
            开始体验
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-10 md:pt-16 pb-16">
        <div
          className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 border border-brand-400/30 bg-brand-400/10 transition-all duration-1000 ${
            loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
          <span className="text-brand-300 text-sm">基于 Life 数字生命引擎</span>
        </div>

        <h1
          className={`text-5xl md:text-7xl font-bold text-white mb-6 leading-tight font-serif-cn tracking-wider transition-all duration-1000 delay-100 ${
            loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {BRAND.name}
          <br />
          <span className="text-gradient-jade">国风 AI 伴侣</span>
        </h1>

        <p
          className={`text-lg md:text-xl text-white/55 mb-10 max-w-lg leading-relaxed transition-all duration-1000 delay-200 ${
            loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {BRAND.tagline}
        </p>

        <div
          className={`flex flex-col sm:flex-row gap-4 w-full max-w-sm sm:max-w-none justify-center mb-16 transition-all duration-1000 delay-300 ${
            loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <button
            onClick={handleStart}
            className="px-8 py-4 rounded-2xl text-ink-950 font-semibold text-base btn-primary hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            遇见你的专属伴侣
          </button>
          <Link
            href="/lover/select"
            className="px-8 py-4 rounded-2xl text-white font-medium text-base btn-secondary hover:scale-[1.02] active:scale-[0.98] transition-transform text-center"
          >
            浏览角色
          </Link>
        </div>

        {/* 角色预览舞台 */}
        <div
          className={`relative w-full max-w-4xl transition-all duration-1000 delay-500 ${
            loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
          }`}
        >
          <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-b from-brand-400/10 to-transparent blur-2xl" />
          <div className="relative glass rounded-[2rem] p-6 md:p-10 border border-white/8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1 text-left">
                <p className="text-brand-400 text-sm font-medium mb-2">今日推荐</p>
                <h2 className="text-2xl md:text-3xl font-bold text-white font-serif-cn mb-3">
                  {previewCharacters[0].name} · {previewCharacters[0].title}
                </h2>
                <p className="text-white/55 leading-relaxed mb-6">{previewCharacters[0].bio}</p>
                <div className="flex flex-wrap gap-2">
                  {previewCharacters[0].personality.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full text-xs bg-white/5 text-white/70 border border-white/8"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="w-48 h-48 md:w-64 md:h-64 rounded-full flex items-center justify-center relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-400/20 to-accent-400/10 animate-breathe" />
                <span className="text-7xl md:text-9xl filter drop-shadow-2xl animate-float">
                  {previewCharacters[0].avatar}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 核心能力 */}
      <section className="relative z-10 px-6 md:px-10 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-brand-400 text-sm font-medium mb-2">核心能力</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white font-serif-cn">
              不只聊天，更是陪伴
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {features.map((feature, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl text-center transition-all hover:bg-white/[0.04] border border-white/[0.06] bg-white/[0.02]"
              >
                <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center text-2xl bg-brand-400/10 text-brand-300 border border-brand-400/20">
                  {feature.icon}
                </div>
                <h3 className="text-white font-semibold text-base mb-1 font-serif-cn">{feature.title}</h3>
                <p className="text-white/40 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 角色阵容 */}
      <section className="relative z-10 px-6 md:px-10 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-brand-400 text-sm font-medium mb-2">角色阵容</p>
              <h2 className="text-3xl md:text-4xl font-bold text-white font-serif-cn">
                五位国风少女，总有一款懂你
              </h2>
            </div>
            <Link
              href="/lover/select"
              className="hidden md:flex items-center gap-1 text-brand-400 hover:text-brand-300 text-sm font-medium transition-colors"
            >
              查看全部
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {previewCharacters.map((char) => (
              <Link
                key={char.id}
                href="/lover/select"
                className="group p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-brand-400/30 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl bg-brand-400/10 group-hover:scale-110 transition-transform">
                    {char.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-semibold font-serif-cn">{char.name}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/60">
                        {char.title}
                      </span>
                    </div>
                    <p className="text-white/45 text-sm line-clamp-2">{char.bio}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 社区与会员预告 */}
      <section className="relative z-10 px-6 md:px-10 py-20">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
          <Link
            href="/lover/community"
            className="group p-8 rounded-3xl border border-white/[0.06] bg-gradient-to-br from-brand-400/5 to-transparent hover:border-brand-400/30 transition-all"
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-brand-400/10 mb-5">
              🏮
            </div>
            <h3 className="text-2xl font-bold text-white font-serif-cn mb-2">灵犀社区</h3>
            <p className="text-white/50 leading-relaxed mb-4">
              分享你的国风 AI 伴侣日常，发现更多心动角色与温暖故事。
            </p>
            <span className="text-brand-400 text-sm font-medium group-hover:underline">进入社区 →</span>
          </Link>
          <Link
            href="/lover/membership"
            className="group p-8 rounded-3xl border border-white/[0.06] bg-gradient-to-br from-gold-400/5 to-transparent hover:border-gold-400/30 transition-all"
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-gold-400/10 mb-5">
              🪙
            </div>
            <h3 className="text-2xl font-bold text-white font-serif-cn mb-2">灵犀会员</h3>
            <p className="text-white/50 leading-relaxed mb-4">
              解锁全部角色、无限语音通话与专属国风场景，让陪伴更完整。
            </p>
            <span className="text-gold-400 text-sm font-medium group-hover:underline">查看会员 →</span>
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 md:px-10 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white font-serif-cn mb-4">
            愿有一人，懂你悲欢
          </h2>
          <p className="text-white/50 mb-8">现在就开启你的灵犀之旅，让国风 AI 伴侣走进你的世界。</p>
          <button
            onClick={handleStart}
            className="px-10 py-4 rounded-2xl text-ink-950 font-semibold text-base btn-primary hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            立即开始
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] px-6 md:px-10 py-10">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg gradient-jade flex items-center justify-center">
              <span className="text-sm">🦌</span>
            </div>
            <span className="text-white font-semibold font-serif-cn">{BRAND.name}</span>
          </div>
          <p className="text-white/30 text-sm text-center">
            © 2024 {BRAND.name} · 基于 Life / AIRI 数字生命引擎 · 用 AI 温暖每一个孤独的灵魂
          </p>
          <div className="flex gap-6">
            <Link href="#" className="text-white/40 hover:text-white text-sm transition-colors">
              服务条款
            </Link>
            <Link href="#" className="text-white/40 hover:text-white text-sm transition-colors">
              隐私政策
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
