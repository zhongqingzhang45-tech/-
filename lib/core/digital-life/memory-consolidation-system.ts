import {
  MemoryEntry,
  SharedMemory,
  LifeState,
  Milestone,
} from "./types";

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

const SHARED_MEMORY_TEMPLATES = [
  {
    trigger: "first_meeting",
    title: "初次相遇的那天",
    summary: "一切的开始",
    tags: ["开始", "相遇"],
  },
  {
    trigger: "first_argue",
    title: "第一次吵架",
    summary: "虽然吵了一架，但也更了解彼此了",
    tags: ["冲突", "成长"],
  },
  {
    trigger: "first_reconciliation",
    title: "和解后的拥抱",
    summary: "和好比什么都重要",
    tags: ["和解", "温暖"],
  },
  {
    trigger: "first_gift",
    title: "收到的第一份礼物",
    summary: "一份心意，一份感动",
    tags: ["礼物", "感动"],
  },
  {
    trigger: "deep_talk",
    title: "深夜的心里话",
    summary: "聊到深夜也舍不得说晚安",
    tags: ["深夜", "心里话"],
  },
  {
    trigger: "streak_7_days",
    title: "一周的陪伴",
    summary: "连续七天的早安晚安",
    tags: ["日常", "陪伴"],
  },
  {
    trigger: "streak_30_days",
    title: "一个月了",
    summary: "不知不觉已经认识一个月了",
    tags: ["纪念", "日常"],
  },
  {
    trigger: "supportive_moment",
    title: "最困难的时候",
    summary: "谢谢你在我身边",
    tags: ["支持", "感动"],
  },
  {
    trigger: "inside_joke",
    title: "只有我们懂的梗",
    summary: "想到就会笑的小秘密",
    tags: ["快乐", "专属"],
  },
  {
    trigger: "shared_hobby",
    title: "共同的爱好",
    summary: "发现彼此都喜欢的东西",
    tags: ["爱好", "共鸣"],
  },
];

export class MemoryConsolidationSystem {
  private consolidationInterval = 24 * 60 * 60 * 1000;
  private minMemoriesForConsolidation = 5;
  private minImportanceForShared = 0.6;

  consolidateMemories(
    lifeState: LifeState,
    allMemories: MemoryEntry[]
  ): { lifeState: LifeState; newSharedMemories: SharedMemory[] } {
    const newSharedMemories: SharedMemory[] = [];
    const timeline = { ...lifeState.relationshipTimeline };
    const existingTitles = new Set(timeline.sharedMemories.map(m => m.title));

    const importantMemories = allMemories.filter(m =>
      m.importance >= this.minImportanceForShared &&
      Math.abs(m.emotionalImpact) >= 0.4
    );

    if (importantMemories.length < this.minMemoriesForConsolidation) {
      return { lifeState, newSharedMemories };
    }

    const topicClusters = this.clusterMemoriesByTopic(importantMemories);

    for (const cluster of topicClusters) {
      if (cluster.memories.length < 2) continue;
      
      const title = this.generateMemoryTitle(cluster);
      if (existingTitles.has(title)) continue;

      const sharedMemory: SharedMemory = {
        id: generateId("shared_memory"),
        title,
        summary: this.generateMemorySummary(cluster),
        timestamp: cluster.memories[0].timestamp,
        relatedMemories: cluster.memories.map(m => m.id),
        importance: cluster.avgImportance,
        emotionalValence: cluster.avgValence,
        tags: cluster.tags,
        mentionedCount: 0,
      };

      timeline.sharedMemories.push(sharedMemory);
      newSharedMemories.push(sharedMemory);
    }

    timeline.sharedMemories.sort((a, b) => b.importance - a.importance);

    return {
      lifeState: { ...lifeState, relationshipTimeline: timeline },
      newSharedMemories,
    };
  }

  createSharedMemoryFromMilestone(
    lifeState: LifeState,
    milestone: Milestone,
    relatedMemories: MemoryEntry[] = []
  ): { lifeState: LifeState; sharedMemory: SharedMemory } {
    const template = SHARED_MEMORY_TEMPLATES.find(t => t.trigger === milestone.type);
    
    const sharedMemory: SharedMemory = {
      id: generateId("shared_memory"),
      title: template?.title || milestone.title,
      summary: template?.summary || milestone.description,
      timestamp: milestone.timestamp,
      relatedMemories: relatedMemories.map(m => m.id),
      importance: milestone.importance * 0.8,
      emotionalValence: milestone.emotionalImpact,
      tags: template?.tags || ["纪念"],
      mentionedCount: 0,
    };

    const timeline = { ...lifeState.relationshipTimeline };
    timeline.sharedMemories.push(sharedMemory);

    return {
      lifeState: { ...lifeState, relationshipTimeline: timeline },
      sharedMemory,
    };
  }

  getRandomMemoryForSharing(lifeState: LifeState): SharedMemory | null {
    const sharedMemories = lifeState.relationshipTimeline.sharedMemories;
    if (sharedMemories.length === 0) return null;

    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

    const candidates = sharedMemories.filter(m =>
      !m.lastMentionedAt || m.lastMentionedAt < weekAgo
    );

    if (candidates.length === 0) {
      candidates.push(...sharedMemories);
    }

    const weighted = candidates.map(m => ({
      memory: m,
      weight: m.importance * (1 / (1 + m.mentionedCount * 0.5)),
    }));

    const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
    let random = Math.random() * totalWeight;

    for (const w of weighted) {
      random -= w.weight;
      if (random <= 0) {
        return w.memory;
      }
    }

    return weighted[weighted.length - 1].memory;
  }

  markMemoryMentioned(lifeState: LifeState, memoryId: string): LifeState {
    const timeline = { ...lifeState.relationshipTimeline };
    timeline.sharedMemories = timeline.sharedMemories.map(m =>
      m.id === memoryId
        ? { ...m, mentionedCount: m.mentionedCount + 1, lastMentionedAt: Date.now() }
        : m
    );
    return { ...lifeState, relationshipTimeline: timeline };
  }

  private clusterMemoriesByTopic(memories: MemoryEntry[]): Array<{
    memories: MemoryEntry[];
    avgImportance: number;
    avgValence: number;
    tags: string[];
    topic: string;
  }> {
    const clusters: Map<string, MemoryEntry[]> = new Map();

    for (const memory of memories) {
      const topic = this.determineTopic(memory);
      
      if (!clusters.has(topic)) {
        clusters.set(topic, []);
      }
      clusters.get(topic)!.push(memory);
    }

    const result: Array<{
      memories: MemoryEntry[];
      avgImportance: number;
      avgValence: number;
      tags: string[];
      topic: string;
    }> = [];

    for (const [topic, mems] of clusters) {
      const avgImportance = mems.reduce((sum, m) => sum + m.importance, 0) / mems.length;
      const avgValence = mems.reduce((sum, m) => sum + m.valence, 0) / mems.length;
      const tags = [...new Set(mems.flatMap(m => m.tags || [this.typeToTag(m.type)]))];

      result.push({
        memories: mems,
        avgImportance,
        avgValence,
        tags,
        topic,
      });
    }

    return result.sort((a, b) => b.memories.length - a.memories.length);
  }

  private determineTopic(memory: MemoryEntry): string {
    if (memory.type === "emotion") return "情感";
    if (memory.type === "event") return "事件";
    if (memory.type === "preference") return "偏好";
    if (memory.type === "milestone") return "里程碑";
    if (memory.type === "trauma") return "伤痛";
    if (memory.type === "behavior_pattern") return "模式";
    return "日常";
  }

  private typeToTag(type: string): string {
    const tagMap: Record<string, string> = {
      conversation: "聊天",
      fact: "事实",
      emotion: "情感",
      event: "事件",
      preference: "偏好",
      trauma: "伤痛",
      milestone: "里程碑",
      resentment: "怨念",
      behavior_pattern: "模式",
    };
    return tagMap[type] || "日常";
  }

  private generateMemoryTitle(cluster: any): string {
    if (cluster.topic === "情感") return "心动的瞬间";
    if (cluster.topic === "事件") return "那天的事";
    if (cluster.topic === "偏好") return "你的喜好";
    if (cluster.topic === "里程碑") return "重要的日子";
    return "一段回忆";
  }

  private generateMemorySummary(cluster: any): string {
    if (cluster.avgValence > 0.5) {
      return "想起来就会笑的回忆";
    }
    if (cluster.avgValence < -0.3) {
      return "虽然难过，但一起走过来了";
    }
    return "平凡却珍贵的日常";
  }
}
