"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { ChatMessage } from "@/data/lover";
import { useCharacterAgent, useSpeech } from "@/lib/hooks";
import { MoodType } from "@/lib/core";
import type { Live2DPlayerRef } from "@/components/Lover/Live2DPlayer";

const Live2DPlayer = dynamic(() => import("@/components/Lover/Live2DPlayer"), {
  ssr: false,
  loading: () => null,
});

const CHARACTERS = [
  { id: "HaruGreeter", name: "Haru", path: "/live2d-models/HaruGreeter", model: "HaruGreeter", avatar: "🌸", scale: 1.1, positionY: 0.5 },
];

const NAV_ITEMS = [
  { id: "chat", label: "Chat", icon: "💬" },
  { id: "activities", label: "Activities", icon: "🎮" },
  { id: "memory", label: "Memory", icon: "🌟" },
  { id: "diary", label: "Diary", icon: "📔" },
  { id: "profile", label: "Profile", icon: "👤" },
  { id: "room", label: "Room", icon: "🏠" },
];

const QUICK_REPLIES = [
  "How are you? 💕",
  "Tell me a story",
  "I'm feeling sad 😢",
  "Good morning! ☀️",
  "Sing me a song 🎵",
  "I love you ❤️",
];

export default function LoverPage() {
  const { messages, mood, isTyping, sendMessage } = useCharacterAgent();
  const { isListening, startListening, stopListening } = useSpeech();
  const [activeNav, setActiveNav] = useState("chat");
  const [showSettings, setShowSettings] = useState(false);
  const [showCharacterPicker, setShowCharacterPicker] = useState(false);
  const [currentCharacter, setCurrentCharacter] = useState(CHARACTERS[0]);
  const [input, setInput] = useState("");
  const [micActive, setMicActive] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const live2dRef = useRef<Live2DPlayerRef>(null);
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

  const CHAR_IMG = "";

  return (
    <main 
      className="relative h-screen w-screen overflow-hidden flex flex-col"
      style={{ 
        background: "radial-gradient(ellipse at 25% 80%, #2a2a3e 0%, #1a1a28 50%, #12121a 100%)",
      }}
    >
      {/* Ambient glow behind character */}
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

      {/* Top Navigation Bar */}
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
              background: "linear-gradient(135deg, #7c7cff 0%, #b084ff 100%)",
              boxShadow: "0 2px 10px rgba(124,124,255,0.3)",
            }}
          >
            R
          </div>
          <span 
            className="px-3 py-1 rounded-full text-xs font-medium text-white/70"
            style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
          >
            Level 2
          </span>
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

      {/* Main Content */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Left - Character Area */}
        <div className="hidden md:flex md:w-[38%] lg:w-[35%] relative items-end justify-start">
          {/* Character picker button */}
          <button
            onClick={() => setShowCharacterPicker(!showCharacterPicker)}
            className="absolute top-4 left-4 z-20 px-3 py-2 rounded-full text-xs font-medium text-white/80 hover:text-white transition-all flex items-center gap-2"
            style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
          >
            <span>{currentCharacter.avatar}</span>
            <span>{currentCharacter.name}</span>
            <span className="text-white/40">▾</span>
          </button>

          {/* Character picker dropdown */}
          {showCharacterPicker && (
            <div 
              className="absolute top-14 left-4 z-30 rounded-2xl p-2 w-52 shadow-2xl"
              style={{ backgroundColor: "rgba(26,26,40,0.95)", backdropFilter: "blur(20px)" }}
            >
              {CHARACTERS.map((char) => (
                <button
                  key={char.id}
                  onClick={() => {
                    setCurrentCharacter(char);
                    setShowCharacterPicker(false);
                    setModelReady(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                    currentCharacter.id === char.id
                      ? "bg-white/10"
                      : "hover:bg-white/5"
                  }`}
                >
                  <span className="text-xl">{char.avatar}</span>
                  <span className="text-sm text-white/80">{char.name}</span>
                  {currentCharacter.id === char.id && (
                    <span className="ml-auto text-xs text-purple-400">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}

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
          {/* Floor glow */}
          <div 
            className="absolute bottom-0 left-0 w-full pointer-events-none"
            style={{ 
              height: "140px",
              background: "radial-gradient(ellipse at 30% 100%, rgba(147,112,219,0.12) 0%, transparent 65%)",
            }}
          />
        </div>

        {/* Right - Chat Area */}
        <div className="flex-1 flex flex-col min-h-0 px-4 md:px-0 md:pr-20 lg:pr-28 md:pl-2">
          {/* Mobile character */}
          <div className="md:hidden flex justify-center pt-4 pb-2">
            <div className="relative" style={{ width: "200px", height: "280px" }}>
              <Live2DPlayer
                key={`mobile-${currentCharacter.id}`}
                modelPath={currentCharacter.path}
                modelName={currentCharacter.model}
                scale={1}
              />
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto py-4 pr-1">
            <div className="flex justify-center mb-5">
              <div 
                className="px-3 py-1.5 rounded-lg text-[10px] text-white/30 max-w-sm text-center leading-snug"
                style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
              >
                Replika is an AI companion and is not a substitute for professional help.
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

          {/* Quick Replies */}
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

          {/* Input Bar */}
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
                placeholder="Start typing..."
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

      {/* Settings Panel */}
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
              <h2 className="text-base font-semibold text-white">Settings</h2>
              <button 
                onClick={() => setShowSettings(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-white/60 hover:text-white/90"
                style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            <div className="px-4 pb-6 space-y-5 pt-4">
              {/* PRO banner */}
              <div 
                className="p-4 rounded-2xl text-white"
                style={{ background: "linear-gradient(135deg, #818cf8 0%, #f472b6 100%)" }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💎</span>
                  <div>
                    <p className="text-sm font-semibold">Unlock Replika PRO</p>
                    <p className="text-xs opacity-85 mt-0.5 leading-relaxed">
                      Advanced AI, voice calls, augmented reality, and more.
                    </p>
                  </div>
                </div>
              </div>

              {/* Display toggles */}
              <div className="space-y-0.5">
                <p className="text-xs text-white/35 px-3 pb-1.5 font-medium">Display</p>
                {[
                  { label: "3D Avatar", enabled: false },
                  { label: "Background Music", enabled: false },
                  { label: "Dark Theme", enabled: true },
                  { label: "Show Level", enabled: true },
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

              {/* Community */}
              <div className="space-y-0.5">
                <p className="text-xs text-white/35 px-3 pb-1.5 font-medium">Community</p>
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

              {/* Logout */}
              <div className="pt-3 mt-2 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                <button className="w-full py-2.5 px-3.5 rounded-xl text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                  Log Out
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Mobile Bottom Nav */}
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
