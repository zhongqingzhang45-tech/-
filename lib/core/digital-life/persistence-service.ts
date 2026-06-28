import { LifeState, Goal, PlannedAction, GrowthTrace, MemoryEntry } from "./types";

const STORAGE_KEYS = {
  LIFE_STATE: "digital_life_state",
  GOALS: "digital_life_goals",
  ACTIONS: "digital_life_actions",
  GROWTH_TRACES: "digital_life_growth_traces",
  MEMORIES: "digital_life_memories",
  LAST_ACTIVE: "digital_life_last_active",
};

export interface PersistedLifeSnapshot {
  lifeState: LifeState;
  activeGoals: Goal[];
  pendingActions: PlannedAction[];
  growthTraces: GrowthTrace[];
  lastActiveTime: number;
}

export class PersistenceService {
  private characterId: string;

  constructor(characterId: string) {
    this.characterId = characterId;
  }

  private getKey(key: string): string {
    return `${key}_${this.characterId}`;
  }

  saveLifeSnapshot(snapshot: PersistedLifeSnapshot): void {
    if (typeof window === "undefined") return;
    
    try {
      const data = JSON.stringify({
        ...snapshot,
        savedAt: Date.now(),
      });
      localStorage.setItem(this.getKey(STORAGE_KEYS.LIFE_STATE), data);
      localStorage.setItem(this.getKey(STORAGE_KEYS.LAST_ACTIVE), String(Date.now()));
    } catch (e) {
      console.warn("Failed to save life snapshot:", e);
    }
  }

  loadLifeSnapshot(): PersistedLifeSnapshot | null {
    if (typeof window === "undefined") return null;
    
    try {
      const data = localStorage.getItem(this.getKey(STORAGE_KEYS.LIFE_STATE));
      if (!data) return null;
      
      const snapshot = JSON.parse(data);
      const savedAt = snapshot.savedAt || 0;
      
      const oneDayMs = 24 * 60 * 60 * 1000;
      if (Date.now() - savedAt > oneDayMs * 7) {
        this.clearAll();
        return null;
      }
      
      return snapshot;
    } catch (e) {
      console.warn("Failed to load life snapshot:", e);
      return null;
    }
  }

  saveGoals(goals: Goal[]): void {
    if (typeof window === "undefined") return;
    
    try {
      const validGoals = goals.filter(g => 
        g.status === "active" || 
        (g.completedAt && Date.now() - g.completedAt < 24 * 60 * 60 * 1000)
      );
      localStorage.setItem(this.getKey(STORAGE_KEYS.GOALS), JSON.stringify(validGoals));
    } catch (e) {
      console.warn("Failed to save goals:", e);
    }
  }

  loadGoals(): Goal[] {
    if (typeof window === "undefined") return [];
    
    try {
      const data = localStorage.getItem(this.getKey(STORAGE_KEYS.GOALS));
      if (!data) return [];
      return JSON.parse(data);
    } catch (e) {
      console.warn("Failed to load goals:", e);
      return [];
    }
  }

  saveActions(actions: PlannedAction[]): void {
    if (typeof window === "undefined") return;
    
    try {
      const unexecutedActions = actions.filter(a => !a.executed);
      localStorage.setItem(this.getKey(STORAGE_KEYS.ACTIONS), JSON.stringify(unexecutedActions));
    } catch (e) {
      console.warn("Failed to save actions:", e);
    }
  }

  loadActions(): PlannedAction[] {
    if (typeof window === "undefined") return [];
    
    try {
      const data = localStorage.getItem(this.getKey(STORAGE_KEYS.ACTIONS));
      if (!data) return [];
      return JSON.parse(data);
    } catch (e) {
      console.warn("Failed to load actions:", e);
      return [];
    }
  }

  saveGrowthTraces(traces: GrowthTrace[]): void {
    if (typeof window === "undefined") return;
    
    try {
      localStorage.setItem(this.getKey(STORAGE_KEYS.GROWTH_TRACES), JSON.stringify(traces.slice(-200)));
    } catch (e) {
      console.warn("Failed to save growth traces:", e);
    }
  }

  loadGrowthTraces(): GrowthTrace[] {
    if (typeof window === "undefined") return [];
    
    try {
      const data = localStorage.getItem(this.getKey(STORAGE_KEYS.GROWTH_TRACES));
      if (!data) return [];
      return JSON.parse(data);
    } catch (e) {
      console.warn("Failed to load growth traces:", e);
      return [];
    }
  }

  getLastActiveTime(): number {
    if (typeof window === "undefined") return 0;
    
    try {
      const time = localStorage.getItem(this.getKey(STORAGE_KEYS.LAST_ACTIVE));
      return time ? parseInt(time, 10) : 0;
    } catch (e) {
      return 0;
    }
  }

  getTimeSinceLastActive(): number {
    const lastActive = this.getLastActiveTime();
    return lastActive ? Date.now() - lastActive : Infinity;
  }

  clearAll(): void {
    if (typeof window === "undefined") return;
    
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(this.getKey(key));
    });
  }
}
