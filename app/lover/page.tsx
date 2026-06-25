"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Script from "next/script";
import { ChatPanel } from "@/components/Lover/ChatPanel";
import {
  INITIAL_DIARY,
  INITIAL_SCHEDULE,
  MINI_GAMES,
} from "@/data/lover";
import { useCharacterAgent, useSpeech } from "@/lib/hooks";
import { DEFAULT_MOOD_CONFIG, MoodType } from "@/lib/core";
import { ChatMessage } from "@/data/lover";

const Live2DCharacter = dynamic(
  () => import("@/components/Lover/Live2DCharacter").then((mod) => mod.Live2DCharacter),
  { ssr: false, loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-pink-300/20 border-t-pink-400/60 rounded-full animate-spin" />
    </div>
  )}
);

const NAV_ITEMS = [
  { id: "chat", label: "Chat", icon: "💬" },
  { id: "activities", label: "Activities", icon: "🎮" },
  { id: "memory", label: "Memory", icon: "📝" },
  { id: "diary", label: "Diary", icon: "📔" },
  { id: "profile", label: "Profile", icon: "👤" },
  { id: "room", label: "Room", icon: "🏠" },
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
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const currentMood = (mood?.mood ?? "happy") as MoodType;
  const intimacy = relationship?.intimacy ?? 72;

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

  const handleSendMessage = (text: string) => {
    sendMessage(text);
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

  const convertedMessages: ChatMessage[] = messages.map((msg) => ({
    id: msg.id,
    sender: msg.sender === "assistant" ? "lover" : "user",
    content: msg.content,
    timestamp: new Date(msg.timestamp),
    mood: msg.emotion.mood as any,
  }));

  const moodConfig = DEFAULT_MOOD_CONFIG[currentMood];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0a0a12]">
      <Script src="/live2dcubismcore.min.js" strategy="afterInteractive" />

      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-[120px] opacity-30"
          style={{ background: `radial-gradient(circle, ${profile.accentColor}40, transparent 70%)` }}
        />
        <div 
          className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full blur-[100px] opacity-25"
          style={{ background: `radial-gradient(circle, ${profile.secondaryColor}40, transparent 70%)` }}
        />
        <div 
          className="absolute -bottom-40 left-1/3 w-[500px] h-[500px] rounded-full blur-[120px] opacity-20"
          style={{ background: `radial-gradient(circle, ${profile.accentColor}30, transparent 70%)` }}
        />
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }} />
      </div>

      {/* Top navigation */}
      <nav className="relative z-20 h-16 flex items-center px-6 lg:px-10 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div 
            className="w-9 h-9 rounded-2xl flex items-center justify-center text-lg border border-white/10"
            style={{
              background: `linear-gradient(135deg, ${profile.accentColor}25, ${profile.secondaryColor}20)`,
            }}
          >
            {moodConfig.emoji}
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white/90">{profile.name}</h1>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-white/40">Online</span>
            </div>
          </div>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center justify-center flex-1 gap-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all duration-300 ${
                activeNav === item.id
                  ? "bg-white/[0.08] text-white/90 border border-white/10"
                  : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
              }`}
            >
              <span className="mr-1.5">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {speechEnabled && (
            <>
              <button
                onClick={handleVoiceToggle}
                className={`w-9 h-9 rounded-xl border transition-all duration-200
                  flex items-center justify-center ${
                    voiceEnabled
                      ? "bg-pink-500/15 border-pink-400/30"
                      : "bg-white/[0.04] border-white/10 hover:bg-white/[0.08]"
                  }`}
                title={voiceEnabled ? "关闭语音" : "开启语音"}
              >
                <span className="text-base">{voiceEnabled ? "🔊" : "🔈"}</span>
              </button>
              <button
                onClick={handleMicToggle}
                className={`w-9 h-9 rounded-xl border transition-all duration-200
                  flex items-center justify-center ${
                    micActive
                      ? "bg-rose-500/15 border-rose-400/30 animate-pulse"
                      : "bg-white/[0.04] border-white/10 hover:bg-white/[0.08]"
                  }`}
                title={micActive ? "停止录音" : "开始说话"}
              >
                <span className="text-base">{micActive ? "🎤" : "🎙️"}</span>
              </button>
            </>
          )}
          <button 
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden w-9 h-9 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center"
          >
            <span className="text-base">☰</span>
          </button>
        </div>
      </nav>

      {/* Main content - Replika style: left character, right chat */}
      <div className="relative z-10 flex h-[calc(100vh-4rem)]">
        {/* Left side - Character display */}
        <div className="hidden lg:flex lg:w-[55%] xl:w-[60%] relative items-center justify-center">
          {/* Character glow layers */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div 
              className="w-[70%] h-[70%] rounded-full blur-[80px] opacity-40"
              style={{ background: `radial-gradient(ellipse at center, ${profile.accentColor}30, transparent 70%)` }}
            />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div 
              className="w-[50%] h-[60%] rounded-full blur-[60px] opacity-30"
              style={{ background: `radial-gradient(ellipse at 50% 60%, ${profile.secondaryColor}40, transparent 70%)` }}
            />
          </div>

          {/* Volumetric light rays */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div 
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[2px] h-1/2 opacity-20"
              style={{
                background: `linear-gradient(to bottom, ${profile.accentColor}, transparent)`,
                filter: 'blur(4px)',
              }}
            />
            <div 
              className="absolute top-0 left-[40%] w-[1px] h-[45%] opacity-10"
              style={{
                background: `linear-gradient(to bottom, ${profile.secondaryColor}, transparent)`,
                filter: 'blur(3px)',
              }}
            />
            <div 
              className="absolute top-0 left-[60%] w-[1px] h-[40%] opacity-10"
              style={{
                background: `linear-gradient(to bottom, ${profile.accentColor}, transparent)`,
                filter: 'blur(3px)',
              }}
            />
          </div>

          {/* Character container */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="relative">
              {/* Outer glow ring */}
              <div 
                className="absolute -inset-8 rounded-full opacity-30 blur-2xl"
                style={{ background: `radial-gradient(circle, ${profile.accentColor}40, transparent 70%)` }}
              />
              
              {/* Live2D Character */}
              <div className="relative">
                <Live2DCharacter
                  model="shizuku"
                  mood={currentMood}
                  isTyping={isTyping}
                  isSpeaking={isSpeaking}
                  size="full"
                  width={480}
                  height={620}
                />
              </div>

              {/* Bottom glow / reflection */}
              <div 
                className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[60%] h-8 rounded-full blur-xl opacity-40"
                style={{ background: `radial-gradient(ellipse at center, ${profile.accentColor}60, transparent 70%)` }}
              />
            </div>

            {/* Character name & status */}
            <div className="mt-6 text-center">
              <h2 className="text-2xl font-light tracking-wide bg-gradient-to-r from-white/90 via-pink-200/80 to-white/90 bg-clip-text text-transparent">
                {profile.name}
              </h2>
              <p className="text-xs text-white/40 mt-1 capitalize">{moodConfig.label} · {intimacy}% intimacy</p>
              <div className="mt-3 w-48 h-1 rounded-full bg-white/10 overflow-hidden mx-auto">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${intimacy}%`,
                    background: `linear-gradient(90deg, ${profile.accentColor}, ${profile.secondaryColor})`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden lg:block w-px bg-gradient-to-b from-transparent via-white/[0.08] to-transparent" />

        {/* Right side - Chat panel */}
        <div className="flex-1 flex flex-col p-4 lg:p-8 min-h-0">
          {/* Mobile character preview */}
          <div className="lg:hidden flex justify-center mb-4">
            <div className="relative">
              <div 
                className="absolute -inset-4 rounded-full blur-xl opacity-30"
                style={{ background: `radial-gradient(circle, ${profile.accentColor}40, transparent 70%)` }}
              />
              <Live2DCharacter
                model="shizuku"
                mood={currentMood}
                isTyping={isTyping}
                isSpeaking={isSpeaking}
                size="md"
                width={200}
                height={260}
              />
            </div>
          </div>

          {/* Chat container */}
          <div className="flex-1 min-h-0 flex flex-col rounded-3xl bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] overflow-hidden">
            {/* Chat header */}
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg border border-white/10"
                  style={{
                    background: `linear-gradient(135deg, ${profile.accentColor}20, ${profile.secondaryColor}15)`,
                  }}
                >
                  {moodConfig.emoji}
                </div>
                <div>
                  <p className="text-sm font-medium text-white/90">{profile.name}</p>
                  <p className="text-[10px] text-emerald-400/70">
                    {isTyping ? "typing..." : isSpeaking ? "speaking..." : "online"}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <button className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-white/50 transition-colors">
                  <span className="text-sm">📞</span>
                </button>
                <button className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-white/50 transition-colors">
                  <span className="text-sm">📹</span>
                </button>
                <button className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-white/50 transition-colors">
                  <span className="text-sm">⋯</span>
                </button>
              </div>
            </div>

            {/* Chat messages */}
            <div className="flex-1 overflow-hidden">
              <ChatPanel
                messages={convertedMessages}
                onSendMessage={handleSendMessage}
                isTyping={isTyping}
                currentMood={currentMood}
              />
            </div>
          </div>

          {/* Quick action buttons */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
            {[
              { emoji: "💕", label: "想你了" },
              { emoji: "😮‍💨", label: "今天好累" },
              { emoji: "🤔", label: "你在干嘛" },
              { emoji: "❤️", label: "我爱你" },
              { emoji: "🎵", label: "唱首歌" },
            ].map((action, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(action.label)}
                className="flex-shrink-0 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08]
                  hover:bg-white/[0.08] hover:border-pink-400/20
                  transition-all duration-200 text-xs text-white/70 hover:text-white/90
                  flex items-center gap-1.5"
              >
                <span>{action.emoji}</span>
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30
        bg-[#0a0a12]/90 backdrop-blur-xl border-t border-white/[0.06]
        px-6 py-2 safe-area-inset-bottom">
        <div className="flex justify-around items-center">
          {NAV_ITEMS.slice(0, 5).map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 transition-colors ${
                activeNav === item.id ? "text-pink-300" : "text-white/40"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-[9px]">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Mobile menu dropdown */}
      {showMobileMenu && (
        <div className="md:hidden fixed top-16 right-4 z-40 rounded-2xl bg-[#12121c]/95 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveNav(item.id);
                setShowMobileMenu(false);
              }}
              className={`w-full px-5 py-3 text-left text-sm transition-colors flex items-center gap-3 ${
                activeNav === item.id
                  ? "bg-white/[0.06] text-white/90"
                  : "text-white/60 hover:bg-white/[0.04]"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </main>
  );
}
