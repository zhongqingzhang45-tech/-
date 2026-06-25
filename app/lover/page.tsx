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
      <div className="w-8 h-8 border-3 border-white/10 border-t-white/40 rounded-full animate-spin" />
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
      style={{ 
        background: "linear-gradient(180deg, #2a3a6b 0%, #1e2a4a 50%, #1a2340 100%)",
      }}
    >
      <Script src="/live2dcubismcore.min.js" strategy="afterInteractive" />

      {/* Top Navigation Bar */}
      <header 
        className="relative z-30 h-16 flex items-center px-6 md:px-10"
        style={{ 
          backgroundColor: "rgba(42, 58, 107, 0.4)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Left - Logo & Level */}
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
            style={{ backgroundColor: "#7c7cff" }}
          >
            R
          </div>
          <button 
            className="px-4 py-1.5 rounded-full text-xs font-medium text-white/80"
            style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
          >
            二级
          </button>
        </div>

        {/* Center - Nav Tabs */}
        <nav className="hidden md:flex items-center justify-center flex-1 gap-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`px-3.5 py-2 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                activeNav === item.id
                  ? "text-white"
                  : "text-white/50 hover:text-white/75"
              }`}
              style={activeNav === item.id ? { backgroundColor: "rgba(255,255,255,0.12)" } : {}}
            >
              <span style={{ fontSize: "13px" }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right - Menu */}
        <div className="ml-auto flex items-center gap-2">
          {speechEnabled && (
            <>
              <button
                onClick={handleVoiceToggle}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
                style={{ backgroundColor: voiceEnabled ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.08)" }}
                title={voiceEnabled ? "关闭语音" : "开启语音"}
              >
                <span className="text-sm">{voiceEnabled ? "🔊" : "🔈"}</span>
              </button>
              <button
                onClick={handleMicToggle}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
                style={{ backgroundColor: micActive ? "rgba(239,68,68,0.35)" : "rgba(255,255,255,0.08)" }}
                title={micActive ? "停止录音" : "开始说话"}
              >
                <span className="text-sm">{micActive ? "🎤" : "🎙️"}</span>
              </button>
            </>
          )}
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/70">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex h-[calc(100vh-4rem)]">
        {/* Left Side - Character */}
        <div className="hidden md:flex md:w-[35%] lg:w-[32%] relative items-end justify-center">
          <div className="relative h-full w-full flex items-end justify-center">
            <Live2DCharacter
              model="shizuku"
              mood={currentMood}
              isTyping={isTyping}
              isSpeaking={isSpeaking}
              size="full"
              width={360}
              height={550}
            />
          </div>
        </div>

        {/* Center - Chat Area */}
        <div className="flex-1 flex flex-col min-h-0 px-4 md:px-0 md:pr-12 lg:pr-16 md:pl-0">
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

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto py-6 space-y-4 scrollbar-thin pr-2">
            {/* Disclaimer */}
            <div className="flex justify-center mb-4">
              <div 
                className="px-4 py-2 rounded-lg text-[11px] text-white/40 max-w-sm text-center leading-relaxed"
                style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
              >
                Replika 是一款人工智能程序，无法提供医疗建议。如遇紧急情况，请寻求专家帮助。
              </div>
            </div>

            {convertedMessages.map((msg, index) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[65%] px-4 py-2.5 text-sm leading-relaxed ${
                    msg.sender === "user"
                      ? "rounded-[18px] rounded-br-sm"
                      : "rounded-[18px] rounded-bl-sm"
                  }`}
                  style={{
                    backgroundColor: msg.sender === "user" 
                      ? "rgba(120, 144, 180, 0.5)"
                      : "rgba(220, 225, 235, 0.92)",
                    color: msg.sender === "user" ? "#e8edf5" : "#1a1f2e",
                  }}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div 
                  className="px-4 py-3 rounded-[18px] rounded-bl-sm"
                  style={{ backgroundColor: "rgba(220, 225, 235, 0.92)" }}
                >
                  <div className="flex space-x-1 items-center h-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400/50 animate-bounce" style={{ animationDelay: "0ms", animationDuration: "1.2s" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400/50 animate-bounce" style={{ animationDelay: "200ms", animationDuration: "1.2s" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400/50 animate-bounce" style={{ animationDelay: "400ms", animationDuration: "1.2s" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="py-5">
            <div className="flex items-end gap-3">
              <div className="flex-1 relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="跟我说点什么..."
                  rows={1}
                  className="w-full px-5 py-3.5 rounded-[22px] text-sm text-white placeholder-white/35 resize-none outline-none"
                  style={{ 
                    backgroundColor: "rgba(255,255,255,0.1)",
                    maxHeight: "120px",
                  }}
                />
              </div>
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="w-12 h-12 rounded-full flex items-center justify-center text-white transition-all disabled:opacity-40 shadow-lg"
                style={{ backgroundColor: "#7c7cff" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="19" x2="12" y2="5" />
                  <polyline points="5 12 12 5 19 12" />
                </svg>
              </button>
            </div>

            {/* Quick replies */}
            <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
              {[
                "想你了 💕",
                "今天好累 😮‍💨",
                "你在干嘛 🤔",
                "我爱你 ❤️",
                "唱首歌 🎵",
              ].map((text, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(text.replace(/[^\u4e00-\u9fa5]/g, ""))}
                  className="flex-shrink-0 px-4 py-2 rounded-full text-xs text-white/75 hover:text-white transition-colors"
                  style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                >
                  {text}
                </button>
              ))}
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
              borderLeft: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div 
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: "rgba(255,255,255,0.08)" }}
            >
              <h2 className="text-base font-semibold text-white">设置</h2>
              <button 
                onClick={() => setShowSettings(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white/90"
                style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* PRO banner */}
              <div 
                className="p-4 rounded-2xl text-white"
                style={{ background: "linear-gradient(135deg, #8b5cf6, #ec4899)" }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💎</span>
                  <div>
                    <p className="text-sm font-semibold">解锁 Replika PRO</p>
                    <p className="text-xs opacity-80 mt-0.5">获取高级功能，包括无限语音留言、图像生成、活动等。</p>
                  </div>
                </div>
              </div>

              {/* Toggle options */}
              <div className="space-y-2">
                {[
                  { label: "3D", enabled: false },
                  { label: "背景音乐", enabled: false },
                  { label: "深色主题", enabled: false },
                  { label: "显示水平", enabled: true },
                ].map((item, i) => (
                  <div 
                    key={i} 
                    className="flex items-center justify-between py-3 px-4 rounded-xl"
                    style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                  >
                    <span className="text-sm text-white/80">{item.label}</span>
                    <div 
                      className="w-11 h-6 rounded-full relative cursor-pointer transition-colors"
                      style={{ backgroundColor: item.enabled ? "#22c55e" : "rgba(255,255,255,0.2)" }}
                    >
                      <div 
                        className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow"
                        style={{ left: item.enabled ? "24px" : "4px" }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Menu items */}
              <div className="space-y-1 pt-2">
                {[
                  { label: "我的个人资料", icon: "👤" },
                  { label: "版本历史记录", icon: "📋" },
                  { label: "帮助中心", icon: "❓" },
                  { label: "条款与隐私", icon: "📄" },
                  { label: "鸣谢", icon: "🙏" },
                ].map((item, i) => (
                  <button
                    key={i}
                    className="w-full flex items-center justify-between py-3 px-4 rounded-xl text-left hover:bg-white/[0.05] transition-colors"
                  >
                    <span className="text-sm text-white/80 flex items-center gap-3">
                      <span>{item.icon}</span>
                      {item.label}
                    </span>
                    <span className="text-white/40 text-lg">›</span>
                  </button>
                ))}
              </div>

              {/* Community section */}
              <div className="pt-4 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <p className="text-xs text-white/40 px-4 pb-2">加入我们的社区</p>
                <div className="space-y-1">
                  {[
                    { label: "Reddit", icon: "🔴" },
                    { label: "Discord", icon: "💙" },
                    { label: "Facebook", icon: "📘" },
                  ].map((item, i) => (
                    <button
                      key={i}
                      className="w-full flex items-center justify-between py-3 px-4 rounded-xl text-left hover:bg-white/[0.05] transition-colors"
                    >
                      <span className="text-sm text-white/80 flex items-center gap-3">
                        <span>{item.icon}</span>
                        {item.label}
                      </span>
                      <span className="text-white/40 text-sm">↗</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Logout */}
              <div className="pt-4 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <button className="w-full py-3 px-4 rounded-xl text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors">
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
          backgroundColor: "rgba(42, 58, 107, 0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
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
