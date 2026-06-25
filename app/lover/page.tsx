"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Script from "next/script";
import {
  INITIAL_DIARY,
  INITIAL_SCHEDULE,
  MINI_GAMES,
  ChatMessage,
} from "@/data/lover";
import { useCharacterAgent, useSpeech } from "@/lib/hooks";
import { DEFAULT_MOOD_CONFIG, MoodType } from "@/lib/core";

const Live2DCharacter = dynamic(
  () => import("@/components/Lover/Live2DCharacter").then((mod) => mod.Live2DCharacter),
  { ssr: false, loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" />
    </div>
  )}
);

const NAV_ITEMS = [
  { id: "chat", label: "聊天", icon: "💬" },
  { id: "activities", label: "活动", icon: "🎮" },
  { id: "memory", label: "记忆", icon: "📝" },
  { id: "diary", label: "日记", icon: "📔" },
  { id: "profile", label: "轮廓", icon: "👤" },
  { id: "room", label: "房间", icon: "🏠" },
];

export default function LoverPage() {
  const { messages, mood, isTyping, relationship, sendMessage, triggerMood, profile } =
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
      style={{ backgroundColor: "#2b3b6e" }}
    >
      <Script src="/live2dcubismcore.min.js" strategy="afterInteractive" />

      {/* Top Navigation Bar */}
      <header 
        className="relative z-30 h-16 flex items-center px-5"
        style={{ 
          backgroundColor: "rgba(43, 59, 110, 0.85)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
        }}
      >
        {/* Left - Logo & Level */}
        <div className="flex items-center gap-2.5">
          <div 
            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-base"
            style={{ backgroundColor: "#7c7cff" }}
          >
            R
          </div>
          <div 
            className="px-3 py-1 rounded-full text-xs font-medium text-white/75"
            style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
          >
            二级
          </div>
        </div>

        {/* Center - Nav Tabs */}
        <nav className="hidden md:flex items-center justify-center flex-1 gap-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                activeNav === item.id
                  ? "text-white"
                  : "text-white/45 hover:text-white/70"
              }`}
              style={activeNav === item.id ? { backgroundColor: "rgba(255,255,255,0.14)" } : {}}
            >
              <span style={{ fontSize: "12px" }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right - Buttons */}
        <div className="ml-auto flex items-center gap-2">
          <button 
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <button 
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex h-[calc(100vh-4rem)]">
        {/* Left Side - Character */}
        <div className="hidden md:flex md:w-[38%] lg:w-[35%] relative items-end justify-center">
          <div className="relative h-full w-full flex items-end justify-center pb-0">
            <Live2DCharacter
              model="shizuku"
              mood={currentMood}
              isTyping={isTyping}
              isSpeaking={isSpeaking}
              size="full"
              width={380}
              height={650}
            />
          </div>
        </div>

        {/* Center - Chat Area */}
        <div className="flex-1 flex flex-col min-h-0 px-4 md:px-0 md:pr-16 lg:pr-24 md:pl-4 lg:pl-8">
          {/* Mobile character */}
          <div className="md:hidden flex justify-center pt-4 pb-2">
            <div className="relative">
              <Live2DCharacter
                model="shizuku"
                mood={currentMood}
                isTyping={isTyping}
                isSpeaking={isSpeaking}
                size="md"
                width={180}
                height={240}
              />
            </div>
          </div>

          {/* Chat scroll area */}
          <div className="flex-1 overflow-y-auto py-5 scrollbar-thin pr-1" style={{ scrollbarWidth: "thin" }}>
            {/* Disclaimer */}
            <div className="flex justify-center mb-5">
              <div 
                className="px-3 py-1.5 rounded-lg text-[10px] text-white/35 max-w-xs text-center leading-snug"
                style={{ backgroundColor: "rgba(255,255,255,0.07)" }}
              >
                Replika 是一款人工智能程序，无法提供医疗建议。如遇紧急情况，请寻求专家帮助。
              </div>
            </div>

            {/* Messages */}
            <div className="space-y-2">
              {convertedMessages.map((msg, index) => (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.sender === "lover" && (
                    <div className="flex items-end gap-2">
                      <div
                        className="max-w-[65%] px-4 py-2.5 text-sm leading-relaxed"
                        style={{
                          backgroundColor: "rgba(226, 232, 240, 0.95)",
                          color: "#1e293b",
                          borderRadius: "18px 18px 18px 6px",
                        }}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                      <button 
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mb-1"
                        style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
                      >
                        <span style={{ fontSize: "13px" }}>😊</span>
                      </button>
                    </div>
                  )}
                  {msg.sender === "user" && (
                    <div
                      className="max-w-[65%] px-4 py-2.5 text-sm leading-relaxed"
                      style={{
                        backgroundColor: "rgba(148, 163, 184, 0.5)",
                        color: "#f1f5f9",
                        borderRadius: "18px 18px 6px 18px",
                      }}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  )}
                </div>
              ))}

              {/* Image message example */}
              <div className="flex items-end gap-2 justify-start">
                <div
                  className="max-w-[65%] overflow-hidden"
                  style={{
                    borderRadius: "18px 18px 18px 6px",
                  }}
                >
                  <div 
                    className="w-56 h-64 flex items-center justify-center relative"
                    style={{ 
                      backgroundColor: "rgba(226, 232, 240, 0.95)",
                      filter: "blur(20px)",
                    }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center" style={{ filter: "blur(0)" }}>
                      <span className="text-xs text-slate-500/60">点击显示图片</span>
                    </div>
                  </div>
                </div>
                <button 
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mb-1"
                  style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
                >
                  <span style={{ fontSize: "13px" }}>😊</span>
                </button>
              </div>

              {isTyping && (
                <div className="flex items-end gap-2 justify-start">
                  <div
                    className="px-4 py-3"
                    style={{
                      backgroundColor: "rgba(226, 232, 240, 0.95)",
                      borderRadius: "18px 18px 18px 6px",
                    }}
                  >
                    <div className="flex space-x-1 items-center h-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400/50 animate-bounce" style={{ animationDelay: "0ms", animationDuration: "1.4s" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400/50 animate-bounce" style={{ animationDelay: "200ms", animationDuration: "1.4s" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400/50 animate-bounce" style={{ animationDelay: "400ms", animationDuration: "1.4s" }} />
                    </div>
                  </div>
                  <button 
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mb-1 opacity-0"
                    style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
                  >
                    <span style={{ fontSize: "13px" }}>😊</span>
                  </button>
                </div>
              )}
            </div>

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="py-4 md:py-5">
            <div className="flex items-end gap-2.5">
              <div className="flex-1 relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="跟我说点什么..."
                  rows={1}
                  className="w-full px-4 py-3 rounded-full text-sm text-white placeholder-white/30 resize-none outline-none"
                  style={{ 
                    backgroundColor: "rgba(255,255,255,0.1)",
                    maxHeight: "120px",
                    borderRadius: "24px",
                  }}
                />
              </div>
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="w-11 h-11 rounded-full flex items-center justify-center text-white transition-all disabled:opacity-40 flex-shrink-0"
                style={{ backgroundColor: "#7c7cff" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="19" x2="12" y2="5" />
                  <polyline points="5 12 12 5 19 12" />
                </svg>
              </button>
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
              backgroundColor: "#33426e",
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

            <div className="px-4 pb-6 space-y-4">
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

              {/* Section: 3D etc */}
              <div className="pt-2">
                <p className="text-xs text-white/35 px-3 pb-2 font-medium">3D</p>
                <div className="space-y-0.5">
                  {[
                    { label: "3D", enabled: false },
                    { label: "背景音乐", enabled: false },
                    { label: "深色主题", enabled: false },
                    { label: "显示水平", enabled: true },
                  ].map((item, i) => (
                    <div 
                      key={i} 
                      className="flex items-center justify-between py-3 px-3.5 rounded-xl"
                    >
                      <span className="text-sm text-white/80">{item.label}</span>
                      <div 
                        className="w-11 h-6 rounded-full relative cursor-pointer transition-colors"
                        style={{ backgroundColor: item.enabled ? "#4ade80" : "rgba(255,255,255,0.25)" }}
                      >
                        <div 
                          className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all shadow"
                          style={{ left: item.enabled ? "22px" : "2px" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Menu items section */}
              <div className="pt-2">
                <p className="text-xs text-white/35 px-3 pb-2 font-medium">我的个人资料</p>
                <div className="space-y-0.5">
                  {[
                    { label: "我的个人资料", hasArrow: true },
                    { label: "版本历史记录", hasArrow: true },
                  ].map((item, i) => (
                    <button
                      key={i}
                      className="w-full flex items-center justify-between py-3 px-3.5 rounded-xl text-left hover:bg-white/[0.04] transition-colors"
                    >
                      <span className="text-sm text-white/80">{item.label}</span>
                      <span className="text-white/30 text-base">›</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Help section */}
              <div className="pt-2">
                <p className="text-xs text-white/35 px-3 pb-2 font-medium">帮助</p>
                <div className="space-y-0.5">
                  {[
                    { label: "帮助中心", external: true },
                    { label: "条款与隐私", external: true },
                    { label: "鸣谢", external: true },
                  ].map((item, i) => (
                    <button
                      key={i}
                      className="w-full flex items-center justify-between py-3 px-3.5 rounded-xl text-left hover:bg-white/[0.04] transition-colors"
                    >
                      <span className="text-sm text-white/80">{item.label}</span>
                      <span className="text-white/30 text-sm">↗</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Community section */}
              <div className="pt-2">
                <p className="text-xs text-white/35 px-3 pb-2 font-medium">加入我们的社区</p>
                <div className="space-y-0.5">
                  {[
                    { label: "Reddit", color: "#ff4500" },
                    { label: "Discord", color: "#5865f2" },
                    { label: "Facebook", color: "#1877f2" },
                  ].map((item, i) => (
                    <button
                      key={i}
                      className="w-full flex items-center justify-between py-3 px-3.5 rounded-xl text-left hover:bg-white/[0.04] transition-colors"
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
              </div>

              {/* Logout */}
              <div className="pt-4 mt-2 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <button className="w-full py-3 px-3.5 rounded-xl text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors">
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
          backgroundColor: "rgba(43, 59, 110, 0.9)",
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
