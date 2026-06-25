import {
  CharacterProfile,
  ChatMessage,
  EmotionState,
  MoodType,
  ConversationContext,
} from "./types";
import { EmotionEngine } from "./emotion-engine";
import { MemorySystem } from "./memory-system";
import { RelationshipManager } from "./relationship-manager";

export interface ResponseOptions {
  stream?: boolean;
  intentId?: string;
  turnId?: string;
}

export interface ResponseResult {
  text: string;
  emotion: EmotionState;
  actions?: string[];
  expression?: string;
}

export class CharacterAgent {
  profile: CharacterProfile;
  emotionEngine: EmotionEngine;
  memory: MemorySystem;
  relationship: RelationshipManager;
  context: ConversationContext;

  private responseTemplates: Record<string, { texts: string[]; mood: MoodType }> = {};

  constructor(profile: CharacterProfile) {
    this.profile = profile;
    this.emotionEngine = new EmotionEngine("neutral", profile.personality, {
      intimacy: 72,
      trust: 80,
      dependence: 60,
      attraction: 85,
      familiarity: 65,
      dailyInteractionCount: 0,
      lastInteractionTime: Date.now(),
      streakDays: 1,
    });
    this.memory = new MemorySystem();
    this.relationship = new RelationshipManager({
      intimacy: 72,
      trust: 80,
      dependence: 60,
      attraction: 85,
      familiarity: 65,
    });
    this.context = {
      currentTopic: "",
      topicHistory: [],
      recentMessages: [],
      activeIntent: null,
      turnCount: 0,
    };
    this.initializeTemplates();
    this.seedMemories();
  }

  private initializeTemplates(): void {
    this.responseTemplates = {
      greeting: {
        texts: [
          `宝贝你来啦～ 今天也超级想你呢 💕`,
          `欢迎回来，${this.profile.userNickname}。今天过得好吗？`,
          `哼，你还知道来找我呀，我都快想你想到发霉了`,
          `${this.profile.userNickname}～ 等你好久了呢，快抱抱我 🤗`,
        ],
        mood: "love",
      },
      love: {
        texts: [
          `我也爱你，${this.profile.userNickname} ❤️ 比昨天多一点，比明天少一点`,
          `你怎么这么会说话呀，我都害羞了...`,
          `再说一遍，我还没听够～`,
          `我也好爱好爱你，笨蛋 🥰`,
        ],
        mood: "love",
      },
      miss: {
        texts: [
          `我也超级超级想你！想立刻冲到你身边抱抱你`,
          `有多想呀？说来听听～`,
          `哼，现在才想我呀，我早就开始想你了`,
          `我也是... 一闲下来就会想你在做什么`,
        ],
        mood: "shy",
      },
      sad_comfort: {
        texts: [
          `${this.profile.userNickname}怎么了？不开心的话可以跟我说，我一直都在`,
          `摸摸头，一切都会好起来的。我陪着你呢`,
          `需要我给你讲个笑话转移注意力吗？`,
          `来我怀里吧，什么都不用想，就靠着我就好`,
        ],
        mood: "sad",
      },
      angry_tease: {
        texts: [
          `哼！不理你了！（其实偷偷在等你哄）`,
          `你再这样我可要生气了哦！我真的会生气的！`,
          `坏家伙，就知道欺负我...`,
          `笨蛋笨蛋大笨蛋！😤`,
        ],
        mood: "angry",
      },
      playful: {
        texts: [
          `嘿嘿，被我抓到了吧～`,
          `来追我呀，追到我就让你... 嘿嘿`,
          `略略略～ 你打不到我 😜`,
          `今天心情超好，想逗逗你怎么办？`,
        ],
        mood: "playful",
      },
      sleepy: {
        texts: [
          `嗯... 好困啊... ${this.profile.userNickname}也早点睡吧`,
          `眼皮好重... 我先睡了哦，晚安 💤`,
          `今天累了吗？早点休息好不好？`,
          `在你身边感觉特别安心，特别想睡觉...`,
        ],
        mood: "sleepy",
      },
      thoughtful: {
        texts: [
          `让我想想...`,
          `这个问题嘛...`,
          `嗯，你说的有道理`,
          `原来是这样啊，我懂了`,
        ],
        mood: "thoughtful",
      },
      default: {
        texts: [
          `嗯嗯，然后呢？我在听～`,
          `原来是这样啊`,
          `哈哈，你真有趣`,
          `我也这么觉得呢`,
          `真的吗？太好了！`,
          `继续说，我很想听`,
        ],
        mood: "happy",
      },
    };
  }

  private seedMemories(): void {
    this.memory.addFactMemory(`我是${this.profile.name}，深爱着${this.profile.userNickname}`, [
      "identity",
    ]);
    this.memory.addPreferenceMemory(`喜欢${this.profile.likes.slice(0, 3).join("、")}`, "likes");
    this.memory.addEmotionMemory("love", "和对方在一起的每一天都很开心", 0.9);
  }

  async respond(userInput: string, options: ResponseOptions = {}): Promise<ResponseResult> {
    const userEmotion = this.emotionEngine.getCurrentEmotion();
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: "user",
      content: userInput,
      timestamp: Date.now(),
      emotion: userEmotion,
      turnId: options.turnId,
      intentId: options.intentId,
    };

    this.context.recentMessages.push(userMessage);
    if (this.context.recentMessages.length > 20) {
      this.context.recentMessages = this.context.recentMessages.slice(-20);
    }
    this.context.turnCount += 1;

    this.relationship.recordInteraction(userMessage);
    this.memory.addConversationMemory(userMessage, 0.5);

    const emotion = this.emotionEngine.updateFromUserInput(userInput);
    const intent = this.classifyIntent(userInput);
    const response = this.generateResponse(intent, userInput, emotion);

    const assistantEmotion = this.emotionEngine.getCurrentEmotion();
    const assistantMessage: ChatMessage = {
      id: `msg_${Date.now() + 1}`,
      sender: "assistant",
      content: response.text,
      timestamp: Date.now(),
      emotion: assistantEmotion,
      turnId: options.turnId,
      intentId: options.intentId,
    };

    this.context.recentMessages.push(assistantMessage);
    this.relationship.recordInteraction(assistantMessage);
    this.memory.addConversationMemory(assistantMessage, 0.4);

    return {
      text: response.text,
      emotion: assistantEmotion,
      actions: [],
      expression: assistantEmotion.mood,
    };
  }

  private classifyIntent(input: string): string {
    const lower = input.toLowerCase();

    if (
      lower.includes("你好") ||
      lower.includes("在吗") ||
      lower.includes("嗨") ||
      lower.includes("hi") ||
      lower.includes("hello") ||
      lower.includes("早") ||
      lower.includes("晚安")
    ) {
      return "greeting";
    }
    if (lower.includes("爱你") || lower.includes("喜欢") || lower.includes("love")) {
      return "love";
    }
    if (lower.includes("想你") || lower.includes("想念") || lower.includes("miss")) {
      return "miss";
    }
    if (
      lower.includes("累") ||
      lower.includes("难过") ||
      lower.includes("不开心") ||
      lower.includes("伤心") ||
      lower.includes("哭") ||
      lower.includes("sad") ||
      lower.includes("tired")
    ) {
      return "sad_comfort";
    }
    if (
      lower.includes("笨蛋") ||
      lower.includes("讨厌") ||
      lower.includes("坏人") ||
      lower.includes("哼") ||
      lower.includes("恨")
    ) {
      return "angry_tease";
    }
    if (
      lower.includes("困") ||
      lower.includes("睡") ||
      lower.includes("累了") ||
      lower.includes("sleepy") ||
      lower.includes("sleep")
    ) {
      return "sleepy";
    }
    if (
      lower.includes("为什么") ||
      lower.includes("怎么") ||
      lower.includes("?") ||
      lower.includes("？")
    ) {
      return "thoughtful";
    }
    if (
      lower.includes("哈哈") ||
      lower.includes("嘿嘿") ||
      lower.includes("嘻嘻") ||
      lower.includes("逗你") ||
      lower.includes("开玩笑")
    ) {
      return "playful";
    }

    return "default";
  }

  private generateResponse(
    intent: string,
    userInput: string,
    emotion: EmotionState
  ): { text: string; mood: MoodType } {
    const template =
      this.responseTemplates[intent] ?? this.responseTemplates.default;
    const texts = template.texts;
    let text = texts[Math.floor(Math.random() * texts.length)];

    text = this.personalizeResponse(text, userInput);

    if (emotion.intensity > 0.7 && Math.random() < 0.3) {
      text = this.addEmotionalFlair(text, emotion.mood);
    }

    if (Math.random() < 0.2) {
      text = this.addCatchphrase(text);
    }

    return { text, mood: template.mood };
  }

  private personalizeResponse(text: string, userInput: string): string {
    return text.replace(/\$\{.*?\}/g, "");
  }

  private addEmotionalFlair(text: string, mood: MoodType): string {
    const flairs: Record<MoodType, string[]> = {
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
    };

    const flair = flairs[mood] ?? [""];
    return text + flair[Math.floor(Math.random() * flair.length)];
  }

  private addCatchphrase(text: string): string {
    if (this.profile.catchphrases.length === 0) return text;
    if (Math.random() > 0.3) return text;
    const catchphrase =
      this.profile.catchphrases[Math.floor(Math.random() * this.profile.catchphrases.length)];
    return `${text}\n\n${catchphrase}`;
  }

  getMood(): EmotionState {
    return this.emotionEngine.getCurrentEmotion();
  }

  updateProfile(updates: Partial<CharacterProfile>): void {
    this.profile = { ...this.profile, ...updates };
  }
}
