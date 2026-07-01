import { MoodType } from "./digital-life";

export interface Live2DExpression {
  id: string;
  name: string;
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
  positionY: number;
  expressions: Live2DExpression[];
  motions: Live2DMotion[];
  emotionToExpression: Record<MoodType, string>;
  emotionToMotions: Record<MoodType, string[]>;
}

export const DEFAULT_EMOTION_MAP: Record<MoodType, string> = {
  neutral: "smile",
  happy: "happy-02",
  excited: "happy-01",
  shy: "shy",
  love: "shy",
  sad: "sad",
  angry: "angry",
  jealous: "angry",
  sleepy: "coldness",
  thoughtful: "coldness",
  playful: "happy-01",
  surprised: "surprise",
  cold: "coldness",
  disdain: "angry",
  tsundere: "angry",
  coquettish: "shy",
  pua: "angry",
  hurt: "sad",
  disappointed: "sad",
  smug: "happy-02",
};

export const HARU_GREETER_EXPRESSIONS: Live2DExpression[] = [
  { id: "smile", name: "微笑", file: "expressions/微笑.exp3.json" },
  { id: "happy-01", name: "开心张嘴", file: "expressions/开心张嘴.exp3.json" },
  { id: "happy-02", name: "开心眯眼", file: "expressions/开心眯眼.exp3.json" },
  { id: "angry", name: "生气", file: "expressions/生气.exp3.json" },
  { id: "sad", name: "难过", file: "expressions/难过.exp3.json" },
  { id: "surprise", name: "惊讶", file: "expressions/惊讶.exp3.json" },
  { id: "shy", name: "脸红", file: "expressions/脸红.exp3.json" },
  { id: "coldness", name: "冷漠", file: "expressions/冷漠.exp3.json" },
];

export const HARU_GREETER_MOTIONS: Live2DMotion[] = [
  { id: "微笑-正常", name: "待机", group: "Idle", file: "motions/微笑-正常.motion3.json" },
  { id: "俏皮-微微摇头", name: "俏皮摇头", group: "TapBody", file: "motions/俏皮-微微摇头.motion3.json" },
  { id: "否定-微微摇头", name: "否定摇头", group: "TapBody", file: "motions/否定-微微摇头.motion3.json" },
  { id: "否定-摆双手摇头", name: "强烈否定", group: "TapBody", file: "motions/否定-摆双手摇头.motion3.json" },
  { id: "微笑-向前浅鞠躬", name: "浅鞠躬", group: "TapBody", file: "motions/微笑-向前浅鞠躬.motion3.json" },
  { id: "微笑-向前深鞠躬", name: "深鞠躬", group: "TapBody", file: "motions/微笑-向前深鞠躬.motion3.json" },
  { id: "微笑-抬手往右指引", name: "右指引", group: "TapBody", file: "motions/微笑-抬手往右指引.motion3.json" },
  { id: "微笑-抬手往左指引", name: "左指引", group: "TapBody", file: "motions/微笑-抬手往左指引.motion3.json" },
  { id: "微笑-点头", name: "点头", group: "TapBody", file: "motions/微笑-点头.motion3.json" },
  { id: "微笑-背手点头", name: "背手点头", group: "TapBody", file: "motions/微笑-背手点头.motion3.json" },
  { id: "惊吓-往后一仰", name: "惊吓后仰", group: "TapBody", file: "motions/惊吓-往后一仰.motion3.json" },
  { id: "惊吓-闭眼张开双手后瞪眼", name: "惊吓瞪眼", group: "TapBody", file: "motions/惊吓-闭眼张开双手后瞪眼.motion3.json" },
  { id: "惊讶-叉手张嘴点头", name: "惊讶点头", group: "TapBody", file: "motions/惊讶-叉手张嘴点头.motion3.json" },
  { id: "惊讶-双手放开", name: "惊讶放手", group: "TapBody", file: "motions/惊讶-双手放开.motion3.json" },
  { id: "惊讶-张开双手点头", name: "惊讶张手", group: "TapBody", file: "motions/惊讶-张开双手点头.motion3.json" },
  { id: "无奈-叉手点头", name: "无奈", group: "TapBody", file: "motions/无奈-叉手点头.motion3.json" },
  { id: "生气-被惊后埋头看地", name: "生气埋头", group: "TapBody", file: "motions/生气-被惊后埋头看地.motion3.json" },
  { id: "疑惑-张开双手定睛狠狠往前一看", name: "疑惑定睛", group: "TapBody", file: "motions/疑惑-张开双手定睛狠狠往前一看.motion3.json" },
  { id: "疑惑-张开双手定睛轻微往前一看", name: "疑惑轻看", group: "TapBody", file: "motions/疑惑-张开双手定睛轻微往前一看.motion3.json" },
  { id: "疑虑-手放嘴角", name: "疑虑", group: "TapBody", file: "motions/疑虑-手放嘴角.motion3.json" },
  { id: "脸红-眯眼埋头", name: "害羞埋头", group: "TapBody", file: "motions/脸红-眯眼埋头.motion3.json" },
  { id: "脸红-眯眼笑", name: "害羞笑", group: "TapBody", file: "motions/脸红-眯眼笑.motion3.json" },
  { id: "脸红-身体往前倾", name: "害羞前倾", group: "TapBody", file: "motions/脸红-身体往前倾.motion3.json" },
  { id: "难过-双手放胸前", name: "难过抱胸", group: "TapBody", file: "motions/难过-双手放胸前.motion3.json" },
  { id: "难过-睁眼瘪嘴", name: "难过瘪嘴", group: "TapBody", file: "motions/难过-睁眼瘪嘴.motion3.json" },
  { id: "高兴-左右摇摆", name: "高兴摇摆", group: "TapBody", file: "motions/高兴-左右摇摆.motion3.json" },
  { id: "高兴-身体前倾眯眼", name: "高兴前倾", group: "TapBody", file: "motions/高兴-身体前倾眯眼.motion3.json" },
];

export const HARU_EMOTION_TO_MOTIONS: Record<MoodType, string[]> = {
  neutral: ["微笑-正常", "微笑-点头", "微笑-背手点头"],
  happy: ["高兴-左右摇摆", "高兴-身体前倾眯眼", "脸红-眯眼笑"],
  excited: ["高兴-左右摇摆", "惊讶-张开双手点头", "俏皮-微微摇头"],
  shy: ["脸红-眯眼埋头", "脸红-眯眼笑", "脸红-身体往前倾"],
  love: ["脸红-眯眼笑", "脸红-身体往前倾", "微笑-向前浅鞠躬"],
  sad: ["难过-双手放胸前", "难过-睁眼瘪嘴"],
  angry: ["生气-被惊后埋头看地", "否定-摆双手摇头"],
  jealous: ["生气-被惊后埋头看地", "无奈-叉手点头"],
  sleepy: ["微笑-正常"],
  thoughtful: ["疑虑-手放嘴角", "疑惑-张开双手定睛轻微往前一看"],
  playful: ["俏皮-微微摇头", "高兴-左右摇摆"],
  surprised: ["惊吓-往后一仰", "惊吓-闭眼张开双手后瞪眼", "惊讶-双手放开"],
  cold: ["无奈-叉手点头", "微笑-正常"],
  disdain: ["无奈-叉手点头", "否定-微微摇头"],
  tsundere: ["生气-被惊后埋头看地", "脸红-眯眼笑"],
  coquettish: ["脸红-身体往前倾", "俏皮-微微摇头"],
  pua: ["无奈-叉手点头", "否定-微微摇头"],
  hurt: ["难过-双手放胸前", "难过-睁眼瘪嘴"],
  disappointed: ["难过-睁眼瘪嘴", "无奈-叉手点头"],
  smug: ["高兴-身体前倾眯眼", "微笑-背手点头"],
};

export class Live2DManager {
  private model: any = null;
  private currentExpression: string = "smile";
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
    const expressionId = this.config?.emotionToExpression[mood] || DEFAULT_EMOTION_MAP[mood];
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

  playMoodMotion(mood: MoodType): void {
    if (!this.config) return;
    const motions = this.config.emotionToMotions[mood] || ["微笑-正常"];
    const randomMotion = motions[Math.floor(Math.random() * motions.length)];
    this.playMotion(randomMotion);
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

  getExpressions(): Live2DExpression[] {
    return this.config?.expressions || [];
  }

  getMotions(): Live2DMotion[] {
    return this.config?.motions || [];
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
    name: "HaruGreeter",
    path: "/live2d-models/HaruGreeter/",
    modelFile: "HaruGreeter.model3.json",
    scale: 2,
    positionY: 0.55,
    expressions: HARU_GREETER_EXPRESSIONS,
    motions: HARU_GREETER_MOTIONS,
    emotionToExpression: DEFAULT_EMOTION_MAP,
    emotionToMotions: HARU_EMOTION_TO_MOTIONS,
  },
  ...generateAzurLaneModels(),
];

function generateAzurLaneModels(): Live2DModelConfig[] {
  const azurLaneModels = [
    { name: "lafei", displayName: "拉菲", scale: 2.2 },
    { name: "lingbo", displayName: "凌波", scale: 2.2 },
    { name: "mingshi", displayName: "明石", scale: 2.2 },
    { name: "xuefeng", displayName: "雪风", scale: 2.2 },
    { name: "huonululu_5", displayName: "火奴鲁鲁", scale: 2.2 },
    { name: "aierdeliqi_4", displayName: "埃尔德里奇", scale: 2.2 },
    { name: "ninghai_4", displayName: "宁海", scale: 2.2 },
    { name: "pinghai_4", displayName: "平海", scale: 2.2 },
    { name: "xianghe_2", displayName: "翔鹤", scale: 2.2 },
    { name: "dafeng_2", displayName: "大凤", scale: 2.2 },
    { name: "biaoqiang", displayName: "标枪", scale: 2.2 },
    { name: "z23", displayName: "Z23", scale: 2.2 },
    { name: "shengluyisi_2", displayName: "圣路易斯", scale: 2.2 },
    { name: "kelifulan_3", displayName: "克利夫兰", scale: 2.2 },
    { name: "deyizhi_3", displayName: "德意志", scale: 2.2 },
  ];

  const defaultExpressions: Live2DExpression[] = [
    { id: "smile", name: "微笑" },
  ];

  const defaultMotions: Live2DMotion[] = [
    { id: "idle", name: "待机", group: "Idle", file: "motions/idle.motion3.json" },
    { id: "main_1", name: "主动作1", group: "TapBody", file: "motions/main_1.motion3.json" },
    { id: "main_2", name: "主动作2", group: "TapBody", file: "motions/main_2.motion3.json" },
    { id: "main_3", name: "主动作3", group: "TapBody", file: "motions/main_3.motion3.json" },
    { id: "touch_head", name: "摸头", group: "TapHead", file: "motions/touch_head.motion3.json" },
    { id: "touch_body", name: "触摸身体", group: "TapBody", file: "motions/touch_body.motion3.json" },
    { id: "touch_special", name: "特殊触摸", group: "TapSpecial", file: "motions/touch_special.motion3.json" },
  ];

  const defaultEmotionToMotions: Record<MoodType, string[]> = {
    neutral: ["idle"],
    happy: ["main_1", "touch_head"],
    excited: ["main_2", "touch_special"],
    shy: ["touch_head", "main_3"],
    love: ["touch_head", "touch_body"],
    sad: ["main_3"],
    angry: ["main_3"],
    jealous: ["main_3"],
    sleepy: ["idle"],
    thoughtful: ["main_1"],
    playful: ["main_2", "touch_body"],
    surprised: ["main_2"],
    cold: ["main_3"],
    disdain: ["main_3"],
    tsundere: ["main_3", "touch_head"],
    coquettish: ["touch_body", "main_2"],
    pua: ["main_3"],
    hurt: ["main_3"],
    disappointed: ["main_3"],
    smug: ["main_1", "main_2"],
  };

  return azurLaneModels.map((model) => ({
    name: model.name, // 使用英文文件名作为 name
    path: `/live2d-models/azurlane/${model.name}/`,
    modelFile: `${model.name}.model3.json`,
    scale: model.scale,
    positionY: 0.5,
    expressions: defaultExpressions,
    motions: defaultMotions,
    emotionToExpression: DEFAULT_EMOTION_MAP,
    emotionToMotions: defaultEmotionToMotions,
  }));
}

export function getModelConfig(modelName: string): Live2DModelConfig | undefined {
  return BUILTIN_MODELS.find((m) => m.name.toLowerCase() === modelName.toLowerCase()) || BUILTIN_MODELS[0];
}

export function createLive2DManager() {
  return new Live2DManager();
}

export function getExpressionForMood(mood: MoodType, modelName?: string): string {
  if (modelName) {
    const config = getModelConfig(modelName);
    if (config?.emotionToExpression[mood]) {
      return config.emotionToExpression[mood];
    }
  }
  return DEFAULT_EMOTION_MAP[mood] || "smile";
}

export function getRandomMotionForMood(mood: MoodType, modelName?: string): string {
  if (modelName) {
    const config = getModelConfig(modelName);
    const motions = config?.emotionToMotions[mood];
    if (motions && motions.length > 0) {
      return motions[Math.floor(Math.random() * motions.length)];
    }
  }
  const fallbackMotions = HARU_EMOTION_TO_MOTIONS[mood] || ["微笑-正常"];
  return fallbackMotions[Math.floor(Math.random() * fallbackMotions.length)];
}
