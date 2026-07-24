"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GuofengAmbient } from "@/components/GuofengAmbient";

type LoginMode = "email" | "phone";

export default function LoginPage() {
  const [mode, setMode] = useState<LoginMode>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [codeCooldown, setCodeCooldown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const router = useRouter();
  const cooldownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (cooldownTimer.current) clearInterval(cooldownTimer.current);
    };
  }, []);

  const startCooldown = () => {
    setCodeCooldown(60);
    cooldownTimer.current = setInterval(() => {
      setCodeCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownTimer.current) clearInterval(cooldownTimer.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendCode = async () => {
    setError("");
    setInfo("");
    if (!phone) {
      setError("请输入手机号");
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setError("手机号格式不正确");
      return;
    }
    if (codeCooldown > 0) return;

    setIsSendingCode(true);
    try {
      const res = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, purpose: "login" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "验证码发送失败");
        return;
      }
      startCooldown();
      if (data.devCode) {
        setInfo(`开发环境验证码：${data.devCode}（生产环境将真实发送短信）`);
      } else {
        setInfo("验证码已发送，请查收短信");
      }
    } catch (e) {
      setError("网络错误，请重试");
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "登录失败");
        setIsLoading(false);
        return;
      }
      if (data.sessionId) {
        localStorage.setItem("lover_session_id", data.sessionId);
        document.cookie = `lover_session=${data.sessionId}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
      }
      localStorage.setItem("lover_logged_in", "true");
      localStorage.setItem("lover_email", email);
      if (data.user?.nickname) localStorage.setItem("lover_nickname", data.user.nickname);
      router.push("/lover");
    } catch (e) {
      setError("网络错误，请重试");
      setIsLoading(false);
    }
  };

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    if (!phone || !smsCode) {
      setError("请填写手机号和验证码");
      return;
    }
    setIsLoading(true);

    try {
      const res = await fetch("/api/sms/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: smsCode, purpose: "login" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "登录失败");
        setIsLoading(false);
        return;
      }
      if (data.sessionId) {
        localStorage.setItem("lover_session_id", data.sessionId);
        document.cookie = `lover_session=${data.sessionId}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
      }
      localStorage.setItem("lover_logged_in", "true");
      if (data.user?.phone) localStorage.setItem("lover_phone", data.user.phone);
      if (data.user?.nickname) localStorage.setItem("lover_nickname", data.user.nickname);
      router.push("/lover");
    } catch (e) {
      setError("网络错误，请重试");
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center px-4 gf-bg overflow-hidden">
      <div className="absolute inset-0 gf-grain" />
      <GuofengAmbient petals={10} clouds glow glowColor="rgba(200, 69, 60, 0.10)" />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <div className="seal w-12 h-12 text-lg">君心</div>
            <div className="flex flex-col items-start leading-none">
              <span className="font-title text-paper-50 text-xl tracking-widest">君心</span>
              <span className="text-ink-500 text-[10px] tracking-[0.3em] mt-1">JUN XIN</span>
            </div>
          </Link>
          <h1 className="font-display text-3xl text-paper-50 mb-1.5">欢迎归来</h1>
          <p className="text-ink-400 text-sm font-serif">故人久候，请入内一叙</p>
        </div>

        <div className="scroll-card p-6">
          {/* 登录方式切换 */}
          <div className="flex gap-1 p-1 mb-5 rounded-lg" style={{ backgroundColor: "rgba(16,11,8,0.6)" }}>
            <button
              type="button"
              onClick={() => { setMode("email"); setError(""); setInfo(""); }}
              className={`flex-1 py-2 rounded-md text-sm font-serif transition-all ${
                mode === "email" ? "text-paper-50" : "text-ink-400 hover:text-ink-300"
              }`}
              style={mode === "email" ? { background: "linear-gradient(135deg, #C8453C 0%, #8E2820 100%)" } : {}}
            >
              邮箱登录
            </button>
            <button
              type="button"
              onClick={() => { setMode("phone"); setError(""); setInfo(""); }}
              className={`flex-1 py-2 rounded-md text-sm font-serif transition-all ${
                mode === "phone" ? "text-paper-50" : "text-ink-400 hover:text-ink-300"
              }`}
              style={mode === "phone" ? { background: "linear-gradient(135deg, #C8453C 0%, #8E2820 100%)" } : {}}
            >
              手机号登录
            </button>
          </div>

          {mode === "email" ? (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-ink-300 mb-2 font-serif">邮箱地址</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 rounded-lg outline-none transition-all input-base font-serif"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-ink-300 font-serif">密码</label>
                  <Link href="/lover/forgot-password" className="text-xs text-cinnabar-400 hover:text-cinnabar-300 transition-colors font-serif">
                    忘记密码？
                  </Link>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-lg outline-none transition-all input-base font-serif"
                  required
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg text-sm text-center font-serif" style={{ backgroundColor: "rgba(200, 69, 60, 0.12)", color: "#eea79a", border: "1px solid rgba(200, 69, 60, 0.25)" }}>
                  {error}
                </div>
              )}
              {info && (
                <div className="p-3 rounded-lg text-sm text-center font-serif" style={{ backgroundColor: "rgba(74, 124, 126, 0.12)", color: "#7fafa6", border: "1px solid rgba(74, 124, 126, 0.25)" }}>
                  {info}
                </div>
              )}

              <div className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4 rounded" style={{ accentColor: "#C8453C" }} />
                <span className="text-xs text-ink-400 font-serif">记住此缘</span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-lg font-medium transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed btn-primary font-serif tracking-wider"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    正在相会...
                  </span>
                ) : "入内叙话"}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePhoneLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-ink-300 mb-2 font-serif">手机号</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
                  placeholder="请输入手机号"
                  className="w-full px-4 py-3 rounded-lg outline-none transition-all input-base font-serif"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-300 mb-2 font-serif">短信验证码</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={smsCode}
                    onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="6位验证码"
                    className="flex-1 px-4 py-3 rounded-lg outline-none transition-all input-base font-serif"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={isSendingCode || codeCooldown > 0 || !phone}
                    className="px-4 py-3 rounded-lg text-sm font-medium whitespace-nowrap transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed btn-secondary font-serif"
                    style={{ minWidth: "110px" }}
                  >
                    {isSendingCode ? "发送中..." : codeCooldown > 0 ? `${codeCooldown}s 后重试` : "获取验证码"}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg text-sm text-center font-serif" style={{ backgroundColor: "rgba(200, 69, 60, 0.12)", color: "#eea79a", border: "1px solid rgba(200, 69, 60, 0.25)" }}>
                  {error}
                </div>
              )}
              {info && (
                <div className="p-3 rounded-lg text-sm text-center font-serif" style={{ backgroundColor: "rgba(74, 124, 126, 0.12)", color: "#7fafa6", border: "1px solid rgba(74, 124, 126, 0.25)" }}>
                  {info}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-lg font-medium transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed btn-primary font-serif tracking-wider"
              >
                {isLoading ? "正在相会..." : "入内叙话"}
              </button>

              <p className="text-center text-xs text-ink-500 font-serif">
                未注册手机号将无法登录，请先
                <Link href="/lover/register" className="text-cinnabar-400 hover:text-cinnabar-300 ml-1">结缘注册</Link>
              </p>
            </form>
          )}

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full divider" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 text-ink-500 text-xs glass-strong rounded-full font-serif">或</span>
            </div>
          </div>

          <div className="space-y-2.5">
            <button className="w-full py-3 rounded-lg font-medium text-ink-300 hover:text-paper-50 transition-all flex items-center justify-center gap-3 btn-secondary font-serif">
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              使用 Google 登录
            </button>
            <button className="w-full py-3 rounded-lg font-medium text-ink-300 hover:text-paper-50 transition-all flex items-center justify-center gap-3 btn-secondary font-serif">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#E8DCC4">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              使用 Apple 登录
            </button>
          </div>

          <p className="text-center text-ink-400 text-sm mt-5 font-serif">
            尚未结缘？{" "}
            <Link href="/lover/register" className="text-cinnabar-400 hover:text-cinnabar-300 font-medium transition-colors">
              立即结缘
            </Link>
          </p>
        </div>

        <p className="text-center text-ink-500 text-xs mt-5 font-serif">
          登录即表示同意我们的服务条款和隐私政策
        </p>
      </div>
    </div>
  );
}
