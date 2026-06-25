"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { ChatMessage } from "@/data/lover";
import { useCharacterAgent, useSpeech } from "@/lib/hooks";
import { MoodType, FEMALE_CHARACTERS, MALE_CHARACTERS, Gender, PERSONA_MODE_LABELS, PersonaMode } from "@/lib/core/digital-life";
import type { Live2DPlayerRef } from "@/components/Lover/Live2DPlayer";

const Live2DPlayer = dynamic(() => import("@/components/Lover/Live2DPlayer"), {
  ssr: false,
  loading: () => null,
});

const NAV_ITEMS = [
  { id: "chat", label: "聊天", icon: "💬" },
  { id: "activities", label: "互动", icon: "🎮" },
  { id: "memory", label: "记忆", icon: "🌟" },
  { id: "diary", label: "日记", icon: "📔" },
  { id: "profile", label: "资料", icon: "👤" },
  { id: "room", label: "房间", icon: "🏠" },
];

const QUICK_REPLIES = [
  "你好呀～ 💕",
  "给我讲个故事吧",
  "我今天有点难过 😢",
  "早上好！ ☀️",
  "唱首歌给我听 🎵",
  "我喜欢你 ❤️",
];

function getModeColor(mode?: string): string {
  switch (mode) {
    case "affectionate": return "#ec4899";
    case "tsundere": return "#f87171";
    case "cold": return "#64748b";
    case "aggressive": return "#ef4444";
    case "silent_treatment": return "#475569";
    case "pua": return "#8b5cf6";
    case "reconciliation": return "#10b981";
    default: return "#6366f1";
  }
}

export default function LoverPage() {
  const { messages, mood, isTyping, sendMessage, profile, lifeState } = useCharacterAgent();
  const { isListening, startListening, stopListening } = useSpeech();
  const [activeNav, setActiveNav] = useState("chat");
  const [showSettings, setShowSettings] = useState(false);
  const [input, setInput] = useState("");
  const [micActive, setMicActive] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [userGender, setUserGender] = useState<Gender>("male");
  const live2dRef = useRef<Live2DPlayerRef>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentMood = (mood?.mood ?? "happy") as MoodType;

  const currentCharacter = {
    id: profile?.live2dModel || "HaruGreeter",
    name: profile?.name || "小春",
    path: "/live2d-models",
    model: profile?.live2dModel || "HaruGreeter",
    avatar: profile?.gender === "male" ? "👨" : "👩",
    scale: 2,
    positionY: 0.55,
    type: "cubism3" as const,
    gender: profile?.gender || "female",
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("lover_user_gender") as Gender | null;
      if (stored) setUserGender(stored);
    }
  }, []);

  const convertedMessages: ChatMessage[] = messages.map((msg) => ({
    id: msg.id,
    sender: msg.sender === "assistant" ? "lover" : "user",
    content: msg.content,
    timestamp: new Date(msg.timestamp),
    mood: msg.emotion.mood as any,
  }));

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMicToggle = () => {
    if (isListening) {
      stopListening();
      setMicActive(false);
    } else {
      startListening();
      setMicActive(true);
    }
  };

  return (
    <main 
      className="relative h-screen w-screen overflow-hidden flex flex-col"
      style={{ 
        background: "radial-gradient(ellipse at 25% 80%, #2a2a3e 0%, #1a1a28 50%, #12121a 100%)",
      }}
    >
      <div 
        className="absolute pointer-events-none"
        style={{ 
          left: "15%",
          bottom: "5%",
          width: "500px",
          height: "500px",
          background: "radial-gradient(circle, rgba(147,112,219,0.18) 0%, rgba(147,112,219,0.06) 40%, transparent 70%)",
          borderRadius: "50%",
          transform: "translateX(-30%)",
          filter: "blur(30px)",
        }}
      />

      <header 
        className="flex-shrink-0 h-14 flex items-center px-5 z-20"
        style={{ 
          backgroundColor: "rgba(18,18,26,0.75)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-base"
            style={{ 
              background: profile?.gender === "male" 
                ? "linear-gradient(135deg, #60a5fa 0%, #818cf8 100%)"
                : "linear-gradient(135deg, #f472b6 0%, #a78bfa 100%)",
              boxShadow: "0 2px 10px rgba(124,124,255,0.3)",
            }}
          >
            {profile?.name?.[0] || "星"}
          </div>
          <div>
            <div className="text-white font-semibold text-sm">{profile?.name || "星野"}</div>
            <span 
              className="px-2 py-0.5 rounded-full text-[10px] font-medium text-white/70"
              style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
            >
              等级 {lifeState?.growth?.level || 1}
            </span>
          </div>
        </div>

        <nav className="hidden md:flex items-center justify-center flex-1 gap-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5"
              style={{
                color: activeNav === item.id ? "#fff" : "rgba(255,255,255,0.45)",
                backgroundColor: activeNav === item.id ? "rgba(255,255,255,0.1)" : "transparent",
              }}
            >
              <span className="text-[11px]">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button 
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-105"
            style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.65">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </button>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-105"
            style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </header>

      <div className="flex-1 flex min-h-0 relative">
        {!isMobile && (
          <div className="hidden md:flex md:w-[38%] lg:w-[35%] relative items-end justify-start">
            <div
              className="absolute top-4 left-4 z-20 px-3 py-2 rounded-full text-xs font-medium text-white/80 flex items-center gap-2"
              style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
            >
              <span>{currentCharacter.avatar}</span>
              <span>{currentCharacter.name}</span>
              <span className="text-white/40 text-[10px]">
                Lv.{lifeState?.growth?.level || 1}
              </span>
            </div>

            <div className="relative z-10 w-full h-full">
              <Live2DPlayer
                key={currentCharacter.id}
                ref={live2dRef}
                modelPath={currentCharacter.path}
                modelName={currentCharacter.model}
                scale={currentCharacter.scale}
                positionY={currentCharacter.positionY}
                onModelLoaded={() => setModelReady(true)}
                onError={(err) => console.error("Live2D error:", err)}
              />
            </div>
            <div 
              className="absolute bottom-0 left-0 w-full pointer-events-none"
              style={{ 
                height: "140px",
                background: "radial-gradient(ellipse at 30% 100%, rgba(147,112,219,0.12) 0%, transparent 65%)",
              }}
            />
          </div>
        )}

        <div className="flex-1 flex flex-col min-h-0 px-4 md:px-0 md:pr-20 lg:pr-28 md:pl-2">
          {isMobile && (
            <div className="md:hidden flex justify-center pt-4 pb-2 h-64">
              <div className="relative w-full h-full">
                <Live2DPlayer
                  key={`mobile-${currentCharacter.id}`}
                  modelPath={currentCharacter.path}
                  modelName={currentCharacter.model}
                  scale={1.5}
                  positionY={0.5}
                />
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto py-4 pr-1">
            <div className="mb-4 px-1">
              <div className="rounded-2xl p-4" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{currentCharacter.avatar}</span>
                    <span className="text-sm font-medium text-white/90">{currentCharacter.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full text-white/60" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
                      Lv.{lifeState?.growth?.level || 1}
                    </span>
                  </div>
                  <div className="text-[10px] px-2 py-1 rounded-full" style={{ 
                    backgroundColor: getModeColor(lifeState?.currentMode),
                    color: "#fff"
                  }}>
                    {PERSONA_MODE_LABELS[(lifeState?.currentMode || "normal") as PersonaMode] || "正常模式"}
                  </div>
                </div>
                
                <div className="space-y-2.5">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-pink-400">❤️ 好感度</span>
                      <span className="text-white/70">{Math.round(lifeState?.persona?.affection || 50)}/100</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${lifeState?.persona?.affection || 50}%`,
                          background: "linear-gradient(90deg, #fb7185, #f472b6)"
                        }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-orange-400">💢 怨念值</span>
                      <span className="text-white/70">{Math.round(lifeState?.persona?.resentment || 0)}/100</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${lifeState?.persona?.resentment || 0}%`,
                          background: "linear-gradient(90deg, #f97316, #ef4444)"
                        }}
                      />
                    </div>
                  </div>

                  {lifeState?.relationship?.coldTreatmentActive && (
                    <div className="mt-3 p-3 rounded-xl text-center" style={{ backgroundColor: "rgba(239,68,68,0.15)" }}>
                      <p className="text-xs text-red-300 mb-2">😔 正在冷战中...</p>
                      <p className="text-[10px] text-white/50">ta现在不想理你，试着哄哄ta吧</p>
                    </div>
                  )}

                  {lifeState?.relationship?.reconciliationAvailable && (
                    <button 
                      className="w-full mt-2 py-2 rounded-xl text-xs font-medium text-white transition-all hover:opacity-90"
                      style={{ background: "linear-gradient(135deg, #8b5cf6, #ec4899)" }}
                    >
                      💝 送礼物和解
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-center mb-5">
              <div 
                className="px-3 py-1.5 rounded-lg text-[10px] text-white/30 max-w-sm text-center leading-snug"
                style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
              >
                {profile?.name || "星野"}是AI伴侣，不能替代专业心理咨询
              </div>
            </div>

            <div className="space-y-2.5">
              {convertedMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-end gap-1.5 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.sender === "lover" && (
                    <div className="flex items-end gap-1.5">
                      <div
                        className="max-w-[62%] px-4 py-2.5 text-sm leading-relaxed"
                        style={{
                          backgroundColor: "rgba(255,255,255,0.9)",
                          color: "#1a1a2e",
                          borderRadius: "18px 18px 18px 6px",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        }}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                      <button 
                        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mb-0.5 transition-all hover:scale-110"
                        style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                      >
                        <span style={{ fontSize: "12px" }}>😊</span>
                      </button>
                    </div>
                  )}
                  {msg.sender === "user" && (
                    <div
                      className="max-w-[62%] px-4 py-2.5 text-sm leading-relaxed"
                      style={{
                        background: "linear-gradient(135deg, #6c63ff 0%, #8b7cf8 100%)",
                        color: "#ffffff",
                        borderRadius: "18px 18px 6px 18px",
                        boxShadow: "0 2px 10px rgba(108,99,255,0.25)",
                      }}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex items-end gap-1.5 justify-start">
                  <div
                    className="px-5 py-3"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.9)",
                      borderRadius: "18px 18px 18px 6px",
                    }}
                  >
                    <div className="flex space-x-1.5 items-center h-3">
                      <span 
                        className="w-2 h-2 rounded-full bg-slate-400/60 animate-bounce" 
                        style={{ animationDuration: "1.4s" }} 
                      />
                      <span 
                        className="w-2 h-2 rounded-full bg-slate-400/60 animate-bounce" 
                        style={{ animationDelay: "200ms", animationDuration: "1.4s" }} 
                      />
                      <span 
                        className="w-2 h-2 rounded-full bg-slate-400/60 animate-bounce" 
                        style={{ animationDelay: "400ms", animationDuration: "1.4s" }} 
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div ref={messagesEndRef} />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {QUICK_REPLIES.map((text, i) => (
              <button
                key={i}
                onClick={() => sendMessage(text)}
                className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs text-white/70 hover:text-white hover:bg-white/[0.12] transition-all"
                style={{ backgroundColor: "rgba(255,255,255,0.07)" }}
              >
                {text}
              </button>
            ))}
          </div>

          <div className="py-3">
            <div 
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-full"
              style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
            >
              <button 
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all hover:scale-105"
                style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </button>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入消息..."
                className="flex-1 bg-transparent text-sm text-white placeholder-white/35 outline-none py-2 px-1"
              />

              <div className="flex items-center gap-1 flex-shrink-0">
                <button 
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-105"
                  style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </button>

                <button 
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-105"
                  style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                >
                  <span className="text-sm">😊</span>
                </button>

                <button 
                  onClick={handleMicToggle}
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-105"
                  style={{ 
                    backgroundColor: micActive ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.08)",
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showSettings && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setShowSettings(false)}
          />
          <div 
            className="fixed top-0 right-0 bottom-0 z-50 w-80 shadow-2xl overflow-y-auto"
            style={{ backgroundColor: "#1a1a28" }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
              <h2 className="text-base font-semibold text-white">设置</h2>
              <button 
                onClick={() => setShowSettings(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-white/60 hover:text-white/90"
                style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            <div className="px-4 pb-6 space-y-5 pt-4">
              <div 
                className="p-4 rounded-2xl text-white"
                style={{ background: "linear-gradient(135deg, #818cf8 0%, #f472b6 100%)" }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💎</span>
                  <div>
                    <p className="text-sm font-semibold">升级{profile?.name || "星野"}会员</p>
                    <p className="text-xs opacity-85 mt-0.5 leading-relaxed">
                      高级AI、语音通话、增强现实等更多功能
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-0.5">
                <p className="text-xs text-white/35 px-3 pb-1.5 font-medium">显示</p>
                {[
                  { label: "3D 形象", enabled: false },
                  { label: "背景音乐", enabled: false },
                  { label: "深色主题", enabled: true },
                  { label: "显示等级", enabled: true },
                ].map((item, i) => (
                  <div 
                    key={i} 
                    className="flex items-center justify-between py-2.5 px-3.5 rounded-xl"
                  >
                    <span className="text-sm text-white/80">{item.label}</span>
                    <div 
                      className="w-11 h-6 rounded-full relative cursor-pointer"
                      style={{ backgroundColor: item.enabled ? "#4ade80" : "rgba(255,255,255,0.15)" }}
                    >
                      <div 
                        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
                        style={{ left: item.enabled ? "22px" : "2px" }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-0.5">
                <p className="text-xs text-white/35 px-3 pb-1.5 font-medium">社区</p>
                {[
                  { label: "Reddit", color: "#ff4500" },
                  { label: "Discord", color: "#5865f2" },
                  { label: "微博", color: "#e6162d" },
                ].map((item, i) => (
                  <button
                    key={i}
                    className="w-full flex items-center justify-between py-2.5 px-3.5 rounded-xl text-left hover:bg-white/[0.04] transition-colors"
                  >
                    <span className="text-sm text-white/80 flex items-center gap-3">
                      <span 
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ backgroundColor: item.color }}
                      >
                        {item.label[0]}
                      </span>
                      {item.label}
                    </span>
                    <span className="text-white/30 text-sm">↗</span>
                  </button>
                ))}
              </div>

              <div className="pt-3 mt-2 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                <button className="w-full py-2.5 px-3.5 rounded-xl text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                  退出登录
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <nav 
        className="md:hidden flex-shrink-0 px-4 py-2"
        style={{ 
          backgroundColor: "rgba(18,18,26,0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <div className="flex justify-around items-center">
          {NAV_ITEMS.slice(0, 5).map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 transition-colors ${activeNav === item.id ? "text-white" : "text-white/40"}`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-[10px]">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </main>
  );
}
