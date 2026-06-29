/**
 * 因果系统
 * 建立事件→情绪→行为的链条
 * 让过去的经历影响当前和未来的决策
 */

export interface CausalEvent {
  id: string;
  timestamp: number;
  type: 'user-action' | 'character-response' | 'milestone' | 'conflict' | 'reconciliation';
  description: string;
  emotionalValence: number; // [-1, 1] 负面到正面
  emotionalIntensity: number; // [0, 1]
  consequences: string[]; // 这个事件导致了什么
  relatedEvents: string[]; // 相关的其他事件
}

export interface CausalChain {
  id: string;
  events: CausalEvent[];
  theme: string; // 例如: "信任被破坏" | "共同成长" | "冷战"
  resolution?: string; // 如何被解决的
  impact: number; // [0, 1] 这条链对整体关系的影响
}

export class CausalSystem {
  private events: CausalEvent[] = [];
  private chains: CausalChain[] = [];
  private readonly maxEvents = 5000;
  private eventWeights: Map<string, number> = new Map();

  constructor() {}

  /**
   * 添加因果事件
   */
  addEvent(event: Omit<CausalEvent, 'id' | 'timestamp'>): CausalEvent {
    const causalEvent: CausalEvent = {
      ...event,
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
    };

    this.events.unshift(causalEvent);
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(0, this.maxEvents);
    }

    // 更新因果链
    this.updateChains(causalEvent);

    // 计算事件权重
    this.calculateEventWeight(causalEvent);

    return causalEvent;
  }

  /**
   * 计算事件权重
   * 强烈的情感事件权重更大
   * 最近发生的事件权重更大
   */
  private calculateEventWeight(event: CausalEvent): void {
    const emotionalWeight = Math.abs(event.emotionalValence) * event.emotionalIntensity;
    const recencyWeight = Math.exp(-(Date.now() - event.timestamp) / (30 * 24 * 60 * 60 * 1000)); // 30天衰减期
    const weight = emotionalWeight * recencyWeight;

    this.eventWeights.set(event.id, weight);
  }

  /**
   * 更新因果链
   * 识别相关的事件集合
   */
  private updateChains(newEvent: CausalEvent): void {
    // 检查是否应该启动新链或加入现有链
    if (newEvent.type === 'conflict' || newEvent.type === 'milestone') {
      // 这是链的起点
      const newChain: CausalChain = {
        id: `chain_${Date.now()}`,
        events: [newEvent],
        theme: this.inferTheme(newEvent),
        impact: Math.abs(newEvent.emotionalValence * newEvent.emotionalIntensity),
      };
      this.chains.unshift(newChain);
    } else {
      // 尝试加入现有的链
      const relatedChain = this.findRelatedChain(newEvent);
      if (relatedChain) {
        relatedChain.events.unshift(newEvent);
        relatedChain.impact = Math.max(
          relatedChain.impact,
          Math.abs(newEvent.emotionalValence * newEvent.emotionalIntensity)
        );
      }
    }

    // 清理过期的链
    if (this.chains.length > 100) {
      this.chains = this.chains.slice(0, 80);
    }
  }

  /**
   * 推断事件的主题
   */
  private inferTheme(event: CausalEvent): string {
    if (event.emotionalValence < -0.5 && event.type === 'conflict') {
      return '关系冲突';
    }
    if (event.emotionalValence > 0.7 && event.type === 'milestone') {
      return '共同成长';
    }
    if (event.type === 'reconciliation') {
      return '和解';
    }
    return '其他';
  }

  /**
   * 查找相关的因果链
   */
  private findRelatedChain(event: CausalEvent): CausalChain | null {
    // 查找最近且相关的链
    for (const chain of this.chains) {
      const lastEvent = chain.events[chain.events.length - 1];
      const timeDiff = event.timestamp - lastEvent.timestamp;

      // 如果在7天内且主题相关，则加入这条链
      if (timeDiff < 7 * 24 * 60 * 60 * 1000) {
        const hasRelation = event.relatedEvents.some(
          (id) => chain.events.some((e) => e.id === id)
        );
        if (hasRelation || chain.events.length < 10) {
          return chain;
        }
      }
    }
    return null;
  }

  /**
   * 获取影响当前行为的主要事件
   * 用于生成上下文
   */
  getInfluentialEvents(limit: number = 5): CausalEvent[] {
    return [...this.events]
      .map((event) => ({
        event,
        weight: this.eventWeights.get(event.id) || 0,
      }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, limit)
      .map(({ event }) => event);
  }

  /**
   * 获取未解决的冲突
   */
  getUnresolvedConflicts(): CausalChain[] {
    return this.chains.filter(
      (chain) => chain.theme === '关系冲突' && !chain.resolution
    );
  }

  /**
   * 标记冲突为已解决
   */
  resolveConflict(chainId: string, resolution: string): void {
    const chain = this.chains.find((c) => c.id === chainId);
    if (chain) {
      chain.resolution = resolution;
    }
  }

  /**
   * 获取成长里程碑
   */
  getGrowthMilestones(): CausalChain[] {
    return this.chains.filter((chain) => chain.theme === '共同成长');
  }

  /**
   * 生成因果链的叙述
   * 用于让LLM理解整个故事
   */
  generateCausalNarrative(maxChains: number = 3): string {
    const narratives: string[] = [];

    // ��取影响最大的链
    const topChains = [...this.chains]
      .sort((a, b) => b.impact - a.impact)
      .slice(0, maxChains);

    for (const chain of topChains) {
      const eventDescriptions = chain.events
        .slice(0, 3)
        .map((e) => e.description)
        .join(" → ");

      let narrative = `${chain.theme}: ${eventDescriptions}`;
      if (chain.resolution) {
        narrative += ` [已解决: ${chain.resolution}]`;
      } else if (chain.theme === '关系冲突') {
        narrative += ` [未解决，心里还有些失落]`;
      }

      narratives.push(narrative);
    }

    return narratives.join('\n\n') || '我们的故事才刚开始呢～';
  }

  /**
   * 检查是否应该主动提起过去的事件
   * 用于自主决策
   */
  shouldBringUpPastEvent(): CausalEvent | null {
    const unresolved = this.getUnresolvedConflicts();
    if (unresolved.length > 0) {
      // 如果有未解决的冲突，有可能主动提起
      const conflict = unresolved[0];
      const mostRecentEvent = conflict.events[0];

      // 如果冲突是最近发生的，更容易主动提起
      const daysSinceConflict =
        (Date.now() - mostRecentEvent.timestamp) / (24 * 60 * 60 * 1000);

      if (daysSinceConflict < 7 && Math.random() < 0.3) {
        return mostRecentEvent;
      }
    }

    // 有时候会主动提起正面的里程碑
    const milestones = this.getGrowthMilestones();
    if (milestones.length > 0 && Math.random() < 0.15) {
      return milestones[0].events[0];
    }

    return null;
  }

  /**
   * 获取所有事件
   */
  getAllEvents(): CausalEvent[] {
    return [...this.events];
  }

  /**
   * 获取事件统计
   */
  getEventStats() {
    const stats = {
      totalEvents: this.events.length,
      totalChains: this.chains.length,
      conflictCount: this.chains.filter((c) => c.theme === '关系冲突').length,
      milestoneCount: this.chains.filter((c) => c.theme === '共同成长').length,
      unresolvedConflicts: this.getUnresolvedConflicts().length,
      averageEmotionalIntensity:
        this.events.length > 0
          ? (
              this.events.reduce(
                (sum, e) => sum + Math.abs(e.emotionalValence * e.emotionalIntensity),
                0
              ) / this.events.length
            ).toFixed(2)
          : 0,
    };
    return stats;
  }

  /**
   * 清空所有数据
   */
  clear(): void {
    this.events = [];
    this.chains = [];
    this.eventWeights.clear();
  }
}
