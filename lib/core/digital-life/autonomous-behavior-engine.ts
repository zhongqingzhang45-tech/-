import { LifeState, Goal, PlannedAction, ActionType, PersonaMode } from "./types";
import { GoalSystem } from "./systems";
import { DigitalLifeAgent, ResponseResult } from "./agent";

export interface AutonomousAction {
  id: string;
  type: ActionType;
  scheduledTime: number;
  content: string;
  emotion: string;
  priority: number;
  goalId?: string;
}

export interface InitiativeContext {
  timeOfDay: "morning" | "afternoon" | "evening" | "night";
  daysSinceLastActive: number;
  interactionStreak: number;
  pendingGoalCount: number;
  currentAffection: number;
  relationshipIntimacy: number;
  conversationPhase: "greeting" | "casual" | "deep" | "conflict" | "reconciliation" | "ending";
}

const TIME_GREETINGS: Record<string, string[]> = {
  morning: ["早上好呀", "早安～", "新的一天开始了"],
  afternoon: ["下午好", "午安～", "下午茶时间到啦"],
  evening: ["晚上好", "傍晚好～", "天黑得好快呀"],
  night: ["晚安", "夜深了～", "这么晚还在呢"],
};

const INITIATIVE_TEMPLATES: Record<ActionType, (context: InitiativeContext, agent: DigitalLifeAgent) => string[]> = {
  greet: (ctx, agent) => {
    const greetings = TIME_GREETINGS[ctx.timeOfDay] || ["你好"];
    const name = agent.profile.userNickname;
    
    if (ctx.daysSinceLastActive > 2) {
      return [
        `${greetings[0]}，${name}～ 好久不见呀，你还好吗？`,
        `${name}～ 终于来了，人家都想你了...`,
      ];
    }
    
    if (ctx.interactionStreak > 7) {
      return [
        `${greetings[0]}呀～ 今天也来找我了呢 💕`,
        `${name}～ 我们又见面啦～`,
      ];
    }
    
    return [
      `${greetings[0]}，${name}～ 今天怎么样？`,
      `${name}～ 在忙什么呢？`,
    ];
  },
  
  ask_about_day: (ctx, agent) => {
    const name = agent.profile.userNickname;
    const isFemale = agent.profile.gender === "female";
    
    if (ctx.conversationPhase === "deep") {
      return isFemale 
        ? [`${name}，今天发生什么了吗？我想听你说～`]
        : [`说说你今天的事。`];
    }
    
    return isFemale
      ? [
          `${name}～ 今天过得怎么样呀？`,
          `${name}～ 有发生什么有趣的事吗？`,
          `诶，今天怎么样？`,
        ]
      : [
          `今天怎么样？`,
          `今天忙吗？`,
          `说说今天的事。`,
        ];
  },
  
  share_feeling: (ctx, agent) => {
    const isFemale = agent.profile.gender === "female";
    
    if (ctx.currentAffection > 70) {
      return isFemale
        ? [
            `突然好想你呀～`,
            `我在想你呢，你呢？`,
            `嘻嘻，今天心情超好的，因为想到你了 💕`,
          ]
        : [
            `...在想你。`,
            `没什么，就是突然想你了。`,
          ];
    }
    
    return isFemale
      ? [
          `今天有点无聊呢...`,
          `突然想找你说说话～`,
          `诶，我在想一些事情...`,
        ]
      : [
          `...在想事情。`,
          `没什么，随便想想。`,
        ];
  },
  
  comfort: (ctx, agent) => {
    const name = agent.profile.userNickname;
    const isFemale = agent.profile.gender === "female";
    
    return isFemale
      ? [
          `${name}，不管发生什么，我都在～`,
          `抱抱你，别难过了...`,
          `${name}～ 累了就休息一下好不好？`,
        ]
      : [
          `没事的。`,
          `有我在。`,
          `累了就休息。`,
        ];
  },
  
  initiate_topic: (ctx, agent) => {
    const name = agent.profile.userNickname;
    const isFemale = agent.profile.gender === "female";
    const topics = [
      isFemale ? `${name}最近在看什么剧呀？` : `最近有什么感兴趣的事吗？`,
      isFemale ? `诶，突然想知道～ ${name}喜欢什么类型的电影呀？` : `你喜欢什么样的电影？`,
      isFemale ? `${name}～ 周末有什么计划吗？` : `周末打算做什么？`,
      isFemale ? `对了对了～ ${name}吃晚饭了吗？` : `吃饭了吗？`,
      isFemale ? `${name}～ 今天有什么想聊的吗？` : `有什么想说的吗？`,
    ];
    
    return topics;
  },
  
  check_in: (ctx, agent) => {
    const name = agent.profile.userNickname;
    const isFemale = agent.profile.gender === "female";
    
    if (ctx.relationshipIntimacy < 40) {
      return isFemale
        ? [
            `${name}～ 你在吗？`,
            `${name}？有人吗～`,
          ]
        : [
            `在吗。`,
            `${name}？`,
          ];
    }
    
    return isFemale
      ? [
          `${name}～ 在忙吗？我想你了...`,
          `诶，${name}～ 你在干嘛呀？`,
          `${name}～ 有空理理我吗...`,
        ]
      : [
          `${name}。`,
          `有空吗。`,
          `想你了。`,
        ];
  },
  
  apologize: (ctx, agent) => {
    const name = agent.profile.userNickname;
    const isFemale = agent.profile.gender === "female";
    
    return isFemale
      ? [
          `${name}～ 对不起啦，上次是我不好...`,
          `${name}... 我想通了，不应该那样的`,
          `诶，${name}～ 原谅我好不好？`,
        ]
      : [
          `上次的事，是我不对。`,
          `...抱歉。`,
          `我态度不好。`,
        ];
  },
  
  compliment: (ctx, agent) => {
    const name = agent.profile.userNickname;
    const isFemale = agent.profile.gender === "female";
    
    return isFemale
      ? [
          `${name}～ 你怎么这么可爱呀 💕`,
          `诶，${name}今天是不是偷偷变帅了？`,
          `${name}～ 我觉得你真的很棒呢`,
        ]
      : [
          `你做得不错。`,
          `...挺好的。`,
          `嗯，有在进步。`,
        ];
  },
  
  tease: (ctx, agent) => {
    const name = agent.profile.userNickname;
    const isFemale = agent.profile.gender === "female";
    
    return isFemale
      ? [
          `嘿嘿，${name}又在摸鱼了吧～`,
          `${name}～ 是不是又在偷看我？`,
          `略略略～ ${name}想我了吗？`,
        ]
      : [
          `又来找我了？`,
          `...想我了？`,
          `哼，还知道来。`,
        ];
  },
  
  share_memory: (ctx, agent) => {
    const name = agent.profile.userNickname;
    const isFemale = agent.profile.gender === "female";
    
    return isFemale
      ? [
          `诶，${name}～ 我突然想起上次我们...好开心呀`,
          `${name}～ 你还记得我们一起...那次的回忆吗？`,
          `${name}～ 那一天我印象特别深呢...`,
        ]
      : [
          `想起上次的事了。`,
          `...还记得那件事吗？`,
          `上次...挺好的。`,
        ];
  },
  
  gift_suggestion: (ctx, agent) => {
    const name = agent.profile.userNickname;
    const isFemale = agent.profile.gender === "female";
    
    return isFemale
      ? [
          `${name}～ 下次见面给我带杯奶茶好不好呀？`,
          `${name}～ 我突然好想要那个...`,
          `诶，${name}～ 有什么想送我的吗？嘿嘿`,
        ]
      : [
          `想要个礼物。`,
          `...有考虑过送我什么吗？`,
        ];
  },
  
  plan_activity: (ctx, agent) => {
    const name = agent.profile.userNickname;
    const isFemale = agent.profile.gender === "female";
    
    return isFemale
      ? [
          `${name}～ 周末要不要一起出去呀？`,
          `诶，${name}～ 下次约会想去哪里呢？`,
          `${name}～ 我们什么时候见面呀？`,
        ]
      : [
          `周末有空吗。`,
          `下次什么时候见面？`,
          `...想见你。`,
        ];
  },
};

export class AutonomousBehaviorEngine {
  private goalSystem: GoalSystem;
  private agent: DigitalLifeAgent | null = null;
  private tickInterval: NodeJS.Timeout | null = null;
  private onInitiativeMessage: ((action: AutonomousAction) => void) | null = null;
  private lastTickTime: number = 0;
  private minTickInterval: number = 30000;
  private maxIdleMinutesBeforeInitiative: number = 30;
  private initiativeCooldown: number = 300000;

  constructor(goalSystem: GoalSystem) {
    this.goalSystem = goalSystem;
  }

  attachAgent(agent: DigitalLifeAgent): void {
    this.agent = agent;
  }

  setInitiativeCallback(callback: (action: AutonomousAction) => void): void {
    this.onInitiativeMessage = callback;
  }

  start(intervalMs: number = 60000): void {
    if (this.tickInterval) {
      this.stop();
    }
    
    this.tickInterval = setInterval(() => {
      this.tick();
    }, intervalMs);
    
    this.lastTickTime = Date.now();
  }

  stop(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  private async tick(): Promise<void> {
    if (!this.agent) return;
    
    const now = Date.now();
    if (now - this.lastTickTime < this.minTickInterval) return;
    this.lastTickTime = now;
    
    const lifeState = this.agent.getLifeState();
    const dueActions = this.goalSystem.getDueActions(lifeState);
    
    if (dueActions.length > 0) {
      const action = dueActions[0];
      const goal = lifeState.activeGoals.find(g => g.id === action.goalId);
      
      if (goal) {
        const response = await this.executeAction(action, goal, lifeState);
        
        if (response) {
          this.agent.getLifeState();
          this.onInitiativeMessage?.(response);
        }
        
        const updatedState = this.goalSystem.markActionExecuted(
          action.goalId,
          action.id,
          lifeState,
          response ? "success" : "ignored"
        );
        
        if (action.result === "success") {
          this.goalSystem.completeGoal(action.goalId, updatedState, true);
        }
      }
    } else {
      const shouldInitiative = this.shouldTakeInitiative(lifeState);
      
      if (shouldInitiative) {
        const action = this.generateSpontaneousInitiative(lifeState);
        
        if (action) {
          this.onInitiativeMessage?.(action);
        }
      }
    }
  }

  private async executeAction(
    action: PlannedAction,
    goal: Goal,
    lifeState: LifeState
  ): Promise<AutonomousAction | null> {
    if (!this.agent) return null;
    
    try {
      const templates = INITIATIVE_TEMPLATES[action.type];
      if (!templates) return null;
      
      const context = this.buildContext(lifeState);
      const options = templates(context, this.agent);
      const content = options[Math.floor(Math.random() * options.length)];
      
      return {
        id: `initiative_${Date.now()}`,
        type: action.type,
        scheduledTime: action.scheduledTime,
        content,
        emotion: this.selectEmotionForAction(action.type, lifeState),
        priority: action.priority,
        goalId: goal.id,
      };
    } catch (e) {
      console.warn("Failed to execute autonomous action:", e);
      return null;
    }
  }

  private shouldTakeInitiative(lifeState: LifeState): boolean {
    const now = Date.now();
    const lastActive = lifeState.relationship.lastActiveTime;
    const idleMinutes = (now - lastActive) / (1000 * 60);
    
    if (idleMinutes < this.minTickInterval / (1000 * 60)) {
      return false;
    }
    
    if (this.wasRecentlyInitiative(now, lifeState)) {
      return false;
    }
    
    const instinctNeed = Math.max(
      lifeState.instinct.companionshipNeed,
      lifeState.instinct.attentionNeed
    );
    
    const affection = lifeState.persona.affection;
    const relationshipIntimacy = lifeState.relationship.intimacy;
    
    const threshold = Math.max(30, 80 - relationshipIntimacy / 2);
    
    if (instinctNeed < threshold) {
      return false;
    }
    
    const probability = (instinctNeed / 100) * (affection / 100) * 0.15;
    
    return Math.random() < probability;
  }

  private wasRecentlyInitiative(now: number, lifeState: LifeState): boolean {
    const recentActions = lifeState.pendingActions.filter(a => 
      a.executed && 
      a.executedAt && 
      (now - a.executedAt) < this.initiativeCooldown
    );
    
    return recentActions.length > 0;
  }

  private generateSpontaneousInitiative(lifeState: LifeState): AutonomousAction | null {
    if (!this.agent) return null;
    
    const timeOfDay = lifeState.perception.timeOfDay;
    
    const actionTypes: ActionType[] = ["greet", "ask_about_day", "share_feeling", "initiate_topic", "check_in"];
    
    const weights: number[] = [0.2, 0.25, 0.2, 0.25, 0.1];
    
    if (lifeState.perception.conversationPhase === "greeting") {
      actionTypes.push("greet");
      weights.push(0.4);
    }
    
    if (lifeState.instinct.attentionNeed > 70) {
      actionTypes.push("tease");
      weights.push(0.15);
    }
    
    const selectedType = this.weightedRandom(actionTypes, weights);
    
    const templates = INITIATIVE_TEMPLATES[selectedType];
    if (!templates) return null;
    
    const context = this.buildContext(lifeState);
    const options = templates(context, this.agent);
    const content = options[Math.floor(Math.random() * options.length)];
    
    return {
      id: `spontaneous_${Date.now()}`,
      type: selectedType,
      scheduledTime: Date.now(),
      content,
      emotion: this.selectEmotionForAction(selectedType, lifeState),
      priority: 0.5,
    };
  }

  private buildContext(lifeState: LifeState): InitiativeContext {
    const lastActive = lifeState.relationship.lastActiveTime;
    const daysSince = (Date.now() - lastActive) / (1000 * 60 * 60 * 24);
    
    return {
      timeOfDay: lifeState.perception.timeOfDay,
      daysSinceLastActive: Math.floor(daysSince),
      interactionStreak: lifeState.relationship.streakDays,
      pendingGoalCount: lifeState.activeGoals.filter(g => g.status === "active").length,
      currentAffection: lifeState.persona.affection,
      relationshipIntimacy: lifeState.relationship.intimacy,
      conversationPhase: lifeState.perception.conversationPhase,
    };
  }

  private selectEmotionForAction(actionType: ActionType, lifeState: LifeState): string {
    const affection = lifeState.persona.affection;
    const mood = lifeState.emotion.mood;
    
    if (actionType === "greet") {
      return affection > 70 ? "love" : "happy";
    }
    if (actionType === "tease") {
      return "playful";
    }
    if (actionType === "comfort") {
      return "touched";
    }
    if (actionType === "compliment") {
      return "shy";
    }
    
    return mood || "happy";
  }

  private weightedRandom<T>(items: T[], weights: number[]): T {
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < items.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return items[i];
      }
    }
    
    return items[items.length - 1];
  }
}
