export type MemoryLayer = "core" | "profile" | "logs" | "insights";

export interface MemoryFile {
  path: string;
  layer: MemoryLayer;
  name: string;
  content: string;
  lastModified: number;
  version: number;
}

export interface FactEntry {
  id: string;
  category: string;
  key: string;
  value: string;
  confidence: number;
  source: string;
  createdAt: number;
  lastVerified: number;
}

export interface PreferenceEntry {
  id: string;
  category: "food" | "music" | "movie" | "hobby" | "color" | "style" | "custom";
  item: string;
  sentiment: "love" | "like" | "neutral" | "dislike" | "hate";
  intensity: number;
  context?: string;
  createdAt: number;
}

export interface EmotionalSnapshot {
  date: string;
  dominantMood: string;
  averageValence: number;
  averageArousal: number;
  keyEvents: string[];
  trustLevel: number;
  affectionLevel: number;
  resentmentLevel: number;
}

export interface DailyLog {
  date: string;
  summary: string;
  keyMoments: string[];
  emotionalArc: string;
  topicsDiscussed: string[];
  notableQuotes: { speaker: string; text: string }[];
  relationshipDelta: {
    trust: number;
    affection: number;
    intimacy: number;
  };
}

export interface RelationshipInsight {
  person: string;
  role: string;
  dynamics: string;
  keyMemories: string[];
  patterns: string[];
  currentStatus: string;
  recommendations: string[];
}

export interface MilestoneEntry {
  id: string;
  title: string;
  date: string;
  description: string;
  impact: "positive" | "negative" | "neutral";
  importance: number;
  category: "relationship" | "personal" | "shared" | "achievement";
}

export interface MemorySearchResult {
  file: MemoryFile;
  relevance: number;
  matchedLines: { line: number; content: string }[];
}

export interface PersonaConfig {
  name: string;
  personality: string;
  speakingStyle: string;
  values: string[];
  boundaries: string[];
  catchphrases: string[];
}

export interface RulesConfig {
  hardRules: string[];
  softRules: string[];
  taboos: string[];
  safetyProtocols: string[];
}
