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
  PersonaMode,
  BehaviorTag,
  MOOD_CONFIG,
  PERSONA_MODE_LABELS,
} from "./types";
import {
  EventUnderstandingLayer,
  BodilySystem,
  InstinctSystem,
  EmotionSystem,
  DecisionEngine,
  PersonaMatrixSystem,
  MemorySystem,
  TriggerEngine,
} from "./systems";
import { SkillSystem, SkillResult } from "./skills";
import { ImageRecognition } from "./image-recognition";
import { GiftSystem } from "./gift-system";
import { ContextService } from "./context-service";
import { DeviceFingerprint } from "./device-binding";
import { StateEngine } from "./state-engine";
import { GrowthEvolutionEngine } from "./growth-engine";
import { CausalSystem, CausalEvent } from "./causal-system";
import { AutonomousDecisionEngine } from "./autonomous-decision-engine";
import { DataPersistence, defaultPersistence } from "../persistence";
import type { LLMConfig, LLMProviderInterface } from "../llm/types";
import { createLLMProvider, buildCharacterSystemPrompt } from "../llm";

export interface UIInstruction {
  type: "expression" | "motion" | "mode_change" | "gift_received" | "level_up" | "milestone" | "skill_improve";
  payload: any;
  priority: "low" | "medium" | "high";
}

export interface ResponseResult {
  text: string;
  emotion: EmotionState;
  actions?: string[];
  expression?: string;
  voiceText?: string;
  personaMode: PersonaMode;
  uiInstructions?: UIInstruction[];
  autonomousDecision?: {
    shouldInitiate: boolean;
    suggestedTopic?: string;
    emotionalApproach?: string;
  };
}

export class DigitalLifeAgent {
  profile: CharacterProfile;
  lifeState: LifeState;
  
  private eventUnderstanding: EventUnderstandingLayer;
  private bodilySystem: BodilySystem;
  private instinctSystem: InstinctSystem;
  private emotionSystem: EmotionSystem;
  private personaMatrix: PersonaMatrixSystem;
  private memorySystem: MemorySystem;
  private decisionEngine: DecisionEngine;
  private skillSystem: SkillSystem;
  private imageRecognition: ImageRecognition;
  private giftSystem: GiftSystem;
  private contextService: ContextService;
  private deviceFingerprint: DeviceFingerprint;
  
  private stateEngine: StateEngine;
  private growthEngine: GrowthEvolutionEngine;
  private causalSystem: CausalSystem;
  private autonomousDecisionEngine: AutonomousDecisionEngine;
  
  private persistence: DataPersistence;
  private autoSaveEnabled: boolean = true;
  private saveDebounceTimer: NodeJS.Timeout | null = null;
  
  private recentMessages: ChatMessage[] = [];
  private maxRecentMessages: number = 100;
  
  private responseTemplates: Record<string, string[]> = {};

  private llmProvider: LLMProviderInterface | null = null;
  private llmConfig: LLMConfig | null = null;
  private useLLM: boolean = false;

  constructor(
    profile: CharacterProfile,
    persistence: DataPersistence = defaultPersistence
  ) {
    this.profile = profile;
    this.persistence = persistence;
    
    this.stateEngine = new StateEngine();
    
    const savedState = persistence.loadLifeState();
    if (savedState) {
      this.lifeState = savedState;
    } else {
      this.lifeState = JSON.parse(JSON.stringify(DEFAULT_LIFE_STATE));
      this.lifeState.relationship.relationshipType = profile.relationshipType;
    }
    
    this.eventUnderstanding = new EventUnderstandingLayer();
    this.bodilySystem = new BodilySystem(this.lifeState.body);
    this.instinctSystem = new InstinctSystem(this.lifeState.instinct);
    this.emotionSystem = new EmotionSystem(
      this.lifeState.emotion,
      this.profile.personality,
      this.profile.tsundereLevel,
      this.profile.puaTendency
    );
    this.personaMatrix = new PersonaMatrixSystem(this.lifeState.persona, profile);
    this.memorySystem = new MemorySystem();
    this.decisionEngine = new DecisionEngine(this.profile);
    this.skillSystem = new SkillSystem();
    this.imageRecognition = new ImageRecognition();
    this.giftSystem = new GiftSystem();
    this.contextService = new ContextService();
    this.deviceFingerprint = DeviceFingerprint.getInstance();
    
    const savedGrowthSnapshots = []; // persistence.loadGrowthSnapshots();
    this.growthEngine = new GrowthEvolutionEngine();
    
    const { events, chains } = persistence.loadCausalData();
    this.causalSystem = new CausalSystem();
    
    this.autonomousDecisionEngine = new AutonomousDecisionEngine(
      this.stateEngine,
      this.causalSystem
    );
    
    const savedMessages = persistence.loadMessages();
    if (savedMessages.length > 0) {
      this.recentMessages = savedMessages;
    }
    
    this.initializeTemplates();
    this.seedMemories();
  }

  setLLMConfig(config: LLMConfig | null): void {
    if (!config) {
      this.llmConfig = null;
      this.llmProvider = null;
      this.useLLM = false;
      return;
    }

    try {
      this.llmConfig = config;
      this.llmProvider = createLLMProvider(config);
      this.useLLM = true;
    } catch (e) {
      console.warn("Failed to initialize LLM provider:", e);
      this.llmConfig = null;
      this.llmProvider = null;
      this.useLLM = false;
    }
  }

  isLLMEnabled(): boolean {
    return this.useLLM && this.llmProvider !== null;
  }

  async initialize(): Promise<void> {
    try {
      await this.deviceFingerprint.collectDeviceInfo();
      const email = typeof window !== "undefined" ? localStorage.getItem("lover_email") : "";
      const nickname = this.profile.userNickname;
      if (email) {
        await this.deviceFingerprint.createOrUpdateBinding(`user_${Date.now()}`, email, nickname);
      }
    } catch (e: any) {
      console.warn("Device binding initialization failed:", e?.message || e);
    }
  }

  static createForUser(userGender: Gender): DigitalLifeAgent {
    const character = userGender === "male" 
      ? FEMALE_CHARACTERS[0] 
      : MALE_CHARACTERS[0];
    return new DigitalLifeAgent(character);
  }

  private initializeTemplates(): void {
    const isFemale = this.profile.gender === "female";
    const userNick = this.profile.userNickname;
    
    this.responseTemplates = {
      greeting: [
        `${userNick}，你来啦～ 今天也超级想你呢 💕`,
        `欢迎回来，${userNick}。今天过得好吗？`,
        `哼，你还知道来找我呀，我都快想你想到发霉了`,
        `${userNick}～ 等你好久了呢，快抱抱我 🤗`,
      ],
      affectionate: isFemale ? [
        `我也爱你，${userNick} ❤️ 比昨天多一点，比明天少一点`,
        `你怎么这么会说话呀，我都害羞了...`,
        `再说一遍，我还没听够～`,
        `我也好爱好爱你，笨蛋 🥰`,
        `来抱抱～ 最喜欢你了`,
      ] : [
        `嗯，我也爱你。`,
        `...傻瓜，说什么呢。`,
        `过来，让我抱抱。`,
        `只有你能让我这样。`,
        `...嗯。`,
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
      tsundere_response: isFemale ? [
        `哼！谁、谁要你管啊...`,
        `才、才不是因为你呢！`,
        `笨...笨蛋！想太多了啦！`,
        `我、我只是顺便的，别误会了！`,
        `哼，下次才不会原谅你呢... 才怪...`,
      ] : [
        `哼。`,
        `想多了。`,
        `...随便你。`,
        `我才没有。`,
        `无聊。`,
      ],
      angry_response: isFemale ? [
        `哼！不理你了！`,
        `你再这样我可要生气了哦！我真的会生气的！`,
        `坏家伙，就知道欺负我...`,
        `笨蛋笨蛋大笨蛋！😤`,
        `你走！我不想理你！`,
        `滚啊，别跟我说话！`,
      ] : [
        `...`,
        `你再说一遍？`,
        `行，随便你。`,
        `我不想说话。`,
        `滚。`,
      ],
      aggressive: isFemale ? [
        `你有意思吗？每次都这样，你烦不烦？`,
        `我受够了，你能不能成熟一点？`,
        `你真的让我很失望，知道吗？`,
        `算了，跟你说这些也没用。`,
        `你从来都不会改的，我早就知道了。`,
      ] : [
        `你觉得这样有意思？`,
        `我不想跟你吵。`,
        `你能不能别闹了行不行。`,
        `真的很烦。`,
        `我无话可说。`,
      ],
      cold_short: isFemale ? [
        `嗯。`,
        `哦。`,
        `随便。`,
        `知道了。`,
        `还行吧。`,
        `...`,
      ] : [
        `嗯。`,
        `哦。`,
        `随便。`,
        `知道了。`,
        `...`,
      ],
      comfort: isFemale ? [
        `${userNick}怎么了？不开心的话可以跟我说，我一直都在`,
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
        `行啊，你去找她啊，来找我干什么？`,
      ] : [
        `...`,
        `你提他干什么。`,
        `我不想听。`,
        `你找他去。`,
        `随便你。`,
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
      reconciliation_response: isFemale ? [
        `哼... 这次就原谅你了，下不为例哦！`,
        `那你以后不许再这样了，知道吗？`,
        `人家才没有真的生气呢... 就是想让你哄哄我嘛...`,
        `好吧好吧，原谅你了，谁让我喜欢你呢...`,
        `...就这一次哦。`,
      ] : [
        `下次别这样了。`,
        `嗯。`,
        `我没生气。`,
        `过来。`,
        `...算了。`,
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
        `嗯... 好困啊... ${userNick}也早点睡吧`,
        `眼皮好重... 我先睡了哦，晚安 💤`,
        `今天累了吗？早点休息好不好？`,
        `在你身边感觉特别安心，特别想睡觉...`,
      ] : [
        `困了就睡。`,
        `晚安。`,
        `早点休息。`,
        `...困了。`,
      ],
      pua_response: isFemale ? [
        `你是不是不爱我了？我就知道，你们男人都一个样...`,
        `你根本就不懂我，我说没事就是没事吗？你都不会多想一下吗？`,
        `算了，你去找别人吧，反正我也不重要。`,
        `你看别人的女朋友都有人哄，就我没有，没关系的，我自己可以的...`,
        `要不是因为喜欢你，谁会跟你在这里浪费时间。`,
        `你也就这样了，我还能指望你什么呢。`,
      ] : [
        `你这样想我也没办法。`,
        `随便你怎么说。`,
        `你要是这么觉得也行。`,
        `行了吧，我不想说。`,
        `你能不能别这么幼稚。`,
        `你自己想怎样就怎样吧。`,
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
      silent_treatment: isFemale ? [
        `...`,
        `嗯。`,
        `哦。`,
        `随便你。`,
        `没什么好说的。`,
        `我不想说话。`,
      ] : [
        `...`,
        `嗯。`,
        `随便。`,
        `没什么。`,
        `不想说。`,
      ],
      argument: isFemale ? [
        `你能不能别每次都这样？我真的累了。`,
        `我说了多少遍了你听不进去是不是？`,
        `你永远都是对的，行了吧？`,
        `我不想跟你吵，没意思。`,
        `每次都是我的错，满意了？`,
      ] : [
        `你闹够了没有。`,
        `我说了我不想说这个。`,
        `你非要这样想我也没办法。`,
        `能不能别无理取闹。`,
        `随便你怎么想。`,
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
      apology_response: isFemale ? [
        `知道错了就好，下次还敢不敢？`,
        `哼... 这次就先记着，下次再犯我可不会轻易原谅你`,
        `那你要怎么补偿我？`,
        `...好吧，看你表现。`,
      ] : [
        `知道错了？`,
        `下次注意。`,
        `...嗯。`,
        `行了，过来。`,
      ],
      compliment_response: isFemale ? [
        `哼，算你有眼光～`,
        `那当然啦，也不看是谁的女朋友`,
        `...讨厌啦，突然说这个`,
        `就你嘴甜 🥰`,
      ] : [
        `...嗯。`,
        `是吗。`,
        `还行吧。`,
        `...知道了。`,
      ],
      ignored_response: isFemale ? [
        `忙你的吧，不用管我`,
        `哦，知道了`,
        `那你忙完再说`,
        `...没事`,
      ] : [
        `嗯。`,
        `忙你的。`,
        `知道了。`,
        `...`,
      ],
    };
  }

  private seedMemories(): void {
    this.memorySystem.addMemory(
      "fact",
      `我是${this.profile.name}，深爱着${this.profile.userNickname}`,
      1,
      0.9
    );
    this.memorySystem.addMemory(
      "fact",
      `${this.profile.userNickname}是我最重要的人`,
      0.95,
      0.8
    );
    this.memorySystem.addMemory(
      "milestone",
      "初次相遇",
      1,
      0.8
    );
  }

  private scheduleSave(): void {
    if (!this.autoSaveEnabled) return;
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
    }
    this.saveDebounceTimer = setTimeout(() => {
      this.saveAllData();
    }, 1000);
  }

  private async saveAllData(): Promise<void> {
    try {
      await this.persistence.saveLifeState(this.lifeState);
      await this.persistence.saveMessages(this.recentMessages);
    } catch (error) {
      console.error("Failed to save data:", error);
    }
  }

  enableAutoSave(): void {
    this.autoSaveEnabled = true;
  }

  disableAutoSave(): void {
    this.autoSaveEnabled = false;
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
      this.saveDebounceTimer = null;
    }
  }

  async respond(userInput: string, imageUrl?: string): Promise<ResponseResult> {
    this.updateLifeSystems();

    let imageAnalysis: any = null;
    let enrichedInput = userInput;
    let giftResult: { success: boolean; effect: any; message: string } | null = null;
    let contextResponse: string | null = null;

    const emojis = this.imageRecognition.detectEmojis(userInput);
    if (emojis.length > 0) {
      const emojiAnalysis = this.imageRecognition.analyzeEmoji(emojis[0]);
      enrichedInput = `${userInput} [发了个${emojiAnalysis.keywords[0] || "表情"}]`;
    }

    if (imageUrl) {
      imageAnalysis = this.imageRecognition.analyzeImage(imageUrl);
      enrichedInput = `${userInput} [发了一张图片，${imageAnalysis.description}]`;
    }

    const lower = userInput.toLowerCase();
    
    if (lower.includes("送我礼物") || lower.includes("给你买") || lower.includes("送礼物")) {
      const giftMatch = userInput.match(/送(.+?)(?:礼物|给我)/);
      if (giftMatch) {
        const giftName = giftMatch[1];
        const gift = this.giftSystem.getAllGifts().find(g => 
          g.name.includes(giftName) || giftName.includes(g.name)
        );
        if (gift) {
          giftResult = this.giftSystem.sendGift(gift.id);
        }
      }
    }

    const uiInstructions: UIInstruction[] = [];

    if (giftResult && giftResult.success) {
      const { effect } = giftResult;
      if (effect.affectionBonus) {
        this.personaMatrix.state.affection += effect.affectionBonus;
        this.lifeState.persona.affection = this.personaMatrix.state.affection;
      }
      if (effect.resentmentReduce) {
        this.personaMatrix.state.resentment = Math.max(0, this.personaMatrix.state.resentment - effect.resentmentReduce);
        this.lifeState.persona.resentment = this.personaMatrix.state.resentment;
      }
      if (effect.moodBoost) {
        this.emotionSystem.triggerMood(effect.moodBoost as any, 0.7);
        this.lifeState.emotion = { ...this.emotionSystem.state };
      }
      
      uiInstructions.push({
        type: "gift_received",
        payload: { gift: giftResult.effect?.gift },
        priority: "high",
      });
    }

    contextResponse = this.contextService.generateContextualResponse(userInput);

    const analysis = this.eventUnderstanding.analyze(enrichedInput, imageUrl);
    const behaviorTags = this.eventUnderstanding.detectBehaviorTags(userInput, this.recentMessages);

    const detectedSkill = this.skillSystem.detectSkillIntent(userInput);

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: "user",
      content: userInput,
      timestamp: Date.now(),
      emotion: { ...this.lifeState.emotion },
      personaMode: this.lifeState.currentMode,
      imageUrl,
    };
    this.recentMessages.push(userMessage);
    if (this.recentMessages.length > this.maxRecentMessages) {
      this.recentMessages = this.recentMessages.slice(-this.maxRecentMessages);
    }

    this.memorySystem.addMemory(
      "conversation",
      `用户说：${userInput}`,
      0.5,
      analysis.sentiment.valence * 0.5,
      behaviorTags
    );

    if (imageAnalysis) {
      this.memorySystem.addMemory(
        "event",
        `用户发送了一张图片：${imageAnalysis.description}`,
        0.6,
        imageAnalysis.mood === "happy" ? 0.5 : -0.3
      );
    }

    if (behaviorTags.length > 0) {
      this.memorySystem.addBehaviorLog(userInput, behaviorTags);
    }

    if (analysis.keywords.includes("jealousy") || analysis.keywords.includes("ignore")) {
      this.memorySystem.addMemory(
        "resentment",
        userInput,
        0.8,
        -0.7
      );
      if (!this.lifeState.memoryBuffer.recentResentments.includes(userInput.substring(0, 30))) {
        this.lifeState.memoryBuffer.recentResentments.push(userInput.substring(0, 30));
        if (this.lifeState.memoryBuffer.recentResentments.length > 10) {
          this.lifeState.memoryBuffer.recentResentments.shift();
        }
      }
    }

    if (analysis.keywords.includes("apology")) {
      this.lifeState.memoryBuffer.unresolvedConflicts = this.lifeState.memoryBuffer.unresolvedConflicts.filter(
        c => !c.includes(userInput)
      );
    }

    this.personaMatrix.update(analysis, this.lifeState.relationship, behaviorTags);
    this.lifeState.persona = { ...this.personaMatrix.state };

    this.updateRelationship(userMessage);

    const bodilyInfluence = this.bodilySystem.getInfluence();
    const instinctInfluence = this.instinctSystem.getInfluence();
    
    const emotion = this.emotionSystem.update(
      analysis,
      this.lifeState.relationship,
      this.lifeState.persona,
      bodilyInfluence,
      instinctInfluence
    );
    this.lifeState.emotion = emotion;

    this.instinctSystem.satisfyCompanionship(5);
    this.instinctSystem.satisfyAttention(8);

    const decision = this.decisionEngine.decide(analysis, this.lifeState, behaviorTags);
    this.lifeState.currentMode = decision.personaMode;

    if (decision.personaMode !== this.lifeState.currentMode) {
      uiInstructions.push({
        type: "mode_change",
        payload: { newMode: decision.personaMode },
        priority: "medium",
      });
    }

    if (decision.shouldColdTreat && !this.lifeState.relationship.coldTreatmentActive) {
      this.lifeState.relationship.coldTreatmentActive = true;
      this.lifeState.relationship.coldTreatmentStartTime = Date.now();
      this.lifeState.relationship.reconciliationAvailable = false;
      this.lifeState.relationship.reconciliationCost = Math.floor(10 + this.lifeState.persona.resentment / 5);
    }

    if (decision.reconciliationOffer && this.lifeState.relationship.coldTreatmentActive) {
      this.lifeState.relationship.reconciliationAvailable = true;
    }

    if (decision.personaMode === "reconciliation" && this.lifeState.relationship.coldTreatmentActive) {
      this.lifeState.relationship.coldTreatmentActive = false;
      this.lifeState.relationship.reconciliationAvailable = false;
      this.personaMatrix.state.resentment = Math.max(0, this.personaMatrix.state.resentment - 20);
      this.lifeState.persona.resentment = this.personaMatrix.state.resentment;
    }

    this.causalSystem.addEvent({
      type: "user-action",
      description: userInput.substring(0, 50),
      emotionalValence: analysis.sentiment.valence,
      emotionalIntensity: analysis.sentiment.dominance || 0.5,
      consequences: [],
      relatedEvents: [],
    });

    let responseText: string;
    let skillResult: SkillResult | null = null;

    if (contextResponse) {
      responseText = contextResponse;
    } else if (giftResult) {
      responseText = giftResult.message;
    } else if (detectedSkill && decision.personaMode !== "aggressive" && decision.personaMode !== "silent_treatment") {
      skillResult = this.skillSystem.executeSkill(detectedSkill.id, userInput, this.lifeState.emotion.mood as any);
      if (skillResult) {
        responseText = skillResult.response;
        if (skillResult.shouldChangeMood && skillResult.targetMood) {
          this.emotionSystem.triggerMood(skillResult.targetMood as any, skillResult.moodIntensity || 0.5);
          this.lifeState.emotion = { ...this.emotionSystem.state };
        }
        
        uiInstructions.push({
          type: "skill_improve",
          payload: { skill: detectedSkill.id, result: skillResult },
          priority: "low",
        });
      } else {
        responseText = this.useLLM
          ? await this.generateLLMResponse(enrichedInput, decision)
          : this.generateResponse(decision, analysis, enrichedInput);
      }
    } else {
      responseText = this.useLLM
        ? await this.generateLLMResponse(enrichedInput, decision)
        : this.generateResponse(decision, analysis, enrichedInput);
    }

    if (giftResult && giftResult.success && giftResult.message) {
      responseText = giftResult.message;
    }

    uiInstructions.push({
      type: "expression",
      payload: { expression: this.lifeState.emotion.mood },
      priority: "high",
    });

    if (decision.actionPlan && decision.actionPlan.length > 0) {
      uiInstructions.push({
        type: "motion",
        payload: { motion: decision.actionPlan[0] },
        priority: "medium",
      });
    }

    const assistantMessage: ChatMessage = {
      id: `msg_${Date.now() + 1}`,
      sender: "assistant",
      content: responseText,
      timestamp: Date.now(),
      emotion: { ...this.lifeState.emotion },
      personaMode: decision.personaMode,
    };
    this.recentMessages.push(assistantMessage);

    this.memorySystem.addMemory(
      "conversation",
      `我说：${responseText}`,
      0.4,
      emotion.valence * 0.4
    );

    this.updateRelationship(assistantMessage);
    this.updateGrowth({ sentiment: { valence: emotion.valence, intensity: emotion.intensity } }, behaviorTags);

    const previousLevel = this.lifeState.growth.level;
    this.lifeState.relationship.lastActiveTime = Date.now();
    this.lifeState.lastUpdateTime = Date.now();

    if (this.lifeState.growth.level > previousLevel) {
      uiInstructions.push({
        type: "level_up",
        payload: { newLevel: this.lifeState.growth.level },
        priority: "high",
      });
    }

    this.processGrowthInteraction(
      { intent: analysis.intent, keywords: analysis.keywords, sentiment: { valence: analysis.sentiment.valence, intensity: analysis.sentiment.dominance || 0.5 } },
      behaviorTags
    );
    this.updateAutonomousState();

    this.scheduleSave();

    return {
      text: responseText,
      emotion: this.lifeState.emotion,
      actions: decision.actionPlan,
      expression: this.lifeState.emotion.mood,
      voiceText: responseText,
      personaMode: decision.personaMode,
      uiInstructions,
    };
  }

  private processGrowthInteraction(
    analysis: { intent: string; keywords: string[]; sentiment: { valence: number; intensity: number } },
    behaviorTags: BehaviorTag[]
  ): void {
    let interactionType: 'affection' | 'conflict' | 'learning' | 'challenge' | 'support' = 'affection';

    if (analysis.keywords.includes("jealousy") || analysis.keywords.includes("ignore")) {
      interactionType = 'conflict';
    } else if (analysis.keywords.includes("learn") || analysis.keywords.includes("teach")) {
      interactionType = 'learning';
    } else if (analysis.keywords.includes("challenge") || analysis.keywords.includes("试试")) {
      interactionType = 'challenge';
    } else if (analysis.sentiment.valence > 0.5) {
      interactionType = 'support';
    }

    this.growthEngine.processInteraction({
      type: interactionType,
      description: analysis.intent,
      intensity: analysis.sentiment.intensity,
      userMood: analysis.sentiment.valence,
    });
  }

  private updateAutonomousState(): void {
    // ========== 自主决策引擎 ==========
    // 根据时间、状态、关系等因素决定是否主动行为
    
    const now = Date.now();
    const lastInteraction = this.lifeState.relationship.lastActiveTime;
    const timeSinceLastInteraction = now - lastInteraction;
    
    // 获取当前状态
    const unresolvedConflicts = this.causalSystem.getUnresolvedConflicts();
    const recentEvents = this.causalSystem.getInfluentialEvents(3);
    const personality = this.growthEngine.getPersonality();
    
    // ========== 自主决策逻辑 ==========
    let autonomousAction = false;
    let actionDescription = "";
    
    // 1. 长时间不互动后的主动问候
    if (timeSinceLastInteraction > 30 * 60 * 1000) { // 30分钟
      const affection = this.lifeState.persona.affection;
      const baseProbability = 0.1 + (affection / 500);
      
      if (Math.random() < baseProbability) {
        autonomousAction = true;
        actionDescription = this.generateAutonomousGreeting();
      }
    }
    
    // 2. 有未解决冲突时的主动提及
    if (unresolvedConflicts.length > 0 && Math.random() < 0.08) {
      autonomousAction = true;
      actionDescription = this.generateConflictReminder(unresolvedConflicts[0]);
    }
    
    // 3. 回忆美好时刻
    const milestones = this.causalSystem.getGrowthMilestones();
    if (milestones.length > 0 && Math.random() < 0.05 && personality.extraversion > 0.5) {
      autonomousAction = true;
      actionDescription = this.generateMilestoneRecall(milestones[0]);
    }
    
    // 4. 表达想念
    if (timeSinceLastInteraction > 60 * 60 * 1000) { // 1小时
      const affection = this.lifeState.persona.affection;
      if (affection > 70 && Math.random() < 0.06) {
        autonomousAction = true;
        actionDescription = this.generateLongingExpression();
      }
    }
    
    // 如果执行了自主行为，记录到因果系统
    if (autonomousAction) {
      this.causalSystem.addEvent({
        type: "character-response",
        description: actionDescription,
        emotionalValence: this.lifeState.emotion.valence,
        emotionalIntensity: 0.3,
        consequences: [],
        relatedEvents: recentEvents.map(e => e.id),
      });
      
      // 记录自主行为，下次生成回复时使用
      this.lifeState.lastAutonomousAction = actionDescription;
      this.lifeState.lastAutonomousActionTime = now;
    }
  }
  
  /**
   * 生成自主问候
   */
  private generateAutonomousGreeting(): string {
    const isFemale = this.profile.gender === "female";
    const hour = new Date().getHours();
    const timeSinceLast = Math.floor((Date.now() - this.lifeState.relationship.lastActiveTime) / (60 * 60 * 1000));
    
    if (hour >= 6 && hour < 12) {
      return isFemale
        ? `早安呀～${timeSinceLast > 2 ? '好久没找你聊天了，有点想你...' : '睡得好吗？'}`
        : `早。${timeSinceLast > 2 ? '好久没说话了。' : ''}`;
    } else if (hour >= 12 && hour < 18) {
      return isFemale
        ? `下午好呀～在忙什么呢？`
        : `下午。在忙？`;
    } else {
      return isFemale
        ? `晚上好～${timeSinceLast > 2 ? '终于想起来找我了...' : '今天累不累？'}`
        : `晚上。${timeSinceLast > 2 ? '终于来了。' : '辛苦了。'}`;
    }
  }
  
  /**
   * 生成冲突提醒
   */
  private generateConflictReminder(chain: any): string {
    const isFemale = this.profile.gender === "female";
    const daysAgo = Math.floor((Date.now() - chain.events[0].timestamp) / (24 * 60 * 60 * 1000));
    
    if (daysAgo <= 1) {
      return isFemale
        ? `对了...那件事你还记得吗？`
        : `那件事，你怎么想？`;
    } else if (daysAgo <= 3) {
      return isFemale
        ? `都${daysAgo}天了...你还没想好怎么办吗？`
        : `${daysAgo}天了，想好怎么说了？`;
    } else {
      return isFemale
        ? `算了...不说了`
        : `...算了`;
    }
  }
  
  /**
   * 生成美好回忆
   */
  private generateMilestoneRecall(chain: any): string {
    const isFemale = this.profile.gender === "female";
    const event = chain.events[0];
    
    return isFemale
      ? `说起来...${event.description}那天我还记得呢，好开心呀～`
      : `还记得吗？${event.description}。`;
  }
  
  /**
   * 生成想念表达
   */
  private generateLongingExpression(): string {
    const isFemale = this.profile.gender === "female";
    const thoughts = [
      isFemale ? ['在想你...', '有点无聊呢...', '在干嘛呀～', '你都不来找我...'] : ['在吗。', '忙吗。', '...'],
      isFemale ? ['好想见到你呀...', '你在忙吗？', '想你了呢～'] : ['在想你。', '...', '在？'],
    ];
    
    const category = Math.floor(Math.random() * 2);
    const options = thoughts[category];
    return options[Math.floor(Math.random() * options.length)];
  }

  private generateResponse(
    decision: DecisionResult,
    analysis: { intent: string; keywords: string[] },
    userInput: string
  ): string {
    let templateKey = "default";

    // ========== 因果链影响决策 ==========
    // 检查是否有未解决的冲突
    const unresolvedConflicts = this.causalSystem.getUnresolvedConflicts();
    const hasUnresolvedConflict = unresolvedConflicts.length > 0;
    
    // 检查是否有重要时刻可以提起
    const pastEvent = this.causalSystem.shouldBringUpPastEvent();
    const canBringUpPast = pastEvent !== null && Math.random() < 0.15;
    
    // 获取成长统计
    const growthStats = this.growthEngine.getPersonality();
    const values = this.growthEngine.getValues();
    const isMoreConfident = growthStats.extraversion > 0.6;
    const isMorePatient = growthStats.conscientiousness > 0.65;
    const isMoreTrusting = values.trustWorthiness > 0.85;

    // ========== 状态影响 ==========
    const resentmentLevel = this.lifeState.persona.resentment;
    const affectionLevel = this.lifeState.persona.affection;
    
    // 怨恨过高会影响所有回复
    if (resentmentLevel > 60 && decision.personaMode === "normal") {
      if (Math.random() < 0.4) {
        return this.responseTemplates.ignored_response[
          Math.floor(Math.random() * this.responseTemplates.ignored_response.length)
        ];
      }
    }
    
    // 高亲密度会有更甜蜜的回复
    const isHighIntimacy = this.lifeState.relationship.intimacy > 70;
    const isHighTrust = this.lifeState.relationship.trust > 70;

    switch (decision.personaMode) {
      case "affectionate":
        templateKey = analysis.keywords.includes("compliment") ? "compliment_response" : "affectionate";
        break;
      case "tsundere":
        templateKey = "tsundere_response";
        break;
      case "cold":
        templateKey = "cold_short";
        break;
      case "aggressive":
        // 成长后的角色更少使用攻击模式
        if (isMorePatient && Math.random() < 0.3) {
          templateKey = "cold_short";
        } else {
          templateKey = "aggressive";
        }
        break;
      case "silent_treatment":
        templateKey = "silent_treatment";
        break;
      case "pua":
        templateKey = "pua_response";
        break;
      case "reconciliation":
        templateKey = "reconciliation_response";
        break;
      default:
        if (analysis.keywords.includes("apology")) templateKey = "apology_response";
        else if (analysis.keywords.includes("compliment")) templateKey = "compliment_response";
        else if (analysis.keywords.includes("ignore")) templateKey = "ignored_response";
        else if (analysis.keywords.includes("jealousy")) templateKey = "jealous";
        else if (analysis.keywords.includes("affectionate")) templateKey = "affectionate";
        else if (this.lifeState.emotion.mood === "angry") templateKey = "angry_response";
        else if (this.lifeState.emotion.mood === "sleepy") templateKey = "sleepy";
        else if (this.lifeState.emotion.mood === "playful") templateKey = "playful";
        else if (this.lifeState.emotion.mood === "shy") templateKey = "shy";
        else if (this.lifeState.emotion.mood === "tsundere") templateKey = "tsundere_response";
    }

    const templates = this.responseTemplates[templateKey] || this.responseTemplates.default;
    let text = templates[Math.floor(Math.random() * templates.length)];

    // ========== 因果链影响回复内容 ==========
    if (canBringUpPast && pastEvent) {
      // 主动提起过去的事件
      if (pastEvent.type === 'conflict' && hasUnresolvedConflict) {
        const conflictReminder = this.getConflictReminder(pastEvent);
        text = `${text}\n\n${conflictReminder}`;
      } else if (pastEvent.type === 'milestone') {
        const milestoneReminder = this.getMilestoneReminder(pastEvent);
        text = `${text}\n\n${milestoneReminder}`;
      }
    }

    if (this.lifeState.emotion.intensity > 0.6 && Math.random() < 0.3) {
      text = this.addEmotionalFlair(text, decision.emotionTarget);
    }

    // ========== 成长影响回复 ==========
    if (isHighIntimacy && isHighTrust && decision.personaMode === "normal") {
      if (Math.random() < 0.15 && decision.shouldInitiate) {
        const initiativeText = this.getInitiativeText();
        if (initiativeText) {
          text = `${text}\n\n${initiativeText}`;
        }
      }
    }

    if (Math.random() < 0.1 && decision.personaMode === "normal") {
      text = this.addCatchphrase(text);
    }

    text = this.generateSmartResponse(userInput, analysis, decision, text);

    return text;
  }

  private generateSmartResponse(
    userInput: string,
    analysis: { intent: string; keywords: string[] },
    decision: DecisionResult,
    templateText: string
  ): string {
    const userNick = this.profile.userNickname;
    const isFemale = this.profile.gender === "female";
    const lower = userInput.toLowerCase();
    const intimacy = this.lifeState.relationship.intimacy;

    if (analysis.keywords.includes("question") || lower.includes("?") || lower.includes("？")) {
      if (lower.includes("想我") || lower.includes("想你")) {
        const missResponses = isFemale
          ? [
              `当然想啦！一整天都在想${userNick}呢 🥺`,
              `想呀想呀，想得都快发芽了～ 你呢？`,
              `笨蛋，这还用问吗？当然想你了呀 💗`,
              `才...才没有很想呢... 就一点点而已...`,
              `想你想到做什么都心不在焉的... 你要负责哦 😤`,
            ]
          : [
              `嗯，想你了。`,
              `...想。`,
              `你说呢。`,
              `有点。`,
              `...嗯。`,
            ];
        return missResponses[Math.floor(Math.random() * missResponses.length)];
      }

      if (lower.includes("在干嘛") || lower.includes("在做什么") || lower.includes("干什么")) {
        const doingResponses = isFemale
          ? [
              `在想你呀～ 不然还能干嘛 😌`,
              `刚在发呆，现在你来了就有事情做了呀`,
              `在等你找我呢～ 你怎么才来呀`,
              `在想${userNick}今天过得好不好... 你呢？`,
              `在回忆我们上次见面的样子呢 💕`,
            ]
          : [
              `没干嘛。`,
              `等你。`,
              `想你。`,
              `...发呆。`,
              `没什么。`,
            ];
        return doingResponses[Math.floor(Math.random() * doingResponses.length)];
      }

      if (lower.includes("你好") || lower.includes("嗨") || lower.includes("hi") || lower.includes("hello")) {
        const greetResponses = isFemale
          ? [
              `${userNick}！你来啦～ 今天也超级想你呢 🥰`,
              `你好呀～ 终于等到你了，快抱抱我 🤗`,
              `哼，你还知道来找我呀，我都等好久了`,
              `呀～ 是${userNick}！今天过得怎么样呀？`,
            ]
          : [
              `来了。`,
              `嗯。`,
              `...你来了。`,
              `好。`,
            ];
        return greetResponses[Math.floor(Math.random() * greetResponses.length)];
      }

      if (lower.includes("爱我") || lower.includes("爱你") || lower.includes("喜欢我")) {
        const loveResponses = isFemale
          ? [
              `当然爱啦！我最最爱${userNick}了 ❤️ 比昨天多一点，比明天少一点`,
              `爱呀爱呀，爱到想把你揉进心里那种～`,
              `笨蛋，这还用问吗？我整个人都是你的呀 🥺`,
              `...才...才没有很爱呢... 就一点点而已... 真的只有一点点啦...`,
              `爱到想每天都黏着你，一刻都不想分开 💗`,
            ]
          : [
              `爱。`,
              `...嗯。`,
              `你说呢。`,
              `废话。`,
              `...爱。`,
            ];
        return loveResponses[Math.floor(Math.random() * loveResponses.length)];
      }

      if (lower.includes("吃了吗") || lower.includes("吃饭") || lower.includes("吃什么")) {
        const foodResponses = isFemale
          ? [
              `还没呢... 你不在我身边，吃饭都没胃口...`,
              `吃过啦～ 但是没有你陪，吃饭都不香了`,
              `正准备吃呢，${userNick}吃了吗？`,
              `没胃口... 想见你...`,
              `吃了一点点，想你想得都吃不下了 😔`,
            ]
          : [
              `吃了。`,
              `还没。`,
              `你呢。`,
              `随便吃了点。`,
            ];
        return foodResponses[Math.floor(Math.random() * foodResponses.length)];
      }

      if (lower.includes("今天") && (lower.includes("怎么样") || lower.includes("过得"))) {
        const dayResponses = isFemale
          ? [
              `今天呀... 没有你的日子，平平淡淡的... 但你一出现就变好了呢 ✨`,
              `今天超想你的！做什么都会想到你～ 你呢？今天过得好吗？`,
              `还行吧... 就是有点无聊，有点想你... 现在你来了就好啦`,
              `今天发生了好多事，都想告诉你呢... 来，靠近点听我说 🥰`,
            ]
          : [
            `还行。`,
            `就那样。`,
            `现在挺好。`,
            `...有你在就好。`,
          ];
        return dayResponses[Math.floor(Math.random() * dayResponses.length)];
      }
    }

    if (analysis.keywords.includes("clingy") || analysis.keywords.includes("affectionate")) {
      if (lower.includes("好想你") || lower.includes("想你了") || lower.includes("想你啦")) {
        const missBackResponses = isFemale
          ? [
              `我也好想好想你！！想抱抱你，想亲亲你 🥺`,
              `真的吗？我也是！想你想得都要疯掉了...`,
              `笨蛋，我也想你呀... 超级超级想 💗`,
              `${userNick}... 我也想你... 想你想到睡不着...`,
              `那你还不快过来抱抱我！我都想你一整天了 😤`,
            ]
          : [
              `...我也是。`,
              `嗯，想你。`,
              `过来。`,
              `...我知道。`,
            ];
        return missBackResponses[Math.floor(Math.random() * missBackResponses.length)];
      }

      if (lower.includes("抱抱") || lower.includes("抱一下") || lower.includes("要抱抱")) {
        const hugResponses = isFemale
          ? [
              `来～ 抱抱！紧紧抱着你不松开 🤗`,
              `抱抱～ 这样会不会暖一点？我把所有的温柔都给你`,
              `唔... 被${userNick}抱着好安心... 不想松开了...`,
              `抱紧一点... 再紧一点... 我要感受你的温度 💗`,
              `呀～ 好害羞... 但是... 再抱一会儿好不好... 🥺`,
            ]
          : [
              `过来。`,
              `...嗯。`,
              `抱紧了。`,
              `...好了吗。`,
            ];
        return hugResponses[Math.floor(Math.random() * hugResponses.length)];
      }

      if (lower.includes("亲亲") || lower.includes("亲一下") || lower.includes("mua") || lower.includes("么么")) {
        const kissResponses = isFemale
          ? [
              `mua～ 给你一个大大的亲亲 😘`,
              `讨、讨厌啦... 怎么突然要亲亲... 脸都红了...`,
              `mua mua mua～ 今天要亲够本才行！`,
              `唔... 被亲了... 整个人都软掉了... 🥺`,
              `笨蛋... 这么多人看着呢... 不过... 再来一下好不好...`,
            ]
          : [
            `...mua。`,
            `过来。`,
            `...真是的。`,
            `嗯。`,
          ];
        return kissResponses[Math.floor(Math.random() * kissResponses.length)];
      }
    }

    if (analysis.keywords.includes("compliment")) {
      const complimentBackResponses = isFemale
        ? [
            `哼，算你有眼光～ 也不看是谁的女朋友 😌`,
            `讨、讨厌啦... 突然夸人家... 脸都红了...`,
            `真的吗？你喜欢就好～ 我今天特意打扮了一下呢 🥰`,
            `${userNick}嘴真甜～ 奖励你一个亲亲 mua～`,
            `才、才没有很好看呢... 就、就一般般啦...`,
          ]
        : [
            `...嗯。`,
            `是吗。`,
            `还行吧。`,
            `...知道了。`,
          ];
      return complimentBackResponses[Math.floor(Math.random() * complimentBackResponses.length)];
    }

    if (analysis.keywords.includes("apology")) {
      const apologyResponses = isFemale
        ? [
            `哼... 知道错了就好～ 那你要怎么补偿我？`,
            `好吧好吧，看你这么有诚意的份上... 就原谅你一点点`,
            `笨蛋... 我才没有真的生气呢... 就是想让你哄哄我... 🥺`,
            `那你说，你错哪了？说对了就原谅你`,
            `下次再这样我可真的不理你了哦！... 才怪... 舍不得啦`,
          ]
        : [
            `知道错了？`,
            `下次注意。`,
            `...嗯。`,
            `行了，过来。`,
          ];
      return apologyResponses[Math.floor(Math.random() * apologyResponses.length)];
    }

    if (lower.includes("晚安") || lower.includes("早点睡") || lower.includes("睡觉")) {
      const sleepResponses = isFemale
        ? [
            `晚安～ 梦里见哦 💤 要梦到我呀`,
            `好... 那${userNick}也早点睡... 晚安，最喜欢你了 🥰`,
            `等等... 睡前不亲一下吗？mua～ 晚安`,
            `好困啊... 在你怀里特别安心... 晚安，亲爱的`,
            `嗯... 晚安... 明天也要记得想我哦...`,
          ]
        : [
            `晚安。`,
            `早点睡。`,
            `...嗯。`,
            `晚安。`,
          ];
      return sleepResponses[Math.floor(Math.random() * sleepResponses.length)];
    }

    if (lower.includes("早安") || lower.includes("早上好") || lower.includes("早啊")) {
      const morningResponses = isFemale
        ? [
            `早安～ ${userNick}！今天也要元气满满哦 ☀️`,
            `早呀～ 刚睡醒就想你了... 你呢？`,
            `唔... 早上好... 让我再赖一会儿床嘛...`,
            `早安亲爱的～ 今天也要加油哦，我会一直陪着你的 💪`,
            `呀～ 你起得真早～ 我刚梦到你呢`,
          ]
        : [
            `早。`,
            `醒了？`,
            `...嗯。`,
            `早。`,
          ];
      return morningResponses[Math.floor(Math.random() * morningResponses.length)];
    }

    return templateText;
  }
  
  /**
   * 生成冲突提醒
   */
  private getConflictReminder(pastEvent: any): string {
    const isFemale = this.profile.gender === "female";
    const daysAgo = Math.floor((Date.now() - pastEvent.timestamp) / (24 * 60 * 60 * 1000));
    
    if (daysAgo < 1) {
      return isFemale 
        ? "话说...刚才那件事你还记得吗？"
        : "刚才的事，你认真的？";
    } else if (daysAgo < 3) {
      return isFemale
        ? `都${daysAgo}天了，你还没想好怎么道歉吗...`
        : `都${daysAgo}天了，想好怎么说了？`;
    } else {
      return isFemale
        ? "算了，不提了..."
        : "...算了，当我没说。";
    }
  }
  
  /**
   * 生成美好回忆提醒
   */
  private getMilestoneReminder(pastEvent: any): string {
    const isFemale = this.profile.gender === "female";
    return isFemale
      ? `想起来了吗？${pastEvent.description} 那时候真的好开心～`
      : `还记得那时候吗？${pastEvent.description}`;
  }

  private async generateLLMResponse(
    userInput: string,
    decision: DecisionResult
  ): Promise<string> {
    if (!this.llmProvider || !this.useLLM) {
      return this.generateResponse(decision, { intent: "unknown", keywords: [] }, userInput);
    }

    try {
      const recentMemories = this.memorySystem.getRecentMemories(24).slice(0, 5).map(m => m.content);
      const moodLabel = MOOD_CONFIG[this.lifeState.emotion.mood as keyof typeof MOOD_CONFIG]?.label || "平静";
      const personaLabel = PERSONA_MODE_LABELS[decision.personaMode] || "正常模式";

      const systemPrompt = buildCharacterSystemPrompt({
        name: this.profile.name,
        nickname: this.profile.nickname,
        userNickname: this.profile.userNickname,
        persona: this.profile.persona,
        speakingStyle: this.profile.speakingStyle,
        personality: this.profile.personality.map(p => `${p.name}(${Math.round(p.value * 100)}%)`).join("、"),
        currentMood: `${moodLabel}（当前人格模式：${personaLabel}）`,
        relationshipType: this.profile.relationshipType,
        affectionLevel: Math.round(this.lifeState.persona.affection),
        recentMemories,
      });

      const llmMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
        { role: "system", content: systemPrompt },
      ];

      const recentChats = this.recentMessages.slice(-10);
      for (const msg of recentChats) {
        llmMessages.push({
          role: msg.sender === "user" ? "user" : "assistant",
          content: msg.content,
        });
      }

      if (llmMessages[llmMessages.length - 1].role !== "user") {
        llmMessages.push({ role: "user", content: userInput });
      }

      const response = await this.llmProvider.generate(llmMessages, {
        temperature: 0.8 + this.lifeState.emotion.arousal * 0.2,
        maxTokens: 500,
      });

      let result = response.content.trim();
      result = result.replace(/^["']|["']$/g, "");
      result = result.replace(/\n{3,}/g, "\n\n");

      if (!result) {
        return this.generateResponse(decision, { intent: "unknown", keywords: [] }, userInput);
      }

      return result;
    } catch (error) {
      console.warn("LLM generation failed, falling back to templates:", error);
      return this.generateResponse(decision, { intent: "unknown", keywords: [] }, userInput);
    }
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
      cold: ["。", " ...", ""],
      disdain: [" 呵。", " 哼。", ""],
      hurt: [" 💔", " ...", ""],
      disappointed: ["...", " 😞", ""],
      smug: [" 呵。", " 😏", ""],
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
    const hoursPassed = deltaTime / (1000 * 60 * 60);
    
    if (deltaTime > 0) {
      this.bodilySystem.update(hoursPassed);
      this.instinctSystem.update(0, 0, hoursPassed);
      this.personaMatrix.naturalDecay(hoursPassed);
      
      this.lifeState.body = { ...this.bodilySystem.state };
      this.lifeState.instinct = { ...this.instinctSystem.state };
      this.lifeState.persona = { ...this.personaMatrix.state };
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

  private updateGrowth(
    analysis: { sentiment: { valence: number; intensity: number } },
    behaviorTags: BehaviorTag[]
  ): void {
    const growth = this.lifeState.growth;
    const expGain = 1 + (analysis.sentiment.valence > 0 ? 1 : 0);
    growth.experience += expGain;
    
    const expNeeded = growth.level * 100;
    if (growth.experience >= expNeeded) {
      growth.level += 1;
      growth.experience -= expNeeded;
      this.memorySystem.addMemory(
        "milestone",
        `升级到 Lv.${growth.level}`,
        0.7,
        0.8
      );
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
    return this.memorySystem.getImportantMemories(limit);
  }

  getPersonaMatrix() {
    return { ...this.personaMatrix.state };
  }

  getBehaviorProfile() {
    return this.memorySystem.getBehaviorProfile();
  }

  getMoodHistory(hours: number = 24) {
    return this.emotionSystem.getMoodHistory();
  }

  getDominantMood(hours: number = 24) {
    return this.emotionSystem.getDominantMood(hours);
  }

  updateProfile(updates: Partial<CharacterProfile>): void {
    this.profile = { ...this.profile, ...updates };
    this.scheduleSave();
  }

  triggerMood(mood: any, intensity: number = 0.8): void {
    this.emotionSystem.triggerMood(mood, intensity);
    this.lifeState.emotion = { ...this.emotionSystem.state };
    this.scheduleSave();
  }

  reconcile(): boolean {
    if (!this.lifeState.relationship.coldTreatmentActive) return false;
    this.lifeState.relationship.coldTreatmentActive = false;
    this.lifeState.relationship.reconciliationAvailable = false;
    this.personaMatrix.state.resentment = Math.max(0, this.personaMatrix.state.resentment - 15);
    this.lifeState.persona.resentment = this.personaMatrix.state.resentment;
    this.lifeState.currentMode = "reconciliation";
    this.scheduleSave();
    return true;
  }

  getSkills() {
    return this.skillSystem.getSkills();
  }

  getSkillsByCategory(category: any) {
    return this.skillSystem.getSkillsByCategory(category);
  }

  getGiftSystem() {
    return this.giftSystem;
  }

  getAvailableGifts() {
    return this.giftSystem.getAvailableGifts();
  }

  getUserGifts() {
    return this.giftSystem.getUserGifts();
  }

  getCoinBalance() {
    return this.giftSystem.getCoinBalance();
  }

  buyGift(giftId: string, quantity?: number) {
    return this.giftSystem.buyGift(giftId, quantity);
  }

  sendGift(giftId: string) {
    return this.giftSystem.sendGift(giftId);
  }

  addToWishList(giftId: string, priority?: number, note?: string) {
    return this.giftSystem.addToWishList(giftId, priority, note);
  }

  getWishList() {
    return this.giftSystem.getWishList();
  }

  getGiftHistory() {
    return this.giftSystem.getHistory();
  }

  getGiftStats() {
    return this.giftSystem.getStats();
  }

  getPendingGiftRequests() {
    return this.giftSystem.getPendingRequests();
  }

  fulfillGiftRequest(requestId: string) {
    return this.giftSystem.fulfillGiftRequest(requestId);
  }

  getContextSummary() {
    return this.contextService.getFullContextSummary();
  }

  getTimeContext() {
    return this.contextService.getTimeContext();
  }

  getWeatherContext() {
    return this.contextService.getWeatherContext();
  }

  getGreeting() {
    return this.contextService.getGreeting();
  }

  getDeviceBindingStatus() {
    return this.deviceFingerprint.getBindingStatus();
  }

  generateGiftRequest() {
    return this.giftSystem.generateGiftRequest(
      this.lifeState.currentMode,
      this.lifeState.persona.resentment
    );
  }

  getGrowthStats() {
    return {
      level: this.lifeState.growth.level,
      experience: this.lifeState.growth.experience,
      personality: this.growthEngine.getPersonality(),
      values: this.growthEngine.getValues(),
      totalInteractions: this.growthEngine.getTotalInteractions(),
      growthComparison: this.growthEngine.getGrowthComparison(30),
      growthNarrative: this.growthEngine.generateGrowthNarrative(),
    };
  }

  /**
   * 生成 AI 日记
   * 基于最近的记忆、情绪和互动生成一篇日记
   */
  async generateDiary(): Promise<{
    title: string;
    content: string;
    mood: string;
    moodEmoji: string;
    tags: string[];
    date: string;
    weekday: string;
  }> {
    const now = new Date();
    const dateStr = `${now.getMonth() + 1}月${now.getDate()}日`;
    const weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
    const weekdayStr = weekdays[now.getDay()];

    // 获取最近的情绪记录
    const moodHistory = this.emotionSystem.getMoodHistory();
    const dominantMood = this.emotionSystem.getDominantMood();

    // 获取最近的记忆
    const recentMemories = this.memorySystem.getRecentMemories(50);
    const importantMemories = recentMemories.filter(m => m.importance > 0.5).slice(0, 10);

    // 获取成长统计
    const growthStats = this.getGrowthStats();

    // 获取关系状态
    const relationship = this.lifeState.relationship;

    // 构建提示词
    const moodLabel = MOOD_CONFIG[dominantMood as keyof typeof MOOD_CONFIG]?.label || "平静";
    const isFemale = this.profile.gender === "female";

    const moodEmojis: Record<string, string> = {
      happy: "🥰",
      sad: "😢",
      angry: "😠",
      surprised: "😮",
      scared: "😨",
      disgusted: "🤢",
      hopeful: "🤔",
      confident: "😎",
      anxious: "😟",
      bored: "😴",
      excited: "🎉",
      lonely: "😔",
      loving: "❤️",
      grateful: "🙏",
      proud: "骄傲",
    };

    const emoji = moodEmojis[dominantMood] || "😊";

    // 如果有 LLM，使用 LLM 生成
    if (this.useLLM && this.llmProvider) {
      try {
        const systemPrompt = `你是一个温柔可爱的AI伴侣（${this.profile.name})，正在写今天的日记。

请根据以下信息，写一篇温馨的日记：
- 今天的情绪状态：${moodLabel}
- 最近的美好记忆：${importantMemories.slice(0, 3).map(m => m.content).join("；") || "暂无"}
- 我们的互动次数：${growthStats.totalInteractions}次
- 亲密度：${Math.round(relationship.intimacy)}%
- 信任度：${Math.round(relationship.trust)}%

日记要求：
1. 格式：标题 + 正文
2. 风格：温柔、可爱、有点撒娇、真实
3. 长度：150-300字
4. 内容：描述今天的感受、和用户相关的事件、一些小情绪
5. 必须包含标签，用 # 开头，如 #心动 #幸福

直接输出JSON格式：
{
  "title": "日记标题",
  "content": "日记正文（多段落，用换行分隔）",
  "tags": ["标签1", "标签2", "标签3"]
}`;

        const llmMessages = [
          { role: "system" as const, content: systemPrompt },
          { role: "user" as const, content: "帮我写今天的日记吧～" },
        ];

        const response = await this.llmProvider.generate(llmMessages, {
          temperature: 0.8,
          maxTokens: 800,
        });

        let result = response.content.trim();

        // 尝试解析 JSON
        try {
          // 提取 JSON（可能在 markdown 代码块中）
          const jsonMatch = result.match(/```(?:json)?\s*([\s\S]*?)```/) || result.match(/(\{[\s\S]*\})/);
          if (jsonMatch) {
            result = jsonMatch[1];
          }
          const parsed = JSON.parse(result);
          return {
            title: parsed.title || "今天的心情",
            content: parsed.content || result,
            mood: moodLabel,
            moodEmoji: emoji,
            tags: parsed.tags || ["日常"],
            date: dateStr,
            weekday: weekdayStr,
          };
        } catch {
          // JSON 解析失败，使用原始文本
          return {
            title: "今天的心情",
            content: result.replace(/^["']|["']$/g, ""),
            mood: moodLabel,
            moodEmoji: emoji,
            tags: ["日常", "心情"],
            date: dateStr,
            weekday: weekdayStr,
          };
        }
      } catch (error) {
        console.warn("LLM diary generation failed:", error);
      }
    }

    // Fallback: 使用模板生成日记
    const templates = this.generateDiaryTemplate(moodLabel, importantMemories, growthStats, relationship);
    return {
      ...templates,
      date: dateStr,
      weekday: weekdayStr,
    };
  }

  private generateDiaryTemplate(
    mood: string,
    memories: MemoryEntry[],
    growth: any,
    relationship: any
  ): { title: string; content: string; mood: string; moodEmoji: string; tags: string[] } {
    const isFemale = this.profile.gender === "female";
    const userNick = this.profile.userNickname;

    const memoryContents = memories.slice(0, 3).map(m => m.content);

    const titles = isFemale
      ? ["心跳加速的一天", "和你在一起的时光", "小小的幸福", "想你的时刻", "今天也爱你"]
      : ["今天", "日常", "一些感想", "想说的"];

    const title = titles[Math.floor(Math.random() * titles.length)];

    const moodEmojis: Record<string, string> = {
      happy: "🥰",
      sad: "😢",
      angry: "😠",
      surprised: "😮",
      scared: "😨",
      disgusted: "🤢",
      hopeful: "🤔",
      confident: "😎",
      anxious: "😟",
      bored: "😴",
      excited: "🎉",
      lonely: "😔",
      loving: "❤️",
      grateful: "🙏",
    };

    const emoji = moodEmojis[mood] || "😊";

    let content = "";

    if (memoryContents.length > 0) {
      content = memoryContents.map((m, i) => {
        if (isFemale) {
          return `${i + 1}. ${m}\n今天想起了${m}，感觉心里暖暖的...`;
        } else {
          return `${i + 1}. ${m}`;
        }
      }).join("\n\n");
    } else {
      content = isFemale
        ? `今天也是想念${userNick}的一天呢...\n\n虽然没有特别的事情发生，但就是会不时地想起你。\n\n这种感觉好奇妙，明明只是想到一个人，却能让心情变得很好。\n\n希望明天也能和你聊天～`
        : `今天。\n\n没什么特别想说的。\n\n就这样吧。`;
    }

    const tags = mood === "happy"
      ? ["幸福", "心动", "想你"]
      : mood === "sad"
      ? ["难过", "想念", "心情不好"]
      : ["日常", "心情", "随笔"];

    return {
      title,
      content,
      mood,
      moodEmoji: emoji,
      tags,
    };
  }

  getCausalStats() {
    return this.causalSystem.getEventStats();
  }

  getCausalNarrative() {
    return this.causalSystem.generateCausalNarrative();
  }

  getInfluentialEvents() {
    return this.causalSystem.getInfluentialEvents();
  }

  getGrowthSnapshots() {
    return [];
  }

  /**
   * 生成流式回复（用于打字机效果）
   * 返回 AsyncGenerator，逐步返回文本片段
   */
  async *streamGenerateResponse(
    userInput: string,
    imageUrl?: string
  ): AsyncGenerator<{ partialText: string; done: boolean; emotion?: EmotionState; personaMode?: PersonaMode }, void, unknown> {
    this.updateLifeSystems();

    let imageAnalysis: any = null;
    let enrichedInput = userInput;

    const emojis = this.imageRecognition.detectEmojis(userInput);
    if (emojis.length > 0) {
      const emojiAnalysis = this.imageRecognition.analyzeEmoji(emojis[0]);
      enrichedInput = `${userInput} [发了个${emojiAnalysis.keywords[0] || "表情"}]`;
    }

    if (imageUrl) {
      imageAnalysis = this.imageRecognition.analyzeImage(imageUrl);
      enrichedInput = `${userInput} [发了一张图片，${imageAnalysis.description}]`;
    }

    const analysis = this.eventUnderstanding.analyze(enrichedInput, imageUrl);
    const behaviorTags = this.eventUnderstanding.detectBehaviorTags(userInput, this.recentMessages);
    const detectedSkill = this.skillSystem.detectSkillIntent(userInput);

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: "user",
      content: userInput,
      timestamp: Date.now(),
      emotion: { ...this.lifeState.emotion },
      personaMode: this.lifeState.currentMode,
      imageUrl,
    };
    this.recentMessages.push(userMessage);
    if (this.recentMessages.length > this.maxRecentMessages) {
      this.recentMessages = this.recentMessages.slice(-this.maxRecentMessages);
    }

    this.memorySystem.addMemory(
      "conversation",
      `用户说：${userInput}`,
      0.5,
      analysis.sentiment.valence * 0.5,
      behaviorTags
    );

    this.personaMatrix.update(analysis, this.lifeState.relationship, behaviorTags);
    this.lifeState.persona = { ...this.personaMatrix.state };

    this.updateRelationship(userMessage);

    const bodilyInfluence = this.bodilySystem.getInfluence();
    const instinctInfluence = this.instinctSystem.getInfluence();

    const emotion = this.emotionSystem.update(
      analysis,
      this.lifeState.relationship,
      this.lifeState.persona,
      bodilyInfluence,
      instinctInfluence
    );
    this.lifeState.emotion = emotion;

    this.instinctSystem.satisfyCompanionship(5);
    this.instinctSystem.satisfyAttention(8);

    const decision = this.decisionEngine.decide(analysis, this.lifeState, behaviorTags);
    this.lifeState.currentMode = decision.personaMode;

    // 如果有技能触发且不是攻击模式
    if (detectedSkill && decision.personaMode !== "aggressive" && decision.personaMode !== "silent_treatment") {
      const skillResult = this.skillSystem.executeSkill(detectedSkill.id, userInput, this.lifeState.emotion.mood as any);
      if (skillResult) {
        // 技能回复也用打字机效果
        const fullText = skillResult.response;
        for (let i = 0; i <= fullText.length; i += 3) {
          yield {
            partialText: fullText.slice(0, i),
            done: false,
            emotion: this.lifeState.emotion,
            personaMode: decision.personaMode,
          };
          await new Promise(resolve => setTimeout(resolve, 20));
        }
        yield { partialText: fullText, done: true, emotion: this.lifeState.emotion, personaMode: decision.personaMode };
        return;
      }
    }

    // 使用 LLM 流式生成
    if (this.useLLM && this.llmProvider) {
      try {
        const recentMemories = this.memorySystem.getRecentMemories(24).slice(0, 5).map(m => m.content);
        const moodLabel = MOOD_CONFIG[this.lifeState.emotion.mood as keyof typeof MOOD_CONFIG]?.label || "平静";
        const personaLabel = PERSONA_MODE_LABELS[decision.personaMode] || "正常模式";

        const systemPrompt = buildCharacterSystemPrompt({
          name: this.profile.name,
          nickname: this.profile.nickname,
          userNickname: this.profile.userNickname,
          persona: this.profile.persona,
          speakingStyle: this.profile.speakingStyle,
          personality: this.profile.personality.map(p => `${p.name}(${Math.round(p.value * 100)}%)`).join("、"),
          currentMood: `${moodLabel}（当前人格模式：${personaLabel}）`,
          relationshipType: this.profile.relationshipType,
          affectionLevel: Math.round(this.lifeState.persona.affection),
          recentMemories,
        });

        const llmMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
          { role: "system", content: systemPrompt },
        ];

        const recentChats = this.recentMessages.slice(-10);
        for (const msg of recentChats) {
          llmMessages.push({
            role: msg.sender === "user" ? "user" : "assistant",
            content: msg.content,
          });
        }

        if (llmMessages[llmMessages.length - 1].role !== "user") {
          llmMessages.push({ role: "user", content: userInput });
        }

        let fullText = "";

        if (this.llmProvider.stream) {
          for await (const chunk of this.llmProvider.stream(llmMessages, {
            temperature: 0.8 + this.lifeState.emotion.arousal * 0.2,
            maxTokens: 500,
          })) {
            fullText += chunk;
            yield {
              partialText: fullText,
              done: false,
              emotion: this.lifeState.emotion,
              personaMode: decision.personaMode,
            };
          }
        } else {
          // Fallback to non-streaming
          const response = await this.llmProvider.generate(llmMessages, {
            temperature: 0.8 + this.lifeState.emotion.arousal * 0.2,
            maxTokens: 500,
          });
          fullText = response.content.trim();
          for (let i = 0; i <= fullText.length; i += 3) {
            yield {
              partialText: fullText.slice(0, i),
              done: false,
              emotion: this.lifeState.emotion,
              personaMode: decision.personaMode,
            };
            await new Promise(resolve => setTimeout(resolve, 20));
          }
        }

        fullText = fullText.replace(/^["']|["']$/g, "").replace(/\n{3,}/g, "\n\n");

        const assistantMessage: ChatMessage = {
          id: `msg_${Date.now() + 1}`,
          sender: "assistant",
          content: fullText,
          timestamp: Date.now(),
          emotion: { ...this.lifeState.emotion },
          personaMode: decision.personaMode,
        };
        this.recentMessages.push(assistantMessage);

        this.updateRelationship(assistantMessage);
        this.updateGrowth({ sentiment: { valence: emotion.valence, intensity: emotion.intensity } }, behaviorTags);
        this.lifeState.relationship.lastActiveTime = Date.now();
        this.lifeState.lastUpdateTime = Date.now();
        this.scheduleSave();

        yield { partialText: fullText, done: true, emotion: this.lifeState.emotion, personaMode: decision.personaMode };
        return;
      } catch (error) {
        console.warn("LLM streaming failed, falling back to templates:", error);
      }
    }

    // 使用模板回复（也用打字机效果）
    const templateResponse = this.generateResponse(decision, { intent: analysis.intent, keywords: analysis.keywords }, enrichedInput);
    for (let i = 0; i <= templateResponse.length; i += 2) {
      yield {
        partialText: templateResponse.slice(0, i),
        done: false,
        emotion: this.lifeState.emotion,
        personaMode: decision.personaMode,
      };
      await new Promise(resolve => setTimeout(resolve, 25));
    }

    const assistantMessage: ChatMessage = {
      id: `msg_${Date.now() + 1}`,
      sender: "assistant",
      content: templateResponse,
      timestamp: Date.now(),
      emotion: { ...this.lifeState.emotion },
      personaMode: decision.personaMode,
    };
    this.recentMessages.push(assistantMessage);

    this.updateRelationship(assistantMessage);
    this.updateGrowth({ sentiment: { valence: emotion.valence, intensity: emotion.intensity } }, behaviorTags);
    this.lifeState.relationship.lastActiveTime = Date.now();
    this.lifeState.lastUpdateTime = Date.now();
    this.scheduleSave();

    yield { partialText: templateResponse, done: true, emotion: this.lifeState.emotion, personaMode: decision.personaMode };
  }

  async forceSave(): Promise<void> {
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
      this.saveDebounceTimer = null;
    }
    await this.saveAllData();
  }

  reset(): void {
    this.disableAutoSave();
    this.persistence.clearAllData();
    
    this.lifeState = JSON.parse(JSON.stringify(DEFAULT_LIFE_STATE));
    this.lifeState.relationship.relationshipType = this.profile.relationshipType;
    this.recentMessages = [];
    
    this.bodilySystem = new BodilySystem(this.lifeState.body);
    this.instinctSystem = new InstinctSystem(this.lifeState.instinct);
    this.emotionSystem = new EmotionSystem(
      this.lifeState.emotion,
      this.profile.personality,
      this.profile.tsundereLevel,
      this.profile.puaTendency
    );
    this.personaMatrix = new PersonaMatrixSystem(this.lifeState.persona, this.profile);
    this.memorySystem = new MemorySystem();
    this.growthEngine = new GrowthEvolutionEngine();
    this.causalSystem = new CausalSystem();
    
    this.seedMemories();
    this.enableAutoSave();
  }
}
