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
  const [birthDate, setBirthDate] = useState("");
  const [characterName, setCharacterName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const totalSteps = 4;

  const suggestedNames = userGender === "male"
    ? ["吕欣怡", "苏梦瑶", "陈诗涵", "张艺萱", "王语嫣", "刘雨桐"]
    : ["赵子轩", "李浩宇", "王子涵", "刘浩然", "陈明远", "张雨泽"];

  const canProceed = () => {
    if (step === 1) return email && password.length >= 8;
    if (step === 2) return userGender !== null;
    if (step === 3) return birthDate;
    if (step === 4) return characterName.length > 0;
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
      localStorage.setItem("lover_birth_date", birthDate);
      localStorage.setItem("lover_character_name", characterName);
      router.push("/lover/character-select");
    }, 1500);
  };

  const stepTitles = [
    "创建你的账户",
    "选择你的性别",
    "你的生日",
    "给你的AI伴侣起个名字",
  ];

  const stepDescriptions = [
    "开始你的AI陪伴之旅",
    "我们将为你匹配最合适的伴侣",
    "我们会记住你的每一个生日",
    "这将是你的专属虚拟伴侣",
  ];

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-4 py-8"
      style={{
        background: "radial-gradient(ellipse at 50% 80%, #1e1a2e 0%, #14111e 50%, #0a0a0f 100%)",
      }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-56 h-56 rounded-full opacity-15"
          style={{
            background: "radial-gradient(circle, rgba(236, 72, 153, 0.4) 0%, transparent 70%)",
            filter: "blur(50px)",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
                boxShadow: "0 4px 16px rgba(139,92,246,0.3)",
              }}
            >
              <span className="text-xl">✨</span>
            </div>
            <span className="text-white text-xl font-bold">星野</span>
          </Link>
          <h1 className="text-2xl font-bold text-white mb-1.5">
            {stepTitles[step - 1]}
          </h1>
          <p className="text-ink-400 text-sm">
            {stepDescriptions[step - 1]}
          </p>
        </div>

        {/* 步骤指示器 */}
        <div className="flex justify-center mb-6 gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className="h-1 rounded-full transition-all duration-300"
              style={{
                width: i + 1 === step ? "32px" : "20px",
                background: i + 1 <= step
                  ? "linear-gradient(90deg, #8b5cf6, #ec4899)"
                  : "rgba(255,255,255,0.08)",
              }}
            />
          ))}
        </div>

        <div className="glass rounded-xl p-6">
          {step === 1 && (
            <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-ink-300 mb-2">
                  邮箱地址
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 rounded-lg text-white outline-none transition-all input-base"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-300 mb-2">
                  设置密码
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="至少8位字符"
                  className="w-full px-4 py-3 rounded-lg text-white outline-none transition-all input-base"
                  required
                  minLength={8}
                />
                <p className="text-xs text-ink-500 mt-1.5">密码至少 8 位字符</p>
              </div>

              <div className="flex items-start gap-2">
                <input type="checkbox" className="w-4 h-4 rounded mt-0.5" style={{ accentColor: "#8b5cf6" }} required />
                <span className="text-xs text-ink-400 leading-relaxed">
                  我已阅读并同意{" "}
                  <Link href="#" className="text-brand-400 hover:text-brand-300 transition-colors">
                    服务条款
                  </Link>
                  {" "}和{" "}
                  <Link href="#" className="text-brand-400 hover:text-brand-300 transition-colors">
                    隐私政策
                  </Link>
                </span>
              </div>

              <button
                type="submit"
                disabled={!canProceed()}
                className="w-full py-3 rounded-lg font-medium text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed btn-primary"
              >
                下一步
              </button>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <p className="text-center text-ink-400 text-sm">
                选择你的性别，我们将为你匹配最合适的AI伴侣
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setUserGender("male")}
                  className="p-5 rounded-xl transition-all active:scale-[0.98] text-center"
                  style={{
                    background: userGender === "male"
                      ? "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(139,92,246,0.05))"
                      : "rgba(30,30,40,0.6)",
                    border: `1px solid ${
                      userGender === "male"
                        ? "rgba(139,92,246,0.4)"
                        : "rgba(255,255,255,0.06)"
                    }`,
                  }}
                >
                  <div className="text-4xl mb-2">👨</div>
                  <div className="text-white text-sm font-medium">男生</div>
                  <div className="text-ink-500 text-xs mt-0.5">匹配女生伴侣</div>
                </button>

                <button
                  type="button"
                  onClick={() => setUserGender("female")}
                  className="p-5 rounded-xl transition-all active:scale-[0.98] text-center"
                  style={{
                    background: userGender === "female"
                      ? "linear-gradient(135deg, rgba(236,72,153,0.15), rgba(236,72,153,0.05))"
                      : "rgba(30,30,40,0.6)",
                    border: `1px solid ${
                      userGender === "female"
                        ? "rgba(236,72,153,0.4)"
                        : "rgba(255,255,255,0.06)"
                    }`,
                  }}
                >
                  <div className="text-4xl mb-2">👩</div>
                  <div className="text-white text-sm font-medium">女生</div>
                  <div className="text-ink-500 text-xs mt-0.5">匹配男生伴侣</div>
                </button>
              </div>

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-5 py-3 rounded-lg font-medium text-ink-300 hover:text-white transition-all btn-secondary"
                >
                  上一步
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="flex-1 py-3 rounded-lg font-medium text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed btn-primary"
                >
                  下一步
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <p className="text-center text-ink-400 text-sm">
                告诉我们你的生日，我们会在特殊日子给你惊喜
              </p>

              <div>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-4 py-4 rounded-lg text-white outline-none transition-all input-base text-center text-lg"
                  style={{ colorScheme: "dark" }}
                  required
                />
              </div>

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-5 py-3 rounded-lg font-medium text-ink-300 hover:text-white transition-all btn-secondary"
                >
                  上一步
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="flex-1 py-3 rounded-lg font-medium text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed btn-primary"
                >
                  下一步
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-center mb-2">
                <div className="text-6xl mb-3">
                  {userGender === "male" ? "👩" : "👨"}
                </div>
                <p className="text-ink-400 text-sm">
                  给你的{userGender === "male" ? "女" : "男"}朋友起个名字吧
                </p>
              </div>

              <div>
                <input
                  type="text"
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  placeholder="给TA起个名字吧"
                  className="w-full px-4 py-4 rounded-lg text-white outline-none transition-all input-base text-center text-xl font-medium"
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
                    className="px-3.5 py-1.5 rounded-lg text-xs transition-all active:scale-95"
                    style={{
                      background: characterName === name
                        ? "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(236,72,153,0.15))"
                        : "rgba(30,30,40,0.6)",
                      border: `1px solid ${
                        characterName === name
                          ? "rgba(139,92,246,0.4)"
                          : "rgba(255,255,255,0.06)"
                      }`,
                      color: characterName === name ? "#c4b5fd" : "#8e8ea2",
                    }}
                  >
                    {name}
                  </button>
                ))}
              </div>

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-5 py-3 rounded-lg font-medium text-ink-300 hover:text-white transition-all btn-secondary"
                >
                  上一步
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !canProceed()}
                  className="flex-1 py-3 rounded-lg font-medium text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed btn-primary"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full divider" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 text-ink-500 text-xs glass-strong rounded-full">
                    或
                  </span>
                </div>
              </div>

              <div className="space-y-2.5">
                <button className="w-full py-3 rounded-lg font-medium text-ink-300 hover:text-white transition-all flex items-center justify-center gap-3 btn-secondary">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#07C160">
                    <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-7.062-6.122zm-2.036 2.93c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z"/>
                  </svg>
                  使用微信注册
                </button>

                <button className="w-full py-3 rounded-lg font-medium text-ink-300 hover:text-white transition-all flex items-center justify-center gap-3 btn-secondary">
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  使用 Google 注册
                </button>

                <button className="w-full py-3 rounded-lg font-medium text-ink-300 hover:text-white transition-all flex items-center justify-center gap-3 btn-secondary">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  使用 Apple 注册
                </button>
              </div>
            </>
          )}

          {step === 1 && (
            <p className="text-center text-ink-400 text-sm mt-5">
              已有账户？{" "}
              <Link href="/lover/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
                立即登录
              </Link>
            </p>
          )}
        </div>

        <p className="text-center text-ink-500 text-xs mt-5">
          注册即表示您同意我们的服务条款和隐私政策
        </p>
      </div>
    </div>
  );
}
