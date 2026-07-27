import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

const STORAGE_KEY = 'life-companion-state'

type MoodType = 'happy' | 'neutral' | 'sad' | 'excited' | 'shy' | 'touched' | 'thinking' | 'sleepy'

interface CompanionState {
  affinity: number
  familiarity: number
  intimacy: number
  trust: number
  daysTogether: number
  firstMeetDate: string | null
  lastInteractionDate: string | null
  totalChatCount: number
  chatToday: number
  currentMood: MoodType
  characterName: string
  personality: string | null
  achievements: string[]
}

const defaultState: CompanionState = {
  affinity: 0,
  familiarity: 0,
  intimacy: 0,
  trust: 0,
  daysTogether: 1,
  firstMeetDate: null,
  lastInteractionDate: null,
  totalChatCount: 0,
  chatToday: 0,
  currentMood: 'neutral',
  characterName: '',
  personality: null,
  achievements: [],
}

const LEVEL_THRESHOLDS = [0, 50, 120, 200, 320, 500, 750, 1100, 1600, 2200, 3000]

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
  let level = 1
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (affinity >= LEVEL_THRESHOLDS[i]) {
      level = i + 1
      break
    }
  }
  return Math.min(level, LEVEL_THRESHOLDS.length)
}

function computeNextLevelAffinity(level: number): number {
  if (level >= LEVEL_THRESHOLDS.length) return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]
  return LEVEL_THRESHOLDS[level]
}

function computeLevelProgress(affinity: number, level: number): number {
  if (level >= LEVEL_THRESHOLDS.length) return 1
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] ?? 0
  const nextThreshold = LEVEL_THRESHOLDS[level] ?? 2200
  const range = nextThreshold - currentThreshold
  if (range <= 0) return 1
  const progress = (affinity - currentThreshold) / range
  return Math.max(0, Math.min(1, progress))
}

const MOOD_EMOJI: Record<MoodType, string> = {
  happy: '😊',
  neutral: '😐',
  sad: '😔',
  excited: '🤩',
  shy: '🥺',
  touched: '🥰',
  thinking: '🤔',
  sleepy: '😴',
}

const MOOD_LABEL: Record<MoodType, string> = {
  happy: '开心',
  neutral: '平静',
  sad: '难过',
  excited: '兴奋',
  shy: '害羞',
  touched: '感动',
  thinking: '思考中',
  sleepy: '困了',
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

  const moodEmoji = computed(() => MOOD_EMOJI[state.value.currentMood])
  const moodLabel = computed(() => MOOD_LABEL[state.value.currentMood])

  const displayName = computed(() => state.value.characterName || '她')

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
      state.value.trust += 2
      state.value.chatToday = 0
    }

    state.value.totalChatCount++
    state.value.chatToday++
    state.value.affinity += 1
    state.value.familiarity += 0.5
    state.value.intimacy += 0.3
    state.value.lastInteractionDate = today

    updateMood()
    checkAchievements()
  }

  function updateMood() {
    const aff = state.value.affinity
    if (aff > 800) state.value.currentMood = 'excited'
    else if (aff > 400) state.value.currentMood = 'happy'
    else if (aff > 150) state.value.currentMood = 'shy'
    else state.value.currentMood = 'neutral'
  }

  function addAffinity(amount: number, reason?: string) {
    state.value.affinity = Math.max(0, state.value.affinity + amount)
    if (reason && amount > 0) {
      state.value.intimacy += amount * 0.3
    }
    updateMood()
  }

  function setMood(mood: MoodType) {
    state.value.currentMood = mood
  }

  function setCharacterName(name: string) {
    state.value.characterName = name
  }

  function setPersonality(personality: string) {
    state.value.personality = personality
  }

  function checkAchievements() {
    const achievements = state.value.achievements
    const newAchievements: string[] = []

    if (!achievements.includes('first_chat') && state.value.totalChatCount >= 1) {
      newAchievements.push('first_chat')
    }
    if (!achievements.includes('chat_10') && state.value.totalChatCount >= 10) {
      newAchievements.push('chat_10')
    }
    if (!achievements.includes('chat_100') && state.value.totalChatCount >= 100) {
      newAchievements.push('chat_100')
    }
    if (!achievements.includes('day_7') && state.value.daysTogether >= 7) {
      newAchievements.push('day_7')
    }
    if (!achievements.includes('day_30') && state.value.daysTogether >= 30) {
      newAchievements.push('day_30')
    }
    if (!achievements.includes('level_5') && level.value >= 5) {
      newAchievements.push('level_5')
    }
    if (!achievements.includes('level_10') && level.value >= 10) {
      newAchievements.push('level_10')
    }

    if (newAchievements.length > 0) {
      state.value.achievements.push(...newAchievements)
    }
  }

  function reset() {
    state.value = { ...defaultState }
  }

  return {
    affinity: computed(() => state.value.affinity),
    familiarity: computed(() => state.value.familiarity),
    intimacy: computed(() => state.value.intimacy),
    trust: computed(() => state.value.trust),
    daysTogether: computed(() => state.value.daysTogether),
    firstMeetDate: computed(() => state.value.firstMeetDate),
    lastInteractionDate: computed(() => state.value.lastInteractionDate),
    totalChatCount: computed(() => state.value.totalChatCount),
    chatToday: computed(() => state.value.chatToday),
    currentMood: computed(() => state.value.currentMood),
    moodEmoji,
    moodLabel,
    displayName,
    characterName: computed(() => state.value.characterName),
    personality: computed(() => state.value.personality),
    achievements: computed(() => state.value.achievements),
    level,
    nextLevelAffinity,
    levelProgress,
    relationshipTitle,
    recordChat,
    addAffinity,
    setMood,
    setCharacterName,
    setPersonality,
    reset,
  }
})
