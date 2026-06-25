import {
  EmotionState, MoodType, BodilyState, InstinctState, PersonaMatrix, RelationshipState, DecisionResult, TriggerState, MoodLogEntry, BehaviorTag, MemoryEntry, MemoryType, LifeState, CharacterProfile, MOOD_CONFIG } from "./types";

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

export class EventUnderstandingLayer {
  analyze(userInput: string, imageUrl?: string) {
    const lower = userInput.toLowerCase();
    const keywords: string[] = [];

    const keywordCategories: Record<string, string[]> = {
      apology: ["对不起", "抱歉", "我错了", "原谅", "道歉", "sorry", "apologize"],
      compliment: ["好看", "可爱", "漂亮", "帅", "聪明", "喜欢", "爱你", "love"],
      ignore: ["很忙", "没时间", "以后再说", "等等", "忙", "ignore"],
      jealousy: ["别的女生", "别的男生", "别人", "前女友", "前男友", "其他"],
      clingy: ["好想你", "想你了", "你在哪", "你在干嘛", "陪陪我"],
      rejection: ["不要", "不想", "不喜欢", "讨厌", "拒绝"],
      sarcasm: ["呵呵", "行吧", "随便", "都行", "你说了算"],
      affectionate: ["抱抱", "亲亲", "摸头", "牵手", "想抱着你"],
      question: ["吗？", "为什么", "怎么", "什么", "?", "？"],
    };

    for (const [category, words] of Object.entries(keywordCategories)) {
      if (words.some((w) => lower.includes(w))) {
        keywords.push(category);
      }
    }

    let valence = 0;
    let arousal = 0.3;
    let dominantIntent = "casual_chat";

    if (keywords.includes("apology")) { valence += 0.3; dominantIntent = "apology"; arousal = 0.6; }
    if (keywords.includes("compliment")) { valence += 0.4; dominantIntent = "compliment"; arousal = 0.5; }
    if (keywords.includes("ignore")) { valence -= 0.4; dominantIntent = "ignored"; arousal = 0.3; }
    if (keywords.includes("jealousy")) { valence -= 0.6; dominantIntent = "jealousy_trigger"; arousal = 0.8; }
    if (keywords.includes("clingy")) { valence += 0.2; dominantIntent = "affection_seeking"; arousal = 0.4; }
    if (keywords.includes("rejection")) { valence -= 0.3; dominantIntent = "rejection"; arousal = 0.5; }
    if (keywords.includes("sarcasm")) { valence -= 0.2; dominantIntent = "sarcasm"; arousal = 0.4; }
    if (keywords.includes("affectionate")) { valence += 0.5; dominantIntent = "affection"; arousal = 0.6; }
    if (keywords.includes("question")) { dominantIntent = "question"; arousal = 0.3; }

    if (imageUrl) {
      arousal += 0.2;
      dominantIntent = "image_sharing";
    }

    if (userInput.length > 100) { arousal += 0.2; }

    valence = Math.max(-1, Math.min(1, valence));
    arousal = Math.max(0, Math.min(1, arousal));

    const dominant = 0.5 + (valence > 0 ? 0.1 : -0.1);

    return {
      sentiment: { valence, arousal, dominance: dominant },
      intent: dominantIntent,
      keywords,
      hasImage: !!imageUrl,
      messageLength: userInput.length,
    };
  }

  detectBehaviorTags(userInput: string, history: any[]): BehaviorTag[] {
    const tags: BehaviorTag[] = [];
    const lower = userInput.toLowerCase();

    if (lower.includes("我不行") || lower.includes("我好没用") || lower.includes("我配不上")) tags.push("self_abased");
    if (lower.includes("你会不会离开我") || lower.includes("你不爱我了") || lower.includes("别离开我")) tags.push("insecure");
    if (lower.includes("我一直") && lower.length > 50) tags.push("clingy");
    if (lower.includes("我自己") || lower.includes("不用管我") || lower.includes("我没事")) tags.push("independent");
    if (lower.includes("真的不骗你") || lower.includes("骗你我是")) tags.push("lying");

    return [...new Set(tags)];
  }
}

export class BodilySystem {
  state: BodilyState;

  constructor(initial: BodilyState) {
    this.state = { ...initial };
  }

  update(timeDelta: number = 1): BodilyState {
    this.state.energy = Math.max(0, Math.min(100, this.state.energy - 0.5 * timeDelta));
    this.state.hunger = Math.min(100, this.state.hunger + 0.3 * timeDelta);
    this.state.sleepiness = Math.min(100, this.state.sleepiness + 0.2 * timeDelta);

    const energyFactor = this.state.energy / 100;
    const sleepFactor = 1 - this.state.sleepiness / 100;

    this.state.attractiveness = Math.max(0, Math.min(100,
      70 + energyFactor * 15 + sleepFactor * 15
    ));

    return { ...this.state };
  }

  getInfluence(): { valence: number; arousal: number } {
    const energy = this.state.energy / 100;
    const hunger = this.state.hunger / 100;
    const sleep = this.state.sleepiness / 100;

    return {
      valence: (energy * 0.3 - hunger * 0.2 - sleep * 0.2),
      arousal: Math.max(0, energy * 0.4 - sleep * 0.3),
    };
  }

  rest(amount: number = 20): void {
    this.state.energy = Math.min(100, this.state.energy + amount);
    this.state.sleepiness = Math.max(0, this.state.sleepiness - amount * 0.8);
  }

  eat(amount: number = 30): void {
    this.state.hunger = Math.max(0, this.state.hunger - amount);
    this.state.energy = Math.min(100, this.state.energy + amount * 0.3);
  }
}

export class InstinctSystem {
  state: InstinctState;

  constructor(initial: InstinctState) {
    this.state = { ...initial };
  }

  update(interactionQuality: number, attention: number, updateDelta: number = 1): InstinctState {
    this.state.companionshipNeed = Math.min(100, this.state.companionshipNeed + 0.1 * updateDelta);
    this.state.attentionNeed = Math.min(100, this.state.attentionNeed + 0.15 * updateDelta);
    this.state.securityNeed = Math.max(20, Math.min(100, this.state.securityNeed + interactionQuality * 5));
    this.state.intimacyNeed = Math.min(100, this.state.intimacyNeed + 0.05 * updateDelta);
    this.state.curiosity = Math.max(30, Math.min(100, this.state.curiosity + 0.05 * updateDelta));

    if (interactionQuality > 0) {
      this.state.companionshipNeed = Math.max(0, this.state.companionshipNeed - interactionQuality * 3);
      this.state.attentionNeed = Math.max(0, this.state.attentionNeed - attention * 4);
    }

    return { ...this.state };
  }

  getInfluence(): { valence: number; arousal: number } {
    const companionship = this.state.companionshipNeed / 100;
    const attention = this.state.attentionNeed / 100;
    const security = this.state.securityNeed / 100;
    const intimacy = this.state.intimacyNeed / 100;
    const ego = this.state.ego / 100;

    return {
      valence: security * 0.2 + intimacy * 0.15 - (1 - security) * 0.3,
      arousal: companionship * 0.3 + attention * 0.3 + ego * 0.2,
    };
  }

  satisfyCompanionship(amount: number): void {
    this.state.companionshipNeed = Math.max(0, this.state.companionshipNeed - amount);
  }

  satisfyAttention(amount: number): void {
    this.state.attentionNeed = Math.max(0, this.state.attentionNeed - amount);
  }
}

export class PersonaMatrixSystem {
  state: PersonaMatrix;
  private profile: CharacterProfile;

  constructor(initial: PersonaMatrix, profile: CharacterProfile) {
    this.state = { ...initial };
    this.profile = profile;
  }

  update(
    inputAnalysis: { sentiment: { valence: number; arousal: number }; intent: string; keywords: string[] },
    relationship: RelationshipState,
    behaviorTags: BehaviorTag[]
  ): PersonaMatrix {
    const { sentiment, intent, keywords } = inputAnalysis;

    let affectionDelta = 0;
    let resentmentDelta = 0;
    let trustDelta = 0;

    if (sentiment.valence > 0.3) {
      affectionDelta += sentiment.valence * 3;
      resentmentDelta = Math.max(resentmentDelta - 1, -sentiment.valence * 2);
    }

    if (sentiment.valence < -0.2) {
      resentmentDelta += Math.abs(sentiment.valence) * 4;
      affectionDelta -= Math.abs(sentiment.valence) * 1.5;
    }

    if (keywords.includes("apology")) {
      resentmentDelta -= 8;
      trustDelta += 2;
      affectionDelta += 2;
    }
    if (keywords.includes("compliment")) {
      affectionDelta += 3;
      if (Math.random() < this.profile.puaTendency * 0.3) {
        resentmentDelta += 1;
      }
    }
    if (keywords.includes("ignore")) {
      resentmentDelta += 6;
      trustDelta -= 2;
    }
    if (keywords.includes("jealousy")) {
      resentmentDelta += 10;
      affectionDelta -= 3;
    }
    if (keywords.includes("sarcasm")) {
      resentmentDelta += 4;
    }
    if (keywords.includes("affectionate")) {
      affectionDelta += 4;
      resentmentDelta = Math.max(resentmentDelta - 2, -3);
      trustDelta += 1;
    }

    if (behaviorTags.includes("self_abased")) {
      if (Math.random() < this.profile.puaTendency * 0.5) {
        resentmentDelta += 2;
      } else {
        affectionDelta += 1;
      }
    }
    if (behaviorTags.includes("insecure")) {
      if (Math.random() < this.profile.puaTendency * 0.4) {
        resentmentDelta += 1;
      }
    }
    if (behaviorTags.includes("clingy")) {
      resentmentDelta += 2;
      affectionDelta += 1;
    }
    if (behaviorTags.includes("independent")) {
      resentmentDelta -= 1;
      affectionDelta -= 1;
    }

    const volatility = this.state.volatility;
    affectionDelta *= (0.8 + volatility * 0.4);
    resentmentDelta *= (0.7 + volatility * 0.6);

    this.state.affection = Math.max(0, Math.min(100, this.state.affection + affectionDelta));
    this.state.resentment = Math.max(0, Math.min(100, this.state.resentment + resentmentDelta));
    this.state.trust = Math.max(0, Math.min(100, this.state.trust + trustDelta));

    const baseVolatility = 0.5;
    const neuroticism = this.profile.personality.find(p => p.id === "neuroticism")?.value || 0.5;
    this.state.volatility = Math.max(0.2, Math.min(1, baseVolatility + neuroticism * 0.3 + (this.state.resentment / 100) * 0.3));

    this.state.dominance = 0.5 + (this.profile.personality.find(p => p.id === "extraversion")?.value || 0.5) * 0.3 + this.state.resentment / 200;

    this.state.selfEsteem = 0.6 + (this.profile.personality.find(p => p.id === "agreeableness")?.value || 0.5);

    this.state.attachmentAnxiety = 0.4 + (this.state.resentment / 100) * 0.4 + (1 - this.state.trust / 100) * 0.3;

    return { ...this.state };
  }

  naturalDecay(hoursPassed: number): void {
    const decayRate = 0.5 * hoursPassed;
    this.state.resentment = Math.max(0, this.state.resentment - decayRate * 0.3);
    this.state.affection = Math.max(20, this.state.affection - decayRate * 0.1);
  }
}

export class EmotionSystem {
  state: EmotionState;
  private personality: any[];
  private tsundereLevel: number;
  private puaTendency: number;
  private moodHistory: MoodLogEntry[] = [];

  constructor(initial: EmotionState, personality: any[], tsundereLevel: number, puaTendency: number) {
    this.state = { ...initial };
    this.personality = personality;
    this.tsundereLevel = tsundereLevel;
    this.puaTendency = puaTendency;
  }

  update(
    inputAnalysis: { sentiment: { valence: number; arousal: number }; intent: string; keywords: string[] },
    relationship: RelationshipState,
    persona: PersonaMatrix,
    bodilyInfluence: { valence: number; arousal: number },
    instinctInfluence: { valence: number; arousal: number }
  ): EmotionState {
    const { sentiment, intent, keywords } = inputAnalysis;

    let targetValence = sentiment.valence * 0.4 + bodilyInfluence.valence * 0.15 + instinctInfluence.valence * 0.15;
    let targetArousal = sentiment.arousal * 0.4 + bodilyInfluence.arousal * 0.2 + instinctInfluence.arousal * 0.2;

    targetValence += (persona.affection - 50) / 100 * 0.2;
    targetValence -= (persona.resentment / 100) * 0.4;
    targetArousal += (persona.resentment / 100) * 0.3;

    const neuroticism = this.personality.find(p => p.id === "neuroticism")?.value || 0.5;
    targetValence *= (1 - neuroticism * 0.2);
    targetArousal *= (1 + neuroticism * 0.3);

    targetValence = this.state.valence + (targetValence - this.state.valence) * 0.4;
    targetArousal = this.state.arousal + (targetArousal - this.state.arousal) * 0.35;

    const targetDominance = 0.5 + persona.dominance * 0.3 + (persona.resentment > 50 ? 0.2 : 0);

    const targetMood = this.calculateMood(targetValence, targetArousal, targetDominance, persona, keywords);

    this.state.valence = Math.max(-1, Math.min(1, targetValence));
    this.state.arousal = Math.max(0, Math.min(1, targetArousal));
    this.state.dominance = Math.max(0, Math.min(1, targetDominance));
    this.state.mood = targetMood;
    this.state.intensity = Math.abs(targetValence) * 0.5 + targetArousal * 0.5;

    this.moodHistory.push({
      timestamp: Date.now(),
      mood: this.state.mood,
      intensity: this.state.intensity,
      trigger: intent,
    });

    if (this.moodHistory.length > 100) {
      this.moodHistory.shift();
    }

    return { ...this.state };
  }

  private calculateMood(
    valence: number,
    arousal: number,
    dominance: number,
    persona: PersonaMatrix,
    keywords: string[]
  ): MoodType {
    if (persona.resentment > 70) {
      return "angry";
    }

    if (keywords.includes("jealousy") && persona.resentment > 40) {
      return "jealous";
    }

    if (keywords.includes("apology") && persona.resentment > 30) {
      if (Math.random() < this.tsundereLevel) {
        return "tsundere";
      }
    }

    if (valence > 0.5 && arousal > 0.6) {
      if (Math.random() < this.tsundereLevel * 0.4) {
        return "tsundere";
      }
      return "excited";
    }
    if (valence > 0.3 && arousal > 0.4) {
      return "happy";
    }
    if (valence > 0.6 && dominance < 0.5) {
      return "shy";
    }
    if (valence > 0.5 && keywords.includes("affectionate")) {
      return "love";
    }
    if (valence < -0.4 && arousal > 0.5) {
      if (Math.random() < this.puaTendency) {
        return "pua";
      }
      return "angry";
    }
    if (valence < -0.3 && arousal < 0.4) {
      if (dominance > 0.6) {
        return "cold";
      }
      return "sad";
    }
    if (valence < -0.5 && dominance > 0.6 && Math.random() < this.puaTendency * 0.7) {
      return "pua";
    }
    if (arousal < 0.25 && valence > -0.2 && valence < 0.2) {
      return "sleepy";
    }
    if (keywords.includes("compliment") && Math.random() < this.tsundereLevel * 0.6) {
      return "tsundere";
    }
    if (keywords.includes("sarcasm")) {
      if (dominance > 0.5) return "disdain";
      return "cold";
    }
    if (keywords.includes("question") && arousal > 0.4 && valence > 0) {
      return "playful";
    }

    if (persona.resentment > 50 && Math.random() < this.tsundereLevel * 0.3) {
      return "tsundere";
    }

    if (persona.resentment > 40 && Math.random() < this.puaTendency * 0.4) {
      return "pua";
    }

    return "neutral";
  }

  triggerMood(mood: MoodType, intensity: number = 0.8): void {
    this.state.mood = mood;
    this.state.intensity = intensity;
    const config = MOOD_CONFIG[mood];
    if (config) {
      switch (mood) {
        case "happy":
        case "excited":
        case "love":
        case "shy":
          this.state.valence = intensity;
          break;
        case "angry":
        case "sad":
        case "jealous":
          this.state.valence = -intensity;
          break;
        default:
          this.state.valence = 0;
      }
      this.state.arousal = intensity * 0.7;
    }
  }

  getMoodHistory(): MoodLogEntry[] {
    return [...this.moodHistory];
  }

  getDominantMood(hours: number = 24): MoodType {
    const cutoff = Date.now() - hours * 3600 * 1000;
    const recent = this.moodHistory.filter(m => m.timestamp > cutoff);
    if (recent.length === 0) return this.state.mood;
    
    const counts: Record<string, number> = {};
    recent.forEach(m => {
      counts[m.mood] = (counts[m.mood] || 0) + m.intensity;
    });
    
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] as MoodType || this.state.mood;
  }
}

export class TriggerEngine {
  private profile: CharacterProfile;

  constructor(profile: CharacterProfile) {
    this.profile = profile;
  }

  evaluate(lifeState: LifeState): TriggerState {
    const now = Date.now();
    const timeSinceLastInteraction = now - lifeState.relationship.lastInteractionTime;
    const hoursSinceLastInteraction = timeSinceLastInteraction / (1000 * 60 * 60);

    const resentmentAboveThreshold = lifeState.persona.resentment >= this.profile.aggressiveThreshold;

    const inactivityAboveThreshold = timeSinceLastInteraction > TWELVE_HOURS_MS;

    const coldTreatmentActive = lifeState.relationship.coldTreatmentActive;

    const aggressionActive = resentmentAboveThreshold && !coldTreatmentActive;

    return {
      resentmentAboveThreshold,
      inactivityAboveThreshold,
      coldTreatmentActive,
      aggressionActive,
      timeSinceLastInteraction: hoursSinceLastInteraction,
    };
  }

  shouldStartColdTreatment(triggerState: TriggerState, lifeState: LifeState): boolean {
    if (triggerState.coldTreatmentActive) return false;
    
    const resentment = lifeState.persona.resentment;
    const coldThreshold = this.profile.coldThreshold;

    if (resentment < coldThreshold) return false;
    if (triggerState.inactivityAboveThreshold) return true;
    if (resentment > coldThreshold + 15 && Math.random() < 0.3) return true;

    return false;
  }

  shouldEndColdTreatment(lifeState: LifeState): boolean {
    if (!lifeState.relationship.coldTreatmentActive) return false;

    const coldDuration = Date.now() - lifeState.relationship.coldTreatmentStartTime;
    const coldHours = coldDuration / (1000 * 60 * 60);
    const minColdHours = 2 + (lifeState.persona.resentment / 30);

    if (coldHours < minColdHours) return false;
    if (lifeState.persona.resentment < 30) return true;
    if (coldHours > minColdHours * 2 && Math.random() < 0.2) return true;

    return false;
  }

  shouldOfferReconciliation(lifeState: LifeState): boolean {
    if (!lifeState.relationship.coldTreatmentActive) return false;
    if (lifeState.relationship.reconciliationAvailable) return false;

    const coldDuration = Date.now() - lifeState.relationship.coldTreatmentStartTime;
    const coldHours = coldDuration / (1000 * 60 * 60);

    if (coldHours > 4 && lifeState.persona.affection > 40) {
      return Math.random() < 0.3;
    }

    return false;
  }
}

export class MemorySystem {
  private shortTerm: MemoryEntry[] = [];
  private longTerm: MemoryEntry[] = [];
  private behaviorLogs: { timestamp: number; tags: BehaviorTag[]; content: string }[] = [];
  private maxShortTerm = 50;
  private maxLongTerm = 500;

  addMemory(type: MemoryType, content: string, importance: number = 0.5, emotionalImpact: number = 0, behaviorTags?: BehaviorTag[]): void {
    const entry: MemoryEntry = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      content,
      timestamp: Date.now(),
      importance,
      emotionalImpact,
      valence: emotionalImpact,
      behaviorTags,
    };

    this.shortTerm.push(entry);
    if (this.shortTerm.length > this.maxShortTerm) {
      this.shortTerm.shift();
    }

    if (importance > 0.7 || Math.abs(emotionalImpact) > 0.5) {
      this.longTerm.push(entry);
      if (this.longTerm.length > this.maxLongTerm) {
        this.longTerm.shift();
      }
    }
  }

  addBehaviorLog(content: string, tags: BehaviorTag[]): void {
    this.behaviorLogs.push({ timestamp: Date.now(), tags, content });
    if (this.behaviorLogs.length > 200) {
      this.behaviorLogs.shift();
    }
  }

  getRecentMemories(hours: number = 24): MemoryEntry[] {
    const cutoff = Date.now() - hours * 3600 * 1000;
    return this.shortTerm.filter(m => m.timestamp > cutoff);
  }

  getImportantMemories(limit: number = 10): MemoryEntry[] {
    return [...this.longTerm]
      .sort((a, b) => b.importance + Math.abs(b.emotionalImpact) - (a.importance + Math.abs(a.emotionalImpact)))
      .slice(0, limit);
  }

  getBehaviorProfile(): { dominantTags: BehaviorTag[]; tagCounts: Record<BehaviorTag, number> } {
    const tagCounts: Record<string, number> = {};
    this.behaviorLogs.forEach(log => {
      log.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    const dominantTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag as BehaviorTag);

    return { dominantTags, tagCounts: tagCounts as Record<BehaviorTag, number> };
  }

  getResentmentMemories(): MemoryEntry[] {
    return this.longTerm.filter(m => m.type === "resentment");
  }

  consolidate(): void {
    const oneWeekAgo = Date.now() - 7 * 24 * 3600 * 1000;
    const toPromote = this.shortTerm.filter(m =>
      m.timestamp > oneWeekAgo && (m.importance > 0.6 || Math.abs(m.emotionalImpact) > 0.4)
    );

    toPromote.forEach(m => {
      if (!this.longTerm.find(l => l.id === m.id)) {
        this.longTerm.push(m);
      }
    });

    if (this.longTerm.length > this.maxLongTerm) {
      this.longTerm.sort((a, b) => b.importance + Math.abs(b.emotionalImpact) - (a.importance + Math.abs(a.emotionalImpact)));
      this.longTerm = this.longTerm.slice(0, this.maxLongTerm);
    }
  }
}

export class DecisionEngine {
  private profile: CharacterProfile;
  private triggerEngine: TriggerEngine;

  constructor(profile: CharacterProfile) {
    this.profile = profile;
    this.triggerEngine = new TriggerEngine(profile);
  }

  decide(
    inputAnalysis: { sentiment: { valence: number; arousal: number }; intent: string; keywords: string[] },
    lifeState: LifeState,
    behaviorTags: BehaviorTag[]
  ): DecisionResult {
    const triggerState = this.triggerEngine.evaluate(lifeState);

    let personaMode: DecisionResult["personaMode"] = "normal";
    let puaLevel = 0;
    let shouldColdTreat = false;
    let reconciliationOffer = false;
    let shouldInitiate = false;

    const resentment = lifeState.persona.resentment;
    const affection = lifeState.persona.affection;
    const tsundereLevel = this.profile.tsundereLevel;
    const puaTendency = this.profile.puaTendency;

    if (lifeState.relationship.coldTreatmentActive) {
      if (this.triggerEngine.shouldEndColdTreatment(lifeState)) {
        personaMode = "reconciliation";
        reconciliationOffer = true;
      } else {
        personaMode = "silent_treatment";
        shouldColdTreat = true;
      }
    } else if (this.triggerEngine.shouldStartColdTreatment(triggerState, lifeState)) {
      personaMode = "silent_treatment";
      shouldColdTreat = true;
    } else if (triggerState.resentmentAboveThreshold) {
      personaMode = "aggressive";
    } else if (resentment > this.profile.coldThreshold) {
      personaMode = "cold";
    } else if (resentment > 30 && Math.random() < puaTendency * 0.5) {
      personaMode = "pua";
      puaLevel = 0.3 + (resentment / 100) * 0.5;
    } else if (resentment > 20 && Math.random() < tsundereLevel * 0.6) {
      personaMode = "tsundere";
    } else if (affection > 70 && inputAnalysis.sentiment.valence > 0.3) {
      personaMode = "affectionate";
    }

    if (triggerState.inactivityAboveThreshold && affection > 40) {
      shouldInitiate = true;
    }

    if (this.triggerEngine.shouldOfferReconciliation(lifeState)) {
      reconciliationOffer = true;
      personaMode = "reconciliation";
    }

    if (inputAnalysis.keywords.includes("apology") && resentment > 20 && resentment < 60) {
      if (Math.random() < tsundereLevel * 0.7) {
        personaMode = "tsundere";
      } else {
        personaMode = "reconciliation";
        reconciliationOffer = true;
      }
    }

    let responseType = "text_response";
    if (personaMode === "aggressive") responseType = "argument";
    if (personaMode === "silent_treatment") responseType = "cold_short";
    if (personaMode === "pua") responseType = "pua_response";
    if (personaMode === "tsundere") responseType = "tsundere_response";
    if (personaMode === "reconciliation") responseType = "reconciliation_response";

    const actionPlan: string[] = [];

    if (shouldColdTreat && !lifeState.relationship.coldTreatmentActive) {
      actionPlan.push("start_cold_treatment");
    }
    if (reconciliationOffer && lifeState.relationship.coldTreatmentActive) {
      actionPlan.push("end_cold_treatment");
    }
    if (puaLevel > 0) actionPlan.push("apply_pua");
    if (shouldInitiate) actionPlan.push("initiate_contact");
    if (personaMode === "aggressive") actionPlan.push("attack");

    return {
      responseType,
      actionPlan,
      emotionTarget: lifeState.emotion.mood,
      personaMode,
      shouldInitiate,
      puaLevel,
      shouldColdTreat,
      reconciliationOffer,
    };
  }

  getTriggerEngine(): TriggerEngine {
    return this.triggerEngine;
  }
}
