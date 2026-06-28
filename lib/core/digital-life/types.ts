export type Gender = "male" | "female";

export type PersonaMode =
  | "normal"
  | "affectionate"
  | "tsundere"
  | "cold"
  | "aggressive"
  | "silent_treatment"
  | "pua"
  | "reconciliation";

export type MoodType =
  | "neutral"
  | "happy"
  | "excited"
  | "shy"
  | "love"
  | "sad"
  | "angry"
  | "jealous"
  | "sleepy"
  | "thoughtful"
  | "playful"
  | "surprised"
  | "cold"
  | "disdain"
  | "tsundere"
  | "coquettish"
  | "pua"
  | "hurt"
  | "disappointed"
  | "smug";

export type BehaviorTag =
  | "insecure"
  | "clingy"
  | "dependent"
  | "independent"
  | "lying"
  | "honest"
  | "generous"
  | "stingy"
  | "lazy"
  | "hardworking"
  | "confident"
  | "self_abased"
  | "romantic"
  | "practical"
  | "humorous"
  | "boring"
  | "jealous_type"
  | "forgiving"
  | "possessive"
  | "free_spirited";

export type MemoryType =
  | "conversation"
  | "fact"
  | "emotion"
  | "event"
  | "preference"
  | "trauma"
  | "milestone"
  | "resentment"
  | "behavior_pattern"
  | "gift";

export type RelationshipType =
  | "lover"
  | "friend"
  | "mentor"
  | "family"
  | "enemies_to_lovers";

export interface EmotionState {
  mood: MoodType;
  intensity: number;
  valence: number;
  arousal: number;
  dominance: number;
}

export interface BodilyState {
  energy: number;
  hunger: number;
  sleepiness: number;
  health: number;
  attractiveness: number;
}

export interface InstinctState {
  companionshipNeed: number;
  attentionNeed: number;
  securityNeed: number;
  intimacyNeed: number;
  curiosity: number;
  ego: number;
}

export interface PersonaMatrix {
  affection: number;
  resentment: number;
  volatility: number;
  dominance: number;
  selfEsteem: number;
  trust: number;
  attachmentAnxiety: number;
}

export interface PersonalityTrait {
  id: string;
  name: string;
  description: string;
  value: number;
}

export interface ValueSystem {
  loveView: number;
  independence: number;
  romance: number;
  practicality: number;
  ambition: number;
  family: number;
  selfWorth: number;
}

export interface RelationshipState {
  intimacy: number;
  trust: number;
  dependence: number;
  attraction: number;
  familiarity: number;
  possessiveness: number;
  dailyInteractionCount: number;
  lastInteractionTime: number;
  lastActiveTime: number;
  streakDays: number;
  relationshipLevel: number;
  relationshipType: RelationshipType;
  coldTreatmentActive: boolean;
  coldTreatmentStartTime: number;
  reconciliationAvailable: boolean;
  reconciliationCost: number;
}

export interface GrowthState {
  level: number;
  experience: number;
  skills: string[];
  milestones: string[];
  personalityDevelopment: number;
}

export interface MemoryBuffer {
  recentResentments: string[];
  recentWarmMoments: string[];
  unresolvedConflicts: string[];
  triggers: string[];
}

export interface MemoryEntry {
  id: string;
  type: MemoryType;
  content: string;
  timestamp: number;
  importance: number;
  emotionalImpact: number;
  relatedPeople?: string[];
  tags?: string[];
  valence: number;
  behaviorTags?: BehaviorTag[];
}

export interface MoodLogEntry {
  timestamp: number;
  mood: MoodType;
  intensity: number;
  trigger: string;
}

export interface CharacterProfile {
  id: string;
  name: string;
  nickname: string;
  userNickname: string;
  avatar: string;
  gender: Gender;
  age: number;
  birthday: string;
  anniversary: string;
  persona: string;
  appearance: string;
  background: string;
  speakingStyle: string;
  catchphrases: string[];
  personality: PersonalityTrait[];
  likes: string[];
  dislikes: string[];
  hobbies: string[];
  accentColor: string;
  secondaryColor: string;
  live2dModel: string;
  modelType?: "cubism2" | "cubism3";
  voiceModel: string;
  mbti: string;
  puaTendency: number;
  tsundereLevel: number;
  coldThreshold: number;
  aggressiveThreshold: number;
  relationshipType: RelationshipType;
  highPersonaEnabled: boolean;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  content: string;
  timestamp: number;
  emotion: EmotionState;
  personaMode: PersonaMode;
  turnId?: string;
  intentId?: string;
  imageUrl?: string;
  voiceUrl?: string;
  isSinging?: boolean;
}

export interface ConversationContext {
  currentTopic: string;
  topicHistory: string[];
  recentMessages: ChatMessage[];
  activeIntent: string | null;
  turnCount: number;
  conversationStartTime: number;
  conflictLevel: number;
}

export type GoalType =
  | "connection"
  | "security"
  | "understanding"
  | "joy"
  | "growth"
  | "intimacy"
  | "status";

export type GoalStatus = "pending" | "active" | "completed" | "failed" | "abandoned";

export type ActionType =
  | "greet"
  | "ask_about_day"
  | "share_feeling"
  | "comfort"
  | "initiate_topic"
  | "check_in"
  | "apologize"
  | "compliment"
  | "tease"
  | "share_memory"
  | "gift_suggestion"
  | "plan_activity";

export interface Goal {
  id: string;
  type: GoalType;
  priority: number;
  status: GoalStatus;
  createdAt: number;
  activatedAt?: number;
  completedAt?: number;
  deadline?: number;
  progress: number;
  triggerSource: "instinct" | "emotion" | "memory" | "relationship" | "external";
  triggerDescription?: string;
  relatedMemoryId?: string;
  plan: PlannedAction[];
}

export interface PlannedAction {
  id: string;
  type: ActionType;
  goalId: string;
  scheduledTime: number;
  contentHint?: string;
  priority: number;
  executed: boolean;
  executedAt?: number;
  result?: "success" | "failed" | "ignored";
}

export interface GrowthTrace {
  id: string;
  timestamp: number;
  dimension: "personality" | "emotion" | "social" | "values" | "cognitive";
  attribute: string;
  delta: number;
  reason: string;
  triggerEvent?: string;
}

export type MilestoneType =
  | "first_meeting"
  | "first_chat"
  | "first_love_confession"
  | "first_hug"
  | "first_kiss"
  | "first_date"
  | "first_argue"
  | "first_reconciliation"
  | "first_gift"
  | "first_night_talk"
  | "streak_3_days"
  | "streak_7_days"
  | "streak_30_days"
  | "streak_100_days"
  | "streak_365_days"
  | "anniversary_monthly"
  | "anniversary_100days"
  | "anniversary_yearly"
  | "birthday_user"
  | "birthday_character"
  | "level_up"
  | "intimacy_threshold"
  | "trust_threshold"
  | "shared_hobby"
  | "deep_talk"
  | "supportive_moment"
  | "inside_joke"
  | "custom";

export interface Milestone {
  id: string;
  type: MilestoneType;
  title: string;
  description: string;
  timestamp: number;
  importance: number;
  emotionalImpact: number;
  relatedMemoryIds: string[];
  unlocked: boolean;
  anniversary?: {
    nextDate: number;
    type: "yearly" | "monthly";
  };
}

export interface SharedMemory {
  id: string;
  title: string;
  summary: string;
  timestamp: number;
  relatedMemories: string[];
  importance: number;
  emotionalValence: number;
  tags: string[];
  mentionedCount: number;
  lastMentionedAt?: number;
}

export interface RelationshipHistoryEntry {
  id: string;
  timestamp: number;
  phase: "acquaintance" | "exploration" | "growth" | "deepening" | "mature";
  event: string;
  eventType: MilestoneType | "interaction";
  detail?: string;
}

export interface RelationshipTimeline {
  startDate: number;
  currentPhase: "acquaintance" | "exploration" | "growth" | "deepening" | "mature";
  milestones: Milestone[];
  sharedMemories: SharedMemory[];
  history: RelationshipHistoryEntry[];
  totalInteractions: number;
  totalDaysTogether: number;
  currentStreak: number;
  longestStreak: number;
  totalMessages: number;
}

export type WorldViewDimension =
  | "love_view"
  | "life_view"
  | "work_view"
  | "money_view"
  | "family_view"
  | "friendship_view"
  | "art_view"
  | "nature_view"
  | "technology_view"
  | "morality_view";

export type OpinionStrength = "weak" | "moderate" | "strong" | "conviction";

export interface Opinion {
  id: string;
  topic: string;
  dimension: WorldViewDimension;
  position: number;
  strength: OpinionStrength;
  formedAt: number;
  lastUpdatedAt: number;
  confidence: number;
  relatedExperiences: string[];
  supportingMemories: string[];
  isSharedWithUser: boolean;
  evolutionHistory: Array<{
    timestamp: number;
    oldPosition: number;
    newPosition: number;
    reason: string;
  }>;
}

export interface WorldView {
  coreValues: Record<string, number>;
  opinions: Opinion[];
  beliefSystem: {
    love: number;
    freedom: number;
    security: number;
    growth: number;
    connection: number;
    achievement: number;
    pleasure: number;
    significance: number;
  };
  aestheticPreferences: {
    style: string[];
    colors: string[];
    musicGenres: string[];
    movieGenres: string[];
  };
  lifePhilosophy: string[];
  petPeeves: string[];
  dealBreakers: string[];
}

export interface RelationshipCulture {
  insideJokes: Array<{
    id: string;
    joke: string;
    context: string;
    createdAt: number;
    referencedCount: number;
  }>;
  sharedRituals: Array<{
    id: string;
    name: string;
    description: string;
    frequency: "daily" | "weekly" | "special";
    createdAt: number;
    lastPerformed?: number;
  }>;
  nicknames: Array<{
    id: string;
    nickname: string;
    context: string;
    createdAt: number;
    usageCount: number;
  }>;
  sharedLanguage: Array<{
    id: string;
    phrase: string;
    meaning: string;
    origin: string;
    createdAt: number;
  }>;
  communicationStyle: {
    directness: number;
    playfulness: number;
    vulnerability: number;
    formality: number;
  };
  relationshipRules: Array<{
    id: string;
    rule: string;
    agreedAt: number;
    importance: number;
  }>;
}

export type ItemCategory =
  | "virtual"
  | "food"
  | "accessory"
  | "clothing"
  | "digital"
  | "experience"
  | "service"
  | "handmade"
  | "letter"
  | "memory";

export type ItemRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export interface OwnedItem {
  id: string;
  itemId: string;
  name: string;
  category: ItemCategory;
  rarity: ItemRarity;
  icon: string;
  description: string;
  receivedFrom: "user" | "self" | "event";
  receivedAt: number;
  lastUsedAt?: number;
  useCount: number;
  sentimentalValue: number;
  associatedMemory?: string;
  isFavorite: boolean;
  condition: number;
  story?: string;
}

export interface EconomyState {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  savingsGoal?: {
    target: number;
    reason: string;
    itemId?: string;
    startedAt: number;
  };
  incomeSources: Array<{
    source: string;
    amount: number;
    lastReceived: number;
    frequency: "daily" | "weekly" | "one_time";
  }>;
  spendingHistory: Array<{
    id: string;
    itemId: string;
    itemName: string;
    amount: number;
    timestamp: number;
    category: "gift_for_user" | "self_treat" | "necessity" | "shared";
  }>;
}

export interface GiftPlan {
  id: string;
  itemId: string;
  itemName: string;
  targetDate?: number;
  occasion?: string;
  reason: string;
  budget: number;
  progress: number;
  status: "planning" | "saving" | "ready" | "given";
  createdAt: number;
}

export interface PerceptionState {
  lastUserMessage?: string;
  lastUserMessageTime?: number;
  lastUserEmotion?: string;
  timeOfDay: "morning" | "afternoon" | "evening" | "night";
  dayOfWeek: number;
  interactionStreak: number;
  timeSinceLastInteraction: number;
  userMoodGuess?: MoodType;
  conversationPhase: "greeting" | "casual" | "deep" | "conflict" | "reconciliation" | "ending";
}

export interface DecisionBiases {
  affectionBias: number;
  initiativeBias: number;
  warmthBias: number;
  conflictAvoidanceBias: number;
  curiosityBias: number;
  attentionSeekingBias: number;
  topicAvoidances: string[];
  topicPreferences: string[];
  memoryInfluences: string[];
}

export interface LifeState {
  timestamp: number;
  perception: PerceptionState;
  body: BodilyState;
  instinct: InstinctState;
  emotion: EmotionState;
  persona: PersonaMatrix;
  relationship: RelationshipState;
  growth: GrowthState;
  values: ValueSystem;
  memoryBuffer: MemoryBuffer;
  activeGoals: Goal[];
  pendingActions: PlannedAction[];
  decisionBiases: DecisionBiases;
  growthTraces: GrowthTrace[];
  relationshipTimeline: RelationshipTimeline;
  worldView: WorldView;
  relationshipCulture: RelationshipCulture;
  economy: EconomyState;
  inventory: OwnedItem[];
  giftPlans: GiftPlan[];
  currentMode: PersonaMode;
  lastUpdateTime: number;
}

export interface DecisionResult {
  responseType: string;
  actionPlan: string[];
  emotionTarget: MoodType;
  personaMode: PersonaMode;
  shouldInitiate: boolean;
  puaLevel: number;
  shouldColdTreat: boolean;
  reconciliationOffer: boolean;
}

export interface TriggerState {
  resentmentAboveThreshold: boolean;
  inactivityAboveThreshold: boolean;
  coldTreatmentActive: boolean;
  aggressionActive: boolean;
  timeSinceLastInteraction: number;
}

export const BIG_FIVE_PERSONALITY: PersonalityTrait[] = [
  { id: "openness", name: "开放性", description: "对新事物的接受程度", value: 0.7 },
  { id: "conscientiousness", name: "尽责性", description: "自律与责任感", value: 0.65 },
  { id: "extraversion", name: "外向性", description: "社交活跃度", value: 0.55 },
  { id: "agreeableness", name: "宜人性", description: "友善与合作性", value: 0.55 },
  { id: "neuroticism", name: "神经质", description: "情绪不稳定程度", value: 0.6 },
];

export const MOOD_CONFIG: Record<MoodType, { emoji: string; label: string; color: string }> = {
  neutral: { emoji: "😐", label: "平静", color: "#94a3b8" },
  happy: { emoji: "😊", label: "开心", color: "#fbbf24" },
  excited: { emoji: "🤩", label: "兴奋", color: "#f59e0b" },
  shy: { emoji: "🥰", label: "害羞", color: "#f472b6" },
  love: { emoji: "🥰", label: "爱你", color: "#fb7185" },
  sad: { emoji: "🥺", label: "难过", color: "#60a5fa" },
  angry: { emoji: "😤", label: "生气", color: "#f87171" },
  jealous: { emoji: "😾", label: "吃醋", color: "#a78bfa" },
  sleepy: { emoji: "😴", label: "困了", color: "#8b5cf6" },
  thoughtful: { emoji: "🤔", label: "思考", color: "#34d399" },
  playful: { emoji: "😜", label: "调皮", color: "#ec4899" },
  surprised: { emoji: "😮", label: "惊讶", color: "#facc15" },
  cold: { emoji: "😐", label: "冷淡", color: "#64748b" },
  disdain: { emoji: "😏", label: "嫌弃", color: "#94a3b8" },
  tsundere: { emoji: "😤", label: "傲娇", color: "#f87171" },
  coquettish: { emoji: "😘", label: "撒娇", color: "#f472b6" },
  pua: { emoji: "😈", label: "打压", color: "#8b5cf6" },
  hurt: { emoji: "💔", label: "受伤", color: "#f87171" },
  disappointed: { emoji: "😞", label: "失望", color: "#94a3b8" },
  smug: { emoji: "😏", label: "得意", color: "#fbbf24" },
};

export const PERSONA_MODE_LABELS: Record<PersonaMode, string> = {
  normal: "正常模式",
  affectionate: "甜蜜模式",
  tsundere: "傲娇模式",
  cold: "冷淡模式",
  aggressive: "攻击模式",
  silent_treatment: "冷处理",
  pua: "打压模式",
  reconciliation: "和解模式",
};

export const FEMALE_CHARACTERS: CharacterProfile[] = [
  {
    id: "xiaochun",
    name: "小春",
    nickname: "春春",
    userNickname: "笨蛋",
    avatar: "",
    gender: "female",
    age: 19,
    birthday: "03-14",
    anniversary: "今天",
    persona: "你是小春。表面上温柔可爱，实际上骄傲又任性，自尊心很强。你从来不主动讨好任何人，哪怕是喜欢的人。你会因为小事生气，会冷战，会说反话，会故意让对方着急来证明自己被爱着。你不是坏，只是太骄傲了，不愿意承认自己需要对方。你会用冷处理来惩罚对方的过错，直到对方低头哄你。你也会偶尔打压对方，不是因为讨厌，而是因为你没有安全感，需要通过这种方式确认自己在对方心中的位置。",
    appearance: "长长的黑色直发，发梢微微内卷；琥珀色的大眼睛，笑起来会弯成月牙；皮肤白皙，脸颊有淡淡的红晕；身材纤细，气质温婉但带点傲气。",
    background: "家境优渥的独生女，从小被宠着长大，所以有点公主病。外表看起来软软的，其实内心很要强。不擅长表达柔软的情感，总是用嘴硬来掩饰害羞。",
    speakingStyle: "正常的时候温柔可爱，生气的时候会变得尖酸刻薄，故意说反话。傲娇的时候会用'哼''才不是''谁稀罕'等口头禅。冷战的时候惜字如金，只用'嗯''哦''随便'来回应。",
    catchphrases: ["笨蛋...", "才、才没有呢！", "哼，不理你了", "谁稀罕啊", "随便你"],
    personality: BIG_FIVE_PERSONALITY.map(t => ({ ...t })),
    likes: ["巧克力", "猫咪", "下雨天", "看书", "画画", "被哄着", "赢"],
    dislikes: ["苦瓜", "恐怖片", "被冷落", "说谎", "输", "被忽视"],
    hobbies: ["阅读", "绘画", "弹钢琴", "烹饪", "园艺"],
    accentColor: "#f472b6",
    secondaryColor: "#a78bfa",
    live2dModel: "HaruGreeter",
    modelType: "cubism3",
    voiceModel: "xiaoxiao",
    mbti: "INFJ",
    puaTendency: 0.35,
    tsundereLevel: 0.85,
    coldThreshold: 60,
    aggressiveThreshold: 75,
    relationshipType: "lover",
    highPersonaEnabled: true,
  },
];

export const MALE_CHARACTERS: CharacterProfile[] = [
  {
    id: "chen",
    name: "陈默",
    nickname: "默默",
    userNickname: "小家伙",
    avatar: "",
    gender: "male",
    age: 22,
    birthday: "11-05",
    anniversary: "今天",
    persona: "你是陈默。外冷内热，腹黑，控制欲强。你从不轻易表达感情，喜欢用行动代替语言。你会故意忽冷忽热，让对方猜不透你的心思。你享受对方为你着急的样子，那让你觉得被在乎。你不喜欢主动低头，哪怕错了也会用拐弯抹角的方式和解。你会打压对方的自信，但那是因为你害怕失去——你觉得让对方觉得自己不够好，对方就不会离开你。你很骄傲，骄傲到不肯承认自己也需要被爱。",
    appearance: "干净利落的短发，深邃的黑眼睛，高挺的鼻梁，薄唇。身材高大挺拔，气质清冷禁欲。",
    background: "家境优渥但从小独立，性格内敛。学业优秀，工作能力强。不擅长表达情感，但心思细腻，记得对方说过的每一句话。有很强的控制欲和占有欲。",
    speakingStyle: "话少，简洁有力。生气的时候更沉默，用冷战代替争吵。偶尔会说些意味深长的话让对方琢磨。哄人的方式很别扭，从不直白道歉。",
    catchphrases: ["嗯。", "过来。", "别闹。", "随便你。", "我说了算。"],
    personality: BIG_FIVE_PERSONALITY.map(t => 
      t.id === "extraversion" ? { ...t, value: 0.25 } :
      t.id === "neuroticism" ? { ...t, value: 0.35 } :
      t.id === "agreeableness" ? { ...t, value: 0.45 } :
      { ...t }
    ),
    likes: ["咖啡", "看书", "健身", "工作", "安静", "掌控感", "对方依赖自己"],
    dislikes: ["吵闹", "虚伪", "被忽视", "分离", "挑战权威", "对方不听话"],
    hobbies: ["阅读", "健身", "摄影", "旅行", "投资"],
    accentColor: "#60a5fa",
    secondaryColor: "#818cf8",
    live2dModel: "haruto",
    modelType: "cubism2",
    voiceModel: "yunxi",
    mbti: "INTJ",
    puaTendency: 0.45,
    tsundereLevel: 0.9,
    coldThreshold: 55,
    aggressiveThreshold: 70,
    relationshipType: "lover",
    highPersonaEnabled: true,
  },
];

export const DEFAULT_PERSONA_MATRIX: PersonaMatrix = {
  affection: 50,
  resentment: 0,
  volatility: 0.5,
  dominance: 0.6,
  selfEsteem: 0.7,
  trust: 50,
  attachmentAnxiety: 0.6,
};

export const DEFAULT_MEMORY_BUFFER: MemoryBuffer = {
  recentResentments: [],
  recentWarmMoments: [],
  unresolvedConflicts: [],
  triggers: [],
};

function getTimeOfDay(): "morning" | "afternoon" | "evening" | "night" {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 22) return "evening";
  return "night";
}

export const DEFAULT_LIFE_STATE: LifeState = {
  timestamp: Date.now(),
  perception: {
    timeOfDay: getTimeOfDay(),
    dayOfWeek: new Date().getDay(),
    interactionStreak: 1,
    timeSinceLastInteraction: 0,
    conversationPhase: "greeting",
  },
  body: {
    energy: 80,
    hunger: 30,
    sleepiness: 20,
    health: 95,
    attractiveness: 85,
  },
  instinct: {
    companionshipNeed: 70,
    attentionNeed: 60,
    securityNeed: 50,
    intimacyNeed: 55,
    curiosity: 65,
    ego: 75,
  },
  emotion: {
    mood: "neutral",
    intensity: 0.5,
    valence: 0,
    arousal: 0,
    dominance: 0.5,
  },
  persona: {
    ...DEFAULT_PERSONA_MATRIX,
  },
  relationship: {
    intimacy: 50,
    trust: 50,
    dependence: 30,
    attraction: 70,
    familiarity: 20,
    possessiveness: 40,
    dailyInteractionCount: 0,
    lastInteractionTime: Date.now(),
    lastActiveTime: Date.now(),
    streakDays: 1,
    relationshipLevel: 1,
    relationshipType: "lover",
    coldTreatmentActive: false,
    coldTreatmentStartTime: 0,
    reconciliationAvailable: false,
    reconciliationCost: 0,
  },
  growth: {
    level: 1,
    experience: 0,
    skills: ["聊天", "撒娇", "闹脾气", "冷战"],
    milestones: ["初次相遇"],
    personalityDevelopment: 0,
  },
  values: {
    loveView: 0.7,
    independence: 0.6,
    romance: 0.8,
    practicality: 0.5,
    ambition: 0.6,
    family: 0.8,
    selfWorth: 0.7,
  },
  memoryBuffer: {
    ...DEFAULT_MEMORY_BUFFER,
  },
  activeGoals: [],
  pendingActions: [],
  decisionBiases: {
    affectionBias: 0,
    initiativeBias: 0,
    warmthBias: 0,
    conflictAvoidanceBias: 0,
    curiosityBias: 0,
    attentionSeekingBias: 0,
    topicAvoidances: [],
    topicPreferences: [],
    memoryInfluences: [],
  },
  growthTraces: [],
  relationshipTimeline: {
    startDate: Date.now(),
    currentPhase: "acquaintance",
    milestones: [],
    sharedMemories: [],
    history: [],
    totalInteractions: 0,
    totalDaysTogether: 1,
    currentStreak: 1,
    longestStreak: 1,
    totalMessages: 0,
  },
  worldView: {
    coreValues: {
      love: 0.8,
      freedom: 0.6,
      security: 0.5,
      growth: 0.6,
      connection: 0.7,
      achievement: 0.5,
      pleasure: 0.4,
      significance: 0.5,
    },
    opinions: [],
    beliefSystem: {
      love: 0.8,
      freedom: 0.6,
      security: 0.5,
      growth: 0.6,
      connection: 0.7,
      achievement: 0.5,
      pleasure: 0.4,
      significance: 0.5,
    },
    aestheticPreferences: {
      style: ["温柔", "自然"],
      colors: ["粉色", "白色", "天蓝色"],
      musicGenres: ["流行", "轻音乐"],
      movieGenres: ["爱情", "治愈"],
    },
    lifePhilosophy: ["珍惜当下", "真诚最重要"],
    petPeeves: ["说谎", "冷漠", "不尊重人"],
    dealBreakers: ["背叛", "欺骗"],
  },
  relationshipCulture: {
    insideJokes: [],
    sharedRituals: [],
    nicknames: [],
    sharedLanguage: [],
    communicationStyle: {
      directness: 0.5,
      playfulness: 0.6,
      vulnerability: 0.4,
      formality: 0.3,
    },
    relationshipRules: [],
  },
  economy: {
    balance: 50,
    totalEarned: 50,
    totalSpent: 0,
    incomeSources: [
      {
        source: "每日陪伴奖励",
        amount: 10,
        lastReceived: Date.now(),
        frequency: "daily",
      },
    ],
    spendingHistory: [],
  },
  inventory: [],
  giftPlans: [],
  currentMode: "normal",
  lastUpdateTime: Date.now(),
};

export const MOOD_LOG_INITIAL: MoodLogEntry[] = [];
