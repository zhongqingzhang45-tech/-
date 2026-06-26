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
} from "@/lib/core/digital-life";

export function useCharacterAgent(profile?: Partial<CharacterProfile>) {
  const [agent, setAgent] = useState<DigitalLifeAgent | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [mood, setMood] = useState<EmotionState | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [relationship, setRelationship] = useState<any>(null);
  const [lifeState, setLifeState] = useState<any>(null);
  const agentRef = useRef<DigitalLifeAgent | null>(null);

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

    newAgent.initialize().catch(console.warn);

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

    const delay = 800 + Math.random() * 1500;

    setTimeout(async () => {
      if (!agentRef.current) return;

      const result = await currentAgent.respond(text, imageUrl);

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "assistant",
        content: result.text,
        timestamp: Date.now(),
        emotion: result.emotion,
        personaMode: result.personaMode,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setMood(result.emotion);
      setRelationship(currentAgent.lifeState.relationship);
      setLifeState(currentAgent.getLifeState());
      setIsTyping(false);
    }, delay);
  }, []);

  const triggerMood = useCallback((moodType: MoodType, intensity?: number) => {
    if (!agentRef.current) return;
    agentRef.current.triggerMood(moodType, intensity);
    setMood(agentRef.current.getMood());
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
    lifeState,
    sendMessage,
    triggerMood,
    updateProfile,
    profile: agent?.profile ?? (FEMALE_CHARACTERS[0] as CharacterProfile),
  };
}
