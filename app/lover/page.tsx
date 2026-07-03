"use client";

import { useState, useEffect, useRef, useCallback, forwardRef } from "react";
import dynamic from "next/dynamic";
import { ChatMessage } from "@/data/lover";
import { useCharacterAgent, useSpeech } from "@/lib/hooks";
import { MoodType, FEMALE_CHARACTERS, MALE_CHARACTERS, Gender, PERSONA_MODE_LABELS, PersonaMode, Gift, GiftRequest } from "@/lib/core/digital-life";
import { getExpressionForMood, getRandomMotionForMood, getModelConfig, BUILTIN_MODELS } from "@/lib/core/live2d-manager";
import type { Live2DPlayerRef, Live2DPlayerProps } from "@/components/Lover/Live2DPlayer";
import { SceneBackground, LightingOverlay, ParticleCanvas } from "@/components/Lover/SceneEffects";
import { ScenePanel, CostumePanel, SceneControlBar } from "@/components/Lover/ScenePanel";
import { CommercePanel } from "@/components/Lover/CommercePanel";
import { SCENE_CONFIGS, LIGHTING_CONFIGS, getTimeOfDayFromDate, getSceneConfig, SceneId, TimeOfDay, COSTUME_CONFIGS } from "@/lib/core/scene-system";
import { getCommerceEngine, CommerceState } from "@/lib/core/commerce-system";
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

export default function LoverPage() {
  const { messages, streamingMessage, mood, isTyping, sendMessage, profile, lifeState, agent, generateDiary, handleInteraction } = useCharacterAgent();
  const { isListening, startListening, stopListening, speak, isSpeaking, handleFirstInteraction } = useSpeech();
  const [activeNav, setActiveNav] = useState("chat");
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"profile" | "character" | "voice" | "data" | "shop" | "about">("profile");
  const [showSkills, setShowSkills] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [input, setInput] = useState("");
  const [micActive, setMicActive] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [userGender, setUserGender] = useState<Gender>("male");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [skills, setSkills] = useState<any[]>([]);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [showGiftPanel, setShowGiftPanel] = useState(false);
  const [giftTab, setGiftTab] = useState<"shop" | "inventory" | "wishlist" | "requests">("shop");
  const [coinBalance, setCoinBalance] = useState(100);

  // 商业化引擎
  const [commerceState, setCommerceState] = useState<CommerceState>(() => getCommerceEngine().getState());
  const commerceEngine = getCommerceEngine();

  useEffect(() => {
    return commerceEngine.subscribe(setCommerceState);
  }, [commerceEngine]);
  
  // LLM 配置状态
  const [llmProvider, setLlmProvider] = useState<"openai" | "anthropic" | "deepseek" | "qwen" | "glm" | "mock">("mock");
  const [llmApiKey, setLlmApiKey] = useState("");
  const [llmModel, setLlmModel] = useState("gpt-3.5-turbo");
  const [llmSaved, setLlmSaved] = useState(false);
  
  // 角色模型状态
  const [selectedModel, setSelectedModel] = useState("HaruGreeter");
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>("xiaochun");
  const [showModelSelector, setShowModelSelector] = useState(false);
  
  // 声音设置状态
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [asrEnabled, setAsrEnabled] = useState(true);
  const [voiceVolume, setVoiceVolume] = useState(80);
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  
  // 数据管理状态
  const [showDataConfirm, setShowDataConfirm] = useState<string | null>(null);

  // 场景与服装状态
  const [currentScene, setCurrentScene] = useState<SceneId>("bedroom");
  const [currentTimeOfDay, setCurrentTimeOfDay] = useState<TimeOfDay>(getTimeOfDayFromDate());
  const [autoTimeMode, setAutoTimeMode] = useState(true);
  const [showScenePanel, setShowScenePanel] = useState(false);
  const [currentCostume, setCurrentCostume] = useState("default");

  // 语音通话状态
  const [isInCall, setIsInCall] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callPhase, setCallPhase] = useState<"idle" | "calling" | "connected" | "ended">("idle");
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const callLoopRef = useRef<boolean>(false);

  const live2dRef = useRef<Live2DPlayerRef>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentMood = (mood?.mood ?? "happy") as MoodType;

  const EMOJI_LIST = ["😊", "😂", "🥰", "😢", "😡", "🤔", "😴", "😏", "👍", "❤️", "🌹", "✨", "😭", "🥺", "😜", "🤩"];

  const ALL_CHARACTERS = [...FEMALE_CHARACTERS, ...MALE_CHARACTERS];
  const selectedCharProfile = ALL_CHARACTERS.find(c => c.id === selectedCharacterId);
  const activeModelName = selectedModel || selectedCharProfile?.live2dModel || profile?.live2dModel || "HaruGreeter";
  const modelConfig = getModelConfig(activeModelName);

  const currentCharacter = {
    id: activeModelName,
    name: selectedCharProfile?.name || profile?.name || "小春",
    path: modelConfig?.path || "/live2d-models",
    model: activeModelName,
    avatar: (selectedCharProfile?.gender || profile?.gender) === "male" ? "👨" : "👩",
    scale: modelConfig?.scale || 2,
    positionY: modelConfig?.positionY || 0.55,
    type: "cubism3" as const,
    gender: selectedCharProfile?.gender || profile?.gender || "female",
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("lover_user_gender") as Gender | null;
      if (stored) setUserGender(stored);
    }
  }, []);

  useEffect(() => {
    if (agent) {
      setSkills(agent.getSkills());
      setCoinBalance(agent.getCoinBalance());
    }
  }, [agent]);

  // 加载保存的设置
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLlm = localStorage.getItem("lover_llm_config");
      if (savedLlm) {
        try {
          const config = JSON.parse(savedLlm);
          setLlmProvider(config.provider || "mock");
          setLlmApiKey(config.apiKey || "");
          setLlmModel(config.model || "gpt-3.5-turbo");
        } catch (e) {}
      }
      
      const savedModel = localStorage.getItem("lover_selected_model");
      if (savedModel) {
        setSelectedModel(savedModel);
      }

      const savedCharId = localStorage.getItem("lover_selected_character");
      if (savedCharId) {
        setSelectedCharacterId(savedCharId);
      }
      
      const savedVoice = localStorage.getItem("lover_voice_settings");
      if (savedVoice) {
        try {
          const voice = JSON.parse(savedVoice);
          setTtsEnabled(voice.ttsEnabled ?? true);
          setAsrEnabled(voice.asrEnabled ?? true);
          setVoiceVolume(voice.volume ?? 80);
          setVoiceSpeed(voice.speed ?? 1.0);
        } catch (e) {}
      }
    }
  }, []);

  // 保存 LLM 配置
  const saveLlmConfig = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("lover_llm_config", JSON.stringify({
        provider: llmProvider,
        apiKey: llmApiKey,
        model: llmModel,
      }));
      setLlmSaved(true);
      setTimeout(() => setLlmSaved(false), 2000);
      
      // 应用到 agent
      if (agent && llmProvider !== "mock") {
        agent.setLLMConfig({
          provider: llmProvider,
          apiKey: llmApiKey,
          model: llmModel,
          temperature: 0.8,
          maxTokens: 500,
        });
      }
    }
  }, [llmProvider, llmApiKey, llmModel, agent]);

  // 保存角色模型
  const saveModelSelection = useCallback((modelName: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("lover_selected_model", modelName);
      setSelectedModel(modelName);
    }
  }, []);

  // 切换角色
  const handleCharacterSwitch = useCallback((characterId: string) => {
    if (typeof window === "undefined") return;
    const allChars = [...FEMALE_CHARACTERS, ...MALE_CHARACTERS];
    const char = allChars.find(c => c.id === characterId);
    if (!char) return;

    localStorage.setItem("lover_selected_character", characterId);
    localStorage.setItem("lover_selected_model", char.live2dModel);
    setSelectedCharacterId(characterId);
    setSelectedModel(char.live2dModel);
    setModelReady(false);

    // 更新 agent 角色配置
    if (agent) {
      agent.updateProfile({
        name: char.name,
        nickname: char.nickname,
        gender: char.gender,
        persona: char.persona,
        speakingStyle: char.speakingStyle,
        catchphrases: char.catchphrases,
        live2dModel: char.live2dModel,
        voiceModel: char.voiceModel,
        accentColor: char.accentColor,
        secondaryColor: char.secondaryColor,
      });
    }
  }, [agent]);

  // 自动时间同步
  useEffect(() => {
    if (!autoTimeMode) return;
    const updateTime = () => setCurrentTimeOfDay(getTimeOfDayFromDate());
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [autoTimeMode]);

  const sceneConfig = getSceneConfig(currentScene);
  const lightingConfig = LIGHTING_CONFIGS[currentTimeOfDay];

  // 保存声音设置
  const saveVoiceSettings = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("lover_voice_settings", JSON.stringify({
        ttsEnabled,
        asrEnabled,
        volume: voiceVolume,
        speed: voiceSpeed,
      }));
    }
  }, [ttsEnabled, asrEnabled, voiceVolume, voiceSpeed]);

  // 导出数据
  const exportData = useCallback(() => {
    if (typeof window !== "undefined" && agent) {
      const data = {
        lifeState: agent.getLifeState(),
        memories: agent.getMemories(100),
        messages: agent.getRecentMessages(),
        growthStats: agent.getGrowthStats(),
        exportTime: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lifeos-backup-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [agent]);

  // 清除数据
  const clearAllData = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.clear();
      agent?.reset();
      window.location.reload();
    }
  }, [agent]);

  useEffect(() => {
    if (voiceEnabled && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.sender === "assistant" && !isTyping) {
        const text = lastMsg.content;
        if (text.trim().length > 0 && text.trim().length < 200) {
          speak(text, { 
            emotion: lastMsg.emotion.mood as any,
            isSinging: (lastMsg as any).isSinging || text.includes("🎵")
          });
        }
      }
    }
  }, [messages, isTyping, voiceEnabled]);

  useEffect(() => {
    if (messages.length > 0 && modelReady) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.sender === "assistant" && !isTyping) {
        const mood = lastMsg.emotion.mood as MoodType;
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
    }
  }, [messages, isTyping, modelReady, currentCharacter.model]);

  const convertedMessages: ChatMessage[] = messages.map((msg) => ({
    id: msg.id,
    sender: msg.sender === "assistant" ? "lover" : "user",
    content: msg.content,
    timestamp: new Date(msg.timestamp),
    mood: msg.emotion.mood as any,
    imageUrl: (msg as any).imageUrl,
  }));

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = useCallback(() => {
    if (!input.trim() && !pendingImage) return;
    handleFirstInteraction();
    sendMessage(input.trim() || "（发了一张图片）", pendingImage || undefined);
    setInput("");
    setPendingImage(null);
    setShowEmojiPicker(false);
  }, [input, pendingImage, sendMessage, handleFirstInteraction]);

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
    handleFirstInteraction();
    sendMessage(trigger);
    setShowSkills(false);
  };

  // 语音通话功能
  const startCall = useCallback(() => {
    handleFirstInteraction();
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
  }, [voiceEnabled, speak, sendMessage, currentCharacter.model, handleFirstInteraction]);

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
  }, [voiceEnabled, speak, sendMessage, stopListening]);

  const handlePhoneClick = () => {
    if (isInCall) {
      endCall();
    } else {
      startCall();
    }
  };

  // 模型点击互动 - 触发表情和动作
  const handleModelClick = useCallback(() => {
    if (!modelReady) return;
    handleFirstInteraction();
    const interactions = [
      { mood: "happy" as MoodType, text: "呀～ 你碰我了呢～ 好开心！" },
      { mood: "shy" as MoodType, text: "讨、讨厌啦... 突然碰人家..." },
      { mood: "love" as MoodType, text: "嘿嘿～ 最喜欢你了 ❤️" },
      { mood: "playful" as MoodType, text: "哈哈哈，好痒啦～ 别闹～" },
      { mood: "surprised" as MoodType, text: "哇！吓我一跳！" },
    ];

    const interaction = interactions[Math.floor(Math.random() * interactions.length)];
    const expName = getExpressionForMood(interaction.mood, currentCharacter.model);
    const motionName = getRandomMotionForMood(interaction.mood, currentCharacter.model);

    live2dRef.current?.setExpression(expName);
    live2dRef.current?.playMotion(motionName);

    if (voiceEnabled && Math.random() > 0.5) {
      speak(interaction.text, { emotion: interaction.mood as any });
    }
  }, [modelReady, currentCharacter.model, voiceEnabled, speak, handleFirstInteraction]);

  const handleTouch = useCallback((zone: string) => {
    if (!modelReady) return;
    handleFirstInteraction();
    const result = handleInteraction(zone);
    if (!result) return;

    const motionName = getRandomMotionForMood(result.mood as MoodType, currentCharacter.model);
    live2dRef.current?.playMotion(motionName);
    live2dRef.current?.startLipSync(result.reaction);

    const charCount = result.reaction.length;
    const duration = Math.max(1500, charCount * 150);
    setTimeout(() => {
      live2dRef.current?.stopLipSync();
    }, duration);

    if (voiceEnabled) {
      speak(result.reaction, { emotion: result.mood as any });
    }
  }, [modelReady, handleInteraction, currentCharacter.model, voiceEnabled, speak, handleFirstInteraction]);

  const formatCallDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <main 
      className="relative h-screen w-screen overflow-hidden flex flex-col"
      style={{ 
        background: "radial-gradient(ellipse at 30% 85%, #1e1a2e 0%, #14111e 50%, #0a0a0f 100%)",
      }}
    >
      <div 
        className="absolute pointer-events-none"
        style={{ 
          left: "15%",
          bottom: "5%",
          width: "500px",
          height: "500px",
          background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, rgba(139,92,246,0.04) 40%, transparent 70%)",
          borderRadius: "50%",
          transform: "translateX(-30%)",
          filter: "blur(40px)",
        }}
      />

      <header
        className="flex-shrink-0 h-14 flex items-center px-4 md:px-5 z-20 glass safe-area-top"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-base glow-border"
            style={{
              background: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
              boxShadow: "0 2px 12px rgba(139,92,246,0.35)",
            }}
          >
            {profile?.name?.[0] || "星"}
          </div>
        </div>

        <nav className="hidden md:flex items-center justify-center flex-1 gap-0.5">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeNav === item.id ? "text-white" : "text-ink-400 hover:text-white"
              }`}
              style={{
                backgroundColor: activeNav === item.id ? "rgba(139,92,246,0.15)" : "transparent",
              }}
            >
              <span className="text-[11px]">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={handlePhoneClick}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:bg-white/5 touch-feedback`}
            style={{
              backgroundColor: isInCall
                ? "rgba(239, 68, 68, 0.15)"
                : "transparent",
            }}
            title={isInCall ? "挂断" : "语音通话"}
          >
            <svg 
              className="w-4 h-4"
              viewBox="0 0 24 24" 
              fill="none" 
              stroke={isInCall ? "#ef4444" : "#8e8ea2"} 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              style={{
                transform: isInCall ? "rotate(135deg)" : "none",
                transition: "transform 0.3s ease",
              }}
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:bg-white/5 touch-feedback"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#8e8ea2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </header>

      <div className="flex-1 flex min-h-0 relative">
        <div 
          className="absolute inset-0 z-0 md:relative md:flex md:w-[38%] lg:w-[35%] md:items-end md:justify-start cursor-pointer overflow-hidden"
          onClick={handleModelClick}
          style={{ borderRadius: isMobile ? 0 : "16px" }}
        >
          <SceneBackground scene={sceneConfig} />
          <div className="absolute top-0 left-0 w-full h-64 md:relative md:w-full md:h-full z-10">
            <Live2DPlayer
              key={currentCharacter.id}
              ref={live2dRef}
              modelPath={currentCharacter.path}
              modelName={currentCharacter.model}
              scale={isMobile ? 1.5 : currentCharacter.scale}
              positionY={isMobile ? 0.5 : currentCharacter.positionY}
              currentMood={currentMood}
              onModelLoaded={() => setModelReady(true)}
              onError={(err) => console.error("Live2D error:", err)}
              onTouched={(zone, reaction) => {
                handleTouch(zone);
              }}
            />
          </div>
          <LightingOverlay lighting={lightingConfig} />
          <ParticleCanvas particleType={sceneConfig.particleType || "none"} mood={currentMood} />
          <div 
            className="hidden md:block absolute bottom-0 left-0 w-full pointer-events-none z-20"
            style={{ 
              height: "140px",
              background: "radial-gradient(ellipse at 30% 100%, rgba(147,112,219,0.12) 0%, transparent 65%)",
            }}
          />
          <div className="absolute top-3 left-3 z-30">
            <SceneControlBar
              scene={currentScene}
              timeOfDay={currentTimeOfDay}
              onOpenPanel={() => setShowScenePanel(!showScenePanel)}
            />
          </div>
          {showScenePanel && (
            <div
              className="absolute top-14 left-3 z-40 w-72 max-h-[70vh] overflow-y-auto rounded-2xl p-4 backdrop-blur-xl"
              style={{ backgroundColor: "rgba(20,20,35,0.85)", border: "1px solid rgba(255,255,255,0.1)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <ScenePanel
                currentScene={currentScene}
                onSceneChange={setCurrentScene}
                currentTimeOfDay={currentTimeOfDay}
                onTimeChange={setCurrentTimeOfDay}
                autoTimeMode={autoTimeMode}
                onAutoTimeToggle={setAutoTimeMode}
              />
              <div className="mt-4 pt-3 border-t border-white/10">
                <CostumePanel
                  currentCostume={currentCostume}
                  onCostumeChange={setCurrentCostume}
                  userLevel={lifeState?.growth?.level || 1}
                  ownedPremium={commerceEngine.getUnlockedCostumes()}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col min-h-0 px-3 md:px-0 md:pr-16 lg:pr-24 md:pl-2 relative z-10">
          <div className="h-56 md:hidden flex-shrink-0" />

          {activeNav === "chat" ? (
            <>
          <div className="flex-1 overflow-y-auto py-4 pr-1">
            <div className="mb-4 px-1">
              <div className="rounded-2xl p-4 glass-purple">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{currentCharacter.avatar}</span>
                    <span className="text-sm font-medium text-white/90">{currentCharacter.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full text-white/60" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
                      Lv.{lifeState?.growth?.level || 1}
                    </span>
                  </div>
                  <div className="text-[10px] px-2 py-1 rounded-full" style={{ 
                    backgroundColor: getModeColor(lifeState?.currentMode),
                    color: "#fff"
                  }}>
                    {PERSONA_MODE_LABELS[(lifeState?.currentMode || "normal") as PersonaMode] || "正常模式"}
                  </div>
                </div>
                
                <div className="space-y-2.5">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-pink-400">❤️ 好感度</span>
                      <span className="text-white/70">{Math.round(lifeState?.persona?.affection || 50)}/100</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${lifeState?.persona?.affection || 50}%`,
                          background: "linear-gradient(90deg, #fb7185, #f472b6)"
                        }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-orange-400">💢 怨念值</span>
                      <span className="text-white/70">{Math.round(lifeState?.persona?.resentment || 0)}/100</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${lifeState?.persona?.resentment || 0}%`,
                          background: "linear-gradient(90deg, #f97316, #ef4444)"
                        }}
                      />
                    </div>
                  </div>

                  {lifeState?.relationship?.coldTreatmentActive && (
                    <div className="mt-3 p-3 rounded-xl text-center" style={{ backgroundColor: "rgba(239,68,68,0.15)" }}>
                      <p className="text-xs text-red-300 mb-2">😔 正在冷战中...</p>
                      <p className="text-[10px] text-white/50">ta现在不想理你，试着哄哄ta吧</p>
                    </div>
                  )}

                  {lifeState?.relationship?.reconciliationAvailable && (
                    <button 
                      className="w-full mt-2 py-2 rounded-xl text-xs font-medium text-white transition-all hover:opacity-90"
                      style={{ background: "linear-gradient(135deg, #8b5cf6, #ec4899)" }}
                    >
                      💝 送礼物和解
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-center mb-5">
              <div 
                className="px-3 py-1.5 rounded-lg text-[10px] text-white/30 max-w-sm text-center leading-snug"
                style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
              >
                {profile?.name || "星野"}是AI伴侣，不能替代专业心理咨询
              </div>
            </div>

            <div className="space-y-3">
              {convertedMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.sender === "lover" && (
                    <div className="flex items-end gap-2">
                      <div
                        className="max-w-[70%] px-4 py-2.5 text-sm leading-relaxed"
                        style={{
                          backgroundColor: "rgba(255,255,255,0.92)",
                          color: "#1a1a1f",
                          borderRadius: "16px 16px 16px 4px",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)",
                        }}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mb-0.5"
                        style={{ 
                          background: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
                          fontSize: "14px"
                        }}
                      >
                        {profile?.name?.[0] || "星"}
                      </div>
                    </div>
                  )}
                  {msg.sender === "user" && (
                    <div
                      className="max-w-[70%] px-4 py-2.5 text-sm leading-relaxed"
                      style={{
                        background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                        color: "#ffffff",
                        borderRadius: "16px 16px 4px 16px",
                        boxShadow: "0 1px 3px rgba(139, 92, 246, 0.2)",
                      }}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  )}
                </div>
              ))}

              {streamingMessage && (
                <div className="flex items-end gap-2 justify-start">
                  <div className="flex items-end gap-2">
                    <div
                      className="max-w-[70%] px-4 py-2.5 text-sm leading-relaxed"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.92)",
                        color: "#1a1a1f",
                        borderRadius: "16px 16px 16px 4px",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)",
                      }}
                    >
                      <p className="whitespace-pre-wrap">{streamingMessage.content}</p>
                      {!streamingMessage.done && (
                        <span className="inline-block w-1.5 h-4 ml-0.5 bg-ink-500/60 animate-pulse rounded-sm" />
                      )}
                    </div>
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mb-0.5"
                      style={{ 
                        background: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
                        fontSize: "14px"
                      }}
                    >
                      {profile?.name?.[0] || "星"}
                    </div>
                  </div>
                </div>
              )}

              {isTyping && !streamingMessage && (
                <div className="flex items-end gap-2 justify-start">
                  <div
                    className="px-4 py-3"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.92)",
                      borderRadius: "16px 16px 16px 4px",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                    }}
                  >
                    <div className="flex space-x-1.5 items-center h-3">
                      <span 
                        className="w-1.5 h-1.5 rounded-full bg-ink-400/50 animate-bounce" 
                        style={{ animationDuration: "1.4s" }} 
                      />
                      <span 
                        className="w-1.5 h-1.5 rounded-full bg-ink-400/50 animate-bounce" 
                        style={{ animationDelay: "200ms", animationDuration: "1.4s" }} 
                      />
                      <span 
                        className="w-1.5 h-1.5 rounded-full bg-ink-400/50 animate-bounce" 
                        style={{ animationDelay: "400ms", animationDuration: "1.4s" }} 
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div ref={messagesEndRef} />
          </div>

          {pendingImage && (
            <div className="relative mb-2">
              <img 
                src={pendingImage} 
                alt="待发送" 
                className="w-20 h-20 object-cover rounded-xl"
              />
              <button
                onClick={() => setPendingImage(null)}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center"
              >
                ×
              </button>
            </div>
          )}

          {showEmojiPicker && (
            <div 
              className="mb-3 p-3 rounded-xl grid grid-cols-8 gap-1"
              style={{ 
                backgroundColor: "rgba(30, 30, 40, 0.9)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {EMOJI_LIST.map((emoji, i) => (
                <button
                  key={i}
                  onClick={() => handleEmojiClick(emoji)}
                  className="w-8 h-8 flex items-center justify-center text-lg hover:bg-white/10 rounded-md transition-all"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          <div className="py-3 safe-area-bottom">
            <div
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-2xl glass-purple"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />

              <button 
                onClick={() => setShowSkills(!showSkills)}
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all hover:bg-white/10"
                style={{ backgroundColor: showSkills ? "rgba(139,92,246,0.2)" : "transparent" }}
                title="技能"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#8e8ea2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </button>

              <button 
                onClick={() => setShowGiftPanel(!showGiftPanel)}
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all hover:bg-white/10"
                style={{ backgroundColor: showGiftPanel ? "rgba(236,72,153,0.2)" : "transparent" }}
                title="礼物"
              >
                <span className="text-base">🎁</span>
              </button>

              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all hover:bg-white/10"
                style={{ backgroundColor: pendingImage ? "rgba(59,130,246,0.2)" : "transparent" }}
                title="发送图片"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#8e8ea2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </button>

              <div className="w-px h-5 mx-0.5" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} />

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入消息..."
                className="flex-1 bg-transparent text-sm text-white/90 placeholder-ink-500 outline-none py-2 px-1"
              />

              <div className="flex items-center gap-0.5 flex-shrink-0">
                <button 
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:bg-white/10"
                  style={{ backgroundColor: showEmojiPicker ? "rgba(251,191,36,0.2)" : "transparent" }}
                  title="表情"
                >
                  <span className="text-sm">😊</span>
                </button>

                <button 
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:bg-white/10"
                  style={{ backgroundColor: voiceEnabled ? "rgba(34,197,94,0.2)" : "transparent" }}
                  title={voiceEnabled ? "语音已开启" : "语音已关闭"}
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke={voiceEnabled ? "#22c55e" : "#8e8ea2"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                  </svg>
                </button>

                <button 
                  onClick={handleMicToggle}
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:bg-white/10"
                  style={{ 
                    backgroundColor: micActive ? "rgba(239,68,68,0.2)" : "transparent",
                  }}
                  title="语音输入"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke={micActive ? "#ef4444" : "#8e8ea2"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                </button>

                <div className="w-px h-5 mx-0.5" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} />

                <button
                  onClick={handleSend}
                  disabled={!input.trim() && !pendingImage}
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all hover:scale-105 disabled:opacity-40 disabled:hover:scale-100 touch-feedback"
                  style={{
                    background: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
                    boxShadow: "0 2px 8px rgba(139,92,246,0.3)",
                  }}
                  title="发送"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          </>
        ) : (
            <DiaryPage
              characterName={currentCharacter.name}
              onGenerateDiary={generateDiary}
            />
          )}
        </div>
      </div>

      {/* 语音通话界面 */}
      {isInCall && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center glass-strong">
          <div className="text-center flex-1 flex flex-col items-center justify-center">
            <div className="relative w-32 h-32 mb-8">
              {callPhase === "calling" && (
                <>
                  <div className="absolute inset-0 rounded-full animate-ping" style={{ background: "rgba(139,92,246,0.2)" }} />
                  <div className="absolute inset-0 rounded-full animate-ping" style={{ background: "rgba(236,72,153,0.15)", animationDelay: "0.5s" }} />
                </>
              )}
              <div className="relative w-32 h-32 rounded-2xl flex items-center justify-center text-5xl"
                   style={{
                     background: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
                     boxShadow: "0 8px 32px rgba(139,92,246,0.3)",
                   }}>
                {profile?.gender === "male" ? "👨" : "👩"}
              </div>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">{profile?.name || "小春"}</h2>
            <p className="text-ink-400 text-sm mb-6">
              {callPhase === "calling" && "正在呼叫..."}
              {callPhase === "connected" && `${formatCallDuration(callDuration)}`}
              {callPhase === "ended" && "通话已结束"}
            </p>

            {callPhase === "connected" && (
              <div className="flex items-center gap-2 mb-8 px-3 py-1.5 rounded-full" style={{ backgroundColor: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-400 text-xs">语音已连接</span>
              </div>
            )}
          </div>

          <div className="pb-16 flex items-center gap-8">
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all hover:bg-white/10"
              style={{ 
                backgroundColor: voiceEnabled ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={voiceEnabled ? "#22c55e" : "#8e8ea2"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {voiceEnabled ? (
                  <>
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                  </>
                ) : (
                  <>
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <line x1="23" y1="9" x2="17" y2="15" />
                    <line x1="17" y1="9" x2="23" y2="15" />
                  </>
                )}
              </svg>
            </button>

            <button
              onClick={endCall}
              className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all hover:scale-105"
              style={{ 
                backgroundColor: "#ef4444",
                boxShadow: "0 8px 24px rgba(239, 68, 68, 0.35)",
              }}
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                   style={{ transform: "rotate(135deg)" }}>
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </button>

            <button
              onClick={handleMicToggle}
              className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all hover:bg-white/10"
              style={{ 
                backgroundColor: micActive ? "rgba(239, 68, 68, 0.15)" : "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={micActive ? "#ef4444" : "#8e8ea2"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {showSkills && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowSkills(false)}
          />
          <div 
            className="fixed bottom-0 left-0 right-0 md:bottom-auto md:left-auto md:right-0 md:top-auto md:bottom-24 md:w-80 z-50 md:mr-28 rounded-t-2xl md:rounded-xl glass-strong overflow-y-auto max-h-[60vh] md:max-h-[70vh] animate-slide-up"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <h2 className="text-sm font-semibold text-white">技能</h2>
              <button 
                onClick={() => setShowSkills(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-400 hover:text-white hover:bg-white/5 transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            <div className="p-3 space-y-1.5">
              {skills.map((skill) => (
                <button
                  key={skill.id}
                  onClick={() => handleSkillClick(skill.id, skill.triggers[0])}
                  className="w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all hover:bg-white/5 card"
                >
                  <span className="text-2xl">{skill.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{skill.name}</p>
                    <p className="text-xs text-white/50 mt-0.5 truncate">{skill.description}</p>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.3">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              ))}

              {skills.length === 0 && (
                <p className="text-center text-white/30 text-sm py-8">技能加载中...</p>
              )}
            </div>
          </div>
        </>
      )}

      {showGiftPanel && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowGiftPanel(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 md:bottom-auto md:left-1/2 md:-translate-x-1/2 md:top-[50%] md:-translate-y-1/2 md:w-[90%] md:max-w-md z-50 rounded-t-2xl md:rounded-xl overflow-y-auto max-h-[85vh] glass-strong animate-slide-up">
            <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(236,72,153,0.15))", border: "1px solid rgba(139,92,246,0.3)" }}>
                  🎁
                </div>
                <h2 className="text-base font-semibold text-white">礼物中心</h2>
                <span className="px-2.5 py-1 rounded-lg text-xs font-medium" style={{ background: "linear-gradient(135deg, rgba(251,191,36,0.15), rgba(245,158,11,0.1))", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.25)" }}>
                  💰 {coinBalance}
                </span>
              </div>
              <button
                onClick={() => setShowGiftPanel(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:text-white hover:bg-white/5 transition-all"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            <div className="flex border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              {[
                { id: "shop", label: "商店", icon: "🏪" },
                { id: "inventory", label: "背包", icon: "🎒" },
                { id: "wishlist", label: "心愿单", icon: "💫" },
                { id: "requests", label: "索取", icon: "📩" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setGiftTab(tab.id as any)}
                  className={`flex-1 py-3 text-xs font-medium transition-all relative ${
                    giftTab === tab.id ? "text-white" : "text-ink-400"
                  }`}
                >
                  {tab.icon} {tab.label}
                  {giftTab === tab.id && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full" style={{ background: "linear-gradient(135deg, #8b5cf6, #ec4899)" }} />
                  )}
                </button>
              ))}
            </div>

            <div className="p-4 space-y-3">
              {giftTab === "shop" && (
                <>
                  <div className="grid grid-cols-2 gap-2.5">
                    {agent?.getAvailableGifts().slice(0, 6).map((gift: Gift) => (
                      <button
                        key={gift.id}
                        onClick={() => {
                          if (coinBalance >= gift.price) {
                            agent?.buyGift(gift.id, 1);
                            setCoinBalance(agent?.getCoinBalance() || 0);
                          }
                        }}
                        className="p-3 rounded-xl text-center transition-all active:scale-95"
                        style={{
                          background: coinBalance >= gift.price
                            ? "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(236,72,153,0.04))"
                            : "rgba(30,30,40,0.4)",
                          border: `1px solid ${coinBalance >= gift.price ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.04)"}`,
                          opacity: coinBalance >= gift.price ? 1 : 0.5,
                        }}
                      >
                        <span className="text-3xl">{gift.icon}</span>
                        <p className="text-xs font-medium text-white mt-1.5">{gift.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#fbbf24" }}>💰 {gift.price}</p>
                      </button>
                    ))}
                  </div>
                  <p className="text-center text-ink-500 text-xs mt-2">点击礼物购买，发送时说「送礼物」即可赠送给 TA</p>
                </>
              )}

              {giftTab === "inventory" && (
                <>
                  {agent?.getUserGifts().map(({ gift, userGift }: any) => (
                    <div key={gift.id} className="flex items-center gap-3 p-3 rounded-xl card">
                      <div className="w-11 h-11 rounded-lg flex items-center justify-center text-2xl flex-shrink-0" style={{ background: "rgba(255,255,255,0.03)" }}>
                        {gift.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{gift.name}</p>
                        <p className="text-xs text-ink-400 mt-0.5">剩余 {userGift.quantity} 个</p>
                      </div>
                      <button
                        onClick={() => {
                          const result = agent?.sendGift(gift.id);
                          if (result?.success) {
                            setCoinBalance(agent?.getCoinBalance() || 0);
                            setTimeout(() => setGiftTab("inventory"), 500);
                            const happyMotion = getRandomMotionForMood("happy", currentCharacter.model);
                            live2dRef.current?.playMotion(happyMotion);
                            live2dRef.current?.setExpression(getExpressionForMood("happy", currentCharacter.model));
                          }
                        }}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-white btn-primary"
                      >
                        赠送
                      </button>
                    </div>
                  ))}
                  {(!agent?.getUserGifts() || agent.getUserGifts().length === 0) && (
                    <div className="flex flex-col items-center justify-center py-10">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-3 opacity-60" style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.1), rgba(236,72,153,0.05))" }}>
                        🎒
                      </div>
                      <p className="text-ink-500 text-sm">背包空空如也</p>
                      <p className="text-ink-600 text-xs mt-1">去商店逛逛吧～</p>
                    </div>
                  )}
                </>
              )}

              {giftTab === "wishlist" && (
                <>
                  {agent?.getWishList().map(({ gift, wish }: any) => (
                    <div key={wish.id} className="flex items-center gap-3 p-3 rounded-xl card">
                      <div className="w-11 h-11 rounded-lg flex items-center justify-center text-2xl flex-shrink-0" style={{ background: "rgba(255,255,255,0.03)" }}>
                        {gift.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{gift.name}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-xs text-ink-400">优先级</span>
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <div key={i} className="w-1 h-1 rounded-full" style={{ background: i < wish.priority ? "#ec4899" : "rgba(255,255,255,0.1)" }} />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!agent?.getWishList() || agent.getWishList().length === 0) && (
                    <div className="flex flex-col items-center justify-center py-10">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-3 opacity-60" style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.1), rgba(236,72,153,0.05))" }}>
                        💫
                      </div>
                      <p className="text-ink-500 text-sm">心愿单还空着</p>
                      <p className="text-ink-600 text-xs mt-1">告诉 TA 你想要什么</p>
                    </div>
                  )}
                </>
              )}

              {giftTab === "requests" && (
                <>
                  {(agent?.getPendingGiftRequests() || []).map((request: GiftRequest) => (
                    <div key={request.id} className="p-3.5 rounded-xl" style={{
                      background: request.urgency === "high"
                        ? "linear-gradient(135deg, rgba(239,68,68,0.12), rgba(239,68,68,0.04))"
                        : "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(236,72,153,0.04))",
                      border: `1px solid ${request.urgency === "high" ? "rgba(239,68,68,0.25)" : "rgba(139,92,246,0.2)"}`,
                    }}>
                      <p className="text-sm text-white mb-3">💭 {request.message}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            agent?.fulfillGiftRequest(request.id);
                            setCoinBalance(agent?.getCoinBalance() || 0);
                          }}
                          className="flex-1 py-2 rounded-lg text-xs font-medium text-white btn-primary"
                        >
                          💝 送礼物
                        </button>
                        <button
                          onClick={() => {
                            agent?.getGiftSystem().rejectGiftRequest(request.id);
                          }}
                          className="px-4 py-2 rounded-lg text-xs text-ink-400 hover:text-white btn-secondary"
                        >
                          拒绝
                        </button>
                      </div>
                    </div>
                  ))}
                  {(!agent?.getPendingGiftRequests() || agent.getPendingGiftRequests().length === 0) && (
                    <div className="flex flex-col items-center justify-center py-10">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-3 opacity-60" style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.1), rgba(236,72,153,0.05))" }}>
                        📩
                      </div>
                      <p className="text-ink-500 text-sm">暂无礼物索取请求</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}

      {showSettings && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowSettings(false)}
          />
          <div
            className="fixed top-0 right-0 bottom-0 z-50 w-[90%] max-w-sm overflow-hidden flex flex-col glass-strong safe-area-top animate-slide-up"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <h2 className="text-base font-semibold text-white">设置</h2>
              <button 
                onClick={() => setShowSettings(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:text-white hover:bg-white/5 transition-all"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b flex-shrink-0 overflow-x-auto px-2" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              {[
                { id: "profile", icon: "👤", label: "资料" },
                { id: "character", icon: "🎭", label: "角色" },
                { id: "voice", icon: "🔊", label: "声音" },
                { id: "shop", icon: "🛍️", label: "商城" },
                { id: "data", icon: "💾", label: "数据" },
                { id: "about", icon: "ℹ️", label: "关于" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSettingsTab(tab.id as any)}
                  className={`flex-1 min-w-[60px] py-3 text-xs font-medium transition-all flex flex-col items-center gap-1 relative ${
                    settingsTab === tab.id ? "text-white" : "text-ink-400"
                  }`}
                >
                  <span className="text-sm">{tab.icon}</span>
                  {tab.label}
                  {settingsTab === tab.id && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full" style={{ background: "linear-gradient(135deg, #8b5cf6, #ec4899)" }} />
                  )}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              
              {/* ========== 个人资料 ========== */}
              {settingsTab === "profile" && (
                <div className="space-y-5">
                  {/* 角色信息卡片 */}
                  <div className="relative overflow-hidden rounded-xl p-5" style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)" }}>
                    <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20 -mr-10 -mt-10" style={{ background: "radial-gradient(circle, #fff 0%, transparent 70%)" }} />
                    <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full opacity-10 -ml-8 -mb-8" style={{ background: "radial-gradient(circle, #fff 0%, transparent 70%)" }} />
                    <div className="relative flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl border border-white/20">
                        {profile?.gender === "male" ? "👨" : "👩"}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-semibold text-lg">{profile?.name || "星野"}</p>
                        <p className="text-white/70 text-xs mt-0.5">Lv.{lifeState?.growth?.level || 1} · {profile?.nickname || "小可爱"}</p>
                      </div>
                    </div>
                  </div>

                  {/* 属性进度 */}
                  <div className="space-y-3">
                    <h3 className="text-xs text-ink-400 font-medium px-1">关系状态</h3>
                    
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div className="flex justify-between text-xs mb-2">
                          <span className="text-ink-300">好感度</span>
                          <span className="text-ink-400">{Math.round(lifeState?.persona?.affection || 50)}/100</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${lifeState?.persona?.affection || 50}%`, background: "linear-gradient(90deg, #ec4899, #f472b6)" }} />
                        </div>
                      </div>
                      
                      <div className="p-3 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div className="flex justify-between text-xs mb-2">
                          <span className="text-ink-300">怨念值</span>
                          <span className="text-ink-400">{Math.round(lifeState?.persona?.resentment || 0)}/100</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${lifeState?.persona?.resentment || 0}%`, background: "linear-gradient(90deg, #f97316, #ef4444)" }} />
                        </div>
                      </div>
                      
                      <div className="p-3 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div className="flex justify-between text-xs mb-2">
                          <span className="text-ink-300">亲密度</span>
                          <span className="text-ink-400">{Math.round(lifeState?.relationship?.intimacy || 30)}/100</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${lifeState?.relationship?.intimacy || 30}%`, background: "linear-gradient(90deg, #3b82f6, #22d3ee)" }} />
                        </div>
                      </div>
                      
                      <div className="p-3 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div className="flex justify-between text-xs mb-2">
                          <span className="text-ink-300">信任度</span>
                          <span className="text-ink-400">{Math.round(lifeState?.relationship?.trust || 30)}/100</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${lifeState?.relationship?.trust || 30}%`, background: "linear-gradient(90deg, #22c55e, #10b981)" }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 人格模式 */}
                  <div className="space-y-3">
                    <h3 className="text-xs text-white/40 font-medium">当前模式</h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1.5 rounded-full text-xs" style={{ backgroundColor: getModeColor(lifeState?.currentMode), color: "#fff" }}>
                        {PERSONA_MODE_LABELS[(lifeState?.currentMode || "normal") as PersonaMode] || "正常模式"}
                      </span>
                      <span className="px-3 py-1.5 rounded-full text-xs" style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "#fff" }}>
                        🔥 连续 {lifeState?.relationship?.streakDays || 1} 天
                      </span>
                    </div>
                  </div>

                  {/* 成长数据 */}
                  <div className="space-y-3">
                    <h3 className="text-xs text-white/40 font-medium">成长数据</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 rounded-xl text-center" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
                        <p className="text-xl font-bold text-white">{lifeState?.growth?.level || 1}</p>
                        <p className="text-xs text-white/40">等级</p>
                      </div>
                      <div className="p-3 rounded-xl text-center" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
                        <p className="text-xl font-bold text-white">{lifeState?.growth?.experience || 0}</p>
                        <p className="text-xs text-white/40">经验值</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}


              {/* ========== 角色选择 ========== */}
              {settingsTab === "character" && (
                <div className="space-y-5">
                  <p className="text-xs text-white/50 leading-relaxed">
                    选择你的专属角色，每个角色拥有独特的性格和对话风格。
                  </p>

                  {/* 角色列表 */}
                  <div className="space-y-3">
                    <h3 className="text-xs text-white/40 font-medium">👩 女角色</h3>
                    {FEMALE_CHARACTERS.map((char) => (
                      <button
                        key={char.id}
                        onClick={() => handleCharacterSwitch(char.id)}
                        className={`w-full p-4 rounded-2xl text-left transition-all touch-feedback ${
                          selectedCharacterId === char.id
                            ? "glass-purple-strong"
                            : "glass hover:bg-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                            style={{
                              background: `linear-gradient(135deg, ${char.accentColor}40, ${char.secondaryColor}30)`,
                              border: `1px solid ${char.accentColor}40`,
                            }}
                          >
                            👩
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-white">{char.name}</p>
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full text-white/60" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                                {char.mbti}
                              </span>
                              {selectedCharacterId === char.id && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full text-white font-medium" style={{ background: "linear-gradient(135deg, #8b5cf6, #ec4899)" }}>
                                  当前
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-white/40 mt-0.5 truncate">{char.persona.slice(0, 40)}...</p>
                            <div className="flex gap-1.5 mt-1.5">
                              <span className="text-[10px] px-1.5 py-0.5 rounded text-white/50" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
                                傲娇 {Math.round(char.tsundereLevel * 100)}%
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded text-white/50" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
                                {char.age}岁
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-xs text-white/40 font-medium">👨 男角色</h3>
                    {MALE_CHARACTERS.map((char) => (
                      <button
                        key={char.id}
                        onClick={() => handleCharacterSwitch(char.id)}
                        className={`w-full p-4 rounded-2xl text-left transition-all touch-feedback ${
                          selectedCharacterId === char.id
                            ? "glass-purple-strong"
                            : "glass hover:bg-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                            style={{
                              background: `linear-gradient(135deg, ${char.accentColor}40, ${char.secondaryColor}30)`,
                              border: `1px solid ${char.accentColor}40`,
                            }}
                          >
                            👨
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-white">{char.name}</p>
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full text-white/60" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                                {char.mbti}
                              </span>
                              {selectedCharacterId === char.id && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full text-white font-medium" style={{ background: "linear-gradient(135deg, #8b5cf6, #ec4899)" }}>
                                  当前
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-white/40 mt-0.5 truncate">{char.persona.slice(0, 40)}...</p>
                            <div className="flex gap-1.5 mt-1.5">
                              <span className="text-[10px] px-1.5 py-0.5 rounded text-white/50" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
                                傲娇 {Math.round(char.tsundereLevel * 100)}%
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded text-white/50" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
                                {char.age}岁
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* 模型选择 */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs text-white/40 font-medium">🎨 Live2D 模型</h3>
                      <button
                        onClick={() => setShowModelSelector(!showModelSelector)}
                        className="text-xs text-brand-400 hover:text-brand-300 transition-colors touch-feedback px-2 py-1"
                      >
                        {showModelSelector ? "收起" : "展开全部"}
                      </button>
                    </div>

                    {showModelSelector && (
                      <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                        {BUILTIN_MODELS.map((model) => (
                          <button
                            key={model.name}
                            onClick={() => saveModelSelection(model.name)}
                            className={`p-2.5 rounded-xl text-center transition-all touch-feedback ${
                              activeModelName === model.name
                                ? "glass-purple-strong"
                                : "glass hover:bg-white/5"
                            }`}
                          >
                            <div
                              className="w-10 h-10 mx-auto rounded-lg flex items-center justify-center text-lg mb-1"
                              style={{
                                background: activeModelName === model.name
                                  ? "linear-gradient(135deg, rgba(139,92,246,0.3), rgba(236,72,153,0.2))"
                                  : "rgba(255,255,255,0.05)",
                              }}
                            >
                              {activeModelName === model.name ? "✨" : "🎭"}
                            </div>
                            <p className="text-[10px] text-white/70 truncate">{model.name}</p>
                          </button>
                        ))}
                      </div>
                    )}

                    {!showModelSelector && (
                      <div
                        className="p-3 rounded-xl flex items-center gap-3 glass cursor-pointer touch-feedback"
                        onClick={() => setShowModelSelector(true)}
                      >
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                          style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(236,72,153,0.1))" }}
                        >
                          🎭
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-white/80">{activeModelName}</p>
                          <p className="text-xs text-white/40">点击选择其他模型</p>
                        </div>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" opacity="0.3">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              )}


              {/* ========== 声音设置 ========== */}
              {settingsTab === "voice" && (
                <div className="space-y-4">
                  <p className="text-xs text-white/50 leading-relaxed">
                    配置语音合成和语音识别功能，实现更自然的对话体验。
                  </p>

                  {/* 开关设置 */}
                  <div className="space-y-3">
                    <div 
                      className="flex items-center justify-between py-2.5 px-3.5 rounded-xl"
                      style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                    >
                      <div>
                        <p className="text-sm text-white/80">🔊 语音合成 (TTS)</p>
                        <p className="text-xs text-white/40">自动朗读回复内容</p>
                      </div>
                      <button 
                        onClick={() => setTtsEnabled(!ttsEnabled)}
                        className="w-11 h-6 rounded-full relative transition-colors"
                        style={{ backgroundColor: ttsEnabled ? "#4ade80" : "rgba(255,255,255,0.15)" }}
                      >
                        <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all" style={{ left: ttsEnabled ? "22px" : "2px" }} />
                      </button>
                    </div>

                    <div 
                      className="flex items-center justify-between py-2.5 px-3.5 rounded-xl"
                      style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                    >
                      <div>
                        <p className="text-sm text-white/80">🎤 语音识别 (ASR)</p>
                        <p className="text-xs text-white/40">支持语音输入消息</p>
                      </div>
                      <button 
                        onClick={() => setAsrEnabled(!asrEnabled)}
                        className="w-11 h-6 rounded-full relative transition-colors"
                        style={{ backgroundColor: asrEnabled ? "#4ade80" : "rgba(255,255,255,0.15)" }}
                      >
                        <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all" style={{ left: asrEnabled ? "22px" : "2px" }} />
                      </button>
                    </div>
                  </div>

                  {/* 音量滑块 */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <h3 className="text-xs text-white/40 font-medium">🔊 音量</h3>
                      <span className="text-xs text-white/40">{voiceVolume}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={voiceVolume}
                      onChange={(e) => setVoiceVolume(Number(e.target.value))}
                      onMouseUp={saveVoiceSettings}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer"
                      style={{ background: `linear-gradient(to right, #8b5cf6 ${voiceVolume}%, rgba(255,255,255,0.15) ${voiceVolume}%)` }}
                    />
                  </div>

                  {/* 语速滑块 */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <h3 className="text-xs text-white/40 font-medium">⚡ 语速</h3>
                      <span className="text-xs text-white/40">{voiceSpeed}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={voiceSpeed}
                      onChange={(e) => setVoiceSpeed(Number(e.target.value))}
                      onMouseUp={saveVoiceSettings}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer"
                      style={{ background: `linear-gradient(to right, #ec4899 ${(voiceSpeed - 0.5) * 66.67}%, rgba(255,255,255,0.15) ${(voiceSpeed - 0.5) * 66.67}%)` }}
                    />
                  </div>

                </div>
              )}

              {/* ========== 商城与会员 ========== */}
              {settingsTab === "shop" && (
                <CommercePanel />
              )}

              {/* ========== 数据管理 ========== */}
              {settingsTab === "data" && (
                <div className="space-y-4">
                  <p className="text-xs text-white/50 leading-relaxed">
                    管理和备份你的数据，包括对话历史、成长进度和关系状态。
                  </p>

                  {/* 存储使用 */}
                  <div className="p-4 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-white/80">存储使用</span>
                      <span className="text-xs text-white/40">约 128 KB / 5 MB</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
                      <div className="h-full rounded-full bg-purple-500" style={{ width: "2.5%" }} />
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="space-y-2">
                    <button
                      onClick={exportData}
                      className="w-full py-3 rounded-xl text-sm font-medium text-white text-left px-4 transition-all hover:bg-white/5"
                      style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                    >
                      📤 导出数据
                    </button>

                    <button
                      onClick={() => setShowDataConfirm("import")}
                      className="w-full py-3 rounded-xl text-sm font-medium text-white text-left px-4 transition-all hover:bg-white/5"
                      style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                    >
                      📥 导入数据
                    </button>

                    <button
                      onClick={() => setShowDataConfirm("reset")}
                      className="w-full py-3 rounded-xl text-sm font-medium text-orange-400 text-left px-4 transition-all hover:bg-orange-500/10"
                      style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                    >
                      🔄 重置所有数据
                    </button>
                  </div>

                  {/* 确认弹窗 */}
                  {showDataConfirm === "reset" && (
                    <div className="p-4 rounded-xl border border-red-500/30" style={{ backgroundColor: "rgba(239,68,68,0.1)" }}>
                      <p className="text-sm text-white/80 mb-3">确定要清除所有数据吗？这将删除：</p>
                      <ul className="text-xs text-white/50 mb-3 space-y-1 list-disc list-inside">
                        <li>对话历史</li>
                        <li>成长进度</li>
                        <li>关系状态</li>
                        <li>所有设置</li>
                      </ul>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowDataConfirm(null)}
                          className="flex-1 py-2 rounded-lg text-xs font-medium text-white"
                          style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                        >
                          取消
                        </button>
                        <button
                          onClick={clearAllData}
                          className="flex-1 py-2 rounded-lg text-xs font-medium text-white"
                          style={{ backgroundColor: "#ef4444" }}
                        >
                          确认清除
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ========== 关于 ========== */}
              {settingsTab === "about" && (
                <div className="space-y-4">
                  <div className="text-center py-4">
                    <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center text-4xl mb-4" style={{ background: "linear-gradient(135deg, #8b5cf6, #ec4899)" }}>
                      ✨
                    </div>
                    <h2 className="text-xl font-bold text-white">星野</h2>
                    <p className="text-sm text-white/50 mt-1">LifeOS v2.0.0</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between py-2 px-3 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
                      <span className="text-sm text-white/60">技术框架</span>
                      <span className="text-sm text-white/40">Next.js 14.2</span>
                    </div>
                    <div className="flex justify-between py-2 px-3 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
                      <span className="text-sm text-white/60">渲染引擎</span>
                      <span className="text-sm text-white/40">Pixi.js + Live2D</span>
                    </div>
                    <div className="flex justify-between py-2 px-3 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
                      <span className="text-sm text-white/60">AI 模型</span>
                      <span className="text-sm text-white/40">{llmProvider === "mock" ? "模拟模式" : llmProvider}</span>
                    </div>
                  </div>

                  <div className="pt-4 text-center">
                    <p className="text-xs text-white/30">
                      © 2024 星野 LifeOS<br />
                      数字生命引擎驱动
                    </p>
                  </div>

                  <button className="w-full py-3 rounded-xl text-sm font-medium text-red-400 mt-4" style={{ backgroundColor: "rgba(239,68,68,0.1)" }}>
                    退出登录
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <nav
        className="md:hidden flex-shrink-0 px-4 py-2 safe-area-bottom"
        style={{
          backgroundColor: "rgba(18,18,26,0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <div className="flex justify-around items-center">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`flex flex-col items-center gap-0.5 py-1 px-6 transition-colors touch-feedback ${activeNav === item.id ? "text-white" : "text-white/40"}`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-[11px]">{item.label}</span>
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
