"use client";

import { useState, useEffect } from "react";
import { LoverParticles } from "@/components/Lover/LoverParticles";
import { LoverAvatar } from "@/components/Lover/LoverAvatar";
import { ChatPanel } from "@/components/Lover/ChatPanel";
import { Sidebar } from "@/components/Lover/Sidebar";
import { SettingsPanel } from "@/components/Lover/SettingsPanel";
import { GameModal } from "@/components/Lover/GameModal";
import {
  INITIAL_DIARY,
  INITIAL_SCHEDULE,
  MINI_GAMES,
} from "@/data/lover";
import { useCharacterAgent, useSpeech } from "@/lib/hooks";
import { DEFAULT_MOOD_CONFIG, MoodType } from "@/lib/core";
import { ChatMessage } from "@/data/lover";

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

  const [showSettings, setShowSettings] = useState(false);
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [showMobilePanel, setShowMobilePanel] = useState(false);
  const [mobileTab, setMobileTab] = useState<"diary" | "schedule" | "games">("games");
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [micActive, setMicActive] = useState(false);

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

  const handleGameSelect = (gameId: string) => {
    setActiveGame(gameId);
  };

  const handleMoodChange = (m: string) => {
    triggerMood(m as MoodType, 0.8);
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
    <main className="relative min-h-screen overflow-hidden">
      <LoverParticles />

      <div className="relative z-10 h-screen flex flex-col">
        <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl
                border border-white/10 flex items-center justify-center text-xl"
              style={{
                background: `linear-gradient(135deg, ${profile.accentColor}20, ${profile.secondaryColor}20)`,
              }}
            >
              {moodConfig.emoji}
            </div>
            <div>
              <h1 className="text-base font-semibold bg-gradient-to-r from-pink-300 to-violet-300 bg-clip-text text-transparent">
                {profile.name}
              </h1>
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${intimacy}%`,
                      background: `linear-gradient(90deg, ${profile.accentColor}, ${profile.secondaryColor})`,
                    }}
                  />
                </div>
                <span className="text-[10px] text-white/40">亲密度 {intimacy}%</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {speechEnabled && (
              <>
                <button
                  onClick={handleVoiceToggle}
                  className={`w-10 h-10 rounded-xl border transition-all duration-200
                    flex items-center justify-center ${
                      voiceEnabled
                        ? "bg-pink-500/20 border-pink-400/40"
                        : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-pink-400/30"
                    }`}
                  title={voiceEnabled ? "关闭语音" : "开启语音"}
                >
                  <span className="text-lg">{voiceEnabled ? "🔊" : "🔈"}</span>
                </button>
                <button
                  onClick={handleMicToggle}
                  className={`w-10 h-10 rounded-xl border transition-all duration-200
                    flex items-center justify-center ${
                      micActive
                        ? "bg-rose-500/20 border-rose-400/40 animate-pulse"
                        : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-pink-400/30"
                    }`}
                  title={micActive ? "停止录音" : "开始说话"}
                >
                  <span className="text-lg">{micActive ? "🎤" : "🎙️"}</span>
                </button>
              </>
            )}
            <button
              onClick={() => setShowSettings(true)}
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10
                hover:bg-white/10 hover:border-pink-400/30
                transition-all duration-200 flex items-center justify-center"
            >
              <span className="text-lg">⚙️</span>
            </button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col lg:flex-row gap-3 sm:gap-4 p-3 sm:p-4 lg:p-6 overflow-auto">
            <div className="lg:w-80 flex-shrink-0 space-y-3 sm:space-y-4">
              <div
                className="p-4 sm:p-6 rounded-2xl backdrop-blur-xl border border-white/10
                  flex flex-col items-center"
                style={{
                  background: `linear-gradient(180deg, ${profile.accentColor}08, transparent)`,
                }}
              >
                <LoverAvatar
                  profile={{
                    name: profile.name,
                    nickname: profile.nickname,
                    userNickname: profile.userNickname,
                    personality: profile.persona,
                    birthday: profile.birthday,
                    anniversary: profile.anniversary,
                    avatar: profile.avatar,
                    accentColor: profile.accentColor,
                    secondaryColor: profile.secondaryColor,
                  }}
                  mood={currentMood}
                  isTyping={isTyping}
                  size="xl"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => triggerMood("love", 0.8)}
                  className="p-3 rounded-xl bg-white/[0.03] border border-white/10
                    hover:bg-pink-500/10 hover:border-pink-400/20
                    transition-all duration-200 flex flex-col items-center gap-1"
                >
                  <span className="text-xl">🎁</span>
                  <span className="text-[10px] text-white/50">送礼物</span>
                </button>
                <button
                  onClick={() => triggerMood("shy", 0.6)}
                  className="p-3 rounded-xl bg-white/[0.03] border border-white/10
                    hover:bg-violet-500/10 hover:border-violet-400/20
                    transition-all duration-200 flex flex-col items-center gap-1"
                >
                  <span className="text-xl">📸</span>
                  <span className="text-[10px] text-white/50">合影</span>
                </button>
                <button
                  onClick={() => triggerMood("sleepy", 0.5)}
                  className="p-3 rounded-xl bg-white/[0.03] border border-white/10
                    hover:bg-amber-500/10 hover:border-amber-400/20
                    transition-all duration-200 flex flex-col items-center gap-1"
                >
                  <span className="text-xl">🎵</span>
                  <span className="text-[10px] text-white/50">听歌</span>
                </button>
              </div>

              {relationship && (
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-white/60">关系状态</span>
                    <span className="text-[10px] text-emerald-400">✨ 热恋中</span>
                  </div>
                  <div className="space-y-2">
                    <StatBar
                      label="亲密度"
                      value={relationship.intimacy}
                      color="from-pink-400 to-rose-400"
                    />
                    <StatBar
                      label="信任度"
                      value={relationship.trust}
                      color="from-violet-400 to-purple-400"
                    />
                    <StatBar
                      label="依赖值"
                      value={relationship.dependence}
                      color="from-amber-400 to-orange-400"
                    />
                    <StatBar
                      label="吸引力"
                      value={relationship.attraction}
                      color="from-rose-400 to-pink-500"
                    />
                    <StatBar
                      label="熟悉度"
                      value={relationship.familiarity}
                      color="from-cyan-400 to-blue-400"
                    />
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <div className="flex justify-between text-xs text-white/50">
                      <span>连续陪伴</span>
                      <span className="text-pink-300">{relationship.streakDays} 天</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 min-h-0 xl:pb-0 pb-20">
              <div className="h-full min-h-[400px] sm:min-h-[500px] rounded-2xl bg-white/[0.02] backdrop-blur-xl
                border border-white/10 overflow-hidden flex flex-col">
                <ChatPanel
                  messages={convertedMessages}
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
          profile={{
            name: profile.name,
            nickname: profile.nickname,
            userNickname: profile.userNickname,
            personality: profile.persona,
            birthday: profile.birthday,
            anniversary: profile.anniversary,
            avatar: profile.avatar,
            accentColor: profile.accentColor,
            secondaryColor: profile.secondaryColor,
          }}
          onUpdateProfile={(updates) => {}}
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

function StatBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-white/50">{label}</span>
      <div className="flex items-center gap-2">
        <div className="w-20 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${color} rounded-full`}
            style={{ width: `${value}%` }}
          />
        </div>
        <span className="text-white/40 text-[10px] w-8 text-right">{Math.round(value)}%</span>
      </div>
    </div>
  );
}
