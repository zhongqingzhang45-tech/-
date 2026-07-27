import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

const STORAGE_KEY = 'life-memory-store'

export type MemoryType = 'fact' | 'event' | 'preference' | 'important'

export interface Memory {
  id: string
  type: MemoryType
  content: string
  importance: number
  createdAt: number
  lastAccessedAt: number
  accessCount: number
}

interface MemoryState {
  memories: Memory[]
  userName: string | null
  userPreferences: Record<string, string>
}

const defaultState: MemoryState = {
  memories: [],
  userName: null,
  userPreferences: {},
}

function loadState(): MemoryState {
  if (typeof localStorage === 'undefined') return { ...defaultState, memories: [] }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...defaultState, memories: [] }
    const parsed = JSON.parse(raw)
    return { ...defaultState, ...parsed }
  }
  catch {
    return { ...defaultState, memories: [] }
  }
}

function saveState(state: MemoryState) {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }
  catch {
    // ignore
  }
}

function generateId(): string {
  return `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export const useMemoryStore = defineStore('memory', () => {
  const state = ref<MemoryState>(loadState())

  const memories = computed(() => state.value.memories)
  const userName = computed(() => state.value.userName)

  const importantMemories = computed(() =>
    state.value.memories
      .filter(m => m.importance >= 7)
      .sort((a, b) => b.importance - a.importance),
  )

  const recentMemories = computed(() =>
    [...state.value.memories]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 20),
  )

  const memoryCount = computed(() => state.value.memories.length)

  watch(
    state,
    (newState) => {
      saveState(newState)
    },
    { deep: true },
  )

  function addMemory(content: string, type: MemoryType = 'fact', importance = 5): Memory {
    const memory: Memory = {
      id: generateId(),
      type,
      content,
      importance: Math.max(1, Math.min(10, importance)),
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
      accessCount: 0,
    }
    state.value.memories.push(memory)
    return memory
  }

  function removeMemory(id: string) {
    const idx = state.value.memories.findIndex(m => m.id === id)
    if (idx >= 0) {
      state.value.memories.splice(idx, 1)
    }
  }

  function updateMemory(id: string, updates: Partial<Pick<Memory, 'content' | 'type' | 'importance'>>) {
    const memory = state.value.memories.find(m => m.id === id)
    if (memory) {
      if (updates.content !== undefined) memory.content = updates.content
      if (updates.type !== undefined) memory.type = updates.type
      if (updates.importance !== undefined) memory.importance = Math.max(1, Math.min(10, updates.importance))
    }
  }

  function getMemory(id: string): Memory | undefined {
    const memory = state.value.memories.find(m => m.id === id)
    if (memory) {
      memory.lastAccessedAt = Date.now()
      memory.accessCount++
    }
    return memory
  }

  function searchMemories(query: string, limit = 10): Memory[] {
    const lowerQuery = query.toLowerCase()
    const scored = state.value.memories
      .filter(m => m.content.toLowerCase().includes(lowerQuery))
      .map(m => {
        const recencyScore = (Date.now() - m.createdAt) / (1000 * 60 * 60 * 24)
        const score = m.importance * 10 - recencyScore
        return { memory: m, score }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)

    scored.forEach(({ memory }) => {
      memory.lastAccessedAt = Date.now()
      memory.accessCount++
    })

    return scored.map(s => s.memory)
  }

  function getRelevantMemories(_context: string, limit = 5): Memory[] {
    return [...state.value.memories]
      .sort((a, b) => {
        const scoreA = a.importance * 1000 + a.lastAccessedAt / 1000000
        const scoreB = b.importance * 1000 + b.lastAccessedAt / 1000000
        return scoreB - scoreA
      })
      .slice(0, limit)
  }

  function setUserName(name: string) {
    state.value.userName = name
  }

  function setUserPreference(key: string, value: string) {
    state.value.userPreferences[key] = value
  }

  function clearAll() {
    state.value = { ...defaultState, memories: [] }
  }

  return {
    memories,
    userName,
    importantMemories,
    recentMemories,
    memoryCount,
    addMemory,
    removeMemory,
    updateMemory,
    getMemory,
    searchMemories,
    getRelevantMemories,
    setUserName,
    setUserPreference,
    clearAll,
  }
})
