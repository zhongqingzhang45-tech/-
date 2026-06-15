"use client";

import { useEffect, useRef, useState } from "react";
import { AuthModal } from "./AuthModal";

export function Header() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  const openLogin = () => { setAuthMode("login"); setAuthOpen(true); };
  const openRegister = () => { setAuthMode("register"); setAuthOpen(true); };

  useEffect(() => {
    const handler = () => openRegister();
    window.addEventListener("lifeos-open-register", handler);
    return () => window.removeEventListener("lifeos-open-register", handler);
  }, []);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#030712]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-500 text-sm font-bold text-ink-950">
              L
            </div>
            <span className="text-sm font-semibold text-white">LifeOS</span>
          </a>

          {/* Nav links */}
          <nav className="hidden items-center gap-6 md:flex">
            <a href="#lifeos-agent-team" className="text-xs text-gray-400 transition hover:text-white">专家团队</a>
            <a href="#lifeos-workflow" className="text-xs text-gray-400 transition hover:text-white">工作流程</a>
            <a href="#lifeos-pricing" className="text-xs text-gray-400 transition hover:text-white">价格方案</a>
          </nav>

          {/* Auth buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={openLogin}
              className="rounded-lg px-4 py-1.5 text-xs font-medium text-gray-300 transition hover:text-white"
            >
              登录
            </button>
            <button
              onClick={openRegister}
              className="rounded-lg bg-white/10 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-white/20"
            >
              免费开始
            </button>
          </div>
        </div>
      </header>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        defaultMode={authMode}
      />
    </>
  );
}
