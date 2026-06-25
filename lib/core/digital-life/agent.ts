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
} from "./types";
import {
  EventUnderstandingLayer,
  BodilySystem,
  InstinctSystem,
  EmotionSystem,
  DecisionEngine,
  PersonaMatrixSystem,
  MemorySystem,
} from "./systems";
import { SkillSystem, SkillResult } from "./skills";
import { ImageRecognition } from "./image-recognition";
import { GiftSystem } from "./gift-system";
import { ContextService } from "./context-service";
import { DeviceFingerprint } from "./device-binding";

export interface ResponseResult {
  text: string;
  emotion: EmotionState;
  actions?: string[];
  expression?: string;
  voiceText?: string;
  personaMode: PersonaMode;
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
  
  private recentMessages: ChatMessage[] = [];
  private maxRecentMessages: number = 100;
  
  private responseTemplates: Record<string, string[]> = {};

  constructor(profile: CharacterProfile) {
    this.profile = profile;
    this.lifeState = JSON.parse(JSON.stringify(DEFAULT_LIFE_STATE));
    this.lifeState.relationship.relationshipType = profile.relationshipType;
    
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
    
    this.initializeTemplates();
    this.seedMemories();
    this.initializeDeviceBinding();
  }

  private async initializeDeviceBinding(): Promise<void> {
    try {
      await this.deviceFingerprint.collectDeviceInfo();
      const email = typeof window !== "undefined" ? localStorage.getItem("lover_email") : "";
      const nickname = this.profile.userNickname;
      if (email) {
        await this.deviceFingerprint.createOrUpdateBinding(`user_${Date.now()}`, email, nickname);
      }
    } catch (e) {
      console.warn("Device binding initialization failed:", e);
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
      } else {
        responseText = this.generateResponse(decision, analysis, enrichedInput);
      }
    } else {
      responseText = this.generateResponse(decision, analysis, enrichedInput);
    }

    if (giftResult && giftResult.success && giftResult.message) {
      responseText = giftResult.message;
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
    this.updateGrowth();

    this.lifeState.relationship.lastActiveTime = Date.now();
    this.lifeState.lastUpdateTime = Date.now();

    return {
      text: responseText,
      emotion: this.lifeState.emotion,
      actions: decision.actionPlan,
      expression: this.lifeState.emotion.mood,
      voiceText: responseText,
      personaMode: decision.personaMode,
    };
  }

  private generateResponse(
    decision: DecisionResult,
    analysis: { intent: string; keywords: string[] },
    userInput: string
  ): string {
    let templateKey = "default";

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
        templateKey = "aggressive";
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

    if (this.lifeState.emotion.intensity > 0.6 && Math.random() < 0.3) {
      text = this.addEmotionalFlair(text, decision.emotionTarget);
    }

    if (Math.random() < 0.1 && decision.personaMode === "normal") {
      text = this.addCatchphrase(text);
    }

    if (decision.shouldInitiate && Math.random() < 0.2) {
      const initiativeText = this.getInitiativeText();
      if (initiativeText) {
        text = `${text}\n\n${initiativeText}`;
      }
    }

    return text;
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

  private updateGrowth(): void {
    const growth = this.lifeState.growth;
    growth.experience += 1;
    
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
  }

  triggerMood(mood: any, intensity: number = 0.8): void {
    this.emotionSystem.triggerMood(mood, intensity);
    this.lifeState.emotion = { ...this.emotionSystem.state };
  }

  reconcile(): boolean {
    if (!this.lifeState.relationship.coldTreatmentActive) return false;
    this.lifeState.relationship.coldTreatmentActive = false;
    this.lifeState.relationship.reconciliationAvailable = false;
    this.personaMatrix.state.resentment = Math.max(0, this.personaMatrix.state.resentment - 15);
    this.lifeState.persona.resentment = this.personaMatrix.state.resentment;
    this.lifeState.currentMode = "reconciliation";
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
}
