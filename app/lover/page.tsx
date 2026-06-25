"use client";

import { useState } from "react";
import { LoverParticles } from "@/components/Lover/LoverParticles";
import { LoverAvatar } from "@/components/Lover/LoverAvatar";
import { ChatPanel } from "@/components/Lover/ChatPanel";
import { Sidebar } from "@/components/Lover/Sidebar";
import { SettingsPanel } from "@/components/Lover/SettingsPanel";
import { GameModal } from "@/components/Lover/GameModal";
import {
  DEFAULT_PROFILE,
  INITIAL_MESSAGES,
  INITIAL_DIARY,
  INITIAL_SCHEDULE,
  MINI_GAMES,
  LOVER_RESPONSES,
  MoodType,
  ChatMessage,
  LoverProfile,
} from "@/data/lover";

export default function LoverPage() {
  const [profile, setProfile] = useState<LoverProfile>(DEFAULT_PROFILE);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [currentMood, setCurrentMood] = useState<MoodType>("happy");
  const [isTyping, setIsTyping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [intimacy, setIntimacy] = useState(72);
  const [showMobilePanel, setShowMobilePanel] = useState(false);
  const [mobileTab, setMobileTab] = useState<"diary" | "schedule" | "games">("games");

  const generateResponse = (userMessage: string): { text: string; mood: MoodType } => {
    const msg = userMessage.toLowerCase();

    if (msg.includes("想你") || msg.includes("想念") || msg.includes("miss")) {
      const responses = LOVER_RESPONSES.miss;
      return responses[Math.floor(Math.random() * responses.length)];
    }
    if (msg.includes("爱你") || msg.includes("喜欢你") || msg.includes("love")) {
      const responses = LOVER_RESPONSES.love;
      return responses[Math.floor(Math.random() * responses.length)];
    }
    if (msg.includes("累") || msg.includes("难过") || msg.includes("不开心") || msg.includes("伤心")) {
      const responses = LOVER_RESPONSES.sad;
      return responses[Math.floor(Math.random() * responses.length)];
    }
    if (msg.includes("你好") || msg.includes("在吗") || msg.includes("嗨") || msg.includes("hi") || msg.includes("hello")) {
      const responses = LOVER_RESPONSES.greeting;
      return responses[Math.floor(Math.random() * responses.length)];
    }
    if (msg.includes("笨蛋") || msg.includes("讨厌") || msg.includes("坏人") || msg.includes("哼")) {
      const responses = LOVER_RESPONSES.angry_tease;
      return responses[Math.floor(Math.random() * responses.length)];
    }

    const responses = LOVER_RESPONSES.default;
    const response = responses[Math.floor(Math.random() * responses.length)];

    const moodChance = Math.random();
    let finalMood: MoodType = response.mood;
    if (moodChance < 0.15) {
      const moods: MoodType[] = ["shy", "playful", "love", "thoughtful"];
      finalMood = moods[Math.floor(Math.random() * moods.length)];
    }

    return { text: response.text, mood: finalMood };
  };

  const handleSendMessage = (text: string) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      content: text,
      timestamp: new Date(),
      mood: "happy",
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);
    setCurrentMood("thoughtful");

    const delay = 1000 + Math.random() * 1500;
    setTimeout(() => {
      const response = generateResponse(text);
      const loverMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "lover",
        content: response.text,
        timestamp: new Date(),
        mood: response.mood,
      };
      setMessages((prev) => [...prev, loverMsg]);
      setCurrentMood(response.mood);
      setIsTyping(false);
      setIntimacy((prev) => Math.min(100, prev + 1));
    }, delay);
  };

  const handleUpdateProfile = (updates: Partial<LoverProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  };

  const handleGameSelect = (gameId: string) => {
    setActiveGame(gameId);
  };

  const handleMoodChange = (mood: string) => {
    setCurrentMood(mood as MoodType);
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      <LoverParticles />

      <div className="relative z-10 h-screen flex flex-col">
        <header className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/20 to-violet-500/20
              border border-white/10 flex items-center justify-center text-xl">
              💝
            </div>
            <div>
              <h1 className="text-base font-semibold bg-gradient-to-r from-pink-300 to-violet-300 bg-clip-text text-transparent">
                {profile.name}
              </h1>
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-pink-400 to-violet-400 rounded-full transition-all duration-500"
                    style={{ width: `${intimacy}%` }}
                  />
                </div>
                <span className="text-[10px] text-white/40">亲密度 {intimacy}%</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(true)}
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10
                hover:bg-white/10 hover:border-pink-400/30
                transition-all duration-200 flex items-center justify-center"
            >
              <span className="text-lg">⚙️</span>
            </button>
            <button className="w-10 h-10 rounded-xl bg-white/5 border border-white/10
              hover:bg-white/10 hover:border-pink-400/30
              transition-all duration-200 flex items-center justify-center">
              <span className="text-lg">📞</span>
            </button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 lg:p-6 overflow-auto">
            <div className="lg:w-80 flex-shrink-0">
              <div className="lg:sticky lg:top-4 space-y-4">
                <div className="p-6 rounded-2xl bg-white/[0.03] backdrop-blur-xl
                  border border-white/10 flex flex-col items-center">
                  <LoverAvatar profile={profile} mood={currentMood} isTyping={isTyping} size="xl" />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button className="p-3 rounded-xl bg-white/[0.03] border border-white/10
                    hover:bg-pink-500/10 hover:border-pink-400/20
                    transition-all duration-200 flex flex-col items-center gap-1">
                    <span className="text-xl">🎁</span>
                    <span className="text-[10px] text-white/50">送礼物</span>
                  </button>
                  <button className="p-3 rounded-xl bg-white/[0.03] border border-white/10
                    hover:bg-violet-500/10 hover:border-violet-400/20
                    transition-all duration-200 flex flex-col items-center gap-1">
                    <span className="text-xl">📸</span>
                    <span className="text-[10px] text-white/50">合影</span>
                  </button>
                  <button className="p-3 rounded-xl bg-white/[0.03] border border-white/10
                    hover:bg-amber-500/10 hover:border-amber-400/20
                    transition-all duration-200 flex flex-col items-center gap-1">
                    <span className="text-xl">🎵</span>
                    <span className="text-[10px] text-white/50">听歌</span>
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-white/60">今日状态</span>
                    <span className="text-[10px] text-emerald-400">✨ 心情不错</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/50">能量值</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div className="h-full w-4/5 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full" />
                        </div>
                        <span className="text-white/40 text-[10px] w-8">80%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/50">好感度</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div className="h-full w-[72%] bg-gradient-to-r from-pink-400 to-rose-400 rounded-full" />
                        </div>
                        <span className="text-white/40 text-[10px] w-8">72%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/50">依赖值</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div className="h-full w-3/5 bg-gradient-to-r from-violet-400 to-purple-400 rounded-full" />
                        </div>
                        <span className="text-white/40 text-[10px] w-8">60%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-0 xl:pb-0 pb-20">
              <div className="h-full min-h-[500px] rounded-2xl bg-white/[0.02] backdrop-blur-xl
                border border-white/10 overflow-hidden flex flex-col">
                <ChatPanel
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  isTyping={isTyping}
                  currentMood={currentMood}
                />
              </div>
            </div>

            <div className="hidden xl:block xl:w-80 flex-shrink-0">
              <div className="sticky top-4 h-[calc(100vh-120px)] rounded-2xl overflow-hidden">
                <Sidebar
                  diary={INITIAL_DIARY}
                  schedule={INITIAL_SCHEDULE}
                  games={MINI_GAMES}
                  onGameSelect={handleGameSelect}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {showSettings && (
        <SettingsPanel
          profile={profile}
          onUpdateProfile={handleUpdateProfile}
          onClose={() => setShowSettings(false)}
        />
      )}

      {activeGame && (
        <GameModal
          gameId={activeGame}
          onClose={() => setActiveGame(null)}
          onMoodChange={handleMoodChange}
        />
      )}

      {showMobilePanel && (
        <div className="fixed inset-0 z-40 xl:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowMobilePanel(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[75vh]
            bg-gradient-to-b from-white/[0.08] to-white/[0.02]
            backdrop-blur-2xl border-t border-white/10 rounded-t-3xl
            animate-slide-up overflow-hidden flex flex-col">
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>
            <div className="flex-1 overflow-hidden">
              <Sidebar
                diary={INITIAL_DIARY}
                schedule={INITIAL_SCHEDULE}
                games={MINI_GAMES}
                initialTab={mobileTab}
                onGameSelect={(id) => {
                  setShowMobilePanel(false);
                  handleGameSelect(id);
                }}
              />
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-30 xl:hidden
        bg-white/[0.06] backdrop-blur-xl border-t border-white/10
        px-6 py-2 safe-area-inset-bottom">
        <div className="flex justify-around items-center">
          <button className="flex flex-col items-center gap-0.5 py-1 px-3 text-pink-300">
            <span className="text-xl">💬</span>
            <span className="text-[10px]">聊天</span>
          </button>
          <button
            onClick={() => {
              setMobileTab("games");
              setShowMobilePanel(true);
            }}
            className="flex flex-col items-center gap-0.5 py-1 px-3 text-white/50"
          >
            <span className="text-xl">🎮</span>
            <span className="text-[10px]">互动</span>
          </button>
          <button
            onClick={() => {
              setMobileTab("diary");
              setShowMobilePanel(true);
            }}
            className="flex flex-col items-center gap-0.5 py-1 px-3 text-white/50"
          >
            <span className="text-xl">📔</span>
            <span className="text-[10px]">日记</span>
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="flex flex-col items-center gap-0.5 py-1 px-3 text-white/50"
          >
            <span className="text-xl">👤</span>
            <span className="text-[10px]">TA</span>
          </button>
        </div>
      </nav>
    </main>
  );
}
