import { useState, useEffect, useRef, useCallback } from "react";
import {
  CharacterAgent,
  ChatMessage,
  DEFAULT_CHARACTER,
  CharacterProfile,
  EmotionState,
  MoodType,
} from "@/lib/core";

export function useCharacterAgent(profile?: Partial<CharacterProfile>) {
  const [agent, setAgent] = useState<CharacterAgent | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [mood, setMood] = useState<EmotionState | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [relationship, setRelationship] = useState<any>(null);
  const agentRef = useRef<CharacterAgent | null>(null);

  useEffect(() => {
    const fullProfile = { ...DEFAULT_CHARACTER, ...profile };
    const newAgent = new CharacterAgent(fullProfile);
    agentRef.current = newAgent;
    setAgent(newAgent);
    setMood(newAgent.getMood());
    setRelationship(newAgent.relationship.getState());

    const initialMessages: ChatMessage[] = [
      {
        id: "1",
        sender: "assistant",
        content: `宝贝你来啦～ 等你好久了呢 🥰`,
        timestamp: Date.now() - 300000,
        emotion: newAgent.getMood(),
      },
      {
        id: "2",
        sender: "assistant",
        content: "今天过得怎么样？有没有想我呀？",
        timestamp: Date.now() - 240000,
        emotion: newAgent.getMood(),
      },
    ];
    setMessages(initialMessages);
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!agentRef.current) return;

    const currentAgent = agentRef.current;
    const userEmotion = currentAgent.emotionEngine.getCurrentEmotion();

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      content: text,
      timestamp: Date.now(),
      emotion: userEmotion,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    const delay = 800 + Math.random() * 1500;

    setTimeout(async () => {
      if (!agentRef.current) return;

      const result = await currentAgent.respond(text);

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "assistant",
        content: result.text,
        timestamp: Date.now(),
        emotion: result.emotion,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setMood(result.emotion);
      setRelationship(currentAgent.relationship.getState());
      setIsTyping(false);
    }, delay);
  }, []);

  const triggerMood = useCallback((mood: MoodType, intensity?: number) => {
    if (!agentRef.current) return;
    agentRef.current.emotionEngine.triggerMood(mood, intensity);
    setMood(agentRef.current.emotionEngine.getCurrentEmotion());
  }, []);

  const updateProfile = useCallback((updates: Partial<CharacterProfile>) => {
    if (!agentRef.current) return;
    agentRef.current.updateProfile(updates);
  }, []);

  return {
    agent,
    messages,
    mood,
    isTyping,
    relationship,
    sendMessage,
    triggerMood,
    updateProfile,
    profile: agent?.profile ?? DEFAULT_CHARACTER,
  };
}
