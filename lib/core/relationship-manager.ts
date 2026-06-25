import { RelationshipState, ChatMessage, EmotionState } from "./types";

export class RelationshipManager {
  private state: RelationshipState;

  constructor(initialState?: Partial<RelationshipState>) {
    this.state = {
      intimacy: 50,
      trust: 50,
      dependence: 30,
      attraction: 60,
      familiarity: 20,
      dailyInteractionCount: 0,
      lastInteractionTime: Date.now(),
      streakDays: 1,
      ...initialState,
    };
  }

  getState(): RelationshipState {
    return { ...this.state };
  }

  recordInteraction(message: ChatMessage): void {
    const now = Date.now();
    const lastTime = this.state.lastInteractionTime;
    const lastDate = new Date(lastTime).toDateString();
    const today = new Date(now).toDateString();

    if (lastDate !== today) {
      const yesterday = new Date(now - 86400000).toDateString();
      if (lastDate === yesterday) {
        this.state.streakDays += 1;
      } else {
        this.state.streakDays = 1;
      }
      this.state.dailyInteractionCount = 0;
    }

    this.state.dailyInteractionCount += 1;
    this.state.lastInteractionTime = now;
    this.state.familiarity = Math.min(100, this.state.familiarity + 0.1);

    if (message.sender === "user") {
      this.updateFromUserMessage(message);
    } else {
      this.updateFromAssistantMessage(message);
    }
  }

  private updateFromUserMessage(message: ChatMessage): void {
    const { emotion } = message;
    const valence = emotion.valence;
    const intensity = emotion.intensity;

    if (valence > 0.3) {
      this.state.intimacy = Math.min(100, this.state.intimacy + 0.5 * intensity);
      this.state.trust = Math.min(100, this.state.trust + 0.3 * intensity);
      this.state.attraction = Math.min(100, this.state.attraction + 0.2 * intensity);
    } else if (valence < -0.3) {
      this.state.intimacy = Math.max(0, this.state.intimacy - 0.3 * intensity);
      this.state.trust = Math.max(0, this.state.trust - 0.2 * intensity);
    }

    const messageLength = message.content.length;
    if (messageLength > 50) {
      this.state.dependence = Math.min(100, this.state.dependence + 0.1);
    }
  }

  private updateFromAssistantMessage(message: ChatMessage): void {
    const { emotion } = message;
    const valence = emotion.valence;
    const intensity = emotion.intensity;

    if (valence > 0.5) {
      this.state.intimacy = Math.min(100, this.state.intimacy + 0.3 * intensity);
    }
  }

  getRelationshipLevel(): { level: number; title: string; description: string } {
    const avgScore =
      (this.state.intimacy + this.state.trust + this.state.attraction + this.state.familiarity) / 4;

    if (avgScore >= 90) {
      return { level: 5, title: "灵魂伴侣", description: "心意相通，彼此是对方生命中最重要的人" };
    }
    if (avgScore >= 70) {
      return { level: 4, title: "热恋中", description: "甜蜜而热烈，每一天都充满期待" };
    }
    if (avgScore >= 50) {
      return { level: 3, title: "确定关系", description: "彼此确认心意，正式在一起" };
    }
    if (avgScore >= 30) {
      return { level: 2, title: "暧昧期", description: "互有好感，关系在慢慢升温中" };
    }
    return { level: 1, title: "初识", description: "刚刚认识，一切都充满新鲜感" };
  }

  getMoodModifier(): number {
    const avgScore =
      (this.state.intimacy + this.state.trust + this.state.attraction) / 3;
    return 0.7 + (avgScore / 100) * 0.6;
  }

  shouldInitiateConversation(): boolean {
    const timeSinceLastInteraction = Date.now() - this.state.lastInteractionTime;
    const hoursSinceLast = timeSinceLastInteraction / (1000 * 60 * 60);

    if (hoursSinceLast < 1) return false;
    if (this.state.dailyInteractionCount < 3) return true;

    const baseChance = (this.state.dependence / 100) * 0.3;
    const timeBonus = Math.min(0.5, hoursSinceLast / 24);

    return Math.random() < baseChance + timeBonus;
  }

  getProactiveTopics(): string[] {
    const topics: string[] = [];
    const hour = new Date().getHours();

    if (hour >= 6 && hour < 10) {
      topics.push("早安问候", "今天的计划", "早餐吃了什么");
    } else if (hour >= 11 && hour < 14) {
      topics.push("午饭时间", "今天吃什么", "上午过得怎么样");
    } else if (hour >= 17 && hour < 20) {
      topics.push("晚饭时间", "今天过得好吗", "下班了吗");
    } else if (hour >= 21 && hour < 24) {
      topics.push("睡前聊天", "今天最开心的事", "晚安");
    } else {
      topics.push("想你了", "在干嘛呢", "想和你说说话");
    }

    if (this.state.intimacy > 70) {
      topics.push("说点甜言蜜语", "想抱抱你", "梦到你了");
    }

    return topics;
  }
}
