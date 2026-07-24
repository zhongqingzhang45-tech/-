"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BRAND } from "@/lib/brand";
import { getCharacterById, CHARACTERS } from "@/data/characters";

interface UserInfo {
  nickname: string;
  email: string;
  phone: string;
  birthDate: string;
  characterName: string;
  characterId: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo>({
    nickname: "",
    email: "",
    phone: "",
    birthDate: "",
    characterName: "",
    characterId: "",
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const email = localStorage.getItem("lover_email") || "";
    const phone = localStorage.getItem("lover_phone") || "";
    const nickname = localStorage.getItem("lover_nickname") || "灵犀用户";
    const birthDate = localStorage.getItem("lover_birth_date") || "";
    const characterName = localStorage.getItem("lover_character_name") || "小璃";
    const characterId = localStorage.getItem("lover_selected_character") || "xiaoli";
    setUser({ nickname, email, phone, birthDate, characterName, characterId });
  }, []);

  const currentCharacter = getCharacterById(user.characterId);

  const handleLogout = () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("lover_logged_in");
    localStorage.removeItem("lover_session_id");
    document.cookie = "lover_session=; path=/; max-age=0";
    router.push("/");
  };

  const stats = [
    { label: "累计对话", value: "1,248", icon: "💬" },
    { label: "陪伴天数", value: "32", icon: "🌙" },
    { label: "好感度", value: "86", icon: "❤️" },
  ];

  return (
    <div className="min-h-screen w-full ink-wash-bg">
      {/* 背景氛围 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full opacity-25"
          style={{
            background: "radial-gradient(circle, rgba(45, 212, 191, 0.15) 0%, transparent 60%)",
            filter: "blur(80px)",
          }}
        />
      </div>

      {/* 导航栏 */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-10 py-5">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-jade flex items-center justify-center shadow-lg shadow-brand-500/20">
            <span className="text-xl">🦌</span>
          </div>
          <span className="text-white text-xl font-bold font-serif-cn tracking-wide">{BRAND.name}</span>
        </Link>
        <Link
          href="/lover"
          className="text-ink-300 hover:text-white text-sm font-medium transition-colors"
        >
          返回伴侣空间
        </Link>
      </nav>

      <main className="relative z-10 px-6 md:px-10 py-8 pb-20">
        <div className="max-w-4xl mx-auto">
          {/* 标题区 */}
          <div className="text-center mb-10">
            <p className="text-brand-400 text-sm font-medium mb-2">个人中心</p>
            <h1 className="text-3xl md:text-4xl font-bold text-white font-serif-cn">
              你的灵犀空间
            </h1>
          </div>

          {/* 用户信息卡片 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-3xl p-6 md:p-8 border border-white/[0.08] mb-6"
          >
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-24 h-24 rounded-full gradient-jade flex items-center justify-center text-4xl shadow-lg shadow-brand-500/20">
                🦌
              </div>
              <div className="text-center md:text-left flex-1">
                <h2 className="text-2xl font-bold text-white font-serif-cn mb-1">{user.nickname}</h2>
                <p className="text-white/50 text-sm mb-3">
                  {user.email || user.phone || "未绑定联系方式"}
                </p>
                <div className="flex flex-wrap justify-center md:justify-start gap-2">
                  <span className="px-3 py-1 rounded-full text-xs bg-white/5 text-white/70 border border-white/[0.06]">
                    初识会员
                  </span>
                  {user.birthDate && (
                    <span className="px-3 py-1 rounded-full text-xs bg-brand-400/10 text-brand-400 border border-brand-400/20">
                      生日 {user.birthDate}
                    </span>
                  )}
                </div>
              </div>
              <button className="px-5 py-2 rounded-xl text-sm font-medium text-ink-950 btn-primary">
                编辑资料
              </button>
            </div>
          </motion.div>

          {/* 数据统计 */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="glass rounded-2xl p-4 text-center border border-white/[0.06]"
              >
                <div className="text-2xl mb-1">{stat.icon}</div>
                <div className="text-2xl font-bold text-white font-serif-cn">{stat.value}</div>
                <div className="text-white/50 text-xs">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* 当前伴侣 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="glass rounded-3xl p-6 border border-white/[0.06]"
            >
              <h3 className="text-white font-semibold font-serif-cn mb-4">当前伴侣</h3>
              {currentCharacter ? (
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                    style={{
                      background: `${currentCharacter.accentColor}15`,
                      border: `1px solid ${currentCharacter.accentColor}30`,
                    }}
                  >
                    {currentCharacter.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-semibold font-serif-cn">
                        {user.characterName || currentCharacter.name}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/60">
                        {currentCharacter.title}
                      </span>
                    </div>
                    <p className="text-white/50 text-sm line-clamp-2">{currentCharacter.bio}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-white/50">
                  还没有选择伴侣
                </div>
              )}
              <Link
                href="/lover/select"
                className="mt-4 block w-full py-2.5 rounded-xl text-center text-sm font-medium text-ink-950 btn-primary"
              >
                {currentCharacter ? "更换伴侣" : "选择伴侣"}
              </Link>
            </motion.div>

            {/* 快速入口 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
              className="glass rounded-3xl p-6 border border-white/[0.06]"
            >
              <h3 className="text-white font-semibold font-serif-cn mb-4">快捷入口</h3>
              <div className="space-y-2">
                {[
                  { label: "我的动态", href: "/lover/community", icon: "🏮" },
                  { label: "会员中心", href: "/lover/membership", icon: "🪙" },
                  { label: "互动记录", href: "#", icon: "📜" },
                  { label: "账号设置", href: "#", icon: "⚙️" },
                ].map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
                  >
                    <span>{item.icon}</span>
                    <span className="text-white/80 text-sm flex-1">{item.label}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-500">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>

          {/* 退出登录 */}
          <div className="mt-8 text-center">
            <button
              onClick={handleLogout}
              className="px-6 py-2.5 rounded-xl text-sm font-medium text-ink-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              退出登录
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
