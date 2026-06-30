import { useState, useEffect, useRef, useCallback } from "react";
import {
  DigitalLifeAgent,
  ChatMessage,
  EmotionState,
  MoodType,
  Gender,
  CharacterProfile,
  FEMALE_CHARACTERS,
  MALE_CHARACTERS,
  generateName,
  generateNickname,
  PersonaMode,
} from "@/lib/core/digital-life";
import type { ResponseResult, UIInstruction } from "@/lib/core/digital-life/agent";
import { getExpressionForMood, getRandomMotionForMood } from "@/lib/core/live2d-manager";
import type { Live2DPlayerRef } from "@/components/Lover/Live2DPlayer";

export interface UseCharacterAgentOptions {
  onUIInstruction?: (instruction: UIInstruction) => void;
  onExpressionChange?: (mood: MoodType) => void;
  onModeChange?: (mode: PersonaMode) => void;
  onGiftReceived?: (gift: any) => void;
  onLevelUp?: (newLevel: number) => void;
  onMilestone?: (milestone: any) => void;
  onSkillImprove?: (skill: string, result: any) => void;
  live2dRef?: React.RefObject<Live2DPlayerRef>;
}

export interface CharacterAgentState {
  personaMode: PersonaMode;
  affection: number;
  intimacy: number;
  trust: number;
  streakDays: number;
  level: number;
  experience: number;
}

export interface StreamingMessage {
  id: string;
  content: string;
  sender: "user" | "assistant";
  done: boolean;
}

export function useCharacterAgent(profile?: Partial<CharacterProfile>, options: UseCharacterAgentOptions = {}) {
  const {
    onUIInstruction,
    onExpressionChange,
    onModeChange,
    onGiftReceived,
    onLevelUp,
    onMilestone,
    onSkillImprove,
    live2dRef,
  } = options;

  const [agent, setAgent] = useState<DigitalLifeAgent | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingMessage, setStreamingMessage] = useState<StreamingMessage | null>(null);
  const [mood, setMood] = useState<EmotionState | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [relationship, setRelationship] = useState<any>(null);
  const [lifeState, setLifeState] = useState<any>(null);
  const [agentState, setAgentState] = useState<CharacterAgentState | null>(null);
  const agentRef = useRef<DigitalLifeAgent | null>(null);

  const applyUIInstructions = useCallback((instructions: UIInstruction[]) => {
    if (!instructions || instructions.length === 0) return;

    instructions.forEach((instruction) => {
      switch (instruction.type) {
        case "expression":
          {
            const moodType = instruction.payload.expression as MoodType;
            const expName = getExpressionForMood(moodType, agentRef.current?.profile?.live2dModel);
            live2dRef?.current?.setExpression(expName);
            onExpressionChange?.(moodType);
          }
          break;

        case "motion":
          {
            const motionName = instruction.payload.motion;
            live2dRef?.current?.playMotion(motionName);
          }
          break;

        case "mode_change":
          {
            const newMode = instruction.payload.newMode as PersonaMode;
            onModeChange?.(newMode);
          }
          break;

        case "gift_received":
          {
            const gift = instruction.payload.gift;
            onGiftReceived?.(gift);
            const happyMotion = getRandomMotionForMood("happy", agentRef.current?.profile?.live2dModel);
            live2dRef?.current?.playMotion(happyMotion);
            live2dRef?.current?.setExpression(getExpressionForMood("happy", agentRef.current?.profile?.live2dModel));
          }
          break;

        case "level_up":
          {
            const newLevel = instruction.payload.newLevel;
            onLevelUp?.(newLevel);
          }
          break;

        case "milestone":
          {
            const milestone = instruction.payload;
            onMilestone?.(milestone);
          }
          break;

        case "skill_improve":
          {
            const skill = instruction.payload.skill;
            const result = instruction.payload.result;
            onSkillImprove?.(skill, result);
          }
          break;
      }

      onUIInstruction?.(instruction);
    });
  }, [live2dRef, onUIInstruction, onExpressionChange, onModeChange, onGiftReceived, onLevelUp, onMilestone, onSkillImprove]);

  const updateAgentState = useCallback(() => {
    if (!agentRef.current) return;

    const state = agentRef.current.getLifeState();
    setAgentState({
      personaMode: state.currentMode,
      affection: state.persona.affection,
      intimacy: state.relationship.intimacy,
      trust: state.relationship.trust,
      streakDays: state.relationship.streakDays,
      level: state.growth.level,
      experience: state.growth.experience,
    });
  }, []);

  useEffect(() => {
    let userGender: Gender = "male";
    let characterName = "";
    let characterSurname = "";
    let characterNickname = "";
    let userNickname = "";
    let deviceFingerprint = "";

    if (typeof window !== "undefined") {
      const storedGender = localStorage.getItem("lover_user_gender") as Gender | null;
      const storedName = localStorage.getItem("lover_character_name");
      const storedSurname = localStorage.getItem("lover_character_surname");
      const storedNickname = localStorage.getItem("lover_character_nickname");
      const storedUserNickname = localStorage.getItem("lover_user_nickname");
      const storedFingerprint = localStorage.getItem("device_fingerprint");

      if (storedGender) userGender = storedGender;
      if (storedName) characterName = storedName;
      if (storedSurname) characterSurname = storedSurname;
      if (storedNickname) characterNickname = storedNickname;
      if (storedUserNickname) userNickname = storedUserNickname;
      if (storedFingerprint) deviceFingerprint = storedFingerprint;
    }

    const characterGender: Gender = userGender === "male" ? "female" : "male";
    const baseCharacter = userGender === "male"
      ? FEMALE_CHARACTERS[0]
      : MALE_CHARACTERS[0];

    if (!characterName) {
      const seed = deviceFingerprint || Date.now().toString();
      const nameInfo = generateName(characterGender, seed);
      characterName = nameInfo.givenName;
      characterSurname = nameInfo.surname;
      characterNickname = nameInfo.nickname;

      if (typeof window !== "undefined") {
        localStorage.setItem("lover_character_name", characterName);
        localStorage.setItem("lover_character_surname", characterSurname);
        localStorage.setItem("lover_character_nickname", characterNickname);
      }
    }

    if (!userNickname) {
      userNickname = generateNickname(userGender);
      if (typeof window !== "undefined") {
        localStorage.setItem("lover_user_nickname", userNickname);
      }
    }

    const fullProfile: CharacterProfile = {
      ...baseCharacter,
      ...profile,
      name: characterSurname + characterName,
      nickname: characterNickname,
      userNickname: userNickname,
    };

    const newAgent = new DigitalLifeAgent(fullProfile);
    agentRef.current = newAgent;
    setAgent(newAgent);
    setMood(newAgent.getMood());
    setRelationship(newAgent.lifeState.relationship);
    setLifeState(newAgent.getLifeState());
    updateAgentState();

    newAgent.initialize().catch(console.warn);

    const initialMood = newAgent.getMood();
    const modelName = newAgent.profile.live2dModel;
    const initialExpression = getExpressionForMood(initialMood.mood as MoodType, modelName);
    setTimeout(() => {
      live2dRef?.current?.setExpression(initialExpression);
    }, 100);

    const initialMessages: ChatMessage[] = [
      {
        id: "1",
        sender: "assistant",
        content: `${fullProfile.userNickname}，你来啦～ 等你好久了呢 🥰`,
        timestamp: Date.now() - 300000,
        emotion: newAgent.getMood(),
        personaMode: "affectionate",
      },
      {
        id: "2",
        sender: "assistant",
        content: "今天过得怎么样？有没有想我呀？",
        timestamp: Date.now() - 240000,
        emotion: newAgent.getMood(),
        personaMode: "normal",
      },
    ];
    setMessages(initialMessages);
  }, []);

  const sendMessage = useCallback(async (text: string, imageUrl?: string) => {
    if (!agentRef.current) return;

    const currentAgent = agentRef.current;
    const currentMood = currentAgent.getMood();

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      content: text,
      timestamp: Date.now(),
      emotion: currentMood,
      personaMode: "normal",
      imageUrl,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    // 创建流式消息
    const streamingId = `stream_${Date.now()}`;
    setStreamingMessage({
      id: streamingId,
      content: "",
      sender: "assistant",
      done: false,
    });

    try {
      const stream = currentAgent.streamGenerateResponse(text, imageUrl);

      for await (const chunk of stream) {
        setStreamingMessage({
          id: streamingId,
          content: chunk.partialText,
          sender: "assistant",
          done: chunk.done,
        });

        if (chunk.emotion) {
          setMood(chunk.emotion);
        }

        if (chunk.done) {
          // 流结束，将消息添加到正式消息列表
          const assistantMsg: ChatMessage = {
            id: streamingId,
            sender: "assistant",
            content: chunk.partialText,
            timestamp: Date.now(),
            emotion: chunk.emotion || currentAgent.getMood(),
            personaMode: chunk.personaMode || currentAgent.lifeState.currentMode,
          };

          setMessages((prev) => [...prev.filter(m => m.id !== streamingId), assistantMsg]);
          setStreamingMessage(null);
          setMood(currentAgent.getMood());
          setRelationship(currentAgent.lifeState.relationship);
          setLifeState(currentAgent.getLifeState());
          updateAgentState();

          // 应用 UI 指令
          const result = currentAgent.getLifeState();
          const expName = getExpressionForMood(result.emotion.mood as MoodType, currentAgent.profile.live2dModel);
          live2dRef?.current?.setExpression(expName);
        }
      }
    } catch (error) {
      console.error("Error generating streaming response:", error);
      setStreamingMessage(null);
    } finally {
      setIsTyping(false);
    }
  }, [live2dRef, updateAgentState]);

  const triggerMood = useCallback((moodType: MoodType, intensity?: number) => {
    if (!agentRef.current) return;
    agentRef.current.triggerMood(moodType, intensity);
    const newMood = agentRef.current.getMood();
    setMood(newMood);
    updateAgentState();

    const expName = getExpressionForMood(moodType, agentRef.current.profile.live2dModel);
    live2dRef?.current?.setExpression(expName);

    onExpressionChange?.(moodType);
  }, [live2dRef, updateAgentState, onExpressionChange]);

  const updateProfile = useCallback((updates: Partial<CharacterProfile>) => {
    if (!agentRef.current) return;
    agentRef.current.updateProfile(updates);
    updateAgentState();
  }, [updateAgentState]);

  const reconcile = useCallback(() => {
    if (!agentRef.current) return false;
    const success = agentRef.current.reconcile();
    if (success) {
      setRelationship(agentRef.current.lifeState.relationship);
      setLifeState(agentRef.current.getLifeState());
      updateAgentState();
    }
    return success;
  }, [updateAgentState]);

  const reset = useCallback(() => {
    if (!agentRef.current) return;
    agentRef.current.reset();
    setMood(agentRef.current.getMood());
    setRelationship(agentRef.current.lifeState.relationship);
    setLifeState(agentRef.current.getLifeState());
    updateAgentState();
    setMessages([]);
  }, [updateAgentState]);

  const getMemories = useCallback((limit?: number) => {
    if (!agentRef.current) return [];
    return agentRef.current.getMemories(limit);
  }, []);

  const getSkills = useCallback(() => {
    if (!agentRef.current) return [];
    return agentRef.current.getSkills();
  }, []);

  const getGiftStats = useCallback(() => {
    if (!agentRef.current) return null;
    return agentRef.current.getGiftStats();
  }, []);

  const getGrowthStats = useCallback(() => {
    if (!agentRef.current) return null;
    return agentRef.current.getGrowthStats();
  }, []);

  const getCausalStats = useCallback(() => {
    if (!agentRef.current) return null;
    return agentRef.current.getCausalStats();
  }, []);

  const generateDiary = useCallback(async () => {
    if (!agentRef.current) return null;
    try {
      return await agentRef.current.generateDiary();
    } catch (error) {
      console.error("Error generating diary:", error);
      return null;
    }
  }, []);

  const forceSave = useCallback(async () => {
    if (!agentRef.current) return;
    await agentRef.current.forceSave();
  }, []);

  return {
    agent,
    messages,
    streamingMessage,
    mood,
    isTyping,
    relationship,
    lifeState,
    agentState,
    sendMessage,
    triggerMood,
    updateProfile,
    reconcile,
    reset,
    getMemories,
    getSkills,
    getGiftStats,
    getGrowthStats,
    getCausalStats,
    generateDiary,
    forceSave,
    profile: agent?.profile ?? (FEMALE_CHARACTERS[0] as CharacterProfile),
  };
}
