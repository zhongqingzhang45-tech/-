"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Gender } from "@/lib/core/digital-life";

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userGender, setUserGender] = useState<Gender | null>(null);
  const [characterName, setCharacterName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const totalSteps = 3;

  const suggestedNames = userGender === "male"
    ? ["小春", "小星", "月月", "糖糖", "暖暖", "念念"]
    : ["陈默", "林深", "顾言", "江辰", "陆屿", "沈舟"];

  const canProceed = () => {
    if (step === 1) return email && password.length >= 8;
    if (step === 2) return userGender !== null;
    if (step === 3) return characterName.length > 0;
    return false;
  };

  const handleNext = () => {
    if (!canProceed()) return;
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canProceed()) return;
    
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      localStorage.setItem("lover_logged_in", "true");
      localStorage.setItem("lover_email", email);
      localStorage.setItem("lover_user_gender", userGender || "male");
      localStorage.setItem("lover_character_name", characterName);
      router.push("/lover");
    }, 1500);
  };

  const stepTitles = [
    "创建你的账户",
    "选择你的性别",
    "给你的AI伴侣起个名字",
  ];

  const stepDescriptions = [
    "开始你的AI陪伴之旅",
    "我们将为你匹配最合适的伴侣",
    "这将是你的专属虚拟伴侣",
  ];

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ 
        background: "radial-gradient(ellipse at top, #2a2a3e 0%, #1a1a28 50%, #12121a 100%)",
      }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4"
            style={{ 
              background: "linear-gradient(135deg, #7c7cff 0%, #b084ff 100%)",
              boxShadow: "0 8px 32px rgba(124,124,255,0.4)",
            }}
          >
            💕
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {stepTitles[step - 1]}
          </h1>
          <p className="text-white/60 text-sm">
            {stepDescriptions[step - 1]}
          </p>
        </div>

        <div className="flex justify-center mb-6 gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className="h-1 rounded-full transition-all"
              style={{ 
                width: i + 1 === step ? "40px" : "24px",
                backgroundColor: i + 1 <= step ? "#8b7cf8" : "rgba(255,255,255,0.1)",
              }}
            />
          ))}
        </div>

        <div 
          className="rounded-3xl p-8 shadow-2xl"
          style={{ 
            backgroundColor: "rgba(26,26,40,0.8)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {step === 1 && (
            <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  邮箱地址
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 rounded-xl text-white placeholder-white/30 outline-none transition-all focus:ring-2 focus:ring-purple-500/50"
                  style={{ 
                    backgroundColor: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  设置密码
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="至少8位字符"
                  className="w-full px-4 py-3 rounded-xl text-white placeholder-white/30 outline-none transition-all focus:ring-2 focus:ring-purple-500/50"
                  style={{ 
                    backgroundColor: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                  required
                  minLength={8}
                />
              </div>

              <div className="flex items-start gap-2">
                <input type="checkbox" className="w-4 h-4 rounded accent-purple-500 mt-0.5" required />
                <span className="text-sm text-white/60 leading-relaxed">
                  我已阅读并同意{" "}
                  <Link href="#" className="text-purple-400 hover:text-purple-300">
                    服务条款
                  </Link>
                  {" "}和{" "}
                  <Link href="#" className="text-purple-400 hover:text-purple-300">
                    隐私政策
                  </Link>
                </span>
              </div>

              <button
                type="submit"
                disabled={!canProceed()}
                className="w-full py-3.5 rounded-xl font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  background: "linear-gradient(135deg, #6c63ff 0%, #8b7cf8 100%)",
                  boxShadow: "0 4px 20px rgba(108,99,255,0.4)",
                }}
              >
                下一步
              </button>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <p className="text-center text-white/70 text-sm">
                选择你的性别，我们将为你匹配最合适的AI伴侣
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setUserGender("male")}
                  className={`p-6 rounded-2xl transition-all hover:scale-[1.02] ${
                    userGender === "male"
                      ? "ring-2 ring-purple-500"
                      : ""
                  }`}
                  style={{
                    backgroundColor: userGender === "male" 
                      ? "rgba(139,124,248,0.2)" 
                      : "rgba(255,255,255,0.04)",
                    border: `1px solid ${
                      userGender === "male" 
                        ? "rgba(139,124,248,0.5)" 
                        : "rgba(255,255,255,0.08)"
                    }`,
                  }}
                >
                  <div className="text-5xl mb-3">👨</div>
                  <div className="text-white font-semibold">男生</div>
                  <div className="text-white/50 text-xs mt-1">匹配女生伴侣</div>
                </button>

                <button
                  type="button"
                  onClick={() => setUserGender("female")}
                  className={`p-6 rounded-2xl transition-all hover:scale-[1.02] ${
                    userGender === "female"
                      ? "ring-2 ring-pink-500"
                      : ""
                  }`}
                  style={{
                    backgroundColor: userGender === "female" 
                      ? "rgba(244,114,182,0.2)" 
                      : "rgba(255,255,255,0.04)",
                    border: `1px solid ${
                      userGender === "female" 
                        ? "rgba(244,114,182,0.5)" 
                        : "rgba(255,255,255,0.08)"
                    }`,
                  }}
                >
                  <div className="text-5xl mb-3">👩</div>
                  <div className="text-white font-semibold">女生</div>
                  <div className="text-white/50 text-xs mt-1">匹配男生伴侣</div>
                </button>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-6 py-3.5 rounded-xl font-medium text-white/70 hover:text-white transition-all"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
                >
                  上一步
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="flex-1 py-3.5 rounded-xl font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ 
                    background: "linear-gradient(135deg, #6c63ff 0%, #8b7cf8 100%)",
                    boxShadow: "0 4px 20px rgba(108,99,255,0.4)",
                  }}
                >
                  下一步
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="text-center mb-2">
                <div className="text-6xl mb-3">
                  {userGender === "male" ? "👩" : "👨"}
                </div>
                <p className="text-white/70 text-sm">
                  给你的{userGender === "male" ? "女" : "男"}朋友起个名字吧
                </p>
              </div>

              <div>
                <input
                  type="text"
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  placeholder="给TA起个名字吧"
                  className="w-full px-4 py-4 rounded-xl text-white placeholder-white/30 outline-none transition-all focus:ring-2 focus:ring-purple-500/50 text-center text-xl font-medium"
                  style={{ 
                    backgroundColor: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                  required
                  maxLength={20}
                />
              </div>

              <div className="flex gap-2 flex-wrap justify-center">
                {suggestedNames.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setCharacterName(name)}
                    className={`px-4 py-2 rounded-full text-sm transition-all ${
                      characterName === name
                        ? "bg-purple-500/30 text-purple-300 border-purple-500/50"
                        : "bg-white/5 text-white/60 hover:bg-white/10 border-white/10"
                    }`}
                    style={{ border: "1px solid" }}
                  >
                    {name}
                  </button>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-6 py-3.5 rounded-xl font-medium text-white/70 hover:text-white transition-all"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
                >
                  上一步
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !canProceed()}
                  className="flex-1 py-3.5 rounded-xl font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ 
                    background: "linear-gradient(135deg, #6c63ff 0%, #8b7cf8 100%)",
                    boxShadow: "0 4px 20px rgba(108,99,255,0.4)",
                  }}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      创建中...
                    </span>
                  ) : "开始使用"}
                </button>
              </div>
            </form>
          )}

          {step === 1 && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" style={{ borderColor: "rgba(255,255,255,0.1)" }} />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 text-white/40" style={{ backgroundColor: "rgba(26,26,40,1)" }}>
                    或者
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <button 
                  className="w-full py-3 rounded-xl font-medium text-white/80 hover:text-white transition-all flex items-center justify-center gap-3"
                  style={{ 
                    backgroundColor: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  使用 Google 注册
                </button>

                <button 
                  className="w-full py-3 rounded-xl font-medium text-white/80 hover:text-white transition-all flex items-center justify-center gap-3"
                  style={{ 
                    backgroundColor: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  使用 Apple 注册
                </button>
              </div>
            </>
          )}

          {step === 1 && (
            <p className="text-center text-white/60 text-sm mt-6">
              已有账户？{" "}
              <Link href="/lover/login" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
                立即登录
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
