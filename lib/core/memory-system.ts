import { MemoryEntry, ChatMessage } from "./types";

export class MemorySystem {
  private memories: MemoryEntry[] = [];
  private maxMemories: number = 1000;
  private decayRate: number = 0.001;

  constructor(initialMemories?: MemoryEntry[]) {
    if (initialMemories) {
      this.memories = initialMemories;
    }
  }

  addMemory(memory: Omit<MemoryEntry, "id" | "timestamp">): MemoryEntry {
    const entry: MemoryEntry = {
      ...memory,
      id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
    };
    this.memories.unshift(entry);
    if (this.memories.length > this.maxMemories) {
      this.memories = this.memories.slice(0, this.maxMemories);
    }
    return entry;
  }

  addConversationMemory(message: ChatMessage, importance: number = 0.5): void {
    this.addMemory({
      type: "conversation",
      content: message.content,
      importance,
      emotionalImpact: Math.abs(message.emotion.valence) * 0.5,
      tags: [message.sender === "user" ? "user-said" : "assistant-said"],
      relatedPeople: ["user"],
    });
  }

  addFactMemory(content: string, tags?: string[]): void {
    this.addMemory({
      type: "fact",
      content,
      importance: 0.7,
      emotionalImpact: 0.2,
      tags: tags ?? ["fact"],
    });
  }

  addPreferenceMemory(preference: string, category: string): void {
    this.addMemory({
      type: "preference",
      content: preference,
      importance: 0.8,
      emotionalImpact: 0.3,
      tags: ["preference", category],
    });
  }

  addEmotionMemory(emotion: string, context: string, intensity: number): void {
    this.addMemory({
      type: "emotion",
      content: `${emotion}: ${context}`,
      importance: 0.4 + intensity * 0.4,
      emotionalImpact: intensity,
      tags: ["emotion", emotion],
    });
  }

  searchMemories(
    query: string,
    options: {
      type?: MemoryEntry["type"];
      limit?: number;
      minImportance?: number;
      tags?: string[];
    } = {}
  ): MemoryEntry[] {
    let results = [...this.memories];

    if (options.type) {
      results = results.filter((m) => m.type === options.type);
    }
    if (options.tags && options.tags.length > 0) {
      results = results.filter((m) =>
        options.tags!.some((tag) => m.tags?.includes(tag))
      );
    }
    if (options.minImportance) {
      results = results.filter((m) => m.importance >= options.minImportance!);
    }

    const queryLower = query.toLowerCase();
    results = results.map((m) => ({
      ...m,
      relevance: this.calculateRelevance(m, queryLower),
    }));

    results.sort((a, b) => {
      const aScore = (a as any).relevance * 0.5 + a.importance * 0.3 + this.recencyScore(a) * 0.2;
      const bScore = (b as any).relevance * 0.5 + b.importance * 0.3 + this.recencyScore(b) * 0.2;
      return bScore - aScore;
    });

    return results.slice(0, options.limit ?? 10);
  }

  getRecentMemories(limit: number = 20, type?: MemoryEntry["type"]): MemoryEntry[] {
    let results = [...this.memories];
    if (type) {
      results = results.filter((m) => m.type === type);
    }
    return results.slice(0, limit);
  }

  getImportantMemories(limit: number = 10): MemoryEntry[] {
    return [...this.memories]
      .sort((a, b) => b.importance - a.importance)
      .slice(0, limit);
  }

  summarizeForPrompt(maxLength: number = 1000): string {
    const important = this.getImportantMemories(10);
    const recent = this.getRecentMemories(5);

    const allMemories = [...new Set([...important, ...recent].map((m) => m.id))].map(
      (id) => this.memories.find((m) => m.id === id)!
    );

    let summary = "";
    for (const mem of allMemories) {
      const line = this.formatMemory(mem);
      if (summary.length + line.length < maxLength) {
        summary += line + "\n";
      } else {
        break;
      }
    }

    return summary.trim();
  }

  private calculateRelevance(memory: MemoryEntry, query: string): number {
    if (!query) return 0.5;

    const contentLower = memory.content.toLowerCase();
    let matches = 0;
    const queryWords = query.split(/\s+/).filter((w) => w.length > 1);

    for (const word of queryWords) {
      if (contentLower.includes(word)) {
        matches++;
      }
    }

    const tagMatches = memory.tags?.filter((t) => t.toLowerCase().includes(query)).length ?? 0;

    return Math.min(1, (matches + tagMatches * 0.5) / Math.max(1, queryWords.length));
  }

  private recencyScore(memory: MemoryEntry): number {
    const ageMs = Date.now() - memory.timestamp;
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    return Math.exp(-ageDays * 0.1);
  }

  private formatMemory(memory: MemoryEntry): string {
    const typeLabels: Record<string, string> = {
      conversation: "对话",
      fact: "事实",
      emotion: "情感",
      event: "事件",
      preference: "偏好",
    };
    return `- [${typeLabels[memory.type] ?? memory.type}] ${memory.content}`;
  }

  getAllMemories(): MemoryEntry[] {
    return [...this.memories];
  }

  clear(): void {
    this.memories = [];
  }
}
