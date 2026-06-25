"use client";

import { useState, useEffect, useRef } from "react";
import { ChatMessage } from "@/data/lover";
import { useCharacterAgent, useSpeech } from "@/lib/hooks";
import { MoodType } from "@/lib/core";

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
  const [input, setInput] = useState("");
  const [micActive, setMicActive] = useState(false);
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

  // Replika exact color palette (extracted from cloned CSS)
  const COLORS = {
    bg: "#222222",
    headerBg: "rgba(34,34,34,0.85)",
    bubbleAI: "#f0f0f0",
    bubbleUser: "#5b5ea6",
    bubbleAIText: "#222222",
    bubbleUserText: "#ffffff",
    accent: "#6c63ff",
    inputBg: "rgba(255,255,255,0.1)",
    navActive: "rgba(255,255,255,0.15)",
    navInactive: "rgba(255,255,255,0.4)",
    panelBg: "#2a2a2a",
  };

  return (
    <main className="relative h-screen w-screen overflow-hidden flex flex-col" style={{ backgroundColor: COLORS.bg }}>
      {/* Top Navigation Bar */}
      <header className="flex-shrink-0 h-14 flex items-center px-5 z-20" style={{ backgroundColor: COLORS.headerBg, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-base" style={{ backgroundColor: COLORS.accent }}>R</div>
          <span className="px-3 py-1 rounded-full text-xs font-medium text-white/70" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>Level 2</span>
        </div>
        <nav className="hidden md:flex items-center justify-center flex-1">
          {NAV_ITEMS.map((item) => (
            <button key={item.id} onClick={() => setActiveNav(item.id)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${activeNav === item.id ? "text-white" : ""}`} style={{ color: activeNav === item.id ? "#fff" : COLORS.navInactive, backgroundColor: activeNav === item.id ? COLORS.navActive : "transparent" }}>
              <span className="text-[11px]">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <button className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </button>
          <button onClick={() => setShowSettings(!showSettings)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Left - Character */}
        <div className="hidden md:flex w-[38%] lg:w-[35%] relative items-end justify-center">
          <div className="absolute inset-0 flex items-end justify-center pb-2">
            <div className="relative">
              <div className="relative" style={{ width: "240px", height: "520px" }}>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2" style={{ width: "140px", height: "340px" }}>
                  <svg viewBox="0 0 140 340" className="w-full h-full" style={{ filter: "drop-shadow(0 20px 30px rgba(0,0,0,0.5))" }}>
                    <defs>
                      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#f5e6ff"/><stop offset="50%" stopColor="#e8d5f5"/><stop offset="100%" stopColor="#d4c0e8"/></linearGradient>
                      <linearGradient id="hg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#c4b5fd"/><stop offset="100%" stopColor="#8b7cf8"/></linearGradient>
                      <linearGradient id="dg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e0e7ff"/><stop offset="100%" stopColor="#b8c4ff"/></linearGradient>
                    </defs>
                    <ellipse cx="70" cy="55" rx="42" ry="50" fill="url(#hg)"/>
                    <ellipse cx="70" cy="50" rx="28" ry="32" fill="url(#bg)"/>
                    <path d="M42 50 Q42 20 70 18 Q98 20 98 50 Q100 42 98 36 Q85 24 70 22 Q55 24 42 36 Z" fill="url(#hg)"/>
                    <path d="M42 50 Q38 70 42 100 Q44 95 44 85 Q44 65 46 55" fill="url(#hg)"/>
                    <path d="M98 50 Q102 70 98 100 Q96 95 96 85 Q96 65 94 55" fill="url(#hg)"/>
                    <rect x="60" y="78" width="20" height="16" rx="4" fill="#e8d5f5"/>
                    <path d="M48 90 Q44 88 38 92 L30 200 Q28 210 35 215 L50 220 Q60 222 70 222 Q80 222 90 220 L105 215 Q112 210 110 200 L102 92 Q98 88 92 90 Q80 94 70 94 Q60 94 48 90 Z" fill="url(#dg)"/>
                    <path d="M48 94 Q30 130 28 180 Q26 200 30 205 Q34 210 36 200 Q42 140 52 110" fill="url(#bg)"/>
                    <path d="M92 94 Q110 130 112 180 Q114 200 110 205 Q106 210 104 200 Q98 140 88 110" fill="url(#bg)"/>
                    <ellipse cx="62" cy="48" rx="5" ry="6" fill="#2d1b69"/>
                    <ellipse cx="78" cy="48" rx="5" ry="6" fill="#2d1b69"/>
                    <ellipse cx="63" cy="46" rx="2" ry="2.5" fill="white" opacity="0.7"/>
                    <ellipse cx="79" cy="46" rx="2" ry="2.5" fill="white" opacity="0.7"/>
                    <path d="M65 58 Q70 62 75 58" stroke="#d4a0b0" strokeWidth="1.5" fill="none"/>
                    <ellipse cx="55" cy="55" rx="6" ry="4" fill="#f0c0d0" opacity="0.5"/>
                    <ellipse cx="85" cy="55" rx="6" ry="4" fill="#f0c0d0" opacity="0.5"/>
                    <rect x="52" y="218" width="14" height="100" rx="6" fill="url(#bg)"/>
                    <rect x="74" y="218" width="14" height="100" rx="6" fill="url(#bg)"/>
                    <ellipse cx="59" cy="320" rx="12" ry="6" fill="#c4b5fd"/>
                    <ellipse cx="81" cy="320" rx="12" ry="6" fill="#c4b5fd"/>
                  </svg>
                </div>
              </div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-5 rounded-full" style={{ background: "radial-gradient(ellipse, rgba(0,0,0,0.4) 0%, transparent 70%)", filter: "blur(6px)" }}/>
            </div>
          </div>
        </div>

        {/* Right - Chat */}
        <div className="flex-1 flex flex-col min-h-0 px-4 md:px-0 md:pr-20 lg:pr-28 md:pl-2">
          {/* Mobile character */}
          <div className="md:hidden flex justify-center pt-4 pb-2">
            <div className="relative" style={{ width: "100px", height: "160px" }}>
              <svg viewBox="0 0 100 160" className="w-full h-full" style={{ filter: "drop-shadow(0 8px 15px rgba(0,0,0,0.4))" }}>
                <defs>
                  <linearGradient id="mbg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#f5e6ff"/><stop offset="100%" stopColor="#d4c0e8"/></linearGradient>
                  <linearGradient id="mhg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#c4b5fd"/><stop offset="100%" stopColor="#8b7cf8"/></linearGradient>
                </defs>
                <ellipse cx="50" cy="30" rx="18" ry="22" fill="url(#mbg)"/>
                <ellipse cx="50" cy="28" rx="20" ry="24" fill="url(#mhg)" opacity="0.6"/>
                <ellipse cx="50" cy="30" rx="18" ry="22" fill="url(#mbg)"/>
                <ellipse cx="44" cy="28" rx="3" ry="4" fill="#2d1b69"/>
                <ellipse cx="56" cy="28" rx="3" ry="4" fill="#2d1b69"/>
                <path d="M36 46 Q32 44 28 48 L22 80 Q20 88 28 90 L40 92 Q50 93 50 93 Q50 93 60 92 L72 90 Q80 88 78 80 L72 48 Q68 44 64 46 Q56 48 50 48 Q44 48 36 46 Z" fill="#e0e7ff"/>
                <rect x="38" y="92" width="8" height="40" rx="4" fill="url(#mbg)"/>
                <rect x="54" y="92" width="8" height="40" rx="4" fill="url(#mbg)"/>
              </svg>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto py-4 pr-1">
            <div className="flex justify-center mb-4">
              <div className="px-3 py-1.5 rounded-lg text-[10px] text-white/25 max-w-xs text-center leading-snug" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
                Replika is an AI companion and is not a substitute for professional help.
              </div>
            </div>
            <div className="space-y-2">
              {convertedMessages.map((msg) => (
                <div key={msg.id} className={`flex items-end gap-1.5 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.sender === "lover" && (
                    <div className="flex items-end gap-1.5">
                      <div className="max-w-[60%] px-3.5 py-2 text-sm leading-relaxed" style={{ backgroundColor: COLORS.bubbleAI, color: COLORS.bubbleAIText, borderRadius: "16px 16px 16px 4px" }}>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                      <button className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mb-0.5" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
                        <span className="text-[12px]">😊</span>
                      </button>
                    </div>
                  )}
                  {msg.sender === "user" && (
                    <div className="max-w-[60%] px-3.5 py-2 text-sm leading-relaxed" style={{ backgroundColor: COLORS.bubbleUser, color: COLORS.bubbleUserText, borderRadius: "16px 16px 4px 16px" }}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  )}
                </div>
              ))}
              {isTyping && (
                <div className="flex items-end gap-1.5 justify-start">
                  <div className="px-4 py-2.5" style={{ backgroundColor: COLORS.bubbleAI, borderRadius: "16px 16px 16px 4px" }}>
                    <div className="flex space-x-1 items-center h-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400/50 animate-bounce" style={{ animationDuration: "1.4s" }}/>
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400/50 animate-bounce" style={{ animationDelay: "200ms", animationDuration: "1.4s" }}/>
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400/50 animate-bounce" style={{ animationDelay: "400ms", animationDuration: "1.4s" }}/>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef}/>
          </div>

          {/* Quick Replies */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {QUICK_REPLIES.map((text, i) => (
              <button key={i} onClick={() => sendMessage(text)} className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs text-white/70 hover:text-white transition-colors" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                {text}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="py-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-full" style={{ backgroundColor: COLORS.inputBg }}>
              <button className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              </button>
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Start typing..." className="flex-1 bg-transparent text-sm text-white placeholder-white/35 outline-none py-1.5"/>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                  </svg>
                </button>
                <button className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                  <span className="text-sm">😊</span>
                </button>
                <button onClick={handleMicToggle} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: micActive ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.08)" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
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
          <div className="fixed inset-0 z-40" onClick={() => setShowSettings(false)}/>
          <div className="fixed top-0 right-0 bottom-0 z-50 w-80 shadow-2xl overflow-y-auto" style={{ backgroundColor: COLORS.panelBg }}>
            <div className="flex items-center justify-between px-5 py-4">
              <h2 className="text-base font-semibold text-white">Settings</h2>
              <button onClick={() => setShowSettings(false)} className="w-7 h-7 rounded-full flex items-center justify-center text-white/60 hover:text-white/90" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="px-4 pb-6 space-y-5">
              <div className="p-4 rounded-2xl text-white" style={{ background: "linear-gradient(135deg, #818cf8, #f472b6)" }}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💎</span>
                  <div>
                    <p className="text-sm font-semibold">Unlock Replika PRO</p>
                    <p className="text-xs opacity-85 mt-0.5 leading-relaxed">Advanced AI, voice calls, AR, and more.</p>
                  </div>
                </div>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-white/35 px-3 pb-1.5 font-medium">Display</p>
                {[{label:"3D Avatar",enabled:false},{label:"Background Music",enabled:false},{label:"Dark Theme",enabled:true},{label:"Show Level",enabled:true}].map((item,i) => (
                  <div key={i} className="flex items-center justify-between py-2.5 px-3.5 rounded-xl">
                    <span className="text-sm text-white/80">{item.label}</span>
                    <div className="w-11 h-6 rounded-full relative cursor-pointer" style={{ backgroundColor: item.enabled ? "#4ade80" : "rgba(255,255,255,0.2)" }}>
                      <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all" style={{ left: item.enabled ? "22px" : "2px" }}/>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-3 mt-2 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <button className="w-full py-2.5 px-3.5 rounded-xl text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors">Log Out</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden flex-shrink-0 px-4 py-2" style={{ backgroundColor: "rgba(34,34,34,0.9)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
        <div className="flex justify-around items-center">
          {NAV_ITEMS.slice(0, 5).map((item) => (
            <button key={item.id} onClick={() => setActiveNav(item.id)} className={`flex flex-col items-center gap-0.5 py-1 px-2 transition-colors ${activeNav === item.id ? "text-white" : "text-white/40"}`}>
              <span className="text-lg">{item.icon}</span>
              <span className="text-[10px]">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </main>
  );
}