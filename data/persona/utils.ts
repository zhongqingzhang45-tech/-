import type {
  DigitalPersona,
  PersonaArchetype,
  ArchetypeId,
  NeedsLayer,
  FearsLayer,
  ValuesLayer,
  TraitsLayer,
  GrowthMetrics,
  GrowthLayer,
  AttachmentStyle,
} from "./types";

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function randomAround(base: number, variance = 15): number {
  const offset = (Math.random() - 0.5) * 2 * variance;
  return clamp(base + offset);
}

function mergeWithDefaults<T extends Record<string, number>>(
  defaults: Partial<T>,
  fallbackBase = 50,
  variance = 12
): T {
  const result = {} as Record<string, number>;
  for (const key of Object.keys({ ...defaults })) {
    result[key] = randomAround(defaults[key as keyof T] ?? fallbackBase, variance);
  }
  return result as T;
}

function createNeeds(archetype: PersonaArchetype): NeedsLayer {
  const defaults: Record<string, number> = {
    understanding: 50,
    recognition: 50,
    security: 50,
    freedom: 50,
    connection: 50,
    achievement: 50,
    growth: 50,
    contribution: 50,
    power: 40,
    belonging: 55,
    happiness: 60,
    beauty: 50,
    love: 60,
    ...archetype.defaultNeeds,
  };
  return Object.fromEntries(
    Object.entries(defaults).map(([k, v]) => [k, randomAround(v, 10)])
  ) as unknown as NeedsLayer;
}

function createFears(archetype: PersonaArchetype): FearsLayer {
  const defaults: Record<string, number | string[]> = {
    abandonment: 40,
    oblivion: 35,
    failure: 45,
    rejection: 40,
    lossOfControl: 35,
    mediocrity: 40,
    betrayal: 40,
    vulnerability: 45,
    loneliness: 45,
    stagnation: 40,
    ...archetype.defaultFears,
    specificFears: archetype.defaultFears.specificFears ?? [],
  };
  const fears = Object.fromEntries(
    Object.entries(defaults).filter(([k]) => k !== "specificFears").map(([k, v]) => [k, randomAround(v as number, 12)])
  );
  return {
    ...fears,
    specificFears: defaults.specificFears as string[],
  } as FearsLayer;
}

function createValues(archetype: PersonaArchetype): ValuesLayer {
  const defaults: Record<string, number> = {
    love: 60,
    family: 55,
    career: 50,
    wealth: 40,
    freedom: 55,
    truth: 50,
    beauty: 45,
    justice: 50,
    loyalty: 55,
    health: 60,
    friendship: 55,
    security: 50,
    ...archetype.defaultValues,
  };
  return Object.fromEntries(
    Object.entries(defaults).map(([k, v]) => [k, randomAround(v, 8)])
  ) as unknown as ValuesLayer;
}

function createTraits(archetype: PersonaArchetype): TraitsLayer {
  const bigFive = {
    openness: 50,
    conscientiousness: 50,
    extraversion: 50,
    agreeableness: 50,
    neuroticism: 45,
    ...archetype.defaultTraits,
  };
  const traits = Object.fromEntries(
    Object.entries(bigFive).filter(([k]) => k !== "additionalTraits").map(([k, v]) => [k, randomAround(v as number, 10)])
  ) as Omit<TraitsLayer, "additionalTraits">;
  return {
    ...traits,
    additionalTraits: archetype.defaultTraits.additionalTraits ?? [],
  };
}

function createGrowth(archetype: PersonaArchetype): GrowthLayer {
  const baseMetrics: Record<string, number> = {
    confidence: 50,
    expressiveness: 45,
    independence: 50,
    emotionalAwareness: 45,
    socialSkills: 50,
    resilience: 50,
    ...archetype.defaultGrowth,
  };
  const initial = Object.fromEntries(
    Object.entries(baseMetrics).map(([k, v]) => [k, clamp(v - 15 - Math.random() * 15)])
  ) as unknown as GrowthMetrics;
  const current = Object.fromEntries(
    Object.entries(baseMetrics).map(([k, v]) => [k, randomAround(v, 8)])
  ) as unknown as GrowthMetrics;
  return {
    initial,
    current,
    goals: [],
    growthTrajectory: "ascending",
    recentBreakthroughs: [],
    ongoingStruggles: [],
  };
}

export function generatePersonaFromArchetype(
  archetype: PersonaArchetype,
  overrides: Partial<DigitalPersona> = {}
): DigitalPersona {
  const now = new Date().toISOString();
  return {
    id: overrides.id ?? `persona-${archetype.id}-${Date.now()}`,
    archetype: archetype.id,
    identity: {
      name: overrides.identity?.name ?? "未命名",
      age: overrides.identity?.age ?? 28,
      occupation: overrides.identity?.occupation ?? "自由职业者",
      city: overrides.identity?.city ?? "上海",
      birthday: overrides.identity?.birthday ?? "1月1日",
      ...overrides.identity,
    },
    backstory: {
      childhood: "普通的童年",
      teenage: "青春期的探索",
      university: "大学时代",
      postGraduation: "进入社会",
      formativeEvents: [],
      ...overrides.backstory,
    },
    needs: createNeeds(archetype),
    fears: createFears(archetype),
    values: createValues(archetype),
    traits: createTraits(archetype),
    attachment: {
      style: overrides.attachment?.style ?? archetype.defaultAttachment ?? "secure",
      description: getAttachmentDescription(
        overrides.attachment?.style ?? archetype.defaultAttachment ?? "secure"
      ),
      behavioralPatterns: [],
      ...overrides.attachment,
    },
    culture: {
      background: "eastern",
      aesthetic: "minimalist",
      philosophy: "longtermism",
      favoriteArtists: [],
      favoriteBooks: [],
      favoriteMovies: [],
      expressionStyle: "简洁直接",
      ...archetype.defaultCulture,
      ...overrides.culture,
    },
    growth: createGrowth(archetype),
    createdAt: now,
    lastUpdated: now,
  };
}

export function getAttachmentDescription(style: AttachmentStyle): string {
  const descriptions: Record<AttachmentStyle, string> = {
    secure: "安全型：信任他人，能够直接表达需求和感受",
    anxious: "焦虑型：容易患得患失，需要频繁确认关系",
    avoidant: "回避型：不喜欢暴露脆弱，保持情感距离",
    disorganized: "混乱型：渴望亲密又害怕受伤，行为矛盾",
  };
  return descriptions[style];
}

export function calculatePersonaSimilarity(a: DigitalPersona, b: DigitalPersona): number {
  const scores: number[] = [];
  const weights: Record<string, number> = {
    needs: 0.2,
    values: 0.25,
    traits: 0.25,
    fears: 0.15,
    growth: 0.15,
  };

  const needsA = Object.values(a.needs).filter(v => typeof v === "number") as number[];
  const needsB = Object.values(b.needs).filter(v => typeof v === "number") as number[];
  scores.push(cosineSimilarity(needsA, needsB) * weights.needs);

  const valuesA = Object.values(a.values).filter((v): v is number => typeof v === "number");
  const valuesB = Object.values(b.values).filter((v): v is number => typeof v === "number");
  scores.push(cosineSimilarity(valuesA, valuesB) * weights.values);

  const traitsA = [a.traits.openness, a.traits.conscientiousness, a.traits.extraversion, a.traits.agreeableness, a.traits.neuroticism];
  const traitsB = [b.traits.openness, b.traits.conscientiousness, b.traits.extraversion, b.traits.agreeableness, b.traits.neuroticism];
  scores.push(cosineSimilarity(traitsA, traitsB) * weights.traits);

  const fearsA = Object.values(a.fears).filter(v => typeof v === "number") as number[];
  const fearsB = Object.values(b.fears).filter(v => typeof v === "number") as number[];
  scores.push(cosineSimilarity(fearsA, fearsB) * weights.fears);

  const growthA = Object.values(a.growth.current).filter((v): v is number => typeof v === "number");
  const growthB = Object.values(b.growth.current).filter((v): v is number => typeof v === "number");
  scores.push(cosineSimilarity(growthA, growthB) * weights.growth);

  return scores.reduce((sum, s) => sum + s, 0);
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function simulateGrowth(
  persona: DigitalPersona,
  months: number,
  events: { type: "positive" | "negative" | "neutral"; impact: keyof GrowthMetrics; intensity: number }[] = []
): GrowthMetrics {
  const baseGrowthRate = 0.3;
  const result = { ...persona.growth.current };

  for (const [key, value] of Object.entries(result) as [keyof GrowthMetrics, number][]) {
    const naturalGrowth = baseGrowthRate * months * (1 - value / 120);
    result[key] = clamp(value + naturalGrowth);
  }

  for (const event of events) {
    const direction = event.type === "positive" ? 1 : event.type === "negative" ? -1 : 0;
    result[event.impact] = clamp(result[event.impact] + direction * event.intensity);
  }

  return result;
}

export function getPersonaSummary(persona: DigitalPersona): string {
  const needsEntries = Object.entries(persona.needs).filter(([_, v]) => typeof v === "number") as [string, number][];
  const valuesEntries = Object.entries(persona.values).filter(([_, v]) => typeof v === "number") as [string, number][];
  const fearsEntries = Object.entries(persona.fears)
    .filter(([k, v]) => k !== "specificFears" && typeof v === "number") as [string, number][];

  const topNeed = needsEntries.sort((a, b) => b[1] - a[1])[0] ?? ["understanding", 50];
  const topValue = valuesEntries.sort((a, b) => b[1] - a[1])[0] ?? ["love", 50];
  const topFear = fearsEntries.sort((a, b) => b[1] - a[1])[0] ?? ["failure", 50];

  return `${persona.identity.name}，核心需求是${translateNeed(topNeed[0])}（${Math.round(topNeed[1])}分），最看重${translateValue(topValue[0])}（${Math.round(topValue[1])}分），最深的恐惧是${translateFear(topFear[0])}（${Math.round(topFear[1])}分）。`;
}

function translateNeed(key: string): string {
  const map: Record<string, string> = {
    understanding: "被理解",
    recognition: "被认可",
    security: "安全感",
    freedom: "自由",
    connection: "连接感",
    achievement: "成就感",
    growth: "成长",
    contribution: "贡献感",
    power: "权力感",
    belonging: "归属感",
    happiness: "幸福感",
    beauty: "美感",
    love: "被爱",
    truth: "求真",
  };
  return map[key] ?? key;
}

function translateValue(key: string): string {
  const map: Record<string, string> = {
    love: "爱情",
    family: "家庭",
    career: "事业",
    wealth: "财富",
    freedom: "自由",
    truth: "真相",
    beauty: "美",
    justice: "正义",
    loyalty: "忠诚",
    health: "健康",
    friendship: "友情",
    security: "安全感",
  };
  return map[key] ?? key;
}

function translateFear(key: string): string {
  const map: Record<string, string> = {
    abandonment: "被抛弃",
    oblivion: "被遗忘",
    failure: "失败",
    rejection: "被拒绝",
    lossOfControl: "失控",
    mediocrity: "平庸",
    betrayal: "背叛",
    vulnerability: "脆弱",
    loneliness: "孤独",
    stagnation: "停滞",
  };
  return map[key] ?? key;
}

export function hasConflictStyle(a: DigitalPersona, b: DigitalPersona): { level: "low" | "medium" | "high"; reason: string } {
  const opennessDiff = Math.abs(a.traits.openness - b.traits.openness);
  const neuroticismDiff = Math.abs(a.traits.neuroticism - b.traits.neuroticism);
  const agreeablenessDiff = Math.abs(a.traits.agreeableness - b.traits.agreeableness);

  const totalDiff = opennessDiff * 0.3 + neuroticismDiff * 0.35 + agreeablenessDiff * 0.35;

  if (totalDiff > 45) {
    return { level: "high", reason: "人格差异较大，容易产生摩擦和冲突" };
  } else if (totalDiff > 25) {
    return { level: "medium", reason: "有一定差异，需要互相理解和磨合" };
  }
  return { level: "low", reason: "人格契合度高，相处融洽" };
}
