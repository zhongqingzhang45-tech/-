"use client";

import { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle, useMemo } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCharacterAgent, useSpeech } from "@/lib/hooks";
import { MoodType, Gender, PERSONA_MODE_LABELS, PersonaMode, CharacterProfile } from "@/lib/core/digital-life";
import { getExpressionForMood, getRandomMotionForMood, getModelConfig } from "@/lib/core/live2d-manager";
import type { Live2DPlayerRef, Live2DPlayerProps } from "@/components/Lover/Live2DPlayer";
import { SceneBackground, LightingOverlay, ParticleCanvas } from "@/components/Lover/SceneEffects";
import { ScenePanel, CostumePanel, SceneControlBar } from "@/components/Lover/ScenePanel";
import { SCENE_CONFIGS, LIGHTING_CONFIGS, getTimeOfDayFromDate, getSceneConfig, SceneId, TimeOfDay, COSTUME_CONFIGS } from "@/lib/core/scene-system";
import { getCommerceEngine, CommerceState, SHOP_ITEMS } from "@/lib/core/commerce-system";
import { GuofengAmbient } from "@/components/GuofengAmbient";
import { getCharacterById, GuofengCharacter, GUOFENG_CHARACTERS } from "@/data/characters";
import DiaryPage from "@/components/Lover/DiaryPage";

const Live2DPlayerDynamic = dynamic(() => import("@/components/Lover/Live2DPlayer"), {
  ssr: false,
  loading: () => null,
});

const Live2DPlayer = forwardRef<Live2DPlayerRef, Live2DPlayerProps>((props, ref) => {
  return <Live2DPlayerDynamic {...props} forwardedRef={ref} />;
});
Live2DPlayer.displayName = "Live2DPlayer";

/* —— 国风化导航 —— */
const NAV_ITEMS = [
  { id: "chat", label: "絮语", glyph: "语" },
  { id: "diary", label: "札记", glyph: "记" },
];

/* —— 模式色 —— 国风色板 —— */
function getModeColor(mode?: string): string {
  switch (mode) {
    case "affectionate": return "#C75140";   // 胭脂
    case "tsundere": return "#C8453C";        // 朱砂
    case "cold": return "#4A7C7E";            // 青黛
    case "aggressive": return "#8E2820";      // 深朱
    case "silent_treatment": return "#3a6163";// 深青
    case "pua": return "#6F1F19";             // 暗朱
    case "reconciliation": return "#7fafa6";  // 浅青
    default: return "#C9A961";                // 金箔
  }
}

/* —— 国风心情字符 —— */
const MOOD_GLYPH: Record<string, string> = {
  neutral: "·",
  happy: "悦",
  excited: "欢",
  shy: "羞",
  love: "慕",
  sad: "伤",
  angry: "怒",
  jealous: "醋",
  sleepy: "倦",
  thoughtful: "思",
  playful: "俏",
  surprised: "惊",
  cold: "冷",
  disdain: "哂",
  tsundere: "傲",
  coquettish: "嗔",
  pua: "抑",
  hurt: "痛",
  disappointed: "失",
  smug: "得",
};

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
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const live2dRef = useRef<Live2DPlayerRef>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* —— 读取注册时选择的国风角色 —— */
  const guofengChar = useMemo<GuofengCharacter | undefined>(() => {
    if (typeof window === "undefined") return undefined;
    const id = localStorage.getItem("lover_character_id");
    if (id) return getCharacterById(id);
    return undefined;
  }, []);

  /* —— 把国风角色信息覆盖到 agent profile —— */
  const profileOverride = useMemo<Partial<CharacterProfile> | undefined>(() => {
    if (!guofengChar) return undefined;
    return {
      id: guofengChar.id,
      live2dModel: guofengChar.live2dModel,
      name: guofengChar.name,
      gender: guofengChar.gender,
      persona: guofengChar.personality,
      background: guofengChar.background,
    };
  }, [guofengChar]);

  const { messages, mood, isTyping, sendMessage, profile, lifeState, agent, generateDiary, handleInteraction } = useCharacterAgent(profileOverride);
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

  const EMOJI_LIST = ["😊", "😂", "🥰", "😢", "😡", "🤔", "😴", "😏", "👍", "❤️", "🌹", "✨", "😭", "🥺", "😜", "🤩", "🍵", "📜", "🌸", "🏮"];

  const currentMood = (mood?.mood ?? "happy") as MoodType;

  const currentCharacter = {
    id: profile?.live2dModel || guofengChar?.live2dModel || "HaruGreeter",
    name: profile?.name || guofengChar?.name || "小春",
    path: getModelConfig(profile?.live2dModel || guofengChar?.live2dModel || "HaruGreeter")?.path || "/live2d-models",
    model: profile?.live2dModel || guofengChar?.live2dModel || "HaruGreeter",
    avatar: profile?.gender === "male" ? "郎" : "娘",
    scale: getModelConfig(profile?.live2dModel || guofengChar?.live2dModel || "HaruGreeter")?.scale || 2,
    positionY: getModelConfig(profile?.live2dModel || guofengChar?.live2dModel || "HaruGreeter")?.positionY || 0.55,
    type: "cubism3" as const,
    gender: profile?.gender || guofengChar?.gender || "female",
  };

  /* —— 国风场景配置 —— 把原 bedroom/park 等映射到国风意境 —— */
  const sceneConfig = getSceneConfig(currentScene);
  const lightingConfig = LIGHTING_CONFIGS[currentTimeOfDay];

  /* —— 角色专属色 —— */
  const accentColor = guofengChar?.accentColor || "#C8453C";
  const secondaryColor = guofengChar?.secondaryColor || "#EDE3D0";

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
    sendMessage(input.trim() || "（发了一幅画）", pendingImage || undefined);
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
      `${profile?.userNickname ?? "公子"}，你终于打来啦～ 妾身等候多时。`,
      "喂？是公子吗？听到你的声音，心里甚是欢喜。",
      "公子～ 今日可还安好？",
      "正想着公子，公子的电话便来了，可是心有灵犀？",
    ];
    const greeting = callGreetings[Math.floor(Math.random() * callGreetings.length)];

    setTimeout(() => {
      setCallPhase("connected");
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
  }, [voiceEnabled, speak, sendMessage, currentCharacter.model, profile?.userNickname]);

  const endCall = useCallback(() => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    stopListening();
    setCallPhase("ended");
    setIsInCall(false);
    const farewells = [
      "公子珍重，记得再来寻妾身。",
      "且去且去，妾身在此候君再来。",
      "夜深了，公子早些歇息，妾心随君。",
      "愿君安好，再会再会。",
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
      <div className="h-screen w-screen flex items-center justify-center overflow-hidden gf-bg">
        <div className="absolute inset-0 gf-grain" />
        <div className="relative flex flex-col items-center gap-5">
          <div className="seal w-16 h-16 text-2xl animate-breathe-soft">君心</div>
          <div className="text-ink-400 text-sm font-serif tracking-widest">墨色晕开中…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col relative gf-bg">
      <div className="absolute inset-0 gf-grain pointer-events-none" />

      {/* —— 顶部卷轴导航 —— */}
      <header className="flex-shrink-0 h-14 flex items-center justify-between px-4 md:px-6 relative z-20 glass">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2.5 group"
            title="返回首页"
          >
            <div className="seal w-9 h-9 text-sm">君</div>
            <div className="hidden sm:flex flex-col leading-none">
              <span className="font-title text-paper-50 text-sm tracking-widest">君心</span>
              <span className="text-ink-500 text-[9px] tracking-[0.3em] mt-0.5">JUN XIN</span>
            </div>
          </button>
          {guofengChar && (
            <div className="hidden md:flex items-center gap-2 pl-3 ml-1 border-l border-gold-400/15">
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-display"
                style={{
                  background: `${accentColor}20`,
                  color: accentColor,
                  border: `1px solid ${accentColor}40`,
                }}
              >
                {guofengChar.name.charAt(0)}
              </span>
              <div className="flex flex-col leading-none">
                <span className="font-display text-paper-50 text-sm">{currentCharacter.name}</span>
                <span className="text-ink-500 text-[10px] font-serif mt-0.5">
                  {guofengChar.archetypeLabel} · 境界 {lifeState?.growth?.level || 1}
                </span>
              </div>
            </div>
          )}
        </div>

        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`relative px-3 md:px-4 py-1.5 rounded-md text-xs font-serif tracking-wider transition-all ${
                activeNav === item.id
                  ? "text-paper-50"
                  : "text-ink-400 hover:text-paper-100"
              }`}
              style={activeNav === item.id ? {
                background: "linear-gradient(135deg, rgba(200,69,60,0.18) 0%, rgba(142,40,32,0.10) 100%)",
                border: "1px solid rgba(200,69,60,0.3)",
              } : {}}
            >
              <span className="mr-1 font-display">{item.glyph}</span>
              {item.label}
            </button>
          ))}
          <Link
            href="/community"
            className="hidden md:flex px-3 py-1.5 rounded-md text-xs font-serif tracking-wider text-ink-400 hover:text-paper-100 transition-all"
          >
            <span className="mr-1 font-display">集</span>雅集
          </Link>
          <Link
            href="/membership"
            className="hidden md:flex px-3 py-1.5 rounded-md text-xs font-serif tracking-wider text-ink-400 hover:text-paper-100 transition-all"
          >
            <span className="mr-1 font-display">缘</span>会员
          </Link>
        </nav>

        <div className="flex items-center gap-1.5">
          {guofengChar?.premium && (
            <span
              className="hidden sm:inline-flex seal w-7 h-7 text-[10px]"
              title="尊享会员"
            >尊</span>
          )}
          <button
            onClick={startCall}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-ink-400 hover:text-cinnabar-400 hover:bg-cinnabar-500/10 transition-all"
            title="语音通话"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
          </button>
        </div>
      </header>

      {/* —— 主内容区 —— */}
      <main className="flex-1 min-h-0 flex relative overflow-hidden">
        {activeNav === "chat" && (
          <>
            {/* —— 左侧：国风意境角色展示 —— */}
            <div className="hidden md:flex flex-col w-2/5 lg:w-1/2 relative flex-shrink-0">
              <div className="flex-1 relative min-h-0 overflow-hidden">
                <SceneBackground scene={sceneConfig} />
                <LightingOverlay lighting={lightingConfig} />
                <ParticleCanvas particleType={sceneConfig.particleType || "none"} />

                {/* 国风氛围层 —— 落花祥云 */}
                <GuofengAmbient
                  petals={10}
                  clouds
                  glow
                  glowColor={`rgba(${hexToRgb(accentColor)}, 0.10)`}
                  className="z-10"
                />

                {/* 顶部角色诗号 —— 竖排 */}
                {guofengChar && (
                  <div className="absolute top-6 right-6 z-20 max-w-[200px] text-right">
                    <p
                      className="font-display text-paper-50/85 text-lg leading-tight"
                      style={{ textShadow: "0 2px 12px rgba(0,0,0,0.7)" }}
                    >
                      {guofengChar.name}
                    </p>
                    <p className="text-gold-300/80 text-[11px] font-serif tracking-widest mt-0.5">
                      {guofengChar.title}
                    </p>
                    <p
                      className="vertical-text font-serif text-paper-100/60 text-[11px] mt-2 inline-block"
                      style={{ textShadow: "0 1px 6px rgba(0,0,0,0.7)" }}
                    >
                      {guofengChar.poem.replace(/[，。、？！]/g, " ").trim()}
                    </p>
                  </div>
                )}

                {/* 左下印章 —— 心境 */}
                <div className="absolute bottom-6 left-6 z-20 flex items-center gap-2">
                  <div
                    className="w-10 h-10 rounded flex items-center justify-center font-display text-lg"
                    style={{
                      background: `${getModeColor(lifeState?.currentMode)}20`,
                      color: getModeColor(lifeState?.currentMode),
                      border: `1px solid ${getModeColor(lifeState?.currentMode)}50`,
                    }}
                    title={PERSONA_MODE_LABELS[lifeState?.currentMode as PersonaMode] || "平和"}
                  >
                    {MOOD_GLYPH[currentMood] || "·"}
                  </div>
                  <div className="flex flex-col leading-none">
                    <span className="text-paper-100/80 text-[11px] font-serif tracking-wider">
                      {PERSONA_MODE_LABELS[lifeState?.currentMode as PersonaMode] || "平和之境"}
                    </span>
                    <span className="text-ink-400 text-[9px] font-serif mt-0.5">
                      好感 {lifeState?.persona?.affection || 0} · 缘分 {lifeState?.growth?.level || 1}
                    </span>
                  </div>
                </div>

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

            {/* —— 右侧：聊天卷轴 —— */}
            <div className="flex-1 flex flex-col min-h-0 relative border-l border-gold-400/10">
              {/* 角色信息条 —— 国风化 */}
              <div className="flex-shrink-0 px-4 py-3 border-b border-gold-400/10 glass">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-8 h-8 rounded flex items-center justify-center font-display text-base"
                      style={{
                        background: `${accentColor}25`,
                        color: accentColor,
                        border: `1px solid ${accentColor}50`,
                      }}
                    >
                      {currentCharacter.name?.charAt(0) || "君"}
                    </span>
                    <div className="flex flex-col leading-none">
                      <span className="font-display text-paper-50 text-base">{currentCharacter.name}</span>
                      {guofengChar && (
                        <span className="text-ink-500 text-[10px] font-serif mt-0.5">
                          {guofengChar.archetypeLabel} · 境界 {lifeState?.growth?.level || 1}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className="text-[10px] px-2.5 py-1 rounded-full font-serif tracking-wider"
                    style={{
                      backgroundColor: `${getModeColor(lifeState?.currentMode)}18`,
                      color: getModeColor(lifeState?.currentMode),
                      border: `1px solid ${getModeColor(lifeState?.currentMode)}30`,
                    }}
                  >
                    {PERSONA_MODE_LABELS[lifeState?.currentMode as PersonaMode] || "平和"}
                  </span>
                </div>

                {/* 好感/缘分条 —— 国风化 */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-ink-400 w-10 font-serif">情谊</span>
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(16,11,8,0.6)" }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${lifeState?.persona?.affection || 0}%`,
                          background: `linear-gradient(90deg, ${accentColor}, ${secondaryColor})`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-ink-500 w-10 text-right font-serif">
                      {lifeState?.persona?.affection || 0}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-ink-400 w-10 font-serif">怨念</span>
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(16,11,8,0.6)" }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${lifeState?.persona?.resentment || 0}%`,
                          background: "linear-gradient(90deg, #6F1F19, #C8453C)",
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-ink-500 w-10 text-right font-serif">
                      {lifeState?.persona?.resentment || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* 消息列表 —— 卷轴风 */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scroll-smooth">
                <div className="text-center mb-4">
                  <span className="inline-flex items-center gap-2 text-[10px] text-ink-600 font-serif tracking-widest">
                    <span className="h-px w-6 bg-gold-400/30" />
                    与君初识 · 请君善语相待
                    <span className="h-px w-6 bg-gold-400/30" />
                  </span>
                </div>

                {messages.map((msg: any) => {
                  const isUser = msg.sender === "user";
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                    >
                      <div
                        className={`w-8 h-8 rounded flex-shrink-0 flex items-center justify-center text-xs font-display ${
                          isUser ? "" : ""
                        }`}
                        style={isUser ? {
                          background: "rgba(201,169,97,0.15)",
                          color: "#dcb363",
                          border: "1px solid rgba(201,169,97,0.3)",
                        } : {
                          background: `${accentColor}20`,
                          color: accentColor,
                          border: `1px solid ${accentColor}40`,
                        }}
                      >
                        {isUser ? "君" : currentCharacter.name?.charAt(0)}
                      </div>
                      <div
                        className={`max-w-[75%] px-3.5 py-2.5 rounded-xl text-sm leading-relaxed font-serif ${
                          isUser ? "rounded-tr-sm" : "rounded-tl-sm"
                        }`}
                        style={isUser ? {
                          background: "linear-gradient(135deg, rgba(201,169,97,0.18) 0%, rgba(176,143,69,0.12) 100%)",
                          border: "1px solid rgba(201,169,97,0.25)",
                          color: "#FBF6EC",
                        } : {
                          background: "rgba(28,22,16,0.7)",
                          border: `1px solid ${accentColor}25`,
                          color: "#E8DCC4",
                        }}
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
                    <div
                      className="w-8 h-8 rounded flex-shrink-0 flex items-center justify-center text-xs font-display"
                      style={{
                        background: `${accentColor}20`,
                        color: accentColor,
                        border: `1px solid ${accentColor}40`,
                      }}
                    >
                      {currentCharacter.name?.charAt(0)}
                    </div>
                    <div
                      className="px-4 py-3 rounded-xl rounded-tl-sm"
                      style={{
                        background: "rgba(28,22,16,0.7)",
                        border: `1px solid ${accentColor}25`,
                      }}
                    >
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: accentColor, animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: accentColor, animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: accentColor, animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* 底部输入区 —— 卷轴 */}
              <div className="flex-shrink-0 px-3 py-3 border-t border-gold-400/10 glass">
                {pendingImage && (
                  <div className="relative mb-2 inline-block">
                    <img src={pendingImage} alt="" className="w-20 h-20 object-cover rounded-lg" />
                    <button
                      onClick={() => setPendingImage(null)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-xs flex items-center justify-center"
                      style={{ background: "#C8453C", color: "#FBF6EC" }}
                    >
                      ×
                    </button>
                  </div>
                )}

                <div className="flex items-end gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setShowSkills(!showSkills)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:text-gold-300 hover:bg-gold-400/10 transition-all"
                      title="才艺"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8 5.8 21.3l2.4-7.4L2 9.4h7.6z"/>
                      </svg>
                    </button>
                    <button
                      onClick={() => setShowGiftPanel(true)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:text-cinnabar-400 hover:bg-cinnabar-500/10 transition-all"
                      title="赠礼"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <polyline points="20 12 20 22 4 22 4 12"/>
                        <rect x="2" y="7" width="20" height="5"/>
                        <line x1="12" y1="22" x2="12" y2="7"/>
                        <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
                        <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
                      </svg>
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:text-jade-300 hover:bg-jade-500/10 transition-all"
                      title="图片"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                      </svg>
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
                      placeholder="与君絮语…"
                      rows={1}
                      className="w-full px-3.5 py-2 rounded-lg text-paper-50 text-sm font-serif placeholder:text-ink-600 outline-none resize-none input-base"
                      style={{ minHeight: "40px", maxHeight: "120px" }}
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                        showEmojiPicker
                          ? "text-cinnabar-400 bg-cinnabar-500/15"
                          : "text-ink-400 hover:text-paper-100 hover:bg-gold-400/10"
                      }`}
                      title="表情"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                        <line x1="9" y1="9" x2="9.01" y2="9"/>
                        <line x1="15" y1="9" x2="15.01" y2="9"/>
                      </svg>
                    </button>
                    <button
                      onClick={handleMicToggle}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                        isListening
                          ? "text-jade-300 bg-jade-500/15 border border-jade-500/30"
                          : "text-ink-400 hover:text-paper-100 hover:bg-gold-400/10"
                      }`}
                      title="语音"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/>
                      </svg>
                    </button>
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() && !pendingImage}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-paper-50 transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed btn-primary"
                      title="发送"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"/>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {showEmojiPicker && (
                  <div className="mt-2 p-2 rounded-lg glass-strong flex flex-wrap gap-1">
                    {EMOJI_LIST.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleEmojiClick(emoji)}
                        className="w-8 h-8 rounded flex items-center justify-center text-lg hover:bg-gold-400/10 transition-all"
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
      <nav className="md:hidden flex-shrink-0 h-14 flex items-center justify-around border-t border-gold-400/10 glass">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveNav(item.id)}
            className={`flex flex-col items-center gap-0.5 px-6 py-1.5 rounded-lg transition-all ${
              activeNav === item.id ? "text-cinnabar-400" : "text-ink-500"
            }`}
          >
            <span className="font-display text-base">{item.glyph}</span>
            <span className="text-[10px] font-serif tracking-wider">{item.label}</span>
          </button>
        ))}
        <Link
          href="/community"
          className="flex flex-col items-center gap-0.5 px-6 py-1.5 rounded-lg text-ink-500"
        >
          <span className="font-display text-base">集</span>
          <span className="text-[10px] font-serif tracking-wider">雅集</span>
        </Link>
        <Link
          href="/membership"
          className="flex flex-col items-center gap-0.5 px-6 py-1.5 rounded-lg text-ink-500"
        >
          <span className="font-display text-base">缘</span>
          <span className="text-[10px] font-serif tracking-wider">会员</span>
        </Link>
      </nav>

      {/* —— 语音通话界面 —— 国风琉璃屏 —— */}
      {isInCall && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gf-bg" style={{ backdropFilter: "blur(20px)" }}>
          <div className="absolute inset-0 gf-grain" />
          <GuofengAmbient petals={14} clouds glow glowColor={`rgba(${hexToRgb(accentColor)}, 0.15)`} />

          <div className="relative z-10 flex flex-col items-center">
            {/* 角色印章头像 */}
            <div className="relative mb-6">
              <div
                className="w-28 h-28 rounded-2xl flex items-center justify-center font-display text-5xl"
                style={{
                  background: `linear-gradient(135deg, ${accentColor} 0%, ${darkerHex(accentColor)} 100%)`,
                  color: "#FBF6EC",
                  boxShadow: `0 0 60px ${accentColor}60`,
                  border: "2px solid rgba(251,246,236,0.18)",
                }}
              >
                {currentCharacter.name?.charAt(0) || "君"}
              </div>
              {callPhase === "connected" && (
                <>
                  <span
                    className="absolute inset-0 rounded-2xl animate-ping opacity-30"
                    style={{ background: `linear-gradient(135deg, ${accentColor}, ${darkerHex(accentColor)})` }}
                  />
                  <span
                    className="absolute -inset-2 rounded-[1.7rem] animate-ping opacity-20"
                    style={{ background: accentColor, animationDelay: "500ms" }}
                  />
                </>
              )}
            </div>

            <h2 className="font-display text-paper-50 text-2xl mb-2 tracking-wider">{currentCharacter.name}</h2>
            {guofengChar && (
              <p className="text-gold-300/70 text-xs font-serif tracking-widest mb-6">
                {guofengChar.archetypeLabel} · {guofengChar.title}
              </p>
            )}
            <p className="text-ink-400 text-sm font-serif tracking-wider mb-8">
              {callPhase === "calling" && "正拨云相唤…"}
              {callPhase === "connected" && formatCallDuration(callDuration)}
              {callPhase === "ended" && "话音已歇，余韵犹存"}
            </p>

            <div className="flex items-center gap-6">
              <button
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                  voiceEnabled
                    ? "text-jade-300 bg-jade-500/15 border border-jade-500/30"
                    : "text-ink-500 bg-ink-850/60"
                }`}
                title="语音"
              >
                {voiceEnabled ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                    <line x1="23" y1="9" x2="17" y2="15"/>
                    <line x1="17" y1="9" x2="23" y2="15"/>
                  </svg>
                )}
              </button>
              <button
                onClick={endCall}
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-paper-50 transition-all hover:scale-105 active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #C8453C 0%, #8E2820 100%)",
                  boxShadow: "0 4px 20px rgba(200,69,60,0.5)",
                  border: "1px solid rgba(251,246,236,0.2)",
                }}
                title="挂断"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: "rotate(135deg)" }}>
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              </button>
              <button
                onClick={handleMicToggle}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                  isListening
                    ? "text-cinnabar-400 bg-cinnabar-500/15 border border-cinnabar-500/30"
                    : "text-ink-400 bg-ink-850/60"
                }`}
                title="麦克风"
              >
                {isListening ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="1" y1="1" x2="23" y2="23"/>
                    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V5a3 3 0 0 0-5.94-.6"/>
                    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23M12 19v4"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* —— 才艺面板 —— */}
      {showSkills && (
        <div className="fixed inset-0 z-30" onClick={() => setShowSkills(false)}>
          <div className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm" />
          <div
            className="absolute bottom-16 left-3 w-56 glass-strong rounded-xl p-3 space-y-1 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-xs text-gold-300 mb-2 px-2 font-serif tracking-widest">— 才艺雅集 —</p>
            {skills.map((skill: any) => (
              <button
                key={skill.id}
                onClick={() => handleSkillClick(skill.id, skill.triggerPhrase)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gold-400/8 transition-all text-left"
              >
                <span className="text-lg">{skill.icon}</span>
                <div>
                  <div className="text-paper-100 text-sm font-serif">{skill.name}</div>
                  <div className="text-ink-500 text-xs font-serif">{skill.description}</div>
                </div>
              </button>
            ))}
            {skills.length === 0 && (
              <p className="text-center text-ink-500 text-xs py-4 font-serif">才艺尚未觉醒</p>
            )}
          </div>
        </div>
      )}

      {/* —— 赠礼面板 —— */}
      {showGiftPanel && (
        <div className="fixed inset-0 z-40 flex items-end md:items-center justify-center" onClick={() => setShowGiftPanel(false)}>
          <div className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm" />
          <div
            className="relative z-10 w-full md:w-[500px] md:max-h-[80vh] max-h-[85vh] glass-strong rounded-t-3xl md:rounded-2xl overflow-hidden flex flex-col animate-slide-up"
            onClick={(e) => e.stopPropagation()}
            style={{ border: "1px solid rgba(201,169,97,0.18)" }}
          >
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-gold-400/10">
              <div className="flex items-center gap-2.5">
                <div className="seal w-9 h-9 text-sm">礼</div>
                <div>
                  <h3 className="font-display text-paper-50 text-base leading-none">雅礼相赠</h3>
                  <p className="text-ink-500 text-[10px] font-serif mt-0.5">心意到，情谊深</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full" style={{ background: "rgba(201,169,97,0.10)", border: "1px solid rgba(201,169,97,0.25)" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="#dcb363">
                    <circle cx="12" cy="12" r="10"/>
                  </svg>
                  <span className="text-gold-300 text-xs font-medium font-serif">{commerceState?.coins || 0}</span>
                </div>
                <button
                  onClick={() => setShowGiftPanel(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:text-paper-100 hover:bg-gold-400/10 transition-all"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-shrink-0 flex border-b border-gold-400/10 px-2">
              {(["shop", "inventory", "wishlist", "requests"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setGiftTab(tab)}
                  className={`flex-1 py-2.5 text-xs font-serif relative transition-colors ${
                    giftTab === tab ? "text-paper-50" : "text-ink-400 hover:text-paper-100"
                  }`}
                >
                  {tab === "shop" && "礼铺"}
                  {tab === "inventory" && "妆匣"}
                  {tab === "wishlist" && "心愿"}
                  {tab === "requests" && "所求"}
                  {giftTab === tab && (
                    <span
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full"
                      style={{ background: "linear-gradient(90deg, #C8453C, #dcb363)" }}
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
                      className="scroll-card p-3 rounded-xl text-left card-hover"
                    >
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-2 mx-auto"
                        style={{ backgroundColor: item.previewColor || "rgba(201,169,97,0.08)" }}
                      >
                        {item.emoji}
                      </div>
                      <div className="text-paper-100 text-sm font-serif text-center">{item.name}</div>
                      <div className="text-gold-300 text-xs text-center mt-1 font-serif">¥ {item.price}</div>
                    </button>
                  ))}
                </div>
              )}

              {giftTab === "inventory" && (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3 opacity-60">🎎</div>
                  <p className="text-ink-400 text-sm font-serif">妆匣空空</p>
                  <p className="text-ink-600 text-xs mt-1 font-serif">往礼铺一逛，拣几件心意</p>
                </div>
              )}

              {giftTab === "wishlist" && (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3 opacity-60">🏮</div>
                  <p className="text-ink-400 text-sm font-serif">尚无心愿</p>
                </div>
              )}

              {giftTab === "requests" && (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3 opacity-60">📜</div>
                  <p className="text-ink-400 text-sm font-serif">无有所求</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* —— 场景面板 —— */}
      {showScenePanel && (
        <div className="fixed inset-0 z-40 flex items-end md:items-center justify-center" onClick={() => setShowScenePanel(false)}>
          <div className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm" />
          <div
            className="relative z-10 w-full md:w-[480px] md:max-h-[80vh] max-h-[85vh] glass-strong rounded-t-3xl md:rounded-2xl overflow-hidden flex flex-col animate-slide-up"
            onClick={(e) => e.stopPropagation()}
            style={{ border: "1px solid rgba(201,169,97,0.18)" }}
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
            <div className="flex-shrink-0 p-3 border-t border-gold-400/10">
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

/* —— 国风色辅助函数 —— */
function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

function darkerHex(hex: string): string {
  const h = hex.replace("#", "");
  const r = Math.max(0, parseInt(h.substring(0, 2), 16) - 40);
  const g = Math.max(0, parseInt(h.substring(2, 4), 16) - 40);
  const b = Math.max(0, parseInt(h.substring(4, 6), 16) - 40);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}
