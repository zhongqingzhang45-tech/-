import { MoodType } from "./digital-life";

export interface Live2DExpression {
  id: string;
  name: string;
  index: number;
  file?: string;
}

export interface Live2DMotion {
  id: string;
  name: string;
  group: string;
  file: string;
}

export interface Live2DModelConfig {
  name: string;
  path: string;
  modelFile: string;
  scale: number;
  position: { x: number; y: number };
  expressions: Live2DExpression[];
  motions: Live2DMotion[];
  emotionMap: Record<string, number>;
}

export const DEFAULT_EMOTION_MAP: Record<MoodType, string> = {
  neutral: "neutral",
  happy: "happy",
  excited: "happy",
  shy: "shy",
  love: "love",
  sad: "sad",
  angry: "angry",
  jealous: "angry",
  sleepy: "sleepy",
  thoughtful: "thinking",
  playful: "happy",
  surprised: "surprised",
  cold: "neutral",
  disdain: "angry",
  tsundere: "angry",
  coquettish: "shy",
  pua: "angry",
  hurt: "sad",
  disappointed: "sad",
  smug: "happy",
};

export class Live2DManager {
  private model: any = null;
  private currentExpression: string = "neutral";
  private currentMotion: string | null = null;
  private config: Live2DModelConfig | null = null;
  private container: HTMLElement | null = null;
  private isLoaded: boolean = false;
  private listeners: Set<(event: string, data?: any) => void> = new Set();

  constructor() {}

  async loadModel(config: Live2DModelConfig, container: HTMLElement): Promise<void> {
    this.config = config;
    this.container = container;
    this.isLoaded = false;

    await this.initializeModel();
  }

  private async initializeModel(): Promise<void> {
    if (!this.container || !this.config) return;

    this.container.innerHTML = `
      <div class="live2d-container" style="
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        overflow: hidden;
      ">
        <div class="live2d-fallback" style="
          font-size: 120px;
          filter: drop-shadow(0 20px 40px rgba(244, 114, 182, 0.3));
          animation: breathe 3s ease-in-out infinite;
        ">
          🌸
        </div>
      </div>
    `;

    this.isLoaded = true;
    this.emit("modelLoaded");
  }

  setExpression(expressionId: string): void {
    if (!this.isLoaded || !this.config) return;

    const expr = this.config.expressions.find((e) => e.id === expressionId);
    if (expr) {
      this.currentExpression = expressionId;
      this.emit("expressionChanged", expressionId);
    }
  }

  setMood(mood: MoodType): void {
    const expressionId = DEFAULT_EMOTION_MAP[mood];
    if (expressionId) {
      this.setExpression(expressionId);
    }
  }

  playMotion(motionId: string): void {
    if (!this.isLoaded || !this.config) return;

    const motion = this.config.motions.find((m) => m.id === motionId);
    if (motion) {
      this.currentMotion = motionId;
      this.emit("motionStarted", motionId);
    }
  }

  idleMotion(): void {
    if (!this.isLoaded) return;
    this.emit("idle");
  }

  lookAt(x: number, y: number): void {
    if (!this.isLoaded) return;
    this.emit("lookAt", { x, y });
  }

  blink(): void {
    if (!this.isLoaded) return;
    this.emit("blink");
  }

  getCurrentExpression(): string {
    return this.currentExpression;
  }

  isModelLoaded(): boolean {
    return this.isLoaded;
  }

  on(event: string, callback: (data?: any) => void): () => void {
    const listener = (e: string, data?: any) => {
      if (e === event) callback(data);
    };
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: string, data?: any): void {
    this.listeners.forEach((listener) => listener(event, data));
  }

  destroy(): void {
    this.model = null;
    this.container = null;
    this.isLoaded = false;
    this.listeners.clear();
  }
}

export const BUILTIN_MODELS: Live2DModelConfig[] = [
  {
    name: "shizuku",
    path: "/live2d-models/shizuku/",
    modelFile: "shizuku.model3.json",
    scale: 1,
    position: { x: 0, y: 0 },
    expressions: [
      { id: "neutral", name: "正常", index: 0 },
      { id: "happy", name: "开心", index: 1 },
      { id: "shy", name: "害羞", index: 2 },
      { id: "sad", name: "难过", index: 3 },
      { id: "angry", name: "生气", index: 4 },
      { id: "surprised", name: "惊讶", index: 5 },
    ],
    motions: [
      { id: "idle", name: "待机", group: "idle", file: "motion/01.motion3.json" },
      { id: "happy", name: "开心", group: "tap_body", file: "motion/02.motion3.json" },
      { id: "shy", name: "害羞", group: "tap_head", file: "motion/03.motion3.json" },
      { id: "sad", name: "难过", group: "tap_body", file: "motion/04.motion3.json" },
    ],
    emotionMap: {
      neutral: 0,
      happy: 1,
      shy: 2,
      sad: 3,
      angry: 4,
      surprised: 5,
    },
  },
  {
    name: "mao_pro",
    path: "/live2d-models/mao_pro/",
    modelFile: "mao_pro.model3.json",
    scale: 1,
    position: { x: 0, y: 0 },
    expressions: [
      { id: "exp_01", name: "表情1", index: 0 },
      { id: "exp_02", name: "表情2", index: 1 },
      { id: "exp_03", name: "表情3", index: 2 },
      { id: "exp_04", name: "表情4", index: 3 },
      { id: "exp_05", name: "表情5", index: 4 },
      { id: "exp_06", name: "表情6", index: 5 },
      { id: "exp_07", name: "表情7", index: 6 },
      { id: "exp_08", name: "表情8", index: 7 },
    ],
    motions: [
      { id: "mtn_01", name: "动作1", group: "motion", file: "motions/mtn_01.motion3.json" },
      { id: "mtn_02", name: "动作2", group: "motion", file: "motions/mtn_02.motion3.json" },
      { id: "mtn_03", name: "动作3", group: "motion", file: "motions/mtn_03.motion3.json" },
      { id: "mtn_04", name: "动作4", group: "motion", file: "motions/mtn_04.motion3.json" },
    ],
    emotionMap: {
      neutral: 0,
      happy: 1,
      shy: 2,
      sad: 3,
      angry: 4,
      surprised: 5,
    },
  },
];

export function createLive2DManager() {
  return new Live2DManager();
}
