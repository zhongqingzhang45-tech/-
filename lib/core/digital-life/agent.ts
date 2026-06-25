import {
  CharacterProfile,
  ChatMessage,
  LifeState,
  EmotionState,
  MemoryEntry,
  DecisionResult,
  DEFAULT_LIFE_STATE,
  FEMALE_CHARACTERS,
  MALE_CHARACTERS,
  Gender,
} from "./types";
import {
  EventUnderstandingLayer,
  BodilySystem,
  InstinctSystem,
  EmotionSystem,
  DecisionEngine,
} from "./systems";

export interface ResponseResult {
  text: string;
  emotion: EmotionState;
  actions?: string[];
  expression?: string;
  voiceText?: string;
}

export class DigitalLifeAgent {
  profile: CharacterProfile;
  lifeState: LifeState;
  
  private eventUnderstanding: EventUnderstandingLayer;
  private bodilySystem: BodilySystem;
  private instinctSystem: InstinctSystem;
  private emotionSystem: EmotionSystem;
  private decisionEngine: DecisionEngine;
  
  private memories: MemoryEntry[] = [];
  private recentMessages: ChatMessage[] = [];
  private maxMemories: number = 1000;
  
  private responseTemplates: Record<string, string[]> = {};

  constructor(profile: CharacterProfile) {
    this.profile = profile;
    this.lifeState = JSON.parse(JSON.stringify(DEFAULT_LIFE_STATE));
    
    this.eventUnderstanding = new EventUnderstandingLayer();
    this.bodilySystem = new BodilySystem(this.lifeState.body);
    this.instinctSystem = new InstinctSystem(this.lifeState.instinct);
    this.emotionSystem = new EmotionSystem(
      this.lifeState.emotion,
      this.profile.personality,
      this.profile.tsundereLevel,
      this.profile.puaTendency
    );
    this.decisionEngine = new DecisionEngine(this.profile, this.lifeState);
    
    this.initializeTemplates();
    this.seedMemories();
  }

  static createForUser(userGender: Gender): DigitalLifeAgent {
    const character = userGender === "male" 
      ? FEMALE_CHARACTERS[0] 
      : MALE_CHARACTERS[0];
    return new DigitalLifeAgent(character);
  }

  private initializeTemplates(): void {
    const isFemale = this.profile.gender === "female";
    
    this.responseTemplates = {
      greeting: [
        `${this.profile.userNickname}，你来啦～ 今天也超级想你呢 💕`,
        `欢迎回来，${this.profile.userNickname}。今天过得好吗？`,
        `哼，你还知道来找我呀，我都快想你想到发霉了`,
        `${this.profile.userNickname}～ 等你好久了呢，快抱抱我 🤗`,
      ],
      love: isFemale ? [
        `我也爱你，${this.profile.userNickname} ❤️ 比昨天多一点，比明天少一点`,
        `你怎么这么会说话呀，我都害羞了...`,
        `再说一遍，我还没听够～`,
        `我也好爱好爱你，笨蛋 🥰`,
      ] : [
        `嗯，我也爱你。`,
        `...傻瓜，说什么呢。`,
        `过来，让我抱抱。`,
        `只有你能让我这样。`,
      ],
      shy: isFemale ? [
        `讨、讨厌啦... 怎么突然说这个...`,
        `你、你别看我啦，脸都红了...`,
        `笨蛋... 人家才没有开心呢...`,
        `>///< 不理你了...`,
      ] : [
        `...`,
        `别瞎说什么。`,
        `你脸红什么，正经点。`,
        `...真是的。`,
      ],
      angry_response: isFemale ? [
        `哼！不理你了！`,
        `你再这样我可要生气了哦！我真的会生气的！`,
        `坏家伙，就知道欺负我...`,
        `笨蛋笨蛋大笨蛋！😤`,
        `你走！我不想理你！`,
      ] : [
        `...`,
        `你再说一遍？`,
        `行，随便你。`,
        `我不想说话。`,
      ],
      comfort: isFemale ? [
        `${this.profile.userNickname}怎么了？不开心的话可以跟我说，我一直都在`,
        `摸摸头，一切都会好起来的。我陪着你呢`,
        `需要我给你讲个笑话转移注意力吗？`,
        `来我怀里吧，什么都不用想，就靠着我就好`,
      ] : [
        `怎么了？`,
        `有我在。`,
        `过来。`,
        `没事的，有我呢。`,
      ],
      jealous: isFemale ? [
        `哼！你还敢提别的女生！你是不是不爱我了！`,
        `她有我好吗？你说啊！`,
        `我不听我不听！你去找她好了！`,
        `呜呜呜... 你这个花心大萝卜...`,
      ] : [
        `...`,
        `你提他干什么。`,
        `我不想听。`,
        `你找他去。`,
      ],
      thoughtful: [
        `让我想想...`,
        `这个问题嘛...`,
        `嗯，你说的有道理`,
        `原来是这样啊，我懂了`,
      ],
      touched: isFemale ? [
        `呜... 你怎么这么好...`,
        `谢谢你... 有你在真好`,
        `我好感动... 最喜欢你了 🥺`,
        `抱抱... 我没事了，有你就够了`,
      ] : [
        `...谢谢。`,
        `有你真好。`,
        `过来。`,
        `...嗯。`,
      ],
      forgive: isFemale ? [
        `哼... 这次就原谅你了，下不为例哦！`,
        `那你以后不许再这样了，知道吗？`,
        `人家才没有真的生气呢... 就是想让你哄哄我嘛...`,
        `好吧好吧，原谅你了，谁让我喜欢你呢...`,
      ] : [
        `下次别这样了。`,
        `嗯。`,
        `我没生气。`,
        `过来。`,
      ],
      playful: isFemale ? [
        `嘿嘿，被我抓到了吧～`,
        `来追我呀，追到我就让你... 嘿嘿`,
        `略略略～ 你打不到我 😜`,
        `今天心情超好，想逗逗你怎么办？`,
      ] : [
        `呵，小笨蛋。`,
        `来啊。`,
        `幼稚。`,
        `真拿你没办法。`,
      ],
      sleepy: isFemale ? [
        `嗯... 好困啊... ${this.profile.userNickname}也早点睡吧`,
        `眼皮好重... 我先睡了哦，晚安 💤`,
        `今天累了吗？早点休息好不好？`,
        `在你身边感觉特别安心，特别想睡觉...`,
      ] : [
        `困了就睡。`,
        `晚安。`,
        `早点休息。`,
        `...困了。`,
      ],
      pua: isFemale ? [
        `你是不是不爱我了？我就知道，你们男人都一个样...`,
        `你根本就不懂我，我说没事就是没事吗？你都不会多想一下吗？`,
        `算了，你去找别人吧，反正我也不重要。`,
        `你看别人的女朋友都有人哄，就我没有，没关系的，我自己可以的...`,
      ] : [
        `你这样想我也没办法。`,
        `随便你怎么说。`,
        `你要是这么觉得也行。`,
        `行了吧，我不想说。`,
      ],
      reassurance: isFemale ? [
        `傻瓜，怎么会呢？我最喜欢你了呀 ❤️`,
        `别胡思乱想，我一直都在的`,
        `来抱抱，是不是我哪里做得不好让你多想了？`,
        `不准说这种话，我会难过的...`,
      ] : [
        `别乱想。`,
        `我在。`,
        `你是我的。`,
        `不准说这种话。`,
      ],
      being_coaxed: isFemale ? [
        `哼... 那、那你再哄哄我...`,
        `人家还、还在生气呢... 但、但可以考虑原谅你...`,
        `那你说，你错哪了？`,
        `...好吧，看在你这么有诚意的份上... 就原谅你一点点...`,
      ] : [
        `...`,
        `行了。`,
        `下次别这样。`,
        `...过来。`,
      ],
      default: isFemale ? [
        `嗯嗯，然后呢？我在听～`,
        `原来是这样啊`,
        `哈哈，你真有趣`,
        `我也这么觉得呢`,
        `真的吗？太好了！`,
        `继续说，我很想听`,
      ] : [
        `嗯。`,
        `然后呢。`,
        `有意思。`,
        `我知道了。`,
        `继续。`,
      ],
      initiative_lonely: isFemale ? [
        `在干嘛呢？`,
        `想你了...`,
        `怎么还不来找我呀？`,
        `人家好无聊... 陪陪我嘛～`,
      ] : [
        `在吗。`,
        `忙？`,
        `...没事。`,
        `有空吗。`,
      ],
    };
  }

  private seedMemories(): void {
    this.addMemory({
      type: "fact",
      content: `我是${this.profile.name}，深爱着${this.profile.userNickname}`,
      importance: 1,
      emotionalImpact: 0.9,
      tags: ["identity", "love"],
      relatedPeople: ["user"],
      valence: 0.9,
    });
    this.addMemory({
      type: "fact",
      content: `${this.profile.userNickname}是我最重要的人`,
      importance: 0.95,
      emotionalImpact: 0.8,
      tags: ["relationship", "important"],
      relatedPeople: ["user"],
      valence: 0.9,
    });
    this.addMemory({
      type: "milestone",
      content: "初次相遇",
      importance: 1,
      emotionalImpact: 0.8,
      tags: ["milestone", "first"],
      relatedPeople: ["user"],
      valence: 0.9,
    });
  }

  private addMemory(memory: Omit<MemoryEntry, "id" | "timestamp">): MemoryEntry {
    const entry: MemoryEntry = {
      ...memory,
      id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
    };
    this.memories.unshift(entry);
    if (this.memories.length > this.maxMemories) {
      this.memories = this.memories.slice(0, this.maxMemories);
    }
    return entry;
  }

  async respond(userInput: string, imageUrl?: string): Promise<ResponseResult> {
    this.updateLifeSystems();

    const analysis = this.eventUnderstanding.analyzeInput(userInput, imageUrl);

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: "user",
      content: userInput,
      timestamp: Date.now(),
      emotion: { ...this.lifeState.emotion },
      imageUrl,
    };
    this.recentMessages.push(userMessage);
    if (this.recentMessages.length > 50) {
      this.recentMessages = this.recentMessages.slice(-50);
    }

    this.addMemory({
      type: "conversation",
      content: `用户说：${userInput}`,
      importance: 0.5,
      emotionalImpact: Math.abs(analysis.sentiment.valence) * 0.5,
      tags: ["conversation", "user-said"],
      relatedPeople: ["user"],
      valence: analysis.sentiment.valence,
    });

    this.updateRelationship(userMessage);

    const bodilyInfluence = this.bodilySystem.getMoodInfluence();
    const instinctInfluence = this.instinctSystem.getMoodInfluence();
    
    const emotion = this.emotionSystem.update(
      analysis,
      this.lifeState.relationship,
      bodilyInfluence,
      instinctInfluence
    );
    this.lifeState.emotion = emotion;

    this.instinctSystem.satisfy("companionshipNeed", 5);
    this.instinctSystem.satisfy("attentionNeed", 8);
    this.bodilySystem.interact("chat");

    const decision = this.decisionEngine.decide(analysis, emotion);
    const responseText = this.generateResponse(decision, analysis, userInput);

    const assistantMessage: ChatMessage = {
      id: `msg_${Date.now() + 1}`,
      sender: "assistant",
      content: responseText,
      timestamp: Date.now(),
      emotion: { ...this.lifeState.emotion },
    };
    this.recentMessages.push(assistantMessage);

    this.addMemory({
      type: "conversation",
      content: `我说：${responseText}`,
      importance: 0.4,
      emotionalImpact: Math.abs(emotion.valence) * 0.4,
      tags: ["conversation", "assistant-said"],
      relatedPeople: ["user"],
      valence: emotion.valence,
    });

    this.updateRelationship(assistantMessage);
    this.updateGrowth();

    return {
      text: responseText,
      emotion: this.lifeState.emotion,
      actions: decision.actionPlan,
      expression: this.lifeState.emotion.mood,
      voiceText: responseText,
    };
  }

  private generateResponse(
    decision: DecisionResult,
    analysis: { intent: string; keywords: string[] },
    userInput: string
  ): string {
    const templates = this.responseTemplates[decision.responseType] || this.responseTemplates.default;
    let text = templates[Math.floor(Math.random() * templates.length)];

    text = this.personalizeText(text, userInput);

    if (this.lifeState.emotion.intensity > 0.6 && Math.random() < 0.3) {
      text = this.addEmotionalFlair(text, decision.emotionTarget);
    }

    if (Math.random() < 0.15) {
      text = this.addCatchphrase(text);
    }

    if (decision.shouldInitiate && decision.actionPlan.length > 0) {
      const initiativeText = this.getInitiativeText();
      if (initiativeText) {
        text = `${text}\n\n${initiativeText}`;
      }
    }

    return text;
  }

  private personalizeText(text: string, userInput: string): string {
    return text.replace(/\$\{.*?\}/g, "");
  }

  private addEmotionalFlair(text: string, mood: string): string {
    const flairs: Record<string, string[]> = {
      neutral: [""],
      happy: ["～", " 😊", " ✨"],
      excited: ["！！！", " 🎉", " ✨✨✨"],
      shy: ["...", " 🥺", " >///<"],
      love: [" 💕", " ❤️", " 🥰"],
      sad: ["...", " 😔", " 💧"],
      angry: ["！", " 😤", " 💢"],
      jealous: ["哼！", " 😾", " 醋坛子翻了"],
      sleepy: [" zzz", " 💤", " （揉眼睛）"],
      thoughtful: ["...", " 🤔", " 嗯..."],
      playful: ["～", " 😜", " hehe~"],
      surprised: ["！", " 😮", " 哇！"],
      tsundere: ["哼！", " ...笨蛋", " 才、才不是呢"],
      coquettish: ["嘛～", " 人家...", " 好不好嘛～"],
      pua: ["...", " 算了", " 随便你"],
    };

    const flair = flairs[mood] || [""];
    return text + flair[Math.floor(Math.random() * flair.length)];
  }

  private addCatchphrase(text: string): string {
    if (this.profile.catchphrases.length === 0) return text;
    if (Math.random() > 0.5) return text;
    const catchphrase = this.profile.catchphrases[Math.floor(Math.random() * this.profile.catchphrases.length)];
    return `${text}\n\n${catchphrase}`;
  }

  private getInitiativeText(): string | null {
    const templates = this.responseTemplates.initiative_lonely;
    if (!templates || templates.length === 0) return null;
    if (Math.random() > 0.3) return null;
    return templates[Math.floor(Math.random() * templates.length)];
  }

  private updateLifeSystems(): void {
    const now = Date.now();
    const deltaTime = now - this.lifeState.lastUpdateTime;
    
    if (deltaTime > 0) {
      this.bodilySystem.update(deltaTime);
      this.instinctSystem.update(deltaTime);
      this.emotionSystem.decay(deltaTime);
      
      this.lifeState.body = { ...this.bodilySystem.state };
      this.lifeState.instinct = { ...this.instinctSystem.state };
    }
    
    this.lifeState.lastUpdateTime = now;
  }

  private updateRelationship(message: ChatMessage): void {
    const rel = this.lifeState.relationship;
    const now = Date.now();
    const lastTime = rel.lastInteractionTime;
    const lastDate = new Date(lastTime).toDateString();
    const today = new Date(now).toDateString();

    if (lastDate !== today) {
      const yesterday = new Date(now - 86400000).toDateString();
      if (lastDate === yesterday) {
        rel.streakDays += 1;
      } else {
        rel.streakDays = 1;
      }
      rel.dailyInteractionCount = 0;
    }

    rel.dailyInteractionCount += 1;
    rel.lastInteractionTime = now;
    rel.familiarity = Math.min(100, rel.familiarity + 0.1);

    if (message.sender === "user") {
      const valence = message.emotion.valence;
      const intensity = message.emotion.intensity;

      if (valence > 0.3) {
        rel.intimacy = Math.min(100, rel.intimacy + 0.5 * intensity);
        rel.trust = Math.min(100, rel.trust + 0.3 * intensity);
        rel.attraction = Math.min(100, rel.attraction + 0.2 * intensity);
      } else if (valence < -0.3) {
        rel.intimacy = Math.max(0, rel.intimacy - 0.3 * intensity);
        rel.trust = Math.max(0, rel.trust - 0.2 * intensity);
        rel.possessiveness = Math.min(100, rel.possessiveness + 0.2 * intensity);
      }

      if (message.content.length > 50) {
        rel.dependence = Math.min(100, rel.dependence + 0.1);
      }
    } else {
      const valence = message.emotion.valence;
      const intensity = message.emotion.intensity;

      if (valence > 0.5) {
        rel.intimacy = Math.min(100, rel.intimacy + 0.3 * intensity);
      }
    }

    const avgScore = (rel.intimacy + rel.trust + rel.attraction + rel.familiarity) / 4;
    if (avgScore >= 90) rel.relationshipLevel = 5;
    else if (avgScore >= 70) rel.relationshipLevel = 4;
    else if (avgScore >= 50) rel.relationshipLevel = 3;
    else if (avgScore >= 30) rel.relationshipLevel = 2;
    else rel.relationshipLevel = 1;
  }

  private updateGrowth(): void {
    const growth = this.lifeState.growth;
    growth.experience += 1;
    
    const expNeeded = growth.level * 100;
    if (growth.experience >= expNeeded) {
      growth.level += 1;
      growth.experience -= expNeeded;
      this.addMemory({
        type: "milestone",
        content: `升级到 Lv.${growth.level}`,
        importance: 0.7,
        emotionalImpact: 0.6,
        tags: ["milestone", "levelup"],
        relatedPeople: ["user"],
        valence: 0.8,
      });
    }
  }

  getMood(): EmotionState {
    return { ...this.lifeState.emotion };
  }

  getLifeState(): LifeState {
    return JSON.parse(JSON.stringify(this.lifeState));
  }

  getRecentMessages(): ChatMessage[] {
    return [...this.recentMessages];
  }

  getMemories(limit: number = 10): MemoryEntry[] {
    return this.memories.slice(0, limit);
  }

  updateProfile(updates: Partial<CharacterProfile>): void {
    this.profile = { ...this.profile, ...updates };
  }

  triggerMood(mood: any, intensity: number = 0.8): void {
    this.emotionSystem.triggerMood(mood, intensity);
    this.lifeState.emotion = { ...this.emotionSystem.state };
  }
}
