import { MoodType, EmotionState, PersonalityTrait, RelationshipState } from "./types";

export class EmotionEngine {
  private currentEmotion: EmotionState;
  private personality: PersonalityTrait[];
  private relationship: RelationshipState;
  private emotionDecayRate: number = 0.02;

  constructor(
    initialMood: MoodType = "neutral",
    personality: PersonalityTrait[],
    relationship: RelationshipState
  ) {
    this.currentEmotion = {
      mood: initialMood,
      intensity: 0.5,
      valence: 0,
      arousal: 0,
      dominance: 0.5,
    };
    this.personality = personality;
    this.relationship = relationship;
  }

  getCurrentEmotion(): EmotionState {
    return { ...this.currentEmotion };
  }

  updateFromUserInput(input: string, context?: string): EmotionState {
    const analysis = this.analyzeInput(input);
    const personalityModifier = this.getPersonalityModifier();
    const relationshipModifier = this.getRelationshipModifier();

    let targetValence = analysis.valence * personalityModifier * relationshipModifier;
    let targetArousal = analysis.arousal * personalityModifier;

    this.currentEmotion.valence = this.lerp(this.currentEmotion.valence, targetValence, 0.3);
    this.currentEmotion.arousal = this.lerp(this.currentEmotion.arousal, targetArousal, 0.4);

    this.currentEmotion.mood = this.mapToMood(
      this.currentEmotion.valence,
      this.currentEmotion.arousal
    );
    this.currentEmotion.intensity = Math.min(
      1,
      Math.abs(this.currentEmotion.valence) + Math.abs(this.currentEmotion.arousal) * 0.5
    );
    this.currentEmotion.dominance = this.lerp(
      this.currentEmotion.dominance,
      0.5 + analysis.dominanceShift,
      0.2
    );

    return { ...this.currentEmotion };
  }

  decay(deltaTimeMs: number): void {
    const decayFactor = Math.exp(-this.emotionDecayRate * (deltaTimeMs / 1000));
    this.currentEmotion.valence *= decayFactor;
    this.currentEmotion.arousal *= decayFactor;
    this.currentEmotion.intensity *= decayFactor;

    if (Math.abs(this.currentEmotion.valence) < 0.05 && Math.abs(this.currentEmotion.arousal) < 0.05) {
      this.currentEmotion.mood = "neutral";
      this.currentEmotion.valence = 0;
      this.currentEmotion.arousal = 0;
    }
  }

  triggerMood(mood: MoodType, intensity: number = 0.8): void {
    const moodMapping: Record<MoodType, { valence: number; arousal: number }> = {
      neutral: { valence: 0, arousal: 0 },
      happy: { valence: 0.7, arousal: 0.4 },
      excited: { valence: 0.9, arousal: 0.8 },
      shy: { valence: 0.5, arousal: 0.3 },
      love: { valence: 0.95, arousal: 0.6 },
      sad: { valence: -0.7, arousal: -0.3 },
      angry: { valence: -0.6, arousal: 0.7 },
      jealous: { valence: -0.4, arousal: 0.5 },
      sleepy: { valence: 0.1, arousal: -0.6 },
      thoughtful: { valence: 0.2, arousal: -0.2 },
      playful: { valence: 0.6, arousal: 0.7 },
      surprised: { valence: 0.3, arousal: 0.9 },
    };

    const target = moodMapping[mood];
    this.currentEmotion.valence = this.lerp(this.currentEmotion.valence, target.valence * intensity, 0.6);
    this.currentEmotion.arousal = this.lerp(this.currentEmotion.arousal, target.arousal * intensity, 0.7);
    this.currentEmotion.mood = mood;
    this.currentEmotion.intensity = intensity;
  }

  private analyzeInput(input: string): { valence: number; arousal: number; dominanceShift: number } {
    const lower = input.toLowerCase();
    let valence = 0;
    let arousal = 0;
    let dominanceShift = 0;

    const positiveWords = [
      "喜欢", "爱", "想你", "开心", "快乐", "高兴", "幸福", "棒", "好",
      "love", "like", "happy", "miss you", "❤️", "💕", "💖", "💗", "💓",
      "抱抱", "亲亲", "宝贝", "亲爱的", "可爱", "漂亮", "帅",
    ];
    const negativeWords = [
      "讨厌", "生气", "难过", "伤心", "累", "烦", "不开心", "痛苦",
      "hate", "sad", "tired", "angry", "😢", "😭", "😤", "💔",
      "笨蛋", "傻瓜", "滚", "分手", "不理你",
    ];
    const arousalWords = [
      "兴奋", "激动", "惊喜", "哇", "wow", "awesome", "amazing",
      "🔥", "🎉", "✨", "⚡", "💥",
      "生气", "愤怒", "吵架", "furious", "angry",
    ];
    const submissiveWords = [
      "对不起", "抱歉", "我错了", "原谅", "求求你",
      "sorry", "please", "拜托", "请",
    ];
    const dominantWords = [
      "听我的", "必须", "应该", "服从",
      "mine", "my", "我的",
    ];

    for (const word of positiveWords) {
      if (lower.includes(word)) valence += 0.15;
    }
    for (const word of negativeWords) {
      if (lower.includes(word)) valence -= 0.2;
    }
    for (const word of arousalWords) {
      if (lower.includes(word)) arousal += 0.2;
    }
    for (const word of submissiveWords) {
      if (lower.includes(word)) dominanceShift -= 0.1;
    }
    for (const word of dominantWords) {
      if (lower.includes(word)) dominanceShift += 0.1;
    }

    if (lower.includes("?") || lower.includes("？")) arousal += 0.1;
    if (lower.includes("!") || lower.includes("！")) arousal += 0.15;

    valence = Math.max(-1, Math.min(1, valence));
    arousal = Math.max(-1, Math.min(1, arousal));
    dominanceShift = Math.max(-0.3, Math.min(0.3, dominanceShift));

    return { valence, arousal, dominanceShift };
  }

  private getPersonalityModifier(): number {
    const neuroticism = this.personality.find((t) => t.id === "neuroticism")?.value ?? 0.5;
    return 1 + (neuroticism - 0.5) * 0.4;
  }

  private getRelationshipModifier(): number {
    return 0.7 + (this.relationship.intimacy / 100) * 0.5;
  }

  private mapToMood(valence: number, arousal: number): MoodType {
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
