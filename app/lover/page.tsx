"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  ChatMessage,
} from "@/data/lover";
import { useCharacterAgent, useSpeech } from "@/lib/hooks";
import { MoodType } from "@/lib/core";

const NAV_ITEMS = [
  { id: "chat", label: "聊天", icon: "💬" },
  { id: "activities", label: "活动", icon: "🎮" },
  { id: "memory", label: "记忆", icon: "📝" },
  { id: "diary", label: "日记", icon: "📔" },
  { id: "profile", label: "轮廓", icon: "👤" },
  { id: "room", label: "房间", icon: "🏠" },
];

export default function LoverPage() {
  const { messages, mood, isTyping, relationship, sendMessage, profile } =
    useCharacterAgent();
  const {
    enabled: speechEnabled,
    isSpeaking,
    isListening,
    speak,
    stopSpeaking,
    startListening,
    stopListening,
  } = useSpeech();

  const [activeNav, setActiveNav] = useState("chat");
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentMood = (mood?.mood ?? "happy") as MoodType;

  const convertedMessages: ChatMessage[] = messages.map((msg) => ({
    id: msg.id,
    sender: msg.sender === "assistant" ? "lover" : "user",
    content: msg.content,
    timestamp: new Date(msg.timestamp),
    mood: msg.emotion.mood as any,
  }));

  useEffect(() => {
    if (voiceEnabled && isSpeaking === false && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.sender === "assistant" && lastMsg.content) {
        const timer = setTimeout(() => {
          speak(lastMsg.content);
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [messages, voiceEnabled, isSpeaking, speak]);

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

  const handleVoiceToggle = () => {
    if (voiceEnabled) {
      stopSpeaking();
    }
    setVoiceEnabled(!voiceEnabled);
  };

  return (
    <main 
      className="relative min-h-screen overflow-hidden"
      style={{ backgroundColor: "#3b5998" }}
    >
      {/* Ambient glow behind character */}
      <div 
        className="absolute left-[15%] top-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ 
          background: "radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)",
        }}
      />

      {/* Top Navigation Bar */}
      <header 
        className="relative z-30 h-14 flex items-center px-5"
        style={{ 
          backgroundColor: "rgba(59, 89, 152, 0.6)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        {/* Left - Logo & Level */}
        <div className="flex items-center gap-2.5">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: "#7c7cff" }}
          >
            R
          </div>
          <button 
            className="px-3 py-1 rounded-full text-xs font-medium text-white/75"
            style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
          >
            二级
          </button>
        </div>

        {/* Center - Nav Tabs */}
        <nav className="hidden md:flex items-center justify-center flex-1 gap-0.5">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`px-2.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1 ${
                activeNav === item.id
                  ? "text-white"
                  : "text-white/45 hover:text-white/70"
              }`}
              style={activeNav === item.id ? { backgroundColor: "rgba(255,255,255,0.15)" } : {}}
            >
              <span style={{ fontSize: "11px" }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right - Buttons */}
        <div className="ml-auto flex items-center gap-2">
          <button 
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </button>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex h-[calc(100vh-3.5rem)]">
        {/* Left Side - Character (2D image placeholder) */}
        <div className="hidden md:flex md:w-[38%] lg:w-[35%] relative items-end justify-center">
          <div className="relative h-full w-full flex items-end justify-center">
            <div className="relative w-full h-full flex items-end justify-center">
              <div className="relative">
                <img
                  src="/live2d-models/shizuku/runtime/shizuku.1024/texture_00.png"
                  alt="Character"
                  className="object-contain object-bottom"
                  style={{ 
                    width: "auto", 
                    height: "70vh",
                    maxHeight: "600px",
                    filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.3))",
                  }}
                />
                {/* Floor shadow */}
                <div 
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-48 h-6 rounded-full"
                  style={{ 
                    background: "radial-gradient(ellipse at center, rgba(0,0,0,0.25) 0%, transparent 70%)",
                    filter: "blur(8px)",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Center - Chat Area */}
        <div className="flex-1 flex flex-col min-h-0 px-4 md:px-0 md:pr-12 lg:pr-16 md:pl-2 lg:pl-4">
          {/* Mobile character */}
          <div className="md:hidden flex justify-center pt-4 pb-2">
            <img
              src="/live2d-models/shizuku/runtime/shizuku.1024/texture_00.png"
              alt="Character"
              className="object-contain"
              style={{ 
                width: "120px", 
                height: "160px",
                filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.3))",
              }}
            />
          </div>

          {/* Chat scroll area */}
          <div className="flex-1 overflow-y-auto py-4 scrollbar-thin pr-1">
            {/* Disclaimer */}
            <div className="flex justify-center mb-4">
              <div 
                className="px-3 py-1.5 rounded-lg text-[10px] text-white/40 max-w-xs text-center leading-snug"
                style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
              >
                Replika 是一款人工智能程序，无法提供医疗建议。如遇紧急情况，请寻求专家帮助。
              </div>
            </div>

            {/* Messages */}
            <div className="space-y-2">
              {convertedMessages.map((msg, index) => (
                <div
                  key={msg.id}
                  className={`flex items-end gap-1.5 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.sender === "lover" && (
                    <div className="flex items-end gap-1.5">
                      <div
                        className="max-w-[60%] px-3.5 py-2 text-sm leading-relaxed"
                        style={{
                          backgroundColor: "rgba(255,255,255,0.92)",
                          color: "#1a1a2e",
                          borderRadius: "16px 16px 16px 4px",
                        }}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                      <button 
                        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mb-0.5"
                        style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
                      >
                        <span style={{ fontSize: "12px" }}>😊</span>
                      </button>
                    </div>
                  )}
                  {msg.sender === "user" && (
                    <div
                      className="max-w-[60%] px-3.5 py-2 text-sm leading-relaxed"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.2)",
                        color: "#ffffff",
                        borderRadius: "16px 16px 4px 16px",
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
                    className="px-4 py-2.5"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.92)",
                      borderRadius: "16px 16px 16px 4px",
                    }}
                  >
                    <div className="flex space-x-1 items-center h-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400/50 animate-bounce" style={{ animationDelay: "0ms", animationDuration: "1.4s" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400/50 animate-bounce" style={{ animationDelay: "200ms", animationDuration: "1.4s" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400/50 animate-bounce" style={{ animationDelay: "400ms", animationDuration: "1.4s" }} />
                    </div>
                  </div>
                  <button 
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mb-0.5 opacity-0"
                    style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
                  >
                    <span style={{ fontSize: "12px" }}>😊</span>
                  </button>
                </div>
              )}
            </div>

            <div ref={messagesEndRef} />
          </div>

          {/* Input area - Replika style bottom bar */}
          <div className="py-3 md:py-4">
            <div 
              className="flex items-center gap-2 px-3 py-2 rounded-full"
              style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
            >
              {/* Phone button */}
              <button 
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </button>

              {/* Input */}
              <div className="flex-1">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="开始输入"
                  className="w-full bg-transparent text-sm text-white placeholder-white/40 outline-none py-1.5"
                />
              </div>

              {/* Right side buttons */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Image button */}
                <button 
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </button>

                {/* Emoji button */}
                <button 
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                >
                  <span style={{ fontSize: "14px" }}>😊</span>
                </button>

                {/* Mic button */}
                <button 
                  onClick={handleMicToggle}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: micActive ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.1)" }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
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

      {/* Settings Panel - Right Side */}
      {showSettings && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setShowSettings(false)}
          />
          <div 
            className="fixed top-0 right-0 bottom-0 z-50 w-80 shadow-2xl overflow-y-auto"
            style={{ 
              backgroundColor: "#2d3a5c",
            }}
          >
            <div className="flex items-center justify-between px-5 py-4">
              <h2 className="text-base font-semibold text-white">设置</h2>
              <button 
                onClick={() => setShowSettings(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-white/60 hover:text-white/90"
                style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="px-4 pb-6 space-y-5">
              {/* PRO banner */}
              <div 
                className="p-4 rounded-2xl text-white"
                style={{ background: "linear-gradient(135deg, #818cf8, #f472b6)" }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💎</span>
                  <div>
                    <p className="text-sm font-semibold">解锁 Replika PRO</p>
                    <p className="text-xs opacity-85 mt-0.5 leading-relaxed">获取高级功能，包括无限语音留言、图像生成、活动等。</p>
                  </div>
                </div>
              </div>

              {/* Toggle section */}
              <div className="space-y-0.5">
                <p className="text-xs text-white/35 px-3 pb-1.5 font-medium">显示</p>
                {[
                  { label: "3D", enabled: false },
                  { label: "背景音乐", enabled: false },
                  { label: "深色主题", enabled: false },
                  { label: "显示水平", enabled: true },
                ].map((item, i) => (
                  <div 
                    key={i} 
                    className="flex items-center justify-between py-2.5 px-3.5 rounded-xl"
                  >
                    <span className="text-sm text-white/80">{item.label}</span>
                    <div 
                      className="w-11 h-6 rounded-full relative cursor-pointer transition-colors"
                      style={{ backgroundColor: item.enabled ? "#4ade80" : "rgba(255,255,255,0.2)" }}
                    >
                      <div 
                        className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all shadow"
                        style={{ left: item.enabled ? "22px" : "2px" }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Profile section */}
              <div className="space-y-0.5">
                <p className="text-xs text-white/35 px-3 pb-1.5 font-medium">我的个人资料</p>
                {[
                  { label: "我的个人资料" },
                  { label: "版本历史记录" },
                ].map((item, i) => (
                  <button
                    key={i}
                    className="w-full flex items-center justify-between py-2.5 px-3.5 rounded-xl text-left hover:bg-white/[0.04] transition-colors"
                  >
                    <span className="text-sm text-white/80">{item.label}</span>
                    <span className="text-white/30 text-base">›</span>
                  </button>
                ))}
              </div>

              {/* Help section */}
              <div className="space-y-0.5">
                <p className="text-xs text-white/35 px-3 pb-1.5 font-medium">帮助</p>
                {[
                  { label: "帮助中心" },
                  { label: "条款与隐私" },
                  { label: "鸣谢" },
                ].map((item, i) => (
                  <button
                    key={i}
                    className="w-full flex items-center justify-between py-2.5 px-3.5 rounded-xl text-left hover:bg-white/[0.04] transition-colors"
                  >
                    <span className="text-sm text-white/80">{item.label}</span>
                    <span className="text-white/30 text-sm">↗</span>
                  </button>
                ))}
              </div>

              {/* Community section */}
              <div className="space-y-0.5">
                <p className="text-xs text-white/35 px-3 pb-1.5 font-medium">加入我们的社区</p>
                {[
                  { label: "Reddit", color: "#ff4500" },
                  { label: "Discord", color: "#5865f2" },
                  { label: "Facebook", color: "#1877f2" },
                ].map((item, i) => (
                  <button
                    key={i}
                    className="w-full flex items-center justify-between py-2.5 px-3.5 rounded-xl text-left hover:bg-white/[0.04] transition-colors"
                  >
                    <span className="text-sm text-white/80 flex items-center gap-3">
                      <span 
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white"
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

              {/* Logout */}
              <div className="pt-3 mt-2 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <button className="w-full py-2.5 px-3.5 rounded-xl text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                  退出登录
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Mobile bottom nav */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 px-4 py-2"
        style={{ 
          backgroundColor: "rgba(59, 89, 152, 0.9)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <div className="flex justify-around items-center">
          {NAV_ITEMS.slice(0, 5).map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 transition-colors ${
                activeNav === item.id ? "text-white" : "text-white/40"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-[10px]">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </main>
  );
}
