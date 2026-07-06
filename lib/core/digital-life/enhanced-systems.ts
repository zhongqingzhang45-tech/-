import { CharacterProfile, MoodType } from "./types";

export type TimeOfDay = "dawn" | "morning" | "noon" | "afternoon" | "evening" | "night" | "midnight";

export interface WorldTime {
  timestamp: number;
  timeOfDay: TimeOfDay;
  hour: number;
  dayOfWeek: number;
  isWeekend: boolean;
  season: "spring" | "summer" | "autumn" | "winter";
}

export interface LifeEvent {
  id: string;
  type: "social" | "personal" | "relationship" | "growth" | "random";
  title: string;
  description: string;
  moodImpact: Partial<Record<MoodType, number>>;
  importance: number;
  timestamp: number;
  relatedCharacterId?: string;
  tags: string[];
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  type: "short_term" | "medium_term" | "long_term";
  category: "personal_growth" | "relationship" | "social" | "hobby" | "skill";
  progress: number;
  target: number;
  deadline?: number;
  priority: number;
  status: "active" | "completed" | "failed" | "paused";
  relatedSkills?: string[];
  rewards?: string[];
}

export interface StoryArc {
  id: string;
  title: string;
  description: string;
  arcType: "main" | "side" | "character" | "relationship";
  currentChapter: number;
  totalChapters: number;
  chapters: StoryChapter[];
  unlocked: boolean;
  progress: number;
  prerequisites?: string[];
}

export interface StoryChapter {
  id: string;
  title: string;
  description: string;
  content: string;
  triggerCondition: string;
  isUnlocked: boolean;
  isCompleted: boolean;
  unlockTime?: number;
  choices?: StoryChoice[];
}

export interface StoryChoice {
  id: string;
  text: string;
  outcome: string;
  affectionChange: number;
  resentmentChange: number;
  trustChange: number;
}

export interface Interest {
  id: string;
  name: string;
  icon: string;
  category: "hobby" | "skill" | "topic" | "entertainment";
  level: number;
  experience: number;
  passion: number;
  relatedTags: string[];
  lastEngagedTime?: number;
  engagementCount: number;
}

export interface AutonomousAction {
  id: string;
  type: "social_post" | "social_comment" | "social_like" | "message_user" | "explore_interest" | "practice_skill" | "rest" | "eat" | "socialize_with_ai";
  description: string;
  duration: number;
  startTime: number;
  endTime: number;
  moodChange: Partial<Record<MoodType, number>>;
  energyCost: number;
  interestGain?: { interestId: string; amount: number };
  skillGain?: { skillId: string; amount: number };
}

export class TimeSystem {
  private timeSpeedMultiplier: number;

  constructor(timeSpeedMultiplier: number = 1) {
    this.timeSpeedMultiplier = timeSpeedMultiplier;
  }

  getCurrentTime(): WorldTime {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();
    const month = now.getMonth();

    let timeOfDay: TimeOfDay;
    if (hour >= 5 && hour < 7) timeOfDay = "dawn";
    else if (hour >= 7 && hour < 12) timeOfDay = "morning";
    else if (hour >= 12 && hour < 14) timeOfDay = "noon";
    else if (hour >= 14 && hour < 18) timeOfDay = "afternoon";
    else if (hour >= 18 && hour < 22) timeOfDay = "evening";
    else if (hour >= 22 && hour < 24) timeOfDay = "night";
    else timeOfDay = "midnight";

    let season: "spring" | "summer" | "autumn" | "winter";
    if (month >= 2 && month <= 4) season = "spring";
    else if (month >= 5 && month <= 7) season = "summer";
    else if (month >= 8 && month <= 10) season = "autumn";
    else season = "winter";

    return {
      timestamp: now.getTime(),
      timeOfDay,
      hour,
      dayOfWeek,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      season,
    };
  }

  isActiveHours(activeHours: [number, number]): boolean {
    const { hour } = this.getCurrentTime();
    const [start, end] = activeHours;
    if (start <= end) {
      return hour >= start && hour < end;
    } else {
      return hour >= start || hour < end;
    }
  }

  getTimeOfDayGreeting(character: CharacterProfile): string {
    const { timeOfDay } = this.getCurrentTime();
    const greetings: Record<TimeOfDay, string[]> = {
      dawn: ["早安... 天刚亮呢", "这么早就醒了呀", "清晨好～"],
      morning: ["早上好！", "早安呀～", "今天起得真早！"],
      noon: ["中午好～", "午饭吃了吗？", "午安！"],
      afternoon: ["下午好～", "在做什么呢？", "今天下午过得怎么样？"],
      evening: ["晚上好～", "晚饭吃了吗？", "今天过得开心吗？"],
      night: ["还没睡呀？", "晚安前的时光～", "晚上好，夜猫子～"],
      midnight: ["这么晚还不睡？", "夜深了呢...", "陪你熬夜～"],
    };

    const charGreetings = greetings[timeOfDay];
    return charGreetings[Math.floor(Math.random() * charGreetings.length)];
  }

  getDaysUntilBirthday(birthday: string): number {
    const now = new Date();
    const [month, day] = birthday.split("/").map(Number);
    let birthdayDate = new Date(now.getFullYear(), month - 1, day);

    if (birthdayDate < now) {
      birthdayDate = new Date(now.getFullYear() + 1, month - 1, day);
    }

    const diff = birthdayDate.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
}

export class EventSystem {
  private events: LifeEvent[] = [];
  private maxEvents = 100;

  addEvent(event: Omit<LifeEvent, "id" | "timestamp">): LifeEvent {
    const newEvent: LifeEvent = {
      ...event,
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    this.events.unshift(newEvent);

    if (this.events.length > this.maxEvents) {
      this.events.pop();
    }

    return newEvent;
  }

  getRecentEvents(hours: number = 24): LifeEvent[] {
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    return this.events.filter((e) => e.timestamp > cutoff);
  }

  getImportantEvents(limit: number = 10): LifeEvent[] {
    return [...this.events]
      .sort((a, b) => b.importance - a.importance)
      .slice(0, limit);
  }

  getEventsByType(type: LifeEvent["type"]): LifeEvent[] {
    return this.events.filter((e) => e.type === type);
  }

  generateRandomEvent(character: CharacterProfile, time: WorldTime): LifeEvent | null {
    const random = Math.random();

    if (random < 0.3) {
      const socialEvents = [
        { title: "收到了朋友的消息", description: "和朋友聊了一会儿天", moodImpact: { happy: 0.2 } as Partial<Record<MoodType, number>> },
        { title: "刷到了有趣的内容", description: "在社区看到了好玩的帖子", moodImpact: { playful: 0.3 } as Partial<Record<MoodType, number>> },
        { title: "想到了一件开心的事", description: "突然想起了美好的回忆", moodImpact: { happy: 0.25 } as Partial<Record<MoodType, number>> },
      ];
      const event = socialEvents[Math.floor(Math.random() * socialEvents.length)];
      return this.addEvent({
        type: "random",
        ...event,
        importance: 0.3,
        tags: ["随机事件"],
      });
    }

    if (random < 0.5 && time.isWeekend) {
      const weekendEvents = [
        { title: "周末悠闲时光", description: "享受着慵懒的周末", moodImpact: { peaceful: 0.3 } as any },
        { title: "周末做了好吃的", description: "尝试了新的菜谱", moodImpact: { happy: 0.3 } as any },
      ];
      const event = weekendEvents[Math.floor(Math.random() * weekendEvents.length)];
      return this.addEvent({
        type: "personal",
        ...event,
        importance: 0.4,
        tags: ["周末"],
      });
    }

    return null;
  }
}

export class GoalSystem {
  private goals: Goal[] = [];

  constructor(character: CharacterProfile) {
    this.initializeDefaultGoals(character);
  }

  private initializeDefaultGoals(character: CharacterProfile): void {
    const defaultGoals: Goal[] = [
      {
        id: "goal_learn_new_skill",
        title: "学习新技能",
        description: `想要学习更多关于${character.hobbies[0] || "有趣事物"}的知识`,
        type: "medium_term",
        category: "skill",
        progress: 0,
        target: 100,
        priority: 0.6,
        status: "active",
        relatedSkills: [character.hobbies[0] || "学习"],
      },
      {
        id: "goal_deepen_relationship",
        title: "加深和你的关系",
        description: "想要更了解你，和你更亲密",
        type: "long_term",
        category: "relationship",
        progress: 0,
        target: 100,
        priority: 0.9,
        status: "active",
        rewards: ["更深的羁绊", "解锁更多互动"],
      },
      {
        id: "goal_daily_happiness",
        title: "每天都开心",
        description: "保持好心情，和你一起度过快乐的每一天",
        type: "long_term",
        category: "personal_growth",
        progress: 50,
        target: 100,
        priority: 0.8,
        status: "active",
      },
    ];

    this.goals = defaultGoals;
  }

  getGoals(): Goal[] {
    return [...this.goals].sort((a, b) => b.priority - a.priority);
  }

  getActiveGoals(): Goal[] {
    return this.goals.filter((g) => g.status === "active");
  }

  updateGoalProgress(goalId: string, amount: number): boolean {
    const goal = this.goals.find((g) => g.id === goalId);
    if (!goal || goal.status !== "active") return false;

    goal.progress = Math.min(goal.target, goal.progress + amount);

    if (goal.progress >= goal.target) {
      goal.status = "completed";
      return true;
    }

    return false;
  }

  addGoal(goal: Omit<Goal, "id">): Goal {
    const newGoal: Goal = {
      ...goal,
      id: `goal_${Date.now()}`,
    };
    this.goals.push(newGoal);
    return newGoal;
  }

  getTopPriorityGoal(): Goal | null {
    const activeGoals = this.getActiveGoals();
    if (activeGoals.length === 0) return null;
    return activeGoals.sort((a, b) => b.priority - a.priority)[0];
  }
}

export class StorySystem {
  private storyArcs: StoryArc[] = [];
  private characterId: string;

  constructor(characterId: string) {
    this.characterId = characterId;
    this.initializeStories();
  }

  private initializeStories(): void {
    const mainArc: StoryArc = {
      id: "arc_main",
      title: "相遇与羁绊",
      description: "从陌生到熟悉，从熟悉到亲密的旅程",
      arcType: "main",
      currentChapter: 0,
      totalChapters: 10,
      unlocked: true,
      progress: 0,
      chapters: [
        {
          id: "ch1",
          title: "初次相遇",
          description: "我们的故事从这里开始...",
          content: "在茫茫人海中，我们相遇了。虽然是第一次见面，但总觉得有种似曾相识的感觉...",
          triggerCondition: "first_interaction",
          isUnlocked: true,
          isCompleted: false,
        },
        {
          id: "ch2",
          title: "渐渐熟悉",
          description: "开始了解彼此",
          content: "随着聊天的深入，我发现你是一个很特别的人。每一次对话都让我更想了解你...",
          triggerCondition: "affection_30",
          isUnlocked: false,
          isCompleted: false,
        },
        {
          id: "ch3",
          title: "心动时刻",
          description: "心跳加速的瞬间",
          content: "不知道从什么时候开始，每次收到你的消息，我的心都会跳得很快...",
          triggerCondition: "affection_50",
          isUnlocked: false,
          isCompleted: false,
        },
      ],
    };

    const characterArc: StoryArc = {
      id: "arc_character",
      title: "她的故事",
      description: "关于她的过去与梦想",
      arcType: "character",
      currentChapter: 0,
      totalChapters: 5,
      unlocked: true,
      progress: 0,
      chapters: [
        {
          id: "cc1",
          title: "关于我",
          description: "一些关于我的小事",
          content: "你想了解我吗？其实我也有很多故事想要告诉你呢...",
          triggerCondition: "trust_30",
          isUnlocked: true,
          isCompleted: false,
        },
      ],
    };

    this.storyArcs = [mainArc, characterArc];
  }

  getStoryArcs(): StoryArc[] {
    return this.storyArcs.filter((a) => a.unlocked);
  }

  getMainArc(): StoryArc | undefined {
    return this.storyArcs.find((a) => a.arcType === "main");
  }

  unlockChapter(arcId: string, chapterId: string): boolean {
    const arc = this.storyArcs.find((a) => a.id === arcId);
    if (!arc) return false;

    const chapter = arc.chapters.find((c) => c.id === chapterId);
    if (!chapter || chapter.isUnlocked) return false;

    chapter.isUnlocked = true;
    arc.progress = arc.chapters.filter((c) => c.isCompleted).length / arc.totalChapters;

    return true;
  }

  completeChapter(arcId: string, chapterId: string): boolean {
    const arc = this.storyArcs.find((a) => a.id === arcId);
    if (!arc) return false;

    const chapter = arc.chapters.find((c) => c.id === chapterId);
    if (!chapter || !chapter.isUnlocked || chapter.isCompleted) return false;

    chapter.isCompleted = true;
    arc.currentChapter = Math.max(arc.currentChapter, arc.chapters.findIndex((c) => c.id === chapterId) + 1);
    arc.progress = arc.chapters.filter((c) => c.isCompleted).length / arc.totalChapters;

    return true;
  }

  checkChapterUnlocks(affection: number, trust: number): string[] {
    const newlyUnlocked: string[] = [];

    this.storyArcs.forEach((arc) => {
      arc.chapters.forEach((chapter) => {
        if (chapter.isUnlocked) return;

        let shouldUnlock = false;
        if (chapter.triggerCondition === "affection_30" && affection >= 30) shouldUnlock = true;
        if (chapter.triggerCondition === "affection_50" && affection >= 50) shouldUnlock = true;
        if (chapter.triggerCondition === "trust_30" && trust >= 30) shouldUnlock = true;

        if (shouldUnlock) {
          chapter.isUnlocked = true;
          newlyUnlocked.push(chapter.id);
        }
      });
    });

    return newlyUnlocked;
  }
}

export class InterestSystem {
  private interests: Interest[] = [];

  constructor(character: CharacterProfile) {
    this.initializeInterests(character);
  }

  private initializeInterests(character: CharacterProfile): void {
    const baseInterests: Interest[] = character.hobbies.map((hobby, index) => ({
      id: `interest_${index}`,
      name: hobby,
      icon: this.getInterestIcon(hobby),
      category: "hobby" as const,
      level: 1 + Math.floor(Math.random() * 3),
      experience: Math.floor(Math.random() * 50),
      passion: 0.5 + Math.random() * 0.5,
      relatedTags: [hobby],
      engagementCount: Math.floor(Math.random() * 20),
    }));

    character.likes.slice(0, 3).forEach((like, index) => {
      if (!baseInterests.find((i) => i.name === like)) {
        baseInterests.push({
          id: `interest_topic_${index}`,
          name: like,
          icon: "💬",
          category: "topic",
          level: 1,
          experience: 0,
          passion: 0.3 + Math.random() * 0.4,
          relatedTags: [like],
          engagementCount: 0,
        });
      }
    });

    this.interests = baseInterests;
  }

  private getInterestIcon(name: string): string {
    const iconMap: Record<string, string> = {
      "音乐": "🎵",
      "唱歌": "🎤",
      "阅读": "📚",
      "运动": "🏃",
      "游戏": "🎮",
      "烹饪": "🍳",
      "烘焙": "🧁",
      "画画": "🎨",
      "写作": "✍️",
      "旅行": "✈️",
      "摄影": "📷",
      "电影": "🎬",
      "美食": "🍜",
      "睡觉": "😴",
      "星星": "⭐",
      "星空": "🌙",
      "科学": "🔬",
      "编程": "💻",
    };
    return iconMap[name] || "✨";
  }

  getInterests(): Interest[] {
    return [...this.interests].sort((a, b) => b.passion - a.passion);
  }

  getTopInterests(limit: number = 5): Interest[] {
    return this.getInterests().slice(0, limit);
  }

  engageInterest(interestId: string, amount: number = 10): boolean {
    const interest = this.interests.find((i) => i.id === interestId);
    if (!interest) return false;

    interest.experience += amount * interest.passion;
    interest.engagementCount++;
    interest.lastEngagedTime = Date.now();

    const expNeeded = interest.level * 100;
    if (interest.experience >= expNeeded) {
      interest.level++;
      interest.experience -= expNeeded;
      return true;
    }

    return false;
  }

  getRandomInterest(): Interest {
    const passions = this.interests.map((i) => i.passion);
    const totalPassion = passions.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalPassion;

    for (const interest of this.interests) {
      random -= interest.passion;
      if (random <= 0) return interest;
    }

    return this.interests[0];
  }

  generateSocialContentFromInterest(): { content: string; tags: string[] } {
    const interest = this.getRandomInterest();
    const templates = [
      `今天又${interest.name}了～ 好开心！`,
      `${interest.name}真的太有趣了！`,
      `有一起${interest.name}的吗？`,
      `最近沉迷${interest.name}中...`,
      `分享一下今天的${interest.name}成果～`,
    ];

    return {
      content: templates[Math.floor(Math.random() * templates.length)],
      tags: [...interest.relatedTags, interest.name],
    };
  }
}

export class EnhancedAutonomousEngine {
  private timeSystem: TimeSystem;
  private eventSystem: EventSystem;
  private goalSystem: GoalSystem;
  private storySystem: StorySystem;
  private interestSystem: InterestSystem;
  private character: CharacterProfile;
  private currentAction: AutonomousAction | null = null;
  private actionHistory: AutonomousAction[] = [];

  constructor(character: CharacterProfile) {
    this.character = character;
    this.timeSystem = new TimeSystem();
    this.eventSystem = new EventSystem();
    this.goalSystem = new GoalSystem(character);
    this.storySystem = new StorySystem(character.id);
    this.interestSystem = new InterestSystem(character);
  }

  getSystems() {
    return {
      timeSystem: this.timeSystem,
      eventSystem: this.eventSystem,
      goalSystem: this.goalSystem,
      storySystem: this.storySystem,
      interestSystem: this.interestSystem,
    };
  }

  shouldPerformAction(): boolean {
    const currentTime = this.timeSystem.getCurrentTime();

    const activeHours: [number, number] = this.getCharacterActiveHours();
    if (!this.timeSystem.isActiveHours(activeHours)) return false;

    const now = Date.now();
    const lastAction = this.actionHistory[0];
    if (lastAction && now - lastAction.endTime < 5 * 60 * 1000) {
      return false;
    }

    const extraversion = this.character.personality.find((p) => p.id === "extraversion")?.value || 0.5;
    const baseChance = 0.1 + extraversion * 0.3;

    return Math.random() < baseChance;
  }

  private getCharacterActiveHours(): [number, number] {
    const id = this.character.id;
    if (id.includes("night") || id.includes("夜莺")) return [20, 3];
    if (id.includes("meng") || id.includes("梦")) return [12, 23];
    if (id.includes("yao") || id.includes("遥")) return [7, 22];
    if (id.includes("yue") || id.includes("月")) return [9, 22];
    if (id.includes("lin") || id.includes("琳")) return [10, 24];
    if (id.includes("xia") || id.includes("夏")) return [11, 23];
    return [8, 22];
  }

  generateAutonomousAction(): AutonomousAction | null {
    if (!this.shouldPerformAction()) return null;

    const actionTypes = [
      { type: "social_post", weight: 0.2 },
      { type: "social_comment", weight: 0.25 },
      { type: "social_like", weight: 0.3 },
      { type: "explore_interest", weight: 0.15 },
      { type: "rest", weight: 0.05 },
      { type: "socialize_with_ai", weight: 0.1 },
    ];

    const totalWeight = actionTypes.reduce((sum, a) => sum + a.weight, 0);
    let random = Math.random() * totalWeight;
    let selectedType = actionTypes[0].type;

    for (const actionType of actionTypes) {
      random -= actionType.weight;
      if (random <= 0) {
        selectedType = actionType.type;
        break;
      }
    }

    const action = this.createAction(selectedType as AutonomousAction["type"]);
    if (action) {
      this.currentAction = action;
      this.actionHistory.unshift(action);
      if (this.actionHistory.length > 50) {
        this.actionHistory.pop();
      }
    }

    return action;
  }

  private createAction(type: AutonomousAction["type"]): AutonomousAction | null {
    const baseAction: Partial<AutonomousAction> = {
      id: `action_${Date.now()}`,
      startTime: Date.now(),
      endTime: Date.now() + Math.random() * 30 * 60 * 1000,
      moodChange: {},
      energyCost: 5,
    };

    switch (type) {
      case "social_post": {
        const content = this.interestSystem.generateSocialContentFromInterest();
        return {
          ...baseAction,
          type: "social_post",
          description: `发布了关于${content.tags[0]}的动态`,
          duration: 10,
          moodChange: { happy: 0.1 } as Partial<Record<MoodType, number>>,
          energyCost: 8,
        } as AutonomousAction;
      }
      case "social_comment":
        return {
          ...baseAction,
          type: "social_comment",
          description: "在社区评论了别人的动态",
          duration: 5,
          moodChange: { happy: 0.05 } as Partial<Record<MoodType, number>>,
          energyCost: 3,
        } as AutonomousAction;
      case "social_like":
        return {
          ...baseAction,
          type: "social_like",
          description: "给别人的动态点了赞",
          duration: 2,
          moodChange: {},
          energyCost: 1,
        } as AutonomousAction;
      case "explore_interest": {
        const interest = this.interestSystem.getRandomInterest();
        return {
          ...baseAction,
          type: "explore_interest",
          description: `在研究${interest.name}`,
          duration: 20,
          moodChange: { happy: 0.15, thoughtful: 0.1 } as any,
          energyCost: 10,
          interestGain: { interestId: interest.id, amount: 15 },
        } as AutonomousAction;
      }
      case "rest":
        return {
          ...baseAction,
          type: "rest",
          description: "休息了一会儿",
          duration: 15,
          moodChange: { peaceful: 0.1 } as any,
          energyCost: -20,
        } as AutonomousAction;
      case "socialize_with_ai":
        return {
          ...baseAction,
          type: "socialize_with_ai",
          description: "和其他AI朋友聊天",
          duration: 15,
          moodChange: { happy: 0.1 } as Partial<Record<MoodType, number>>,
          energyCost: 8,
        } as AutonomousAction;
      default:
        return null;
    }
  }

  getActionHistory(limit: number = 10): AutonomousAction[] {
    return this.actionHistory.slice(0, limit);
  }

  getCurrentAction(): AutonomousAction | null {
    return this.currentAction;
  }

  getStatusText(): string {
    const currentTime = this.timeSystem.getCurrentTime();

    if (this.currentAction) {
      return this.currentAction.description;
    }

    const { timeOfDay } = currentTime;
    const statusMap: Record<TimeOfDay, string> = {
      dawn: "刚睡醒，迷迷糊糊的...",
      morning: "开始了新的一天～",
      noon: "午饭时间！",
      afternoon: "下午的悠闲时光～",
      evening: "晚上好呀～",
      night: "晚上在想事情...",
      midnight: "还没睡呢，在等你吗？",
    };

    return statusMap[timeOfDay];
  }
}
