"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  defaultMode?: "login" | "register";
}

export function AuthModal({ open, onClose, defaultMode = "login" }: Props) {
  const [mode, setMode] = useState<"login" | "register">(defaultMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", password: "", name: "" });

  // sync mode when defaultMode changes
  useEffect(() => { setMode(defaultMode); }, [defaultMode]);

  // lock body scroll
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // ESC to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error || "操作失败，请重试");
      } else {
        // store token
        if (data.token) {
          localStorage.setItem("lifeos_token", data.token);
          localStorage.setItem("lifeos_user", JSON.stringify(data.user));
        }
        onClose();
        // refresh to show logged-in state
        window.location.reload();
      }
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = `
    w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3
    text-sm text-white placeholder-gray-500 outline-none
    transition focus:border-brand-400/50 focus:bg-white/[0.07]
  `;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md animate-modal-in">
        {/* Glow */}
        <div className="pointer-events-none absolute -top-20 left-1/2 h-60 w-full -translate-x-1/2 rounded-full bg-brand-400/10 blur-[100px]" />

        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0a0f1e]/90 backdrop-blur-2xl shadow-2xl">
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-gray-500 transition hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>

          {/* Header art */}
          <div className="relative h-20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-400/20 via-transparent to-fuchsia-500/20" />
            {/* Abstract art lines */}
            <svg className="absolute inset-0 h-full w-full opacity-30" viewBox="0 0 400 80" preserveAspectRatio="none">
              <path d="M0,40 Q100,10 200,40 T400,40" stroke="rgba(34,211,238,0.4)" strokeWidth="1" fill="none" />
              <path d="M0,50 Q150,20 300,50 T400,30" stroke="rgba(232,121,249,0.3)" strokeWidth="1" fill="none" />
              <circle cx="320" cy="20" r="8" fill="rgba(34,211,238,0.3)" />
              <circle cx="80" cy="50" r="4" fill="rgba(232,121,249,0.4)" />
            </svg>
            <div className="absolute inset-0 flex items-end px-8 pb-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-brand-400">
                  {mode === "login" ? "欢迎回来" : "创建账号"}
                </div>
                <h2 className="mt-1 text-xl font-semibold text-white">
                  {mode === "login" ? "登录 LifeOS" : "开启 AI 公司之旅"}
                </h2>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8">
            {mode === "register" && (
              <div className="mb-4">
                <label className="mb-1.5 block text-xs text-gray-400">姓名</label>
                <input
                  type="text"
                  placeholder="你的名字"
                  className={inputClass}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
            )}

            <div className="mb-4">
              <label className="mb-1.5 block text-xs text-gray-400">邮箱</label>
              <input
                type="email"
                placeholder="name@company.com"
                className={inputClass}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div className="mb-5">
              <label className="mb-1.5 flex items-center justify-between text-xs text-gray-400">
                <span>密码</span>
                {mode === "login" && (
                  <button type="button" className="text-brand-400 hover:text-brand-300 transition">
                    忘记密码？
                  </button>
                )}
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className={inputClass}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-brand-400 to-brand-500 py-3 text-sm font-semibold text-ink-950 shadow-lg shadow-brand-400/25 transition hover:brightness-110 disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-950/30 border-t-ink-950" />
                  处理中...
                </span>
              ) : mode === "login" ? "登录账号" : "创建账号"}
            </button>

            {/* Divider */}
            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs text-gray-500">或</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            {/* Social login */}
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] py-3 text-sm text-white transition hover:bg-white/[0.08]"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
              </svg>
              使用 Google 登录
            </button>

            {/* Switch mode */}
            <p className="mt-5 text-center text-xs text-gray-500">
              {mode === "login" ? "还没有账号？" : "已有账号？"}
              <button
                type="button"
                onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
                className="ml-1 text-brand-400 hover:text-brand-300 transition"
              >
                {mode === "login" ? "立即注册" : "登录账号"}
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
