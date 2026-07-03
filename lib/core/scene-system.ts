export type TimeOfDay = "morning" | "noon" | "afternoon" | "sunset" | "evening" | "night" | "dawn";

export type SceneId =
  | "bedroom"
  | "park"
  | "cafe"
  | "beach"
  | "library"
  | "rooftop"
  | "starry"
  | "sakura";

export interface SceneConfig {
  id: SceneId;
  name: string;
  emoji: string;
  description: string;
  background: string;
  ambientGradient: string;
  particleType?: ParticleType;
  defaultTimeOfDay: TimeOfDay;
}

export type ParticleType = "hearts" | "petals" | "stars" | "snow" | "bubbles" | "fireflies" | "none";

export interface LightingConfig {
  timeOfDay: TimeOfDay;
  name: string;
  emoji: string;
  overlayColor: string;
  overlayOpacity: number;
  ambientLight: string;
  shadowColor: string;
  temperature: number;
}

export const SCENE_CONFIGS: SceneConfig[] = [
  {
    id: "bedroom",
    name: "温馨卧室",
    emoji: "🛏️",
    description: "柔和的灯光，温暖的被窝",
    background: `
      linear-gradient(180deg,
        #2a1f3d 0%,
        #3d2f5c 20%,
        #4a3a6b 40%,
        #5b4783 60%,
        #6b5393 80%,
        #7c61a3 100%
      )`,
    ambientGradient: "radial-gradient(ellipse at 50% 70%, rgba(255,200,150,0.15) 0%, transparent 60%)",
    particleType: "bubbles",
    defaultTimeOfDay: "evening",
  },
  {
    id: "park",
    name: "阳光公园",
    emoji: "🌳",
    description: "绿草如茵，微风拂面",
    background: `
      linear-gradient(180deg,
        #87ceeb 0%,
        #98d8e8 25%,
        #b8e0d2 50%,
        #a8d8b9 70%,
        #8cc6a9 85%,
        #6ba88a 100%
      )`,
    ambientGradient: "radial-gradient(ellipse at 50% 30%, rgba(255,255,200,0.2) 0%, transparent 50%)",
    particleType: "bubbles",
    defaultTimeOfDay: "noon",
  },
  {
    id: "cafe",
    name: "咖啡小馆",
    emoji: "☕",
    description: "浓郁的咖啡香，慵懒的午后",
    background: `
      linear-gradient(180deg,
        #3e2723 0%,
        #4e342e 20%,
        #5d4037 40%,
        #6d4c41 60%,
        #795548 80%,
        #8d6e63 100%
      )`,
    ambientGradient: "radial-gradient(ellipse at 50% 60%, rgba(255,180,100,0.2) 0%, transparent 55%)",
    particleType: "none",
    defaultTimeOfDay: "afternoon",
  },
  {
    id: "beach",
    name: "海边沙滩",
    emoji: "🏖️",
    description: "海浪声声，夕阳无限",
    background: `
      linear-gradient(180deg,
        #ffd89b 0%,
        #ffb88c 20%,
        #ff9a8b 35%,
        #98d8e8 50%,
        #6ec6e8 70%,
        #f0d9b5 85%,
        #e8c89b 100%
      )`,
    ambientGradient: "radial-gradient(ellipse at 70% 40%, rgba(255,180,100,0.25) 0%, transparent 60%)",
    particleType: "none",
    defaultTimeOfDay: "sunset",
  },
  {
    id: "sakura",
    name: "樱花树下",
    emoji: "🌸",
    description: "樱花纷飞，浪漫满溢",
    background: `
      linear-gradient(180deg,
        #fce4ec 0%,
        #f8bbd9 20%,
        #f48fb1 40%,
        #ec9ab5 55%,
        #dce775 70%,
        #c5e1a5 85%,
        #aed581 100%
      )`,
    ambientGradient: "radial-gradient(ellipse at 50% 40%, rgba(255,200,220,0.3) 0%, transparent 50%)",
    particleType: "petals",
    defaultTimeOfDay: "afternoon",
  },
  {
    id: "starry",
    name: "星空之下",
    emoji: "🌌",
    description: "繁星点点，许下心愿",
    background: `
      linear-gradient(180deg,
        #0d1b2a 0%,
        #1b263b 20%,
        #283845 40%,
        #1a1a2e 60%,
        #16213e 80%,
        #0f0f23 100%
      )`,
    ambientGradient: "radial-gradient(ellipse at 50% 80%, rgba(100,100,255,0.1) 0%, transparent 50%)",
    particleType: "stars",
    defaultTimeOfDay: "night",
  },
  {
    id: "rooftop",
    name: "城市天台",
    emoji: "🌃",
    description: "霓虹闪烁，城市夜景",
    background: `
      linear-gradient(180deg,
        #1a1a2e 0%,
        #16213e 25%,
        #2d3561 40%,
        #1a1a2e 55%,
        #0f0f1e 70%,
        #1a0a2e 85%,
        #2a0a3e 100%
      )`,
    ambientGradient: "radial-gradient(ellipse at 50% 70%, rgba(255,100,200,0.1) 0%, transparent 55%)",
    particleType: "fireflies",
    defaultTimeOfDay: "night",
  },
  {
    id: "library",
    name: "安静书房",
    emoji: "📚",
    description: "书香弥漫，静享时光",
    background: `
      linear-gradient(180deg,
        #4a3426 0%,
        #5d4434 20%,
        #6d5444 40%,
        #7d6454 60%,
        #8d7464 80%,
        #9d8474 100%
      )`,
    ambientGradient: "radial-gradient(ellipse at 50% 50%, rgba(255,200,150,0.15) 0%, transparent 50%)",
    particleType: "none",
    defaultTimeOfDay: "evening",
  },
];

export const LIGHTING_CONFIGS: Record<TimeOfDay, LightingConfig> = {
  morning: {
    timeOfDay: "morning",
    name: "清晨",
    emoji: "🌅",
    overlayColor: "#fff8e1",
    overlayOpacity: 0.05,
    ambientLight: "rgba(255,248,225,0.1)",
    shadowColor: "rgba(255,200,150,0.2)",
    temperature: 5500,
  },
  noon: {
    timeOfDay: "noon",
    name: "正午",
    emoji: "☀️",
    overlayColor: "#ffffff",
    overlayOpacity: 0.02,
    ambientLight: "rgba(255,255,255,0.05)",
    shadowColor: "rgba(255,255,255,0.15)",
    temperature: 6500,
  },
  afternoon: {
    timeOfDay: "afternoon",
    name: "午后",
    emoji: "🌤️",
    overlayColor: "#fff3e0",
    overlayOpacity: 0.06,
    ambientLight: "rgba(255,220,180,0.1)",
    shadowColor: "rgba(255,200,150,0.2)",
    temperature: 5000,
  },
  sunset: {
    timeOfDay: "sunset",
    name: "黄昏",
    emoji: "🌇",
    overlayColor: "#ff6b35",
    overlayOpacity: 0.12,
    ambientLight: "rgba(255,107,53,0.15)",
    shadowColor: "rgba(255,150,80,0.25)",
    temperature: 3200,
  },
  evening: {
    timeOfDay: "evening",
    name: "傍晚",
    emoji: "🌆",
    overlayColor: "#7c4dff",
    overlayOpacity: 0.1,
    ambientLight: "rgba(124,77,255,0.12)",
    shadowColor: "rgba(100,80,200,0.2)",
    temperature: 4000,
  },
  night: {
    timeOfDay: "night",
    name: "深夜",
    emoji: "🌙",
    overlayColor: "#1a237e",
    overlayOpacity: 0.2,
    ambientLight: "rgba(26,35,126,0.15)",
    shadowColor: "rgba(30,30,80,0.3)",
    temperature: 2500,
  },
  dawn: {
    timeOfDay: "dawn",
    name: "黎明",
    emoji: "🌄",
    overlayColor: "#ffab91",
    overlayOpacity: 0.08,
    ambientLight: "rgba(255,171,145,0.12)",
    shadowColor: "rgba(255,150,120,0.2)",
    temperature: 3500,
  },
};

export function getTimeOfDayFromDate(date: Date = new Date()): TimeOfDay {
  const hour = date.getHours();
  if (hour >= 5 && hour < 8) return "dawn";
  if (hour >= 8 && hour < 11) return "morning";
  if (hour >= 11 && hour < 14) return "noon";
  if (hour >= 14 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 19) return "sunset";
  if (hour >= 19 && hour < 22) return "evening";
  return "night";
}

export function getSceneConfig(id: SceneId): SceneConfig {
  return SCENE_CONFIGS.find(s => s.id === id) || SCENE_CONFIGS[0];
}

export function getLightingConfig(timeOfDay: TimeOfDay): LightingConfig {
  return LIGHTING_CONFIGS[timeOfDay];
}

export interface ParticleConfig {
  type: ParticleType;
  count: number;
  minSize: number;
  maxSize: number;
  minSpeed: number;
  maxSpeed: number;
  minOpacity: number;
  maxOpacity: number;
  colors: string[];
  shapes: ("circle" | "star" | "heart" | "petal")[];
  drift: number;
}

export const PARTICLE_CONFIGS: Record<ParticleType, ParticleConfig> = {
  hearts: {
    type: "hearts",
    count: 15,
    minSize: 8,
    maxSize: 20,
    minSpeed: 0.3,
    maxSpeed: 1.0,
    minOpacity: 0.3,
    maxOpacity: 0.8,
    colors: ["#ff6b9d", "#ff8fb1", "#ffb3c6", "#ff4d8d"],
    shapes: ["heart"],
    drift: 0.5,
  },
  petals: {
    type: "petals",
    count: 25,
    minSize: 6,
    maxSize: 14,
    minSpeed: 0.2,
    maxSpeed: 0.8,
    minOpacity: 0.4,
    maxOpacity: 0.9,
    colors: ["#ffb7c5", "#ffc9d6", "#ffd6e0", "#ff9ec0"],
    shapes: ["petal"],
    drift: 1.0,
  },
  stars: {
    type: "stars",
    count: 60,
    minSize: 1,
    maxSize: 3,
    minSpeed: 0,
    maxSpeed: 0.1,
    minOpacity: 0.3,
    maxOpacity: 1.0,
    colors: ["#ffffff", "#e0e0ff", "#fffaf0", "#fffacd"],
    shapes: ["circle", "star"],
    drift: 0,
  },
  snow: {
    type: "snow",
    count: 40,
    minSize: 2,
    maxSize: 6,
    minSpeed: 0.3,
    maxSpeed: 1.2,
    minOpacity: 0.5,
    maxOpacity: 0.9,
    colors: ["#ffffff", "#f0f8ff", "#f5f5f5"],
    shapes: ["circle"],
    drift: 0.8,
  },
  bubbles: {
    type: "bubbles",
    count: 20,
    minSize: 3,
    maxSize: 10,
    minSpeed: 0.2,
    maxSpeed: 0.6,
    minOpacity: 0.2,
    maxOpacity: 0.5,
    colors: ["rgba(255,255,255,0.6)", "rgba(200,220,255,0.5)", "rgba(255,220,240,0.4)"],
    shapes: ["circle"],
    drift: 0.3,
  },
  fireflies: {
    type: "fireflies",
    count: 12,
    minSize: 2,
    maxSize: 5,
    minSpeed: 0.1,
    maxSpeed: 0.4,
    minOpacity: 0.3,
    maxOpacity: 0.9,
    colors: ["#fff59d", "#ffeb3b", "#fdd835", "#c0ca33"],
    shapes: ["circle"],
    drift: 1.5,
  },
  none: {
    type: "none",
    count: 0,
    minSize: 0,
    maxSize: 0,
    minSpeed: 0,
    maxSpeed: 0,
    minOpacity: 0,
    maxOpacity: 0,
    colors: [],
    shapes: [],
    drift: 0,
  },
};

export interface CostumeConfig {
  id: string;
  name: string;
  emoji: string;
  description: string;
  category: "casual" | "formal" | "special" | "seasonal";
  unlockLevel: number;
  isPremium: boolean;
  previewColor: string;
  accentColor: string;
}

export const COSTUME_CONFIGS: CostumeConfig[] = [
  {
    id: "default",
    name: "默认服装",
    emoji: "👗",
    description: "日常休闲装",
    category: "casual",
    unlockLevel: 1,
    isPremium: false,
    previewColor: "#e8eaf6",
    accentColor: "#7986cb",
  },
  {
    id: "school",
    name: "校服",
    emoji: "🎒",
    description: "青春校园风",
    category: "casual",
    unlockLevel: 3,
    isPremium: false,
    previewColor: "#fff9c4",
    accentColor: "#fbc02d",
  },
  {
    id: "dress",
    name: "晚礼服",
    emoji: "💃",
    description: "优雅晚宴装",
    category: "formal",
    unlockLevel: 10,
    isPremium: false,
    previewColor: "#1a237e",
    accentColor: "#c62828",
  },
  {
    id: "kimono",
    name: "和服",
    emoji: "🌸",
    description: "传统和风",
    category: "special",
    unlockLevel: 15,
    isPremium: true,
    previewColor: "#fce4ec",
    accentColor: "#e91e63",
  },
  {
    id: "maid",
    name: "女仆装",
    emoji: "🧹",
    description: "可爱女仆风",
    category: "special",
    unlockLevel: 20,
    isPremium: true,
    previewColor: "#ffffff",
    accentColor: "#000000",
  },
  {
    id: "swimwear",
    name: "泳装",
    emoji: "👙",
    description: "夏日海滩风",
    category: "seasonal",
    unlockLevel: 25,
    isPremium: true,
    previewColor: "#4fc3f7",
    accentColor: "#ff4081",
  },
  {
    id: "christmas",
    name: "圣诞装",
    emoji: "🎄",
    description: "节日限定",
    category: "seasonal",
    unlockLevel: 30,
    isPremium: true,
    previewColor: "#d32f2f",
    accentColor: "#ffffff",
  },
  {
    id: "knight",
    name: "骑士装",
    emoji: "⚔️",
    description: "英姿飒爽",
    category: "special",
    unlockLevel: 40,
    isPremium: true,
    previewColor: "#37474f",
    accentColor: "#ffd700",
  },
];

export function getCostumesByCategory(category: CostumeConfig["category"]): CostumeConfig[] {
  return COSTUME_CONFIGS.filter(c => c.category === category);
}

export function getUnlockedCostumes(userLevel: number, ownedPremium: string[] = []): CostumeConfig[] {
  return COSTUME_CONFIGS.filter(c => {
    if (c.unlockLevel > userLevel) return false;
    if (c.isPremium && !ownedPremium.includes(c.id)) return false;
    return true;
  });
}
