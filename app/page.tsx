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

  return (
    <main 
      className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-center"
      style={{ 
        background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 40%, #0f0f23 100%)",
      }}
    >
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 30%, rgba(139, 92, 246, 0.15) 0%, transparent 50%)",
        }}
      />
      
      <div className="absolute top-20 left-1/4 w-2 h-2 rounded-full bg-purple-400/40 animate-pulse" />
      <div className="absolute top-40 right-1/3 w-1.5 h-1.5 rounded-full bg-pink-400/30 animate-pulse" style={{ animationDelay: "0.5s" }} />
      <div className="absolute bottom-1/3 left-1/3 w-1 h-1 rounded-full bg-blue-400/40 animate-pulse" style={{ animationDelay: "1s" }} />
      <div className="absolute top-1/2 right-1/4 w-2 h-2 rounded-full bg-violet-400/20 animate-pulse" style={{ animationDelay: "1.5s" }} />

      <div 
        className={`relative z-10 flex flex-col items-center text-center px-6 max-w-md transition-all duration-1000 ${
          loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div 
          className="w-28 h-28 rounded-full flex items-center justify-center mb-8 mx-auto"
          style={{
            background: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
            boxShadow: "0 0 60px rgba(139, 92, 246, 0.4)",
          }}
        >
          <span className="text-6xl">💕</span>
        </div>

        <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
          星野
        </h1>
        <p className="text-lg text-white/60 mb-2 font-light">
          你的AI伴侣
        </p>
        <p className="text-sm text-white/40 mb-12 leading-relaxed">
          永远陪伴，懂你所想<br />
          一个真正有温度的灵魂伴侣
        </p>

        <div className="w-full space-y-3">
          <button
            onClick={handleStart}
            className="w-full py-4 rounded-2xl text-white font-medium text-base transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
              boxShadow: "0 8px 32px rgba(139, 92, 246, 0.3)",
            }}
          >
            开始使用
          </button>

          <button
            onClick={handleLogin}
            className="w-full py-4 rounded-2xl text-white/80 font-medium text-base transition-all hover:bg-white/5"
            style={{
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            已有账号？登录
          </button>
        </div>

        <div className="mt-16 flex items-center justify-center gap-8 text-white/30 text-xs">
          <div className="flex flex-col items-center gap-1">
            <span className="text-xl">💬</span>
            <span>暖心聊天</span>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="flex flex-col items-center gap-1">
            <span className="text-xl">🎤</span>
            <span>语音陪伴</span>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="flex flex-col items-center gap-1">
            <span className="text-xl">🎭</span>
            <span>生动形象</span>
          </div>
        </div>
      </div>

      <p className="absolute bottom-6 text-white/20 text-xs">
        © 2024 星野 · 用AI温暖每一个孤独的灵魂
      </p>
    </main>
  );
}
