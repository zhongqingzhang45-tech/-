"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      localStorage.setItem("lover_logged_in", "true");
      localStorage.setItem("lover_email", email);
      router.push("/lover");
    }, 1000);
  };

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center px-4"
      style={{ 
        background: "#0a0a0f",
      }}
    >
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-10"
          style={{
            background: "radial-gradient(circle, rgba(139, 92, 246, 0.5) 0%, transparent 70%)",
          }}
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full opacity-10"
          style={{
            background: "radial-gradient(circle, rgba(236, 72, 153, 0.5) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
              }}
            >
              <span className="text-2xl">✨</span>
            </div>
            <span className="text-white text-2xl font-bold">星野</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">欢迎回来</h1>
          <p className="text-white/50 text-sm">登录你的账户，继续陪伴之旅</p>
        </div>

        <div 
          className="rounded-3xl p-8"
          style={{ 
            backgroundColor: "rgba(255,255,255,0.03)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                邮箱地址
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3.5 rounded-xl text-white placeholder-white/30 outline-none transition-all focus:ring-2"
                style={{ 
                  backgroundColor: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-white/80">
                  密码
                </label>
                <Link href="#" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
                  忘记密码？
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3.5 rounded-xl text-white placeholder-white/30 outline-none transition-all focus:ring-2"
                style={{ 
                  backgroundColor: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
                required
              />
            </div>

            {error && (
              <div 
                className="p-3 rounded-xl text-sm text-center"
                style={{ 
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  color: "#fca5a5",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                }}
              >
                {error}
              </div>
            )}

            <div className="flex items-center gap-2">
              <input type="checkbox" className="w-4 h-4 rounded" style={{ accentColor: "#8b5cf6" }} />
              <span className="text-sm text-white/50">记住我</span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                background: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
                boxShadow: "0 4px 20px rgba(139, 92, 246, 0.4)",
              }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  登录中...
                </span>
              ) : "登录"}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: "rgba(255,255,255,0.1)" }} />
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 text-white/30 text-sm" style={{ backgroundColor: "rgba(10,10,15,1)" }}>
                或
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <button 
              className="w-full py-3.5 rounded-xl font-medium text-white/80 hover:text-white transition-all flex items-center justify-center gap-3"
              style={{ 
                backgroundColor: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              使用 Google 登录
            </button>

            <button 
              className="w-full py-3.5 rounded-xl font-medium text-white/80 hover:text-white transition-all flex items-center justify-center gap-3"
              style={{ 
                backgroundColor: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              使用 Apple 登录
            </button>
          </div>

          <p className="text-center text-white/50 text-sm mt-6">
            还没有账户？{" "}
            <Link href="/lover/register" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
              立即注册
            </Link>
          </p>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          登录即表示您同意我们的服务条款和隐私政策
        </p>
      </div>
    </div>
  );
}
