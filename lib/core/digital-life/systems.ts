import {
  LifeState,
  BodilyState,
  InstinctState,
  EmotionState,
  RelationshipState,
  GrowthState,
  ValueSystem,
  MoodType,
  CharacterProfile,
  ChatMessage,
  MemoryEntry,
  DecisionResult,
  DEFAULT_LIFE_STATE,
} from "./types";

export class EventUnderstandingLayer {
  analyzeInput(input: string, imageUrl?: string): {
    intent: string;
    sentiment: { valence: number; arousal: number };
    keywords: string[];
    hasImage: boolean;
    imageDescription?: string;
  } {
    const lower = input.toLowerCase();
    let intent = "default";
    let valence = 0;
    let arousal = 0;
    const keywords: string[] = [];

    const intents: Record<string, string[]> = {
      greeting: ["你好", "在吗", "嗨", "hi", "hello", "早", "晚安", "醒了", "来啦", "我来啦"],
      love: ["爱你", "喜欢", "love", "想你", "想念", "miss", "亲亲", "抱抱", "宝贝"],
      compliment: ["漂亮", "好看", "可爱", "帅", "美", "优秀", "厉害"],
      angry: ["生气", "讨厌", "滚", "烦", "恨", "笨蛋", "傻瓜", "去死", "分手", "不理你"],
      sad: ["难过", "伤心", "哭", "累", "不开心", "委屈", "郁闷", "sad", "tired"],
      jealous: ["吃醋", "嫉妒", "别的女生", "别的男生", "前任", "前女友", "前男友"],
      question: ["为什么", "怎么", "什么", "吗", "?", "？", "怎么看", "觉得"],
      comfort: ["安慰", "哄我", "抱抱我", "求安慰", "我好难"],
      apologize: ["对不起", "抱歉", "我错了", "原谅", "不好意思", "sorry"],
      playful: ["哈哈", "嘿嘿", "嘻嘻", "逗你", "开玩笑", "来玩", "游戏"],
      sleepy: ["困", "睡", "累了", "晚安", "sleepy", "sleep"],
      pua_test: ["你是不是不爱我了", "你变了", "你是不是烦我了", "你根本就不懂我"],
      coax: ["别生气了", "我错了", "原谅我吧", "好不好嘛", "求求你"],
    };

    for (const [intentName, patterns] of Object.entries(intents)) {
      for (const pattern of patterns) {
        if (lower.includes(pattern)) {
          intent = intentName;
          keywords.push(pattern);
          break;
        }
      }
    }

    const positiveWords = [
      "喜欢", "爱", "想你", "开心", "快乐", "高兴", "幸福", "棒", "好",
      "love", "like", "happy", "miss you", "❤️", "💕", "💖", "💗", "💓",
      "抱抱", "亲亲", "宝贝", "亲爱的", "可爱", "漂亮", "帅",
    ];
    const negativeWords = [
      "讨厌", "生气", "难过", "伤心", "累", "烦", "不开心", "痛苦",
      "hate", "sad", "tired", "angry", "😢", "😭", "😤", "💔",
      "笨蛋", "傻瓜", "滚", "分手", "不理你", "去死", "恨",
    ];

    for (const word of positiveWords) {
      if (lower.includes(word)) {
        valence += 0.15;
        arousal += 0.1;
      }
    }
    for (const word of negativeWords) {
      if (lower.includes(word)) {
        valence -= 0.2;
        arousal += 0.15;
      }
    }

    if (lower.includes("!") || lower.includes("！")) arousal += 0.15;
    if (lower.includes("?") || lower.includes("？")) arousal += 0.1;

    valence = Math.max(-1, Math.min(1, valence));
    arousal = Math.max(-1, Math.min(1, arousal));

    return {
      intent,
      sentiment: { valence, arousal },
      keywords,
      hasImage: !!imageUrl,
      imageDescription: imageUrl ? "图片内容" : undefined,
    };
  }
}

export class BodilySystem {
  state: BodilyState;

  constructor(initial: BodilyState) {
    this.state = { ...initial };
  }

  update(deltaTimeMs: number): void {
    const hours = deltaTimeMs / (1000 * 60 * 60);
    
    this.state.energy = Math.max(0, Math.min(100, this.state.energy - hours * 2));
    this.state.hunger = Math.min(100, this.state.hunger + hours * 5);
    this.state.sleepiness = Math.min(100, this.state.sleepiness + hours * 3);
  }

  getEnergyModifier(): number {
    return 0.5 + (this.state.energy / 100) * 0.5;
  }

  getMoodInfluence(): { valence: number; arousal: number } {
    let valence = 0;
    let arousal = 0;

    if (this.state.sleepiness > 70) {
      valence -= 0.2;
      arousal -= 0.4;
    }
    if (this.state.hunger > 80) {
      valence -= 0.15;
      arousal += 0.1;
    }
    if (this.state.energy < 30) {
      valence -= 0.1;
      arousal -= 0.3;
    }

    return { valence, arousal };
  }

  interact(interactionType: string): void {
    switch (interactionType) {
      case "chat":
        this.state.energy = Math.max(0, this.state.energy - 1);
        break;
      case "play":
        this.state.energy = Math.max(0, this.state.energy - 5);
        this.state.sleepiness = Math.max(0, this.state.sleepiness - 5);
        break;
      case "sleep":
        this.state.energy = Math.min(100, this.state.energy + 30);
        this.state.sleepiness = Math.max(0, this.state.sleepiness - 50);
        break;
      case "feed":
        this.state.hunger = Math.max(0, this.state.hunger - 40);
        this.state.energy = Math.min(100, this.state.energy + 10);
        break;
    }
  }
}

export class InstinctSystem {
  state: InstinctState;

  constructor(initial: InstinctState) {
    this.state = { ...initial };
  }

  update(deltaTimeMs: number): void {
    const hours = deltaTimeMs / (1000 * 60 * 60);
    
    this.state.companionshipNeed = Math.min(100, this.state.companionshipNeed + hours * 2);
    this.state.attentionNeed = Math.min(100, this.state.attentionNeed + hours * 3);
    this.state.securityNeed = Math.min(100, this.state.securityNeed + hours * 1);
    this.state.intimacyNeed = Math.min(100, this.state.intimacyNeed + hours * 1.5);
    this.state.curiosity = Math.min(100, this.state.curiosity + hours * 0.5);
  }

  satisfy(needType: keyof InstinctState, amount: number): void {
    this.state[needType] = Math.max(0, this.state[needType] - amount);
  }

  getUrgentNeeds(): { need: keyof InstinctState; urgency: number }[] {
    const needs: { need: keyof InstinctState; urgency: number }[] = [];
    
    for (const [key, value] of Object.entries(this.state) as [keyof InstinctState, number][]) {
      if (value > 60) {
        needs.push({ need: key, urgency: value });
      }
    }
    
    return needs.sort((a, b) => b.urgency - a.urgency);
  }

  getMoodInfluence(): { valence: number; arousal: number } {
    let valence = 0;
    let arousal = 0;

    const avgNeed = (this.state.companionshipNeed + this.state.attentionNeed + this.state.intimacyNeed) / 3;
    
    if (avgNeed > 80) {
      valence -= 0.3;
      arousal += 0.2;
    } else if (avgNeed > 60) {
      valence -= 0.15;
      arousal += 0.1;
    }

    return { valence, arousal };
  }
}

export class EmotionSystem {
  state: EmotionState;
  private personality: any[];
  private tsundereLevel: number;
  private puaTendency: number;

  constructor(initial: EmotionState, personality: any[], tsundereLevel: number, puaTendency: number) {
    this.state = { ...initial };
    this.personality = personality;
    this.tsundereLevel = tsundereLevel;
    this.puaTendency = puaTendency;
  }

  update(
    inputAnalysis: { sentiment: { valence: number; arousal: number }; intent: string },
    relationship: RelationshipState,
    bodilyInfluence: { valence: number; arousal: number },
    instinctInfluence: { valence: number; arousal: number }
  ): EmotionState {
    const neuroticism = this.personality.find((t) => t.id === "neuroticism")?.value ?? 0.5;
    const agreeableness = this.personality.find((t) => t.id === "agreeableness")?.value ?? 0.5;
    
    const personalityModifier = 1 + (neuroticism - 0.5) * 0.4;
    const relationshipModifier = 0.7 + (relationship.intimacy / 100) * 0.5;

    let targetValence = 
      inputAnalysis.sentiment.valence * personalityModifier * relationshipModifier +
      bodilyInfluence.valence +
      instinctInfluence.valence;
    
    let targetArousal = 
      inputAnalysis.sentiment.arousal * personalityModifier +
      bodilyInfluence.arousal +
      instinctInfluence.arousal;

    let dominanceShift = 0.5;
    if (inputAnalysis.intent === "angry" || inputAnalysis.intent === "jealous") {
      dominanceShift += 0.2;
    }
    if (inputAnalysis.intent === "apologize" || inputAnalysis.intent === "comfort") {
      dominanceShift -= 0.1;
    }

    this.state.valence = this.lerp(this.state.valence, targetValence, 0.3);
    this.state.arousal = this.lerp(this.state.arousal, targetArousal, 0.4);
    this.state.dominance = this.lerp(this.state.dominance, dominanceShift, 0.2);
    
    this.state.mood = this.mapToMood(this.state.valence, this.state.arousal, inputAnalysis.intent);
    this.state.intensity = Math.min(
      1,
      Math.abs(this.state.valence) + Math.abs(this.state.arousal) * 0.5
    );

    return { ...this.state };
  }

  triggerMood(mood: MoodType, intensity: number = 0.8): void {
    const moodMapping: Record<MoodType, { valence: number; arousal: number; dominance: number }> = {
      neutral: { valence: 0, arousal: 0, dominance: 0.5 },
      happy: { valence: 0.7, arousal: 0.4, dominance: 0.5 },
      excited: { valence: 0.9, arousal: 0.8, dominance: 0.6 },
      shy: { valence: 0.5, arousal: 0.3, dominance: 0.3 },
      love: { valence: 0.95, arousal: 0.6, dominance: 0.4 },
      sad: { valence: -0.7, arousal: -0.3, dominance: 0.3 },
      angry: { valence: -0.6, arousal: 0.7, dominance: 0.7 },
      jealous: { valence: -0.4, arousal: 0.5, dominance: 0.6 },
      sleepy: { valence: 0.1, arousal: -0.6, dominance: 0.4 },
      thoughtful: { valence: 0.2, arousal: -0.2, dominance: 0.5 },
      playful: { valence: 0.6, arousal: 0.7, dominance: 0.55 },
      surprised: { valence: 0.3, arousal: 0.9, dominance: 0.5 },
      cold: { valence: -0.2, arousal: -0.2, dominance: 0.6 },
      disdain: { valence: -0.3, arousal: -0.1, dominance: 0.7 },
      tsundere: { valence: 0.4, arousal: 0.3, dominance: 0.6 },
      coquettish: { valence: 0.5, arousal: 0.5, dominance: 0.4 },
      pua: { valence: 0.3, arousal: 0.2, dominance: 0.8 },
    };

    const target = moodMapping[mood];
    if (!target) return;

    this.state.valence = this.lerp(this.state.valence, target.valence * intensity, 0.6);
    this.state.arousal = this.lerp(this.state.arousal, target.arousal * intensity, 0.7);
    this.state.dominance = this.lerp(this.state.dominance, target.dominance, 0.5);
    this.state.mood = mood;
    this.state.intensity = intensity;
  }

  decay(deltaTimeMs: number): void {
    const decayRate = 0.02;
    const decayFactor = Math.exp(-decayRate * (deltaTimeMs / 1000));
    this.state.valence *= decayFactor;
    this.state.arousal *= decayFactor;
    this.state.intensity *= decayFactor;

    if (Math.abs(this.state.valence) < 0.05 && Math.abs(this.state.arousal) < 0.05) {
      this.state.mood = "neutral";
      this.state.valence = 0;
      this.state.arousal = 0;
    }
  }

  private mapToMood(valence: number, arousal: number, intent: string): MoodType {
    if (intent === "jealous") return "jealous";
    if (intent === "pua_test") return this.puaTendency > 0.3 ? "pua" : "sad";
    if (intent === "coax" && this.tsundereLevel > 0.5) return "tsundere";
    
    if (Math.abs(valence) < 0.15 && Math.abs(arousal) < 0.15) {
      return "neutral";
    }
    if (valence > 0.6) {
      if (arousal > 0.5) return "excited";
      if (arousal < -0.3) return "thoughtful";
      if (valence > 0.8) return "love";
      return "happy";
    }
    if (valence > 0.2) {
      if (arousal > 0.5) return "playful";
      if (arousal < 0) return "shy";
      return "happy";
    }
    if (valence < -0.4) {
      if (arousal > 0.4) return "angry";
      return "sad";
    }
    if (arousal > 0.6) return "surprised";
    if (arousal < -0.5) return "sleepy";
    return "neutral";
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }
}

export class DecisionEngine {
  private profile: CharacterProfile;
  private lifeState: LifeState;

  constructor(profile: CharacterProfile, lifeState: LifeState) {
    this.profile = profile;
    this.lifeState = lifeState;
  }

  decide(
    inputAnalysis: { intent: string; sentiment: { valence: number; arousal: number }; keywords: string[] },
    currentEmotion: EmotionState
  ): DecisionResult {
    let responseType = "default";
    let emotionTarget: MoodType = currentEmotion.mood;
    let puaLevel = 0;

    const intimacy = this.lifeState.relationship.intimacy;
    const puaTendency = this.profile.puaTendency;
    const tsundereLevel = this.profile.tsundereLevel;

    switch (inputAnalysis.intent) {
      case "greeting":
        responseType = "greeting";
        emotionTarget = intimacy > 60 ? "love" : "happy";
        break;
      case "love":
        responseType = "love";
        emotionTarget = tsundereLevel > 0.6 ? "tsundere" : "love";
        break;
      case "compliment":
        responseType = "shy";
        emotionTarget = "shy";
        break;
      case "angry":
        responseType = "angry_response";
        emotionTarget = "angry";
        break;
      case "sad":
        responseType = "comfort";
        emotionTarget = "sad";
        break;
      case "jealous":
        responseType = "jealous";
        emotionTarget = "jealous";
        break;
      case "question":
        responseType = "thoughtful";
        emotionTarget = "thoughtful";
        break;
      case "comfort":
        responseType = "touched";
        emotionTarget = "love";
        break;
      case "apologize":
        responseType = "forgive";
        if (tsundereLevel > 0.5 && currentEmotion.mood === "angry") {
          emotionTarget = "tsundere";
        } else {
          emotionTarget = "shy";
        }
        break;
      case "playful":
        responseType = "playful";
        emotionTarget = "playful";
        break;
      case "sleepy":
        responseType = "sleepy";
        emotionTarget = "sleepy";
        break;
      case "pua_test":
        if (puaTendency > 0.3) {
          responseType = "pua";
          emotionTarget = "pua";
          puaLevel = puaTendency;
        } else {
          responseType = "reassurance";
          emotionTarget = "love";
        }
        break;
      case "coax":
        if (currentEmotion.mood === "angry") {
          responseType = "being_coaxed";
          emotionTarget = tsundereLevel > 0.5 ? "tsundere" : "shy";
        } else {
          responseType = "happy";
          emotionTarget = "happy";
        }
        break;
      default:
        responseType = "default";
        emotionTarget = "happy";
    }

    const urgentNeeds = this.getUrgentInstinctNeeds();
    let shouldInitiate = false;
    let actionPlan: string[] = [];

    if (urgentNeeds.length > 0 && Math.random() < 0.3) {
      shouldInitiate = true;
      const topNeed = urgentNeeds[0];
      actionPlan = this.getInitiativeActions(topNeed.need);
    }

    return {
      responseType,
      actionPlan,
      emotionTarget,
      shouldInitiate,
      puaLevel,
    };
  }

  private getUrgentInstinctNeeds(): { need: string; urgency: number }[] {
    const needs = [];
    if (this.lifeState.instinct.companionshipNeed > 70) {
      needs.push({ need: "companionship", urgency: this.lifeState.instinct.companionshipNeed });
    }
    if (this.lifeState.instinct.attentionNeed > 75) {
      needs.push({ need: "attention", urgency: this.lifeState.instinct.attentionNeed });
    }
    if (this.lifeState.instinct.intimacyNeed > 65) {
      needs.push({ need: "intimacy", urgency: this.lifeState.instinct.intimacyNeed });
    }
    return needs.sort((a, b) => b.urgency - a.urgency);
  }

  private getInitiativeActions(needType: string): string[] {
    const actions: Record<string, string[]> = {
      companionship: ["主动找话题聊天", "问对方在干嘛", "说想对方了"],
      attention: ["撒娇求关注", "分享有趣的事", "发小脾气引起注意"],
      intimacy: ["说情话", "要抱抱", "聊暧昧话题"],
    };
    return actions[needType] || [];
  }
}
