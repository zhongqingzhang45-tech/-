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
}

export interface PersistenceOptions {
  autoSaveInterval?: number;
  maxLocalStorageSize?: number;
}

const DEFAULT_OPTIONS: PersistenceOptions = {
  autoSaveInterval: 30000,
  maxLocalStorageSize: 4 * 1024 * 1024,
};

export class DataPersistence {
  private options: PersistenceOptions;
  private autoSaveTimer: NodeJS.Timeout | null = null;
  private pendingSave: Set<string> = new Set();
  private listeners: Map<string, Set<(key: string) => void>> = new Map();

  constructor(options: PersistenceOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  async initialize(): Promise<void> {
    this.startAutoSave();
  }

  private startAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }
    this.autoSaveTimer = setInterval(() => {
      this.flushPendingSaves();
    }, this.options.autoSaveInterval);
  }

  private flushPendingSaves(): void {
    if (this.pendingSave.size > 0) {
      console.log(`[Persistence] Flushing ${this.pendingSave.size} pending saves`);
      this.pendingSave.clear();
    }
  }

  markDirty(key: string): void {
    this.pendingSave.add(key);
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

  async saveLifeState(state: LifeState): Promise<void> {
    try {
      const serialized = JSON.stringify(state);
      if (serialized.length > (this.options.maxLocalStorageSize || 4 * 1024 * 1024)) {
        console.warn("LifeState exceeds max size, compressing...");
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

  async saveMemories(memories: any[]): Promise<void> {
    try {
      localStorage.setItem(
        STORAGE_KEYS.MEMORIES,
        JSON.stringify(memories.slice(-1000))
      );
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

  private notifyListeners(key: string): void {
    this.listeners.get(key)?.forEach((cb) => cb(key));
  }

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
  }

  clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  }

  getStorageUsage(): { used: number; available: number; percentage: number } {
    let used = 0;
    Object.values(STORAGE_KEYS).forEach((key) => {
      const data = localStorage.getItem(key);
      if (data) {
        used += data.length * 2;
      }
    });

    const maxSize = 5 * 1024 * 1024;
    return {
      used,
      available: maxSize - used,
      percentage: (used / maxSize) * 100,
    };
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
