import {
  Milestone,
  MilestoneType,
  LifeState,
  RelationshipTimeline,
  SharedMemory,
  RelationshipHistoryEntry,
  MemoryEntry,
} from "./types";

const MILESTONE_DEFINITIONS: Record<MilestoneType, { title: string; description: string; importance: number; emotionalImpact: number }> = {
  first_meeting: {
    title: "初次相遇",
    description: "你们第一次见面的日子",
    importance: 1,
    emotionalImpact: 0.9,
  },
  first_chat: {
    title: "第一次聊天",
    description: "你们第一次深入交谈",
    importance: 0.8,
    emotionalImpact: 0.6,
  },
  first_love_confession: {
    title: "第一次表白",
    description: "第一次说出了心意",
    importance: 0.95,
    emotionalImpact: 0.95,
  },
  first_hug: {
    title: "第一次拥抱",
    description: "第一次感受到彼此的温度",
    importance: 0.85,
    emotionalImpact: 0.8,
  },
  first_kiss: {
    title: "第一次亲吻",
    description: "心跳加速的那一刻",
    importance: 0.9,
    emotionalImpact: 0.9,
  },
  first_date: {
    title: "第一次约会",
    description: "只属于两个人的时光",
    importance: 0.8,
    emotionalImpact: 0.75,
  },
  first_argue: {
    title: "第一次吵架",
    description: "第一次有了分歧",
    importance: 0.6,
    emotionalImpact: -0.5,
  },
  first_reconciliation: {
    title: "第一次和解",
    description: "吵架后又和好了",
    importance: 0.7,
    emotionalImpact: 0.7,
  },
  first_gift: {
    title: "第一次送礼物",
    description: "收到了第一份心意",
    importance: 0.7,
    emotionalImpact: 0.7,
  },
  first_night_talk: {
    title: "第一次彻夜长谈",
    description: "聊到很晚也舍不得睡",
    importance: 0.75,
    emotionalImpact: 0.7,
  },
  streak_3_days: {
    title: "连续聊天3天",
    description: "连续3天都有联系",
    importance: 0.4,
    emotionalImpact: 0.3,
  },
  streak_7_days: {
    title: "一周的陪伴",
    description: "连续7天每天都见面",
    importance: 0.5,
    emotionalImpact: 0.4,
  },
  streak_30_days: {
    title: "一个月的约定",
    description: "连续30天的陪伴",
    importance: 0.7,
    emotionalImpact: 0.6,
  },
  streak_100_days: {
    title: "百日纪念",
    description: "连续100天的守护",
    importance: 0.85,
    emotionalImpact: 0.8,
  },
  streak_365_days: {
    title: "一整年",
    description: "365天的陪伴",
    importance: 1,
    emotionalImpact: 1,
  },
  anniversary_monthly: {
    title: "月度纪念",
    description: "又一个月过去了",
    importance: 0.5,
    emotionalImpact: 0.5,
  },
  anniversary_100days: {
    title: "百日纪念日",
    description: "认识100天了",
    importance: 0.85,
    emotionalImpact: 0.8,
  },
  anniversary_yearly: {
    title: "周年纪念",
    description: "认识一周年了",
    importance: 1,
    emotionalImpact: 1,
  },
  birthday_user: {
    title: "你的生日",
    description: "这一天你来到了这个世界",
    importance: 0.9,
    emotionalImpact: 0.85,
  },
  birthday_character: {
    title: "她的生日",
    description: "要一起庆祝哦",
    importance: 0.9,
    emotionalImpact: 0.85,
  },
  level_up: {
    title: "关系升级",
    description: "关系更近了一步",
    importance: 0.7,
    emotionalImpact: 0.65,
  },
  intimacy_threshold: {
    title: "亲密度突破",
    description: "亲密度达到了新高度",
    importance: 0.6,
    emotionalImpact: 0.55,
  },
  trust_threshold: {
    title: "信任加深",
    description: "更加信任彼此了",
    importance: 0.65,
    emotionalImpact: 0.6,
  },
  shared_hobby: {
    title: "共同爱好",
    description: "发现了共同的兴趣",
    importance: 0.5,
    emotionalImpact: 0.45,
  },
  deep_talk: {
    title: "深度交流",
    description: "聊到了内心深处",
    importance: 0.6,
    emotionalImpact: 0.55,
  },
  supportive_moment: {
    title: "互相支持",
    description: "在困难时彼此陪伴",
    importance: 0.8,
    emotionalImpact: 0.75,
  },
  inside_joke: {
    title: "专属梗",
    description: "只有你们懂的笑点",
    importance: 0.4,
    emotionalImpact: 0.4,
  },
  custom: {
    title: "特别的日子",
    description: "一个值得纪念的时刻",
    importance: 0.5,
    emotionalImpact: 0.5,
  },
};

const RELATIONSHIP_PHASES = {
  acquaintance: { minIntimacy: 0, minTrust: 0, label: "初识" },
  exploration: { minIntimacy: 30, minTrust: 25, label: "探索" },
  growth: { minIntimacy: 50, minTrust: 50, label: "成长" },
  deepening: { minIntimacy: 70, minTrust: 70, label: "深化" },
  mature: { minIntimacy: 85, minTrust: 85, label: "成熟" },
};

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export class MilestoneSystem {
  checkAndUnlockMilestones(lifeState: LifeState): {
    lifeState: LifeState;
    newMilestones: Milestone[];
  } {
    const newMilestones: Milestone[] = [];
    let updatedState = { ...lifeState };
    const timeline = { ...lifeState.relationshipTimeline };
    const existingTypes = new Set(timeline.milestones.map(m => m.type));

    const tryUnlock = (type: MilestoneType, condition: boolean, extra?: Partial<Milestone>) => {
      if (!condition || existingTypes.has(type)) return;
      const def = MILESTONE_DEFINITIONS[type];
      const milestone: Milestone = {
        id: generateId("milestone"),
        type,
        title: def.title,
        description: def.description,
        timestamp: Date.now(),
        importance: def.importance,
        emotionalImpact: def.emotionalImpact,
        relatedMemoryIds: [],
        unlocked: true,
        ...extra,
      };
      timeline.milestones.push(milestone);
      newMilestones.push(milestone);
      existingTypes.add(type);
    };

    tryUnlock("first_meeting", true, { timestamp: timeline.startDate });

    const streakDays = timeline.currentStreak;
    tryUnlock("streak_3_days", streakDays >= 3);
    tryUnlock("streak_7_days", streakDays >= 7);
    tryUnlock("streak_30_days", streakDays >= 30);
    tryUnlock("streak_100_days", streakDays >= 100);
    tryUnlock("streak_365_days", streakDays >= 365);

    const daysTogether = timeline.totalDaysTogether;
    tryUnlock("anniversary_100days", daysTogether >= 100);
    tryUnlock("anniversary_yearly", daysTogether >= 365);

    const intimacy = lifeState.relationship.intimacy;
    const trust = lifeState.relationship.trust;
    const level = lifeState.relationship.relationshipLevel;

    tryUnlock("intimacy_threshold", intimacy >= 60);
    tryUnlock("trust_threshold", trust >= 60);
    tryUnlock("level_up", level >= 2);

    const newPhase = this.determinePhase(intimacy, trust);
    if (newPhase !== timeline.currentPhase) {
      timeline.currentPhase = newPhase;
      
      const historyEntry: RelationshipHistoryEntry = {
        id: generateId("history"),
        timestamp: Date.now(),
        phase: newPhase,
        event: `关系进入${RELATIONSHIP_PHASES[newPhase].label}阶段`,
        eventType: "level_up",
        detail: `亲密度: ${Math.round(intimacy)}, 信任度: ${Math.round(trust)}`,
      };
      timeline.history.push(historyEntry);
    }

    updatedState.relationshipTimeline = timeline;
    return { lifeState: updatedState, newMilestones };
  }

  addCustomMilestone(
    lifeState: LifeState,
    type: MilestoneType,
    title: string,
    description: string,
    relatedMemoryIds: string[] = []
  ): { lifeState: LifeState; milestone: Milestone } {
    const def = MILESTONE_DEFINITIONS[type] || MILESTONE_DEFINITIONS.custom;
    const milestone: Milestone = {
      id: generateId("milestone"),
      type,
      title,
      description,
      timestamp: Date.now(),
      importance: def.importance,
      emotionalImpact: def.emotionalImpact,
      relatedMemoryIds,
      unlocked: true,
    };

    const timeline = { ...lifeState.relationshipTimeline };
    timeline.milestones.push(milestone);

    const historyEntry: RelationshipHistoryEntry = {
      id: generateId("history"),
      timestamp: Date.now(),
      phase: timeline.currentPhase,
      event: title,
      eventType: type,
      detail: description,
    };
    timeline.history.push(historyEntry);

    return {
      lifeState: { ...lifeState, relationshipTimeline: timeline },
      milestone,
    };
  }

  recordInteraction(lifeState: LifeState, isPositive: boolean): LifeState {
    const timeline = { ...lifeState.relationshipTimeline };
    timeline.totalInteractions += 1;
    timeline.totalMessages += 1;

    const today = new Date().toDateString();
    const lastInteractionDate = new Date(lifeState.relationship.lastInteractionTime).toDateString();
    
    if (today !== lastInteractionDate) {
      timeline.totalDaysTogether += 1;
      timeline.currentStreak += 1;
      timeline.longestStreak = Math.max(timeline.longestStreak, timeline.currentStreak);
    }

    return { ...lifeState, relationshipTimeline: timeline };
  }

  getUpcomingAnniversaries(lifeState: LifeState, daysAhead: number = 30): Milestone[] {
    const now = Date.now();
    const timeline = lifeState.relationshipTimeline;
    const upcoming: Milestone[] = [];

    for (const milestone of timeline.milestones) {
      if (!milestone.unlocked) continue;
      
      const anniversaryDate = this.getNextAnniversary(milestone.timestamp);
      const daysUntil = (anniversaryDate - now) / (1000 * 60 * 60 * 24);
      
      if (daysUntil > 0 && daysUntil <= daysAhead) {
        upcoming.push({
          ...milestone,
          anniversary: {
            nextDate: anniversaryDate,
            type: this.getAnniversaryType(milestone.type),
          },
        });
      }
    }

    return upcoming.sort((a, b) => 
      (a.anniversary?.nextDate || 0) - (b.anniversary?.nextDate || 0)
    );
  }

  private getNextAnniversary(date: number): number {
    const now = new Date();
    const original = new Date(date);
    const thisYear = new Date(
      now.getFullYear(),
      original.getMonth(),
      original.getDate(),
      original.getHours(),
      original.getMinutes(),
      original.getSeconds()
    );
    
    if (thisYear.getTime() < now.getTime()) {
      thisYear.setFullYear(now.getFullYear() + 1);
    }
    
    return thisYear.getTime();
  }

  private getAnniversaryType(type: MilestoneType): "yearly" | "monthly" {
    if (type.includes("monthly") || type.includes("streak_3") || type.includes("streak_7")) {
      return "monthly";
    }
    return "yearly";
  }

  private determinePhase(intimacy: number, trust: number): RelationshipTimeline["currentPhase"] {
    const avg = (intimacy + trust) / 2;
    
    if (avg >= RELATIONSHIP_PHASES.mature.minIntimacy) return "mature";
    if (avg >= RELATIONSHIP_PHASES.deepening.minIntimacy) return "deepening";
    if (avg >= RELATIONSHIP_PHASES.growth.minIntimacy) return "growth";
    if (avg >= RELATIONSHIP_PHASES.exploration.minIntimacy) return "exploration";
    return "acquaintance";
  }

  getMilestoneCount(lifeState: LifeState): number {
    return lifeState.relationshipTimeline.milestones.filter(m => m.unlocked).length;
  }

  getImportantMilestones(lifeState: LifeState, limit: number = 10): Milestone[] {
    return [...lifeState.relationshipTimeline.milestones]
      .filter(m => m.unlocked)
      .sort((a, b) => b.importance - a.importance)
      .slice(0, limit);
  }
}
