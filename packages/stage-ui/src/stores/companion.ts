import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

const STORAGE_KEY = 'life-companion-state'

interface CompanionState {
  affinity: number
  familiarity: number
  daysTogether: number
  firstMeetDate: string | null
  lastInteractionDate: string | null
  totalChatCount: number
  currentMood: 'happy' | 'neutral' | 'sad' | 'excited' | 'shy'
}

const defaultState: CompanionState = {
  affinity: 0,
  familiarity: 0,
  daysTogether: 1,
  firstMeetDate: null,
  lastInteractionDate: null,
  totalChatCount: 0,
  currentMood: 'neutral',
}

function loadState(): CompanionState {
  if (typeof localStorage === 'undefined') return { ...defaultState }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...defaultState }
    const parsed = JSON.parse(raw)
    return { ...defaultState, ...parsed }
  }
  catch {
    return { ...defaultState }
  }
}

function saveState(state: CompanionState) {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }
  catch {
    // ignore
  }
}

function computeLevel(affinity: number): number {
  const thresholds = [0, 50, 120, 200, 320, 500, 750, 1100, 1600, 2200]
  let level = 1
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (affinity >= thresholds[i]) {
      level = i + 1
      break
    }
  }
  return Math.min(level, 10)
}

function computeNextLevelAffinity(level: number): number {
  const thresholds = [0, 50, 120, 200, 320, 500, 750, 1100, 1600, 2200]
  if (level >= thresholds.length) return thresholds[thresholds.length - 1]
  return thresholds[level]
}

function computeLevelProgress(affinity: number, level: number): number {
  const thresholds = [0, 50, 120, 200, 320, 500, 750, 1100, 1600, 2200]
  if (level >= thresholds.length) return 1
  const currentThreshold = thresholds[level - 1] ?? 0
  const nextThreshold = thresholds[level] ?? 2200
  const range = nextThreshold - currentThreshold
  if (range <= 0) return 1
  const progress = (affinity - currentThreshold) / range
  return Math.max(0, Math.min(1, progress))
}

export const useCompanionStore = defineStore('companion', () => {
  const state = ref<CompanionState>(loadState())

  const level = computed(() => computeLevel(state.value.affinity))
  const nextLevelAffinity = computed(() => computeNextLevelAffinity(level.value))
  const levelProgress = computed(() => computeLevelProgress(state.value.affinity, level.value))

  const relationshipTitle = computed(() => {
    const l = level.value
    if (l >= 10) return '灵魂伴侣'
    if (l >= 8) return '知心恋人'
    if (l >= 6) return '亲密挚友'
    if (l >= 4) return '好朋友'
    if (l >= 2) return '熟悉的人'
    return '初识'
  })

  watch(
    state,
    (newState) => {
      saveState(newState)
    },
    { deep: true },
  )

  function recordChat() {
    const today = new Date().toISOString().split('T')[0]
    const lastDate = state.value.lastInteractionDate

    if (state.value.firstMeetDate === null) {
      state.value.firstMeetDate = today
    }

    if (lastDate !== today) {
      state.value.daysTogether++
      state.value.affinity += 5
    }

    state.value.totalChatCount++
    state.value.affinity += 1
    state.value.familiarity += 0.5
    state.value.lastInteractionDate = today

    updateMood()
  }

  function updateMood() {
    const aff = state.value.affinity
    if (aff > 500) state.value.currentMood = 'excited'
    else if (aff > 200) state.value.currentMood = 'happy'
    else if (aff > 50) state.value.currentMood = 'shy'
    else state.value.currentMood = 'neutral'
  }

  function addAffinity(amount: number) {
    state.value.affinity = Math.max(0, state.value.affinity + amount)
    updateMood()
  }

  function reset() {
    state.value = { ...defaultState }
  }

  return {
    affinity: computed(() => state.value.affinity),
    familiarity: computed(() => state.value.familiarity),
    daysTogether: computed(() => state.value.daysTogether),
    firstMeetDate: computed(() => state.value.firstMeetDate),
    lastInteractionDate: computed(() => state.value.lastInteractionDate),
    totalChatCount: computed(() => state.value.totalChatCount),
    currentMood: computed(() => state.value.currentMood),
    level,
    nextLevelAffinity,
    levelProgress,
    relationshipTitle,
    recordChat,
    addAffinity,
    reset,
  }
})
