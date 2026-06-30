/**
 * 数据持久化模块
 * 支持 localStorage 保存角色状态、记忆、成长数据等
 */

import { LifeState } from "./digital-life/types";
import { CausalEvent, CausalChain } from "./digital-life/causal-system";

const STORAGE_KEYS = {
  LIFE_STATE: "lifeos_life_state",
  PROFILE: "lifeos_profile",
  MEMORIES: "lifeos_memories",
  CAUSAL_EVENTS: "lifeos_causal_events",
  CAUSAL_CHAINS: "lifeos_causal_chains",
  MESSAGES: "lifeos_messages",
  SETTINGS: "lifeos_settings",
  GROWTH_HISTORY: "lifeos_growth_history",
  SKILLS_PROGRESS: "lifeos_skills_progress",
  LAST_SYNC: "lifeos_last_sync",
} as const;

export interface PersistedData {
  lifeState: LifeState | null;
  profile: any | null;
  memories: any[];
  causalEvents: CausalEvent[];
  causalChains: CausalChain[];
  messages: any[];
  lastSyncTime: number;
  settings: Record<string, any>;
  growthHistory: GrowthHistoryRecord[];
  skillsProgress: Record<string, number>;
}

export interface GrowthHistoryRecord {
  timestamp: number;
  level: number;
  experience: number;
  personality: Record<string, number>;
  event: string;
}

export interface PersistenceOptions {
  autoSaveInterval?: number;
  maxLocalStorageSize?: number;
  enableCompression?: boolean;
}

const DEFAULT_OPTIONS: PersistenceOptions = {
  autoSaveInterval: 30000,
  maxLocalStorageSize: 4 * 1024 * 1024,
  enableCompression: true,
};

export class DataPersistence {
  private options: PersistenceOptions;
  private autoSaveTimer: NodeJS.Timeout | null = null;
  private pendingSave: Set<string> = new Set();
  private listeners: Map<string, Set<(key: string) => void>> = new Map();
  private isDirty: boolean = false;
  private lastSaveTime: number = 0;

  constructor(options: PersistenceOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  async initialize(): Promise<void> {
    this.startAutoSave();
  }

  private startAutoSave(): void {
    if (typeof window === "undefined") return;
    
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }
    this.autoSaveTimer = setInterval(() => {
      this.flushPendingSaves();
    }, this.options.autoSaveInterval);
  }

  private flushPendingSaves(): void {
    if (this.pendingSave.size > 0 && this.isDirty) {
      console.log(`[Persistence] Flushing ${this.pendingSave.size} pending saves`);
      this.pendingSave.clear();
      this.isDirty = false;
      this.lastSaveTime = Date.now();
    }
  }

  markDirty(key: string): void {
    this.pendingSave.add(key);
    this.isDirty = true;
  }

  onSave(key: string, callback: (key: string) => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(callback);
    return () => {
      this.listeners.get(key)?.delete(callback);
    };
  }

  // ========== LifeState 保存/加载 ==========
  async saveLifeState(state: LifeState): Promise<void> {
    try {
      const serialized = JSON.stringify(state);
      if (serialized.length > (this.options.maxLocalStorageSize || 4 * 1024 * 1024)) {
        console.warn("LifeState exceeds max size");
      }
      localStorage.setItem(STORAGE_KEYS.LIFE_STATE, serialized);
      this.markDirty(STORAGE_KEYS.LIFE_STATE);
      this.notifyListeners(STORAGE_KEYS.LIFE_STATE);
    } catch (error) {
      console.error("Failed to save life state:", error);
    }
  }

  loadLifeState(): LifeState | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LIFE_STATE);
      if (!data) return null;
      return JSON.parse(data);
    } catch (error) {
      console.error("Failed to load life state:", error);
      return null;
    }
  }

  // ========== Profile 保存/加载 ==========
  async saveProfile(profile: any): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
      this.markDirty(STORAGE_KEYS.PROFILE);
    } catch (error) {
      console.error("Failed to save profile:", error);
    }
  }

  loadProfile(): any | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Failed to load profile:", error);
      return null;
    }
  }

  // ========== Memories 保存/加载 ==========
  async saveMemories(memories: any[]): Promise<void> {
    try {
      const serialized = JSON.stringify(memories.slice(-1000));
      localStorage.setItem(STORAGE_KEYS.MEMORIES, serialized);
      this.markDirty(STORAGE_KEYS.MEMORIES);
    } catch (error) {
      console.error("Failed to save memories:", error);
    }
  }

  loadMemories(): any[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MEMORIES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Failed to load memories:", error);
      return [];
    }
  }

  // ========== Causal Events 保存/加载 ==========
  async saveCausalData(
    events: CausalEvent[],
    chains: CausalChain[]
  ): Promise<void> {
    try {
      localStorage.setItem(
        STORAGE_KEYS.CAUSAL_EVENTS,
        JSON.stringify(events.slice(-500))
      );
      localStorage.setItem(
        STORAGE_KEYS.CAUSAL_CHAINS,
        JSON.stringify(chains.slice(-50))
      );
      this.markDirty(STORAGE_KEYS.CAUSAL_EVENTS);
      this.markDirty(STORAGE_KEYS.CAUSAL_CHAINS);
    } catch (error) {
      console.error("Failed to save causal data:", error);
    }
  }

  loadCausalData(): { events: CausalEvent[]; chains: CausalChain[] } {
    try {
      const eventsData = localStorage.getItem(STORAGE_KEYS.CAUSAL_EVENTS);
      const chainsData = localStorage.getItem(STORAGE_KEYS.CAUSAL_CHAINS);
      return {
        events: eventsData ? JSON.parse(eventsData) : [],
        chains: chainsData ? JSON.parse(chainsData) : [],
      };
    } catch (error) {
      console.error("Failed to load causal data:", error);
      return { events: [], chains: [] };
    }
  }

  // ========== Messages 保存/加载 ==========
  async saveMessages(messages: any[]): Promise<void> {
    try {
      localStorage.setItem(
        STORAGE_KEYS.MESSAGES,
        JSON.stringify(messages.slice(-500))
      );
      this.markDirty(STORAGE_KEYS.MESSAGES);
    } catch (error) {
      console.error("Failed to save messages:", error);
    }
  }

  loadMessages(): any[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Failed to load messages:", error);
      return [];
    }
  }

  // ========== Settings 保存/加载 ==========
  async saveSettings(settings: Record<string, any>): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      this.markDirty(STORAGE_KEYS.SETTINGS);
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  }

  loadSettings(): Record<string, any> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error("Failed to load settings:", error);
      return {};
    }
  }

  // ========== Growth History 保存/加载 ==========
  async saveGrowthHistory(record: GrowthHistoryRecord): Promise<void> {
    try {
      const existing = this.loadGrowthHistory();
      existing.push(record);
      // 只保留最近 100 条记录
      const trimmed = existing.slice(-100);
      localStorage.setItem(STORAGE_KEYS.GROWTH_HISTORY, JSON.stringify(trimmed));
      this.markDirty(STORAGE_KEYS.GROWTH_HISTORY);
    } catch (error) {
      console.error("Failed to save growth history:", error);
    }
  }

  loadGrowthHistory(): GrowthHistoryRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.GROWTH_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Failed to load growth history:", error);
      return [];
    }
  }

  // ========== Skills Progress 保存/加载 ==========
  async saveSkillsProgress(skills: Record<string, number>): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEYS.SKILLS_PROGRESS, JSON.stringify(skills));
      this.markDirty(STORAGE_KEYS.SKILLS_PROGRESS);
    } catch (error) {
      console.error("Failed to save skills progress:", error);
    }
  }

  loadSkillsProgress(): Record<string, number> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SKILLS_PROGRESS);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error("Failed to load skills progress:", error);
      return {};
    }
  }

  private notifyListeners(key: string): void {
    this.listeners.get(key)?.forEach((cb) => cb(key));
  }

  // ========== 批量保存/加载 ==========
  async exportAllData(): Promise<PersistedData> {
    return {
      lifeState: this.loadLifeState(),
      profile: this.loadProfile(),
      memories: this.loadMemories(),
      causalEvents: this.loadCausalData().events,
      causalChains: this.loadCausalData().chains,
      messages: this.loadMessages(),
      lastSyncTime: Date.now(),
      settings: this.loadSettings(),
      growthHistory: this.loadGrowthHistory(),
      skillsProgress: this.loadSkillsProgress(),
    };
  }

  async importData(data: Partial<PersistedData>): Promise<void> {
    if (data.lifeState) await this.saveLifeState(data.lifeState);
    if (data.profile) await this.saveProfile(data.profile);
    if (data.memories) await this.saveMemories(data.memories);
    if (data.causalEvents || data.causalChains) {
      await this.saveCausalData(data.causalEvents || [], data.causalChains || []);
    }
    if (data.messages) await this.saveMessages(data.messages);
    if (data.settings) await this.saveSettings(data.settings);
    if (data.growthHistory) {
      localStorage.setItem(STORAGE_KEYS.GROWTH_HISTORY, JSON.stringify(data.growthHistory));
    }
    if (data.skillsProgress) await this.saveSkillsProgress(data.skillsProgress);
  }

  // ========== 存储管理 ==========
  clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
    this.pendingSave.clear();
    this.isDirty = false;
  }

  getStorageUsage(): { used: number; available: number; percentage: number } {
    if (typeof window === "undefined") {
      return { used: 0, available: 5 * 1024 * 1024, percentage: 0 };
    }
    
    let used = 0;
    Object.values(STORAGE_KEYS).forEach((key) => {
      const data = localStorage.getItem(key);
      if (data) {
        used += data.length * 2; // UTF-16 编码
      }
    });

    const maxSize = 5 * 1024 * 1024;
    return {
      used,
      available: maxSize - used,
      percentage: (used / maxSize) * 100,
    };
  }

  getLastSyncTime(): number {
    try {
      const time = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      return time ? parseInt(time, 10) : 0;
    } catch {
      return 0;
    }
  }

  updateLastSyncTime(): void {
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, Date.now().toString());
  }

  isDataStale(maxAge: number = 7 * 24 * 60 * 60 * 1000): boolean {
    const lastSync = this.getLastSyncTime();
    if (!lastSync) return true;
    return Date.now() - lastSync > maxAge;
  }

  destroy(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
    this.listeners.clear();
    this.pendingSave.clear();
  }
}

export const defaultPersistence = new DataPersistence();

export function createPersistence(options?: PersistenceOptions): DataPersistence {
  return new DataPersistence(options);
}
