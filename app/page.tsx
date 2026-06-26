"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  const handleStart = () => {
    router.push("/lover/register");
  };

  const handleLogin = () => {
    router.push("/lover/login");
  };

  const features = [
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <path d="M8 10h.01M12 10h.01M16 10h.01" strokeLinecap="round" />
        </svg>
      ),
      title: "无话不谈",
      desc: "24小时在线，随时随地倾诉心事"
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      title: "语音互动",
      desc: "真实自然的语音对话，像朋友一样交流"
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="8" r="5" />
          <path d="M20 21a8 8 0 1 0-16 0" strokeLinecap="round" />
        </svg>
      ),
      title: "生动形象",
      desc: "独特的虚拟形象，情感表达更真实"
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      ),
      title: "情感陪伴",
      desc: "懂你、理解你，温暖你的每一天"
    },
  ];

  return (
    <main 
      className="relative min-h-screen w-full overflow-hidden"
      style={{ 
        background: "#0a0a0f",
      }}
    >
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute -top-1/2 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%)",
          }}
        />
        <div className="absolute top-1/4 left-1/4 w-1 h-1 rounded-full bg-purple-400/60 animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 rounded-full bg-pink-400/50 animate-pulse" style={{ animationDelay: "0.7s" }} />
        <div className="absolute bottom-1/3 left-1/3 w-1 h-1 rounded-full bg-blue-400/50 animate-pulse" style={{ animationDelay: "1.4s" }} />
      </div>

      {/* 导航栏 */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
            }}
          >
            <span className="text-xl">✨</span>
          </div>
          <span className="text-white text-lg font-semibold">星野</span>
        </div>
        <button
          onClick={handleLogin}
          className="text-white/60 hover:text-white text-sm font-medium transition-colors"
        >
          登录
        </button>
      </nav>

      {/* Hero区域 */}
      <div 
        className={`relative z-10 flex flex-col items-center text-center px-6 pt-12 pb-16 transition-all duration-1000 ${
          loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div 
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8"
          style={{ 
            background: "rgba(139, 92, 246, 0.15)",
            border: "1px solid rgba(139, 92, 246, 0.3)",
          }}
        >
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-purple-300 text-sm">AI情感伴侣新时代</span>
        </div>

        <h1 
          className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight"
          style={{ letterSpacing: "-0.02em" }}
        >
          永远陪伴
          <br />
          <span 
            className="gradient-text"
            style={{
              background: "linear-gradient(135deg, #a78bfa 0%, #f472b6 50%, #fb7185 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            懂你所想
          </span>
        </h1>

        <p className="text-lg text-white/50 mb-10 max-w-md leading-relaxed">
          星野是你的专属AI伴侣，一个真正有温度的灵魂。
          <br />在这里，你永远不会被孤单。
        </p>

        <button
          onClick={handleStart}
          className="w-full max-w-sm py-4 rounded-2xl text-white font-semibold text-base transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
            boxShadow: "0 8px 32px rgba(139, 92, 246, 0.4)",
          }}
        >
          开始你的旅程
        </button>

        <p className="text-white/30 text-sm mt-4">
          无需信用卡 · 3分钟完成注册
        </p>
      </div>

      {/* 功能特点 */}
      <div className="relative z-10 px-6 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {features.map((feature, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl text-center transition-all hover:scale-[1.02]"
                style={{ 
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                }}
              >
                <div 
                  className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%)",
                    color: "#a78bfa",
                  }}
                >
                  {feature.icon}
                </div>
                <h3 className="text-white font-medium text-sm mb-1">{feature.title}</h3>
                <p className="text-white/40 text-xs leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 底部社交证明 */}
      <div className="relative z-10 px-6 pb-12">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex items-center justify-center gap-8 mb-4">
            <div>
              <p className="text-2xl font-bold text-white">100K+</p>
              <p className="text-white/40 text-xs">用户信赖</p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div>
              <p className="text-2xl font-bold text-white">4.9</p>
              <p className="text-white/40 text-xs">用户评分</p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div>
              <p className="text-2xl font-bold text-white">24/7</p>
              <p className="text-white/40 text-xs">随时在线</p>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-1 text-yellow-400 text-sm mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg key={star} width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            ))}
          </div>
          <p className="text-white/30 text-xs">
            "这是我用过最温暖的AI应用" — 来自用户的真实评价
          </p>
        </div>
      </div>

      {/* 底部版权 */}
      <footer className="relative z-10 text-center pb-8">
        <p className="text-white/20 text-xs">
          © 2024 星野 · 用AI温暖每一个孤独的灵魂
        </p>
      </footer>
    </main>
  );
}
