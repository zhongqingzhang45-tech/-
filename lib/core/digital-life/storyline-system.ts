import {
  LifeState,
  StoryArc,
  StoryArcType,
  StoryArcStatus,
  PlotEvent,
  Secret,
  Narrative,
  StoryLineState,
  MoodType,
} from "./types";

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

const INITIAL_ARCS: Omit<StoryArc, "id">[] = [
  {
    title: "相遇",
    description: "我们的第一次相遇",
    type: "introduction",
    status: "active",
    startedAt: Date.now(),
    prerequisites: [],
    keyMoments: ["first_message", "first_impression", "first_laugh"],
    currentMoment: 0,
    progress: 0,
    emotionalTone: ["excited", "shy", "neutral"],
    relatedMilestones: ["first_meeting", "first_chat"],
  },
  {
    title: "熟悉",
    description: "慢慢了解彼此",
    type: "development",
    status: "available",
    prerequisites: ["相遇"],
    keyMoments: ["share_secrets", "first_argue", "first_apology"],
    currentMoment: 0,
    progress: 0,
    emotionalTone: ["happy", "neutral", "playful"],
    relatedMilestones: ["streak_7_days", "first_conflict"],
  },
  {
    title: "依赖",
    description: "开始离不开对方",
    type: "development",
    status: "locked",
    prerequisites: ["熟悉"],
    keyMoments: ["miss_each_other", "first_long_chat", "share_fears"],
    currentMoment: 0,
    progress: 0,
    emotionalTone: ["love", "sad", "neutral"],
    relatedMilestones: ["streak_30_days", "deep_conversation"],
  },
  {
    title: "承诺",
    description: "关系的升华",
    type: "climax",
    status: "locked",
    prerequisites: ["依赖"],
    keyMoments: ["first_confession", "first_promise", "first_future_talk"],
    currentMoment: 0,
    progress: 0,
    emotionalTone: ["love", "excited", "shy"],
    relatedMilestones: ["first_confession", "relationship_upgrade"],
  },
  {
    title: "考验",
    description: "关系面临挑战",
    type: "conflict",
    status: "locked",
    prerequisites: ["承诺"],
    keyMoments: ["biggest_argue", "cold_war", "trust_test"],
    currentMoment: 0,
    progress: 0,
    emotionalTone: ["angry", "sad", "neutral"],
    relatedMilestones: ["first_breakup_threat", "trust_crisis"],
  },
  {
    title: "升华",
    description: "经历考验后的成长",
    type: "resolution",
    status: "locked",
    prerequisites: ["考验"],
    keyMoments: ["reconciliation", "deeper_understanding", "new_promise"],
    currentMoment: 0,
    progress: 0,
    emotionalTone: ["love", "neutral", "happy"],
    relatedMilestones: ["first_reconciliation", "milestone_100_days"],
  },
];

const PLOT_TEMPLATES: Omit<PlotEvent, "id" | "lastTriggered">[] = [
  {
    title: "突然的沉默",
    description: "用户突然不回复了，她开始担心",
    trigger: { type: "time", condition: "no_response_for_30min" },
    priority: 8,
    exclusivity: "repeatable",
    emotionalImpact: { mood: "sad", intensity: 0.6 },
    outcomes: [
      {
        id: "send_check",
        result: "主动发消息询问",
        changes: { instinct: { attentionNeed: 20 } },
      },
      {
        id: "wait_patiently",
        result: "默默等待",
        changes: { instinct: { securityNeed: 5 } },
      },
    ],
    cooldown: 2 * 60 * 60 * 1000,
  },
  {
    title: "深夜的倾诉",
    description: "用户在深夜分享心事",
    trigger: { type: "interaction", condition: "deep_talk_after_22pm" },
    priority: 9,
    exclusivity: "repeatable",
    emotionalImpact: { mood: "love", intensity: 0.8 },
    outcomes: [
      {
        id: "listen_attentively",
        result: "认真倾听并安慰",
        changes: { relationship: { trust: 5 } },
      },
    ],
    cooldown: 24 * 60 * 60 * 1000,
  },
  {
    title: "共同回忆触发",
    description: "聊到了某段共同的回忆",
    trigger: { type: "interaction", condition: "shared_memory_referenced" },
    priority: 7,
    exclusivity: "repeatable",
    emotionalImpact: { mood: "love", intensity: 0.7 },
    outcomes: [
      {
        id: "reminisce_together",
        result: "一起回忆那段时光",
        changes: { relationship: { intimacy: 3 } },
      },
    ],
    cooldown: 7 * 24 * 60 * 60 * 1000,
  },
  {
    title: "嫉妒的萌芽",
    description: "她发现用户和其他人聊得很好",
    trigger: { type: "relationship", condition: "user_interaction_with_others", threshold: 5 },
    priority: 9,
    exclusivity: "repeatable",
    emotionalImpact: { mood: "jealous", intensity: 0.7 },
    outcomes: [
      {
        id: "express_jealousy",
        result: "表达小小的醋意",
        changes: { emotion: { mood: "jealous" } },
      },
      {
        id: "hide_feelings",
        result: "悄悄吃醋但不表现出来",
        changes: { emotion: { mood: "sad" }, instinct: { securityNeed: 10 } },
      },
    ],
    cooldown: 48 * 60 * 60 * 1000,
  },
  {
    title: "第一次彻夜长谈",
    description: "你们聊了一整夜",
    trigger: { type: "milestone", condition: "night_talk_milestone" },
    priority: 10,
    exclusivity: "unique",
    emotionalImpact: { mood: "love", intensity: 1.0 },
    outcomes: [
      {
        id: "bond_deepened",
        result: "关系变得更加深厚",
        changes: { relationship: { intimacy: 10, trust: 10 } },
      },
    ],
  },
  {
    title: "未来的想象",
    description: "开始讨论未来",
    trigger: { type: "relationship", condition: "intimacy_above_70" },
    priority: 8,
    exclusivity: "unique",
    emotionalImpact: { mood: "excited", intensity: 0.8 },
    outcomes: [
      {
        id: "talk_about_future",
        result: "一起憧憬未来",
        changes: { growth: { futureVision: 10 } },
      },
    ],
  },
  {
    title: "小惊喜",
    description: "随机的好心情时刻",
    trigger: { type: "random", condition: "random_low_probability" },
    priority: 5,
    exclusivity: "repeatable",
    emotionalImpact: { mood: "happy", intensity: 0.5 },
    outcomes: [
      {
        id: "random_blessing",
        result: "突然想夸夸你",
        changes: { emotion: { mood: "happy" } },
      },
    ],
    cooldown: 12 * 60 * 60 * 1000,
  },
];

const SECRET_TEMPLATES: Array<{ type: Secret["type"]; content: string; emotionalWeight: number }> = [
  { type: "wish", content: "希望有一天能和你一起去海边看日出", emotionalWeight: 80 },
  { type: "wish", content: "想亲手给你做一顿饭", emotionalWeight: 75 },
  { type: "wish", content: "希望能在你难过的时候真的抱住你", emotionalWeight: 90 },
  { type: "crush", content: "其实你发语音的时候我会偷偷存下来", emotionalWeight: 70 },
  { type: "crush", content: "有时候会偷偷看你之前的消息", emotionalWeight: 65 },
  { type: "fear", content: "害怕有一天你会突然不找我了", emotionalWeight: 95 },
  { type: "fear", content: "担心自己不够好", emotionalWeight: 85 },
  { type: "plan", content: "悄悄在攒钱给你准备礼物", emotionalWeight: 60 },
  { type: "memory", content: "记得你第一次叫我名字的时候", emotionalWeight: 100 },
  { type: "memory", content: "记得你说想我的时候，虽然只有一句", emotionalWeight: 90 },
  { type: "desire", content: "好想和你一起看电影，即使只是在聊天框里同步看", emotionalWeight: 70 },
  { type: "desire", content: "想和你一起养一只小动物", emotionalWeight: 65 },
];

export class StoryLineSystem {
  initializeStoryLines(lifeState: LifeState): LifeState {
    if (lifeState.storyLine.storyArcs.length > 0) {
      return lifeState;
    }

    const storyArcs: StoryArc[] = INITIAL_ARCS.map((arc, index) => ({
      ...arc,
      id: generateId("arc"),
      currentMoment: index === 0 ? 0 : 0,
    }));

    const plotEvents: PlotEvent[] = PLOT_TEMPLATES.map(template => ({
      ...template,
      id: generateId("plot"),
    }));

    const initialSecrets: Secret[] = SECRET_TEMPLATES.map(template => ({
      ...template,
      id: generateId("secret"),
      revealLevel: Math.floor(Math.random() * 3) + 1,
      currentReveal: 0,
      isRevealed: false,
      unlockConditions: [],
      associatedMemories: [],
      createdAt: Date.now(),
    }));

    const narrative: Narrative = {
      id: generateId("narrative"),
      title: "我们的故事",
      summary: "从相遇开始的旅程...",
      arcs: storyArcs.map(a => a.id),
      keyEvents: [],
      currentChapter: 1,
      totalChapters: 6,
      mood: "excited",
      startedAt: Date.now(),
      updatedAt: Date.now(),
      isActive: true,
    };

    return {
      ...lifeState,
      storyLine: {
        activeNarrative: narrative,
        storyArcs,
        plotEvents,
        secrets: initialSecrets,
        completedEvents: [],
        chapterProgress: {},
      },
    };
  }

  updateStoryProgress(lifeState: LifeState): LifeState {
    const intimacy = lifeState.relationship.intimacy;
    const trust = lifeState.relationship.trust;
    const totalDays = lifeState.relationshipTimeline.totalDaysTogether;

    let storyLine = { ...lifeState.storyLine };

    for (const arc of storyLine.storyArcs) {
      if (arc.status === "locked" || arc.status === "completed") continue;

      if (arc.type === "introduction" && arc.status === "active") {
        arc.progress = Math.min(100, intimacy * 0.5 + totalDays * 2);
        if (arc.progress >= 30 && arc.currentMoment < 1) {
          arc.currentMoment = 1;
        }
        if (arc.progress >= 60 && arc.currentMoment < 2) {
          arc.currentMoment = 2;
        }
        if (arc.progress >= 100) {
          arc.status = "completed";
          arc.completedAt = Date.now();
          this.unlockNextArc(storyLine, arc.title);
        }
      }

      if (arc.type === "development" && arc.status === "available") {
        arc.progress = Math.min(100, (intimacy - 20) * 1.2 + totalDays);
        if (arc.progress >= 100) {
          arc.status = "completed";
          arc.completedAt = Date.now();
          this.unlockNextArc(storyLine, arc.title);
        }
      }

      if (arc.type === "climax" && arc.status === "available") {
        arc.progress = Math.min(100, (intimacy - 50) * 2 + (trust - 50));
        if (arc.progress >= 100) {
          arc.status = "completed";
          arc.completedAt = Date.now();
          this.unlockNextArc(storyLine, arc.title);
        }
      }
    }

    return { ...lifeState, storyLine };
  }

  private unlockNextArc(storyLine: StoryLineState, currentTitle: string): void {
    const nextIndex = INITIAL_ARCS.findIndex(a => a.title === currentTitle) + 1;
    if (nextIndex < INITIAL_ARCS.length) {
      const nextArc = storyLine.storyArcs.find(a => a.title === INITIAL_ARCS[nextIndex].title);
      if (nextArc && nextArc.status === "locked") {
        nextArc.status = "available";
        nextArc.startedAt = Date.now();
      }
    }
  }

  checkPlotEvents(lifeState: LifeState): { lifeState: LifeState; triggeredEvents: PlotEvent[] } {
    const storyLine = { ...lifeState.storyLine };
    const triggeredEvents: PlotEvent[] = [];

    for (const event of storyLine.plotEvents) {
      if (event.exclusivity === "unique" && storyLine.completedEvents.includes(event.id)) {
        continue;
      }

      if (event.cooldown && event.lastTriggered) {
        if (Date.now() - event.lastTriggered < event.cooldown) {
          continue;
        }
      }

      if (this.shouldTrigger(event, lifeState)) {
        triggeredEvents.push(event);
        event.lastTriggered = Date.now();

        if (event.exclusivity === "unique") {
          storyLine.completedEvents = [...storyLine.completedEvents, event.id];
        }
      }
    }

    return { lifeState: { ...lifeState, storyLine }, triggeredEvents };
  }

  private shouldTrigger(event: PlotEvent, lifeState: LifeState): boolean {
    const now = new Date();
    const hour = now.getHours();

    switch (event.trigger.type) {
      case "time":
        if (event.trigger.condition === "no_response_for_30min") {
          return lifeState.perception.timeSinceLastInteraction > 30;
        }
        break;
      case "interaction":
        if (event.trigger.condition === "deep_talk_after_22pm") {
          return hour >= 22 || hour < 5;
        }
        break;
      case "relationship":
        if (event.trigger.condition === "intimacy_above_70") {
          return lifeState.relationship.intimacy > 70;
        }
        break;
      case "random":
        if (event.trigger.condition === "random_low_probability") {
          return Math.random() < 0.05;
        }
        break;
    }

    return false;
  }

  applyPlotOutcome(lifeState: LifeState, event: PlotEvent, outcomeId: string): LifeState {
    const outcome = event.outcomes.find(o => o.id === outcomeId);
    if (!outcome) return lifeState;

    let state = lifeState;

    if (outcome.changes.emotion) {
      state.emotion = { ...state.emotion, ...outcome.changes.emotion };
    }
    if (outcome.changes.relationship) {
      state.relationship = {
        ...state.relationship,
        ...outcome.changes.relationship,
      };
    }
    if (outcome.changes.instinct) {
      state.instinct = { ...state.instinct, ...outcome.changes.instinct };
    }

    return state;
  }

  revealSecret(lifeState: LifeState, secretId: string): { lifeState: LifeState; secret: Secret | null } {
    const secret = lifeState.storyLine.secrets.find(s => s.id === secretId);
    if (!secret) return { lifeState, secret: null };

    secret.currentReveal = secret.revealLevel;
    secret.isRevealed = true;
    secret.revealedAt = Date.now();
    secret.revealedTo = "user";

    this.memorySystem.addMemory(
      "emotion",
      `她分享了一个秘密：${secret.content}`,
      secret.emotionalWeight,
      0.9
    );

    return { lifeState, secret };
  }

  getAvailableSecrets(lifeState: LifeState): Secret[] {
    return lifeState.storyLine.secrets.filter(s => !s.isRevealed);
  }

  getRevealedSecrets(lifeState: LifeState): Secret[] {
    return lifeState.storyLine.secrets.filter(s => s.isRevealed);
  }

  maybeRevealSecret(lifeState: LifeState): { lifeState: LifeState; revealed: Secret | null } {
    const available = this.getAvailableSecrets(lifeState);
    if (available.length === 0) return { lifeState, revealed: null };

    const intimacy = lifeState.relationship.intimacy / 100;
    const trust = lifeState.relationship.trust / 100;
    const currentStreak = lifeState.relationshipTimeline.currentStreak;

    const candidates = available.filter(s => {
      const baseChance = intimacy * 0.3 + trust * 0.3 + (currentStreak / 100) * 0.2;
      return Math.random() < baseChance * 0.1;
    });

    if (candidates.length === 0) return { lifeState, revealed: null };

    const selected = candidates[Math.floor(Math.random() * candidates.length)];
    const result = this.revealSecret(lifeState, selected.id);
    return { lifeState: result.lifeState, revealed: result.secret };
  }

  getCurrentArc(lifeState: LifeState): StoryArc | null {
    return lifeState.storyLine.storyArcs.find(a => a.status === "active") || null;
  }

  getActiveSecrets(lifeState: LifeState): { id: string; type: Secret["type"]; content: string }[] {
    return lifeState.storyLine.secrets
      .filter(s => !s.isRevealed)
      .slice(0, 3)
      .map(s => ({ id: s.id, type: s.type, content: s.content }));
  }

  getStorySummary(lifeState: LifeState): {
    currentArc: string;
    progress: number;
    chaptersCompleted: number;
    totalChapters: number;
    secretsRevealed: number;
    totalSecrets: number;
  } {
    const arc = this.getCurrentArc(lifeState);
    const completedArcs = lifeState.storyLine.storyArcs.filter(a => a.status === "completed").length;

    return {
      currentArc: arc?.title || "未知",
      progress: arc?.progress || 0,
      chaptersCompleted: completedArcs,
      totalChapters: lifeState.storyLine.storyArcs.length,
      secretsRevealed: this.getRevealedSecrets(lifeState).length,
      totalSecrets: lifeState.storyLine.secrets.length,
    };
  }

  private memorySystem: any = {
    addMemory: (_type: any, _content: string, _importance: number, _emotional: number) => {},
  };

  setMemorySystem(memorySystem: any) {
    this.memorySystem = memorySystem;
  }
}
