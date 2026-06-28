import {
  WorldView,
  WorldViewDimension,
  Opinion,
  OpinionStrength,
  LifeState,
  MemoryEntry,
} from "./types";

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

const OPINION_TOPICS: Record<WorldViewDimension, { topics: string[]; defaultPosition: number }> = {
  love_view: {
    topics: ["爱情应该是怎样的", "异地恋可行吗", "一见钟情靠谱吗", "爱情里的安全感", "恋爱中该有私人空间吗"],
    defaultPosition: 0.5,
  },
  life_view: {
    topics: ["人生的意义是什么", "应该及时行乐还是长远规划", "平凡的人生算失败吗", "人为什么要努力", "什么是幸福"],
    defaultPosition: 0.5,
  },
  work_view: {
    topics: ["工作的意义是什么", "996值得吗", "兴趣和工作应该分开吗", "稳定和挑战选哪个", "职场需要圆滑吗"],
    defaultPosition: 0.5,
  },
  money_view: {
    topics: ["钱能买到幸福吗", "爱情和面包哪个重要", "存钱还是享受当下", "钱是赚出来的还是省出来的", "有钱人的快乐你想象不到"],
    defaultPosition: 0.5,
  },
  family_view: {
    topics: ["婚姻是必须的吗", "孩子是家庭的必需品吗", "应该和父母一起住吗", "原生家庭的影响有多大", "家庭和事业怎么平衡"],
    defaultPosition: 0.5,
  },
  friendship_view: {
    topics: ["朋友的定义是什么", "异性之间有纯友谊吗", "朋友应该借钱吗", "友情会变淡吗", "朋友需要天天联系吗"],
    defaultPosition: 0.5,
  },
  art_view: {
    topics: ["什么是美", "艺术有高低之分吗", "流行音乐算艺术吗", "电影的意义是什么", "什么样的画是好画"],
    defaultPosition: 0.5,
  },
  nature_view: {
    topics: ["人应该亲近自然吗", "城市生活好还是乡村好", "环保重要吗", "动物有感情吗", "下雨天舒服还是晴天舒服"],
    defaultPosition: 0.5,
  },
  technology_view: {
    topics: ["科技让人更幸福吗", "AI会取代人类吗", "应该沉迷手机吗", "未来会更好还是更坏", "技术有善恶吗"],
    defaultPosition: 0.5,
  },
  morality_view: {
    topics: ["什么是对什么是错", "善意的谎言可以说吗", "为了目的可以不择手段吗", "正义是什么", "人性本善还是本恶"],
    defaultPosition: 0.5,
  },
};

export class WorldViewSystem {
  getOpinionOnTopic(lifeState: LifeState, topic: string): Opinion | null {
    return lifeState.worldView.opinions.find(o => o.topic === topic) || null;
  }

  getOpinionsByDimension(lifeState: LifeState, dimension: WorldViewDimension): Opinion[] {
    return lifeState.worldView.opinions.filter(o => o.dimension === dimension);
  }

  formOpinion(
    lifeState: LifeState,
    topic: string,
    dimension: WorldViewDimension,
    position: number,
    strength: OpinionStrength = "weak",
    reason: string = ""
  ): { lifeState: LifeState; opinion: Opinion } {
    const existing = this.getOpinionOnTopic(lifeState, topic);
    
    if (existing) {
      return this.updateOpinion(lifeState, topic, position, reason);
    }

    const opinion: Opinion = {
      id: generateId("opinion"),
      topic,
      dimension,
      position: Math.max(-1, Math.min(1, position)),
      strength,
      formedAt: Date.now(),
      lastUpdatedAt: Date.now(),
      confidence: this.strengthToConfidence(strength),
      relatedExperiences: [],
      supportingMemories: [],
      isSharedWithUser: false,
      evolutionHistory: [],
    };

    const worldView = {
      ...lifeState.worldView,
      opinions: [...lifeState.worldView.opinions, opinion],
    };

    return {
      lifeState: { ...lifeState, worldView },
      opinion,
    };
  }

  updateOpinion(
    lifeState: LifeState,
    topic: string,
    newPosition: number,
    reason: string = ""
  ): { lifeState: LifeState; opinion: Opinion; changed: boolean } {
    const opinion = this.getOpinionOnTopic(lifeState, topic);
    if (!opinion) {
      return {
        lifeState,
        opinion: {} as Opinion,
        changed: false,
      };
    }

    const delta = newPosition - opinion.position;
    const resistance = this.getResistanceFactor(opinion.strength);
    const actualDelta = delta * resistance;
    
    const updatedPosition = Math.max(-1, Math.min(1, opinion.position + actualDelta));
    const changed = Math.abs(actualDelta) > 0.01;

    if (!changed) {
      return { lifeState, opinion, changed: false };
    }

    const newStrength = this.updateStrength(opinion.strength, Math.abs(actualDelta));
    const newConfidence = this.strengthToConfidence(newStrength);

    const updatedOpinion: Opinion = {
      ...opinion,
      position: updatedPosition,
      strength: newStrength,
      confidence: newConfidence,
      lastUpdatedAt: Date.now(),
      evolutionHistory: [
        ...opinion.evolutionHistory,
        {
          timestamp: Date.now(),
          oldPosition: opinion.position,
          newPosition: updatedPosition,
          reason,
        },
      ],
    };

    const opinions = lifeState.worldView.opinions.map(o =>
      o.id === opinion.id ? updatedOpinion : o
    );

    const worldView = { ...lifeState.worldView, opinions };

    return {
      lifeState: { ...lifeState, worldView },
      opinion: updatedOpinion,
      changed: true,
    };
  }

  influenceOpinionFromInteraction(
    lifeState: LifeState,
    userPosition: number,
    dimension: WorldViewDimension,
    topic?: string,
    interactionQuality: number = 0
  ): LifeState {
    const trust = lifeState.relationship.trust / 100;
    const intimacy = lifeState.relationship.intimacy / 100;
    const similarity = 1 - Math.abs(userPosition - 0.5);
    
    const influenceFactor = trust * 0.4 + intimacy * 0.3 + similarity * 0.2 + interactionQuality * 0.1;
    
    let targetTopic = topic;
    if (!targetTopic) {
      const topics = OPINION_TOPICS[dimension].topics;
      const existingOpinions = this.getOpinionsByDimension(lifeState, dimension);
      const availableTopics = topics.filter(t => 
        !existingOpinions.find(o => o.topic === t)
      );
      
      if (availableTopics.length > 0) {
        targetTopic = availableTopics[Math.floor(Math.random() * availableTopics.length)];
      } else {
        targetTopic = topics[Math.floor(Math.random() * topics.length)];
      }
    }

    const existing = this.getOpinionOnTopic(lifeState, targetTopic);
    
    if (!existing) {
      const initialPosition = 0.5 + (userPosition - 0.5) * influenceFactor * 0.5;
      return this.formOpinion(lifeState, targetTopic, dimension, initialPosition, "weak", "初次思考这个问题").lifeState;
    }

    const shiftAmount = (userPosition - existing.position) * influenceFactor * 0.1;
    const reason = `与用户讨论后调整（信任度: ${Math.round(trust * 100)}%）`;
    
    return this.updateOpinion(lifeState, targetTopic, existing.position + shiftAmount, reason).lifeState;
  }

  getRandomTopicForDiscussion(lifeState: LifeState): { topic: string; dimension: WorldViewDimension } | null {
    const allTopics: Array<{ topic: string; dimension: WorldViewDimension }> = [];
    
    for (const [dim, data] of Object.entries(OPINION_TOPICS) as [WorldViewDimension, typeof OPINION_TOPICS[WorldViewDimension]][]) {
      for (const topic of data.topics) {
        allTopics.push({ topic, dimension: dim });
      }
    }

    const weighted = allTopics.map(t => {
      const existing = this.getOpinionOnTopic(lifeState, t.topic);
      let weight = 1;
      
      if (existing) {
        weight = existing.isSharedWithUser ? 0.3 : 0.8;
        if (existing.strength === "conviction") {
          weight *= 0.5;
        }
      } else {
        weight = 1.2;
      }

      const intimacy = lifeState.relationship.intimacy / 100;
      if (intimacy < 0.3 && t.dimension === "morality_view") {
        weight *= 0.3;
      }
      if (intimacy < 0.5 && t.dimension === "love_view") {
        weight *= 0.5;
      }

      return { ...t, weight };
    });

    const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
    let random = Math.random() * totalWeight;

    for (const w of weighted) {
      random -= w.weight;
      if (random <= 0) {
        return { topic: w.topic, dimension: w.dimension };
      }
    }

    return weighted[weighted.length - 1];
  }

  markOpinionShared(lifeState: LifeState, topic: string): LifeState {
    const worldView = {
      ...lifeState.worldView,
      opinions: lifeState.worldView.opinions.map(o =>
        o.topic === topic ? { ...o, isSharedWithUser: true } : o
      ),
    };
    return { ...lifeState, worldView };
  }

  getBeliefAlignment(lifeState: LifeState): { dimension: string; value: number }[] {
    const beliefs = lifeState.worldView.beliefSystem;
    return Object.entries(beliefs).map(([dimension, value]) => ({
      dimension,
      value,
    })).sort((a, b) => b.value - a.value);
  }

  updateCoreValue(lifeState: LifeState, value: keyof WorldView["beliefSystem"], delta: number): LifeState {
    const beliefSystem = { ...lifeState.worldView.beliefSystem };
    const current = beliefSystem[value];
    const maxDelta = 0.1;
    const actualDelta = Math.max(-maxDelta, Math.min(maxDelta, delta * 0.01));
    
    beliefSystem[value] = Math.max(0, Math.min(1, current + actualDelta));

    const worldView = { ...lifeState.worldView, beliefSystem };
    return { ...lifeState, worldView };
  }

  private getResistanceFactor(strength: OpinionStrength): number {
    switch (strength) {
      case "weak": return 0.8;
      case "moderate": return 0.5;
      case "strong": return 0.2;
      case "conviction": return 0.05;
    }
  }

  private updateStrength(current: OpinionStrength, delta: number): OpinionStrength {
    const strengths: OpinionStrength[] = ["weak", "moderate", "strong", "conviction"];
    const currentIndex = strengths.indexOf(current);
    
    if (delta > 0.05) {
      return strengths[Math.min(strengths.length - 1, currentIndex + 1)];
    }
    if (delta < 0.02) {
      return strengths[Math.max(0, currentIndex - 1)];
    }
    
    return current;
  }

  private strengthToConfidence(strength: OpinionStrength): number {
    switch (strength) {
      case "weak": return 0.3;
      case "moderate": return 0.55;
      case "strong": return 0.8;
      case "conviction": return 0.95;
    }
  }

  getOpinionCount(lifeState: LifeState): number {
    return lifeState.worldView.opinions.length;
  }

  getStrongOpinions(lifeState: LifeState): Opinion[] {
    return lifeState.worldView.opinions.filter(o => 
      o.strength === "strong" || o.strength === "conviction"
    );
  }
}
