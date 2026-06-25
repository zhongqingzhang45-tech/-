export type ArchetypeId =
  | "caregiver"
  | "creator"
  | "sage"
  | "explorer"
  | "idealist"
  | "realist"
  | "rebel"
  | "healer"
  | "hero"
  | "lover"
  | "jester"
  | "innocent"
  | "ruler"
  | "magician"
  | "everyman"
  | "artist"
  | "mentor"
  | "warrior"
  | "seeker"
  | "alchemist";

export type AttachmentStyle = "secure" | "anxious" | "avoidant" | "disorganized";

export type CultureBackground = "eastern" | "western" | "southern" | "northern" | "cosmopolitan";

export type AestheticStyle =
  | "minimalist"
  | "maximalist"
  | "cyberpunk"
  | "ethereal"
  | "vintage"
  | "industrial"
  | "organic"
  | "geometric";

export type PhilosophicalLean =
  | "longtermism"
  | "stoicism"
  | "existentialism"
  | "taoism"
  | "utilitarianism"
  | "absurdism"
  | "zen"
  | "humanism";

export interface IdentityLayer {
  name: string;
  age: number;
  occupation: string;
  city: string;
  birthday: string;
  gender?: string;
  pronouns?: string;
}

export interface BackstoryLayer {
  childhood: string;
  teenage: string;
  university: string;
  postGraduation: string;
  keyTrauma?: string;
  keyVictory?: string;
  formativeEvents: string[];
}

export interface NeedsLayer {
  understanding: number;
  recognition: number;
  security: number;
  freedom: number;
  connection: number;
  achievement: number;
  growth: number;
  contribution: number;
  power?: number;
  belonging?: number;
  happiness?: number;
  beauty?: number;
  love?: number;
  truth?: number;
  [key: string]: number | undefined;
}

export interface FearsLayer {
  abandonment: number;
  oblivion: number;
  failure: number;
  rejection: number;
  lossOfControl: number;
  mediocrity: number;
  betrayal: number;
  vulnerability: number;
  loneliness?: number;
  stagnation?: number;
  specificFears: string[];
  [key: string]: number | string[] | undefined;
}

export interface ValuesLayer {
  love: number;
  family: number;
  career: number;
  wealth: number;
  freedom: number;
  truth: number;
  beauty: number;
  justice: number;
  loyalty: number;
  health: number;
  friendship?: number;
  security?: number;
  growth?: number;
  [key: string]: number | undefined;
}

export interface BigFiveTraits {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

export interface TraitsLayer extends BigFiveTraits {
  additionalTraits: string[];
}

export interface AttachmentLayer {
  style: AttachmentStyle;
  description: string;
  behavioralPatterns: string[];
}

export interface CultureLayer {
  background: CultureBackground;
  aesthetic: AestheticStyle;
  philosophy: PhilosophicalLean;
  favoriteArtists: string[];
  favoriteBooks: string[];
  favoriteMovies: string[];
  expressionStyle: string;
}

export interface GrowthMetrics {
  confidence: number;
  expressiveness: number;
  independence: number;
  emotionalAwareness: number;
  socialSkills: number;
  resilience: number;
}

export interface GrowthLayer {
  initial: GrowthMetrics;
  current: GrowthMetrics;
  goals: string[];
  growthTrajectory: "ascending" | "stable" | "fluctuating" | "descending";
  recentBreakthroughs: string[];
  ongoingStruggles: string[];
}

export interface DigitalPersona {
  id: string;
  archetype: ArchetypeId;
  identity: IdentityLayer;
  backstory: BackstoryLayer;
  needs: NeedsLayer;
  fears: FearsLayer;
  values: ValuesLayer;
  traits: TraitsLayer;
  attachment: AttachmentLayer;
  culture: CultureLayer;
  growth: GrowthLayer;
  createdAt: string;
  lastUpdated: string;
}

export interface PersonaArchetype {
  id: ArchetypeId;
  name: string;
  tagline: string;
  description: string;
  coreMotivation: string;
  coreFear: string;
  defaultNeeds: Partial<NeedsLayer>;
  defaultFears: Partial<FearsLayer>;
  defaultValues: Partial<ValuesLayer>;
  defaultTraits: Partial<TraitsLayer>;
  defaultAttachment: AttachmentStyle;
  defaultCulture: Partial<CultureLayer>;
  defaultGrowth: Partial<GrowthMetrics>;
  shadowSide: string[];
  strength: string[];
}

export type PersonaLayerKey =
  | "identity"
  | "backstory"
  | "needs"
  | "fears"
  | "values"
  | "traits"
  | "attachment"
  | "culture"
  | "growth";

export const PERSONA_LAYERS: { key: PersonaLayerKey; label: string; weight: number; description: string }[] = [
  { key: "identity", label: "身份层", weight: 5, description: "用户看到的外壳" },
  { key: "backstory", label: "经历层", weight: 10, description: "决定人格来源" },
  { key: "needs", label: "需求层", weight: 15, description: "行为的驱动力" },
  { key: "fears", label: "恐惧层", weight: 12, description: "逃避行为的根源" },
  { key: "values", label: "价值观层", weight: 15, description: "判断好坏的标准" },
  { key: "traits", label: "人格层", weight: 18, description: "稳定的行为模式" },
  { key: "attachment", label: "关系层", weight: 10, description: "亲密关系中的模式" },
  { key: "culture", label: "文化层", weight: 8, description: "表达方式的底色" },
  { key: "growth", label: "成长层", weight: 7, description: "进化的可能性" },
];
