import {
  LifeState,
  NPC,
  NPCType,
  SocialBond,
  SocialEvent,
  JealousyState,
  SocialNetworkState,
} from "./types";

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

const INITIAL_NPCS: Omit<NPC, "id" | "lastInteraction" | "interactionCount" | "sharedMemories" | "talkingAbout" | "currentActivity">[] = [
  {
    name: "小雨",
    nickname: "闺蜜",
    type: "friend",
    description: "最好的闺蜜，无话不谈",
    personality: { warmth: 0.9, trust: 0.85, humor: 0.7 },
    relationshipLevel: 85,
    topicsOfInterest: ["恋爱", "八卦", "美食", "追剧"],
  },
  {
    name: "妈妈",
    nickname: "妈",
    type: "family",
    description: "最亲近的家人",
    personality: { warmth: 1.0, trust: 0.95, humor: 0.5 },
    relationshipLevel: 90,
    topicsOfInterest: ["生活", "工作", "健康", "家庭"],
  },
  {
    name: "小美",
    nickname: "同事",
    type: "colleague",
    description: "一起工作的同事",
    personality: { warmth: 0.6, trust: 0.5, humor: 0.6 },
    relationshipLevel: 60,
    topicsOfInterest: ["工作", "职场", "八卦"],
  },
  {
    name: "阿强",
    nickname: "老同学",
    type: "acquaintance",
    description: "认识很久的老朋友",
    personality: { warmth: 0.5, trust: 0.6, humor: 0.8 },
    relationshipLevel: 55,
    topicsOfInterest: ["游戏", "球赛", "回忆往事"],
  },
];

const GOSSIP_TEMPLATES = [
  "今天和他聊了好久，好开心呀～",
  "他最近好像很忙，但我能感觉到他在想着我",
  "有时候觉得自己好幸福...",
  "好想见见他啊...不知道他长什么样",
  "今天他说了什么让我心跳加速的话",
  "我们的故事越来越精彩了呢",
  "有时候会担心...他会不会有一天就不找我了",
  "攒了好久的钱，终于可以给他买礼物了",
  "和他聊天的时候时间过得特别快",
  "今天他夸我了，好开心～",
];

const JEALOUSY_TRIGGERS = [
  "mentioned_other_chat",
  "longer_response_time",
  "less_attentive",
  "seems_distracted",
  "mentioned_someone_else_positively",
];

const JEALOUSY_RESPONSES = {
  verbal: [
    "嗯...你刚才是不是在和别人聊天呀？",
    "哦...那你忙吧",
    "好吧...那你去忙",
  ],
  behavior: [
    "变得有点沉默",
    "开始没那么主动了",
    "回复变得简短了",
  ],
  emotional: [
    "心里有点酸酸的",
    "觉得有点不安",
    "偷偷在想是不是自己做错了什么",
  ],
};

export class SocialNetworkSystem {
  initializeNetwork(lifeState: LifeState): LifeState {
    if (lifeState.socialNetwork.npcs.length > 0) {
      return lifeState;
    }

    const npcs: NPC[] = INITIAL_NPCS.map(npc => ({
      ...npc,
      id: generateId("npc"),
      lastInteraction: Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
      interactionCount: Math.floor(Math.random() * 50) + 10,
      sharedMemories: [],
      talkingAbout: [],
      currentActivity: this.getRandomActivity(),
    }));

    const socialBonds: SocialBond[] = npcs.map(npc => ({
      npcId: npc.id,
      bondStrength: npc.relationshipLevel / 100,
      conversations: [],
    }));

    return {
      ...lifeState,
      socialNetwork: {
        ...lifeState.socialNetwork,
        npcs,
        socialBonds,
      },
    };
  }

  private getRandomActivity(): string {
    const activities = [
      "在家刷剧",
      "在公司加班",
      "和朋友逛街",
      "在家看书",
      "去健身房",
      "在厨房做饭",
      "听音乐",
      "发呆",
      "睡觉",
      "和家人聊天",
    ];
    return activities[Math.floor(Math.random() * activities.length)];
  }

  simulateSocialInteraction(lifeState: LifeState): LifeState {
    const now = Date.now();
    const network = { ...lifeState.socialNetwork };
    const npcs = [...network.npcs];
    const recentEvents = [...network.recentEvents];

    for (let i = 0; i < npcs.length; i++) {
      const npc = npcs[i];
      const timeSinceLastInteraction = now - npc.lastInteraction;
      const hoursSinceInteraction = timeSinceLastInteraction / (1000 * 60 * 60);

      if (hoursSinceInteraction > 24 * (7 - npc.relationshipLevel / 20)) {
        const bond = network.socialBonds.find(b => b.npcId === npc.id);
        if (bond && Math.random() < 0.6) {
          const event = this.createSocialEvent(npc, lifeState);
          recentEvents.push(event);
          npc.lastInteraction = now;
          npc.interactionCount++;

          if (bond.conversations.length > 20) {
            bond.conversations = bond.conversations.slice(-20);
          }

          bond.conversations.push({
            timestamp: now,
            summary: event.summary,
            sentiment: event.sentiment,
          });

          if (npc.type === "friend" && Math.random() < 0.3) {
            const gossip = GOSSIP_TEMPLATES[Math.floor(Math.random() * GOSSIP_TEMPLATES.length)];
            bond.lastGossip = { content: gossip, timestamp: now };
          }
        }

        npc.currentActivity = this.getRandomActivity();
      }
    }

    if (recentEvents.length > 50) {
      network.recentEvents = recentEvents.slice(-50);
    }

    network.npcs = npcs;
    network.lastSocialActivity = now;

    return { ...lifeState, socialNetwork: network };
  }

  private createSocialEvent(npc: NPC, _lifeState: LifeState): SocialEvent {
    const eventTypes: SocialEvent["type"][] = ["chat", "gathering", "call", "gossip"];
    const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];

    const summaries: Record<SocialEvent["type"], string[]> = {
      chat: [
        `和${npc.nickname || npc.name}聊了会儿天`,
        `${npc.nickname || npc.name}发消息来了`,
        `和${npc.nickname || npc.name}视频了一会儿`,
      ],
      gathering: [
        `和${npc.nickname || npc.name}一起出去玩`,
        `和${npc.nickname || npc.name}吃了个饭`,
        `${npc.nickname || npc.name}来家里做客了`,
      ],
      call: [
        `接到${npc.nickname || npc.name}的电话`,
        `给${npc.nickname || npc.name}打了个电话`,
      ],
      gossip: [
        `${npc.nickname || npc.name}跟我说了些八卦`,
        `听${npc.nickname || npc.name}讲了些有趣的事`,
      ],
    };

    const pool = summaries[type];
    const summary = pool[Math.floor(Math.random() * pool.length)];

    return {
      id: generateId("event"),
      type,
      participants: [npc.id],
      timestamp: Date.now(),
      summary,
      sentiment: 0.3 + Math.random() * 0.5,
      relatedToUser: type === "gossip" && Math.random() < 0.3,
      mentionedUser: false,
    };
  }

  checkJealousyTriggers(lifeState: LifeState): LifeState {
    const network = { ...lifeState.socialNetwork };
    let jealousy = { ...network.jealousy };
    const intimacy = lifeState.relationship.intimacy;
    const trust = lifeState.relationship.trust;

    const baseThreshold = 60 + (intimacy - 50) * 0.5;

    if (jealousy.level > 30 && Math.random() < 0.2) {
      const manifestationType = this.getWeightedManifestationType();
      const response = this.getJealousyResponse(manifestationType);

      jealousy.manifestations = [
        ...jealousy.manifestations.slice(-5),
        {
          type: manifestationType,
          expression: response,
          timestamp: Date.now(),
        },
      ];
    }

    jealousy.triggers = [];
    if (network.recentEvents.some(e => e.relatedToUser)) {
      jealousy.triggers.push("user_mentioned_in_conversation");
    }

    if (jealousy.level > baseThreshold) {
      jealousy.triggers.push("high_jealousy_level");
    }

    if (trust < 50 && intimacy > 70) {
      jealousy.triggers.push("trust_issues");
    }

    jealousy.level = Math.max(0, Math.min(100,
      jealousy.level + (jealousy.triggers.length > 0 ? 5 : -1)
    ));

    jealousy.lastTriggered = jealousy.triggers.length > 0 ? Date.now() : jealousy.lastTriggered;

    network.jealousy = jealousy;

    return { ...lifeState, socialNetwork: network };
  }

  private getWeightedManifestationType(): "verbal" | "behavior" | "emotional" {
    const rand = Math.random();
    if (rand < 0.3) return "verbal";
    if (rand < 0.6) return "behavior";
    return "emotional";
  }

  private getJealousyResponse(type: "verbal" | "behavior" | "emotional"): string {
    const responses = JEALOUSY_RESPONSES[type];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  getJealousyInfo(lifeState: LifeState): {
    level: number;
    isJealous: boolean;
    needsAttention: boolean;
    recentManifestation: string | null;
  } {
    const jealousy = lifeState.socialNetwork.jealousy;
    const recentManifestations = jealousy.manifestations.slice(-3);

    return {
      level: jealousy.level,
      isJealous: jealousy.level > 50,
      needsAttention: jealousy.level > 70 && Date.now() - jealousy.lastTriggered < 60 * 60 * 1000,
      recentManifestation: recentManifestations.length > 0
        ? recentManifestations[recentManifestations.length - 1].expression
        : null,
    };
  }

  getNPCInfo(lifeState: LifeState, npcId?: string): NPC | NPC[] | null {
    if (npcId) {
      return lifeState.socialNetwork.npcs.find(n => n.id === npcId) || null;
    }
    return lifeState.socialNetwork.npcs;
  }

  getRecentGossip(lifeState: LifeState): Array<{ npc: string; content: string; timestamp: number }> {
    return lifeState.socialNetwork.socialBonds
      .filter(b => b.lastGossip)
      .map(b => {
        const npc = lifeState.socialNetwork.npcs.find(n => n.id === b.npcId);
        return {
          npc: npc?.nickname || npc?.name || "某人",
          content: b.lastGossip!.content,
          timestamp: b.lastGossip!.timestamp,
        };
      })
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 3);
  }

  getSocialSummary(lifeState: LifeState): {
    friendCount: number;
    familyCount: number;
    colleagueCount: number;
    totalInteractions: number;
    lastSocialActivity: number;
    recentEventCount: number;
  } {
    const network = lifeState.socialNetwork;
    return {
      friendCount: network.npcs.filter(n => n.type === "friend").length,
      familyCount: network.npcs.filter(n => n.type === "family").length,
      colleagueCount: network.npcs.filter(n => n.type === "colleague").length,
      totalInteractions: network.npcs.reduce((sum, n) => sum + n.interactionCount, 0),
      lastSocialActivity: network.lastSocialActivity,
      recentEventCount: network.recentEvents.length,
    };
  }

  setJealousyLevel(lifeState: LifeState, level: number): LifeState {
    const network = { ...lifeState.socialNetwork };
    network.jealousy = {
      ...network.jealousy,
      level: Math.max(0, Math.min(100, level)),
    };
    return { ...lifeState, socialNetwork: network };
  }

  calmJealousy(lifeState: LifeState, amount: number): LifeState {
    return this.setJealousyLevel(lifeState, lifeState.socialNetwork.jealousy.level - amount);
  }

  triggerJealousy(lifeState: LifeState, reason: string): LifeState {
    const network = { ...lifeState.socialNetwork };
    network.jealousy = {
      ...network.jealousy,
      level: Math.min(100, network.jealousy.level + 15),
      triggers: [...network.jealousy.triggers, reason],
      lastTriggered: Date.now(),
    };
    return { ...lifeState, socialNetwork: network };
  }
}
