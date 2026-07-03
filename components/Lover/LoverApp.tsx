"use client";

import { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from "react";
import dynamic from "next/dynamic";
import { useCharacterAgent, useSpeech } from "@/lib/hooks";
import { MoodType, Gender, PERSONA_MODE_LABELS, PersonaMode } from "@/lib/core/digital-life";
import { getExpressionForMood, getRandomMotionForMood, getModelConfig } from "@/lib/core/live2d-manager";
import type { Live2DPlayerRef, Live2DPlayerProps } from "@/components/Lover/Live2DPlayer";
import { SceneBackground, LightingOverlay, ParticleCanvas } from "@/components/Lover/SceneEffects";
import { ScenePanel, CostumePanel, SceneControlBar } from "@/components/Lover/ScenePanel";
import { SCENE_CONFIGS, LIGHTING_CONFIGS, getTimeOfDayFromDate, getSceneConfig, SceneId, TimeOfDay, COSTUME_CONFIGS } from "@/lib/core/scene-system";
import { getCommerceEngine, CommerceState, SHOP_ITEMS } from "@/lib/core/commerce-system";
import DiaryPage from "@/components/Lover/DiaryPage";

const Live2DPlayerDynamic = dynamic(() => import("@/components/Lover/Live2DPlayer"), {
  ssr: false,
  loading: () => null,
});

const Live2DPlayer = forwardRef<Live2DPlayerRef, Live2DPlayerProps>((props, ref) => {
  return <Live2DPlayerDynamic {...props} forwardedRef={ref} />;
});
Live2DPlayer.displayName = "Live2DPlayer";

const NAV_ITEMS = [
  { id: "chat", label: "聊天", icon: "💬" },
  { id: "diary", label: "日记", icon: "📔" },
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

export interface LoverAppRef {
  reload: () => void;
}

interface LoverAppProps {
  initialCharacter?: {
    name: string;
    gender: Gender;
    model: string;
  };
}

export const LoverApp = forwardRef<LoverAppRef, LoverAppProps>(({ initialCharacter }, ref) => {
  const [isMounted, setIsMounted] = useState(false);
  const live2dRef = useRef<Live2DPlayerRef>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const callLoopRef = useRef<boolean>(false);

  const { messages, mood, isTyping, sendMessage, profile, lifeState, agent, generateDiary, handleInteraction } = useCharacterAgent();
  const { isListening, startListening, stopListening, speak, isSpeaking } = useSpeech();

  const [activeNav, setActiveNav] = useState("chat");
  const [showSkills, setShowSkills] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [input, setInput] = useState("");
  const [micActive, setMicActive] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [skills, setSkills] = useState<any[]>([]);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [showGiftPanel, setShowGiftPanel] = useState(false);
  const [giftTab, setGiftTab] = useState<"shop" | "inventory" | "wishlist" | "requests">("shop");

  const [commerceState, setCommerceState] = useState<CommerceState | null>(null);
  const commerceEngine = typeof window !== "undefined" ? getCommerceEngine() : null;

  const [currentScene, setCurrentScene] = useState<SceneId>("bedroom");
  const [currentTimeOfDay, setCurrentTimeOfDay] = useState<TimeOfDay>("noon");
  const [autoTimeMode, setAutoTimeMode] = useState(true);
  const [showScenePanel, setShowScenePanel] = useState(false);
  const [currentCostume, setCurrentCostume] = useState("default");

  const [isInCall, setIsInCall] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callPhase, setCallPhase] = useState<"idle" | "calling" | "connected" | "ended">("idle");



  const EMOJI_LIST = ["😊", "😂", "🥰", "😢", "😡", "🤔", "😴", "😏", "👍", "❤️", "🌹", "✨", "😭", "🥺", "😜", "🤩"];

  const currentMood = (mood?.mood ?? "happy") as MoodType;

  const currentCharacter = {
    id: profile?.live2dModel || "HaruGreeter",
    name: profile?.name || "小春",
    path: getModelConfig(profile?.live2dModel || "HaruGreeter")?.path || "/live2d-models",
    model: profile?.live2dModel || "HaruGreeter",
    avatar: profile?.gender === "male" ? "👨" : "👩",
    scale: getModelConfig(profile?.live2dModel || "HaruGreeter")?.scale || 2,
    positionY: getModelConfig(profile?.live2dModel || "HaruGreeter")?.positionY || 0.55,
    type: "cubism3" as const,
    gender: profile?.gender || "female",
  };

  const sceneConfig = getSceneConfig(currentScene);
  const lightingConfig = LIGHTING_CONFIGS[currentTimeOfDay];

  useImperativeHandle(ref, () => ({
    reload: () => window.location.reload(),
  }));

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    if (!commerceEngine) return;
    setCommerceState(commerceEngine.getState());
    return commerceEngine.subscribe(setCommerceState);
  }, [isMounted, commerceEngine]);

  useEffect(() => {
    if (!isMounted) return;
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    if (agent) {
      setSkills(agent.getSkills());
    }
  }, [isMounted, agent]);

  useEffect(() => {
    if (!isMounted) return;
    setCurrentTimeOfDay(getTimeOfDayFromDate());
    if (!autoTimeMode) return;
    const updateTime = () => setCurrentTimeOfDay(getTimeOfDayFromDate());
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [isMounted, autoTimeMode]);

  useEffect(() => {
    if (!isMounted) return;
    if (!voiceEnabled) return;
    if (messages.length === 0) return;
    if (isTyping) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.sender !== "assistant") return;
    const text = lastMsg.content;
    if (text.trim().length > 0 && text.trim().length < 200) {
      speak(text, {
        emotion: (lastMsg as any).emotion?.mood as any,
        isSinging: (lastMsg as any).isSinging || text.includes("🎵"),
      });
    }
  }, [messages, isTyping, voiceEnabled, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    if (!modelReady) return;
    if (messages.length === 0) return;
    if (isTyping) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.sender !== "assistant") return;
    const mood = (lastMsg as any).emotion?.mood as MoodType;
    if (mood) {
      const expName = getExpressionForMood(mood, currentCharacter.model);
      live2dRef.current?.setExpression(expName);
      if (Math.random() > 0.4) {
        setTimeout(() => {
          const motionName = getRandomMotionForMood(mood, currentCharacter.model);
          live2dRef.current?.playMotion(motionName);
        }, 300);
      }
      if (lastMsg.content) {
        live2dRef.current?.startLipSync(lastMsg.content);
        const charCount = lastMsg.content.length;
        const duration = Math.max(1500, charCount * 150);
        setTimeout(() => {
          live2dRef.current?.stopLipSync();
        }, duration);
      }
    }
  }, [messages, isTyping, modelReady, currentCharacter.model, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, isMounted]);

  const handleSend = useCallback(() => {
    if (!input.trim() && !pendingImage) return;
    sendMessage(input.trim() || "（发了一张图片）", pendingImage || undefined);
    setInput("");
    setPendingImage(null);
    setShowEmojiPicker(false);
  }, [input, pendingImage, sendMessage]);

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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPendingImage(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEmojiClick = (emoji: string) => {
    setInput((prev) => prev + emoji);
  };

  const handleSkillClick = (skillId: string, trigger: string) => {
    sendMessage(trigger);
    setShowSkills(false);
  };

  const startCall = useCallback(() => {
    setCallPhase("calling");
    setIsInCall(true);
    setCallDuration(0);

    const callGreetings = [
      "喂～亲爱的，你终于打来啦～ 🥰",
      "嗨～想我了吗？",
      "喂？是你呀～ 好开心！",
      "亲爱的～ 我等你好久了呢～",
    ];
    const greeting = callGreetings[Math.floor(Math.random() * callGreetings.length)];

    setTimeout(() => {
      setCallPhase("connected");
      callLoopRef.current = true;
      callTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
      if (voiceEnabled) {
        speak(greeting, { emotion: "happy" });
      }
      sendMessage(greeting);
      live2dRef.current?.setExpression(getExpressionForMood("happy", currentCharacter.model));
      live2dRef.current?.playMotion(getRandomMotionForMood("happy", currentCharacter.model));
    }, 1500);
  }, [voiceEnabled, speak, sendMessage, currentCharacter.model]);

  const endCall = useCallback(() => {
    callLoopRef.current = false;
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    stopListening();
    setCallPhase("ended");
    setIsInCall(false);
    const farewells = [
      "拜拜～ 记得再打给我哦～ 💕",
      "晚安亲爱的，下次再聊～",
      "哼，这么快就要挂了呀... 好吧，拜拜～",
      "爱你哦～ 拜拜！ 🥰",
    ];
    const farewell = farewells[Math.floor(Math.random() * farewells.length)];
    if (voiceEnabled) {
      speak(farewell, { emotion: "affectionate" });
    }
    sendMessage(farewell);
    setTimeout(() => {
      setCallPhase("idle");
      setCallDuration(0);
    }, 2000);
  }, [voiceEnabled, speak, sendMessage]);

  const formatCallDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleModelLoaded = useCallback(() => {
    setModelReady(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="h-screen w-screen flex items-center justify-center overflow-hidden" style={{ background: "#0a0a0f" }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl animate-pulse"
            style={{
              background: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
              boxShadow: "0 0 40px rgba(139, 92, 246, 0.4)",
            }}
          />
          <div className="text-ink-400 text-sm">加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col relative" style={{ background: "#0a0a0f" }}>
      {/* 顶部导航栏 */}
      <header className="flex-shrink-0 h-14 flex items-center justify-between px-4 relative z-20 glass border-b border-white/5">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold cursor-pointer transition-transform hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
              boxShadow: "0 2px 8px rgba(139, 92, 246, 0.3)",
            }}
          >
            {currentCharacter.name?.charAt(0) || "星"}
          </div>
          <div className="hidden md:block">
            <div className="text-white text-sm font-semibold">{currentCharacter.name}</div>
            <div className="text-ink-500 text-xs">Lv.{lifeState?.growth?.level || 1}</div>
          </div>
        </div>

        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeNav === item.id
                  ? "text-white bg-white/10"
                  : "text-ink-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className="mr-1">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={startCall}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-ink-400 hover:text-white hover:bg-white/5 transition-all"
            title="语音通话"
          >
            📞
          </button>
          {/* 设置按钮已移除 —— LLM 配置完全由后端环境变量控制 */}
        </div>
      </header>

      {/* 主内容区 */}
      <main className="flex-1 min-h-0 flex relative overflow-hidden">
        {activeNav === "chat" && (
          <>
            {/* 左侧：模型展示区 */}
            <div className="hidden md:flex flex-col w-2/5 lg:w-1/2 relative flex-shrink-0">
              <div className="flex-1 relative min-h-0">
                <SceneBackground scene={sceneConfig} />
                <LightingOverlay lighting={lightingConfig} />
                <ParticleCanvas particleType={sceneConfig.particleType || "none"} />

                <Live2DPlayer
                  ref={live2dRef}
                  modelPath={currentCharacter.path}
                  modelName={currentCharacter.model}
                  scale={currentCharacter.scale}
                  positionY={currentCharacter.positionY}
                  currentMood={currentMood}
                  onModelLoaded={handleModelLoaded}
                  onError={(err) => console.warn("[Live2D] Error:", err)}
                />

                <SceneControlBar
                  scene={currentScene}
                  timeOfDay={currentTimeOfDay}
                  onOpenPanel={() => setShowScenePanel(true)}
                />
              </div>
            </div>

            {/* 右侧：聊天区 */}
            <div className="flex-1 flex flex-col min-h-0 relative border-l border-white/5">
              {/* 角色信息条 */}
              <div className="flex-shrink-0 px-4 py-3 border-b border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">👩</span>
                    <span className="text-white text-sm font-medium">{currentCharacter.name}</span>
                    <span className="text-xs text-ink-500 bg-white/5 px-2 py-0.5 rounded-full">
                      Lv.{lifeState?.growth?.level || 1}
                    </span>
                  </div>
                  <span
                    className="text-xs px-2 py-1 rounded-full font-medium"
                    style={{
                      backgroundColor: `${getModeColor(lifeState?.currentMode)}20`,
                      color: getModeColor(lifeState?.currentMode),
                    }}
                  >
                    {PERSONA_MODE_LABELS[lifeState?.currentMode as PersonaMode] || "正常模式"}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-ink-400 w-12">好感度</span>
                    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${lifeState?.persona?.affection || 0}%`,
                          background: "linear-gradient(90deg, #ec4899, #f472b6)",
                        }}
                      />
                    </div>
                    <span className="text-xs text-ink-500 w-12 text-right">
                      {lifeState?.persona?.affection || 0}/100
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-ink-400 w-12">怨念值</span>
                    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${lifeState?.persona?.resentment || 0}%`,
                          background: "linear-gradient(90deg, #f97316, #fbbf24)",
                        }}
                      />
                    </div>
                    <span className="text-xs text-ink-500 w-12 text-right">
                      {lifeState?.persona?.resentment || 0}/100
                    </span>
                  </div>
                </div>
              </div>

              {/* 消息列表 */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scroll-smooth">
                <p className="text-center text-xs text-ink-600 mb-4">
                  {currentCharacter.name}是AI伴侣，不能替代专业心理咨询
                </p>

                {messages.map((msg: any) => {
                  const isUser = msg.sender === "user";
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs ${
                          isUser ? "bg-brand-600 text-white" : "bg-gradient-to-br from-brand-500 to-accent-500 text-white"
                        }`}
                      >
                        {isUser ? "我" : currentCharacter.name?.charAt(0)}
                      </div>
                      <div
                        className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          isUser
                            ? "text-white rounded-tr-sm"
                            : "bg-ink-800 text-white rounded-tl-sm"
                        }`}
                        style={
                          isUser
                            ? { background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)" }
                            : {}
                        }
                      >
                        {msg.imageUrl && (
                          <img
                            src={msg.imageUrl}
                            alt=""
                            className="max-w-full rounded-lg mb-2"
                          />
                        )}
                        {msg.content}
                      </div>
                    </div>
                  );
                })}

                {isTyping && (
                  <div className="flex gap-2">
                    <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs bg-gradient-to-br from-brand-500 to-accent-500 text-white">
                      {currentCharacter.name?.charAt(0)}
                    </div>
                    <div className="bg-ink-800 px-4 py-3 rounded-2xl rounded-tl-sm">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-ink-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 bg-ink-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 bg-ink-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* 底部输入区 */}
              <div className="flex-shrink-0 px-3 py-3 border-t border-white/5 glass">
                {pendingImage && (
                  <div className="relative mb-2 inline-block">
                    <img src={pendingImage} alt="" className="w-20 h-20 object-cover rounded-lg" />
                    <button
                      onClick={() => setPendingImage(null)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                )}

                <div className="flex items-end gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setShowSkills(!showSkills)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:text-white hover:bg-white/5 transition-all"
                      title="技能"
                    >
                      ⭐
                    </button>
                    <button
                      onClick={() => setShowGiftPanel(true)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:text-white hover:bg-white/5 transition-all"
                      title="礼物"
                    >
                      🎁
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:text-white hover:bg-white/5 transition-all"
                      title="图片"
                    >
                      🖼️
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageSelect}
                    />
                  </div>

                  <div className="flex-1 relative">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="输入消息..."
                      rows={1}
                      className="w-full px-3 py-2 rounded-xl bg-ink-800/80 text-white text-sm placeholder:text-ink-500 outline-none resize-none border border-white/5 focus:border-brand-500/30 transition-all"
                      style={{ minHeight: "40px", maxHeight: "120px" }}
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:text-white hover:bg-white/5 transition-all"
                      title="表情"
                    >
                      😊
                    </button>
                    <button
                      onClick={handleMicToggle}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                        isListening
                          ? "text-green-400 bg-green-500/20"
                          : "text-ink-400 hover:text-white hover:bg-white/5"
                      }`}
                      title="语音输入"
                    >
                      🎤
                    </button>
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() && !pendingImage}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)" }}
                      title="发送"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                    </button>
                  </div>
                </div>

                {showEmojiPicker && (
                  <div className="mt-2 p-2 rounded-xl bg-ink-800 border border-white/5 flex flex-wrap gap-1">
                    {EMOJI_LIST.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleEmojiClick(emoji)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-lg hover:bg-white/10 transition-all"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {activeNav === "diary" && (
          <DiaryPage
            characterName={currentCharacter.name}
            onGenerateDiary={generateDiary}
          />
        )}
      </main>

      {/* 移动端底部导航 */}
      <nav className="md:hidden flex-shrink-0 h-14 flex items-center justify-around border-t border-white/5 glass">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveNav(item.id)}
            className={`flex flex-col items-center gap-0.5 px-6 py-1.5 rounded-lg transition-all ${
              activeNav === item.id
                ? "text-brand-400"
                : "text-ink-500"
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="text-xs">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* 语音通话界面 */}
      {isInCall && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center" style={{ background: "rgba(10, 10, 15, 0.95)", backdropFilter: "blur(20px)" }}>
          <div
            className="w-28 h-28 rounded-3xl flex items-center justify-center text-5xl mb-6 relative"
            style={{
              background: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
              boxShadow: "0 0 60px rgba(139, 92, 246, 0.5)",
            }}
          >
            {currentCharacter.avatar}
            {callPhase === "connected" && (
              <>
                <span className="absolute inset-0 rounded-3xl animate-ping opacity-30" style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)" }} />
                <span className="absolute -inset-2 rounded-[3rem] animate-ping opacity-20" style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)", animationDelay: "500ms" }} />
              </>
            )}
          </div>
          <h2 className="text-white text-xl font-bold mb-2">{currentCharacter.name}</h2>
          <p className="text-ink-400 text-sm mb-8">
            {callPhase === "calling" && "正在呼叫..."}
            {callPhase === "connected" && formatCallDuration(callDuration)}
            {callPhase === "ended" && "通话已结束"}
          </p>
          <div className="flex items-center gap-6">
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl transition-all ${
                voiceEnabled
                  ? "text-green-400 bg-green-500/20 border border-green-500/30"
                  : "text-ink-400 bg-white/5"
              }`}
            >
              🔊
            </button>
            <button
              onClick={endCall}
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl text-white transition-all hover:scale-105 active:scale-95"
              style={{
                background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                boxShadow: "0 4px 20px rgba(239, 68, 68, 0.4)",
              }}
            >
              📞
            </button>
            <button
              onClick={handleMicToggle}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl transition-all ${
                isListening
                  ? "text-brand-400 bg-brand-500/20 border border-brand-500/30"
                  : "text-ink-400 bg-white/5"
              }`}
            >
              🎤
            </button>
          </div>
        </div>
      )}

      {/* 设置面板已移除 —— LLM 配置完全由后端环境变量控制 */}

      {/* 技能面板 */}
      {showSkills && (
        <div className="fixed inset-0 z-30" onClick={() => setShowSkills(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div
            className="absolute bottom-16 left-3 w-56 glass-strong rounded-xl p-3 space-y-1 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-xs text-ink-400 mb-2 px-2">技能列表</p>
            {skills.map((skill: any) => (
              <button
                key={skill.id}
                onClick={() => handleSkillClick(skill.id, skill.triggerPhrase)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-all text-left"
              >
                <span className="text-lg">{skill.icon}</span>
                <div>
                  <div className="text-white text-sm font-medium">{skill.name}</div>
                  <div className="text-ink-500 text-xs">{skill.description}</div>
                </div>
              </button>
            ))}
            {skills.length === 0 && (
              <p className="text-center text-ink-500 text-xs py-4">暂无技能</p>
            )}
          </div>
        </div>
      )}

      {/* 礼物面板 */}
      {showGiftPanel && (
        <div className="fixed inset-0 z-40 flex items-end md:items-center justify-center" onClick={() => setShowGiftPanel(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative z-10 w-full md:w-[500px] md:max-h-[80vh] max-h-[85vh] glass-strong rounded-t-3xl md:rounded-2xl overflow-hidden flex flex-col animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                  style={{ background: "linear-gradient(135deg, #8b5cf6, #ec4899)" }}
                >
                  🎁
                </div>
                <h3 className="text-white font-semibold text-base">礼物商城</h3>
              </div>
              <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
                    <span className="text-sm">🪙</span>
                    <span className="text-amber-400 text-xs font-medium">{commerceState?.coins || 0}</span>
                  </div>
                <button
                  onClick={() => setShowGiftPanel(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-shrink-0 flex border-b border-white/5 px-2">
              {(["shop", "inventory", "wishlist", "requests"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setGiftTab(tab)}
                  className={`flex-1 py-2.5 text-xs font-medium relative transition-colors ${
                    giftTab === tab ? "text-white" : "text-ink-400 hover:text-white"
                  }`}
                >
                  {tab === "shop" && "🛒 商店"}
                  {tab === "inventory" && "📦 背包"}
                  {tab === "wishlist" && "💝 心愿单"}
                  {tab === "requests" && "📨 索取"}
                  {giftTab === tab && (
                    <span
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full"
                      style={{ background: "linear-gradient(90deg, #8b5cf6, #ec4899)" }}
                    />
                  )}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {giftTab === "shop" && (
                <div className="grid grid-cols-2 gap-3">
                  {SHOP_ITEMS.slice(0, 8).map((item: any) => (
                    <button
                      key={item.id}
                      className="card p-3 rounded-xl text-left hover:bg-white/5 transition-all"
                      style={{
                        background: "linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)",
                        border: "1px solid rgba(139, 92, 246, 0.2)",
                      }}
                    >
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-2 mx-auto"
                        style={{ backgroundColor: item.previewColor || "rgba(255,255,255,0.05)" }}
                      >
                        {item.emoji}
                      </div>
                      <div className="text-white text-sm font-medium text-center">{item.name}</div>
                      <div className="text-amber-400 text-xs text-center mt-1">🪙 {item.price}</div>
                    </button>
                  ))}
                </div>
              )}

              {giftTab === "inventory" && (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">📦</div>
                  <p className="text-ink-400 text-sm">背包空空如也</p>
                  <p className="text-ink-600 text-xs mt-1">去商店看看有什么好东西吧</p>
                </div>
              )}

              {giftTab === "wishlist" && (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">💝</div>
                  <p className="text-ink-400 text-sm">暂无心愿</p>
                </div>
              )}

              {giftTab === "requests" && (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">📨</div>
                  <p className="text-ink-400 text-sm">暂无索取请求</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 场景面板 */}
      {showScenePanel && (
        <div className="fixed inset-0 z-40 flex items-end md:items-center justify-center" onClick={() => setShowScenePanel(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative z-10 w-full md:w-[480px] md:max-h-[80vh] max-h-[85vh] glass-strong rounded-t-3xl md:rounded-2xl overflow-hidden flex flex-col animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <ScenePanel
              currentScene={currentScene}
              onSceneChange={(scene) => {
                setCurrentScene(scene);
                setShowScenePanel(false);
              }}
              currentTimeOfDay={currentTimeOfDay}
              onTimeChange={setCurrentTimeOfDay}
              autoTimeMode={autoTimeMode}
              onAutoTimeToggle={setAutoTimeMode}
            />
            <div className="flex-shrink-0 p-3 border-t border-white/5">
              <CostumePanel
                currentCostume={currentCostume}
                onCostumeChange={setCurrentCostume}
                userLevel={lifeState?.relationship?.level || 1}
                ownedPremium={["costume_knight"]}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

LoverApp.displayName = "LoverApp";
