"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BRAND } from "@/lib/brand";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [usePhone, setUsePhone] = useState(false);
  const router = useRouter();

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (usePhone) {
        if (!phone) {
          setError("请输入手机号");
          setIsLoading(false);
          return;
        }
        const res = await fetch("/api/sms/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, purpose: "reset_password" }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "发送验证码失败");
        }
        setSentTo(`手机 ${phone.slice(0, 3)}****${phone.slice(-4)}`);
      } else {
        if (!email) {
          setError("请输入邮箱");
          setIsLoading(false);
          return;
        }
        setSentTo(`邮箱 ${email}`);
      }
      setStep(2);
    } catch (err: any) {
      setError(err.message || "操作失败");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("密码至少 8 位字符");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    setIsLoading(true);

    try {
      if (!usePhone) {
        setError("邮箱重置暂未开放，请使用手机号验证");
        setIsLoading(false);
        return;
      }
      const res = await fetch("/api/sms/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          code,
          purpose: "reset_password",
          newPassword,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "重置失败");
      }

      setStep(3);
    } catch (err: any) {
      setError(err.message || "重置失败");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-4"
      style={{
        background: "radial-gradient(ellipse at 50% 80%, rgba(45, 212, 191, 0.08) 0%, rgba(19, 19, 26, 0.8) 50%, #0c0c12 100%)",
      }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, rgba(45, 212, 191, 0.3) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-56 h-56 rounded-full opacity-15"
          style={{
            background: "radial-gradient(circle, rgba(249, 115, 22, 0.25) 0%, transparent 70%)",
            filter: "blur(50px)",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center gradient-jade shadow-lg shadow-brand-500/20">
              <span className="text-xl">🦌</span>
            </div>
            <span className="text-white text-xl font-bold font-serif-cn tracking-wide">{BRAND.name}</span>
          </Link>
          <h1 className="text-2xl font-bold text-white mb-1.5 font-serif-cn">
            {step === 1 && "找回密码"}
            {step === 2 && "设置新密码"}
            {step === 3 && "重置成功"}
          </h1>
          <p className="text-ink-400 text-sm">
            {step === 1 && "选择验证方式重置你的密码"}
            {step === 2 && `验证码已发送至 ${sentTo}`}
            {step === 3 && "请使用新密码登录"}
          </p>
        </div>

        <div className="glass rounded-xl p-6">
          {step === 1 && (
            <form onSubmit={handleSendCode} className="space-y-4">
              {/* 切换验证方式 */}
              <div className="flex gap-1 p-1 rounded-lg" style={{ background: "rgba(255,255,255,0.04)" }}>
                <button
                  type="button"
                  onClick={() => setUsePhone(false)}
                  className="flex-1 py-2 rounded-md text-sm font-medium transition-all"
                  style={{
                    background: !usePhone ? "linear-gradient(135deg, #2dd4bf, #14b8a6)" : "transparent",
                    color: !usePhone ? "#0c0c12" : "#8e8ea2",
                  }}
                >
                  邮箱验证
                </button>
                <button
                  type="button"
                  onClick={() => setUsePhone(true)}
                  className="flex-1 py-2 rounded-md text-sm font-medium transition-all"
                  style={{
                    background: usePhone ? "linear-gradient(135deg, #f97316, #fbbf24)" : "transparent",
                    color: usePhone ? "#0c0c12" : "#8e8ea2",
                  }}
                >
                  手机验证
                </button>
              </div>

              {!usePhone ? (
                <div>
                  <label className="block text-xs font-medium text-ink-300 mb-2">邮箱地址</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 rounded-lg text-white outline-none transition-all input-base"
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-ink-300 mb-2">手机号</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
                    placeholder="请输入手机号"
                    className="w-full px-4 py-3 rounded-lg text-white outline-none transition-all input-base"
                    required
                  />
                </div>
              )}

              {error && (
                <div className="p-3 rounded-lg text-sm text-center" style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#fca5a5", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-lg font-medium text-ink-950 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 btn-primary"
              >
                {isLoading ? "发送中..." : "发送验证码"}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-ink-300 mb-2">验证码</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="请输入6位验证码"
                  maxLength={6}
                  className="w-full px-4 py-3 rounded-lg text-white outline-none transition-all input-base text-center text-xl tracking-widest"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-300 mb-2">新密码</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="至少8位字符"
                  className="w-full px-4 py-3 rounded-lg text-white outline-none transition-all input-base"
                  required
                  minLength={8}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-300 mb-2">确认新密码</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再次输入新密码"
                  className="w-full px-4 py-3 rounded-lg text-white outline-none transition-all input-base"
                  required
                  minLength={8}
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg text-sm text-center" style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#fca5a5", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-lg font-medium text-ink-950 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 btn-primary"
              >
                {isLoading ? "重置中..." : "重置密码"}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full py-2 text-sm text-ink-400 hover:text-white transition-colors"
              >
                返回上一步
              </button>
            </form>
          )}

          {step === 3 && (
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: "rgba(45, 212, 191, 0.15)" }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-white mb-1">密码已成功重置</p>
              <p className="text-ink-400 text-sm mb-6">请使用新密码登录你的账户</p>
              <button
                onClick={() => router.push("/lover/login")}
                className="w-full py-3 rounded-lg font-medium text-ink-950 transition-all hover:opacity-90 btn-primary"
              >
                前往登录
              </button>
            </div>
          )}
        </div>

        <p className="text-center mt-5">
          <Link href="/lover/login" className="text-brand-400 hover:text-brand-300 text-sm font-medium transition-colors">
            返回登录
          </Link>
        </p>
      </div>
    </div>
  );
}
